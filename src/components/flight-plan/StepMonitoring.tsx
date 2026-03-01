import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle, AlertTriangle, Radio } from "lucide-react";
import type { FlightPlanData } from "@/pages/FlightPlan";

interface Props {
  data: FlightPlanData;
  updateData: (d: Partial<FlightPlanData>) => void;
}

const StepMonitoring = ({ data, updateData }: Props) => {
  const [elapsed, setElapsed] = useState(0);
  const [status, setStatus] = useState<"nominal" | "alert">("nominal");

  useEffect(() => {
    if (!data.monitoringActive) return;
    const interval = setInterval(() => {
      setElapsed((p) => p + 1);
      // simulate a brief alert at 8 seconds
      if (elapsed === 8) setStatus("alert");
      if (elapsed === 11) setStatus("nominal");
    }, 1000);
    return () => clearInterval(interval);
  }, [data.monitoringActive, elapsed]);

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground text-sm">
        Real-time trajectory compliance monitoring. Deviations trigger alerts and contingency logic.
      </p>

      {!data.monitoringActive ? (
        <div className="py-10 text-center space-y-4">
          <Radio className="w-10 h-10 text-primary mx-auto opacity-40" />
          <p className="text-muted-foreground text-sm">Monitoring will activate once the flight is authorized.</p>
          <button
            onClick={() => updateData({ monitoringActive: true })}
            className="px-5 py-2.5 bg-primary text-primary-foreground rounded-md font-medium text-sm hover:opacity-90 transition-opacity"
          >
            Simulate Monitoring
          </button>
        </div>
      ) : (
        <>
          <div className={`flex items-center gap-3 p-4 rounded-lg border ${
            status === "nominal" ? "border-primary/30 bg-primary/5" : "border-accent/30 bg-accent/5"
          }`}>
            {status === "nominal" ? (
              <CheckCircle className="w-5 h-5 text-primary" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-accent" />
            )}
            <div>
              <p className="text-sm font-semibold text-foreground">
                {status === "nominal" ? "On Track — Nominal" : "Deviation Detected"}
              </p>
              <p className="text-xs text-muted-foreground font-mono">
                {status === "nominal"
                  ? "All trajectory constraints within tolerance"
                  : "Minor lateral deviation — contingency logic evaluating"}
              </p>
            </div>
            <div className="ml-auto">
              <motion.div
                className={`w-3 h-3 rounded-full ${status === "nominal" ? "bg-primary" : "bg-accent"}`}
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="bg-secondary rounded-lg p-4 text-center">
              <p className="text-2xl font-bold font-mono text-foreground">{elapsed}s</p>
              <p className="text-xs text-muted-foreground mt-1">Elapsed</p>
            </div>
            <div className="bg-secondary rounded-lg p-4 text-center">
              <p className="text-2xl font-bold font-mono text-primary">
                {data.trajectoryScore - (status === "alert" ? 5 : 0)}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">Compliance</p>
            </div>
            <div className="bg-secondary rounded-lg p-4 text-center">
              <p className="text-2xl font-bold font-mono text-foreground">0</p>
              <p className="text-xs text-muted-foreground mt-1">Alerts Triggered</p>
            </div>
          </div>

          <div className="bg-secondary rounded-lg p-4 space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Live Log</h4>
            <div className="font-mono text-xs space-y-1 text-muted-foreground max-h-32 overflow-y-auto">
              <p><span className="text-primary">00:00</span> Monitoring activated</p>
              <p><span className="text-primary">00:01</span> Trajectory lock confirmed</p>
              {elapsed > 3 && <p><span className="text-primary">00:03</span> Altitude check — nominal</p>}
              {elapsed > 6 && <p><span className="text-primary">00:06</span> Corridor boundary check — clear</p>}
              {elapsed > 8 && <p><span className="text-accent">00:08</span> Lateral deviation +12m — evaluating</p>}
              {elapsed > 11 && <p><span className="text-primary">00:11</span> Deviation corrected — nominal</p>}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default StepMonitoring;
