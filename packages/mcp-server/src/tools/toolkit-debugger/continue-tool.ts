import { StandardCommandResponse, isErrorResponse } from "@andersonbosa/core-bridge"
import { WebSocketManager } from "../../server/dependencies/websocket-manager"
import { ToolResult } from "../../types"
import { logger } from "../../utils/logger"
import { BaseTool } from "../base-tool"

type ContinueToolInput = {
  threadId?: number
}

export class ContinueTool extends BaseTool {
  readonly name = "continue"
  readonly description = "Continue program execution from current breakpoint"
  readonly inputSchema = {
    type: "object",
    properties: {
      threadId: {
        type: "number",
        description: "Thread ID to continue (optional, defaults to 1)",
      },
    },
    required: [],
  }

  constructor(private readonly wsBridge: WebSocketManager) {
    super()
  }

  async execute(args: ContinueToolInput): Promise<ToolResult> {
    try {
      const threadId = args.threadId || 1
      logger.info(`[DebuggerToolkit] Continuing execution for thread ${threadId}...`)
      
      const response: StandardCommandResponse<any> = await this.wsBridge.sendDapRequest("continue", { threadId })

      if (isErrorResponse(response)) {
        throw new Error(`Error continuing execution: ${response.error}`)
      }

      const allThreadsContinued = response.data?.allThreadsContinued || false
      const resultText = allThreadsContinued 
        ? "Execution continued for all threads"
        : `Execution continued for thread ${threadId}`

      return {
        content: [{ type: "text", text: resultText }],
      }
    } catch (error: any) {
      logger.error(`[DebuggerToolkit] Error executing continue:`, error)
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      }
    }
  }
}
