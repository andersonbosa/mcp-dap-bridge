import type { ServerConfig, ServerTransport } from '../types'

export const config: ServerConfig = {
  SERVER_NAME: process.env.MCP_SERVER_NAME || require('../../package.json').name,
  SERVER_VERSION: process.env.MCP_SERVER_VERSION || require('../../package.json').version,
  SERVER_TRANSPORT: (process.env.MCP_SERVER_TRANSPORT as ServerTransport) || 'http',
  SERVER_TOOLS_DISABLED: getDisabledToolsFromEnv(),
  HTTP_PORT: parseInt(process.env.PORT || '3001', 10),
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  MCP_PORT: parseInt(process.env.MCP_PORT || '8444', 10),
  WS_PORT: parseInt(process.env.WS_PORT || '8445', 10)
}

function getDisabledToolsFromEnv(): string[] {
  const disabledToolsEnv = process.env.MCP_SERVER_TOOLS_DISABLED
  if (!disabledToolsEnv) {
    return []
  }

  return disabledToolsEnv.split(',').map((toolName) => toolName.toLowerCase().trim()) || []
}
