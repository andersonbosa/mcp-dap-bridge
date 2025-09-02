import { StandardCommandResponse, isErrorResponse } from "@andersonbosa/mcp-debug-ex-core"
import { WebSocketManager } from "../../server/dependencies/websocket-manager"
import { ToolResult } from "../../types"
import { logger } from "@andersonbosa/mcp-debug-ex-core"
import { BaseTool } from "../base-tool"

type PauseToolInput = {
  threadId?: number
}

export class PauseTool extends BaseTool {
  readonly name = "pause"
  readonly description = "Pause program execution"
  readonly inputSchema = {
    type: "object",
    properties: {
      threadId: {
        type: "number",
        description: "Thread ID to pause (optional, defaults to 1)",
      },
    },
    required: [],
  }

  constructor(private readonly wsBridge: WebSocketManager) {
    super()
  }

  async execute(args: PauseToolInput): Promise<ToolResult> {
    try {
      const threadId = args.threadId || 1
      logger.info(`[DebuggerToolkit] Pausing execution for thread ${threadId}...`)
      
      const response: StandardCommandResponse<any> = await this.wsBridge.sendDapRequest("pause", { threadId })

      if (isErrorResponse(response)) {
        throw new Error(`Error pausing execution: ${response.error}`)
      }

      return {
        content: [{ type: "text", text: `Execution paused for thread ${threadId}` }],
      }
    } catch (error: any) {
      logger.error(`[DebuggerToolkit] Error executing pause:`, error)
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      }
    }
  }
}
