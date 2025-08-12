import { BaseTool } from "../base-tool"
import { logger } from "../../utils/logger"
import { WebSocketBridge } from "../../server/dependencies/websocket-bridge"

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

  constructor(private readonly wsBridge: WebSocketBridge) {
    super()
  }

  async execute(args: GetVariableValueToolInput): Promise<any> {
    try {
      const frameId = args.frameId || 0

      logger.info(`[DebuggerToolkit] Getting variable '${args.variableName}' value...`)

      // First get the scopes for the frame
      const scopesResponse = await this.wsBridge.sendDapRequest("scopes", { frameId })

      if (scopesResponse.body.error) {
        throw new Error(`Error getting scopes: ${scopesResponse.body.error}`)
      }

      const scopes = scopesResponse.body.scopes
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
      const variablesResponse = await this.wsBridge.sendDapRequest("variables", {
        variablesReference: targetScope.variablesReference
      })

      if (variablesResponse.body.error) {
        throw new Error(`Error getting variables: ${variablesResponse.body.error}`)
      }

      const variables = variablesResponse.body.variables
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
      }
    }
  }
}
