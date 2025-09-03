import * as vscode from 'vscode'
import { BaseCommand, CommandContext } from '../types'

type RemoveBreakpointsHandlerInput = {
  file?: string
  lines?: number[]
  removeAll?: boolean
}

type RemoveBreakpointsHandlerOutput = {
  removedCount: number
}

/**
 * Handles the 'breakpoints/remove' command by removing specified breakpoints.
 * Now extends BaseCommand for unified command interface.
 */
export class RemoveBreakpointsCommand extends BaseCommand<RemoveBreakpointsHandlerInput, RemoveBreakpointsHandlerOutput> {
  readonly command = 'removeBreakpoints'
  async execute(args: RemoveBreakpointsHandlerInput, context?: CommandContext): Promise<RemoveBreakpointsHandlerOutput> {
    this.validateInput(args)

    if (args.removeAll) {
      const allBreakpoints = vscode.debug.breakpoints
      vscode.debug.removeBreakpoints(allBreakpoints)
      return this.postProcess({ removedCount: allBreakpoints.length }, context)
    }

    if (!args.file) {
      throw new Error("A file path must be provided to remove specific breakpoints.")
    }

    const fileUri = vscode.Uri.file(args.file)
    const allBreakpoints = vscode.debug.breakpoints
    let removedCount = 0

    const breakpointsToRemove = allBreakpoints.filter(bp => {
      if (bp instanceof vscode.SourceBreakpoint && bp.location.uri.fsPath === fileUri.fsPath) {
        // If no specific lines are given, remove all breakpoints in the file.
        if (!args.lines || args.lines.length === 0) {
          return true
        }
        // Otherwise, check if the breakpoint's line is in the list of lines to be removed.
        return args.lines.includes(bp.location.range.start.line + 1)
      }
      return false
    })

    if (breakpointsToRemove.length > 0) {
      vscode.debug.removeBreakpoints(breakpointsToRemove)
      removedCount = breakpointsToRemove.length
    }

    return this.postProcess({ removedCount }, context)
  }
}
