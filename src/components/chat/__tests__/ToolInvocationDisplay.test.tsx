import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ToolInvocationDisplay } from "../ToolInvocationDisplay";

describe("ToolInvocationDisplay", () => {
  describe("str_replace_editor tool", () => {
    it("displays 'Creating' message for create command", () => {
      const tool = {
        toolCallId: "1",
        toolName: "str_replace_editor",
        args: { command: "create", path: "/components/Button.jsx" },
        state: "call" as const,
      };

      render(<ToolInvocationDisplay tool={tool} />);
      expect(screen.getByText("Creating Button.jsx")).toBeDefined();
    });

    it("displays 'Editing' message for str_replace command", () => {
      const tool = {
        toolCallId: "2",
        toolName: "str_replace_editor",
        args: { command: "str_replace", path: "/utils/helpers.js" },
        state: "call" as const,
      };

      render(<ToolInvocationDisplay tool={tool} />);
      expect(screen.getByText("Editing helpers.js")).toBeDefined();
    });

    it("displays 'Editing' message for insert command", () => {
      const tool = {
        toolCallId: "3",
        toolName: "str_replace_editor",
        args: { command: "insert", path: "/App.jsx" },
        state: "call" as const,
      };

      render(<ToolInvocationDisplay tool={tool} />);
      expect(screen.getByText("Editing App.jsx")).toBeDefined();
    });

    it("displays 'Viewing' message for view command", () => {
      const tool = {
        toolCallId: "4",
        toolName: "str_replace_editor",
        args: { command: "view", path: "/config/settings.json" },
        state: "call" as const,
      };

      render(<ToolInvocationDisplay tool={tool} />);
      expect(screen.getByText("Viewing settings.json")).toBeDefined();
    });

    it("displays 'Undoing changes' message for undo_edit command", () => {
      const tool = {
        toolCallId: "5",
        toolName: "str_replace_editor",
        args: { command: "undo_edit", path: "/styles/main.css" },
        state: "call" as const,
      };

      render(<ToolInvocationDisplay tool={tool} />);
      expect(screen.getByText("Undoing changes to main.css")).toBeDefined();
    });

    it("extracts filename from nested path", () => {
      const tool = {
        toolCallId: "6",
        toolName: "str_replace_editor",
        args: { command: "create", path: "/src/components/ui/Card.tsx" },
        state: "call" as const,
      };

      render(<ToolInvocationDisplay tool={tool} />);
      expect(screen.getByText("Creating Card.tsx")).toBeDefined();
    });
  });

  describe("file_manager tool", () => {
    it("displays 'Renaming' message for rename command", () => {
      const tool = {
        toolCallId: "7",
        toolName: "file_manager",
        args: {
          command: "rename",
          path: "/utils.js",
          new_path: "/helpers.js",
        },
        state: "call" as const,
      };

      render(<ToolInvocationDisplay tool={tool} />);
      expect(screen.getByText("Renaming utils.js to helpers.js")).toBeDefined();
    });

    it("displays 'Deleting' message for delete command", () => {
      const tool = {
        toolCallId: "8",
        toolName: "file_manager",
        args: { command: "delete", path: "/OldComponent.jsx" },
        state: "call" as const,
      };

      render(<ToolInvocationDisplay tool={tool} />);
      expect(screen.getByText("Deleting OldComponent.jsx")).toBeDefined();
    });

    it("extracts filenames from nested paths for rename", () => {
      const tool = {
        toolCallId: "9",
        toolName: "file_manager",
        args: {
          command: "rename",
          path: "/src/components/Button.jsx",
          new_path: "/src/components/ui/Button.tsx",
        },
        state: "call" as const,
      };

      render(<ToolInvocationDisplay tool={tool} />);
      expect(screen.getByText("Renaming Button.jsx to Button.tsx")).toBeDefined();
    });
  });

  describe("loading states", () => {
    it("shows loading spinner when tool is in progress", () => {
      const tool = {
        toolCallId: "10",
        toolName: "str_replace_editor",
        args: { command: "create", path: "/App.jsx" },
        state: "call" as const,
      };

      const { container } = render(<ToolInvocationDisplay tool={tool} />);
      const spinner = container.querySelector(".animate-spin");
      expect(spinner).toBeDefined();
    });

    it("shows green dot when tool is completed", () => {
      const tool = {
        toolCallId: "11",
        toolName: "str_replace_editor",
        args: { command: "create", path: "/App.jsx" },
        state: "result" as const,
        result: { success: true },
      };

      const { container } = render(<ToolInvocationDisplay tool={tool} />);
      const greenDot = container.querySelector(".bg-emerald-500");
      expect(greenDot).toBeDefined();
    });

    it("shows loading spinner when result is not present", () => {
      const tool = {
        toolCallId: "12",
        toolName: "str_replace_editor",
        args: { command: "create", path: "/App.jsx" },
        state: "result" as const,
        result: null,
      };

      const { container } = render(<ToolInvocationDisplay tool={tool} />);
      const spinner = container.querySelector(".animate-spin");
      expect(spinner).toBeDefined();
    });
  });

  describe("edge cases", () => {
    it("handles unknown tool names gracefully", () => {
      const tool = {
        toolCallId: "13",
        toolName: "unknown_tool_name",
        args: {},
        state: "call" as const,
      };

      render(<ToolInvocationDisplay tool={tool} />);
      expect(screen.getByText("unknown tool name")).toBeDefined();
    });

    it("handles missing path gracefully", () => {
      const tool = {
        toolCallId: "14",
        toolName: "str_replace_editor",
        args: { command: "create" },
        state: "call" as const,
      };

      render(<ToolInvocationDisplay tool={tool} />);
      expect(screen.getByText("Creating file")).toBeDefined();
    });

    it("handles missing args gracefully", () => {
      const tool = {
        toolCallId: "15",
        toolName: "str_replace_editor",
        args: null,
        state: "call" as const,
      };

      render(<ToolInvocationDisplay tool={tool} />);
      expect(screen.getByText("Working on file")).toBeDefined();
    });

    it("handles unknown command gracefully", () => {
      const tool = {
        toolCallId: "16",
        toolName: "str_replace_editor",
        args: { command: "unknown_command", path: "/test.js" },
        state: "call" as const,
      };

      render(<ToolInvocationDisplay tool={tool} />);
      expect(screen.getByText("Working on test.js")).toBeDefined();
    });
  });
});
