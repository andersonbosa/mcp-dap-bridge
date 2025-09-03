import * as vscode from 'vscode'
import { BaseCommand, CommandContext, StandardCommandResponse } from '../types'
import { CommandResponseFactory } from '../core/command-response-factory'

interface StepOverCommandInput {
  threadId?: number
}

interface StepOverCommandOutput {
  success: boolean
  message: string
}

/**
 * Execute next line without entering functions
 */
export class StepOverCommand extends BaseCommand<StepOverCommandInput, StandardCommandResponse<StepOverCommandOutput>> {
  readonly command = 'stepOver'

  async execute(args: StepOverCommandInput = {}, context?: CommandContext): Promise<StandardCommandResponse<StepOverCommandOutput>> {
    const startTime = Date.now()
    const session = context?.session as vscode.DebugSession | undefined

    if (!session) {
      throw new Error('No active debug session found for step over command')
    }

    try {
      await session.customRequest('next', {
        threadId: args.threadId || 1
      })

      return CommandResponseFactory.createWithDebugSession(
        {
          success: true,
          message: 'Stepped over to next line'
        },
        session.id,
        startTime
      )
    } catch (error) {
      throw new Error(`Failed to step over: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
}
