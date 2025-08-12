import { WebSocketServer, WebSocket } from "ws"
import { v4 as uuidv4 } from "uuid"
import { logger } from "../../utils/logger"

export class WebSocketBridge {
  private wsServer: WebSocketServer
  private extensionSocket: WebSocket | null = null;
  private pendingDapRequests = new Map<string, (response: any) => void>();

  constructor(private port: number) {
    this.wsServer = new WebSocketServer({ port })
    this.setupConnections()
  }

  private setupConnections(): void {
    this.wsServer.on("connection", (ws) => {
      logger.info("[WebSocket] VS Code extension connected!")
      this.extensionSocket = ws

      ws.on("message", (data: Buffer) => this.handleMessage(data))

      ws.on("close", () => {
        logger.info("[WebSocket] VS Code extension disconnected.")
        this.extensionSocket = null
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
    }
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

  public close(): void {
    this.wsServer.close()
  }
}
