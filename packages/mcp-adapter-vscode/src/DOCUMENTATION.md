# MCP VS Code Adapter

## Overview

The architecture implements a simplified and efficient object-oriented approach to manage commands of different types (DAP, IDE) in a unified way. The current architecture has eliminated unnecessary complexities and maintains only the essential components.

## Project Structure

```
src/
├── commands/                           # Unified commands
│   ├── command-manager.ts              # Command central hub
│   ├── command-response-factory.ts     # Factory for DAP responses
│   ├── *.command.ts                    # Individual commands
├── core/                               # Central infrastructure
│   ├── websocket-message-router.ts     # Message router
│   └── websocket-client.ts             # WebSocket client
├── utils/                              # Utilities
│   └── logger.ts                       # Logging system
├── constants.ts                        # System constants
├── types.ts                            # Type definitions
├── extension.ts                        # Extension entry point
└── DOCUMENTATION.md                    
```

## Architectural Principles

### 1. **Single Responsibility Principle (SRP)**
- **CommandManager**: Responsible only for registering and locating commands
- **WebsocketMessageRouter**: Responsible only for providing dependencies and routing messages
- **Command**: Responsible only for executing its specific logic

### 2. **Dependency Inversion Principle (DIP)**
- Commands depend on the `CommandContext` abstraction, not concrete implementations
- `WebsocketMessageRouter` injects dependencies through the context

### 3. **Keep It Simple (KISS)**
- Removed unused decorators and adapters
- Flat structure for commands (easier to navigate)
- Specific factory only where necessary (DAP responses)

## Main Components

### 1. `Command` Interface
```typescript
export interface Command<Input = any, Output = any> {
  readonly command: string
  execute(args: Input, context?: CommandContext): Promise<Output>
}
```

**Responsibilities:**
- Defines unified contract for all commands
- Ensures all commands have a name and execution method

### 2. `BaseCommand` Class
```typescript
export abstract class BaseCommand<Input = any, Output = any> implements Command<Input, Output> {
  abstract readonly command: string
  abstract execute(args: Input, context?: CommandContext): Promise<Output>
  
  protected validateInput(args: Input): void
  protected postProcess(result: Output, context?: CommandContext): Output
}
```

**Responsibilities:**
- Provides common base implementation for commands
- Offers hooks for validation and post-processing
- Implements template method pattern

### 3. `CommandContext` Interface
```typescript
export interface CommandContext {
  session?: any
  requestId?: string
  metadata?: Record<string, any>
}
```

**Responsibilities:**
- Carries external dependencies (debug session, workspace info, etc.)
- Provides metadata about execution
- Isolates commands from direct VS Code dependencies

### 4. `CommandManager`
```typescript
export class CommandManager {
  private handlers: Map<string, Command<any, any>> = new Map()
  
  register(handlers: Command | Command[]): void
  getHandler(command: string): Command<any, any> | undefined
  executeCommand<Input, Output>(command: string, args: Input, context?: CommandContext): Promise<Output>
}
```

**Responsibilities:**
- Acts as central command registry
- Provides unified interface for command location and execution
- Has no knowledge of specific dependencies (VS Code, debug sessions, etc.)
- Auto-registers all available commands

### 5. `WebsocketMessageRouter`
```typescript
export class WebsocketMessageRouter {
  private commandManager: CommandManager
  private websocketClient: WebsocketClient
  
  private createDapContext(message: DapRequestMessage): CommandContext
  private createIdeContext(message: IdeRequestMessage): CommandContext
  private handleDapRequest(message: DapRequestMessage): Promise<void>
  private handleIdeCommand(message: IdeRequestMessage): Promise<void>
}
```

**Responsibilities:**
- Injects specific dependencies into commands through context
- Manages lifecycle of debug sessions and workspace
- Acts as application composition root
- Manages WebSocket communication with MCP server

### 6. `CommandResponseFactory`
```typescript
export class CommandResponseFactory {
  static create<T>(data: T, options?: {...}): StandardCommandResponse<T>
  static createWithDebugSession<T>(...): StandardCommandResponse<T>
  static createWithoutDebugSession<T>(...): StandardCommandResponse<T>
}
```

**Responsibilities:**
- Standardizes DAP command responses
- Adds consistent metadata
- Facilitates response formatting

## Implemented Design Patterns

### 1. **Command Pattern**
- Encapsulates requests as objects
- Unified interface for all command types
- Facilitates logging and error handling

### 2. **Registry Pattern**
- `CommandManager` acts as central registry
- Auto-discovery of commands
- Unified interface for location

### 3. **Factory Pattern (Specific)**
- `CommandResponseFactory` for DAP response standardization
- Consistent metadata creation
- Reduces code duplication

### 4. **Dependency Injection**
- Dependencies injected through `CommandContext`
- Decouples commands from VS Code infrastructure
- Facilitates testing and mocking

### 5. **Template Method Pattern**
- `BaseCommand` provides common structure
- Hooks for validation and post-processing
- Reusable default behavior

## Execution Flow

### General Flow:
1. **Extension** starts and activates `WebsocketMessageRouter`
2. **WebsocketClient** establishes connection with MCP server
3. **CommandManager** auto-registers all available commands

### For DAP Commands:
1. **WebsocketMessageRouter** receives `DapRequestMessage`
2. **WebsocketMessageRouter** collects DAP dependencies (`vscode.debug.activeDebugSession`)
3. **WebsocketMessageRouter** creates `CommandContext` with dependencies
4. **WebsocketMessageRouter** calls `CommandManager.executeCommand()`
5. **CommandManager** locates the command
6. **Command** executes with provided context
7. **WebsocketMessageRouter** sends response via WebSocket

### For IDE Commands:
1. **WebsocketMessageRouter** receives `IdeRequestMessage`
2. **WebsocketMessageRouter** collects IDE dependencies (`workspace`, `activeEditor`)
3. **WebsocketMessageRouter** creates `CommandContext` with dependencies
4. **CommandManager** executes command
5. **Command** executes with IDE context
6. **WebsocketMessageRouter** sends response

## Current Architecture Advantages

### 1. **Simplicity**
- Single interface for all command types
- Flat structure for easy navigation
- No unnecessary complexity

### 2. **Testability**
- Dependencies injected via context
- Easy mocking and stubbing
- Commands isolated from VS Code infrastructure

### 3. **Maintainability**
- Well-defined responsibilities
- Low coupling between components
- Clean and organized code

### 4. **Extensibility**
- New commands follow consistent pattern
- Auto-registration of commands
- Specific factory only where necessary

### 5. **Performance**
- No overhead from unnecessary decorators
- Direct command registration
- Optimized WebSocket communication

## Usage Examples

### Creating a New Command
```typescript
class MyCommand extends BaseCommand<MyInput, MyOutput> {
  readonly command = 'myCommand'

  async execute(args: MyInput, context?: CommandContext): Promise<MyOutput> {
    this.validateInput(args)
    
    // Access dependencies through context
    const session = context?.session
    const metadata = context?.metadata
    
    // Command logic...
    const result = await this.processCommand(args, session)
    
    return this.postProcess(result, context)
  }
}
```

### Registering a Command
```typescript
// CommandManager auto-registers commands during initialization
// To add a new command, simply add it to the list in initializeHandlers():

private initializeHandlers() {
  const handlers: Command<any, any>[] = [
    // Existing commands...
    new MyCommand(),  // ← New command here
  ]
  this.register(handlers)
}
```

### Using CommandResponseFactory (for DAP)
```typescript
// In a DAP command:
return CommandResponseFactory.createWithDebugSession(
  { result: processedData },
  session.id,
  startTime,
  { customMetadata: 'value' }
)
```

## Available Commands

### DAP Commands (Debug Adapter Protocol)
- **`setBreakpointsInFiles`**: Sets breakpoints in specific files
- **`isDebuggerActive`**: Checks if there's an active debug session
- **`listBreakpoints`**: Lists all active breakpoints

### IDE Commands (VS Code Integration)
- **`breakpoints/set`**: Sets breakpoints via IDE interface
- **`breakpoints/list`**: Lists breakpoints via IDE interface
- **`breakpoints/remove`**: Removes specific breakpoints

### Special Command
- **`custom-vscode-dap`**: Custom handler for unmapped DAP commands

## File Structure

### Individual Commands
```
commands/
├── set-breakpoints-in-files.command.ts    # DAP: Set breakpoints in files
├── is-debugger-active.command.ts          # DAP: Check active session
├── list-breakpoints.command.ts            # DAP: List breakpoints
├── set-breakpoints.command.ts             # IDE: Set breakpoints
├── remove-breakpoints.command.ts          # IDE: Remove breakpoints
└── custom-vscode-dap.command.ts           # DAP: Custom handler
```

## Migration Status

### ✅ Completed
- Unified architecture implemented
- Migration of all existing handlers
- Integration with WebsocketMessageRouter
- Removal of unused decorators and adapters
- File structure simplification
- Documentation updated

### 🎯 Final Architecture
- **1 Central Manager**: `CommandManager`
- **1 Specific Factory**: `CommandResponseFactory` (DAP only)
- **Flat Structure**: Commands organized simply
- **Dependency Injection**: Via `CommandContext`
- **Auto-registration**: Commands registered automatically

## Conclusion

The final architecture implements a simple, efficient, and extensible solution for the command system. It eliminated unnecessary complexities while maintaining the benefits of object-orientation and separation of responsibilities. The structure is easy to understand, maintain, and extend.
