import { motion } from "framer-motion";
import { Clock, ArrowUp, Route, CheckCircle, Loader2 } from "lucide-react";
import type { FlightPlanData } from "@/pages/FlightPlan";

interface Props {
  data: FlightPlanData;
  updateData: (d: Partial<FlightPlanData>) => void;
}

const clearanceOptions = [
  {
    id: "immediate",
    icon: Clock,
    title: "Immediate Departure",
    desc: "Depart now within current window. No conflicts detected for this slot.",
    tag: "Recommended",
    tagColor: "bg-primary/20 text-primary",
  },
  {
    id: "delayed",
    icon: Clock,
    title: "Short Delayed Departure",
    desc: "Depart in +5 min. Avoids crossing traffic in mid-altitude band.",
    tag: "Alternative",
    tagColor: "bg-accent/20 text-accent",
  },
  {
    id: "alt-altitude",
    icon: ArrowUp,
    title: "Alternate Altitude Band",
    desc: "Use high altitude band (1000–1500 ft). Conflict-free trajectory available.",
    tag: "Alternative",
    tagColor: "bg-accent/20 text-accent",
  },
  {
    id: "alt-corridor",
    icon: Route,
    title: "Alternate Corridor",
    desc: "Routing via alternate corridor. Adds ~2 min flight time, fully deconflicted.",
    tag: "Alternative",
    tagColor: "bg-accent/20 text-accent",
  },
];

const StepClearance = ({ data, updateData }: Props) => {
  // Still loading analysis
  if (data.analysisLoading) {
    return (
      <div className="py-16 flex flex-col items-center gap-6">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <div className="text-center">
          <p className="text-foreground font-medium mb-1">Analyzing your route...</p>
          <p className="text-muted-foreground text-sm font-mono">Checking conflicts & live weather</p>
        </div>
      </div>
    );
  }

  // Score > 80% — route is clear, show best time
  if (data.trajectoryScore > 80) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 p-5 rounded-lg border border-primary/30 bg-primary/5">
          <CheckCircle className="w-6 h-6 text-primary shrink-0" />
          <div>
            <p className="text-foreground font-semibold">Route Clear — Ready for Departure</p>
            <p className="text-sm text-muted-foreground mt-1">
              Your trajectory scored <span className="text-primary font-mono font-bold">{data.trajectoryScore}%</span>. No clearance adjustments needed.
            </p>
          </div>
        </div>

        <div className="bg-secondary rounded-lg p-6 text-center">
          <p className="text-muted-foreground text-xs uppercase tracking-wider mb-2">Best Departure Time</p>
          <p className="text-4xl font-bold font-mono text-primary">{data.bestDepartureTime}</p>
          <p className="text-muted-foreground text-sm mt-2">
            Within your window {data.departureWindowStart} – {data.departureWindowEnd}
          </p>
        </div>
      </div>
    );
  }

  // Score 0-80% — show clearance options
  return (
    <div className="space-y-6">
      <p className="text-muted-foreground text-sm">
        Your trajectory scored <span className="text-accent font-mono font-bold">{data.trajectoryScore}%</span>. Select a clearance option to proceed safely.
      </p>

      <div className="space-y-3">
        {clearanceOptions.map((opt, i) => {
          const selected = data.selectedClearance === opt.id;
          return (
            <motion.button
              key={opt.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => updateData({ selectedClearance: opt.id })}
              className={`w-full text-left p-5 rounded-lg border transition-all ${
                selected
                  ? "border-primary bg-primary/5 glow-primary"
                  : "border-border bg-secondary hover:border-primary/30"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 ${selected ? "bg-primary/20" : "bg-muted"}`}>
                  <opt.icon className={`w-4 h-4 ${selected ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-foreground text-sm">{opt.title}</h4>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${opt.tagColor}`}>
                      {opt.tag}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{opt.desc}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 ${selected ? "border-primary" : "border-border"}`}>
                  {selected && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default StepClearance;
