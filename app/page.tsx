"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Sidebar } from "@/components/layout/sidebar";
import { ChatMessage } from "@/components/chat/chat-message";
import { ChatInput, type AttachedFile } from "@/components/chat/chat-input";
import { ConnectionStatus, type ConnectionState } from "@/components/matlab/connection-status";
import { FileTree, type FileNode } from "@/components/files/file-tree";
import { OutputPanel, type OutputLine } from "@/components/matlab/output-panel";
import { Button } from "@/components/ui/button";
import { PanelLeftClose, PanelLeft, PanelRightClose, PanelRight, Boxes, Terminal } from "lucide-react";
import { SimulinkViewer, parseSimulinkModelFromCode, type SimulinkModel } from "@/components/simulink/simulink-viewer";
import { BlockPalette } from "@/components/simulink/block-palette";
import { WorkspacePanel, type WorkspaceVariable } from "@/components/matlab/workspace-panel";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ModelSettingsDialog, ModelSelectorButton } from "@/components/ai-elements/model-settings-dialog";
import { useModelConfig } from "@/hooks/use-model-config";
import { toast } from "sonner";

// Mock file structure
const mockFiles: FileNode[] = [
  {
    name: "Projects",
    type: "folder",
    path: "/Projects",
    children: [
      {
        name: "control_system",
        type: "folder",
        path: "/Projects/control_system",
        children: [
          { name: "pid_controller.m", type: "file", path: "/Projects/control_system/pid_controller.m" },
          { name: "system_model.slx", type: "file", path: "/Projects/control_system/system_model.slx" },
          { name: "test_data.mat", type: "file", path: "/Projects/control_system/test_data.mat" },
        ],
      },
      {
        name: "signal_processing",
        type: "folder",
        path: "/Projects/signal_processing",
        children: [
          { name: "fft_analysis.m", type: "file", path: "/Projects/signal_processing/fft_analysis.m" },
          { name: "filter_design.m", type: "file", path: "/Projects/signal_processing/filter_design.m" },
        ],
      },
    ],
  },
  { name: "startup.m", type: "file", path: "/startup.m" },
  { name: "README.md", type: "file", path: "/README.md" },
];

// Mock output lines
const initialOutput: OutputLine[] = [
  { id: "1", type: "info", content: "MATLAB AI Assistant Ready", timestamp: new Date() },
  { id: "2", type: "info", content: "Type a command or ask the AI for help", timestamp: new Date() },
];

export default function MatlabAssistant() {
  const [activeTab, setActiveTab] = useState("chat");
  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected");
  const [matlabVersion, setMatlabVersion] = useState<string | undefined>();
  const [connectionError, setConnectionError] = useState<string | undefined>();
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [selectedFile, setSelectedFile] = useState<string | undefined>();
  const [outputLines, setOutputLines] = useState<OutputLine[]>(initialOutput);
  const [simulinkModel, setSimulinkModel] = useState<SimulinkModel | null>(null);
  const [workspaceVariables, setWorkspaceVariables] = useState<WorkspaceVariable[]>([]);
  const [rightPanelTab, setRightPanelTab] = useState<"output" | "workspace">("output");
  const [modelDialogOpen, setModelDialogOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { config, loaded, saveConfig, clearConfig } = useModelConfig();
  const configRef = useRef(config);
  useEffect(() => { configRef.current = config; }, [config]);

  const { messages, sendMessage, status, stop } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: () => {
        const c = configRef.current;
        return c
          ? { providerId: c.providerId, modelId: c.modelId, apiKey: c.apiKey }
          : {};
      },
    }),
  });

  const [input, setInput] = useState("");

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleConnect = async () => {
    setConnectionState("connecting");
    setConnectionError(undefined);
    
    try {
      const response = await fetch("/api/matlab/connect", { method: "POST" });
      const data = await response.json();
      
      if (data.connected) {
        setConnectionState("connected");
        setMatlabVersion(data.version);
        setOutputLines((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            type: "info",
            content: `Connected to ${data.version || "MATLAB"}`,
            timestamp: new Date(),
          },
        ]);
      } else {
        setConnectionState("error");
        setConnectionError(data.error || "No MATLAB detected.");
      }
    } catch {
      setConnectionState("error");
      setConnectionError("No MATLAB detected. Make sure MATLAB is running and the bridge server is started.");
    }
  };

  const handleSendMessage = (text: string, files?: AttachedFile[]) => {
    if (!text.trim() && !files?.length) return;
    if (status !== "ready") return;

    if (!config) {
      toast.error("AI model not configured", {
        description: "Please set up your AI model before sending messages.",
        action: {
          label: "Setup",
          onClick: () => setModelDialogOpen(true),
        },
      });
      return;
    }

    const fileUIParts = files?.map((af) => ({
      type: "file" as const,
      url: af.previewUrl ?? URL.createObjectURL(af.file),
      mediaType: af.file.type,
      filename: af.file.name,
    }));

    sendMessage({
      text: text || "Sent with attachments",
      files: fileUIParts,
    });
    setInput("");
  };

  const handleClearOutput = () => {
    setOutputLines([]);
  };

  const handleFileSelect = (file: FileNode) => {
    setSelectedFile(file.path);
    setOutputLines((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        type: "info",
        content: `Selected: ${file.path}`,
        timestamp: new Date(),
      },
    ]);
  };

  const handleRefreshWorkspace = async () => {
    try {
      const response = await fetch("/api/matlab/workspace");
      const data = await response.json();
      if (data.variables) {
        setWorkspaceVariables(data.variables);
      }
    } catch {
      // Connection failed - no mock data
    }
  };

  // Demo: Create a sample Simulink model for testing
  const handleCreateDemoModel = () => {
    const model = parseSimulinkModelFromCode(
      "PID_Controller",
      [
        { type: "Step", name: "Reference", position: [50, 100, 110, 140] },
        { type: "Sum", name: "Error", position: [170, 100, 200, 130], parameters: { Inputs: "+-" } },
        { type: "Gain", name: "Kp", position: [260, 50, 310, 80], parameters: { Gain: "10" } },
        { type: "Integrator", name: "Ki_Int", position: [260, 100, 310, 130] },
        { type: "Derivative", name: "Kd_Der", position: [260, 150, 310, 180] },
        { type: "Sum", name: "PID_Sum", position: [370, 100, 400, 130] },
        { type: "Transfer Fcn", name: "Plant", position: [460, 100, 540, 140] },
        { type: "Scope", name: "Output", position: [600, 100, 640, 140] },
      ],
      [
        { from: "Reference/1", to: "Error/1" },
        { from: "Error/1", to: "Kp/1" },
        { from: "Error/1", to: "Ki_Int/1" },
        { from: "Error/1", to: "Kd_Der/1" },
        { from: "Kp/1", to: "PID_Sum/1" },
        { from: "Ki_Int/1", to: "PID_Sum/2" },
        { from: "Kd_Der/1", to: "PID_Sum/3" },
        { from: "PID_Sum/1", to: "Plant/1" },
        { from: "Plant/1", to: "Output/1" },
      ]
    );
    setSimulinkModel(model);
    setActiveTab("simulink");
  };

  return (
    <div className="flex h-screen  text-foreground overflow-hidden">

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center gap-3 px-4 py-2 border-b border-border justify-between">
          <h1 className="text-lg font-semibold  bg-white size-10 flex items-center justify-center rounded-lg border-zinc-300 border ">
            <img className="" src={"/logo.png"} />
          </h1>

          <div className="flex items-center gap-2">
            
            <ConnectionStatus
              state={connectionState}
              matlabVersion={matlabVersion}
              onReconnect={handleConnect}
              errorMessage={connectionError}
            />
            <ModelSelectorButton config={config} onClick={() => setModelDialogOpen(true)} />

          </div>
          
          {!rightPanelOpen && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setRightPanelOpen(true)}
            >
              <PanelRight className="w-4 h-4" />
            </Button>
          )}
        </header>

        {/* Main Content - Tabbed View */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {activeTab === "chat" && (
            <>
              <div className="flex-1 overflow-auto px-4 py-4 space-y-4">
                {messages.length === 0 ? (
                  <WelcomeScreen onExampleClick={handleSendMessage} onCreateDemo={handleCreateDemoModel} />
                ) : (
                  messages.map((message) => (
                    <ChatMessage
                      key={message.id}
                      role={message.role as "user" | "assistant"}
                      content={
                        message.parts
                          ?.filter((p) => p.type === "text")
                          .map((p) => (p as { type: "text"; text: string }).text)
                          .join("") || ""
                      }
                      isStreaming={status === "streaming" && message.id === messages[messages.length - 1]?.id}
                    />
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="px-4 py-3 ">
                <ChatInput
                  onSend={handleSendMessage}
                  onStop={stop}
                  isLoading={status === "streaming" || status === "submitted"}
                  connectionState={connectionState}
                />
              </div>
            </>
          )}

          {activeTab === "simulink" && (
            <div className="flex-1 flex overflow-hidden">
              <div className="w-56 border-r border-border">
                <BlockPalette
                  onBlockSelect={(blockType) => {
                    setOutputLines((prev) => [
                      ...prev,
                      {
                        id: Date.now().toString(),
                        type: "info",
                        content: `Selected block: ${blockType}`,
                        timestamp: new Date(),
                      },
                    ]);
                  }}
                />
              </div>
              <SimulinkViewer
                model={simulinkModel}
                onRunSimulation={() => {
                  setOutputLines((prev) => [
                    ...prev,
                    {
                      id: Date.now().toString(),
                      type: "input",
                      content: `sim('${simulinkModel?.name}')`,
                      timestamp: new Date(),
                    },
                    {
                      id: (Date.now() + 1).toString(),
                      type: "info",
                      content: "Simulation started...",
                      timestamp: new Date(),
                    },
                  ]);
                }}
                className="flex-1"
              />
            </div>
          )}

          {activeTab === "terminal" && (
            <div className="flex-1 p-4">
              <div className="h-full rounded-lg border border-border bg-muted/30 p-4 font-mono text-sm">
                <p className="text-muted-foreground">MATLAB Command Window</p>
                <p className="text-syntax-comment mt-2">{">>"} Ready for commands...</p>
                <p className="text-xs text-muted-foreground mt-4">
                  Connect to MATLAB to enable direct command execution
                </p>
              </div>
            </div>
          )}

          {(activeTab === "files" || activeTab === "history" || activeTab === "docs") && (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <p className="text-muted-foreground">
                  {activeTab === "files" && "File browser - Use the left panel"}
                  {activeTab === "history" && "Command history will appear here"}
                  {activeTab === "docs" && "MATLAB documentation search"}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Model Settings Dialog */}
      <ModelSettingsDialog
        open={modelDialogOpen}
        onOpenChange={setModelDialogOpen}
        currentConfig={config}
        onSave={saveConfig}
        onClear={clearConfig}
      />
    </div>
  );
}

function WelcomeScreen({
  onExampleClick,
  onCreateDemo,
}: {
  onExampleClick: (text: string) => void;
  onCreateDemo?: () => void;
}) {
  const examples = [
    {
      title: "Create a Simulink model",
      prompt: "Create a simple PID controller Simulink model for a DC motor",
    },
    {
      title: "Run MATLAB code",
      prompt: "Calculate the FFT of a signal with 1000 samples at 8kHz sampling rate",
    },
    {
      title: "Explain a concept",
      prompt: "Explain how to use the ode45 solver for differential equations",
    },
    {
      title: "Debug code",
      prompt: "Help me debug this error: Index exceeds matrix dimensions",
    },
  ];

  return (
    <div className="flex flex-col  items-center justify-center h-full max-w-3xl mx-auto px-4">
      <div className="w-16 h-16 rounded-2xl bg-white border border-zinc-300 flex items-center justify-center mb-6">
        {/* <span className="text-3xl font-bold text-primary">M</span> */}
        <img className="" src={"/logo.png"} />
      </div>
      
      <h2 className="text-2xl font-semibold text-foreground mb-2 text-center">
        Welcome to MATLAB AI Assistant
      </h2>
      <p className="text-muted-foreground text-center mb-8 max-w-xl">
        I can help you write MATLAB code, create Simulink models, debug errors, and explain concepts. What would you like to do?
      </p>

      {/* <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
        {examples.map((example) => (
          <button
            key={example.title}
            onClick={() => onExampleClick(example.prompt)}
            className="flex flex-col items-start p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors text-left"
          >
            <span className="text-sm font-medium text-foreground mb-1">
              {example.title}
            </span>
            <span className="text-xs text-muted-foreground line-clamp-2">
              {example.prompt}
            </span>
          </button>
        ))}
      </div> */}

      {/* <p className="text-xs text-muted-foreground mt-4 text-center">
        Make sure MATLAB is running and click "Connect" to enable full functionality
      </p> */}
    </div>
  );
}
