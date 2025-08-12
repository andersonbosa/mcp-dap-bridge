import { WebSocketBridge } from "../../server/dependencies/websocket-bridge"
import { BaseTool } from "../base-tool"
import { GetStackTraceTool } from "./get-stack-trace-tool"
import { IsDebuggerActiveTool } from "./is-debugger-active-tool"
import { ListLocalVariablesTool } from "./list-local-variables-tool"
import { SetBreakpointsTool } from "./set-breakpoints-tool"
import { ContinueTool } from "./continue-tool"
import { StepOverTool } from "./step-over-tool"
import { StepIntoTool } from "./step-into-tool"
import { StepOutTool } from "./step-out-tool"
import { PauseTool } from "./pause-tool"
import { RemoveBreakpointsTool } from "./remove-breakpoints-tool"
import { GetVariableValueTool } from "./get-variable-value-tool"
import { SetVariableValueTool } from "./set-variable-value-tool"
import { ListThreadsTool } from "./list-threads-tool"
import { GetThreadInfoTool } from "./get-thread-info-tool"

/**
 * Creates and returns an array of all tools in the debugger toolkit.
 * This acts as a factory for the toolkit.
 *
 * @param wsBridge The WebSocket bridge for DAP requests.
 * @returns An array of `BaseTool` instances.
 */
export function createDebuggerToolkit(wsBridge: WebSocketBridge): BaseTool[] {
  return [
    // Basic debugging status
    new IsDebuggerActiveTool(wsBridge),

    // Execution control
    new ContinueTool(wsBridge),
    new PauseTool(wsBridge),
    new StepOverTool(wsBridge),
    new StepIntoTool(wsBridge),
    new StepOutTool(wsBridge),

    // Stack and context inspection
    new GetStackTraceTool(wsBridge),
    new ListLocalVariablesTool(),

    // Variable inspection and modification
    new GetVariableValueTool(wsBridge),
    new SetVariableValueTool(wsBridge),

    // Breakpoint management
    new SetBreakpointsTool(wsBridge),
    new RemoveBreakpointsTool(wsBridge),

    // Thread management
    new ListThreadsTool(wsBridge),
    new GetThreadInfoTool(wsBridge),
  ]
}