# MCP DebugX

A comprehensive system that bridges the Model Context Protocol (MCP) with the Debug Adapter Protocol (DAP), enhancing the developer debugging experience with AI-powered debugging assistance. The project provides an MCP server with debugging capabilities and a VS Code extension as the first MCP client.

## Overview

MCP DebugX enhances the developer debugging experience by providing AI assistants with direct access to debugging sessions through a standardized MCP server. The system consists of three main packages: a core library for shared types and utilities, an MCP server with comprehensive debugging tools, and a VS Code extension that bridges the gap between the IDE's debugging capabilities and the MCP server.

## Available Tools

The MCP server provides 15 comprehensive debugging tools organized in two toolkits:

### **Debugger Toolkit (12 tools)**
- `isDebuggerActive` - Check if debugging session is active
- `continue` - Continue program execution from current breakpoint
- `pause` - Pause program execution
- `stepOver` - Execute next line without entering functions
- `stepInto` - Step into function calls
- `stepOut` - Step out of current function
- `getStackTrace` - Get current call stack with frame details
- `listLocalVariables` - List variables in current scope
- `getVariableValue` - Get value of specific variable by name
- `setVariableValue` - Modify variable value during debugging
- `listThreads` - List all active threads in debug session
- `getThreadInfo` - Get detailed information about specific thread

### **IDE Toolkit (3 tools)**
- `setBreakpoints` - Set breakpoints in files at specific lines
- `removeBreakpoints` - Remove specific or all breakpoints
- `listBreakpoints` - List all currently set breakpoints

## Supported IDE's

- VSCode

## Getting Started

### Prerequisites

- Node.js 22 or higher
- Visual Studio Code or Cursor
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/andersonbosa/mcp-debugx.git
cd mcp-debugx
```

2. Install dependencies:
```bash
npm install
```

3. Build all packages:
```bash
npm run build
```


### Project Structure

```
mcp_debug_bridge/
├── packages/
│   ├── mcp-core/                  # Shared core library
│   │   ├── src/
│   │   │   ├── index.ts           # Core exports
│   │   │   ├── types.ts           # Shared TypeScript definitions
│   │   │   └── utils/             # Shared utilities
│   │   └── package.json
│   │
│   ├── mcp-adapter-vscode/        # VS Code extension (first MCP client)
│   │   ├── src/
│   │   │   ├── extension.ts       # Main extension entry point
│   │   │   ├── core/              # Message routing and WebSocket client
│   │   │   ├── adaptors/          # DAP and IDE command handlers
│   │   │   └── utils/             # Extension utilities
│   │   └── package.json
│   │
│   ├── mcp-server/                # MCP Server with debugging tools
│   │   ├── src/
│   │   │   ├── server/            # MCP server implementation
│   │   │   ├── tools/             # Debugging toolkits
│   │   │   │   ├── toolkit-debugger/   # 12 debugging tools
│   │   │   │   ├── toolkit-ide/        # 3 IDE integration tools
│   │   │   │   ├── decorators/         # Tool decorators
│   │   │   │   └── examples/           # Example tools
│   │   │   ├── resources/         # MCP resources
│   │   │   ├── config/            # Server configuration
│   │   │   └── utils/             # Server utilities
│   │   └── Dockerfile
│   │
│   └── demos/                     # Testing and demonstration applications
│       └── nodejs/
│
├── CONTRIBUTING.md
├── LICENSE.md
└── README.md
```

### Development Setup

1. **Start the MCP server:**
```bash
cd packages/mcp-server
npm run dev
```

2. **Install and run the VS Code extension:**
```bash
cd packages/mcp-adapter-vscode
# Press F5 in VS Code to start debugging the extension
```

3. **Test with MCP Inspector (optional):**
```bash
# The server runs on http://localhost:3001/mcp
# Use MCP Inspector to test the debugging tools
```

### Using the Debugging Tools

Once the extension is running and you have an active debugging session, you can use the MCP tools through the MCP Inspector in the `mcp-server` package:

```bash
cd packages/mcp-server
npm run inspect
```

This will start the MCP Inspector UI that allows you to test and interact with all available debugging tools.

## Configuration

### MCP Server Configuration

The MCP server can be configured through environment variables:

- `MCP_SERVER_NAME`: Name of the MCP server (default: package name)
- `MCP_SERVER_VERSION`: Version of the MCP server (default: package version)
- `PORT`: HTTP port for MCP server (default: 3001)
- `LOG_LEVEL`: Logging level (info, debug, error, default: info)
- `WEBSOCKET_PORT`: WebSocket port for DAP communication (default: 8445)
- `SERVER_TOOLS_DISABLED`: Comma-separated list of tools to disable

### VS Code Extension Configuration

The extension can be configured through VS Code settings:

- `mcpAdapterForVSCode.wsServerUrl`: WebSocket URL for the MCP server connection (default: "ws://localhost:8445")
- `mcpAdapterForVSCode.mcpServerUrl`: MCP server URL for direct communication (default: "ws://localhost:8445")

## Technical Details

### **MCP Compliance**
- Implements MCP specification 2025-06-18
- Streamable HTTP transport with proper session management
- Security features including DNS rebinding protection
- Support for both application/json and text/event-stream content types

### **DAP Integration**
- Full Debug Adapter Protocol implementation
- WebSocket-based communication between extension and server
- Support for multiple debugging languages and runtimes
- Thread-safe operations with proper error handling

### **Architecture**
- **Modular design** with clean separation of concerns
- **Three-package architecture**: Core library, MCP server, and VS Code extension
- **Type-safe implementation** with comprehensive TypeScript definitions
- **Robust error handling** with structured logging and decorators
- **Extensible toolkit** with factory patterns for adding new debugging capabilities
- **WebSocket-based communication** between extension and server with message routing

## Use Cases

### **Enhanced Developer Experience**
- **AI-powered debugging assistance**: Enable AI assistants to analyze program execution flow and identify issues
- **Strategic breakpoint management**: AI can set and manage breakpoints based on code analysis
- **Variable inspection and optimization**: Real-time variable state analysis with AI-suggested optimizations
- **Guided debugging**: AI provides step-by-step debugging guidance for complex scenarios

### **Automated Testing & Analysis**
- **Automated debugging sessions** for test analysis and validation
- **Execution trace capture** for performance analysis
- **Program state validation** at specific execution points
- **Regression debugging** with AI-assisted issue identification

### **Educational & Learning Tools**
- **Interactive debugging tutorials** with AI guidance
- **Execution flow demonstration** for learning purposes
- **Code behavior analysis** for educational content
- **Guided debugging assistance** for students and junior developers

## Contributing

Please read our [Contributing Guidelines](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

### Development Guidelines
- All code comments must be in English
- Follow TypeScript best practices with strict typing
- Implement proper error handling for all tools
- Add comprehensive tests for new features
- Ensure MCP specification compliance

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## Acknowledgments

- [Model Context Protocol](https://modelcontextprotocol.io/) for the standardized AI-server communication framework
- [Debug Adapter Protocol](https://microsoft.github.io/debug-adapter-protocol/) for comprehensive debugging integration
- Visual Studio Code team for the robust extension architecture and debugging APIs
