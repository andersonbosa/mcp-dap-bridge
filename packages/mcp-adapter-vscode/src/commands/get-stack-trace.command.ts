import * as vscode from 'vscode'
import { BaseCommand, CommandContext, StandardCommandResponse } from '../types'
import { CommandResponseFactory } from '../core/command-response-factory'

interface GetStackTraceCommandInput {
  threadId?: number
  startFrame?: number
  levels?: number
}

interface StackFrame {
  id: number
  name: string
  source?: {
    name?: string
    path?: string
  }
  line: number
  column: number
}

interface GetStackTraceCommandOutput {
  stackFrames: StackFrame[]
  totalFrames: number
}

/**
 * Get current call stack with frame details
 */
export class GetStackTraceCommand extends BaseCommand<GetStackTraceCommandInput, StandardCommandResponse<GetStackTraceCommandOutput>> {
  readonly command = 'getStackTrace'

  async execute(args: GetStackTraceCommandInput = {}, context?: CommandContext): Promise<StandardCommandResponse<GetStackTraceCommandOutput>> {
    const startTime = Date.now()
    const session = context?.session as vscode.DebugSession | undefined

    if (!session) {
      throw new Error('No active debug session found for get stack trace command')
    }

    try {
      const response = await session.customRequest('stackTrace', {
        threadId: args.threadId || 1,
        startFrame: args.startFrame || 0,
        levels: args.levels || 20
      })

      return CommandResponseFactory.createWithDebugSession(
        {
          stackFrames: response.stackFrames || [],
          totalFrames: response.totalFrames || 0
        },
        session.id,
        startTime,
        {
          threadId: args.threadId || 1,
          frameCount: response.stackFrames?.length || 0
        }
      )
    } catch (error) {
      throw new Error(`Failed to get stack trace: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
}
