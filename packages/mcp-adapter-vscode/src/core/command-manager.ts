import { logger } from "@andersonbosa/mcp-debugx-core"
import { Command, CommandContext } from "../types"
import { ContinueCommand } from "../commands/continue.command"
import { GetStackTraceCommand } from "../commands/get-stack-trace.command"
import { GetThreadInfoCommand } from "../commands/get-thread-info.command"
import { GetVariableValueCommand } from "../commands/get-variable-value.command"
import { IsDebuggerActiveCommand } from "../commands/is-debugger-active.command"
import { ListBreakpointsCommand } from "../commands/list-breakpoints.command"
import { ListLocalVariablesCommand } from "../commands/list-local-variables.command"
import { ListThreadsCommand } from "../commands/list-threads.command"
import { PauseCommand } from "../commands/pause.command"
import { RemoveBreakpointsCommand } from "../commands/remove-breakpoints.command"
import { SetBreakpointsInFilesCommand } from "../commands/set-breakpoints-in-files.command"
import { SetBreakpointsCommand } from "../commands/set-breakpoints.command"
import { SetVariableValueCommand } from "../commands/set-variable-value.command"
import { StepIntoCommand } from "../commands/step-into.command"
import { StepOutCommand } from "../commands/step-out.command"
import { StepOverCommand } from "../commands/step-over.command"

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

    const dapCommands = [
      'isDebuggerActive', 'continue', 'pause', 'stepOver', 'stepInto', 'stepOut',
      'getStackTrace', 'listLocalVariables', 'getVariableValue', 'setVariableValue',
      'listThreads', 'getThreadInfo', 'setBreakpointsInFiles' // legacy
    ]

    const ideCommands = [
      'setBreakpoints', 'removeBreakpoints', 'listBreakpoints'
    ]

    switch (category) {
      case 'dap':
        return allCommands.filter(cmd => dapCommands.includes(cmd))
      case 'ide':
        return allCommands.filter(cmd => ideCommands.includes(cmd))
      case 'native':
        return allCommands.filter(cmd => 
          !dapCommands.includes(cmd) && !ideCommands.includes(cmd)
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
      // Debugger Toolkit (12 tools) - DAP Commands
      new IsDebuggerActiveCommand(),
      new ContinueCommand(),
      new PauseCommand(),
      new StepOverCommand(),
      new StepIntoCommand(),
      new StepOutCommand(),
      new GetStackTraceCommand(),
      new ListLocalVariablesCommand(),
      new GetVariableValueCommand(),
      new SetVariableValueCommand(),
      new ListThreadsCommand(),
      new GetThreadInfoCommand(),

      // IDE Toolkit (3 tools) - IDE Commands
      new SetBreakpointsCommand(),
      new RemoveBreakpointsCommand(),
      new ListBreakpointsCommand(),

      // Legacy DAP Commands (for backward compatibility)
      new SetBreakpointsInFilesCommand()
    ]

    this.register(handlers)
  }
}