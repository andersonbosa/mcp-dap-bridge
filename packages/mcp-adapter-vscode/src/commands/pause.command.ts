import * as vscode from 'vscode'
import { BaseCommand, CommandContext, StandardCommandResponse } from '../types'
import { CommandResponseFactory } from '../core/command-response-factory'

interface PauseCommandInput {
  threadId?: number
}

interface PauseCommandOutput {
  success: boolean
  message: string
}

/**
 * Pause program execution
 */
export class PauseCommand extends BaseCommand<PauseCommandInput, StandardCommandResponse<PauseCommandOutput>> {
  readonly command = 'pause'

  async execute(args: PauseCommandInput = {}, context?: CommandContext): Promise<StandardCommandResponse<PauseCommandOutput>> {
    const startTime = Date.now()
    const session = context?.session as vscode.DebugSession | undefined

    if (!session) {
      throw new Error('No active debug session found for pause command')
    }

    try {
      await session.customRequest('pause', {
        threadId: args.threadId || 1
      })

      return CommandResponseFactory.createWithDebugSession(
        {
          success: true,
          message: 'Program execution paused'
        },
        session.id,
        startTime
      )
    } catch (error) {
      throw new Error(`Failed to pause execution: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
}
