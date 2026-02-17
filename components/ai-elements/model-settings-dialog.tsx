"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  PROVIDERS,
  type ProviderId,
  type ModelConfig,
  getProvider,
} from "@/lib/model-store";
import { ExternalLink, Loader2, CheckCircle2, XCircle, Eye, EyeOff } from "lucide-react";

interface ModelSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentConfig: ModelConfig | null;
  onSave: (config: ModelConfig) => void;
  onClear: () => void;
}

type ValidationState = "idle" | "validating" | "valid" | "invalid";

export function ModelSettingsDialog({
  open,
  onOpenChange,
  currentConfig,
  onSave,
  onClear,
}: ModelSettingsDialogProps) {
  const [providerId, setProviderId] = useState<ProviderId>(
    currentConfig?.providerId ?? "openai"
  );
  const [apiKey, setApiKey] = useState(currentConfig?.apiKey ?? "");
  const [modelId, setModelId] = useState(currentConfig?.modelId ?? "");
  const [validation, setValidation] = useState<ValidationState>("idle");
  const [validationError, setValidationError] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    if (open) {
      setProviderId(currentConfig?.providerId ?? "openai");
      setApiKey(currentConfig?.apiKey ?? "");
      setModelId(currentConfig?.modelId ?? "");
      setValidation(currentConfig ? "valid" : "idle");
      setValidationError("");
    }
  }, [open, currentConfig]);

  const provider = getProvider(providerId);

  const handleProviderChange = (value: string) => {
    setProviderId(value as ProviderId);
    setApiKey("");
    setModelId("");
    setValidation("idle");
    setValidationError("");
  };

  const handleValidateKey = async () => {
    if (!apiKey.trim()) return;
    setValidation("validating");
    setValidationError("");

    try {
      const res = await fetch("/api/validate-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerId, apiKey: apiKey.trim() }),
      });
      const data = await res.json();
      if (data.valid) {
        setValidation("valid");
        if (!modelId && provider.models.length > 0) {
          setModelId(provider.models[0].id);
        }
      } else {
        setValidation("invalid");
        setValidationError(data.error || "Invalid API key");
      }
    } catch {
      setValidation("invalid");
      setValidationError("Failed to validate API key");
    }
  };

  const handleSave = () => {
    if (validation !== "valid" || !modelId) return;
    onSave({ providerId, apiKey: apiKey.trim(), modelId });
    onOpenChange(false);
  };

  const handleClear = () => {
    onClear();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>AI Model Settings</DialogTitle>
          <DialogDescription>
            Choose an AI provider, enter your API key, and select a model.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Provider select */}
          <div className="space-y-2">
            <Label>Provider</Label>
            <Select value={providerId} onValueChange={handleProviderChange}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROVIDERS.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* API Key input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>API Key</Label>
              <a
                href={provider.apiKeyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                Get API key <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type={showApiKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    if (validation !== "idle") {
                      setValidation("idle");
                      setValidationError("");
                    }
                  }}
                  placeholder={`Enter your ${provider.name} API key`}
                  className="pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey((prev) => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleValidateKey}
                disabled={!apiKey.trim() || validation === "validating"}
                className="shrink-0 h-9"
              >
                {validation === "validating" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Validate"
                )}
              </Button>
            </div>

            {validation === "valid" && (
              <div className="flex items-center gap-1.5 text-xs text-green-600">
                <CheckCircle2 className="w-3.5 h-3.5" />
                API key is valid
              </div>
            )}
            {validation === "invalid" && (
              <div className="flex items-center gap-1.5 text-xs text-destructive">
                <XCircle className="w-3.5 h-3.5" />
                {validationError}
              </div>
            )}
          </div>

          {/* Model select — shown after validation */}
          {validation === "valid" && (
            <div className="space-y-2">
              <Label>Model</Label>
              <Select value={modelId} onValueChange={setModelId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  {provider.models.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2 sm:justify-between">
          {currentConfig && (
            <Button type="button" variant="destructive" size="sm" onClick={handleClear}>
              Remove config
            </Button>
          )}
          <Button
            type="button"
            onClick={handleSave}
            disabled={validation !== "valid" || !modelId}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Small button displayed in the header showing current model or "Setup AI" */
export function ModelSelectorButton({
  config,
  onClick,
}: {
  config: ModelConfig | null;
  onClick: () => void;
}) {
  if (!config) {
    return (
      <Button variant="outline" size="sm" onClick={onClick} className="text-xs gap-1.5">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
        </span>
        Setup AI Model
      </Button>
    );
  }

  const provider = getProvider(config.providerId);
  const model = provider.models.find((m) => m.id === config.modelId);

  return (
    <Button variant="outline" size="sm" onClick={onClick} className="text-xs gap-1.5">
      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
        {provider.name}
      </Badge>
      {model?.name ?? config.modelId}
    </Button>
  );
}
