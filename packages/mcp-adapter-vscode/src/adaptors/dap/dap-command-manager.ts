import { logger } from '../../utils/logger'
import { DapCommandHandler } from '../../types'
import { CustomVSCodeDAPHandler } from './handlers/custom-vscode-dap-handler'
import { IsDebuggerActiveHandler } from './handlers/is-debugger-active-handler'
import { ListBreakpointsHandler } from './handlers/list-breakpoints-handler'
import { SetBreakpointsInFilesHandler } from './handlers/set-breakpoints-in-files-handler'

/**
 * Manages and dispatches DAP command handlers.
 */
export class DapCommandManager {
  private handlers: Map<string, DapCommandHandler<any, any>> = new Map();

  constructor() {
    this.register(new SetBreakpointsInFilesHandler())
    this.register(new IsDebuggerActiveHandler())
    this.register(new ListBreakpointsHandler())
  }

  /**
   * Registers a new command handler.
   * @param handler The handler to register.
   */
  register(handler: DapCommandHandler<any, any>) {
    this.handlers.set(handler.command, handler)
    logger.info(`[DapCommandManager] Registered handler for command: ${handler.command}`)
  }

  /**
   * Finds the appropriate handler for a given command.
   * If no specific handler is found, it returns a default handler.
   * @param command The name of the command.
   * @returns The resolved CommandHandler.
   */
  getHandler(command: string): DapCommandHandler<any, any> {
    return this.handlers.get(command) || new CustomVSCodeDAPHandler(command)
  }
}

