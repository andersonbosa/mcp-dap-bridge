import * as vscode from 'vscode'
import { BaseCommand, CommandContext, StandardCommandResponse } from '../types'
import { CommandResponseFactory } from '../core/command-response-factory'

interface GetVariableValueCommandInput {
  frameId: number
  variableName: string
}

interface GetVariableValueCommandOutput {
  name: string
  value: string
  type?: string
  variablesReference: number
  found: boolean
}

/**
 * Get value of specific variable by name
 */
export class GetVariableValueCommand extends BaseCommand<GetVariableValueCommandInput, StandardCommandResponse<GetVariableValueCommandOutput>> {
  readonly command = 'getVariableValue'

  async execute(args: GetVariableValueCommandInput, context?: CommandContext): Promise<StandardCommandResponse<GetVariableValueCommandOutput>> {
    this.validateInput(args)
    const startTime = Date.now()
    const session = context?.session as vscode.DebugSession | undefined

    if (!session) {
      throw new Error('No active debug session found for get variable value command')
    }

    try {
      // First get scopes for the frame
      const scopesResponse = await session.customRequest('scopes', {
        frameId: args.frameId
      })

      // Search for the variable in all scopes
      for (const scope of scopesResponse.scopes || []) {
        if (scope.variablesReference > 0) {
          const variablesResponse = await session.customRequest('variables', {
            variablesReference: scope.variablesReference
          })

          const variable = (variablesResponse.variables || []).find(
            (v: any) => v.name === args.variableName
          )

          if (variable) {
            return CommandResponseFactory.createWithDebugSession(
              {
                name: variable.name,
                value: variable.value,
                type: variable.type,
                variablesReference: variable.variablesReference,
                found: true
              },
              session.id,
              startTime,
              {
                frameId: args.frameId,
                scopeName: scope.name
              }
            )
          }
        }
      }

      // Variable not found
      return CommandResponseFactory.createWithDebugSession(
        {
          name: args.variableName,
          value: '',
          variablesReference: 0,
          found: false
        },
        session.id,
        startTime,
        {
          frameId: args.frameId,
          searchedScopes: scopesResponse.scopes?.length || 0
        }
      )
    } catch (error) {
      throw new Error(`Failed to get variable value: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  protected validateInput(args: GetVariableValueCommandInput): void {
    super.validateInput(args)
    if (typeof args.frameId !== 'number') {
      throw new Error('frameId must be a number')
    }
    if (typeof args.variableName !== 'string' || !args.variableName.trim()) {
      throw new Error('variableName must be a non-empty string')
    }
  }
}
