import { BaseTool } from "./base-tool"
import { logger } from "../utils/logger"
import { WebSocketBridge } from "../server/dependencies/websocket-bridge"

export class DebuggerTool extends BaseTool {
  readonly name = "debugger";
  readonly description = "A tool for inspecting and interacting with the active debug session in VSCode/Cursor.";
  readonly inputSchema = {
    type: "object",
    properties: {
      action: {
        type: "string",
        description: "The debugging action to perform.",
        enum: ["getStackTrace", "listLocalVariables", "setBreakpoints", "isDebuggerActive"],
      },
      locations: {
        type: "array",
        description: "A list of locations, used by the 'setBreakpoints' action.",
        items: {
          type: "object",
          properties: {
            file: {
              type: "string",
              description: "The absolute or relative path to the file.",
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
    required: ["action"],
  };

  constructor(private readonly ipcBridge: WebSocketBridge) {
    super()
  }

  async execute(args: { action: string; locations?: { file: string; line: number }[] }): Promise<any> {
    try {
      let result: string
      switch (args.action) {
        case "getStackTrace":
          result = await this.getStackTrace()
          break
        case "isDebuggerActive":
          result = await this.isDebuggerActive()
          break
        case "setBreakpoints":
          if (!args.locations || args.locations.length === 0) {
            result = "Error: The 'setBreakpoints' action requires at least one location (file and line)."
          } else {
            result = await this.setBreakpoints(args.locations)
          }
          break
        default:
          result = `Error: Action "${args.action}" not supported.`
          break
      }
      return {
        content: [{ type: "text", text: result }],
      }
    } catch (error: any) {
      logger.error(`[MCP Tool] Error executing action '${args.action}':`, error)
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error.message}`,
          },
        ],
      }
    }
  }

  private async getStackTrace(): Promise<string> {
    logger.info("[MCP Tool] Requesting stack trace...")

    // Node.js typically uses threadId 1
    const response = await this.ipcBridge.sendDapRequest("stackTrace", { threadId: 1 })

    // Errors are now in the `body` property
    if (response.body.error) {
      return `Error getting stack trace: ${response.body.error}`
    }

    const stackFrames = response.body.stackFrames
    if (!stackFrames || stackFrames.length === 0) {
      return "The call stack is empty or the execution is not paused."
    }

    // Format the response to be human-readable
    const frames = stackFrames
      .map((frame: any) => `- Function: ${frame.name} | File: ${frame.source?.name} | Line: ${frame.line}`)
      .join("\n")

    return `Current Call Stack:\n${frames}`
  }

  private async isDebuggerActive(): Promise<string> {
    logger.info("[MCP Tool] Requesting to check debugger status...")
    const response = await this.ipcBridge.sendDapRequest('isDebuggerActive', {})

    if (response.body.error) {
      return `Error checking debugger status: ${response.body.error}`
    }

    return response.body.isActive ? "Debugger is active and ready." : "No active debugger session found."
  }


  private async setBreakpoints(locations: { file: string; line: number }[]): Promise<string> {
    logger.info("[MCP Tool] Requesting to set breakpoints...")
    const response = await this.ipcBridge.sendDapRequest('setBreakpointsInFiles', { locations })

    // Errors are now consistently in the `body` property
    if (response.body.error) {
      return `Error setting breakpoints: ${response.body.error}`
    }

    const results = response.body.results
    if (!results) {
      return "Error: Invalid response from the extension when setting breakpoints."
    }

    const totalSet = results.reduce((sum: number, result: any) => {
      return sum + (result && result.breakpoints ? result.breakpoints.length : 0)
    }, 0)

    const fileCount = results.length

    return `Success! ${totalSet} of ${locations.length} breakpoints were set across ${fileCount} file(s).`
  }
}
