"use client";

import { cn } from "@/lib/utils";
import {
  MessageSquare,
  FolderTree,
  Terminal,
  Settings,
  History,
  BookOpen,
  Boxes,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: "chat", icon: MessageSquare, label: "Chat" },
  { id: "files", icon: FolderTree, label: "Files" },
  { id: "terminal", icon: Terminal, label: "Command Window" },
  { id: "simulink", icon: Boxes, label: "Simulink" },
  { id: "history", icon: History, label: "History" },
  { id: "docs", icon: BookOpen, label: "Documentation" },
];

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <div className="flex flex-col h-full w-14 bg-sidebar border-r border-sidebar-border">
      <div className="flex items-center justify-center h-14 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-sm">M</span>
        </div>
      </div>

      <nav className="flex-1 py-2">
        <ul className="space-y-1 px-2">
          {tabs.map((tab) => (
            <li key={tab.id}>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "w-10 h-10 relative group",
                  activeTab === tab.id
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                )}
              >
                <tab.icon className="w-5 h-5" />
                <span className="sr-only">{tab.label}</span>
                
                {/* Tooltip */}
                <span className="absolute left-full ml-2 px-2 py-1 rounded bg-popover text-popover-foreground text-xs whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-lg">
                  {tab.label}
                </span>
              </Button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="py-2 px-2 border-t border-sidebar-border">
        <Button
          variant="ghost"
          size="icon"
          className="w-10 h-10 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
        >
          <Settings className="w-5 h-5" />
          <span className="sr-only">Settings</span>
        </Button>
      </div>
    </div>
  );
}
