import * as vscode from 'vscode'
import { CommandResponseFactory } from '../core/command-response-factory'
import { DapRequestMessage, SetBreakpointsInFilesResponse, StandardCommandResponse } from '../types'
import { BaseCommand, CommandContext } from '../types'
import { logger } from '../utils/logger'

type SetBreakpointsInFilesHandlerInput = {
  locations: {
    file: string
    line: number
  }[]
}

type SetBreakpointsInFilesHandlerOutput = SetBreakpointsInFilesResponse

/**
 * A specialized handler for the 'setBreakpoints' command, which requires
 * grouping breakpoints by file before sending them to the debug adapter.
 * Now extends BaseCommand for unified command interface.
 */
export class SetBreakpointsInFilesCommand extends BaseCommand<SetBreakpointsInFilesHandlerInput, StandardCommandResponse<SetBreakpointsInFilesResponse>> {
  readonly command = 'setBreakpointsInFiles';

  async execute(args: SetBreakpointsInFilesHandlerInput, context?: CommandContext): Promise<StandardCommandResponse<SetBreakpointsInFilesResponse>> {
    this.validateInput(args)
    const startTime = Date.now()
    const session = context?.session as vscode.DebugSession | undefined

    if (!session) {
      throw new Error("No active debug session found for setting breakpoints.")
    }
    const { locations } = args

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

      logger.debug(`[${this.constructor.name}] Setting breakpoints for ${sourcePath}`, breakpoints)

      return session.customRequest('setBreakpoints', {
        source: { path: sourcePath },
        breakpoints: breakpoints,
      })
    })

    const results = await Promise.all(setBreakpointPromises)
    logger.info(`[${this.constructor.name}] All setBreakpoints requests finished.`)

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

  // Legacy DAP handler method for backward compatibility
  async handle(session: vscode.DebugSession | undefined, message: DapRequestMessage<SetBreakpointsInFilesHandlerInput>): Promise<StandardCommandResponse<SetBreakpointsInFilesHandlerOutput>> {
    return this.execute(message.args, {
      session,
      requestId: message.request_id,
      metadata: { isDapLegacy: true }
    })
  }
}
