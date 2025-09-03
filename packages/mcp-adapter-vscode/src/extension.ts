import * as vscode from 'vscode'
import { COMMANDS_MAP, EXT_KEYID } from './constants'
import { WebsocketMessageRouter } from './core/websocket-message-router'
import { logger } from './utils/logger'

let messageRouter: WebsocketMessageRouter

export function activate(context: vscode.ExtensionContext) {
  logger.info(`The "${EXT_KEYID}" extension is now active!`)

  // Initialize message router for WebSocket communication
  messageRouter = new WebsocketMessageRouter()
  messageRouter.start()

  // Register configuration change listener
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(event => {
      if (event.affectsConfiguration('mcpAdapterForVSCode.wsServerUrl')) {
        logger.info('[Extension] WebSocket URL configuration changed, reconnecting...')
        messageRouter.stop()
      }
    }),

    vscode.commands.registerCommand(COMMANDS_MAP.HELLO_WORLD, () => {
      vscode.window.showInformationMessage(`Hello World from ${EXT_KEYID}`)
    })
  )
}

export function deactivate() {
  if (messageRouter) {
    messageRouter.stop()
  }
}
