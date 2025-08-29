// src/resources/FileResource.ts - Example resource
import { BaseResource } from './base-resource'

export class FileResource extends BaseResource {
  readonly uri = 'file://local'
  readonly name = 'Local Files'
  readonly description = 'Access to local file system'

  async read(): Promise<any> {
    return {
      contents: [
        {
          uri: this.uri,
          mimeType: 'text/plain',
          text: 'File system access available'
        }
      ]
    }
  }
}
