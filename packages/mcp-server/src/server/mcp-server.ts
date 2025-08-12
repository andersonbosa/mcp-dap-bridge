import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import { z } from "zod"
import { ServerConfig } from "../types"
import { logger } from "../utils/logger"
import { ResourceManager } from "./dependencies/resource-manager"
import { ToolManager } from "./dependencies/tool-manager"
import { WebSocketBridge } from "./dependencies/websocket-bridge"
import { MCPServerTransport } from "../types/index"

/**
 * Base class of the MCP Server that manages tools and resources.
 * The transport is managed by specific decorators.
 */
export class MCPServer implements MCPServerTransport {
  private server: Server
  private toolManager: ToolManager
  private resourceManager: ResourceManager
  private wsBridge: WebSocketBridge

  constructor(private config: ServerConfig) {
    this.server = new Server(
      {
        name: config.SERVER_NAME,
        version: config.SERVER_VERSION,
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    )

    this.wsBridge = new WebSocketBridge(config.WS_PORT)
    this.toolManager = new ToolManager(this.wsBridge)
    this.resourceManager = new ResourceManager()
    this.setupHandlers()
  }

  private setupHandlers(): void {
    // List available tools
    const toolsListSchema = z.object({ method: z.literal("tools/list") })
    const toolsCallSchema = z.object({
      method: z.literal("tools/call"),
      params: z.object({
        name: z.string(),
        arguments: z.any(),
      }),
    })
    const resourcesListSchema = z.object({
      method: z.literal("resources/list"),
    })
    const resourcesReadSchema = z.object({
      method: z.literal("resources/read"),
      params: z.object({
        uri: z.string(),
      }),
    })

    // Handle tool list
    this.server.setRequestHandler(toolsListSchema, async () => {
      return { tools: this.toolManager.listTools() }
    })

    // Handle tool calls
    this.server.setRequestHandler(toolsCallSchema, async (request) => {
      const { name, arguments: args } = request.params
      return await this.toolManager.callTool(name, args)
    })

    // List available resources
    this.server.setRequestHandler(resourcesListSchema, async () => {
      return { resources: this.resourceManager.listResources() }
    })

    // Handle resource reads
    this.server.setRequestHandler(resourcesReadSchema, async (request) => {
      const { uri } = request.params
      return await this.resourceManager.readResource(uri)
    })

    logger.info("MCP Server handlers configured")
  }

  getConfig(): ServerConfig {
    return this.config
  }

  getServer(): Server {
    return this.server
  }

  /**
   * Base method that does not implement any transport.
   * The decorators must override this method to add their specific transport.
   */
  async start(): Promise<void> {
    throw new Error("No transport configured. Use a transport decorator.")
  }
}
