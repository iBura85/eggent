"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { copyTextToClipboard } from "@/lib/utils";

interface CodeBlockProps {
  code: string;
  language?: string;
}

export function CodeBlock({ code, language }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const copiedOk = await copyTextToClipboard(code);
    if (!copiedOk) return;
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative my-3 min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-black/[0.28] text-[var(--chat-reading-foreground)] shadow-[0_18px_42px_rgba(0,0,0,0.18)]">
      <div className="flex items-center justify-between border-b border-white/8 bg-black/[0.22] px-4 py-2">
        <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--chat-reading-muted)]">
          {language || "code"}
        </span>
        <Button
          variant="ghost"
          size="xs"
          onClick={handleCopy}
          className="h-7 gap-1 rounded-full px-2.5 text-xs text-muted-foreground hover:text-foreground"
        >
          {copied ? (
            <>
              <Check className="size-3" />
              Copied
            </>
          ) : (
            <>
              <Copy className="size-3" />
              Copy
            </>
          )}
        </Button>
      </div>
      <pre className="max-w-full overflow-x-auto p-4 text-[13px] leading-6 md:text-sm">
        <code className={language ? `language-${language}` : ""}>
          {code}
        </code>
      </pre>
    </div>
  );
}
