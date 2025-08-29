import { isErrorResponse, SetBreakpointsInFilesResponse, StandardCommandResponse } from "@andersonbosa/core-bridge"
import { WebSocketManager } from "../../server/dependencies/websocket-manager"
import { ToolResult } from "../../types"
import { logger } from "../../utils/logger"
import { BaseTool } from "../base-tool"

export class SetBreakpointsTool extends BaseTool {
  readonly name = "setBreakpoints";
  readonly description = "Sets one or more breakpoints in the specified files.";
  readonly inputSchema = {
    type: "object",
    properties: {
      locations: {
        type: "array",
        description: "A list of locations (file and line) to set breakpoints.",
        items: {
          type: "object",
          properties: {
            file: {
              type: "string",
              description: "The workspace-relative path to the file.",
            },
            line: {
              type: "number",
              description: "The line number (1-based) for the breakpoint.",
            },
          },
          required: ["file", "line"],
        },
      },
    },
    required: ["locations"],
  };

  constructor(private readonly wsBridge: WebSocketManager) {
    super()
  }

  async execute(args: { locations: { file: string; line: number }[] }): Promise<ToolResult> {
    try {
      if (!args.locations || args.locations.length === 0) {
        throw new Error("The 'setBreakpoints' action requires at least one location.")
      }

      logger.info("[DebuggerToolkit] Requesting to set breakpoints...")
      const response: StandardCommandResponse<SetBreakpointsInFilesResponse> = await this.wsBridge.sendDapRequest('setBreakpointsInFiles', { locations: args.locations })

      if (isErrorResponse(response)) {
        throw new Error(`Error setting breakpoints: ${response.error}`)
      }

      const results = response.data?.results
      if (!results) {
        throw new Error("Invalid response from the extension when setting breakpoints.")
      }

      const totalSet = results.reduce((sum: number, result: any) => {
        return sum + (result?.breakpoints?.length || 0)
      }, 0)

      const fileCount = results.length

      const resultText = `Success! ${totalSet} of ${args.locations.length} breakpoints were set across ${fileCount} file(s).`

      return {
        content: [{ type: "text", text: resultText }],
      }
    } catch (error: any) {
      logger.error(`[DebuggerToolkit] Error executing setBreakpoints:`, error)
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      }
    }
  }
}