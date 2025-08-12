import { BaseTool } from "../base-tool"
import { logger } from "../../utils/logger"
import { WebSocketBridge } from "../../server/dependencies/websocket-bridge"

type StepOverToolInput = {
  threadId?: number
  granularity?: string
}

export class StepOverTool extends BaseTool {
  readonly name = "stepOver"
  readonly description = "Execute next line without entering functions"
  readonly inputSchema = {
    type: "object",
    properties: {
      threadId: {
        type: "number",
        description: "Thread ID to step over (optional, defaults to 1)",
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

  async execute(args: StepOverToolInput): Promise<any> {
    try {
      const threadId = args.threadId || 1
      const granularity = args.granularity || "line"
      
      logger.info(`[DebuggerToolkit] Stepping over in thread ${threadId} with granularity ${granularity}...`)
      
      const response = await this.wsBridge.sendDapRequest("next", { 
        threadId,
        granularity 
      })

      if (response.body.error) {
        throw new Error(`Error stepping over: ${response.body.error}`)
      }

      return {
        content: [{ type: "text", text: `Stepped over to next ${granularity} in thread ${threadId}` }],
      }
    } catch (error: any) {
      logger.error(`[DebuggerToolkit] Error executing stepOver:`, error)
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
      }
    }
  }
}
