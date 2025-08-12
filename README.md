# MCP Debug Bridge

A Visual Studio Code extension that bridges the Model Context Protocol (MCP) with the Debug Adapter Protocol (DAP), enabling AI-powered debugging capabilities. 

## Overview

MCP Debug Bridge enables AI assistants to interact with VS Code's debugging features through a standardized protocol. It translates Model Context Protocol (MCP) commands into Debug Adapter Protocol (DAP) operations, allowing AI to inspect and analyze debug sessions in real-time.

<img width="3132" height="1118" alt="image" src="https://github.com/user-attachments/assets/2d072c13-be73-49bc-88e6-46cf40c04fd2" />


## Project Structure

The project is organized into three main packages:

- `@dap-bridge-extension`: VS Code extension that translates MCP commands to DAP
- `@mcp-server`: Standalone MCP server with support for multiple transports
- `@demo-app`: Demo application for testing and development

## Features

- Real-time stack trace inspection through AI commands
- Support for both stdio and HTTP transports for MCP communication
- Modular architecture with clean separation between extension, server, and demo components
- Built-in session management for HTTP transport
- Configurable through environment variables

## Getting Started

### Prerequisites

- Node.js 18 or higher
- Visual Studio Code
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/andersonbosa/mcp-debug-bridge.git
cd mcp-debug-bridge
```

2. Install dependencies:
```bash
npm install
```

3. Build all packages:
```bash
npm run build
```

### Development Setup

1. Copy the example environment file:
```bash
cp packages/mcp-server/.env.example packages/mcp-server/.env
```

2. Configure your environment variables in `.env`

3. Start the MCP server:
```bash
cd packages/mcp-server
npm run dev
```

4. In VS Code, open the `packages/dap-bridge-extension` folder and press F5 to start debugging the extension

## Configuration

The MCP server can be configured through environment variables:

- `SERVER_NAME`: Name of the MCP server
- `SERVER_VERSION`: Version of the MCP server
- `HTTP_PORT`: Port for HTTP transport
- `LOG_LEVEL`: Logging level (info, debug, error)
- `MCP_PORT`: Port for MCP communication
- `IPC_PORT`: Port for IPC communication

## Contributing

Please read our [Contributing Guidelines](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
