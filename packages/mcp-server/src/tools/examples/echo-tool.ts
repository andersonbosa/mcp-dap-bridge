import { ToolResult } from "../../types";
import { BaseTool } from "../base-tool";

export class EchoTool extends BaseTool {
  readonly name = "echo";
  readonly description = "Echo back the input message";
  readonly inputSchema = {
    type: "object",
    properties: {
      message: {
        type: "string",
        description: "Message to echo back",
      },
    },
    required: ["message"],
  };

  async execute(args: { message: string }): Promise<ToolResult> {
    return {
      content: [
        {
          type: "text",
          text: `Echo: ${args.message}`,
        },
      ],
    };
  }
}
