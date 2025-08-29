import * as vscode from 'vscode'
import { IdeCommandHandler } from "../../../types"

/**
 * Handles the 'breakpoints/list' command by retrieving all active breakpoints
 * from the VS Code debug session.
 */
export class ListBreakpointsHandler implements IdeCommandHandler {
  async execute(): Promise<any> {
    const breakpoints = vscode.debug.breakpoints
    const breakpointsByFile: { [key: string]: { line: number; verified: boolean }[] } = {}

    for (const bp of breakpoints) {
      if (bp instanceof vscode.SourceBreakpoint) {
        const path = bp.location.uri.fsPath
        if (!breakpointsByFile[path]) {
          breakpointsByFile[path] = []
        }
        breakpointsByFile[path].push({
          line: bp.location.range.start.line + 1, // VS Code is 0-indexed, DAP is 1-indexed
          verified: true, // TODO: Find a way to check if a breakpoint is verified
        })
      }
    }
    return { breakpointsByFile }
  }
}