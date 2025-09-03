import * as vscode from 'vscode'
import { BaseCommand, CommandContext, StandardCommandResponse } from '../types'
import { CommandResponseFactory } from '../core/command-response-factory'

interface ListLocalVariablesCommandInput {
  frameId: number
  start?: number
  count?: number
}

interface Variable {
  name: string
  value: string
  type?: string
  variablesReference: number
  indexedVariables?: number
  namedVariables?: number
}

interface ListLocalVariablesCommandOutput {
  variables: Variable[]
}

/**
 * List variables in current scope
 */
export class ListLocalVariablesCommand extends BaseCommand<ListLocalVariablesCommandInput, StandardCommandResponse<ListLocalVariablesCommandOutput>> {
  readonly command = 'listLocalVariables'

  async execute(args: ListLocalVariablesCommandInput, context?: CommandContext): Promise<StandardCommandResponse<ListLocalVariablesCommandOutput>> {
    this.validateInput(args)
    const startTime = Date.now()
    const session = context?.session as vscode.DebugSession | undefined

    if (!session) {
      throw new Error('No active debug session found for list local variables command')
    }

    if (!args.frameId) {
      throw new Error('frameId is required for listing local variables')
    }

    try {
      // First get scopes for the frame
      const scopesResponse = await session.customRequest('scopes', {
        frameId: args.frameId
      })

      const variables: Variable[] = []

      // Get variables for each scope (typically locals, arguments, etc.)
      for (const scope of scopesResponse.scopes || []) {
        if (scope.variablesReference > 0) {
          const variablesResponse = await session.customRequest('variables', {
            variablesReference: scope.variablesReference,
            start: args.start || 0,
            count: args.count || 100
          })

          variables.push(...(variablesResponse.variables || []))
        }
      }

      return CommandResponseFactory.createWithDebugSession(
        {
          variables
        },
        session.id,
        startTime,
        {
          frameId: args.frameId,
          scopeCount: scopesResponse.scopes?.length || 0,
          variableCount: variables.length
        }
      )
    } catch (error) {
      throw new Error(`Failed to list local variables: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  protected validateInput(args: ListLocalVariablesCommandInput): void {
    super.validateInput(args)
    if (typeof args.frameId !== 'number') {
      throw new Error('frameId must be a number')
    }
  }
}
