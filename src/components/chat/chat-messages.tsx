"use client";

import { useEffect, useRef } from "react";
import { MessageBubble } from "./message-bubble";
import { Loader2 } from "lucide-react";
import type { UIMessage } from "ai";

interface ChatMessagesProps {
  messages: UIMessage[];
  isLoading: boolean;
}

export function ChatMessages({ messages, isLoading }: ChatMessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const shouldStickToBottomRef = useRef(true);

  // Auto-scroll while the user stays near the bottom.
  useEffect(() => {
    if (!shouldStickToBottomRef.current) return;
    endRef.current?.scrollIntoView({ behavior: messages.length > 0 ? "smooth" : "auto" });
  }, [messages, isLoading]);

  useEffect(() => {
    shouldStickToBottomRef.current = true;
  }, [messages[0]?.id]);

  const handleScroll = () => {
    const element = scrollRef.current;
    if (!element) return;
    const distanceFromBottom =
      element.scrollHeight - element.scrollTop - element.clientHeight;
    shouldStickToBottomRef.current = distanceFromBottom < 80;
  };

  if (messages.length === 0 && !isLoading) {
    return (
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="chat-scrollbar flex flex-1 min-h-0 min-w-0 items-center justify-center overflow-y-auto overflow-x-hidden px-5 py-8 md:px-8"
      >
        <div className="max-w-xl space-y-4 py-8 text-center">
          <div className="flex justify-center">
            <div className="flex size-16 items-center justify-center rounded-[1.75rem] border border-white/10 bg-white/5 text-primary shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
              <svg
                className="size-8 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
                />
              </svg>
            </div>
          </div>
          <h3 className="text-xl font-semibold tracking-tight">Start a conversation</h3>
          <p className="text-sm leading-7 text-muted-foreground md:text-[15px]">
            Send a message to begin chatting with the AI agent. It can execute
            code, search the web, manage memory, and more.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="chat-scrollbar flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden px-5 pb-8 pt-8 md:px-8 md:pt-10"
    >
      <div className="mx-auto min-w-0 w-full max-w-[54rem] space-y-8 pb-6">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {isLoading && messages.length > 0 && (
          <div className="mx-auto flex w-full max-w-[48rem] items-center gap-3 py-1 text-muted-foreground">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-primary">
              <Loader2 className="size-3.5 animate-spin" />
            </div>
            <div className="text-sm">
              <span>Thinking...</span>
            </div>
          </div>
        )}

        <div ref={endRef} className="h-px" />
      </div>
    </div>
  );
}
