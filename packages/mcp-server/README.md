# MCP Server TypeScript Boilerplate

A clean, reusable TypeScript boilerplate for building Model Context Protocol (MCP) servers.

## Features

- **Clean Architecture**: Modular design with clear separation of concerns
- **Type Safety**: Full TypeScript support with strict type checking
- **Easy Configuration**: Simple configuration object for tools and resources
- **Built-in Examples**: Sample tools and resources to get you started
- **Error Handling**: Comprehensive error handling with meaningful messages
- **Graceful Shutdown**: Proper cleanup on process termination
- **Development Ready**: Hot reload and debugging support

## Quick Start

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
npm start
```

## Usage

### Adding Custom Tools

Tools are functions that can be called by MCP clients. Add them to the `tools` array in your server configuration:

```typescript
const customTool: ToolHandler = {
  name: "my_custom_tool",
  description: "Description of what this tool does",
  inputSchema: {
    type: "object",
    properties: {
      param1: {
        type: "string",
        description: "Parameter description",
      },
    },
    required: ["param1"],
  },
  handler: async (args: { param1: string }) => {
    // Your tool logic here
    return `Processed: ${args.param1}`;
  },
};
```

### Adding Custom Resources

Resources are static or dynamic content that can be read by MCP clients:

```typescript
const customResource: ResourceHandler = {
  uri: "custom://my-resource",
  name: "My Custom Resource",
  description: "Description of this resource",
  mimeType: "application/json",
  handler: async () => {
    // Your resource logic here
    return JSON.stringify({ data: "example" });
  },
};
```

### Configuration

Modify the `serverConfig` object to customize your server:

```typescript
const serverConfig: ServerConfig = {
  name: "my-mcp-server",
  version: "1.0.0",
  description: "My custom MCP server",
  tools: [customTool, ...exampleTools],
  resources: [customResource, ...exampleResources],
};
```

## Project Structure

```
├── src/
│   └── index.ts          # Main server implementation
├── dist/                 # Compiled JavaScript (generated)
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
└── README.md            # This file
```

## Example Tools

The boilerplate includes several example tools:

- **echo**: Echo back input messages
- **add_numbers**: Add two numbers together
- **current_time**: Get current time in various formats

## Example Resources

- **info://server/status**: Server status and runtime information
- **info://server/config**: Server configuration details

## Development

### Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run clean` - Clean build artifacts
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues

### Testing Your Server

You can test your MCP server using any MCP client. The server communicates via stdio, so you can also test it directly:

```bash
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}' | node dist/index.js
```

## Deployment

### As a Standalone Application

```bash
npm run build
node dist/index.js
```

### As a Library

You can also use this as a library in other projects:

```typescript
import { MCPServer, ToolHandler, ResourceHandler } from './src/index.js';

const myTools: ToolHandler[] = [
  // Your custom tools
];

const server = new MCPServer({
  name: "my-server",
  version: "1.0.0",
  tools: myTools,
  resources: [],
});

await server.start();
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Create an issue on GitHub
- Check the MCP documentation
- Review the example implementations

## Changelog

### 1.0.0
- Initial release
- Basic tool and resource support
- TypeScript boilerplate
- Example implementations