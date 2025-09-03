import * as vscode from 'vscode'
import { BaseCommand, CommandContext, DefaultCommandResponse, StandardCommandResponse } from '../types'
import { CommandResponseFactory } from '../core/command-response-factory'

/**
 * A handler for custom DAP commands that require an active debug session.
 * This is a generic handler that can execute any DAP command.
 */
export class CustomVSCodeDAPCommand extends BaseCommand<any, StandardCommandResponse<DefaultCommandResponse>> {
  constructor(readonly command: string) {
    super()
  }

  async execute(args: any, context?: CommandContext): Promise<StandardCommandResponse<DefaultCommandResponse>> {
    this.validateInput(args)
    const startTime = Date.now()
    const session = context?.session as vscode.DebugSession | undefined

    if (!session) {
      throw new Error(`No active debug session found for custom DAP command: ${this.command}`)
    }

    const result = await session.customRequest(this.command, args)

    return CommandResponseFactory.createWithDebugSession(
      result,
      session.id,
      startTime,
      {
        customCommand: this.command,
        isGenericHandler: true
      }
    )
  }
}
