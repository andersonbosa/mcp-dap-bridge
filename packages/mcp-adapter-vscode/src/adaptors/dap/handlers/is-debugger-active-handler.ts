import * as vscode from 'vscode'
import { CommandResponseFactory } from '../../../core/command-response-factory'
import { IsDebuggerActiveResponse, StandardCommandResponse } from '../../../types'
import { logger } from '../../../utils/logger'
import { CommandHandler } from './command-handler'

/**
 * A specialized handler to check if a debugger session is currently active.
 * This handler does not require an active session to begin with.
 */
export class IsDebuggerActiveHandler implements CommandHandler<IsDebuggerActiveResponse> {
  readonly command = 'isDebuggerActive';

  async handle(session: vscode.DebugSession | undefined): Promise<StandardCommandResponse<IsDebuggerActiveResponse>> {
    const startTime = Date.now()
    logger.info(`[${this.constructor.name}] Checking for active debug session...`)
    const isActive = !!session

    return CommandResponseFactory.createWithoutDebugSession({ isActive }, startTime, session?.id)
  }
}
