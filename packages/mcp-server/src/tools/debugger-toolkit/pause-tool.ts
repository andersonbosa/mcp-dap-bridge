import { BaseTool } from "../base-tool"
import { logger } from "../../utils/logger"
import { WebSocketBridge } from "../../server/dependencies/websocket-bridge"

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
      
      const response = await this.wsBridge.sendDapRequest("pause", { threadId })

      if (response.body.error) {
        throw new Error(`Error pausing execution: ${response.body.error}`)
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
