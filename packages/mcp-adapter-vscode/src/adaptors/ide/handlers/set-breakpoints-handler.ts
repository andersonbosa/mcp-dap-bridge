import * as vscode from 'vscode'
import { IdeCommandHandler } from "../../../types"

/**
 * Handles the 'breakpoints/set' command by adding breakpoints at the specified locations.
 */
export class SetBreakpointsHandler implements IdeCommandHandler {
  async execute(args: { locations: { file: string; line: number }[] }): Promise<any> {
    const { locations } = args
    if (!locations || locations.length === 0) {
      throw new Error("At least one location must be provided to set breakpoints.")
    }

    // Group breakpoints by file
    const locationsByFile = locations.reduce((acc, loc) => {
      if (!acc[loc.file]) {
        acc[loc.file] = []
      }
      acc[loc.file].push(new vscode.Location(vscode.Uri.file(loc.file), new vscode.Position(loc.line - 1, 0)))
      return acc
    }, {} as { [file: string]: vscode.Location[] })

    let totalSet = 0
    const fileCount = Object.keys(locationsByFile).length

    // Add breakpoints for each file
    for (const file in locationsByFile) {
      const fileLocations = locationsByFile[file]
      const newBreakpoints = fileLocations.map(loc => new vscode.SourceBreakpoint(loc))
      vscode.debug.addBreakpoints(newBreakpoints)
      totalSet += newBreakpoints.length
    }

    return { totalSet, fileCount }
  }
}
