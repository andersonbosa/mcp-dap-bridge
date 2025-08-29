import { WebSocketManager } from "../../server/dependencies/websocket-manager"
import { BaseTool } from "../base-tool";

/**
 * A method decorator that ensures a connection to the IDE extension is active before executing.
 * If the connection is not active, it throws an error.
 *
 * @param target The prototype of the class containing the decorated method. (Unused in this decorator).
 * @param propertyKey The name of the decorated method. (Unused in this decorator).
 * @param descriptor The property descriptor for the decorated method, which contains the original method implementation.
 */
export function withIDE<T extends BaseTool & { wsBridge: WebSocketManager }>(
  _target: T,
  _propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const originalMethod = descriptor.value;

  // Replace the original method with a new function
  descriptor.value = function (this: T, ...args: any[]) {
    if (!this.wsBridge.isExtensionConnected()) {
      throw new Error("IDE extension is not connected.");
    }
    return originalMethod.apply(this, args);
  };

  return descriptor;
}
