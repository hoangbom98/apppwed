import { useEffect, useState } from "react";

interface DevPayStatus {
  isPaid: boolean;
  hasFeature: (feature: string) => boolean;
  projectId: string;
  environment: string;
}

export function useDevPayGuard(): DevPayStatus | null {
  const [status, setStatus] = useState<DevPayStatus | null>(null);

  useEffect(() => {
    // Initialize DevPay Frontend SDK
    const config = {
      apiKey: "pk_live_tx60incg9z0gvjwteqo52",
      projectId: "69e9eef2c86ae9decfc0daac",
      environment: "production",
      appName: "Dubai Dreams Frontend",
      sdkVersion: "1.0.0",
      onReady: (data: any) => {
        console.log("✅ DevPay SDK Ready:", data);
        setStatus({
          isPaid: data.isPaid || false,
          hasFeature: (feature: string) => data.hasFeature?.(feature) || false,
          projectId: "69e9eef2c86ae9decfc0daac",
          environment: "production",
        });
      },
      onError: (err: any) => {
        console.error("❌ DevPay SDK Error:", err);
      },
    };

    // Expose to window for SDK initialization
    (window as any).devpayConfig = config;

    // Load the SDK dynamically
    if (typeof window !== "undefined") {
      console.log("🔧 DevPay SDK Configuration loaded");
      console.log(`📦 Project ID: ${config.projectId}`);
      console.log(`🔐 Environment: ${config.environment}`);
    }
  }, []);

  return status;
}
