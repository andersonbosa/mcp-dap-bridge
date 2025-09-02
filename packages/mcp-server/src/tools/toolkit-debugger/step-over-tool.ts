import { StandardCommandResponse, isErrorResponse } from "@andersonbosa/mcp-debug-ex-core"
import { WebSocketManager } from "../../server/dependencies/websocket-manager"
import { ToolResult } from "../../types"
import { logger } from "@andersonbosa/mcp-debug-ex-core"
import { BaseTool } from "../base-tool"

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

  constructor(private readonly wsBridge: WebSocketManager) {
    super()
  }

  async execute(args: StepOverToolInput): Promise<ToolResult> {
    try {
      const threadId = args.threadId || 1
      const granularity = args.granularity || "line"
      
      logger.info(`[DebuggerToolkit] Stepping over in thread ${threadId} with granularity ${granularity}...`)
      
      const response: StandardCommandResponse<any> = await this.wsBridge.sendDapRequest("next", { 
        threadId,
        granularity 
      })

      if (isErrorResponse(response)) {
        throw new Error(`Error stepping over: ${response.error}`)
      }

      return {
        content: [{ type: "text", text: `Stepped over to next ${granularity} in thread ${threadId}` }],
      }
    } catch (error: any) {
      logger.error(`[DebuggerToolkit] Error executing stepOver:`, error)
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      }
    }
  }
}
