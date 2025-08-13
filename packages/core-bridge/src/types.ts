// packages/core-bridge/src/types.ts

/**
 * Standard response format for all CommandHandlers.
 * Provides a consistent structure with data payload and optional metadata.
 */
export interface StandardCommandResponse<T = any> {
  /**
   * The main response data from the command execution.
   */
  data: T

  /**
   * Optional metadata about the command execution (timing, debug info, etc.).
   */
  metadata?: {
    sessionId?: string;
    [key: string]: any
  }
}

/**
 * Represents a generic message body for DAP responses.
 */
export interface DapResponseBody {
  [key: string]: any
}

/**
 * Represents a successful DAP response body.
 */
export interface SuccessDapResponseBody extends DapResponseBody {
  // It can contain any properties returned by the DAP request.
}

/**
 * Represents a DAP response body containing an error.
 */
export interface ErrorDapResponseBody extends DapResponseBody {
  error: string
}

/**
 * Base interface for messages exchanged between the extension and the MCP server.
 */
export interface BaseMessage {
  type: string
}

/**
 * Represents a DAP request message sent from the MCP server to the extension.
 */
export interface DapRequestMessage extends BaseMessage {
  type: 'dap_request'
  request_id: string
  command: string
  args: { [key: string]: any }
}

/**
 * Represents a DAP response message sent from the extension to the MCP server.
 */
export interface DapResponseMessage extends BaseMessage {
  type: 'dap_response'
  request_id: string
  body: SuccessDapResponseBody | ErrorDapResponseBody
}

// ====== Specific Response Types for CommandHandlers ======

/**
 * Response type for the IsDebuggerActive command.
 */
export interface IsDebuggerActiveResponse {
  isActive: boolean
}

/**
 * Response type for the SetBreakpointsInFiles command.
 */
export interface SetBreakpointsInFilesResponse {
  results: any[]
}

/**
 * Response type for default DAP commands that are passed through.
 */
export interface DefaultCommandResponse {
  [key: string]: any
}

/**
 * Standard error response format
 */
export interface ErrorResponse {
  error: string
  code?: string
  details?: any
}

/**
 * Type guard to check if a response has an error
 */
export function isErrorResponse(response: any): response is ErrorResponse {
  return response && typeof response.error === 'string'
}

/**
 * Type guard to check if a response follows StandardCommandResponse format
 */
export function isStandardCommandResponse<T>(response: any): response is StandardCommandResponse<T> {
  return response && typeof response.data !== 'undefined'
}
