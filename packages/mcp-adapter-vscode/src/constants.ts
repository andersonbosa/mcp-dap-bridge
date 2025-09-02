
export const EXT_KEYID = 'mcpDebugxVscodeAdapter'

function withPrefix(cmdKey: string) {
  return `${EXT_KEYID}.${cmdKey}`
}

export const COMMANDS_MAP = {
  HELLO_WORLD: withPrefix('helloWorld'),
  PING_MCP_SERVER: withPrefix('pingMcpServer'),
  PING_WS_SERVER: withPrefix('pingWsServer'),
}

export const CONFIGURATIONS_MAP = {
  WS_SERVER_URL: withPrefix('wsServerUrl'),
  MCP_SERVER_URL: withPrefix('mcpServerUrl')
}