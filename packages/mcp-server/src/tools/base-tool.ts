import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import type { ToolResult } from '../types'

export abstract class BaseTool {
  abstract readonly name: string
  abstract readonly description: string
  abstract readonly inputSchema: any

  abstract execute(args: any): Promise<ToolResult>

  getDefinition(): Tool {
    return {
      name: this.name,
      description: this.description,
      inputSchema: this.inputSchema
    }
  }
}
