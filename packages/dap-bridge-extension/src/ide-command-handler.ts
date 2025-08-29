import * as vscode from 'vscode';
import { logger } from './logger';

/**
 * Interface for a handler that executes a specific IDE command.
 */
interface IdeCommandHandler {
  execute(args: any): Promise<any>;
}

/**
 * Handles the 'breakpoints/list' command by retrieving all active breakpoints
 * from the VS Code debug session.
 */
class ListBreakpointsHandler implements IdeCommandHandler {
  async execute(): Promise<any> {
    const breakpoints = vscode.debug.breakpoints;
    const breakpointsByFile: { [key: string]: { line: number; verified: boolean }[] } = {};

    for (const bp of breakpoints) {
      if (bp instanceof vscode.SourceBreakpoint) {
        const path = bp.location.uri.fsPath;
        if (!breakpointsByFile[path]) {
          breakpointsByFile[path] = [];
        }
        breakpointsByFile[path].push({
          line: bp.location.range.start.line + 1, // VS Code is 0-indexed, DAP is 1-indexed
          verified: true, // TODO: Find a way to check if a breakpoint is verified
        });
      }
    }
    return { breakpointsByFile };
  }
}

/**
 * Manages and routes IDE commands to their respective handlers.
 */
export class IdeCommandManager {
  private handlers: Map<string, IdeCommandHandler> = new Map();

  constructor() {
    this.registerHandlers();
  }

  private registerHandlers(): void {
    this.handlers.set('breakpoints/list', new ListBreakpointsHandler());
    // Register other handlers here
  }

  /**
   * Executes the appropriate handler for a given command.
   * @param command The command to execute (e.g., 'breakpoints/list').
   * @param args The arguments for the command.
   * @returns A promise that resolves with the result of the command.
   */
  async handle(command: string, args: any): Promise<any> {
    const handler = this.handlers.get(command);
    if (handler) {
      logger.info(`[IdeCommandManager] Executing handler for command: ${command}`);
      return handler.execute(args);
    }
    throw new Error(`No handler registered for IDE command: ${command}`);
  }
}
