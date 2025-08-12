import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js"
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js"
import express from "express"
import http from "http"
import { v4 as uuidv4 } from "uuid"
import { ServerConfig } from "../types"
import { logger } from "../utils/logger"
import { MCPServer } from "./mcp-server"
import { MCPServerTransport } from "../types/index"
import { Server } from "@modelcontextprotocol/sdk/server/index.js"

/**
 * Decorator that adds support for the HTTP transport with streaming to the MCP Server.
 */
export class MCPServerWithStreamableHTTP implements MCPServerTransport {
  private readonly mcpServer: MCPServer
  private readonly transports: { [sessionId: string]: StreamableHTTPServerTransport }
  private readonly expressApp: express.Application
  private readonly httpServer: http.Server

  constructor(mcpServer: MCPServer) {
    this.mcpServer = mcpServer
    this.transports = {}
    this.expressApp = express()
    this.httpServer = http.createServer(this.expressApp)
  }

  public async start(): Promise<void> {
    this.setupMiddleware()
    this.setupRoutes()

    const config = this.getConfig()
    // Bind only to localhost for security as per MCP specification
    this.httpServer.listen(config.HTTP_PORT, "127.0.0.1", () => {
      const address = `http://localhost:${config.HTTP_PORT}`
      logger.info(`MCP Server "${config.SERVER_NAME}" v${config.SERVER_VERSION} running on "${address}" using "Streamable HTTP" transport.`)
    })
  }

    private setupMiddleware(): void {
    this.expressApp.use(express.json())
    
    // Add CORS and security middleware
    this.expressApp.use((req, res, next) => {
      // Set CORS headers for allowed origins
      const origin = req.headers.origin
      const allowedOrigins = [
        'http://localhost:6274', // MCP Inspector
        'http://127.0.0.1:6274',
        'http://localhost:6277', // MCP Inspector proxy
        'http://127.0.0.1:6277',
        `http://localhost:${this.getConfig().HTTP_PORT}`,
        `http://127.0.0.1:${this.getConfig().HTTP_PORT}`,
      ]
      
      if (origin && allowedOrigins.some(allowed => origin.startsWith(allowed))) {
        res.header('Access-Control-Allow-Origin', origin)
        res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
        res.header('Access-Control-Allow-Headers', 'Content-Type, Accept, MCP-Session-Id, MCP-Protocol-Version, Last-Event-ID')
        res.header('Access-Control-Allow-Credentials', 'false')
      }
      
      // Handle preflight requests
      if (req.method === 'OPTIONS') {
        res.status(200).end()
        return
      }
      
      // Validate MCP-Protocol-Version header as per specification
      const protocolVersion = req.headers['mcp-protocol-version'] as string
      if (protocolVersion) {
        // Accept current and supported versions
        const supportedVersions = ['2025-06-18', '2025-03-26']
        if (!supportedVersions.includes(protocolVersion)) {
          res.status(400).json({
            jsonrpc: "2.0",
            error: {
              code: -32000,
              message: `Unsupported MCP protocol version: ${protocolVersion}`,
            },
            id: null,
          })
          return
        }
      }
      
      // DNS rebinding protection - validate Origin header for security
      if (origin && !allowedOrigins.some(allowed => origin.startsWith(allowed))) {
        res.status(403).json({
          jsonrpc: "2.0",
          error: {
            code: -32000,
            message: "Origin not allowed",
          },
          id: null,
        })
        return
      }
      
      next()
    })
  }

  private setupRoutes(): void {
    this.expressApp.post("/mcp", this.handlePostRequest.bind(this))
    this.expressApp.get("/mcp", this.handleSessionRequest.bind(this))
    this.expressApp.delete("/mcp", this.handleSessionRequest.bind(this))
    this.expressApp.options("/mcp", (_req, res) => {
      res.status(200).end()
    })
  }

  private async handlePostRequest(req: express.Request, res: express.Response): Promise<void> {
    // Validate Accept header as per MCP specification
    const acceptHeader = req.headers.accept
    if (!acceptHeader || (!acceptHeader.includes('application/json') || !acceptHeader.includes('text/event-stream'))) {
      res.status(400).json({
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: "Bad Request: Accept header must include both application/json and text/event-stream",
        },
        id: null,
      })
      return
    }

    const sessionId = req.headers["mcp-session-id"] as string | undefined
    let transport: StreamableHTTPServerTransport

    if (sessionId && this.transports[sessionId]) {
      transport = this.transports[sessionId]
    } else if (!sessionId && isInitializeRequest(req.body)) {
      transport = await this.createNewTransport()
    } else if (sessionId && !this.transports[sessionId]) {
      // Session not found - client should reinitialize
      res.status(404).json({
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: "Session not found",
        },
        id: null,
      })
      return
    } else {
      res.status(400).json({
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: "Bad Request: No valid session ID provided or not an initialize request",
        },
        id: null,
      })
      return
    }

    await transport.handleRequest(req, res, req.body)
  }

  private async handleSessionRequest(req: express.Request, res: express.Response): Promise<void> {
    const sessionId = req.headers["mcp-session-id"] as string | undefined

    // Handle DELETE request for session termination
    if (req.method === 'DELETE') {
      if (!sessionId) {
        res.status(400).json({
          jsonrpc: "2.0",
          error: {
            code: -32000,
            message: "Missing session ID for DELETE request",
          },
          id: null,
        })
        return
      }

      if (this.transports[sessionId]) {
        delete this.transports[sessionId]
        logger.info(`Session terminated by client: ${sessionId}`)
        res.status(200).send("Session terminated")
        return
      } else {
        res.status(404).json({
          jsonrpc: "2.0",
          error: {
            code: -32000,
            message: "Session not found",
          },
          id: null,
        })
        return
      }
    }

    // Handle GET request - validate Accept header for SSE
    if (req.method === 'GET') {
      const acceptHeader = req.headers.accept
      if (!acceptHeader || !acceptHeader.includes('text/event-stream')) {
        res.status(400).json({
          jsonrpc: "2.0",
          error: {
            code: -32000,
            message: "Bad Request: Accept header must include text/event-stream for GET requests",
          },
          id: null,
        })
        return
      }
    }

    if (!sessionId || !this.transports[sessionId]) {
      if (sessionId && !this.transports[sessionId]) {
        res.status(404).json({
          jsonrpc: "2.0",
          error: {
            code: -32000,
            message: "Session not found",
          },
          id: null,
        })
      } else {
        res.status(400).json({
          jsonrpc: "2.0",
          error: {
            code: -32000,
            message: "Missing session ID",
          },
          id: null,
        })
      }
      return
    }

    const transport = this.transports[sessionId]
    await transport.handleRequest(req, res)
  }

  private async createNewTransport(): Promise<StreamableHTTPServerTransport> {
    const config = this.getConfig()
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => uuidv4(),
      onsessioninitialized: (newSessionId) => {
        logger.info(`Session initialized: ${newSessionId}`)
        this.transports[newSessionId] = transport
      },
      onsessionclosed: (sessionId) => {
        logger.info(`Session closed: ${sessionId}`)
        delete this.transports[sessionId]
      },
      enableDnsRebindingProtection: true,
      allowedHosts: [
        "localhost",
        "127.0.0.1",
        `localhost:${config.HTTP_PORT}`,
        `127.0.0.1:${config.HTTP_PORT}`,
      ],
    })

    transport.onclose = () => {
      if (transport.sessionId) {
        logger.info(`Session closed: ${transport.sessionId}`)
        delete this.transports[transport.sessionId]
      }
    }

    await this.mcpServer.getServer().connect(transport)
    return transport
  }

  public getServer(): Server {
    return this.mcpServer.getServer()
  }

  public getConfig(): ServerConfig {
    return this.mcpServer.getConfig()
  }
}
