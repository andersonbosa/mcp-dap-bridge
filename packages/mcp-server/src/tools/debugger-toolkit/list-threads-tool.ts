import { BaseTool } from "../base-tool"
import { logger } from "../../utils/logger"
import { WebSocketBridge } from "../../server/dependencies/websocket-bridge"

export class ListThreadsTool extends BaseTool {
  readonly name = "listThreads"
  readonly description = "List all active threads in debug session"
  readonly inputSchema = {
    type: "object",
    properties: {},
    required: [],
  }

  constructor(private readonly wsBridge: WebSocketBridge) {
    super()
  }

  async execute(): Promise<any> {
    try {
      logger.info(`[DebuggerToolkit] Listing active threads...`)

      const response = await this.wsBridge.sendDapRequest("threads", {})

      if (response.body.error) {
        throw new Error(`Error listing threads: ${response.body.error}`)
      }

      const threads = response.body.threads
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
      }
    }
  }
}
