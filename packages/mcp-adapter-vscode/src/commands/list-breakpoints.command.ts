import * as vscode from 'vscode'
import { BaseCommand, CommandContext } from '../types'

type ListBreakpointsHandlerOutput = {
  breakpointsByFile: { [key: string]: { line: number; verified: boolean }[] }
}

/**
 * Handles the 'breakpoints/list' command by retrieving all active breakpoints
 * from the VS Code debug session.
 * Now extends BaseCommand for unified command interface.
 */
export class ListBreakpointsCommand extends BaseCommand<void, ListBreakpointsHandlerOutput> {
  readonly command = 'listBreakpoints'
  async execute(args: void, context?: CommandContext): Promise<ListBreakpointsHandlerOutput> {
    this.validateInput(args)
    
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
    
    return this.postProcess({ breakpointsByFile }, context)
  }
}