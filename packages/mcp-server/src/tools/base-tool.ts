import { Tool } from "@modelcontextprotocol/sdk/types.js";

export abstract class BaseTool {
  abstract readonly name: string;
  abstract readonly description: string;
  abstract readonly inputSchema: any;

  abstract execute(args: any): Promise<any>;

  getDefinition(): Tool {
    return {
      name: this.name,
      description: this.description,
      inputSchema: this.inputSchema,
    };
  }
}
