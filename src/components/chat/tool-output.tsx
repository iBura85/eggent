"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Terminal,
  Brain,
  Search,
  FileText,
  Bot,
  Puzzle,
  CalendarClock,
  FolderOpen,
} from "lucide-react";
import { CodeBlock } from "./code-block";

interface ToolOutputProps {
  toolName: string;
  args: Record<string, unknown>;
  result: string;
}

const TOOL_ICONS: Record<string, React.ElementType> = {
  code_execution: Terminal,
  memory_save: Brain,
  memory_load: Brain,
  memory_delete: Brain,
  search_web: Search,
  knowledge_query: FileText,
  call_subordinate: Bot,
  load_skill: Puzzle,
  load_skill_resource: Puzzle,
  install_skill_from_github: Puzzle,
  create_skill: Puzzle,
  update_skill: Puzzle,
  delete_skill: Puzzle,
  write_skill_file: Puzzle,
  upsert_mcp_server: Puzzle,
  delete_mcp_server: Puzzle,
  cron: CalendarClock,
  list_projects: FolderOpen,
  get_current_project: FolderOpen,
  switch_project: FolderOpen,
  create_project: FolderOpen,
};

const TOOL_LABELS: Record<string, string> = {
  code_execution: "Code Execution",
  memory_save: "Memory Save",
  memory_load: "Memory Load",
  memory_delete: "Memory Delete",
  search_web: "Web Search",
  knowledge_query: "Knowledge Query",
  call_subordinate: "Subordinate Agent",
  load_skill: "Load Skill",
  load_skill_resource: "Load Skill Resource",
  install_skill_from_github: "Install Skill From GitHub",
  create_skill: "Create Skill",
  update_skill: "Update Skill",
  delete_skill: "Delete Skill",
  write_skill_file: "Write Skill File",
  upsert_mcp_server: "Upsert MCP Server",
  delete_mcp_server: "Delete MCP Server",
  cron: "Cron",
  list_projects: "List Projects",
  get_current_project: "Current Project",
  switch_project: "Switch Project",
  create_project: "Create Project",
  response: "Response",
};

export function ToolOutput({ toolName, args, result }: ToolOutputProps) {
  const [expanded, setExpanded] = useState(false);
  const Icon = TOOL_ICONS[toolName] || Terminal;
  const label = TOOL_LABELS[toolName] || toolName;

  // Don't render the response tool visually
  if (toolName === "response") return null;

  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-white/7 bg-white/[0.04] text-[var(--chat-reading-foreground)] shadow-[0_16px_36px_rgba(0,0,0,0.12)] backdrop-blur-sm">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full min-w-0 items-center gap-2 px-4 py-3 text-left text-sm transition-colors hover:bg-white/[0.04]"
      >
        {expanded ? (
          <ChevronDown className="size-4 shrink-0" />
        ) : (
          <ChevronRight className="size-4 shrink-0" />
        )}
        <Icon className="size-4 shrink-0 text-primary" />
        <span className="min-w-0 truncate font-medium">{label}</span>
        {toolName === "code_execution" && args.runtime ? (
          <span className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[11px] text-muted-foreground">
            {String(args.runtime)}
          </span>
        ) : null}
        {toolName === "search_web" && args.query ? (
          <span className="truncate text-xs text-[var(--chat-reading-muted)]">
            &quot;{String(args.query)}&quot;
          </span>
        ) : null}
      </button>

      {expanded && (
        <div className="min-w-0 space-y-2 border-t border-white/8 px-4 py-3">
          {/* Tool arguments */}
          {toolName === "code_execution" && args.code ? (
            <CodeBlock
              code={String(args.code)}
              language={
                args.runtime === "python"
                  ? "python"
                  : args.runtime === "nodejs"
                    ? "javascript"
                    : "bash"
              }
            />
          ) : null}

          {/* Tool result */}
          {result ? (
            <div className="min-w-0 text-sm">
              <p className="mb-1 text-xs font-medium uppercase tracking-[0.08em] text-[var(--chat-reading-muted)]">
                Output:
              </p>
              <pre className="max-h-64 overflow-x-auto overflow-y-auto rounded-xl border border-white/8 bg-black/[0.2] p-3 text-xs whitespace-pre-wrap break-words">
                {result}
              </pre>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
