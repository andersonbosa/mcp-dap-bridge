import { BaseTool } from "../base-tool"
import { logger } from "../../utils/logger"
import { WebSocketManager } from "../../server/dependencies/websocket-manager"
import { StandardCommandResponse, isErrorResponse } from "@andersonbosa/core-bridge"

type SetVariableValueToolInput = {
  variableName: string
  newValue: string
  frameId?: number
  threadId?: number
  scope?: string
}

export class SetVariableValueTool extends BaseTool {
  readonly name = "setVariableValue"
  readonly description = "Modify variable value during debugging"
  readonly inputSchema = {
    type: "object",
    properties: {
      variableName: {
        type: "string",
        description: "Name of the variable to modify",
      },
      newValue: {
        type: "string",
        description: "New value for the variable (as string)",
      },
      frameId: {
        type: "number",
        description: "Stack frame ID (optional, defaults to current frame)",
      },
      threadId: {
        type: "number",
        description: "Thread ID (optional, defaults to 1)",
      },
      scope: {
        type: "string",
        description: "Variable scope: 'local', 'global', 'arguments'",
        enum: ["local", "global", "arguments"],
      },
    },
    required: ["variableName", "newValue"],
  }

  constructor(private readonly wsBridge: WebSocketManager) {
    super()
  }

  async execute(args: SetVariableValueToolInput): Promise<any> {
    try {
      const frameId = args.frameId || 0
      
      logger.info(`[DebuggerToolkit] Setting variable '${args.variableName}' to '${args.newValue}'...`)

      // First get the scopes for the frame
      const scopesResponse: StandardCommandResponse<any> = await this.wsBridge.sendDapRequest("scopes", { frameId })
      
      if (isErrorResponse(scopesResponse)) {
        throw new Error(`Error getting scopes: ${scopesResponse.error}`)
      }

      const scopes = scopesResponse.data?.scopes
      if (!scopes || scopes.length === 0) {
        throw new Error("No scopes available for current frame")
      }

      // Find the appropriate scope
      let targetScope = scopes[0] // Default to first scope
      if (args.scope) {
        const foundScope = scopes.find((s: any) => 
          s.name.toLowerCase().includes(args.scope!.toLowerCase())
        )
        if (foundScope) {
          targetScope = foundScope
        }
      }

      // Get variables from the scope to find the target variable
      const variablesResponse: StandardCommandResponse<any> = await this.wsBridge.sendDapRequest("variables", {
        variablesReference: targetScope.variablesReference
      })

      if (isErrorResponse(variablesResponse)) {
        throw new Error(`Error getting variables: ${variablesResponse.error}`)
      }

      const variables = variablesResponse.data?.variables
      const targetVariable = variables?.find((v: any) => v.name === args.variableName)

      if (!targetVariable) {
        return {
          content: [{
            type: "text",
            text: `Variable '${args.variableName}' not found in ${targetScope.name} scope. Available variables: ${variables?.map((v: any) => v.name).join(', ') || 'none'}`
          }],
        }
      }

      // Set the variable value
      const setVariableResponse: StandardCommandResponse<any> = await this.wsBridge.sendDapRequest("setVariable", {
        variablesReference: targetScope.variablesReference,
        name: args.variableName,
        value: args.newValue
      })

      if (isErrorResponse(setVariableResponse)) {
        throw new Error(`Error setting variable: ${setVariableResponse.error}`)
      }

      const result = setVariableResponse.data
      const oldValue = targetVariable.value
      const newValue = result.value || args.newValue

      const resultText = `Variable '${args.variableName}' updated successfully:\n` +
                        `Old value: ${oldValue}\n` +
                        `New value: ${newValue}\n` +
                        `Type: ${result.type || targetVariable.type || 'unknown'}\n` +
                        `Scope: ${targetScope.name}`

      return {
        content: [{ type: "text", text: resultText }],
      }
    } catch (error: any) {
      logger.error(`[DebuggerToolkit] Error executing setVariableValue:`, error)
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
      }
    }
  }
}
