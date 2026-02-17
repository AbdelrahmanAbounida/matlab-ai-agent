"use client";

import { useState, useEffect, useCallback } from "react";
import { type ModelConfig, getStoredConfig, setStoredConfig, clearStoredConfig } from "@/lib/model-store";

export function useModelConfig() {
  const [config, setConfig] = useState<ModelConfig | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setConfig(getStoredConfig());
    setLoaded(true);
  }, []);

  const saveConfig = useCallback((newConfig: ModelConfig) => {
    setStoredConfig(newConfig);
    setConfig(newConfig);
  }, []);

  const clearConfig = useCallback(() => {
    clearStoredConfig();
    setConfig(null);
  }, []);

  return { config, loaded, saveConfig, clearConfig };
}
