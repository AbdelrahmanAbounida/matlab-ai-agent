"use client";

import React from "react"

import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Save, Play, X, FileCode } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CodeEditorProps {
  fileName: string;
  initialContent?: string;
  language?: "matlab" | "text";
  onSave?: (content: string) => void;
  onRun?: (content: string) => void;
  onClose?: () => void;
  className?: string;
}

export function CodeEditor({
  fileName,
  initialContent = "",
  language = "matlab",
  onSave,
  onRun,
  onClose,
  className,
}: CodeEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [isDirty, setIsDirty] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setContent(initialContent);
    setIsDirty(false);
  }, [initialContent]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setIsDirty(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle Tab key for indentation
    if (e.key === "Tab") {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const newContent = content.substring(0, start) + "    " + content.substring(end);
      setContent(newContent);
      // Move cursor after the tab
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 4;
        }
      }, 0);
    }

    // Ctrl+S to save
    if (e.key === "s" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
    }

    // Ctrl+Enter to run
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleRun();
    }
  };

  const handleSave = () => {
    onSave?.(content);
    setIsDirty(false);
  };

  const handleRun = () => {
    onRun?.(content);
  };

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  const handleCursorChange = () => {
    if (textareaRef.current) {
      const text = textareaRef.current.value;
      const pos = textareaRef.current.selectionStart;
      const lines = text.substring(0, pos).split("\n");
      setCursorPosition({
        line: lines.length,
        column: lines[lines.length - 1].length + 1,
      });
    }
  };

  const lineCount = content.split("\n").length;

  return (
    <div className={cn("flex flex-col h-full bg-card", className)}>
      {/* Tab bar */}
      <div className="flex items-center border-b border-border bg-muted/50">
        <div className="flex items-center gap-2 px-4 py-2 border-r border-border bg-card">
          <FileCode className="w-4 h-4 text-syntax-function" />
          <span className="text-sm font-medium">
            {fileName}
            {isDirty && <span className="text-primary ml-1">*</span>}
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className="ml-2 p-0.5 rounded hover:bg-muted transition-colors"
            >
              <X className="w-3 h-3 text-muted-foreground" />
            </button>
          )}
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2 px-4">
          {onRun && (
            <Button variant="ghost" size="sm" className="h-7" onClick={handleRun}>
              <Play className="w-3 h-3 mr-1" />
              Run
            </Button>
          )}
          {onSave && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7"
              onClick={handleSave}
              disabled={!isDirty}
            >
              <Save className="w-3 h-3 mr-1" />
              Save
            </Button>
          )}
        </div>
      </div>

      {/* Editor area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Line numbers */}
        <div
          ref={lineNumbersRef}
          className="w-12 bg-muted/30 border-r border-border overflow-hidden select-none"
        >
          <div className="py-2 px-2 font-mono text-xs text-right text-muted-foreground">
            {Array.from({ length: lineCount }, (_, i) => (
              <div key={i} className="h-5 leading-5">
                {i + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Code content */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onScroll={handleScroll}
            onClick={handleCursorChange}
            onKeyUp={handleCursorChange}
            spellCheck={false}
            className={cn(
              "absolute inset-0 w-full h-full p-2 font-mono text-sm",
              "bg-transparent text-foreground resize-none outline-none",
              "leading-5"
            )}
            placeholder="Enter MATLAB code here..."
          />
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-1 border-t border-border bg-muted/50 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>{language.toUpperCase()}</span>
          <span>
            Ln {cursorPosition.line}, Col {cursorPosition.column}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span>{content.length} characters</span>
          <span>{lineCount} lines</span>
        </div>
      </div>
    </div>
  );
}
