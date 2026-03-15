import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { FlightPlanData } from "@/pages/FlightPlan";

interface Props {
  data: FlightPlanData;
  updateData: (d: Partial<FlightPlanData>) => void;
}

interface ConflictDetail {
  aircraft_id: string;
  conflict_type: string;
  severity: string;
}

interface AnalysisResult {
  intent_id: string;
  conflicts: number;
  conflict_details: ConflictDetail[];
  trajectory_score: number;
  weather_risk: string;
  weather_details: Record<string, any>;
  existing_intents_checked: number;
  analysis_factors: Record<string, string>;
}

const StepTrajectory = ({ data, updateData }: Props) => {
  const [analyzing, setAnalyzing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    const runAnalysis = async () => {
      setAnalyzing(true);
      setError(null);

      try {
        const { data: response, error: fnError } = await supabase.functions.invoke(
          "trajectory-analysis",
          {
            body: {
              aircraft_id: data.aircraftId,
              operator_name: data.operatorName,
              aircraft_type: data.aircraftType,
              origin: data.origin,
              destination: data.destination,
              altitude_band: data.altitudeBand,
              departure_window_start: data.departureWindowStart,
              departure_window_end: data.departureWindowEnd,
              contingency_landing: "",
              max_speed: "",
              max_altitude: "",
            },
          }
        );

        if (fnError) throw new Error(fnError.message);

        setResult(response);
        updateData({
          conflicts: response.conflicts,
          trajectoryScore: response.trajectory_score,
          weatherRisk: response.weather_risk,
        });
      } catch (e: any) {
        console.error("Analysis failed:", e);
        setError(e.message || "Analysis failed");
      } finally {
        setAnalyzing(false);
      }
    };

    runAnalysis();
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
          <p className="text-muted-foreground text-sm font-mono">Checking conflicts against active intents & fetching live weather</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-10 text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-accent mx-auto" />
        <p className="text-foreground font-medium">Analysis Failed</p>
        <p className="text-muted-foreground text-sm">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground text-sm">
        4D trajectory analysis complete. Checked against{" "}
        <span className="text-foreground font-mono">{result?.existing_intents_checked ?? 0}</span>{" "}
        active flight intents with live weather data.
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
          <p className={`text-3xl font-bold font-mono ${
            data.weatherRisk === "high" ? "text-destructive" :
            data.weatherRisk === "moderate" ? "text-accent" : "text-primary"
          }`}>
            {data.weatherRisk === "low" ? "Low" : data.weatherRisk === "moderate" ? "Mod" : data.weatherRisk === "high" ? "High" : "N/A"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Weather Risk</p>
        </div>
      </div>

      {/* Conflict details */}
      {result?.conflict_details && result.conflict_details.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-accent" />
            Conflict Details
          </h4>
          {result.conflict_details.map((c, i) => (
            <div key={i} className="flex items-start justify-between py-2 px-3 bg-accent/5 border border-accent/20 rounded-md">
              <div>
                <span className="text-sm text-foreground font-mono">{c.aircraft_id}</span>
                <p className="text-xs text-muted-foreground mt-0.5">{c.conflict_type}</p>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                c.severity === "high" ? "bg-destructive/20 text-destructive" : "bg-accent/20 text-accent"
              }`}>
                {c.severity}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Weather details */}
      {result?.weather_details && !result.weather_details.error && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground">Live Weather Conditions</h4>
          <div className="grid sm:grid-cols-3 gap-3">
            {result.weather_details.temperature !== undefined && (
              <div className="bg-secondary rounded-md p-3 text-center">
                <p className="text-lg font-bold font-mono text-foreground">{result.weather_details.temperature}°C</p>
                <p className="text-[10px] text-muted-foreground">Temperature</p>
              </div>
            )}
            {result.weather_details.wind_speed !== undefined && (
              <div className="bg-secondary rounded-md p-3 text-center">
                <p className="text-lg font-bold font-mono text-foreground">{result.weather_details.wind_speed} km/h</p>
                <p className="text-[10px] text-muted-foreground">Wind Speed</p>
              </div>
            )}
            {result.weather_details.wind_gusts !== undefined && (
              <div className="bg-secondary rounded-md p-3 text-center">
                <p className="text-lg font-bold font-mono text-foreground">{result.weather_details.wind_gusts} km/h</p>
                <p className="text-[10px] text-muted-foreground">Wind Gusts</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Analysis factors */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-foreground">Analysis Factors</h4>
        {result?.analysis_factors &&
          Object.entries(result.analysis_factors).map(([label, status]) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
              <span className="text-sm text-muted-foreground capitalize">{label.replace(/_/g, " ")}</span>
              <span className="text-xs font-mono text-foreground">{status}</span>
            </div>
          ))}
      </div>
    </div>
  );
};

export default StepTrajectory;
