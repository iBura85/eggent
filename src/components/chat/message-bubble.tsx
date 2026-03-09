"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CodeBlock } from "./code-block";
import { ToolOutput } from "./tool-output";
import type { UIMessage } from "ai";

interface MessageBubbleProps {
  message: UIMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  // Extract text content from parts
  const textContent = message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");

  // Extract tool parts
  const toolParts = message.parts.filter(
    (p) => p.type.startsWith("tool-") || p.type === "dynamic-tool"
  );

  // The agent often emits final answers via the `response` tool with no text part.
  // Surface that output as regular assistant text so the user always sees it.
  const responseToolText = toolParts
    .map((part) => {
      if (part.type === "dynamic-tool") {
        const dp = part as {
          toolName?: string;
          state?: string;
          output?: unknown;
        };
        if (dp.toolName !== "response" || dp.state !== "output-available") return "";
        return typeof dp.output === "string" ? dp.output : JSON.stringify(dp.output ?? "");
      }

      if (!part.type.startsWith("tool-")) return "";
      const tp = part as {
        type: string;
        state?: string;
        output?: unknown;
      };
      const toolName = tp.type.replace("tool-", "");
      if (toolName !== "response" || tp.state !== "output-available") return "";
      return typeof tp.output === "string" ? tp.output : JSON.stringify(tp.output ?? "");
    })
    .filter(Boolean)
    .join("\n\n");

  const visibleTextContent = textContent || responseToolText;
  const renderedToolParts = toolParts.map((part, idx) => {
    if (part.type === "dynamic-tool") {
      const dp = part as {
        type: "dynamic-tool";
        toolName: string;
        toolCallId: string;
        state: string;
        input?: unknown;
        output?: unknown;
      };
      return (
        <ToolOutput
          key={`tool-${dp.toolCallId}-${idx}`}
          toolName={dp.toolName}
          args={
            typeof dp.input === "object" && dp.input !== null
              ? (dp.input as Record<string, unknown>)
              : {}
          }
          result={
            dp.state === "output-available"
              ? typeof dp.output === "string"
                ? dp.output
                : JSON.stringify(dp.output)
              : dp.state === "output-error"
                ? "Error occurred"
                : "Running..."
          }
        />
      );
    }

    if (part.type.startsWith("tool-")) {
      const tp = part as {
        type: string;
        toolCallId?: string;
        state?: string;
        input?: unknown;
        output?: unknown;
      };
      const toolName = part.type.replace("tool-", "");
      return (
        <ToolOutput
          key={`tool-${tp.toolCallId || idx}-${idx}`}
          toolName={toolName}
          args={
            typeof tp.input === "object" && tp.input !== null
              ? (tp.input as Record<string, unknown>)
              : {}
          }
          result={
            tp.state === "output-available"
              ? typeof tp.output === "string"
                ? tp.output
                : JSON.stringify(tp.output)
              : tp.state === "output-error"
                ? "Error occurred"
                : "Running..."
          }
        />
      );
    }

    return null;
  });

  return (
    <div className="min-w-0">
      {isUser ? (
        <div className="flex justify-center py-1.5 md:py-2">
          <div className="max-w-[min(100%,42rem)] rounded-[1.75rem] border border-white/8 bg-black/[0.55] px-5 py-3 text-[16px] leading-7 text-[var(--chat-reading-foreground)] shadow-[0_18px_42px_rgba(0,0,0,0.18)] md:text-[17px]">
            <p className="whitespace-pre-wrap break-words">{visibleTextContent}</p>
          </div>
        </div>
      ) : (
        <div className="mx-auto flex w-full max-w-[48rem] min-w-0 flex-col gap-4">
          {renderedToolParts.length > 0 ? (
            <div className="space-y-2">
              {renderedToolParts}
            </div>
          ) : null}

          {visibleTextContent ? (
            <div className="min-w-0 text-[var(--chat-reading-foreground)]">
              <div className="font-reading text-[1.08rem] leading-[1.85] md:text-[1.28rem] md:leading-[1.9]">
                <MarkdownContent content={visibleTextContent} />
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p({ children, ...props }) {
          return (
            <p
              className="mb-5 whitespace-pre-wrap break-words last:mb-0"
              {...props}
            >
              {children}
            </p>
          );
        },
        strong({ children, ...props }) {
          return (
            <strong className="font-semibold text-[oklch(0.97_0.01_80)]" {...props}>
              {children}
            </strong>
          );
        },
        code({ className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || "");
          const isInline = !match;
          if (isInline) {
            return (
              <code
                className="rounded-md border border-white/8 bg-white/[0.06] px-1.5 py-0.5 text-[0.9em]"
                {...props}
              >
                {children}
              </code>
            );
          }
          return (
            <CodeBlock
              code={String(children).replace(/\n$/, "")}
              language={match[1]}
            />
          );
        },
        ul({ children, ...props }) {
          return (
            <ul className="my-6 list-disc pl-7 space-y-3" {...props}>
              {children}
            </ul>
          );
        },
        ol({ children, ...props }) {
          return (
            <ol className="my-6 list-decimal pl-7 space-y-3" {...props}>
              {children}
            </ol>
          );
        },
        li({ children, ...props }) {
          return (
            <li className="pl-1 marker:text-[var(--chat-reading-muted)]" {...props}>
              {children}
            </li>
          );
        },
        h1({ children, ...props }) {
          return (
            <h1 className="mb-4 mt-8 font-sans text-2xl font-semibold tracking-tight first:mt-0" {...props}>
              {children}
            </h1>
          );
        },
        h2({ children, ...props }) {
          return (
            <h2 className="mb-4 mt-8 font-sans text-xl font-semibold tracking-tight first:mt-0" {...props}>
              {children}
            </h2>
          );
        },
        h3({ children, ...props }) {
          return (
            <h3 className="mb-3 mt-6 font-sans text-lg font-semibold tracking-tight first:mt-0" {...props}>
              {children}
            </h3>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
