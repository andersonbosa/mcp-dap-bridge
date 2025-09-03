import * as vscode from 'vscode'
import { BaseCommand, CommandContext, StandardCommandResponse } from '../types'
import { CommandResponseFactory } from '../core/command-response-factory'

interface ListThreadsCommandInput {
  // No input parameters needed
}

interface Thread {
  id: number
  name: string
}

interface ListThreadsCommandOutput {
  threads: Thread[]
}

/**
 * List all active threads in debug session
 */
export class ListThreadsCommand extends BaseCommand<ListThreadsCommandInput, StandardCommandResponse<ListThreadsCommandOutput>> {
  readonly command = 'listThreads'

  async execute(args: ListThreadsCommandInput = {}, context?: CommandContext): Promise<StandardCommandResponse<ListThreadsCommandOutput>> {
    const startTime = Date.now()
    const session = context?.session as vscode.DebugSession | undefined

    if (!session) {
      throw new Error('No active debug session found for list threads command')
    }

    try {
      const response = await session.customRequest('threads')

      return CommandResponseFactory.createWithDebugSession(
        {
          threads: response.threads || []
        },
        session.id,
        startTime,
        {
          threadCount: response.threads?.length || 0
        }
      )
    } catch (error) {
      throw new Error(`Failed to list threads: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
}
