import { WebSocketManager } from "../../server/dependencies/websocket-manager"
import { FactoryPattern } from "../../types"
import { BaseTool } from "../base-tool"
import { ListBreakpointsTool } from "../toolkit-ide/list-breakpoints.tool"
import { RemoveBreakpointsTool } from "../toolkit-ide/remove-breakpoints-tool"
import { SetBreakpointsTool } from "../toolkit-ide/set-breakpoints-tool"
import { ContinueTool } from "./continue-tool"
import { GetStackTraceTool } from "./get-stack-trace-tool"
import { GetThreadInfoTool } from "./get-thread-info-tool"
import { GetVariableValueTool } from "./get-variable-value-tool"
import { IsDebuggerActiveTool } from "./is-debugger-active-tool"
import { ListLocalVariablesTool } from "./list-local-variables-tool"
import { ListThreadsTool } from "./list-threads-tool"
import { PauseTool } from "./pause-tool"
import { SetVariableValueTool } from "./set-variable-value-tool"
import { StepIntoTool } from "./step-into-tool"
import { StepOutTool } from "./step-out-tool"
import { StepOverTool } from "./step-over-tool"

export class DebuggerToolkitFactory implements FactoryPattern<BaseTool> {
  constructor(private readonly wsBridge: WebSocketManager) { }

  create(): BaseTool[] {
    return [
      // Basic debugging status
      new IsDebuggerActiveTool(this.wsBridge),
  
      // Execution control
      new ContinueTool(this.wsBridge),
      new PauseTool(this.wsBridge),
      new StepOverTool(this.wsBridge),
      new StepIntoTool(this.wsBridge),
      new StepOutTool(this.wsBridge),
  
      // Stack and context inspection
      new GetStackTraceTool(this.wsBridge),
      new ListLocalVariablesTool(),
  
      // Variable inspection and modification
      new GetVariableValueTool(this.wsBridge),
      new SetVariableValueTool(this.wsBridge),
  
      // Breakpoint management
      new SetBreakpointsTool(this.wsBridge),
      new RemoveBreakpointsTool(this.wsBridge),
      new ListBreakpointsTool(this.wsBridge),
  
      // Thread management
      new ListThreadsTool(this.wsBridge),
      new GetThreadInfoTool(this.wsBridge),
    ]
  }
}