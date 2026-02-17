"use client";

import React from "react"

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  ChevronRight,
  ChevronDown,
  Box,
  Signal,
  Gauge,
  Calculator,
  GitBranch,
  Layers,
} from "lucide-react";

interface BlockCategory {
  name: string;
  icon: React.ElementType;
  blocks: string[];
}

const blockCategories: BlockCategory[] = [
  {
    name: "Sources",
    icon: Signal,
    blocks: ["Constant", "Step", "Ramp", "Sine Wave", "Pulse Generator", "Clock", "From Workspace"],
  },
  {
    name: "Sinks",
    icon: Gauge,
    blocks: ["Scope", "Display", "To Workspace", "Terminator", "XY Graph"],
  },
  {
    name: "Continuous",
    icon: Box,
    blocks: ["Integrator", "Derivative", "Transfer Fcn", "State-Space", "Zero-Pole"],
  },
  {
    name: "Discrete",
    icon: Layers,
    blocks: ["Discrete-Time Integrator", "Zero-Order Hold", "Unit Delay", "Discrete Transfer Fcn"],
  },
  {
    name: "Math Operations",
    icon: Calculator,
    blocks: ["Sum", "Product", "Gain", "Abs", "Sign", "Math Function", "Trigonometric Function"],
  },
  {
    name: "Signal Routing",
    icon: GitBranch,
    blocks: ["Mux", "Demux", "Switch", "Multiport Switch", "Bus Creator", "Bus Selector"],
  },
];

interface BlockPaletteProps {
  onBlockSelect?: (blockType: string) => void;
  className?: string;
}

export function BlockPalette({ onBlockSelect, className }: BlockPaletteProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(["Sources", "Math Operations"])
  );
  const [searchTerm, setSearchTerm] = useState("");

  const toggleCategory = (name: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const filteredCategories = searchTerm
    ? blockCategories
        .map((category) => ({
          ...category,
          blocks: category.blocks.filter((block) =>
            block.toLowerCase().includes(searchTerm.toLowerCase())
          ),
        }))
        .filter((category) => category.blocks.length > 0)
    : blockCategories;

  return (
    <div className={cn("flex flex-col h-full", className)}>
      <div className="px-3 py-2 border-b border-border">
        <input
          type="text"
          placeholder="Search blocks..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-1.5 text-sm rounded-md border border-input bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-zinc-900"
        />
      </div>

      <div className="flex-1 overflow-auto py-2">
        {filteredCategories.map((category) => {
          const isExpanded = expandedCategories.has(category.name);
          const Icon = category.icon;

          return (
            <div key={category.name}>
              <button
                onClick={() => toggleCategory(category.name)}
                className="flex items-center gap-2 w-full px-3 py-1.5 text-left hover:bg-muted/50 transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
                <Icon className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">
                  {category.name}
                </span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {category.blocks.length}
                </span>
              </button>

              {isExpanded && (
                <div className="pl-9 pr-2">
                  {category.blocks.map((block) => (
                    <button
                      key={block}
                      onClick={() => onBlockSelect?.(block)}
                      className="flex items-center gap-2 w-full px-2 py-1 text-left text-sm text-foreground hover:bg-primary/10 hover:text-primary rounded transition-colors"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("blockType", block);
                      }}
                    >
                      <div className="w-4 h-4 rounded border border-border flex items-center justify-center text-[8px] bg-muted">
                        {block.charAt(0)}
                      </div>
                      {block}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="px-3 py-2 border-t border-border text-xs text-muted-foreground">
        Drag blocks to the canvas or click to insert
      </div>
    </div>
  );
}
