// packages/dap-bridge-extension/src/types.ts

/**
 * Represents a generic message body for DAP responses.
 */
export interface DapResponseBody {
  [key: string]: any;
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
  error: string;
}

/**
 * Base interface for messages exchanged between the extension and the MCP server.
 */
export interface BaseMessage {
  type: string;
}

/**
 * Represents a DAP request message sent from the MCP server to the extension.
 */
export interface DapRequestMessage extends BaseMessage {
  type: 'dap_request';
  request_id: string;
  command: string;
  args: { [key: string]: any };
}

/**
 * Represents a DAP response message sent from the extension to the MCP server.
 */
export interface DapResponseMessage extends BaseMessage {
  type: 'dap_response';
  request_id: string;
  body: SuccessDapResponseBody | ErrorDapResponseBody;
}

