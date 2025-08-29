# MCP Debug Bridge

A comprehensive system that bridges the Model Context Protocol (MCP) with the Debug Adapter Protocol (DAP), enabling AI assistants to control debugging sessions through natural language commands.

## Overview

MCP Debug Bridge provides a complete debugging toolkit for AI assistants, allowing them to interact with VS Code/Cursor debugging features through a standardized MCP server. The system translates MCP commands into DAP operations, enabling real-time debugging control, variable inspection, execution flow management, and comprehensive session analysis.

## Features

### 🎮 **Execution Control**
- **Continue/Pause execution** from breakpoints
- **Step operations** (over, into, out) with granularity control
- **Thread management** and switching between execution contexts

### 🔍 **Variable Inspection & Modification**
- **Get variable values** from any scope (local, global, arguments)
- **Set variable values** during debugging sessions
- **Scope-aware variable access** with frame context

### 🔧 **Breakpoint Management**
- **Set breakpoints** in multiple files and lines
- **Remove breakpoints** individually or in batch
- **Dynamic breakpoint control** during execution

### 📊 **Session Analysis**
- **Real-time stack trace inspection** with detailed frame information
- **Thread listing and analysis** with status monitoring
- **Local variables enumeration** in current context

### 🚀 **Transport & Compliance**
- **Streamable HTTP transport** (MCP 2025-06-18 compliant)
- **WebSocket communication** between extension and server
- **Session management** with secure UUID-based sessions
- **DNS rebinding protection** and Origin validation
- **CORS support** for web-based MCP clients

### 🛠️ **Developer Experience**
- **14 comprehensive debugging tools** available via MCP
- **TypeScript support** with full type safety
- **Robust error handling** with descriptive messages
- **Structured logging** for debugging and monitoring
- **Docker support** for containerized deployment

## Available Tools

The MCP server provides 14 comprehensive debugging tools:

### **Execution Control**
- `isDebuggerActive` - Check if debugging session is active
- `continue` - Continue program execution from current breakpoint
- `pause` - Pause program execution
- `stepOver` - Execute next line without entering functions
- `stepInto` - Step into function calls
- `stepOut` - Step out of current function

### **Stack & Context Inspection**
- `getStackTrace` - Get current call stack with frame details
- `listLocalVariables` - List variables in current scope

### **Variable Management**
- `getVariableValue` - Get value of specific variable by name
- `setVariableValue` - Modify variable value during debugging

### **Breakpoint Management**
- `setBreakpoints` - Set breakpoints in files at specific lines
- `removeBreakpoints` - Remove specific or all breakpoints

### **Thread Management**
- `listThreads` - List all active threads in debug session
- `getThreadInfo` - Get detailed information about specific thread

## Getting Started

### Prerequisites

- Node.js 18 or higher
- Visual Studio Code or Cursor
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


### Project Structure

```
mcp_debug_bridge/
├── packages/
│   ├── dap-bridge-extension/      # VS Code/Cursor extension
│   │   ├── src/
│   │   │   ├── extension.ts       # Main extension entry point
│   │   │   ├── command-handler.ts # DAP request handling
│   │   │   └── types.ts           # TypeScript definitions
│   │   └── package.json
│   │
│   ├── mcp-server/                # MCP Server with debugging tools
│   │   ├── src/
│   │   │   ├── server/            # MCP server implementation
│   │   │   ├── tools/             # Debugging toolkit
│   │   │   │   ├── debugger-toolkit/
│   │   │   │   ├── echo-tool.ts
│   │   │   │   └── file-read-tool.ts
│   │   │   ├── resources/         # MCP resources
│   │   │   └── utils/             # Utilities and logging
│   │   └── Dockerfile
│   │
│   └── demo-app/                  # Testing and demonstration
│       ├── index.mjs
│       └── client.http
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
cd packages/dap-bridge-extension
# Press F5 in VS Code to start debugging the extension
```

3. **Test with MCP Inspector (optional):**
```bash
# The server runs on http://localhost:3001/mcp
# Use MCP Inspector to test the debugging tools
```

### Using the Debugging Tools

Once the extension is running and you have an active debugging session, you can use the MCP tools using https://github.com/modelcontextprotocol/inspector in `mcp-server` package:

```bash
npm run inspect
```

## Configuration

The MCP server can be configured through environment variables:

- `MCP_SERVER_NAME`: Name of the MCP server (default: package name)
- `MCP_SERVER_VERSION`: Version of the MCP server (default: package version)
- `PORT`: HTTP port for MCP server (default: 3001)
- `LOG_LEVEL`: Logging level (info, debug, error, default: info)
- `WEBSOCKET_PORT`: WebSocket port for DAP communication (default: 8445)

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
- **Type-safe implementation** with comprehensive TypeScript definitions
- **Robust error handling** with structured logging
- **Extensible toolkit** for adding new debugging capabilities

## Use Cases

### **AI-Powered Debugging**
Enable AI assistants to:
- Analyze program execution flow and identify issues
- Set strategic breakpoints based on code analysis
- Inspect variable states and suggest optimizations
- Guide developers through complex debugging scenarios

### **Automated Testing**
- Set up automated debugging sessions for test analysis
- Capture execution traces for performance analysis
- Validate program state at specific execution points

### **Educational Tools**
- Create interactive debugging tutorials
- Demonstrate execution flow for learning purposes
- Provide guided debugging assistance for students

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

- [Model Context Protocol](https://modelcontextprotocol.io/) for the standardized AI-server communication
- [Debug Adapter Protocol](https://microsoft.github.io/debug-adapter-protocol/) for debugging integration
- Visual Studio Code team for the extension architecture
