import { BaseTool } from "../base-tool"
import { logger } from "../../utils/logger"
import { WebSocketBridge } from "../../server/dependencies/websocket-bridge"
import { ToolResponse } from "../../types"
import { StandardCommandResponse, IsDebuggerActiveResponse, isErrorResponse } from "@andersonbosa/core-bridge"

export class IsDebuggerActiveTool extends BaseTool {
  readonly name = "isDebuggerActive";
  readonly description = "Checks if there is an active debug session in the editor.";
  readonly inputSchema = {
    type: "object",
    properties: {},
    required: [],
  };

  constructor(private readonly wsBridge: WebSocketBridge) {
    super()
  }

  async execute(): Promise<ToolResponse> {
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
      }
    }
  }
}

