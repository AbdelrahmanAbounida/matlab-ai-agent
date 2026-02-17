"use client";

import { cn } from "@/lib/utils";
import { Loader2, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export type ConnectionState = "disconnected" | "connecting" | "connected" | "error";

interface ConnectionStatusProps {
  state: ConnectionState;
  matlabVersion?: string;
  onReconnect?: () => void;
  errorMessage?: string;
}

export function ConnectionStatus({
  state,
  matlabVersion,
  onReconnect,
  errorMessage,
}: ConnectionStatusProps) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-0.5 rounded-md border",
          state === "connected" && "bg-zinc-100 border-zinc-300",
          state === "connecting" && "bg-primary border-primary/30",
          state === "disconnected" && "bg-muted border-border",
          state === "error" && "bg-zinc-100 border-zinc-300"
        )}
      >
        {state === "connecting" && (
          <>
            <Loader2 className="w-4 h-4 text-primary animate-spin" />
            <span className="text-sm text-foreground">Connecting to MATLAB...</span>
          </>
        )}

        {state === "connected" && (
          <>
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span className="text-sm text-foreground">
              Connected to MATLAB {matlabVersion && `(${matlabVersion})`}
            </span>
          </>
        )}

        {state === "disconnected" && (
          <>
            <XCircle className="w-4 h-4 text-destructive" />
            <span className="text-sm text-muted-foreground">Not connected</span>
          </>
        )}

        {state === "error" && (
          <>
            <XCircle className="w-4 h-4 text-red-500" />
            <span className="text-sm text-foreground">No MATLAB detected</span>
          </>
        )}
      </div>

      {state === "disconnected" && onReconnect && (
        <Button
          variant="outline"
          size="sm"
          onClick={onReconnect}
          className="h-7 shadow-none"
        >
          <RefreshCw className="w-3 h-3 mr-1" />
          Connect
        </Button>
      )}

      {state === "error" && onReconnect && (
        <Button
          variant="outline"
          size="sm"
          onClick={onReconnect}
          className="h-7"
        >
          <RefreshCw className="w-3 h-3 mr-1" />
          Retry
        </Button>
      )}
    </div>
  );
}
