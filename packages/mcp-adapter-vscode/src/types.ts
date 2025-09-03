export * from '@andersonbosa/mcp-debugx-core'
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
