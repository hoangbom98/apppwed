import React from "react";
import { useDevPayGuard } from "@/hooks/use-devpay";

export function DevPayGuardTest() {
  const devpayStatus = useDevPayGuard();

  return (
    <div className="p-6 bg-slate-50 rounded-lg border border-slate-200">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900">
          🛡️ DevPayGuard SDK Test
        </h3>

        <div className="bg-white p-4 rounded border border-slate-200">
          <h4 className="font-medium text-slate-700 mb-3">SDK Status</h4>

          {devpayStatus ? (
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-slate-600">Project ID:</span>
                <code className="bg-slate-100 px-2 py-1 rounded text-xs font-mono">
                  {devpayStatus.projectId}
                </code>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-600">Environment:</span>
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                  {devpayStatus.environment}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-600">Paid Status:</span>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    devpayStatus.isPaid
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {devpayStatus.isPaid ? "✅ Paid" : "⏳ Pending"}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-500">🔄 Initializing SDK...</div>
          )}
        </div>

        <div className="bg-slate-100 p-3 rounded border border-slate-300">
          <p className="text-xs text-slate-600">
            <strong>✅ Status:</strong> Frontend DevPayGuard SDK integrated and
            ready to use.
          </p>
        </div>
      </div>
    </div>
  );
}
