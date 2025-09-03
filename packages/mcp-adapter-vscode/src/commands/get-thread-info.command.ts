import * as vscode from 'vscode'
import { BaseCommand, CommandContext, StandardCommandResponse } from '../types'
import { CommandResponseFactory } from '../core/command-response-factory'

interface GetThreadInfoCommandInput {
  threadId: number
}

interface ThreadInfo {
  id: number
  name: string
  stackFrames?: any[]
  state?: string
}

interface GetThreadInfoCommandOutput {
  thread: ThreadInfo
  found: boolean
}

/**
 * Get detailed information about specific thread
 */
export class GetThreadInfoCommand extends BaseCommand<GetThreadInfoCommandInput, StandardCommandResponse<GetThreadInfoCommandOutput>> {
  readonly command = 'getThreadInfo'

  async execute(args: GetThreadInfoCommandInput, context?: CommandContext): Promise<StandardCommandResponse<GetThreadInfoCommandOutput>> {
    this.validateInput(args)
    const startTime = Date.now()
    const session = context?.session as vscode.DebugSession | undefined

    if (!session) {
      throw new Error('No active debug session found for get thread info command')
    }

    try {
      // First get all threads to find the specific one
      const threadsResponse = await session.customRequest('threads')
      const thread = (threadsResponse.threads || []).find((t: any) => t.id === args.threadId)

      if (!thread) {
        return CommandResponseFactory.createWithDebugSession(
          {
            thread: {
              id: args.threadId,
              name: 'Unknown'
            },
            found: false
          },
          session.id,
          startTime,
          {
            searchedThreads: threadsResponse.threads?.length || 0
          }
        )
      }

      // Get stack trace for the thread to provide more details
      let stackFrames = []
      try {
        const stackResponse = await session.customRequest('stackTrace', {
          threadId: args.threadId,
          startFrame: 0,
          levels: 10
        })
        stackFrames = stackResponse.stackFrames || []
      } catch (stackError) {
        // Stack trace might not be available if thread is running
      }

      const threadInfo: ThreadInfo = {
        id: thread.id,
        name: thread.name,
        stackFrames,
        state: stackFrames.length > 0 ? 'stopped' : 'running'
      }

      return CommandResponseFactory.createWithDebugSession(
        {
          thread: threadInfo,
          found: true
        },
        session.id,
        startTime,
        {
          stackFrameCount: stackFrames.length
        }
      )
    } catch (error) {
      throw new Error(`Failed to get thread info: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  protected validateInput(args: GetThreadInfoCommandInput): void {
    super.validateInput(args)
    if (typeof args.threadId !== 'number') {
      throw new Error('threadId must be a number')
    }
  }
}
