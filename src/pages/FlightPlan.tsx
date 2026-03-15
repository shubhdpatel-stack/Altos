import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  UserCheck,
  Send,
  GitBranch,
  Eye,
  Shield,
  ArrowLeft,
  ArrowRight,
  Check,
  Plane,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import StepRegistration from "@/components/flight-plan/StepRegistration";
import StepIntent from "@/components/flight-plan/StepIntent";
import StepClearance from "@/components/flight-plan/StepClearance";
import StepAuthority from "@/components/flight-plan/StepAuthority";
import StepMonitoring from "@/components/flight-plan/StepMonitoring";

const steps = [
  { title: "Registration", icon: UserCheck, description: "Vehicle & Operator Registration" },
  { title: "Flight Intent", icon: Send, description: "Flight Intent Submission" },
  { title: "Clearances", icon: GitBranch, description: "Departure Clearance" },
  { title: "Authority", icon: Eye, description: "Authority Review" },
  { title: "Monitoring", icon: Shield, description: "In-Flight Monitoring" },
];

export interface FlightPlanData {
  aircraftId: string;
  operatorName: string;
  aircraftType: string;
  origin: string;
  destination: string;
  altitudeBand: string;
  departureWindowStart: string;
  departureWindowEnd: string;
  conflicts: number;
  trajectoryScore: number;
  weatherRisk: string;
  selectedClearance: string;
  bestDepartureTime: string;
  authorityApproved: boolean;
  monitoringActive: boolean;
  analysisComplete: boolean;
  analysisLoading: boolean;
}

const initialData: FlightPlanData = {
  aircraftId: "",
  operatorName: "",
  aircraftType: "evtol",
  origin: "",
  destination: "",
  altitudeBand: "low",
  departureWindowStart: "",
  departureWindowEnd: "",
  conflicts: 0,
  trajectoryScore: 0,
  weatherRisk: "low",
  selectedClearance: "",
  bestDepartureTime: "",
  authorityApproved: false,
  monitoringActive: false,
  analysisComplete: false,
  analysisLoading: false,
};

function validateStep(step: number, data: FlightPlanData): string | null {
  switch (step) {
    case 0:
      if (!data.aircraftId.trim()) return "Aircraft Registration ID is required.";
      if (!data.operatorName.trim()) return "Operator Name is required.";
      return null;
    case 1: {
      if (!data.origin.trim()) return "Origin is required.";
      if (!data.destination.trim()) return "Destination is required.";
      if (!data.departureWindowStart) return "Departure window start is required.";
      if (!data.departureWindowEnd) return "Departure window end is required.";
      // Validate 10 min max
      const s = toMinutes(data.departureWindowStart);
      const e = toMinutes(data.departureWindowEnd);
      if (e <= s) return "End time must be after start time.";
      if (e - s > 10) return "Departure window cannot exceed 10 minutes.";
      return null;
    }
    case 2:
      if (!data.analysisComplete) return "Analysis is still processing...";
      if (data.trajectoryScore <= 80 && !data.selectedClearance)
        return "Please select a clearance option.";
      return null;
    case 3:
      if (!data.authorityApproved) return "Authority acknowledgment is required.";
      return null;
    default:
      return null;
  }
}

function toMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

const FlightPlan = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<FlightPlanData>(initialData);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const navigate = useNavigate();
  const { toast } = useToast();

  const updateData = (partial: Partial<FlightPlanData>) => {
    setData((prev) => ({ ...prev, ...partial }));
  };

  // Run trajectory analysis when moving from Intent to Clearances
  const runAnalysis = async () => {
    updateData({ analysisLoading: true, analysisComplete: false });
    try {
      const { data: response, error } = await supabase.functions.invoke(
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
          },
        }
      );
      if (error) throw new Error(error.message);

      // Calculate best departure time (middle of window)
      const s = toMinutes(data.departureWindowStart);
      const bestMin = s + Math.floor((toMinutes(data.departureWindowEnd) - s) / 2);
      const bestH = String(Math.floor(bestMin / 60)).padStart(2, "0");
      const bestM = String(bestMin % 60).padStart(2, "0");

      updateData({
        conflicts: response.conflicts,
        trajectoryScore: response.trajectory_score,
        weatherRisk: response.weather_risk,
        bestDepartureTime: `${bestH}:${bestM}`,
        analysisComplete: true,
        analysisLoading: false,
        // Auto-select if score > 80
        selectedClearance: response.trajectory_score > 80 ? "auto-best" : "",
      });
    } catch (e: any) {
      console.error("Analysis failed:", e);
      toast({ title: "Analysis failed", description: e.message, variant: "destructive" });
      updateData({ analysisLoading: false });
    }
  };

  const completeStep = () => {
    const err = validateStep(currentStep, data);
    if (err) {
      toast({ title: "Complete this step", description: err, variant: "destructive" });
      return;
    }
    setCompletedSteps((prev) => new Set([...prev, currentStep]));

    // Trigger analysis when leaving Intent step
    if (currentStep === 1) {
      runAnalysis();
    }

    if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1);
  };

  const goBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const stepComponents = [
    <StepRegistration data={data} updateData={updateData} />,
    <StepIntent data={data} updateData={updateData} />,
    <StepClearance data={data} updateData={updateData} />,
    <StepAuthority data={data} updateData={updateData} />,
    <StepMonitoring data={data} updateData={updateData} />,
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/40 backdrop-blur-xl sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-mono">Back</span>
          </button>
          <div className="flex items-center gap-2">
            <Plane className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm">Altos — Flight Planner</span>
          </div>
        </div>
      </header>

      <div className="container py-8">
        <div className="mb-10">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            {steps.map((step, i) => {
              const isActive = i === currentStep;
              const isCompleted = completedSteps.has(i);
              return (
                <div key={step.title} className="flex items-center">
                  <button
                    onClick={() => (isCompleted || i <= currentStep) && setCurrentStep(i)}
                    className={`flex flex-col items-center gap-2 group transition-all ${
                      isCompleted || i <= currentStep ? "cursor-pointer" : "cursor-not-allowed opacity-40"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        isActive
                          ? "bg-primary text-primary-foreground glow-primary"
                          : isCompleted
                          ? "bg-primary/20 text-primary border border-primary/40"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <step.icon className="w-4 h-4" />
                      )}
                    </div>
                    <span
                      className={`text-xs font-mono hidden md:block ${
                        isActive ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      {step.title}
                    </span>
                  </button>
                  {i < steps.length - 1 && (
                    <div
                      className={`w-8 lg:w-16 h-px mx-1 ${
                        isCompleted ? "bg-primary/50" : "bg-border"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="max-w-3xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-6">
                <span className="text-primary font-mono text-xs tracking-widest uppercase">
                  Step {currentStep + 1} of {steps.length}
                </span>
                <h2 className="text-2xl md:text-3xl font-bold mt-1">
                  {steps[currentStep].description}
                </h2>
              </div>

              <div className="glass-card rounded-xl p-6 md:p-8">
                {stepComponents[currentStep]}
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-between mt-8">
            <button
              onClick={goBack}
              disabled={currentStep === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-md border border-border text-foreground disabled:opacity-30 disabled:cursor-not-allowed hover:bg-secondary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </button>
            <button
              onClick={completeStep}
              disabled={data.analysisLoading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity font-medium disabled:opacity-50"
            >
              {currentStep === steps.length - 1 ? (
                completedSteps.has(steps.length - 1) ? "Mission Active ✓" : "Activate Monitoring"
              ) : (
                <>
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlightPlan;
