import * as vscode from 'vscode'
import { DapRequestMessage, IdeRequestMessage, CommandContext } from '../types'
import { logger } from '../utils/logger'
import { WebsocketClient } from './websocket-client'
import { CommandManager } from '../commands/command-manager'
import { MESSAGE_TYPES } from '../constants'


/**
 * The MessageRouter serves as the composition root for the extension's messaging infrastructure.
 * 
 * It is responsible for:
 * - Setting up and managing the WebSocket connection to the MCP server
 * - Acting as the central entry point for routing and handling all incoming messages
 * - Providing necessary dependencies (like debug sessions, workspace info) to commands
 * - Managing the execution context for different types of commands
 * 
 * This class should be instantiated and started during extension activation to ensure
 * communication with the MCP server is established and maintained.
 */
export class WebsocketMessageRouter {
  private websocketClient: WebsocketClient
  private commandManager: CommandManager

  constructor() {
    this.websocketClient = WebsocketClient.getInstance(this.handleMessage.bind(this))
    this.commandManager = new CommandManager()
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
        case MESSAGE_TYPES.DAP_REQUEST:
          await this.handleDapRequest(message)
          break
        case MESSAGE_TYPES.IDE_REQUEST:
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
    try {
      // Create DAP context with all necessary dependencies
      const context = this.createDapContext(message)

      // Use the centralized command manager to execute the command
      const commandOutput = await this.commandManager.executeCommand(
        message.command,
        message.args,
        context
      )

      this.websocketClient.sendMessage(
        this.createWebsocketResponse(message.request_id, 'dap_response', commandOutput)
      )

    } catch (error: any) {
      logger.error(`[${this.constructor.name}] Error executing DAP command '${message.command}':`, error)
      this.websocketClient.sendMessage(
        this.createWebsocketResponse(message.request_id, 'dap_response', { success: false, error: error.message })
      )
    }
  }

  private async handleIdeCommand(message: IdeRequestMessage) {
    try {
      // Create IDE context with all necessary dependencies
      const context = this.createIdeContext(message)

      // Use the centralized command manager to execute the command
      const commandOutput = await this.commandManager.executeCommand(
        message.command,
        message.args,
        context
      )

      this.websocketClient.sendMessage(
        this.createWebsocketResponse(message.request_id, 'ide_response', commandOutput)
      )

    } catch (error: any) {
      logger.error(`[${this.constructor.name}] Error executing IDE command '${message.command}':`, error)
      this.websocketClient.sendMessage(
        this.createWebsocketResponse(message.request_id, 'ide_response', { success: false, error: error.message })
      )
    }
  }

  /**
   * Creates a standardized WebSocket response.
   */
  private createWebsocketResponse(request_id: string, type: 'dap_response' | 'ide_response', body: any) {
    return { type, request_id, body }
  }

  /**
   * Creates DAP context with all necessary dependencies.
   * This method centralizes DAP dependency injection.
   */
  private createDapContext(message: DapRequestMessage): CommandContext {
    const session = vscode.debug.activeDebugSession

    return {
      session,
      requestId: message.request_id,
      metadata: {
        messageType: MESSAGE_TYPES.DAP_REQUEST,
        timestamp: new Date().toISOString(),
        hasActiveSession: !!session,
        sessionId: session?.id,
        // Additional DAP-specific metadata can be added here
        debugConfiguration: session?.configuration
      }
    }
  }

  /**
   * Creates IDE context with all necessary dependencies.
   * This method centralizes IDE dependency injection.
   */
  private createIdeContext(message: IdeRequestMessage): CommandContext {
    const activeEditor = vscode.window.activeTextEditor
    const workspaceFolders = vscode.workspace.workspaceFolders

    return {
      requestId: message.request_id,
      metadata: {
        messageType: MESSAGE_TYPES.IDE_REQUEST,
        timestamp: new Date().toISOString(),
        activeEditorFile: activeEditor?.document.uri.fsPath,
        activeEditorLanguage: activeEditor?.document.languageId,
        workspaceCount: workspaceFolders?.length || 0,
        workspaceRoot: workspaceFolders?.[0]?.uri.fsPath,
        // Additional IDE-specific metadata can be added here
        visibleTextEditors: vscode.window.visibleTextEditors.length
      }
    }
  }

  /**
   * Gets a list of all registered commands.
   * Useful for debugging and introspection.
   */
  public getRegisteredCommands(): string[] {
    return this.commandManager.getRegisteredCommands()
  }

  /**
   * Checks if a command is available.
   */
  public hasCommand(command: string): boolean {
    return this.commandManager.hasCommand(command)
  }
}
