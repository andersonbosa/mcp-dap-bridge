import * as vscode from 'vscode'
import WebSocket from 'ws'
import { CommandManager } from './command-handler'
import { DapRequestMessage, DapResponseMessage } from './types'

let mcpSocket: WebSocket | null = null
const commandManager = new CommandManager()

function getWebSocketServerUrl(): string {
  return vscode.workspace.getConfiguration('mcpDapBridge').get('wsServerUrl') || 'ws://localhost:8445'
}

function sendMessageToServer(message: DapResponseMessage) {
  if (mcpSocket && mcpSocket.readyState === WebSocket.OPEN) {
    mcpSocket.send(JSON.stringify(message))
  } else {
    console.error('[Extension] Attempted to send message, but the WebSocket connection is not open.')
  }
}

async function handleDapRequest(message: DapRequestMessage) {
  const session = vscode.debug.activeDebugSession;

  try {
    const handler = commandManager.getHandler(message.command);
    // Pass the session (even if undefined) to the handler.
    // The handler is responsible for checking if an active session is required.
    const responseBody = await handler.handle(session, message);

    sendMessageToServer({
      type: 'dap_response',
      request_id: message.request_id,
      body: responseBody
    });
  } catch (error: any) {
    console.error(`[Extension] Error executing DAP command '${message.command}':`, error);
    sendMessageToServer({
      type: 'dap_response',
      request_id: message.request_id,
      body: { error: error.message }
    });
  }
}


async function handleServerMessage(data: Buffer) {
  try {
    const message = JSON.parse(data.toString()) as DapRequestMessage
    console.log('[Extension] Command received from server:', message)

    if (message.type === 'dap_request') {
      await handleDapRequest(message)
    } else {
      console.warn(`[Extension] Received unknown message type: ${message.type}`)
    }
  } catch (error) {
    console.error('[Extension] Failed to parse incoming message:', error)
  }
}

// WebSocket connection logic (more robust)
function connectToMcpServer() {
  console.log('[Extension] Trying to connect to MCP Server...')
  mcpSocket = new WebSocket(getWebSocketServerUrl())

  mcpSocket.on('open', () => {
    console.log('[Extension] Successfully connected to MCP Server via WebSocket!')
  })

  mcpSocket.on('message', (data: Buffer) => {
    handleServerMessage(data).catch(err => {
      console.error("[Extension] Unhandled error in message handler:", err)
    })
  })

  mcpSocket.on('close', () => {
    console.log('[Extension] WebSocket disconnected. Reconnecting in 5 seconds...')
    mcpSocket = null
    setTimeout(connectToMcpServer, 5000)
  })

  mcpSocket.on('error', (err) => {
    console.error('[Extension] WebSocket error. Reconnection will be attempted on "close" event.')
  })
}

export function activate(context: vscode.ExtensionContext) {
  console.log('The "mcp-debugger-bridge" extension is now active!')

  connectToMcpServer()

  // Watch for configuration changes in IDE
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(event => {
      if (event.affectsConfiguration('mcpDapBridge.wsServerUrl')) {
        console.log('[Extension] WebSocket URL configuration changed, reconnecting...')
        if (mcpSocket) {
          mcpSocket.close()
        }
      }
    })
  )
}

export function deactivate() {
  if (mcpSocket) {
    mcpSocket.close()
  }
}
