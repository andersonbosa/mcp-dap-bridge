import { BaseTool } from "../base-tool";
import { promises as fs } from "fs";
import { logger } from "../../utils/logger";

export class FileReadTool extends BaseTool {
  readonly name = "read_file";
  readonly description = "Read contents of a file";
  readonly inputSchema = {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "Path to the file to read",
      },
    },
    required: ["path"],
  };

  async execute(args: { path: string }): Promise<any> {
    try {
      const content = await fs.readFile(args.path, "utf-8");
      return {
        content: [
          {
            type: "text",
            text: content,
          },
        ],
      };
    } catch (error) {
      logger.error(`Failed to read file: ${args.path}`, error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to read file: ${errorMessage}`);
    }
  }
}
