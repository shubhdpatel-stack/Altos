import type { FlightPlanData } from "@/pages/FlightPlan";

interface Props {
  data: FlightPlanData;
  updateData: (d: Partial<FlightPlanData>) => void;
}

const StepAuthority = ({ data, updateData }: Props) => {
  const clearanceLabel =
    data.selectedClearance === "immediate" ? "Immediate Departure" :
    data.selectedClearance === "delayed" ? "Short Delayed Departure" :
    data.selectedClearance === "alt-altitude" ? "Alternate Altitude Band" :
    data.selectedClearance === "alt-corridor" ? "Alternate Corridor" :
    data.selectedClearance === "auto-best" ? "Best Available (Auto)" : "—";

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground text-sm">
        Review your flight summary before authorization.
      </p>

      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-foreground">Flight Summary</h4>
        <div className="bg-secondary rounded-lg divide-y divide-border/30">
          {[
            ["Aircraft", data.aircraftId || "—"],
            ["Operator", data.operatorName || "—"],
            ["Route", `${data.origin || "—"} → ${data.destination || "—"}`],
            ["Altitude Band", data.altitudeBand.toUpperCase()],
            ["Departure Window", `${data.departureWindowStart || "—"} – ${data.departureWindowEnd || "—"}`],
            ["Clearance", clearanceLabel],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between px-5 py-3">
              <span className="text-sm text-muted-foreground">{label}</span>
              <span className="text-sm font-mono text-foreground">{value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-start gap-3 bg-secondary rounded-lg p-4">
        <input
          type="checkbox"
          checked={data.authorityApproved}
          onChange={(e) => updateData({ authorityApproved: e.target.checked })}
          className="mt-1 accent-[hsl(175,70%,45%)]"
        />
        <div>
          <p className="text-sm text-foreground font-medium">Authority Acknowledgment</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            I confirm the flight details have been reviewed and approve this operation.
          </p>
        </div>
      </div>
    </div>
  );
};

export default StepAuthority;
