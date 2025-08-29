import * as vscode from 'vscode'
import WebSocket from 'ws'
import { logger } from '../utils/logger'

export class WebsocketClient {
  private static instance: WebsocketClient
  private socket: WebSocket | null = null;
  private readonly onMessageHandler: (data: Buffer) => void

  private constructor(onMessageHandler: (data: Buffer) => void) {
    this.onMessageHandler = onMessageHandler
  }

  public static getInstance(onMessageHandler: (data: Buffer) => void): WebsocketClient {
    if (!WebsocketClient.instance) {
      WebsocketClient.instance = new WebsocketClient(onMessageHandler)
    }
    return WebsocketClient.instance
  }

  private getWebSocketServerUrl(): string {
    return vscode.workspace.getConfiguration('mcpAdapterForVSCode').get('wsServerUrl') || 'ws://localhost:8445'
  }

  public connect(): void {
    const websocketURL = this.getWebSocketServerUrl()
    logger.info(`[${this.constructor.name}] Trying to connect to MCP Server at "${websocketURL}" ...`)
    this.socket = new WebSocket(websocketURL)

    this.socket.on('open', () => {
      logger.info(`[${this.constructor.name}] Successfully connected to MCP Server via WebSocket!`)
    })

    this.socket.on('message', (data: Buffer) => {
      this.onMessageHandler(data)
    })

    this.socket.on('close', () => {
      logger.info(`[${this.constructor.name}] WebSocket disconnected. Reconnecting in 5 seconds...`)
      this.socket = null
      setTimeout(() => this.connect(), 5000)
    })

    this.socket.on('error', (err) => {
      logger.error(`[${this.constructor.name}] WebSocket error. Reconnection will be attempted on "close" event.`, err)
    })
  }

  public sendMessage(message: any): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message))
    } else {
      logger.error(`[${this.constructor.name}] Attempted to send message, but the WebSocket connection is not open.`)
    }
  }

  public close(): void {
    if (this.socket) {
      this.socket.close()
    }
  }
}
