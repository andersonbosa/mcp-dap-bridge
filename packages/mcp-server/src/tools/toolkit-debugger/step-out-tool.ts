import { StandardCommandResponse, isErrorResponse } from "@andersonbosa/core-bridge"
import { ToolResult } from "../../types"
import { WebSocketManager } from "../../server/dependencies/websocket-manager"
import { logger } from "../../utils/logger"
import { BaseTool } from "../base-tool"

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

  constructor(private readonly wsBridge: WebSocketManager) {
    super()
  }

  async execute(args: StepOutToolInput): Promise<ToolResult> {
    try {
      const threadId = args.threadId || 1
      const granularity = args.granularity || "line"
      
      logger.info(`[DebuggerToolkit] Stepping out in thread ${threadId} with granularity ${granularity}...`)
      
      const response: StandardCommandResponse<any> = await this.wsBridge.sendDapRequest("stepOut", { 
        threadId,
        granularity 
      })

      if (isErrorResponse(response)) {
        throw new Error(`Error stepping out: ${response.error}`)
      }

      return {
        content: [{ type: "text", text: `Stepped out of current function in thread ${threadId}` }],
      }
    } catch (error: any) {
      logger.error(`[DebuggerToolkit] Error executing stepOut:`, error)
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      }
    }
  }
}
