import { WebSocketManager } from "../../server/dependencies/websocket-manager"
import { ToolResult } from "../../types"
import { logger } from "@andersonbosa/core-bridge"
import { BaseTool } from "../base-tool"
import { withIDE } from "../decorators/with-ide.decorator"

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

  constructor(public readonly wsBridge: WebSocketManager) {
    super()
  }

  @withIDE
  async execute(args: { locations: { file: string; line: number }[] }): Promise<ToolResult> {
    try {
      if (!args.locations || args.locations.length === 0) {
        throw new Error("The 'setBreakpoints' action requires at least one location.")
      }

      logger.info("[IdeToolkit] Requesting to set breakpoints...")
      const response = await this.wsBridge.sendIDECommand('breakpoints/set', { locations: args.locations })

      if (!response.success) {
        throw new Error(`Error setting breakpoints: ${response.error}`)
      }

      const { totalSet, fileCount } = response.data;
      const resultText = `Success! ${totalSet} of ${args.locations.length} breakpoints were set across ${fileCount} file(s).`

      return {
        content: [{ type: "text", text: resultText }],
      }
    } catch (error: any) {
      logger.error(`[IdeToolkit] Error executing setBreakpoints:`, error)
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      }
    }
  }
}