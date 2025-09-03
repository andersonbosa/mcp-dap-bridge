import * as vscode from 'vscode'
import { CommandResponseFactory } from '../core/command-response-factory'
import { BaseCommand, CommandContext, StandardCommandResponse } from '../types'

interface StepOutCommandInput {
  threadId?: number
}

interface StepOutCommandOutput {
  success: boolean
  message: string
}

/**
 * Step out of current function
 */
export class StepOutCommand extends BaseCommand<StepOutCommandInput, StandardCommandResponse<StepOutCommandOutput>> {
  readonly command = 'stepOut'

  async execute(args: StepOutCommandInput = {}, context?: CommandContext): Promise<StandardCommandResponse<StepOutCommandOutput>> {
    const startTime = Date.now()
    const session = context?.session as vscode.DebugSession | undefined

    if (!session) {
      throw new Error('No active debug session found for step out command')
    }

    try {
      await session.customRequest('stepOut', {
        threadId: args.threadId || 1
      })

      return CommandResponseFactory.createWithDebugSession(
        {
          success: true,
          message: 'Stepped out of current function'
        },
        session.id,
        startTime
      )
    } catch (error) {
      throw new Error(`Failed to step out: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
}
