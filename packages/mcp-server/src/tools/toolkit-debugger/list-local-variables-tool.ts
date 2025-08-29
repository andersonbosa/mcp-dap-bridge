import { BaseTool } from "../base-tool"
import { logger } from "../../utils/logger"

export class ListLocalVariablesTool extends BaseTool {
  readonly name = "listLocalVariables";
  readonly description = "Lists the local variables in the current scope of the active debug session. (Not yet implemented)";
  readonly inputSchema = {
    type: "object",
    properties: {},
    required: [],
  };

  constructor() {
    super()
  }

  /**
   * Executes the tool to list local variables in the current stack frame of the active debug session.
   * This implementation assumes that the WebSocketManager is available as this.wsBridge,
   * and that the debug adapter protocol is being used.
   */
  async execute(): Promise<any> {
    try {
      logger.info("[DebuggerToolkit] Listing local variables in the current stack frame...");

      // 1. Get the current threads
      const threadsResponse = await (this as any).wsBridge.sendDapRequest("threads", {});
      if (threadsResponse.error) {
        throw new Error(`Error getting threads: ${threadsResponse.error}`);
      }
      const threads = threadsResponse.data?.threads;
      if (!threads || threads.length === 0) {
        return {
          content: [{ type: "text", text: "No active threads found in debug session." }],
        };
      }

      // 2. Pick the first thread (or the one with 'stopped' status if available)
      let targetThread = threads.find((t: any) => t.status === "stopped") || threads[0];

      // 3. Get the stack trace for the selected thread
      const stackTraceResponse = await (this as any).wsBridge.sendDapRequest("stackTrace", { threadId: targetThread.id });
      if (stackTraceResponse.error) {
        throw new Error(`Error getting stack trace: ${stackTraceResponse.error}`);
      }
      const stackFrames = stackTraceResponse.data?.stackFrames;
      if (!stackFrames || stackFrames.length === 0) {
        return {
          content: [{ type: "text", text: `No stack frames found for thread ${targetThread.id}.` }],
        };
      }

      // 4. Pick the top stack frame
      const topFrame = stackFrames[0];

      // 5. Get scopes for the top stack frame
      const scopesResponse = await (this as any).wsBridge.sendDapRequest("scopes", { frameId: topFrame.id });
      if (scopesResponse.error) {
        throw new Error(`Error getting scopes: ${scopesResponse.error}`);
      }
      const scopes = scopesResponse.data?.scopes;
      if (!scopes || scopes.length === 0) {
        return {
          content: [{ type: "text", text: `No scopes found for stack frame ${topFrame.id}.` }],
        };
      }

      // 6. Find the 'Local' scope
      const localScope = scopes.find((s: any) => s.name.toLowerCase() === "local" || s.name.toLowerCase() === "locals") || scopes[0];
      if (!localScope) {
        return {
          content: [{ type: "text", text: "No local scope found in the current stack frame." }],
        };
      }

      // 7. Get variables for the local scope
      const variablesResponse = await (this as any).wsBridge.sendDapRequest("variables", { variablesReference: localScope.variablesReference });
      if (variablesResponse.error) {
        throw new Error(`Error getting local variables: ${variablesResponse.error}`);
      }
      const variables = variablesResponse.data?.variables;
      if (!variables || variables.length === 0) {
        return {
          content: [{ type: "text", text: "No local variables found in the current scope." }],
        };
      }

      // 8. Format the variables for display
      const variableList = variables.map((v: any) => {
        let value = v.value;
        if (typeof value === "object") {
          value = JSON.stringify(value);
        }
        return `• ${v.name}: ${value}`;
      }).join("\n");

      const resultText = `Local Variables in '${topFrame.name}' (Thread ${targetThread.id}):\n\n${variableList}`;

      return {
        content: [{ type: "text", text: resultText }],
      };
    } catch (error: any) {
      logger.error("[DebuggerToolkit] Error executing listLocalVariables:", error);
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
      };
    }
  }
}