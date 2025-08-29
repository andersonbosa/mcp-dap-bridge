import { StandardCommandResponse, isErrorResponse } from "@andersonbosa/core-bridge"
import { WebSocketManager } from "../../server/dependencies/websocket-manager"
import { ToolResult } from "../../types"
import { logger } from "../../utils/logger"
import { BaseTool } from "../base-tool"

type GetThreadInfoToolInput = {
  threadId: number
}

export class GetThreadInfoTool extends BaseTool {
  readonly name = "getThreadInfo"
  readonly description = "Get detailed information about specific thread"
  readonly inputSchema = {
    type: "object",
    properties: {
      threadId: {
        type: "number",
        description: "ID of the thread to get information about",
      },
    },
    required: ["threadId"],
  }

  constructor(private readonly wsBridge: WebSocketManager) {
    super()
  }

  async execute(args: GetThreadInfoToolInput): Promise<ToolResult> {
    try {
      logger.info(`[DebuggerToolkit] Getting information for thread ${args.threadId}...`)
      
      // First get all threads to find the specific one
      const threadsResponse: StandardCommandResponse<any> = await this.wsBridge.sendDapRequest("threads", {})

      if (isErrorResponse(threadsResponse)) {
        throw new Error(`Error getting threads: ${threadsResponse.error}`)
      }

      const threads = threadsResponse.data?.threads
      const targetThread = threads?.find((t: any) => t.id === args.threadId)

      if (!targetThread) {
        return {
          content: [{
            type: "text",
            text: `Thread ${args.threadId} not found. Available threads: ${threads?.map((t: any) => `${t.id} (${t.name})`).join(', ') || 'none'}`
          }],
        }
      }

      // Get stack trace for the thread
      let stackInfo = ""
      try {
        const stackResponse: StandardCommandResponse<any> = await this.wsBridge.sendDapRequest("stackTrace", { 
          threadId: args.threadId 
        })

        if (!isErrorResponse(stackResponse) && stackResponse.data?.stackFrames) {
          const frames = stackResponse.data.stackFrames
          if (frames.length > 0) {
            stackInfo = `\n\nStack Trace (${frames.length} frames):\n` +
                       frames.slice(0, 5).map((frame: any, index: number) => 
                         `  ${index}: ${frame.name} (${frame.source?.name || 'unknown'}:${frame.line})`
                       ).join('\n')
            
            if (frames.length > 5) {
              stackInfo += `\n  ... and ${frames.length - 5} more frames`
            }
          } else {
            stackInfo = "\n\nStack Trace: Empty (thread not paused or no frames available)"
          }
        }
      } catch (stackError) {
        stackInfo = "\n\nStack Trace: Unable to retrieve (thread may not be paused)"
      }

      const resultText = `Thread Information:\n\n` +
                        `ID: ${targetThread.id}\n` +
                        `Name: ${targetThread.name}\n` +
                        `Status: ${targetThread.status || 'unknown'}\n` +
                        `Running: ${targetThread.running !== false ? 'Yes' : 'No'}` +
                        stackInfo

      return {
        content: [{ type: "text", text: resultText }],
      }
    } catch (error: any) {
      logger.error(`[DebuggerToolkit] Error executing getThreadInfo:`, error)
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      }
    }
  }
}
