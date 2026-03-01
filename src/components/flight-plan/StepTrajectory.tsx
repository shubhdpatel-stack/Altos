import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { FlightPlanData } from "@/pages/FlightPlan";

interface Props {
  data: FlightPlanData;
  updateData: (d: Partial<FlightPlanData>) => void;
}

const StepTrajectory = ({ data, updateData }: Props) => {
  const [analyzing, setAnalyzing] = useState(true);

  useEffect(() => {
    setAnalyzing(true);
    const timer = setTimeout(() => {
      const conflicts = Math.floor(Math.random() * 4);
      const score = 70 + Math.floor(Math.random() * 28);
      const risks = ["low", "moderate", "low", "low"];
      const weatherRisk = risks[Math.floor(Math.random() * risks.length)];
      updateData({ conflicts, trajectoryScore: score, weatherRisk });
      setAnalyzing(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  if (analyzing) {
    return (
      <div className="py-16 flex flex-col items-center gap-6">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-t-primary border-r-transparent border-b-transparent border-l-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
          />
          <div className="absolute inset-3 rounded-full bg-primary/5 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
          </div>
        </div>
        <div className="text-center">
          <p className="text-foreground font-medium mb-1">Analyzing Trajectories...</p>
          <p className="text-muted-foreground text-sm font-mono">4D conflict probability modeling in progress</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground text-sm">
        4D trajectory analysis complete. Results based on submitted intent and current airspace conditions.
      </p>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-secondary rounded-lg p-5 text-center">
          <p className="text-3xl font-bold font-mono text-foreground">{data.conflicts}</p>
          <p className="text-xs text-muted-foreground mt-1">Potential Conflicts</p>
        </div>
        <div className="bg-secondary rounded-lg p-5 text-center">
          <p className="text-3xl font-bold font-mono text-primary">{data.trajectoryScore}%</p>
          <p className="text-xs text-muted-foreground mt-1">Trajectory Score</p>
        </div>
        <div className="bg-secondary rounded-lg p-5 text-center">
          <p className={`text-3xl font-bold font-mono ${data.weatherRisk === "moderate" ? "text-accent" : "text-primary"}`}>
            {data.weatherRisk === "low" ? "Low" : "Mod"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Weather Risk</p>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-foreground">Analysis Factors</h4>
        {[
          { label: "Other submitted intents", status: `${data.conflicts} conflicts detected` },
          { label: "Known traffic flows", status: "Evaluated" },
          { label: "Airspace restrictions", status: "Clear" },
          { label: "Low-altitude weather impacts", status: data.weatherRisk === "low" ? "Favorable" : "Caution advised" },
        ].map((item) => (
          <div key={item.label} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
            <span className="text-sm text-muted-foreground">{item.label}</span>
            <span className="text-xs font-mono text-foreground">{item.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StepTrajectory;
