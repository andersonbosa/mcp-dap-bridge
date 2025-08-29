import type { FactoryPattern, MCPServerTransport, ServerConfig } from '../types'
import { MCPServer } from './mcp-server'
import { MCPServerWithStdio } from './mcp-server-with-stdio'
import { MCPServerWithStreamableHTTP } from './mcp-server-with-streamable-http'

export class MCPServerFactory implements FactoryPattern<MCPServerTransport> {
  constructor(private config: ServerConfig) {}

  create(): MCPServerTransport {
    if (this.config.SERVER_TRANSPORT === 'http') {
      return new MCPServerWithStreamableHTTP(new MCPServer(this.config))
    }
    return new MCPServerWithStdio(new MCPServer(this.config))
  }
}
