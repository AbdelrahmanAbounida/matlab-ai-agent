"use client";

import { cn } from "@/lib/utils";
import { Box, ArrowRight, Play, Square, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface SimulinkBlock {
  id: string;
  type: string;
  name: string;
  position: { x: number; y: number };
  parameters?: Record<string, string>;
}

export interface SimulinkConnection {
  id: string;
  from: { blockId: string; port: number };
  to: { blockId: string; port: number };
}

export interface SimulinkModel {
  name: string;
  blocks: SimulinkBlock[];
  connections: SimulinkConnection[];
}

interface SimulinkViewerProps {
  model: SimulinkModel | null;
  onRunSimulation?: () => void;
  onStopSimulation?: () => void;
  isRunning?: boolean;
  className?: string;
}

export function SimulinkViewer({
  model,
  onRunSimulation,
  onStopSimulation,
  isRunning,
  className,
}: SimulinkViewerProps) {
  if (!model) {
    return (
      <div className={cn("flex flex-col items-center justify-center h-full p-8", className)}>
        <Box className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">No Model Loaded</h3>
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          Ask the AI to create a Simulink model, or load an existing one from your files.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/50">
        <div className="flex items-center gap-2">
          <Box className="w-4 h-4 text-primary" />
          <span className="font-medium text-sm">{model.name}</span>
          <span className="text-xs text-muted-foreground">
            ({model.blocks.length} blocks)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-8">
            <Settings2 className="w-4 h-4 mr-1" />
            Settings
          </Button>
          {isRunning ? (
            <Button
              variant="destructive"
              size="sm"
              className="h-8"
              onClick={onStopSimulation}
            >
              <Square className="w-4 h-4 mr-1" />
              Stop
            </Button>
          ) : (
            <Button
              variant="default"
              size="sm"
              className="h-8"
              onClick={onRunSimulation}
            >
              <Play className="w-4 h-4 mr-1" />
              Run
            </Button>
          )}
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-auto p-4 bg-background">
        <div className="relative min-h-[400px] min-w-[600px]">
          {/* Render connections first (behind blocks) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {model.connections.map((conn) => {
              const fromBlock = model.blocks.find((b) => b.id === conn.from.blockId);
              const toBlock = model.blocks.find((b) => b.id === conn.to.blockId);
              if (!fromBlock || !toBlock) return null;

              const fromX = fromBlock.position.x + 120; // Right side of block
              const fromY = fromBlock.position.y + 25 + conn.from.port * 20;
              const toX = toBlock.position.x; // Left side of block
              const toY = toBlock.position.y + 25 + conn.to.port * 20;

              // Create a smooth bezier curve
              const midX = (fromX + toX) / 2;

              return (
                <g key={conn.id}>
                  <path
                    d={`M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-primary"
                  />
                  {/* Arrow at the end */}
                  <polygon
                    points={`${toX},${toY} ${toX - 8},${toY - 4} ${toX - 8},${toY + 4}`}
                    fill="currentColor"
                    className="text-primary"
                  />
                </g>
              );
            })}
          </svg>

          {/* Render blocks */}
          {model.blocks.map((block) => (
            <SimulinkBlockComponent key={block.id} block={block} />
          ))}
        </div>
      </div>
    </div>
  );
}

interface SimulinkBlockComponentProps {
  block: SimulinkBlock;
}

function SimulinkBlockComponent({ block }: SimulinkBlockComponentProps) {
  const getBlockColor = (type: string) => {
    const typeColors: Record<string, string> = {
      // Sources - orange
      Constant: "bg-orange-500/20 border-orange-500/50",
      Step: "bg-orange-500/20 border-orange-500/50",
      "Sine Wave": "bg-orange-500/20 border-orange-500/50",
      Ramp: "bg-orange-500/20 border-orange-500/50",
      Clock: "bg-orange-500/20 border-orange-500/50",

      // Sinks - cyan
      Scope: "bg-cyan-500/20 border-cyan-500/50",
      Display: "bg-cyan-500/20 border-cyan-500/50",
      "To Workspace": "bg-cyan-500/20 border-cyan-500/50",

      // Continuous - blue
      Integrator: "bg-blue-500/20 border-blue-500/50",
      "Transfer Fcn": "bg-blue-500/20 border-blue-500/50",
      Derivative: "bg-blue-500/20 border-blue-500/50",

      // Math - green
      Sum: "bg-green-500/20 border-green-500/50",
      Gain: "bg-green-500/20 border-green-500/50",
      Product: "bg-green-500/20 border-green-500/50",

      // Default
      default: "bg-muted border-border",
    };

    return typeColors[type] || typeColors.default;
  };

  const getBlockIcon = (type: string) => {
    const icons: Record<string, string> = {
      Constant: "1",
      Step: "⌐",
      "Sine Wave": "~",
      Ramp: "/",
      Scope: "◯",
      Display: "#",
      Integrator: "∫",
      Derivative: "d/dt",
      "Transfer Fcn": "1/s",
      Sum: "Σ",
      Gain: "K",
      Product: "×",
    };
    return icons[type] || type.charAt(0);
  };

  return (
    <div
      className={cn(
        "absolute w-[120px] rounded-lg border-2 shadow-sm transition-shadow hover:shadow-md cursor-pointer",
        getBlockColor(block.type)
      )}
      style={{
        left: block.position.x,
        top: block.position.y,
      }}
    >
      {/* Input port */}
      <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary border-2 border-background" />

      {/* Output port */}
      <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary border-2 border-background" />

      {/* Block content */}
      <div className="p-2 text-center">
        <div className="text-lg font-mono text-foreground mb-1">
          {getBlockIcon(block.type)}
        </div>
        <div className="text-xs font-medium text-foreground truncate">{block.name}</div>
        <div className="text-[10px] text-muted-foreground truncate">{block.type}</div>
      </div>

      {/* Show parameters if any */}
      {block.parameters && Object.keys(block.parameters).length > 0 && (
        <div className="px-2 pb-2">
          {Object.entries(block.parameters).slice(0, 2).map(([key, value]) => (
            <div key={key} className="text-[9px] text-muted-foreground truncate">
              {key}: {value}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Helper to convert AI tool output to SimulinkModel
 */
export function parseSimulinkModelFromCode(
  modelName: string,
  blocks: Array<{
    type: string;
    name: string;
    position?: number[];
    parameters?: Record<string, string>;
  }>,
  connections?: Array<{ from: string; to: string }>
): SimulinkModel {
  const parsedBlocks: SimulinkBlock[] = blocks.map((block, index) => ({
    id: `block-${index}`,
    type: block.type,
    name: block.name,
    position: {
      x: block.position?.[0] ?? 100 + index * 150,
      y: block.position?.[1] ?? 100,
    },
    parameters: block.parameters,
  }));

  const parsedConnections: SimulinkConnection[] = (connections || []).map((conn, index) => {
    // Parse "BlockName/PortNumber" format
    const [fromBlock, fromPort] = conn.from.split("/");
    const [toBlock, toPort] = conn.to.split("/");

    const fromBlockObj = parsedBlocks.find((b) => b.name === fromBlock);
    const toBlockObj = parsedBlocks.find((b) => b.name === toBlock);

    return {
      id: `conn-${index}`,
      from: {
        blockId: fromBlockObj?.id || "",
        port: parseInt(fromPort) - 1 || 0,
      },
      to: {
        blockId: toBlockObj?.id || "",
        port: parseInt(toPort) - 1 || 0,
      },
    };
  });

  return {
    name: modelName,
    blocks: parsedBlocks,
    connections: parsedConnections,
  };
}
