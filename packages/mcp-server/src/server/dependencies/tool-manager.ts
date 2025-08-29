import { Tool } from "@modelcontextprotocol/sdk/types.js"
import { BaseTool } from "../../tools/base-tool"
import { ToolsFactory } from "../../tools/tools.factory"
import { logger } from "../../utils/logger"
import type { WebSocketManager } from "./websocket-manager"

export class ToolManager {
  private tools: Map<string, BaseTool> = new Map();

  constructor(private websocketBridge: WebSocketManager) {
    this.registerTools()
  }

  private registerTools(): void {
    const allTools = new ToolsFactory(this.websocketBridge).create()

    allTools.forEach((tool) => {
      this.tools.set(tool.name, tool)
      logger.info(`Registered tool: ${tool.name}`)
    })
  }

  listTools(): Tool[] {
    return Array.from(this.tools.values()).map((tool) => tool.getDefinition())
  }

  async callTool(name: string, args: any): Promise<any> {
    const tool = this.tools.get(name)
    if (!tool) {
      throw new Error(`Tool not found: ${name}`)
    }

    logger.info(`Calling tool: ${name}`)
    return await tool.execute(args)
  }
}
