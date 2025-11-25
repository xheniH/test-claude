# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

UIGen is an AI-powered React component generator with live preview. It uses Claude to generate React components through a chat interface, displays them in real-time using a virtual file system, and allows users to iterate on designs without writing code to disk.

## Common Commands

### Development
```bash
npm run dev              # Start Next.js dev server with Turbopack
npm run dev:daemon       # Start dev server in background, logs to logs.txt
npm run build            # Build production bundle
npm run start            # Start production server
```

### Testing
```bash
npm run test             # Run tests with Vitest
```

### Database
```bash
npm run setup            # Install deps, generate Prisma client, run migrations
npm run db:reset         # Reset database (force reset migrations)
```

### Linting
```bash
npm run lint             # Run Next.js ESLint
```

### Running a Single Test
```bash
npx vitest run <test-file-path>           # Run specific test file once
npx vitest <test-file-path>               # Run specific test file in watch mode
npx vitest run -t "test name pattern"     # Run tests matching pattern
```

## Architecture

### AI Component Generation Flow

1. **User Input** → Chat interface sends message to `/api/chat/route.ts`
2. **API Handler** → Receives messages and virtual file system state, constructs prompt with system message from `src/lib/prompts/generation.tsx`
3. **AI Model** → Uses Anthropic Claude (or mock provider if no API key) with two tools:
   - `str_replace_editor`: Create files, replace strings, insert lines
   - `file_manager`: Rename, move, delete files
4. **Virtual File System** → All file operations occur in memory via `VirtualFileSystem` class (`src/lib/file-system.ts`)
5. **Real-time Updates** → Tool calls trigger React context updates (`FileSystemContext`)
6. **Live Preview** → Files are transformed and rendered in iframe via Babel

### Virtual File System

The entire codebase operates on a **virtual file system** (`src/lib/file-system.ts`):
- No files are written to disk during component generation
- Files stored in memory as a tree structure (`FileNode` interface)
- Supports standard operations: create, read, update, delete, rename
- Serializes to/from JSON for persistence in database
- Root is always `/`, all paths are absolute

**Important**: The AI always creates `/App.jsx` as the entry point for generated components.

### JSX Transformation Pipeline

Located in `src/lib/transform/jsx-transformer.ts`:

1. **Transform JSX** → Uses `@babel/standalone` to transpile JSX/TSX to JavaScript
2. **Import Resolution** → Handles three types of imports:
   - Third-party packages (e.g., `react`) → Mapped to `https://esm.sh/`
   - Local files with `@/` alias (e.g., `@/components/Button`) → Resolved to absolute paths
   - CSS imports → Collected and injected as `<style>` tags
3. **Create Import Map** → Generates ES Module import map with blob URLs for each transformed file
4. **Generate HTML** → Creates complete HTML document with:
   - Import map in `<script type="importmap">`
   - Tailwind CDN for styling
   - Error boundary for runtime errors
   - Syntax error display if transformation fails
   - Entry point module loader
5. **Render in iframe** → HTML is set as `srcdoc` with sandbox permissions

### Authentication & Persistence

- **Auth System** (`src/lib/auth.ts`): JWT-based authentication using `jose`
  - Session stored in HTTP-only cookies
  - Optional: Users can work anonymously
  - Sessions expire after 7 days
- **Database** (`prisma/schema.prisma`): SQLite with Prisma ORM
  - Prisma client generated to `src/generated/prisma`
  - Two models: `User` and `Project`
  - Projects store messages (JSON) and file system state (JSON)
- **Anonymous Work Tracking** (`src/lib/anon-work-tracker.ts`): Tracks anonymous sessions in localStorage

### React Context Architecture

Two main contexts coordinate the application:

1. **FileSystemContext** (`src/lib/contexts/file-system-context.tsx`)
   - Wraps `VirtualFileSystem` instance
   - Provides CRUD operations for files
   - Handles tool calls from AI (transforms tool results into file operations)
   - Triggers re-renders via `refreshTrigger` counter

2. **ChatContext** (`src/lib/contexts/chat-context.tsx`)
   - Manages chat messages and AI streaming
   - Integrates with Vercel AI SDK's `useChat` hook
   - Parses tool calls and forwards to `FileSystemContext.handleToolCall`

### Key Components

- **ChatInterface** (`src/components/chat/ChatInterface.tsx`): Main chat UI with message list and input
- **PreviewFrame** (`src/components/preview/PreviewFrame.tsx`): Iframe that displays transformed React components
  - Detects entry point (App.jsx, index.jsx, etc.)
  - Shows welcome state on first load
  - Displays syntax errors with formatted error messages
- **CodeEditor** (`src/components/editor/CodeEditor.tsx`): Monaco editor for viewing/editing generated code
- **FileTree** (`src/components/editor/FileTree.tsx`): Tree view of virtual file system

## AI Provider Configuration

- **With API Key**: Set `ANTHROPIC_API_KEY` in `.env` to use Claude Haiku 4.5
- **Without API Key**: Uses `MockLanguageModel` (`src/lib/provider.ts`) which returns static component templates
  - Mock provider generates pre-defined components (Counter, Form, Card)
  - Steps through a fixed sequence of tool calls
  - Useful for testing and demos without API costs

## Important Conventions

- **Import Alias**: All local imports use `@/` alias (e.g., `@/components/Button`)
- **Entry Point**: Generated apps must export a default component from `/App.jsx`
- **Styling**: Use Tailwind CSS classes, not inline styles
- **No HTML Files**: The virtual FS only contains `.jsx`, `.tsx`, `.js`, `.ts`, and `.css` files
- **File Paths**: Always absolute paths starting with `/`

## Testing

- **Framework**: Vitest with React Testing Library
- **Configuration**: `vitest.config.mts` with jsdom environment and path aliases
- **Test Structure**:
  - Component tests in `__tests__` folders next to components
  - Lib/utility tests colocated with source files
