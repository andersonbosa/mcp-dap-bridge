import { IsDebuggerActiveResponse, StandardCommandResponse, logger } from '@andersonbosa/mcp-debugx-core'
import * as vscode from 'vscode'
import { BaseCommand, CommandContext, DapRequestMessage } from '../types'
import { CommandResponseFactory } from '../core/command-response-factory'

/**
 * A specialized handler to check if a debugger session is currently active.
 * This handler does not require an active session to begin with.
 * Now extends BaseCommand for unified command interface.
 */
export class IsDebuggerActiveCommand extends BaseCommand<void, StandardCommandResponse<IsDebuggerActiveResponse>> {
  readonly command = 'isDebuggerActive';

  async execute(args: void, context?: CommandContext): Promise<StandardCommandResponse<IsDebuggerActiveResponse>> {
    const startTime = Date.now()
    logger.info(`[${this.constructor.name}] Checking for active debug session...`)
    const session = context?.session as vscode.DebugSession | undefined
    const isActive = !!session

    return CommandResponseFactory.createWithoutDebugSession({ isActive }, startTime, session?.id)
  }

  // Legacy DAP handler method for backward compatibility
  async handle(session: vscode.DebugSession | undefined, message?: DapRequestMessage<void>): Promise<StandardCommandResponse<IsDebuggerActiveResponse>> {
    return this.execute(undefined, { 
      session, 
      requestId: message?.request_id,
      metadata: { isDapLegacy: true }
    })
  }
}
