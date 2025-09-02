import { IsDebuggerActiveResponse, isErrorResponse, StandardCommandResponse } from "@andersonbosa/mcp-debugx-core"
import { WebSocketManager } from "../../server/dependencies/websocket-manager"
import { BaseTool } from "../base-tool"

/**
 * A method decorator that ensures an active DAP session exists before executing the tool's method.
 * It checks for a connection to the IDE and then verifies that a debug session is active.
 *
 * @param target The prototype of the class containing the decorated method. (Unused in this decorator).
 * @param propertyKey The name of the decorated method. (Unused in this decorator).
 * @param descriptor The property descriptor for the decorated method, which contains the original method implementation.
 */
export function withDAPSession<T extends BaseTool & { wsBridge: WebSocketManager }>(
  _target: T,
  _propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const originalMethod = descriptor.value

  // Replace the original method with a new async function
  descriptor.value = async function (this: T, ...args: any[]) {
    if (!this.wsBridge.isExtensionConnected()) {
      throw new Error("IDE extension is not connected.")
    }

    const response: StandardCommandResponse<IsDebuggerActiveResponse> = await this.wsBridge.sendDapRequest('isDebuggerActive', {})

    if (isErrorResponse(response)) {
      throw new Error(`Error checking debugger status: ${response.error}`)
    }

    const isActive = response.data?.isActive ?? false
    if (!isActive) {
      throw new Error("No active debug session found.")
    }

    return originalMethod.apply(this, args)
  }

  return descriptor
}
