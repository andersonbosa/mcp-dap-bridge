export * from '@andersonbosa/mcp-debugx-core'
import { StandardCommandResponse } from '@andersonbosa/mcp-debugx-core'
import * as vscode from 'vscode'
export interface DapRequestMessage<Args = any> {
  type: 'dap_request'
  request_id: string
  command: string
  args: Args
}

export interface IdeRequestMessage<Args = any> {
  type: 'ide_command'
  request_id: string
  command: string
  args: Args
}

export interface DapResponseMessage {
  type: 'dap_response'
  request_id: string
  body: any
}


/**
 * Interface for a handler that executes a specific IDE command.
 */
export interface IdeCommandHandler<Input, Output> {
  execute(args: Input): Promise<Output>
}

/**
 * Interface for a handler that executes a specific DAP command.
 */
export interface DapCommandHandler<Input, Output> {
  /**
   * The name of the DAP command this handler can process.
   */
  readonly command: string

  /**
   * Executes the command logic.
   * @param session The active debug session, which can be undefined for some commands.
   * @param message The DAP request message, with typed arguments.
   * @returns A promise that resolves with a StandardCommandResponse containing data and metadata.
   */
  handle(session: vscode.DebugSession | undefined, message: DapRequestMessage<Input>): Promise<StandardCommandResponse<Output>>
}

// ====== Core Command Interfaces ======

/**
 * Base interface for all commands in the system.
 * Provides a unified interface for command execution regardless of the underlying type.
 */
export interface Command<Input = any, Output = any> {
  readonly command: string
  execute(args: Input, context?: CommandContext): Promise<Output>
}

/**
 * Context interface for command execution.
 * Provides necessary dependencies and session information.
 */
export interface CommandContext {
  session?: any
  requestId?: string
  metadata?: Record<string, any>
}

/**
 * Abstract base class for all commands.
 * Provides common functionality and enforces the Command interface.
 */
export abstract class BaseCommand<Input = any, Output = any> implements Command<Input, Output> {
  abstract readonly command: string
  
  abstract execute(args: Input, context?: CommandContext): Promise<Output>
  
  /**
   * Validates input before execution.
   * Override in subclasses for specific validation logic.
   */
  protected validateInput(args: Input): void {
    if (args === undefined || args === null) {
      throw new Error(`Invalid input for command '${this.command}': input cannot be null or undefined`)
    }
  }
  
  /**
   * Hook for post-processing results.
   * Override in subclasses for specific post-processing logic.
   */
  protected postProcess(result: Output, context?: CommandContext): Output {
    return result
  }
}
