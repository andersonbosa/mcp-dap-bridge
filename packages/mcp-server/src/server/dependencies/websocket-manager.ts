import { v4 as uuidv4 } from "uuid"
import { WebSocket, WebSocketServer } from "ws"
import { logger } from "@andersonbosa/mcp-debugx-core"

/**
 * Manages the WebSocket communication bridge between the MCP server and the IDE extension.
 * This class is responsible for creating a WebSocket server, handling the connection
 * from a single extension client, and facilitating the sending and receiving of

 * Debug Adapter Protocol (DAP) messages.
 */
export class WebSocketManager {
  private wsServer: WebSocketServer
  private extensionSocket: WebSocket | null = null;
  private pendingDapRequests = new Map<string, (response: any) => void>();
  private pendingIdeRequests = new Map<string, (response: any) => void>();

  constructor(private port: number) {
    this.wsServer = new WebSocketServer({ port })
    this.setupConnections()
  }

  public isExtensionConnected(): boolean {
    return this.extensionSocket !== null && this.extensionSocket.readyState === WebSocket.OPEN
  }

  public close(): void {
    this.wsServer.close()
  }

  public sendDapRequest(command: string, args: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.extensionSocket) {
        return reject(new Error("VS Code extension is not connected."))
      }

      const request_id = uuidv4()
      const payload = {
        type: "dap_request",
        request_id,
        command,
        args,
      }

      this.pendingDapRequests.set(request_id, resolve)

      setTimeout(() => {
        if (this.pendingDapRequests.has(request_id)) {
          this.pendingDapRequests.delete(request_id)
          reject(
            new Error(
              `Timeout: No response for request ${command} in 5 seconds.`
            )
          )
        }
      }, 5000)

      logger.info(`[WebSocket] Sending DAP request to extension: ${command}`)
      this.extensionSocket.send(JSON.stringify(payload))
    })
  }

  public sendIDECommand(command: string, args: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.isExtensionConnected()) {
        return reject(new Error("VS Code extension is not connected."))
      }

      const request_id = uuidv4()
      const payload = {
        type: "ide_command",
        request_id,
        command,
        args,
      }

      this.pendingIdeRequests.set(request_id, resolve)

      setTimeout(() => {
        if (this.pendingIdeRequests.has(request_id)) {
          this.pendingIdeRequests.delete(request_id)
          reject(new Error(`Timeout: No response for IDE command ${command} in 5 seconds.`))
        }
      }, 5000)

      logger.info(`[WebSocket] Sending IDE command to extension: ${command}`)
      this.extensionSocket!.send(JSON.stringify(payload))
    })
  }

  private setupConnections(): void {
    this.wsServer.on("connection", (ws) => {
      const connectionId = uuidv4()
      logger.info(`[WebSocket] IDE extension connected: ${connectionId}`)
      this.extensionSocket = ws

      ws.on("message", (data: Buffer) => this.handleMessage(data))

      ws.on("close", () => {
        logger.info(`[WebSocket] IDE extension disconnected: ${connectionId}`)
        if (this.extensionSocket === ws) {
          this.extensionSocket = null
        }
      })
    })

    logger.info(`[WebSocket] Server listening for extension on port ${this.port}`)
  }

  private handleMessage(data: Buffer): void {
    const message = JSON.parse(data.toString())
    logger.info("[WebSocket] Message from extension:", message)

    if (
      message.type === "dap_response" &&
      this.pendingDapRequests.has(message.request_id)
    ) {
      const resolve = this.pendingDapRequests.get(message.request_id)
      if (resolve) {
        resolve(message.body)
        this.pendingDapRequests.delete(message.request_id)
      }
    } else if (
      message.type === "ide_response" &&
      this.pendingIdeRequests.has(message.request_id)
    ) {
      const resolve = this.pendingIdeRequests.get(message.request_id)
      if (resolve) {
        resolve(message.body)
        this.pendingIdeRequests.delete(message.request_id)
      }
    }
  }
}
