"use client";

import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface OutputLine {
  id: string;
  type: "input" | "output" | "error" | "info";
  content: string;
  timestamp: Date;
}

interface OutputPanelProps {
  lines: OutputLine[];
  onClear?: () => void;
  className?: string;
}

export function OutputPanel({ lines, onClear, className }: OutputPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  return (
    <div className={cn("flex flex-col h-full", className)}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/50">
        <span className="text-sm font-medium text-foreground">Command Window</span>
        {onClear && lines.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="h-7 text-muted-foreground hover:text-foreground"
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Clear
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-auto p-3 font-mono text-sm bg-background">
        {lines.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            MATLAB output will appear here
          </p>
        ) : (
          lines.map((line) => (
            <div
              key={line.id}
              className={cn(
                "py-0.5 whitespace-pre-wrap break-all",
                line.type === "input" && "text-syntax-function",
                line.type === "output" && "text-foreground",
                line.type === "error" && "text-destructive",
                line.type === "info" && "text-muted-foreground italic"
              )}
            >
              {line.type === "input" && (
                <span className="text-syntax-comment mr-2">{">>"}</span>
              )}
              {line.content}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
