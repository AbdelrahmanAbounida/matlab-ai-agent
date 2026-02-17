"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  ChevronRight,
  ChevronDown,
  FileCode,
  FolderOpen,
  Folder,
  FileText,
  File,
} from "lucide-react";

export interface FileNode {
  name: string;
  type: "file" | "folder";
  children?: FileNode[];
  path: string;
}

interface FileTreeProps {
  files: FileNode[];
  onFileSelect?: (file: FileNode) => void;
  selectedPath?: string;
}

export function FileTree({ files, onFileSelect, selectedPath }: FileTreeProps) {
  return (
    <div className="py-2">
      {files.map((file) => (
        <FileTreeNode
          key={file.path}
          node={file}
          depth={0}
          onSelect={onFileSelect}
          selectedPath={selectedPath}
        />
      ))}
    </div>
  );
}

interface FileTreeNodeProps {
  node: FileNode;
  depth: number;
  onSelect?: (file: FileNode) => void;
  selectedPath?: string;
}

function FileTreeNode({ node, depth, onSelect, selectedPath }: FileTreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isSelected = selectedPath === node.path;
  const isFolder = node.type === "folder";

  const getFileIcon = (name: string) => {
    const ext = name.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "m":
        return <FileCode className="w-4 h-4 text-syntax-function" />;
      case "slx":
      case "mdl":
        return <FileCode className="w-4 h-4 text-syntax-keyword" />;
      case "mat":
        return <FileText className="w-4 h-4 text-syntax-string" />;
      case "fig":
        return <FileText className="w-4 h-4 text-syntax-number" />;
      default:
        return <File className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const handleClick = () => {
    if (isFolder) {
      setIsExpanded(!isExpanded);
    } else {
      onSelect?.(node);
    }
  };

  return (
    <div>
      <button
        onClick={handleClick}
        className={cn(
          "flex items-center gap-1.5 w-full px-2 py-1 text-left text-sm hover:bg-muted/50 rounded transition-colors",
          isSelected && "bg-primary/10 text-primary"
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {isFolder ? (
          <>
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
            {isExpanded ? (
              <FolderOpen className="w-4 h-4 text-syntax-number" />
            ) : (
              <Folder className="w-4 h-4 text-syntax-number" />
            )}
          </>
        ) : (
          <>
            <span className="w-4" />
            {getFileIcon(node.name)}
          </>
        )}
        <span className="truncate">{node.name}</span>
      </button>

      {isFolder && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeNode
              key={child.path}
              node={child}
              depth={depth + 1}
              onSelect={onSelect}
              selectedPath={selectedPath}
            />
          ))}
        </div>
      )}
    </div>
  );
}
