import { motion } from "framer-motion";
import { Clock, ArrowUp, Route } from "lucide-react";
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
    desc: "Routing via eastern corridor. Adds ~2 min flight time, fully deconflicted.",
    tag: "Alternative",
    tagColor: "bg-accent/20 text-accent",
  },
];

const StepClearance = ({ data, updateData }: Props) => {
  return (
    <div className="space-y-6">
      <p className="text-muted-foreground text-sm">
        Multiple conflict-free options generated. If delayed, the system auto-transitions to the next valid option.
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

      <div className="bg-primary/5 border border-primary/20 rounded-md p-4">
        <p className="text-xs text-primary font-mono">
          ↻ Auto-fallback enabled — delays trigger next valid option without restarting approval.
        </p>
      </div>
    </div>
  );
};

export default StepClearance;
