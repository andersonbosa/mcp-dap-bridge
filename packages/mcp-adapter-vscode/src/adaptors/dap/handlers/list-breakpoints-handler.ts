import * as vscode from 'vscode'
import { CommandResponseFactory } from '../../../core/command-response-factory'
import { DapCommandHandler, StandardCommandResponse } from '../../../types'
import { logger } from '../../../utils/logger'

type ListBreakpointsHandlerOutput = {
  breakpoints: Record<string, any[]>
}

/**
 * A specialized handler to list all active breakpoints.
 */
export class ListBreakpointsHandler implements DapCommandHandler<void, ListBreakpointsHandlerOutput> {
  readonly command = 'listBreakpoints';

  async handle(session: vscode.DebugSession | undefined): Promise<StandardCommandResponse<ListBreakpointsHandlerOutput>> {
    const startTime = Date.now()
    logger.info(`[${this.constructor.name}] Listing active breakpoints...`)

    const allBreakpoints = vscode.debug.breakpoints
    const breakpointsByFile = allBreakpoints.reduce((acc, bp) => {
      if (bp instanceof vscode.SourceBreakpoint) {
        const filePath = bp.location.uri.fsPath
        if (!acc[filePath]) {
          acc[filePath] = []
        }
        acc[filePath].push({
          line: bp.location.range.start.line + 1,
          enabled: bp.enabled,
          condition: bp.condition,
          hitCondition: bp.hitCondition,
          logMessage: bp.logMessage,
        })
      }
      return acc
    }, {} as Record<string, any[]>)

    return CommandResponseFactory.createWithoutDebugSession({ breakpoints: breakpointsByFile }, startTime, session?.id)
  }
}
