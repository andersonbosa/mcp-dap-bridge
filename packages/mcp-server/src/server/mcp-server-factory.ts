import { ServerConfig } from "../types"
import { MCPServer } from "./mcp-server"
import { MCPServerWithStreamableHTTP } from "./mcp-server-with-streamable-http"

export function mcpServerFactory(config: ServerConfig): MCPServer | MCPServerWithStreamableHTTP {
  if (config.SERVER_TRANSPORT === "http") {
    return new MCPServerWithStreamableHTTP(new MCPServer(config))
  }
  return new MCPServer(config)
}
