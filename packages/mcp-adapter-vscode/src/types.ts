// packages/dap-bridge-extension/src/types.ts

// Re-export all common types from core-bridge
export * from '@andersonbosa/core-bridge'

export interface DapRequestMessage {
  type: 'dap_request';
  request_id: string;
  command: string;
  args: any;
}

export interface IdeRequestMessage {
  type: 'ide_command';
  request_id: string;
  command: string;
  args: any;
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
