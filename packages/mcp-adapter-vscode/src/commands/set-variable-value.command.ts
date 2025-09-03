import * as vscode from 'vscode'
import { BaseCommand, CommandContext, StandardCommandResponse } from '../types'
import { CommandResponseFactory } from '../core/command-response-factory'

interface SetVariableValueCommandInput {
  frameId: number
  variableName: string
  newValue: string
}

interface SetVariableValueCommandOutput {
  success: boolean
  name: string
  value: string
  type?: string
  message: string
}

/**
 * Modify variable value during debugging
 */
export class SetVariableValueCommand extends BaseCommand<SetVariableValueCommandInput, StandardCommandResponse<SetVariableValueCommandOutput>> {
  readonly command = 'setVariableValue'

  async execute(args: SetVariableValueCommandInput, context?: CommandContext): Promise<StandardCommandResponse<SetVariableValueCommandOutput>> {
    this.validateInput(args)
    const startTime = Date.now()
    const session = context?.session as vscode.DebugSession | undefined

    if (!session) {
      throw new Error('No active debug session found for set variable value command')
    }

    try {
      // First get scopes for the frame to find the variable
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
            // Set the variable value
            const setResponse = await session.customRequest('setVariable', {
              variablesReference: scope.variablesReference,
              name: args.variableName,
              value: args.newValue
            })

            return CommandResponseFactory.createWithDebugSession(
              {
                success: true,
                name: setResponse.name || args.variableName,
                value: setResponse.value || args.newValue,
                type: setResponse.type,
                message: `Variable '${args.variableName}' set to '${args.newValue}'`
              },
              session.id,
              startTime,
              {
                frameId: args.frameId,
                scopeName: scope.name,
                oldValue: variable.value
              }
            )
          }
        }
      }

      // Variable not found
      throw new Error(`Variable '${args.variableName}' not found in frame ${args.frameId}`)
    } catch (error) {
      throw new Error(`Failed to set variable value: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  protected validateInput(args: SetVariableValueCommandInput): void {
    super.validateInput(args)
    if (typeof args.frameId !== 'number') {
      throw new Error('frameId must be a number')
    }
    if (typeof args.variableName !== 'string' || !args.variableName.trim()) {
      throw new Error('variableName must be a non-empty string')
    }
    if (typeof args.newValue !== 'string') {
      throw new Error('newValue must be a string')
    }
  }
}
