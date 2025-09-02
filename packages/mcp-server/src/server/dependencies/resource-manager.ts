import { Resource } from "@modelcontextprotocol/sdk/types.js"

import { logger } from "@andersonbosa/mcp-debugx-core"
import { BaseResource } from "../../resources/base-resource"
import { FileResource } from "../../resources/file-resource"

export class ResourceManager {
  private resources: Map<string, BaseResource> = new Map();

  constructor() {
    this.registerResources()
  }

  private registerResources(): void {
    const resources = [
      new FileResource(),
      // Add more resources here
    ]

    resources.forEach((resource) => {
      this.resources.set(resource.uri, resource)
      logger.info(`Registered resource: ${resource.uri}`)
    })
  }

  listResources(): Resource[] {
    return Array.from(this.resources.values()).map((resource) =>
      resource.getDefinition()
    )
  }

  async readResource(uri: string): Promise<any> {
    const resource = this.resources.get(uri)
    if (!resource) {
      throw new Error(`Resource not found: ${uri}`)
    }

    logger.info(`Reading resource: ${uri}`)
    return await resource.read()
  }
}
