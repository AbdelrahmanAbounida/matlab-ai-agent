"use client";

import React from "react";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Send, Paperclip, StopCircle, X, FileText, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { ConnectionState } from "@/components/matlab/connection-status";
import { showErrorToast } from "../ui/toast";

export interface AttachedFile {
  id: string;
  file: File;
  previewUrl?: string;
}

interface ChatInputProps {
  onSend: (message: string, files?: AttachedFile[]) => void;
  onStop?: () => void;
  isLoading?: boolean;
  placeholder?: string;
  connectionState?: ConnectionState;
}

export function ChatInput({
  onSend,
  onStop,
  isLoading,
  placeholder = "Ask me to create a Simulink model, run MATLAB code, or help with your project...",
  connectionState,
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      attachedFiles.forEach((f) => {
        if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
      });
    };
  }, []);

  const addFiles = useCallback((fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    const newAttachments: AttachedFile[] = files.map((file) => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
    }));

    setAttachedFiles((prev) => [...prev, ...newAttachments]);
  }, []);

  const removeFile = useCallback((id: string) => {
    setAttachedFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file?.previewUrl) URL.revokeObjectURL(file.previewUrl);
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && attachedFiles.length === 0) || isLoading) return;
    if (connectionState && connectionState !== "connected") {
      showErrorToast({
        title: "MATLAB is not connected",
        description: "Please connect to MATLAB first before sending messages.",
        position: "bottom-left",
      });
      return;
    }
    onSend(input.trim(), attachedFiles.length > 0 ? attachedFiles : undefined);
    setInput("");
    setAttachedFiles([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const files: File[] = [];
    for (const item of items) {
      if (item.kind === "file") {
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    }
    if (files.length > 0) {
      addFiles(files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer?.files) {
      addFiles(e.dataTransfer.files);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div
        className={cn(
          "flex flex-col rounded-lg border border-border bg-white transition-colors",
          isDragging && "border-primary border-dashed bg-primary/5"
        )}
      >
        {/* Attached files preview */}
        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 px-3 pt-3">
            {attachedFiles.map((af) => (
              <div
                key={af.id}
                className="group relative flex items-center gap-1.5 rounded-md border border-border bg-muted/50 px-2 py-1.5 text-xs"
              >
                {af.previewUrl ? (
                  <img
                    src={af.previewUrl}
                    alt={af.file.name}
                    className="h-8 w-8 rounded object-cover"
                  />
                ) : (
                  <FileText className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="max-w-[120px] truncate text-muted-foreground">
                  {af.file.name}
                </span>
                <button
                  type="button"
                  onClick={() => removeFile(af.id)}
                  className="ml-1 rounded-full p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input row */}
        <div className="flex items-end gap-2 p-3">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) addFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 h-9 w-9 text-muted-foreground hover:text-foreground"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="w-5 h-5" />
            <span className="sr-only">Attach file</span>
          </Button>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={placeholder}
            rows={1}
            className={cn(
              "flex-1 resize-none bg-transparent border-0 outline-none",
              "text-foreground placeholder:text-muted-foreground",
              "text-sm leading-relaxed py-2",
              "min-h-10 max-h-50"
            )}
          />

          {isLoading ? (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              onClick={onStop}
              className="shrink-0 h-9 w-9"
            >
              <StopCircle className="w-5 h-5" />
              <span className="sr-only">Stop generation</span>
            </Button>
          ) : (
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() && attachedFiles.length === 0}
              className="shrink-0 h-9 w-9"
            >
              <Send className="w-5 h-5" />
              <span className="sr-only">Send message</span>
            </Button>
          )}
        </div>

        {/* Drag overlay */}
        {isDragging && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-primary/10 border-2 border-dashed border-primary pointer-events-none">
            <p className="text-sm font-medium text-primary">Drop files here</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-2 px-1">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>Press Enter to send, Shift+Enter for new line</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2 py-0.5 rounded text-muted-foreground font-mono">
            Ctrl+K
          </span>
          <span className="text-muted-foreground">Quick actions</span>
        </div>
      </div>
    </form>
  );
}
