import * as vscode from 'vscode'
import { CommandResponseFactory } from '../../../core/command-response-factory'
import { DapRequestMessage, DefaultCommandResponse, StandardCommandResponse } from '../../../types'
import { CommandHandler } from './command-handler'

/**
 * A handler for DAP commands that require an active debug session.
 */
export class DefaultCommandHandler implements CommandHandler<DefaultCommandResponse> {
  constructor(readonly command: string) { }

  async handle(session: vscode.DebugSession | undefined, message: DapRequestMessage): Promise<StandardCommandResponse<DefaultCommandResponse>> {
    const startTime = Date.now()

    if (!session) {
      throw new Error("No active debug session found for this command.")
    }

    const result = await session.customRequest(message.command, message.args)

    return CommandResponseFactory.createWithDebugSession(
      result,
      session.id,
      startTime
    )
  }
}
