import { BaseTool } from "../base-tool"
import { logger } from "../../utils/logger"
import { ToolResult } from "../../types"
import { StandardCommandResponse, IsDebuggerActiveResponse, isErrorResponse } from "@andersonbosa/core-bridge"
import { withIDE } from "../decorators/with-ide.decorator"
import { WebSocketManager } from "../../server/dependencies/websocket-manager"

export class IsDebuggerActiveTool extends BaseTool {
  readonly name = "isDebuggerActive";
  readonly description = "Checks if there is an active debug session in the editor.";
  readonly inputSchema = {
    type: "object",
    properties: {},
    required: [],
  };

  constructor(public readonly wsBridge: WebSocketManager) {
    super()
  }

  @withIDE
  async execute(): Promise<ToolResult> {
    try {
      logger.info("[DebuggerToolkit] Requesting to check debugger status...")
      const response: StandardCommandResponse<IsDebuggerActiveResponse> = await this.wsBridge.sendDapRequest('isDebuggerActive', {})

      if (isErrorResponse(response)) {
        throw new Error(`Error checking debugger status: ${response.error}`)
      }

      const isActive = response.data?.isActive ?? false
      const resultText = isActive
        ? "Yes, a debug session is active and ready."
        : "No, there is no active debug session."

      return {
        content: [{ type: "text", text: resultText }],
      }
    } catch (error: any) {
      logger.error(`[DebuggerToolkit] Error executing isDebuggerActive:`, error)
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      }
    }
  }
}

