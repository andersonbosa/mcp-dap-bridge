export * from '@andersonbosa/mcp-debug-ex-core'
import * as vscode from 'vscode'
import { StandardCommandResponse } from '@andersonbosa/mcp-debug-ex-core'
export interface DapRequestMessage<Args = any> {
  type: 'dap_request';
  request_id: string;
  command: string;
  args: Args;
}

export interface IdeRequestMessage<Args = any> {
  type: 'ide_command';
  request_id: string;
  command: string;
  args: Args;
}

export interface DapResponseMessage {
  type: 'dap_response';
  request_id: string;
  body: any;
}


/**
 * Interface for a handler that executes a specific IDE command.
 */
export interface IdeCommandHandler<Input, Output> {
  execute(args: Input): Promise<Output>
}

/**
 * Interface for a handler that executes a specific DAP command.
 */
export interface DapCommandHandler<Input, Output> {
  /**
   * The name of the DAP command this handler can process.
   */
  readonly command: string

  /**
   * Executes the command logic.
   * @param session The active debug session, which can be undefined for some commands.
   * @param message The DAP request message, with typed arguments.
   * @returns A promise that resolves with a StandardCommandResponse containing data and metadata.
   */
  handle(session: vscode.DebugSession | undefined, message: DapRequestMessage<Input>): Promise<StandardCommandResponse<Output>>
}
