import { config } from '../config/config'
import type { WebSocketManager } from '../server/dependencies/websocket-manager'
import type { FactoryPattern } from '../types'
import type { BaseTool } from './base-tool'
import { DebuggerToolkitFactory } from './toolkit-debugger/toolkit-debugger.factory'
import { IDEToolkitFactory } from './toolkit-ide/toolkit-ide.factory'

export class ToolsFactory implements FactoryPattern<BaseTool> {
  private readonly DISABLED_TOOLS = config.SERVER_TOOLS_DISABLED
  private readonly wsBridge: WebSocketManager

  constructor(wsBridge: WebSocketManager) {
    this.wsBridge = wsBridge
  }

  create(): BaseTool[] {
    const allTools: BaseTool[] = [
      // new EchoTool(),
      // new FileReadTool(),
      ...new DebuggerToolkitFactory(this.wsBridge).create(),
      ...new IDEToolkitFactory(this.wsBridge).create()
    ]

    if (this.DISABLED_TOOLS.length === 0) {
      return allTools
    }

    return allTools.filter((tool) => !this.DISABLED_TOOLS.includes(tool.name.toLowerCase()))
  }
}
