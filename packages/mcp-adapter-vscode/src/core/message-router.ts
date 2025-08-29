import { DapCommandManager } from '../adaptors/dap/dap-command-manager'
import { IdeCommandManager } from '../adaptors/ide/ide-command-manager'
import { DapRequestMessage, IdeRequestMessage } from '../types'
import { logger } from '../utils/logger'
import { WebsocketClient } from './websocket-client'
import * as vscode from 'vscode'

export class MessageRouter {
  private dapCommandManager: DapCommandManager
  private ideCommandManager: IdeCommandManager
  private websocketClient: WebsocketClient

  constructor() {
    this.dapCommandManager = new DapCommandManager()
    this.ideCommandManager = new IdeCommandManager()
    this.websocketClient = WebsocketClient.getInstance(this.handleMessage.bind(this))
  }

  public start(): void {
    this.websocketClient.connect()
  }

  public stop(): void {
    this.websocketClient.close()
  }

  private async handleMessage(data: Buffer): Promise<void> {
    try {
      const message: any = JSON.parse(data.toString())
      logger.debug(`[${this.constructor.name}] Command received from server:`, message)

      switch (message.type) {
        case 'dap_request':
          await this.handleDapRequest(message)
          break
        case 'ide_command':
          await this.handleIdeCommand(message)
          break
        default:
          logger.warn(`[${this.constructor.name}] Received unknown message type: ${message.type}`)
      }
    } catch (error) {
      logger.error(`[${this.constructor.name}] Failed to parse incoming message:`, error)
    }
  }

  private async handleDapRequest(message: DapRequestMessage) {
    const session = vscode.debug.activeDebugSession

    try {
      const handler = this.dapCommandManager.getHandler(message.command)
      const responseBody = await handler.handle(session, message)

      this.websocketClient.sendMessage({
        type: 'dap_response',
        request_id: message.request_id,
        body: responseBody,
      })
    } catch (error: any) {
      logger.error(`[${this.constructor.name}] Error executing DAP command '${message.command}':`, error)
      this.websocketClient.sendMessage({
        type: 'dap_response',
        request_id: message.request_id,
        body: { success: false, error: error.message },
      })
    }
  }

  private async handleIdeCommand(message: IdeRequestMessage) {
    try {
      const responseData = await this.ideCommandManager.handle(message.command, message.args)
      this.websocketClient.sendMessage({
        type: 'ide_response',
        request_id: message.request_id,
        body: { success: true, data: responseData },
      })
    } catch (error: any) {
      logger.error(`[${this.constructor.name}] Error executing IDE command '${message.command}':`, error)
      this.websocketClient.sendMessage({
        type: 'ide_response',
        request_id: message.request_id,
        body: { success: false, error: error.message },
      })
    }
  }
}
