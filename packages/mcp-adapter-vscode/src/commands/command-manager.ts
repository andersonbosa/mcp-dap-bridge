import { logger } from "@andersonbosa/mcp-debugx-core"
import { Command, CommandContext } from "../types"
import { IsDebuggerActiveCommand } from "./is-debugger-active.command"
import { ListBreakpointsCommand } from "./list-breakpoints.command"
import { RemoveBreakpointsCommand } from "./remove-breakpoints.command"
import { SetBreakpointsInFilesCommand } from "./set-breakpoints-in-files.command"
import { SetBreakpointsCommand } from "./set-breakpoints.command"

/**
 * Centralized command handler manager that supports unified Command interface.
 * Uses composition and decorator patterns to handle different command types.
 */
export class CommandManager {
  private handlers: Map<string, Command<any, any>> = new Map()

  constructor() {
    this.initializeHandlers()
  }

  /**
   * Registers a new command handler.
   * @param handler The handler to register.
   */
  public register(handlers: Command | Command[]) {
    handlers = Array.isArray(handlers) ? handlers : [handlers]
    for (const handler of handlers) {
      this.handlers.set(handler.command, handler)
      logger.info(`[${this.constructor.name}] Registered handler for command: ${handler.command}`)
    }
  }

  /**
   * Finds the appropriate handler for a given command.
   * If no specific handler is found, it returns undefined.
   * @param command The name of the command.  
   * @returns The resolved Command.
   */
  public getHandler(command: string): Command<any, any> | undefined {
    return this.handlers.get(command)
  }

  /**
   * Executes a command with the provided arguments and context.
   * @param command The name of the command to execute.
   * @param args The arguments to pass to the command.
   * @param context Optional execution context.
   * @returns The result of command execution.
   */
  public async executeCommand<Input, Output>(command: string, args: Input, context?: CommandContext): Promise<Output> {
    const handler = this.getHandler(command)
    if (!handler) {
      throw new Error(`No handler found for command: ${command}`)
    }

    try {
      logger.info(`[${this.constructor.name}] Executing command: ${command}`)
      const result = await handler.execute(args, context)
      logger.info(`[${this.constructor.name}] Command executed successfully: ${command}`)
      return result
    } catch (error) {
      logger.error(`[${this.constructor.name}] Command execution failed: ${command}`, error)
      throw error
    }
  }

  /**
   * Lists all registered commands.
   * @returns Array of command names.
   */
  public getRegisteredCommands(): string[] {
    return Array.from(this.handlers.keys())
  }

  /**
   * Checks if a command is registered.
   * @param command The command name to check.
   * @returns True if the command is registered, false otherwise.
   */
  public hasCommand(command: string): boolean {
    return this.handlers.has(command)
  }

  /**
   * Gets commands by category.
   * @param category The category of commands to retrieve.
   * @returns Array of command names in the specified category.
   */
  public getCommandsByCategory(category: 'dap' | 'ide' | 'native'): string[] {
    const allCommands = this.getRegisteredCommands()

    switch (category) {
      case 'dap':
        return allCommands.filter(cmd =>
          cmd === 'setBreakpointsInFiles' ||
          cmd === 'isDebuggerActive' ||
          cmd === 'listBreakpoints'
        )
      case 'ide':
        return allCommands.filter(cmd =>
          cmd.startsWith('breakpoints/') // IDE commands use namespaced format
        )
      case 'native':
        return allCommands.filter(cmd =>
          !cmd.startsWith('breakpoints/') &&
          cmd !== 'setBreakpointsInFiles' &&
          cmd !== 'isDebuggerActive' &&
          cmd !== 'listBreakpoints'
        )
      default:
        return []
    }
  }

  /**
   * Executes a command with automatic context detection.
   * Automatically adds appropriate session context based on command type.
   * @param command The name of the command to execute.
   * @param args The arguments to pass to the command.
   * @param baseContext Optional base context to extend.
   * @returns The result of command execution.
   */
  public async executeCommandWithAutoContext<Input, Output>(
    command: string,
    args: Input,
    baseContext?: CommandContext
  ): Promise<Output> {
    // Auto-detect if this is a DAP command that might need session
    const isDapCommand = this.getCommandsByCategory('dap').includes(command)

    let context = baseContext || {}

    if (isDapCommand && !context.session) {
      // Automatically provide the active debug session for DAP commands
      const activeSession = await this.getActiveDebugSession()
      context = {
        ...context,
        session: activeSession,
        metadata: {
          ...context.metadata,
          autoContext: true,
          commandCategory: 'dap'
        }
      }
    }

    return this.executeCommand(command, args, context)
  }

  /**
   * Gets the currently active debug session.
   * @returns The active debug session or undefined.
   */
  private async getActiveDebugSession() {
    // This method would be imported from vscode, but to avoid circular dependencies
    // we'll just return a placeholder for now
    // In real implementation: return vscode.debug.activeDebugSession
    return undefined
  }

  /**
   * Initializes all command handlers.
   * Handlers now implement the unified Command interface.
   */
  private initializeHandlers() {
    const handlers: Command<any, any>[] = [
      // DAP Commands - for debugging session interactions
      new SetBreakpointsInFilesCommand(),
      new IsDebuggerActiveCommand(),
      new ListBreakpointsCommand(),

      // IDE Commands - for VS Code IDE interactions
      new ListBreakpointsCommand(),
      new SetBreakpointsCommand(),
      new RemoveBreakpointsCommand()
    ]

    this.register(handlers)
  }
}