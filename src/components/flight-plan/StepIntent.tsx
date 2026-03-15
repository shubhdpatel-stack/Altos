import { useMemo } from "react";
import type { FlightPlanData } from "@/pages/FlightPlan";

interface Props {
  data: FlightPlanData;
  updateData: (d: Partial<FlightPlanData>) => void;
}

function toMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

const StepIntent = ({ data, updateData }: Props) => {
  const windowWarning = useMemo(() => {
    if (!data.departureWindowStart || !data.departureWindowEnd) return null;
    const s = toMinutes(data.departureWindowStart);
    const e = toMinutes(data.departureWindowEnd);
    if (e <= s) return "End time must be after start time.";
    if (e - s > 10) return "Departure window cannot exceed 10 minutes.";
    return null;
  }, [data.departureWindowStart, data.departureWindowEnd]);

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground text-sm">
        Submit a flexible flight intent with a departure time window (max 10 minutes).
      </p>

      <div className="grid md:grid-cols-2 gap-5">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Origin Vertiport / Location</label>
          <input
            type="text"
            value={data.origin}
            onChange={(e) => updateData({ origin: e.target.value })}
            placeholder="e.g. Downtown Helipad Alpha"
            className="w-full px-4 py-2.5 rounded-md bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Destination</label>
          <input
            type="text"
            value={data.destination}
            onChange={(e) => updateData({ destination: e.target.value })}
            placeholder="e.g. Airport Terminal Pad B3"
            className="w-full px-4 py-2.5 rounded-md bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-foreground">Requested Altitude Band</label>
          <select
            value={data.altitudeBand}
            onChange={(e) => updateData({ altitudeBand: e.target.value })}
            className="w-full px-4 py-2.5 rounded-md bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
          >
            <option value="low">Low (0–500 ft AGL)</option>
            <option value="mid">Mid (500–1000 ft AGL)</option>
            <option value="high">High (1000–1500 ft AGL)</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Departure Window Start</label>
          <input
            type="time"
            value={data.departureWindowStart}
            onChange={(e) => updateData({ departureWindowStart: e.target.value })}
            className="w-full px-4 py-2.5 rounded-md bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-mono"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Departure Window End</label>
          <input
            type="time"
            value={data.departureWindowEnd}
            onChange={(e) => updateData({ departureWindowEnd: e.target.value })}
            className="w-full px-4 py-2.5 rounded-md bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-mono"
          />
        </div>
      </div>

      {windowWarning && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-md p-3">
          <p className="text-xs text-destructive font-mono">{windowWarning}</p>
        </div>
      )}
    </div>
  );
};

export default StepIntent;
