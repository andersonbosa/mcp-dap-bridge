import { StandardCommandResponse, isErrorResponse } from "@andersonbosa/core-bridge"
import { WebSocketManager } from "../../server/dependencies/websocket-manager"
import { ToolResult } from "../../types"
import { logger } from "@andersonbosa/core-bridge"
import { BaseTool } from "../base-tool"

export class GetStackTraceTool extends BaseTool {
  readonly name = "getStackTrace";
  readonly description = "Gets the current call stack (stack trace) from the active debug session.";
  readonly inputSchema = {
    type: "object",
    properties: {},
    required: [],
  };

  constructor(private readonly wsBridge: WebSocketManager) {
    super()
  }

  async execute(): Promise<ToolResult> {
    try {
      logger.info("[DebuggerToolkit] Requesting stack trace...")
      const response: StandardCommandResponse<any> = await this.wsBridge.sendDapRequest("stackTrace", { threadId: 1 })

      if (isErrorResponse(response)) {
        throw new Error(`Error getting stack trace: ${response.error}`)
      }

      const stackFrames = response.data?.stackFrames
      if (!stackFrames || stackFrames.length === 0) {
        return {
          content: [{ type: "text", text: "The call stack is empty or the execution is not paused." }],
        }
      }

      const frames = stackFrames
        .map((frame: any) => `- Function: ${frame.name} | File: ${frame.source?.path} | Line: ${frame.line}`)
        .join("\n")

      return {
        content: [{ type: "text", text: `Current Call Stack:\n${frames}` }],
      }
    } catch (error: any) {
      logger.error(`[DebuggerToolkit] Error executing getStackTrace:`, error)
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      }
    }
  }
}
