import type { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import type { ServerConfig } from '../types'
import type { MCPServerTransport } from '../types/index'
import { logger } from '../utils/logger'
import type { MCPServer } from './mcp-server'

/**
 * Decorator that adds support for the STDIO transport to the MCP Server.
 */
export class MCPServerWithStdio implements MCPServerTransport {
  private readonly mcpServer: MCPServer

  constructor(mcpServer: MCPServer) {
    this.mcpServer = mcpServer
  }

  /**
   * Starts the server using the STDIO transport.
   */
  async start(): Promise<void> {
    const transport = new StdioServerTransport()
    await this.mcpServer.getServer().connect(transport)
    logger.info(`MCP Server "${this.getConfig().SERVER_NAME}" started using "stdio" transport.`)
  }

  /**
   * Returns the MCP Server instance.
   */
  getServer(): Server {
    return this.mcpServer.getServer()
  }

  /**
   * Returns the current server configuration.
   */
  getConfig(): ServerConfig {
    return this.mcpServer.getConfig()
  }
}
