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

  async execute(): Promise<any> {
    logger.warn("[DebuggerToolkit] listLocalVariables is not yet implemented.")
    return {
      content: [{
        type: "text",
        text: "Sorry, the 'listLocalVariables' feature is not yet implemented.",
      }],
    }
  }
}