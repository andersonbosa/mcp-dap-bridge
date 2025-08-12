import { BaseTool } from "../base-tool"
import { logger } from "../../utils/logger"
import { WebSocketBridge } from "../../server/dependencies/websocket-bridge"

type StepOutToolInput = {
  threadId?: number
  granularity?: string
}

export class StepOutTool extends BaseTool {
  readonly name = "stepOut"
  readonly description = "Step out of current function"
  readonly inputSchema = {
    type: "object",
    properties: {
      threadId: {
        type: "number",
        description: "Thread ID to step out (optional, defaults to 1)",
      },
      granularity: {
        type: "string",
        description: "Step granularity: 'statement', 'line', or 'instruction'",
        enum: ["statement", "line", "instruction"],
      },
    },
    required: [],
  }

  constructor(private readonly wsBridge: WebSocketBridge) {
    super()
  }

  async execute(args: StepOutToolInput): Promise<any> {
    try {
      const threadId = args.threadId || 1
      const granularity = args.granularity || "line"
      
      logger.info(`[DebuggerToolkit] Stepping out in thread ${threadId} with granularity ${granularity}...`)
      
      const response = await this.wsBridge.sendDapRequest("stepOut", { 
        threadId,
        granularity 
      })

      if (response.body.error) {
        throw new Error(`Error stepping out: ${response.body.error}`)
      }

      return {
        content: [{ type: "text", text: `Stepped out of current function in thread ${threadId}` }],
      }
    } catch (error: any) {
      logger.error(`[DebuggerToolkit] Error executing stepOut:`, error)
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
      }
    }
  }
}
