import { StandardCommandResponse, isErrorResponse } from "@andersonbosa/mcp-debug-ex-core"
import { WebSocketManager } from "../../server/dependencies/websocket-manager"
import { ToolResult } from "../../types"
import { logger } from "@andersonbosa/mcp-debug-ex-core"
import { BaseTool } from "../base-tool"

export class ListThreadsTool extends BaseTool {
  readonly name = "listThreads"
  readonly description = "List all active threads in debug session"
  readonly inputSchema = {
    type: "object",
    properties: {},
    required: [],
  }

  constructor(private readonly wsBridge: WebSocketManager) {
    super()
  }

  async execute(): Promise<ToolResult> {
    try {
      logger.info(`[DebuggerToolkit] Listing active threads...`)

      const response: StandardCommandResponse<any> = await this.wsBridge.sendDapRequest("threads", {})

      if (isErrorResponse(response)) {
        throw new Error(`Error listing threads: ${response.error}`)
      }

      const threads = response.data?.threads
      if (!threads || threads.length === 0) {
        return {
          content: [{ type: "text", text: "No active threads found in debug session" }],
        }
      }

      const threadList = threads.map((thread: any) => {
        const status = thread.status || "unknown"
        return `• Thread ${thread.id}: ${thread.name}\n  Status: ${status}`
      }).join("\n\n")

      const resultText = `Active Threads (${threads.length}):\n\n${threadList}`

      return {
        content: [{ type: "text", text: resultText }],
      }
    } catch (error: any) {
      logger.error(`[DebuggerToolkit] Error executing listThreads:`, error)
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      }
    }
  }
}
