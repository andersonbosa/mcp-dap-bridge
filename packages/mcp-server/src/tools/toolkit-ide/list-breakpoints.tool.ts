import { StandardCommandResponse, isErrorResponse } from "@andersonbosa/core-bridge"
import { WebSocketManager } from "../../server/dependencies/websocket-manager"
import { ToolResult } from "../../types"
import { logger } from "../../utils/logger"
import { BaseTool } from "../base-tool"
import { withDAPSession } from "../decorators/with-dap-session.decorator"

export class ListBreakpointsTool extends BaseTool {
  readonly name = "listBreakpoints"
  readonly description = "List all active breakpoints in the debug session"
  readonly inputSchema = {
    type: "object",
    properties: {},
    required: [],
  }

  constructor(public readonly wsBridge: WebSocketManager) {
    super()
  }

  @withDAPSession
  async execute(): Promise<ToolResult> {
    try {
      logger.info(`[DebuggerToolkit] Listing active breakpoints...`)

      const response: StandardCommandResponse<any> = await this.wsBridge.sendDapRequest("listBreakpoints", {})

      if (isErrorResponse(response)) {
        throw new Error(`Error listing breakpoints: ${response.error}`)
      }

      const breakpointsByFile = response.data?.breakpoints
      if (!breakpointsByFile || Object.keys(breakpointsByFile).length === 0) {
        return {
          content: [{ type: "text", text: "No active breakpoints found in debug session" }],
        }
      }

      console.log('breakpointsByFile', breakpointsByFile)

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
      logger.error(`[DebuggerToolkit] Error executing listBreakpoints:`, error)
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      }
    }
  }
}
