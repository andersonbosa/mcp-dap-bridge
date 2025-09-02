import { StandardCommandResponse, isErrorResponse } from "@andersonbosa/mcp-debugx-core"
import { WebSocketManager } from "../../server/dependencies/websocket-manager"
import { ToolResult } from "../../types"
import { logger } from "@andersonbosa/mcp-debugx-core"
import { BaseTool } from "../base-tool"

type StepIntoToolInput = {
  threadId?: number
  granularity?: string
  targetId?: number
}

export class StepIntoTool extends BaseTool {
  readonly name = "stepInto"
  readonly description = "Step into function calls"
  readonly inputSchema = {
    type: "object",
    properties: {
      threadId: {
        type: "number",
        description: "Thread ID to step into (optional, defaults to 1)",
      },
      granularity: {
        type: "string",
        description: "Step granularity: 'statement', 'line', or 'instruction'",
        enum: ["statement", "line", "instruction"],
      },
      targetId: {
        type: "number",
        description: "Optional target ID for step into specific function",
      },
    },
    required: [],
  }

  constructor(private readonly wsBridge: WebSocketManager) {
    super()
  }

  async execute(args: StepIntoToolInput): Promise<ToolResult> {
    try {
      const threadId = args.threadId || 1
      const granularity = args.granularity || "line"
      
      logger.info(`[DebuggerToolkit] Stepping into in thread ${threadId} with granularity ${granularity}...`)
      
      const requestParams: any = { threadId, granularity }
      if (args.targetId) {
        requestParams.targetId = args.targetId
      }
      
      const response: StandardCommandResponse<any> = await this.wsBridge.sendDapRequest("stepIn", requestParams)

      if (isErrorResponse(response)) {
        throw new Error(`Error stepping into: ${response.error}`)
      }

      const targetText = args.targetId ? ` (target: ${args.targetId})` : ""
      return {
        content: [{ type: "text", text: `Stepped into function in thread ${threadId}${targetText}` }],
      }
    } catch (error: any) {
      logger.error(`[DebuggerToolkit] Error executing stepInto:`, error)
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      }
    }
  }
}
