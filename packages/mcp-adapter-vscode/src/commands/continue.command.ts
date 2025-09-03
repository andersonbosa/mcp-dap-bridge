import * as vscode from 'vscode'
import { BaseCommand, CommandContext, StandardCommandResponse } from '../types'
import { CommandResponseFactory } from '../core/command-response-factory'

interface ContinueCommandInput {
  threadId?: number
}

interface ContinueCommandOutput {
  success: boolean
  message: string
}

/**
 * Continue program execution from current breakpoint
 */
export class ContinueCommand extends BaseCommand<ContinueCommandInput, StandardCommandResponse<ContinueCommandOutput>> {
  readonly command = 'continue'

  async execute(args: ContinueCommandInput = {}, context?: CommandContext): Promise<StandardCommandResponse<ContinueCommandOutput>> {
    const startTime = Date.now()
    const session = context?.session as vscode.DebugSession | undefined

    if (!session) {
      throw new Error('No active debug session found for continue command')
    }

    try {
      await session.customRequest('continue', {
        threadId: args.threadId || 1
      })

      return CommandResponseFactory.createWithDebugSession(
        {
          success: true,
          message: 'Program execution continued'
        },
        session.id,
        startTime
      )
    } catch (error) {
      throw new Error(`Failed to continue execution: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
}
