import { StandardCommandResponse, isErrorResponse } from "@andersonbosa/core-bridge"
import { WebSocketManager } from "../../server/dependencies/websocket-manager"
import { ToolResult } from "../../types"
import { logger } from "../../utils/logger"
import { BaseTool } from "../base-tool"

type GetVariableValueToolInput = {
  variableName: string
  frameId?: number
  threadId?: number
  scope?: string
}

export class GetVariableValueTool extends BaseTool {
  readonly name = "getVariableValue"
  readonly description = "Get value of specific variable"
  readonly inputSchema = {
    type: "object",
    properties: {
      variableName: {
        type: "string",
        description: "Name of the variable to inspect",
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
    required: ["variableName"],
  }

  constructor(private readonly wsBridge: WebSocketManager) {
    super()
  }

  async execute(args: GetVariableValueToolInput): Promise<ToolResult> {
    try {
      const frameId = args.frameId || 0

      logger.info(`[DebuggerToolkit] Getting variable '${args.variableName}' value...`)

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

      // Get variables from the scope
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

      const resultText = `Variable: ${targetVariable.name}\n` +
        `Value: ${targetVariable.value}\n` +
        `Type: ${targetVariable.type || 'unknown'}\n` +
        `Scope: ${targetScope.name}`

      return {
        content: [{ type: "text", text: resultText }],
      }
    } catch (error: any) {
      logger.error(`[DebuggerToolkit] Error executing getVariableValue:`, error)
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      }
    }
  }
}
