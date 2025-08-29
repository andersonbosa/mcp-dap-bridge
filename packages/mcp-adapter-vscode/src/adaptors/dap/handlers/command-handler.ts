import * as vscode from 'vscode'
import { DapRequestMessage, StandardCommandResponse } from '../../../types'

/**
 * Interface for a handler that processes a specific DAP command.
 * All handlers must return a StandardCommandResponse with consistent structure.
 */
export interface CommandHandler<T = any> {
  /**
   * The name of the DAP command this handler can process.
   */
  readonly command: string

  /**
   * Executes the command logic.
   * @param session The active debug session, which can be undefined for some commands.
   * @param message The DAP request message.
   * @returns A promise that resolves with a StandardCommandResponse containing data and metadata.
   */
  handle(session: vscode.DebugSession | undefined, message: DapRequestMessage): Promise<StandardCommandResponse<T>>
}
