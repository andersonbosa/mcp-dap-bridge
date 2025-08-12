import { Resource } from "@modelcontextprotocol/sdk/types.js";

export abstract class BaseResource {
  abstract readonly uri: string;
  abstract readonly name: string;
  abstract readonly description: string;

  abstract read(): Promise<any>;

  getDefinition(): Resource {
    return {
      uri: this.uri,
      name: this.name,
      description: this.description,
    };
  }
}
