import { Loader2 } from "lucide-react";

interface ToolInvocation {
  toolCallId: string;
  toolName: string;
  args: any;
  state: "partial-call" | "call" | "result";
  result?: any;
}

interface ToolInvocationDisplayProps {
  tool: ToolInvocation;
}

/**
 * Get a user-friendly message for a tool invocation
 */
function getToolMessage(tool: ToolInvocation): string {
  const { toolName, args } = tool;

  if (toolName === "str_replace_editor") {
    const command = args?.command;
    const path = args?.path;
    const fileName = path ? path.split("/").pop() : "file";

    switch (command) {
      case "create":
        return `Creating ${fileName}`;
      case "str_replace":
        return `Editing ${fileName}`;
      case "insert":
        return `Editing ${fileName}`;
      case "view":
        return `Viewing ${fileName}`;
      case "undo_edit":
        return `Undoing changes to ${fileName}`;
      default:
        return `Working on ${fileName}`;
    }
  }

  if (toolName === "file_manager") {
    const command = args?.command;
    const path = args?.path;
    const newPath = args?.new_path;
    const fileName = path ? path.split("/").pop() : "file";
    const newFileName = newPath ? newPath.split("/").pop() : "";

    switch (command) {
      case "rename":
        return `Renaming ${fileName} to ${newFileName}`;
      case "delete":
        return `Deleting ${fileName}`;
      default:
        return `Managing ${fileName}`;
    }
  }

  // Fallback for unknown tools
  return toolName.replace(/_/g, " ");
}

/**
 * Display a tool invocation with a user-friendly message
 */
export function ToolInvocationDisplay({ tool }: ToolInvocationDisplayProps) {
  const message = getToolMessage(tool);
  const isComplete = tool.state === "result" && tool.result;

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {isComplete ? (
        <>
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          <span className="text-neutral-700">{message}</span>
        </>
      ) : (
        <>
          <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
          <span className="text-neutral-700">{message}</span>
        </>
      )}
    </div>
  );
}
