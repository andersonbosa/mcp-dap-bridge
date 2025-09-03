import { logger } from '@andersonbosa/mcp-debugx-core'
import * as vscode from 'vscode'
import { IdeCommandHandler, BaseCommand, CommandContext } from '../types'

type VSCodeLocationsByFile = { [uri: string]: vscode.Location[] }

type SetBreakpointsHandlerInput = {
  locations: { file: string; line: number }[]
}

type SetBreakpointsHandlerOutput = {
  totalSet: number
  fileCount: number
}

/**
 * Handles the 'breakpoints/set' command by adding breakpoints at the specified locations.
 * Now extends BaseCommand for unified command interface.
 */
export class SetBreakpointsCommand extends BaseCommand<SetBreakpointsHandlerInput, SetBreakpointsHandlerOutput> implements IdeCommandHandler<SetBreakpointsHandlerInput, SetBreakpointsHandlerOutput> {
  readonly command = 'breakpoints/set'
  async execute(input: SetBreakpointsHandlerInput, context?: CommandContext): Promise<SetBreakpointsHandlerOutput> {
    this.validateInput(input)
    
    const { locations } = input
    if (!locations || locations.length === 0) {
      throw new Error("At least one location must be provided to set breakpoints.")
    }

    const locationsByFile = await this._groupLocationsByFile(locations)
    const { totalSet, fileCount } = this._addBreakpointsToVSCode(locationsByFile)

    return this.postProcess({ totalSet, fileCount }, context)
  }

  private async _groupLocationsByFile(locations: { file: string; line: number }[]): Promise<VSCodeLocationsByFile> {
    const locationsByFile: VSCodeLocationsByFile = {}

    for (const loc of locations) {
      const uris = await vscode.workspace.findFiles(`**/${loc.file}`, undefined, 1)
      if (uris.length < 1) {
        logger.warn(`[${this.constructor.name}] File not found: ${loc.file}`)
        continue
      }

      const fileUri = uris[0]
      const uriString = fileUri.toString()
      if (!locationsByFile[uriString]) {
        locationsByFile[uriString] = []
      }
      locationsByFile[uriString].push(
        new vscode.Location(fileUri, new vscode.Position(loc.line - 1, 0))
      )
    }
    return locationsByFile
  }

  private _addBreakpointsToVSCode(locationsByFile: VSCodeLocationsByFile): { totalSet: number; fileCount: number } {
    let totalSet = 0
    const fileCount = Object.keys(locationsByFile).length

    for (const uriString in locationsByFile) {
      const fileLocations = locationsByFile[uriString]
      const newBreakpoints = fileLocations.map(loc => new vscode.SourceBreakpoint(loc))
      vscode.debug.addBreakpoints(newBreakpoints)
      totalSet += newBreakpoints.length
    }

    return { totalSet, fileCount }
  }
}
