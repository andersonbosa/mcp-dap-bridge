import type { Server } from "@modelcontextprotocol/sdk/server/index.js"

export type ServerTransport = "stdio" | "http"
export interface ServerConfig {
  SERVER_NAME: string
  SERVER_VERSION: string
  SERVER_TRANSPORT: ServerTransport
  HTTP_PORT: number
  LOG_LEVEL: string
  MCP_PORT: number
  WS_PORT: number
}


/**
 * Base interface for all MCP Server transport decorators.
 * Each decorator must implement this interface to ensure consistency.
 */
export interface MCPServerTransport {
  /**
   * Starts the server with the specific transport.
   */
  start(): Promise<void>

  /**
   * Returns the MCP Server instance.
   */
  getServer(): Server

  /**
   * Returns the current server configuration.
   */
  getConfig(): ServerConfig
}


export interface ToolResponseContent {
  type: string
  [key: string]: any
}

export interface ToolResponse {
  content: ToolResponseContent[]
  // Add other top-level fields if the MCP client supports them, e.g.:
  // metadata?: Record<string, any>;
}