import { StandardCommandResponse } from '../types'

/**
 * Factory class for creating standardized CommandHandler responses.
 * Provides a consistent way to build responses with data and metadata.
 */
export class CommandResponseFactory {
  /**
   * Creates a standardized response with the provided data and optional metadata.
   * 
   * @param data - The main response data
   * @param options - Optional configuration for metadata
   * @returns A StandardCommandResponse with consistent structure
   */
  static create<T>(
    data: T,
    options?: {
      sessionId?: string
      additionalMetadata?: Record<string, any>
    }
  ): StandardCommandResponse<T> {
    const response: StandardCommandResponse<T> = {
      data,
      metadata: {
        sessionId: options?.sessionId,
        ...(options?.additionalMetadata || {})
      }
    }
    return response
  }

  /**
   * Creates a response for commands that require an active debug session.
   * Automatically includes session metadata and execution timing.
   * 
   * @param data - The main response data
   * @param sessionId - The debug session ID
   * @param startTime - The command start time for execution timing
   * @param additionalMetadata - Optional additional metadata fields
   * @returns A StandardCommandResponse with session and timing metadata
   */
  static createWithDebugSession<T>(
    data: T,
    sessionId: string,
    startTime: number,
    additionalMetadata?: Record<string, any>
  ): StandardCommandResponse<T> {
    return this.create(data, {
      sessionId,
      additionalMetadata
    })
  }

  /**
   * Creates a response for commands that don't require a debug session.
   * Includes basic timing and optional session info.
   * 
   * @param data - The main response data
   * @param startTime - The command start time for execution timing
   * @param sessionId - Optional session ID (can be undefined)
   * @param additionalMetadata - Optional additional metadata fields
   * @returns A StandardCommandResponse with timing metadata
   */
  static createWithoutDebugSession<T>(
    data: T,
    startTime: number,
    sessionId?: string,
    additionalMetadata?: Record<string, any>
  ): StandardCommandResponse<T> {
    return this.create(data, {
      sessionId,
      additionalMetadata
    })
  }

  /**
   * Creates a simple response with just data and timestamp.
   * Useful for quick responses that don't need extensive metadata.
   * 
   * @param data - The main response data
   * @returns A StandardCommandResponse with minimal metadata
   */
  static createSimple<T>(data: T): StandardCommandResponse<T> {
    return {
      data,
      metadata: {
        timestamp: new Date().toISOString()
      }
    }
  }
}
