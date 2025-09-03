import * as vscode from 'vscode'
import { CommandResponseFactory } from './command-response-factory'
import { DapCommandHandler, DapRequestMessage, DefaultCommandResponse, StandardCommandResponse } from '../types'

/**
 * A handler for DAP commands that require an active debug session.
 */
export class CustomVSCodeDAPHandler implements DapCommandHandler<any, DefaultCommandResponse> {
  constructor(readonly command: string) { }

  async handle(session: vscode.DebugSession | undefined, message: DapRequestMessage<any>): Promise<StandardCommandResponse<DefaultCommandResponse>> {
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
