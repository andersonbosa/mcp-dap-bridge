import { WebSocketManager } from "../../server/dependencies/websocket-manager"
import { ToolResult } from "../../types"
import { logger } from "../../utils/logger"
import { BaseTool } from "../base-tool"
import { withIDE } from "../decorators/with-ide.decorator"

export class ListBreakpointsTool extends BaseTool {
  readonly name = "listBreakpoints"
  readonly description = "List all active breakpoints in the IDE"
  readonly inputSchema = {
    type: "object",
    properties: {},
    required: [],
  }

  constructor(public readonly wsBridge: WebSocketManager) {
    super()
  }

  @withIDE
  async execute(): Promise<ToolResult> {
    try {
      logger.info(`[IdeToolkit] Listing active breakpoints...`)

      const response = await this.wsBridge.sendIdeCommand("breakpoints/list", {})

      if (!response.success) {
        throw new Error(`Error listing breakpoints: ${response.error}`)
      }

      const breakpointsByFile = response.data?.breakpointsByFile
      if (!breakpointsByFile || Object.keys(breakpointsByFile).length === 0) {
        return {
          content: [{ type: "text", text: "No active breakpoints found." }],
        }
      }

      let totalBreakpoints = 0
      const formattedBreakpoints = Object.entries(breakpointsByFile)
        .map(([file, breakpoints]) => {
          const bpArray = breakpoints as any[]
          totalBreakpoints += bpArray.length
          const bpList = bpArray.map(bp => `  • Line ${bp.line}: ${bp.verified ? 'Verified' : 'Unverified'}`).join('\n')
          return `File: ${file}\n${bpList}`
        })
        .join('\n\n')

      const resultText = `Active Breakpoints (${totalBreakpoints}):\n\n${formattedBreakpoints}`

      return {
        content: [{ type: "text", text: resultText }],
      }
    } catch (error: any) {
      logger.error(`[IdeToolkit] Error executing listBreakpoints:`, error)
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      }
    }
  }
}
