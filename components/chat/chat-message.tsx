"use client";

import { cn } from "@/lib/utils";
import { Bot, User, Terminal, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { JSX } from "react";

interface ToolExecution {
  toolName: string;
  status: "running" | "success" | "error";
  input?: Record<string, unknown>;
  output?: string;
  error?: string;
}

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  toolExecutions?: ToolExecution[];
  isStreaming?: boolean;
}

export function ChatMessage({
  role,
  content,
  toolExecutions,
  isStreaming,
}: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div
      className={cn(
        "flex gap-4 p-4 rounded-lg",
        isUser ? "bg-secondary/50" : "bg-card"
      )}
    >
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center",
          isUser ? "bg-primary" : "bg-accent"
        )}
      >
        {isUser ? (
          <User className="w-5 h-5 text-primary-foreground" />
        ) : (
          <Bot className="w-5 h-5 text-accent-foreground" />
        )}
      </div>

      <div className="flex-1 space-y-3 overflow-hidden">
        <div className="text-sm font-medium text-muted-foreground">
          {isUser ? "You" : "MATLAB Assistant"}
        </div>

        {toolExecutions && toolExecutions.length > 0 && (
          <div className="space-y-2">
            {toolExecutions.map((tool, index) => (
              <div
                key={index}
                className="rounded-md border border-border bg-muted/50 overflow-hidden"
              >
                <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-muted/80">
                  <Terminal className="w-4 h-4 text-primary" />
                  <span className="text-xs font-mono text-foreground">
                    {tool.toolName}
                  </span>
                  <div className="ml-auto">
                    {tool.status === "running" && (
                      <Loader2 className="w-4 h-4 text-primary animate-spin" />
                    )}
                    {tool.status === "success" && (
                      <CheckCircle2 className="w-4 h-4 text-accent" />
                    )}
                    {tool.status === "error" && (
                      <AlertCircle className="w-4 h-4 text-destructive" />
                    )}
                  </div>
                </div>

                {tool.input && (
                  <div className="px-3 py-2 border-b border-border">
                    <div className="text-xs text-muted-foreground mb-1">Input:</div>
                    <pre className="text-xs font-mono text-syntax-variable overflow-x-auto">
                      {JSON.stringify(tool.input, null, 2)}
                    </pre>
                  </div>
                )}

                {tool.output && (
                  <div className="px-3 py-2">
                    <div className="text-xs text-muted-foreground mb-1">Output:</div>
                    <pre className="text-xs font-mono text-syntax-string whitespace-pre-wrap overflow-x-auto">
                      {tool.output}
                    </pre>
                  </div>
                )}

                {tool.error && (
                  <div className="px-3 py-2">
                    <div className="text-xs text-muted-foreground mb-1">Error:</div>
                    <pre className="text-xs font-mono text-destructive whitespace-pre-wrap">
                      {tool.error}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {content && (
          <div className="prose prose-invert prose-sm max-w-none">
            <MatlabMarkdown content={content} />
          </div>
        )}

        {isStreaming && (
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse [animation-delay:0.2s]" />
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse [animation-delay:0.4s]" />
          </div>
        )}
      </div>
    </div>
  );
}

function MatlabMarkdown({ content }: { content: string }) {
  return (
    <ReactMarkdown
      components={{
        code({ className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || "");
          const isBlock = typeof children === "string" && children.includes("\n") || match;
          if (isBlock) {
            const language = match?.[1] || "matlab";
            const code = String(children).replace(/\n$/, "");
            return <MatlabCodeBlock code={code} language={language} />;
          }
          return (
            <code className="px-1.5 py-0.5 rounded bg-muted text-sm font-mono" {...props}>
              {children}
            </code>
          );
        },
        pre({ children }) {
          return <>{children}</>;
        },
        p({ children }) {
          return <p className="text-foreground leading-relaxed">{children}</p>;
        },
        ul({ children }) {
          return <ul className="list-disc list-inside space-y-1 text-foreground">{children}</ul>;
        },
        ol({ children }) {
          return <ol className="list-decimal list-inside space-y-1 text-foreground">{children}</ol>;
        },
        h1({ children }) {
          return <h1 className="text-xl font-bold text-foreground">{children}</h1>;
        },
        h2({ children }) {
          return <h2 className="text-lg font-semibold text-foreground">{children}</h2>;
        },
        h3({ children }) {
          return <h3 className="text-base font-semibold text-foreground">{children}</h3>;
        },
        strong({ children }) {
          return <strong className="font-semibold">{children}</strong>;
        },
        blockquote({ children }) {
          return <blockquote className="border-l-2 border-primary pl-4 italic text-muted-foreground">{children}</blockquote>;
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

function MatlabCodeBlock({
  code,
  language,
}: {
  code: string;
  language: string;
}) {
  // Basic MATLAB syntax highlighting
  const highlightMatlab = (code: string) => {
    const keywords = [
      "function",
      "end",
      "if",
      "else",
      "elseif",
      "for",
      "while",
      "switch",
      "case",
      "otherwise",
      "try",
      "catch",
      "return",
      "break",
      "continue",
      "global",
      "persistent",
      "classdef",
      "properties",
      "methods",
      "events",
    ];

    const lines = code.split("\n");
    return lines.map((line, lineIndex) => {
      // Handle comments
      const commentIndex = line.indexOf("%");
      let codePart = line;
      let commentPart = "";

      if (commentIndex !== -1) {
        codePart = line.substring(0, commentIndex);
        commentPart = line.substring(commentIndex);
      }

      // Tokenize code part
      const tokens: JSX.Element[] = [];
      let remaining = codePart;
      let tokenIndex = 0;

      while (remaining.length > 0) {
        // Check for strings
        const stringMatch = remaining.match(/^(['"])(.*?)\1/);
        if (stringMatch) {
          tokens.push(
            <span key={`${lineIndex}-${tokenIndex++}`} className="text-syntax-string">
              {stringMatch[0]}
            </span>
          );
          remaining = remaining.substring(stringMatch[0].length);
          continue;
        }

        // Check for numbers
        const numberMatch = remaining.match(/^\d+\.?\d*/);
        if (numberMatch) {
          tokens.push(
            <span key={`${lineIndex}-${tokenIndex++}`} className="text-syntax-number">
              {numberMatch[0]}
            </span>
          );
          remaining = remaining.substring(numberMatch[0].length);
          continue;
        }

        // Check for keywords and identifiers
        const wordMatch = remaining.match(/^[a-zA-Z_]\w*/);
        if (wordMatch) {
          const word = wordMatch[0];
          if (keywords.includes(word)) {
            tokens.push(
              <span key={`${lineIndex}-${tokenIndex++}`} className="text-syntax-keyword font-semibold">
                {word}
              </span>
            );
          } else if (remaining.substring(word.length).trimStart().startsWith("(")) {
            tokens.push(
              <span key={`${lineIndex}-${tokenIndex++}`} className="text-syntax-function">
                {word}
              </span>
            );
          } else {
            tokens.push(
              <span key={`${lineIndex}-${tokenIndex++}`} className="text-syntax-variable">
                {word}
              </span>
            );
          }
          remaining = remaining.substring(word.length);
          continue;
        }

        // Default: take one character
        tokens.push(
          <span key={`${lineIndex}-${tokenIndex++}`} className="text-foreground">
            {remaining[0]}
          </span>
        );
        remaining = remaining.substring(1);
      }

      // Add comment if present
      if (commentPart) {
        tokens.push(
          <span key={`${lineIndex}-comment`} className="text-syntax-comment italic">
            {commentPart}
          </span>
        );
      }

      return (
        <div key={lineIndex} className="flex">
          <span className="w-8 text-right pr-3 text-muted-foreground select-none text-xs">
            {lineIndex + 1}
          </span>
          <span>{tokens}</span>
        </div>
      );
    });
  };

  return (
    <div className="rounded-md border border-border bg-muted/30 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-muted/50">
        <span className="text-xs text-muted-foreground font-mono">
          {language || "matlab"}
        </span>
        <button
          onClick={() => navigator.clipboard.writeText(code)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Copy
        </button>
      </div>
      <pre className="p-3 text-sm font-mono overflow-x-auto">
        {language === "matlab" || language === "" ? highlightMatlab(code) : code}
      </pre>
    </div>
  );
}
