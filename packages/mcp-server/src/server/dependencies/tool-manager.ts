import { Tool } from "@modelcontextprotocol/sdk/types.js"
import { BaseTool } from "../../tools/base-tool"
import { createDebuggerToolkit as debuggerToolkitFactory } from "../../tools/debugger-toolkit/factory"
import { EchoTool } from "../../tools/echo-tool"
import { FileReadTool } from "../../tools/file-read-tool"
import { logger } from "../../utils/logger"
import type { WebSocketBridge } from "./websocket-bridge"

export class ToolManager {
  private tools: Map<string, BaseTool> = new Map();

  constructor(private websocketBridge: WebSocketBridge) {
    this.registerTools()
  }

  private registerTools(): void {
    const standardTools = [
      new EchoTool(),
      new FileReadTool(),
    ]

    const debuggerToolkit = debuggerToolkitFactory(this.websocketBridge)

    const allTools = [...standardTools, ...debuggerToolkit]

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
