import * as vscode from 'vscode'
import { BaseCommand, CommandContext, StandardCommandResponse } from '../types'
import { CommandResponseFactory } from '../core/command-response-factory'

interface StepIntoCommandInput {
  threadId?: number
}

interface StepIntoCommandOutput {
  success: boolean
  message: string
}

/**
 * Step into function calls
 */
export class StepIntoCommand extends BaseCommand<StepIntoCommandInput, StandardCommandResponse<StepIntoCommandOutput>> {
  readonly command = 'stepInto'

  async execute(args: StepIntoCommandInput = {}, context?: CommandContext): Promise<StandardCommandResponse<StepIntoCommandOutput>> {
    const startTime = Date.now()
    const session = context?.session as vscode.DebugSession | undefined

    if (!session) {
      throw new Error('No active debug session found for step into command')
    }

    try {
      await session.customRequest('stepIn', {
        threadId: args.threadId || 1
      })

      return CommandResponseFactory.createWithDebugSession(
        {
          success: true,
          message: 'Stepped into function call'
        },
        session.id,
        startTime
      )
    } catch (error) {
      throw new Error(`Failed to step into: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
}
