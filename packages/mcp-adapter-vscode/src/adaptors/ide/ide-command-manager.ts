import { logger } from '../../utils/logger'
import { ListBreakpointsHandler } from './handlers/list-breakpoints-handler'
import { RemoveBreakpointsHandler } from './handlers/remove-breakpoints-handler'
import { SetBreakpointsHandler } from './handlers/set-breakpoints-handler'
import { IdeCommandHandler } from '../../types'


/**
 * Manages and routes IDE commands to their respective handlers.
 */
export class IdeCommandManager {
  private handlers: Map<string, IdeCommandHandler<any, any>> = new Map();

  constructor() {
    this.registerHandlers()
  }

  private registerHandlers(): void {
    this.handlers.set('breakpoints/list', new ListBreakpointsHandler())
    this.handlers.set('breakpoints/set', new SetBreakpointsHandler())
    this.handlers.set('breakpoints/remove', new RemoveBreakpointsHandler())
  }

  /**
   * Executes the appropriate handler for a given command.
   * @param command The command to execute (e.g., 'breakpoints/list').
   * @param args The arguments for the command.
   * @returns A promise that resolves with the result of the command.
   */
  async handle(command: string, args: any): Promise<any> {
    const handler = this.handlers.get(command)
    if (handler) {
      logger.info(`[IdeCommandManager] Executing handler for command: ${command}`)
      return handler.execute(args)
    }
    throw new Error(`No handler registered for IDE command: ${command}`)
  }
}
