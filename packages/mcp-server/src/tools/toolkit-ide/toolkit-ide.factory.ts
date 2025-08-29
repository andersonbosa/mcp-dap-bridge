import { WebSocketManager } from "../../server/dependencies/websocket-manager"
import { FactoryPattern } from "../../types"
import { BaseTool } from "../base-tool"
import { ListBreakpointsTool } from "./list-breakpoints.tool"
import { RemoveBreakpointsTool } from "./remove-breakpoints-tool"
import { SetBreakpointsTool } from "./set-breakpoints-tool"

export class IDEToolkitFactory implements FactoryPattern<BaseTool> {
  constructor(private readonly wsBridge: WebSocketManager) { }

  create(): BaseTool[] {
    return [
      new SetBreakpointsTool(this.wsBridge),
      new RemoveBreakpointsTool(this.wsBridge),
      new ListBreakpointsTool(this.wsBridge),
    ]
  }
}