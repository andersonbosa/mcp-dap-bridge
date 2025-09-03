# Arquitetura Unificada de Comandos

## Visão Geral

A nova arquitetura implementa uma abordagem orientada a objetos com padrões de design bem estabelecidos para gerenciar comandos de diferentes tipos (DAP, IDE, Native) de forma unificada.

## Princípios Arquiteturais

### 1. **Single Responsibility Principle (SRP)**
- **CommandHandlerManager**: Responsável apenas por registrar e localizar comandos
- **MessageRouter**: Responsável apenas por fornecer dependências e rotear mensagens
- **Command**: Responsável apenas por executar sua lógica específica

### 2. **Dependency Inversion Principle (DIP)**
- Comandos dependem da abstração `CommandContext`, não de implementações concretas
- `MessageRouter` injeta dependências através do contexto

### 3. **Open/Closed Principle (OCP)**
- Novos comandos podem ser adicionados sem modificar código existente
- Novos decorators podem ser criados para adicionar funcionalidades

## Componentes Principais

### 1. Interface `Command`
```typescript
export interface Command<Input = any, Output = any> {
  readonly command: string
  execute(args: Input, context?: CommandContext): Promise<Output>
}
```

**Responsabilidades:**
- Define contrato unificado para todos os comandos
- Garante que todos os comandos tenham um nome e método de execução

### 2. Classe `BaseCommand`
```typescript
export abstract class BaseCommand<Input = any, Output = any> implements Command<Input, Output> {
  abstract readonly command: string
  abstract execute(args: Input, context?: CommandContext): Promise<Output>
  
  protected validateInput(args: Input): void
  protected postProcess(result: Output, context?: CommandContext): Output
}
```

**Responsabilidades:**
- Fornece implementação base comum para comandos
- Oferece hooks para validação e pós-processamento
- Implementa template method pattern

### 3. Interface `CommandContext`
```typescript
export interface CommandContext {
  session?: any
  requestId?: string
  metadata?: Record<string, any>
}
```

**Responsabilidades:**
- Carrega dependências externas (debug session, workspace info, etc.)
- Fornece metadados sobre a execução
- Isola comandos de dependências diretas do VS Code

### 4. `CommandHandlerManager`
```typescript
export class CommandHandlerManager {
  private handlers: Map<string, Command<any, any>> = new Map()
  
  register(handlers: Command | Command[]): void
  getHandler(command: string): Command<any, any> | undefined
  executeCommand<Input, Output>(command: string, args: Input, context?: CommandContext): Promise<Output>
}
```

**Responsabilidades:**
- Atua como registry central de comandos
- Fornece interface unificada para localização e execução
- Não tem conhecimento de dependências específicas (VS Code, debug sessions, etc.)

### 5. `MessageRouter`
```typescript
export class MessageRouter {
  private commandHandlerManager: CommandHandlerManager
  
  private createDapContext(message: DapRequestMessage): CommandContext
  private createIdeContext(message: IdeRequestMessage): CommandContext
  private handleDapRequest(message: DapRequestMessage): Promise<void>
  private handleIdeCommand(message: IdeRequestMessage): Promise<void>
}
```

**Responsabilidades:**
- Injeta dependências específicas nos comandos através do contexto
- Gerencia lifecycle das sessões de debug e workspace
- Atua como composition root da aplicação

## Padrões de Design Implementados

### 1. **Command Pattern**
- Encapsula requisições como objetos
- Permite parametrização de objetos com diferentes requisições
- Facilita logging, undo/redo, e enfileiramento

### 2. **Decorator Pattern**
```typescript
// Exemplo: Adicionar suporte a sessão DAP
const decoratedCommand = withDapSession(baseCommand)
```

**Benefícios:**
- Adiciona funcionalidades sem modificar código original
- Permite composição de comportamentos
- Mantém Single Responsibility Principle

### 3. **Adapter Pattern**
```typescript
// Converter handlers legados para nova interface
const adapter = new DapCommandAdapter(legacyHandler)
```

**Benefícios:**
- Integra código legado com nova arquitetura
- Permite migração gradual
- Mantém compatibilidade com código existente

### 4. **Factory Pattern**
```typescript
// Criação consistente de comandos
const command = CommandFactory.createDapCommand(baseCommand)
```

**Benefícios:**
- Centraliza lógica de criação
- Aplica decorators automaticamente
- Reduz complexidade de setup

### 5. **Registry Pattern**
- `CommandHandlerManager` atua como registry central
- Facilita descoberta de comandos
- Permite inspeção runtime

### 6. **Dependency Injection**
- Dependências injetadas através de `CommandContext`
- Desacopla comandos de infraestrutura
- Facilita testing e mocking

## Fluxo de Execução

### Para Comandos DAP:
1. **MessageRouter** recebe `DapRequestMessage`
2. **MessageRouter** coleta dependências DAP (`vscode.debug.activeDebugSession`)
3. **MessageRouter** cria `CommandContext` com dependências
4. **MessageRouter** chama `CommandHandlerManager.executeCommand()`
5. **CommandHandlerManager** localiza o comando
6. **Command** executa com contexto fornecido
7. **MessageRouter** envia resposta via WebSocket

### Para Comandos IDE:
1. **MessageRouter** recebe `IdeRequestMessage`
2. **MessageRouter** coleta dependências IDE (`workspace`, `activeEditor`)
3. **MessageRouter** cria `CommandContext` com dependências
4. **CommandHandlerManager** executa comando
5. **Command** executa com contexto IDE
6. **MessageRouter** envia resposta

## Vantagens da Nova Arquitetura

### 1. **Unificação**
- Interface única para todos os tipos de comando
- Gerenciamento centralizado
- Redução de duplicação de código

### 2. **Testabilidade**
- Dependências injetadas via contexto
- Fácil mocking e stubbing
- Comandos isolados de infraestrutura

### 3. **Extensibilidade**
- Novos comandos seguem mesmo padrão
- Decorators para funcionalidades cross-cutting
- Adapters para integração com código legado

### 4. **Manutenibilidade**
- Responsabilidades bem definidas
- Acoplamento baixo entre componentes
- Código mais limpo e organizado

### 5. **Flexibilidade**
- Composição através de decorators
- Factory patterns para criação consistente
- Registry pattern para descoberta dinâmica

## Exemplos de Uso

### Criando um Novo Comando
```typescript
class MyCommand extends BaseCommand<MyInput, MyOutput> {
  readonly command = 'myCommand'

  async execute(args: MyInput, context?: CommandContext): Promise<MyOutput> {
    this.validateInput(args)
    
    // Acessar dependências através do contexto
    const session = context?.session
    const metadata = context?.metadata
    
    // Lógica do comando...
    const result = await this.processCommand(args, session)
    
    return this.postProcess(result, context)
  }
}
```

### Aplicando Decorators
```typescript
// Comando básico
const baseCommand = new MyCommand()

// Adicionar suporte DAP
const dapCommand = withDapSession(baseCommand)

// Múltiplos decorators
const hybridCommand = CommandFactory.createDecoratedCommand(
  baseCommand,
  [withDapSession, withIdeSession]
)
```

### Registrando Comandos
```typescript
const manager = new CommandHandlerManager()
manager.register([
  new SetBreakpointsInFilesHandler(),
  new IsDebuggerActiveHandler(),
  withDapSession(new MyCustomCommand())
])
```

## Migração do Código Legado

### Antes (Código Legado)
```typescript
// DapCommandManager específico
class DapCommandManager {
  private handlers: Map<string, DapCommandHandler>
  // Lógica específica para DAP...
}

// IdeCommandManager específico  
class IdeCommandManager {
  private handlers: Map<string, IdeCommandHandler>
  // Lógica específica para IDE...
}
```

### Depois (Nova Arquitetura)
```typescript
// Manager unificado
class CommandHandlerManager {
  private handlers: Map<string, Command>
  // Lógica genérica para todos os tipos...
}

// Dependências injetadas pelo MessageRouter
// Comandos não têm conhecimento direto do VS Code
```

## Próximos Passos

1. **Fase 1**: ✅ Implementação da arquitetura base
2. **Fase 2**: ✅ Migração dos handlers existentes  
3. **Fase 3**: ✅ Integração com MessageRouter
4. **Fase 4**: 🔄 Testing e validação
5. **Fase 5**: 📋 Remoção de código legado deprecado
6. **Fase 6**: 📋 Documentação de padrões para novos comandos

## Conclusão

A nova arquitetura fornece uma base sólida e extensível para o sistema de comandos, implementando padrões de design bem estabelecidos e princípios SOLID. Ela facilita manutenção, testing, e extensão do sistema, enquanto mantém compatibilidade com código existente através de adapters.
