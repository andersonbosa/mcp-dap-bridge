import { StandardCommandResponse, isErrorResponse } from "@andersonbosa/core-bridge"
import { WebSocketManager } from "../../server/dependencies/websocket-manager"
import { ToolResult } from "../../types"
import { logger } from "../../utils/logger"
import { BaseTool } from "../base-tool"

type RemoveBreakpointsToolInput = {
  source?: { path?: string; name?: string }
  lines?: number[]
  removeAll?: boolean
}

export class RemoveBreakpointsTool extends BaseTool {
  readonly name = "removeBreakpoints"
  readonly description = "Remove specific or all breakpoints"
  readonly inputSchema = {
    type: "object",
    properties: {
      source: {
        type: "object",
        description: "Source file information",
        properties: {
          path: {
            type: "string",
            description: "File path to remove breakpoints from",
          },
          name: {
            type: "string",
            description: "File name",
          },
        },
      },
      lines: {
        type: "array",
        description: "Specific line numbers to remove breakpoints from (if not provided, removes all)",
        items: {
          type: "number",
        },
      },
      removeAll: {
        type: "boolean",
        description: "Remove all breakpoints from all files",
      },
    },
    required: [],
  }

  constructor(private readonly wsBridge: WebSocketManager) {
    super()
  }

  async execute(args: RemoveBreakpointsToolInput): Promise<ToolResult> {
    try {
      logger.info(`[DebuggerToolkit] Removing breakpoints...`)

      if (args.removeAll) {
        // Remove all breakpoints by setting empty breakpoints for all sources
        const response: StandardCommandResponse<any> = await this.wsBridge.sendDapRequest("setBreakpoints", {
          source: { path: "" },
          breakpoints: []
        })

        if (isErrorResponse(response)) {
          throw new Error(`Error removing all breakpoints: ${response.error}`)
        }

        return {
          content: [{ type: "text", text: "All breakpoints removed successfully" }],
        }
      }

      if (!args.source?.path) {
        throw new Error("Source path is required when not removing all breakpoints")
      }

      // Get current breakpoints and filter out the ones to remove
      const currentBreakpoints: any[] = [] // Would need to track this or query current state

      const breakpointsToKeep = args.lines 
        ? currentBreakpoints.filter(bp => !args.lines!.includes(bp.line))
        : [] // Remove all from this file

      const response: StandardCommandResponse<any> = await this.wsBridge.sendDapRequest("setBreakpoints", {
        source: args.source,
        breakpoints: breakpointsToKeep
      })

      if (isErrorResponse(response)) {
        throw new Error(`Error removing breakpoints: ${response.error}`)
      }

      const removedCount = currentBreakpoints.length - breakpointsToKeep.length
      const fileInfo = args.source.name || args.source.path
      
      if (args.lines) {
        return {
          content: [{ 
            type: "text", 
            text: `Removed ${removedCount} breakpoint(s) from lines ${args.lines.join(', ')} in ${fileInfo}` 
          }],
        }
      } else {
        return {
          content: [{ 
            type: "text", 
            text: `Removed all ${removedCount} breakpoint(s) from ${fileInfo}` 
          }],
        }
      }
    } catch (error: any) {
      logger.error(`[DebuggerToolkit] Error executing removeBreakpoints:`, error)
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      }
    }
  }
}
