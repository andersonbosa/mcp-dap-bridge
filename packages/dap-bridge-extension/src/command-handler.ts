// packages/dap-bridge-extension/src/command-handler.ts

import * as vscode from 'vscode'
import { CommandResponseFactory } from './command-response-factory'
import {
  DapRequestMessage,
  DefaultCommandResponse,
  IsDebuggerActiveResponse,
  SetBreakpointsInFilesResponse,
  StandardCommandResponse
} from './types'

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

/**
 * A handler for DAP commands that require an active debug session.
 */
class DefaultCommandHandler implements CommandHandler<DefaultCommandResponse> {
  constructor(readonly command: string) { }

  async handle(session: vscode.DebugSession | undefined, message: DapRequestMessage): Promise<StandardCommandResponse<DefaultCommandResponse>> {
    const startTime = Date.now()

    if (!session) {
      throw new Error("No active debug session found for this command.")
    }

    const result = await session.customRequest(message.command, message.args)

    return CommandResponseFactory.createWithDebugSession(
      result,
      session.id,
      startTime
    )
  }
}

/**
 * A specialized handler for the 'setBreakpoints' command, which requires
 * grouping breakpoints by file before sending them to the debug adapter.
 */
class SetBreakpointsInFilesHandler implements CommandHandler<SetBreakpointsInFilesResponse> {
  readonly command = 'setBreakpointsInFiles';

  async handle(session: vscode.DebugSession | undefined, message: DapRequestMessage): Promise<StandardCommandResponse<SetBreakpointsInFilesResponse>> {
    const startTime = Date.now()

    if (!session) {
      throw new Error("No active debug session found for setting breakpoints.")
    }
    const locations = message.args.locations as { file: string; line: number }[]

    if (!locations) {
      throw new Error("The 'setBreakpointsInFiles' command requires a 'locations' argument.")
    }

    const breakpointsByFile = locations.reduce((acc, loc) => {
      if (!acc[loc.file]) {
        acc[loc.file] = []
      }
      acc[loc.file].push({ line: loc.line })
      return acc
    }, {} as Record<string, { line: number }[]>)

    const setBreakpointPromises = Object.entries(breakpointsByFile).map(async ([filePath, breakpoints]) => {
      if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
        throw new Error('No workspace folder is open.')
      }
      const workspaceFolder = vscode.workspace.workspaceFolders[0]
      const sourcePath = vscode.Uri.joinPath(workspaceFolder.uri, filePath).fsPath

      console.log(`[CommandHandler] Setting breakpoints for ${sourcePath}`, breakpoints)

      return session.customRequest('setBreakpoints', {
        source: { path: sourcePath },
        breakpoints: breakpoints,
      })
    })

    const results = await Promise.all(setBreakpointPromises)
    console.log('[CommandHandler] All setBreakpoints requests finished.', results)

    return CommandResponseFactory.createWithDebugSession(
      { results },
      session.id,
      startTime,
      {
        filesProcessed: Object.keys(breakpointsByFile).length,
        totalBreakpoints: locations.length
      }
    )
  }
}

/**
 * A specialized handler to check if a debugger session is currently active.
 * This handler does not require an active session to begin with.
 */
class IsDebuggerActiveHandler implements CommandHandler<IsDebuggerActiveResponse> {
  readonly command = 'isDebuggerActive';

  async handle(session: vscode.DebugSession | undefined): Promise<StandardCommandResponse<IsDebuggerActiveResponse>> {
    const startTime = Date.now()
    console.log(`[CommandHandler][${this.command}] Checking for active debug session...`)
    const isActive = !!session

    return CommandResponseFactory.createWithoutDebugSession({ isActive }, startTime, session?.id)
  }
}

/**
 * A specialized handler to list all active breakpoints.
 */
class ListBreakpointsHandler implements CommandHandler<any> {
  readonly command = 'listBreakpoints';

  async handle(session: vscode.DebugSession | undefined): Promise<StandardCommandResponse<any>> {
    const startTime = Date.now()
    console.log(`[CommandHandler][${this.command}] Listing active breakpoints...`)

    const allBreakpoints = vscode.debug.breakpoints
    const breakpointsByFile = allBreakpoints.reduce((acc, bp) => {
      if (bp instanceof vscode.SourceBreakpoint) {
        const filePath = bp.location.uri.fsPath
        if (!acc[filePath]) {
          acc[filePath] = []
        }
        acc[filePath].push({
          line: bp.location.range.start.line + 1,
          enabled: bp.enabled,
          condition: bp.condition,
          hitCondition: bp.hitCondition,
          logMessage: bp.logMessage,
        })
      }
      return acc
    }, {} as Record<string, any[]>)

    return CommandResponseFactory.createWithoutDebugSession({ breakpoints: breakpointsByFile }, startTime, session?.id)
  }
}


/**
 * Manages and dispatches DAP command handlers.
 */
export class CommandManager {
  private handlers: Map<string, CommandHandler> = new Map();

  constructor() {
    this.register(new SetBreakpointsInFilesHandler())
    this.register(new IsDebuggerActiveHandler())
    this.register(new ListBreakpointsHandler())
  }

  /**
   * Registers a new command handler.
   * @param handler The handler to register.
   */
  register(handler: CommandHandler) {
    this.handlers.set(handler.command, handler)
    console.log(`[CommandManager] Registered handler for command: ${handler.command}`)
  }

  /**
   * Finds the appropriate handler for a given command.
   * If no specific handler is found, it returns a default handler.
   * @param command The name of the command.
   * @returns The resolved CommandHandler.
   */
  getHandler(command: string): CommandHandler {
    return this.handlers.get(command) || new DefaultCommandHandler(command)
  }
}

