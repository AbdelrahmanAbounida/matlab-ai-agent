"use client";

import { cn } from "@/lib/utils";
import { RefreshCw, Trash2, Download, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface WorkspaceVariable {
  name: string;
  type: string;
  size: string;
  value?: string;
}

interface WorkspacePanelProps {
  variables: WorkspaceVariable[];
  onRefresh?: () => void;
  onClear?: () => void;
  onVariableClick?: (variable: WorkspaceVariable) => void;
  onExport?: (variable: WorkspaceVariable) => void;
  isLoading?: boolean;
  className?: string;
}

export function WorkspacePanel({
  variables,
  onRefresh,
  onClear,
  onVariableClick,
  onExport,
  isLoading,
  className,
}: WorkspacePanelProps) {
  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      double: "text-syntax-number",
      single: "text-syntax-number",
      int8: "text-syntax-number",
      int16: "text-syntax-number",
      int32: "text-syntax-number",
      int64: "text-syntax-number",
      uint8: "text-syntax-number",
      uint16: "text-syntax-number",
      uint32: "text-syntax-number",
      uint64: "text-syntax-number",
      char: "text-syntax-string",
      string: "text-syntax-string",
      logical: "text-syntax-keyword",
      struct: "text-syntax-function",
      cell: "text-syntax-function",
      function_handle: "text-syntax-comment",
      table: "text-syntax-variable",
    };
    return colors[type] || "text-foreground";
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/50">
        <span className="text-sm font-medium">Workspace</span>
        <div className="flex items-center gap-1">
          {onRefresh && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={cn("w-3 h-3", isLoading && "animate-spin")} />
              <span className="sr-only">Refresh</span>
            </Button>
          )}
          {onClear && variables.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={onClear}
            >
              <Trash2 className="w-3 h-3" />
              <span className="sr-only">Clear all</span>
            </Button>
          )}
        </div>
      </div>

      {/* Variable list */}
      <div className="flex-1 overflow-auto">
        {variables.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <p className="text-sm text-muted-foreground">
              No variables in workspace
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Execute MATLAB code to create variables
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {/* Table header */}
            <div className="flex items-center px-3 py-1.5 bg-muted/30 text-xs font-medium text-muted-foreground sticky top-0">
              <span className="flex-1">Name</span>
              <span className="w-20 text-center">Size</span>
              <span className="w-16 text-center">Type</span>
              <span className="w-12" />
            </div>

            {/* Variable rows */}
            {variables.map((variable) => (
              <div
                key={variable.name}
                className="flex items-center px-3 py-1.5 hover:bg-muted/50 transition-colors cursor-pointer group"
                onClick={() => onVariableClick?.(variable)}
              >
                <span className="flex-1 font-mono text-sm text-syntax-variable truncate">
                  {variable.name}
                </span>
                <span className="w-20 text-center text-xs text-muted-foreground">
                  {variable.size}
                </span>
                <span
                  className={cn(
                    "w-16 text-center text-xs font-mono",
                    getTypeColor(variable.type)
                  )}
                >
                  {variable.type}
                </span>
                <div className="w-12 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      onVariableClick?.(variable);
                    }}
                  >
                    <Eye className="w-3 h-3" />
                  </Button>
                  {onExport && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        onExport(variable);
                      }}
                    >
                      <Download className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-1.5 border-t border-border bg-muted/50">
        <p className="text-xs text-muted-foreground">
          {variables.length} variable{variables.length !== 1 ? "s" : ""}
        </p>
      </div>
    </div>
  );
}
