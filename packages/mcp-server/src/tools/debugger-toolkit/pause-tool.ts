import { BaseTool } from "../base-tool"
import { logger } from "../../utils/logger"
import { WebSocketBridge } from "../../server/dependencies/websocket-bridge"
import { StandardCommandResponse, isErrorResponse } from "@andersonbosa/core-bridge"

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

  constructor(private readonly wsBridge: WebSocketBridge) {
    super()
  }

  async execute(args: PauseToolInput): Promise<any> {
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
      }
    }
  }
}
