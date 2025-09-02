import { WebSocketManager } from "../../server/dependencies/websocket-manager"
import { ToolResult } from "../../types"
import { logger } from "@andersonbosa/mcp-debug-ex-core"
import { BaseTool } from "../base-tool"
import { withIDE } from "../decorators/with-ide.decorator"

type RemoveBreakpointsToolInput = {
  file?: string
  lines?: number[]
  removeAll?: boolean
}

export class RemoveBreakpointsTool extends BaseTool {
  readonly name = "removeBreakpoints"
  readonly description = "Remove specific breakpoints or all breakpoints."
  readonly inputSchema = {
    type: "object",
    properties: {
      file: {
        type: "string",
        description: "The workspace-relative path to the file to remove breakpoints from. Required unless 'removeAll' is true.",
      },
      lines: {
        type: "array",
        description: "An array of specific line numbers to remove breakpoints from. If not provided, all breakpoints in the specified file are removed.",
        items: {
          type: "number",
        },
      },
      removeAll: {
        type: "boolean",
        description: "Set to true to remove all breakpoints from all files.",
        default: false,
      },
    },
  }

  constructor(public readonly wsBridge: WebSocketManager) {
    super()
  }

  @withIDE
  async execute(args: RemoveBreakpointsToolInput): Promise<ToolResult> {
    try {
      if (!args.removeAll && !args.file) {
        throw new Error("A 'file' must be provided unless 'removeAll' is set to true.")
      }

      logger.info(`[IdeToolkit] Requesting to remove breakpoints...`, args)
      const response = await this.wsBridge.sendIDECommand("breakpoints/remove", args)

      if (!response.success) {
        throw new Error(`Error removing breakpoints: ${response.error}`)
      }

      const { removedCount } = response.data;
      return {
        content: [{ type: "text", text: `Success! ${removedCount} breakpoint(s) were removed.` }],
      }
    } catch (error: any) {
      logger.error(`[IdeToolkit] Error executing removeBreakpoints:`, error)
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      }
    }
  }
}
