import type { Server } from '@modelcontextprotocol/sdk/server/index.js'

export type ServerTransport = 'stdio' | 'http'
export interface ServerConfig {
  SERVER_NAME: string
  SERVER_VERSION: string
  SERVER_TRANSPORT: ServerTransport
  SERVER_TOOLS_DISABLED: string[]
  HTTP_PORT: number
  LOG_LEVEL: string
  MCP_PORT: number
  WS_PORT: number
}

/**
 * Base interface for all MCP Server transport decorators.
 * Each decorator must implement this interface to ensure consistency.
 */
export interface MCPServerTransport {
  /**
   * Starts the server with the specific transport.
   */
  start(): Promise<void>

  /**
   * Returns the MCP Server instance.
   */
  getServer(): Server

  /**
   * Returns the current server configuration.
   */
  getConfig(): ServerConfig
}

export interface ToolResponseContent {
  type: string
  [key: string]: any
}

export interface ToolResponse {
  content: ToolResponseContent[]
  // Add other top-level fields if the MCP client supports them, e.g.:
  // metadata?: Record<string, any>;
}

export interface FactoryPattern<T> {
  create(): T | T[]
}

/**
 * This file contains the TypeScript interfaces for Tool Results as defined by the
 * Model Context Protocol (MCP) specification. These interfaces are used as Data Transfer
 * Objects (DTOs) for tool outputs.
 *
 * @see https://modelcontextprotocol.io/specification/2025-06-18/server/tools#data-types
 */

/**
 * Defines optional metadata for content items, resources, and prompts.
 * Based on the MCP specification for Annotations.
 */
export interface Annotations {
  /**
   * Specifies the intended audience for the content (e.g., "user", "assistant").
   */
  audience?: string[]
  /**
   * A number between 0.0 and 1.0 indicating the importance of the content.
   */
  priority?: number
  /**
   * An ISO 8601 timestamp indicating when the content was last modified.
   */
  lastModified?: string
}

/**
 * Represents textual content in a tool result.
 * @see https://modelcontextprotocol.io/specification/2025-06-18/server/tools#text-content
 */
export interface TextContent {
  type: 'text'
  text: string
  annotations?: Annotations
}

/**
 * Represents image content in a tool result, typically base64-encoded.
 * @see https://modelcontextprotocol.io/specification/2025-06-18/server/tools#image-content
 */
export interface ImageContent {
  type: 'image'
  /**
   * The base64-encoded image data.
   */
  data: string
  /**
   * The MIME type of the image (e.g., "image/png", "image/jpeg").
   */
  mimeType: string
  annotations?: Annotations
}

/**
 * Represents audio content in a tool result, typically base64-encoded.
 * @see https://modelcontextprotocol.io/specification/2025-06-18/server/tools#audio-content
 */
export interface AudioContent {
  type: 'audio'
  /**
   * The base64-encoded audio data.
   */
  data: string
  /**
   * The MIME type of the audio (e.g., "audio/wav", "audio/mpeg").
   */
  mimeType: string
  annotations?: Annotations
}

/**
 * Represents a link to a resource, providing context or additional data.
 * @see https://modelcontextprotocol.io/specification/2025-06-18/server/tools#resource-links
 */
export interface ResourceLink {
  type: 'resource_link'
  /**
   * The URI of the resource (e.g., "file:///path/to/file.ts").
   */
  uri: string
  /**
   * An optional human-readable name for the resource link.
   */
  name?: string
  /**
   * An optional description of the resource link.
   */
  description?: string
  /**
   * The MIME type of the resource.
   */
  mimeType?: string
  annotations?: Annotations
}

/**
 * Defines the structure of a full resource that can be embedded in a tool result.
 */
export interface Resource {
  uri: string
  title?: string
  mimeType: string
  text?: string
  annotations?: Annotations
}

/**
 * Represents an embedded resource within a tool result.
 * @see https://modelcontextprotocol.io/specification/2025-06-18/server/tools#embedded-resources
 */
export interface EmbeddedResource {
  type: 'resource'
  resource: Resource
  annotations?: Annotations
}

/**
 * A union type representing any of the possible unstructured content types
 * that can be returned in a tool result.
 */
export type Content = TextContent | ImageContent | AudioContent | ResourceLink | EmbeddedResource

/**
 * Represents the complete result of a tool execution, as defined by the MCP specification.
 * A result can contain unstructured content, structured content, or both.
 * @see https://modelcontextprotocol.io/specification/2025-06-18/server/tools#tool-result
 */
export interface ToolResult {
  /**
   * An array of unstructured content items (e.g., text, images, resource links).
   */
  content: Content[]
  /**
   * An optional JSON object containing structured data that conforms to the tool's `outputSchema`.
   */
  structuredContent?: Record<string, any>
  /**
   * A boolean flag indicating whether the tool execution resulted in an error.
   * If true, the content should describe the error.
   */
  isError?: boolean
}
