import { BaseTool } from "../base-tool"
import { logger } from "../../utils/logger"
import { WebSocketBridge } from "../../server/dependencies/websocket-bridge"

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

  constructor(private readonly wsBridge: WebSocketBridge) {
    super()
  }

  async execute(args: ContinueToolInput): Promise<any> {
    try {
      const threadId = args.threadId || 1
      logger.info(`[DebuggerToolkit] Continuing execution for thread ${threadId}...`)
      
      const response = await this.wsBridge.sendDapRequest("continue", { threadId })

      if (response.body.error) {
        throw new Error(`Error continuing execution: ${response.body.error}`)
      }

      const allThreadsContinued = response.body.allThreadsContinued || false
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
      }
    }
  }
}
