import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  UserCheck,
  Send,
  Activity,
  GitBranch,
  Eye,
  Shield,
  ArrowLeft,
  ArrowRight,
  Check,
  Plane,
} from "lucide-react";
import StepRegistration from "@/components/flight-plan/StepRegistration";
import StepIntent from "@/components/flight-plan/StepIntent";
import StepTrajectory from "@/components/flight-plan/StepTrajectory";
import StepClearance from "@/components/flight-plan/StepClearance";
import StepAuthority from "@/components/flight-plan/StepAuthority";
import StepMonitoring from "@/components/flight-plan/StepMonitoring";

const steps = [
  { num: "5.1", title: "Registration", icon: UserCheck, description: "Vehicle & Operator Registration" },
  { num: "5.2", title: "Flight Intent", icon: Send, description: "Flight Intent Submission" },
  { num: "5.3", title: "Trajectory Analysis", icon: Activity, description: "Trajectory Simulation & Conflict Analysis" },
  { num: "5.4", title: "Clearances", icon: GitBranch, description: "Multi-Option Clearances" },
  { num: "5.5", title: "Authority Review", icon: Eye, description: "Authority Interface" },
  { num: "5.6", title: "Monitoring", icon: Shield, description: "In-Flight Monitoring" },
];

export interface FlightPlanData {
  // Step 1
  aircraftId: string;
  operatorName: string;
  aircraftType: string;
  maxSpeed: string;
  maxAltitude: string;
  // Step 2
  origin: string;
  destination: string;
  altitudeBand: string;
  departureWindowStart: string;
  departureWindowEnd: string;
  contingencyLanding: string;
  // Step 3 - generated
  conflicts: number;
  trajectoryScore: number;
  weatherRisk: string;
  // Step 4
  selectedClearance: string;
  // Step 5 - review
  authorityApproved: boolean;
  // Step 6 - monitoring
  monitoringActive: boolean;
}

const initialData: FlightPlanData = {
  aircraftId: "",
  operatorName: "",
  aircraftType: "evtol",
  maxSpeed: "",
  maxAltitude: "",
  origin: "",
  destination: "",
  altitudeBand: "low",
  departureWindowStart: "",
  departureWindowEnd: "",
  contingencyLanding: "",
  conflicts: 0,
  trajectoryScore: 0,
  weatherRisk: "low",
  selectedClearance: "",
  authorityApproved: false,
  monitoringActive: false,
};

const FlightPlan = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<FlightPlanData>(initialData);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const navigate = useNavigate();

  const updateData = (partial: Partial<FlightPlanData>) => {
    setData((prev) => ({ ...prev, ...partial }));
  };

  const completeStep = () => {
    setCompletedSteps((prev) => new Set([...prev, currentStep]));
    if (currentStep < 5) setCurrentStep(currentStep + 1);
  };

  const goBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const stepComponents = [
    <StepRegistration data={data} updateData={updateData} />,
    <StepIntent data={data} updateData={updateData} />,
    <StepTrajectory data={data} updateData={updateData} />,
    <StepClearance data={data} updateData={updateData} />,
    <StepAuthority data={data} updateData={updateData} />,
    <StepMonitoring data={data} updateData={updateData} />,
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/40 backdrop-blur-xl sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-mono">Back to Overview</span>
          </button>
          <div className="flex items-center gap-2">
            <Plane className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm">Flight Plan Wizard</span>
          </div>
        </div>
      </header>

      <div className="container py-8">
        {/* Step indicator */}
        <div className="mb-10">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            {steps.map((step, i) => {
              const isActive = i === currentStep;
              const isCompleted = completedSteps.has(i);
              return (
                <div key={step.num} className="flex items-center">
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

        {/* Step content */}
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
                  Step {steps[currentStep].num}
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

          {/* Navigation */}
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
              className="flex items-center gap-2 px-5 py-2.5 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity font-medium"
            >
              {currentStep === 5 ? (
                completedSteps.has(5) ? "Mission Active ✓" : "Activate Monitoring"
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
