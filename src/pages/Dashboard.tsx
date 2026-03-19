import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plane, LogOut, Plus, Activity, AlertTriangle,
  Wind, TrendingUp, ArrowRight, MapPin, Clock,
  CheckCircle2, AlertCircle, Loader, BarChart3,
  CheckCircle, RefreshCw, Zap, Navigation,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface FlightRecord {
  id: string;
  aircraft_id: string;
  origin: string;
  destination: string;
  trajectory_score: number;
  status: string;
  weather_risk: string;
  conflicts: number;
  created_at: string;
  altitude_band: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  pending:   { label: "Pending",   color: "text-amber-400 bg-amber-400/10 border-amber-400/20",   icon: Clock },
  approved:  { label: "Approved",  color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20", icon: CheckCircle2 },
  active:    { label: "Active",    color: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",       icon: Activity },
  analyzing: { label: "Analyzing", color: "text-blue-400 bg-blue-400/10 border-blue-400/20",       icon: Loader },
  completed: { label: "Completed", color: "text-zinc-400 bg-zinc-400/10 border-zinc-400/20",       icon: CheckCircle2 },
};

const WEATHER_COLOR: Record<string, string> = {
  low: "text-emerald-400", moderate: "text-amber-400", high: "text-red-400", unknown: "text-zinc-500",
};

function ScoreRing({ score }: { score: number }) {
  const radius = 18;
  const circ = 2 * Math.PI * radius;
  const dash = (score / 100) * circ;
  const color = score >= 80 ? "#34d399" : score >= 60 ? "#fbbf24" : "#f87171";
  return (
    <div className="relative w-12 h-12 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" width="48" height="48" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3.5" />
        <circle
          cx="24" cy="24" r={radius} fill="none"
          stroke={color} strokeWidth="3.5"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.8s ease" }}
        />
      </svg>
      <span className="text-xs font-bold font-mono" style={{ color }}>{score}</span>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded-full border ${cfg.color}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const item = {
  hidden: { opacity: 0, y: 14 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

export default function Dashboard() {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [flights, setFlights] = useState<FlightRecord[]>([]);
  const [loadingFlights, setLoadingFlights] = useState(true);
  const [decisions, setDecisions] = useState<{ decision: string; count: number }[]>([]);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth", { replace: true });
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("flight_intents")
      .select("id,aircraft_id,origin,destination,trajectory_score,status,weather_risk,conflicts,created_at,altitude_band")
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data, error }) => {
        if (!error) setFlights((data as FlightRecord[]) ?? []);
        setLoadingFlights(false);
      });

    // Fetch decision outcomes
    supabase
      .from("flight_decisions")
      .select("decision")
      .then(({ data }) => {
        if (!data) return;
        const counts: Record<string, number> = {};
        data.forEach((r: any) => { counts[r.decision] = (counts[r.decision] ?? 0) + 1; });
        setDecisions(Object.entries(counts).map(([decision, count]) => ({ decision, count: count as number })));
      });
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    toast({ title: "Signed out" });
    navigate("/", { replace: true });
  };

  // Stats
  const total = flights.length;
  const avgScore = total ? Math.round(flights.reduce((a, f) => a + (f.trajectory_score ?? 0), 0) / total) : null;
  const conflicts = flights.filter((f) => f.conflicts > 0).length;
  const safeFlights = flights.filter((f) => (f.trajectory_score ?? 0) >= 80).length;

  const displayName = user?.user_metadata?.operator_name
    ?? user?.email?.split("@")[0]
    ?? "Pilot";

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5 }}>
          <Plane className="w-6 h-6 text-primary" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Ambient glow blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-32 w-80 h-80 bg-cyan-500/4 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-primary/3 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-xl sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
              <Plane className="w-4 h-4 text-primary" />
            </div>
            <span className="font-bold text-sm tracking-tight">Altos</span>
            <span className="text-xs font-mono text-muted-foreground border border-border/60 px-1.5 py-0.5 rounded-md">UTM</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs font-medium text-foreground">{displayName}</span>
              <span className="text-xs text-muted-foreground">{user?.email}</span>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border/60 rounded-lg px-3 py-2 transition-all hover:bg-secondary hover:border-border"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:block">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <div className="container py-8 max-w-5xl">
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">

          {/* Welcome */}
          <motion.div variants={item} className="flex items-end justify-between">
            <div>
              <p className="text-primary font-mono text-xs tracking-widest uppercase mb-1.5">Operations Dashboard</p>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                Welcome back, <span className="text-primary">{displayName}</span>
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                {total > 0 ? `${total} flight${total !== 1 ? "s" : ""} on record` : "No flights submitted yet"}
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/plan")}
              className="hidden md:flex items-center gap-2 bg-primary text-primary-foreground rounded-xl px-5 py-2.5 text-sm font-medium shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              Plan New Flight
            </motion.button>
          </motion.div>

          {/* Stats grid */}
          <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              {
                icon: BarChart3,
                label: "Total Flights",
                value: total > 0 ? total.toString() : "—",
                sub: "submitted plans",
                accent: "text-primary",
                bg: "bg-primary/5",
              },
              {
                icon: TrendingUp,
                label: "Avg Score",
                value: avgScore !== null ? avgScore.toString() : "—",
                sub: "trajectory safety",
                accent: avgScore !== null ? (avgScore >= 80 ? "text-emerald-400" : avgScore >= 60 ? "text-amber-400" : "text-red-400") : "text-muted-foreground",
                bg: avgScore !== null ? (avgScore >= 80 ? "bg-emerald-400/5" : avgScore >= 60 ? "bg-amber-400/5" : "bg-red-400/5") : "bg-secondary/50",
              },
              {
                icon: CheckCircle2,
                label: "Safe Flights",
                value: total > 0 ? safeFlights.toString() : "—",
                sub: "score ≥ 80",
                accent: "text-emerald-400",
                bg: "bg-emerald-400/5",
              },
              {
                icon: AlertTriangle,
                label: "Conflicts",
                value: total > 0 ? conflicts.toString() : "—",
                sub: "route conflicts",
                accent: conflicts > 0 ? "text-red-400" : "text-zinc-400",
                bg: conflicts > 0 ? "bg-red-400/5" : "bg-secondary/50",
              },
            ].map(({ icon: Icon, label, value, sub, accent, bg }) => (
              <div key={label} className={`rounded-2xl border border-border/50 p-4 ${bg} backdrop-blur-sm`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono text-muted-foreground">{label}</span>
                  <div className="w-7 h-7 rounded-lg bg-background/50 flex items-center justify-center">
                    <Icon className={`w-3.5 h-3.5 ${accent}`} />
                  </div>
                </div>
                <p className={`text-3xl font-bold font-mono tracking-tight ${accent}`}>{value}</p>
                <p className="text-xs text-muted-foreground mt-1">{sub}</p>
              </div>
            ))}
          </motion.div>

          {/* Decision Outcomes */}
          {decisions.length > 0 && (
            <motion.div variants={item}>
              <h2 className="font-semibold text-base mb-4">ATM Decision Outcomes</h2>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { key: "GO", label: "Cleared GO", icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-400/5 border-emerald-400/20" },
                  { key: "DELAY", label: "Delayed", icon: Clock, color: "text-amber-400", bg: "bg-amber-400/5 border-amber-400/20" },
                  { key: "REROUTE", label: "Rerouted", icon: Navigation, color: "text-sky-400", bg: "bg-sky-400/5 border-sky-400/20" },
                ].map(({ key, label, icon: Icon, color, bg }) => {
                  const d = decisions.find(x => x.decision === key);
                  return (
                    <div key={key} className={`rounded-2xl border p-4 ${bg}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono text-muted-foreground">{label}</span>
                        <Icon className={`w-4 h-4 ${color}`} />
                      </div>
                      <p className={`text-3xl font-bold font-mono ${color}`}>{d?.count ?? 0}</p>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Flights section */}
          <motion.div variants={item}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-base">Recent Flights</h2>
              <button
                onClick={() => navigate("/plan")}
                className="md:hidden flex items-center gap-1.5 bg-primary text-primary-foreground rounded-lg px-3 py-1.5 text-xs font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                New Flight
              </button>
            </div>

            <div className="rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm overflow-hidden">
              {loadingFlights ? (
                <div className="p-12 flex flex-col items-center gap-3">
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}>
                    <Loader className="w-5 h-5 text-muted-foreground" />
                  </motion.div>
                  <span className="text-xs font-mono text-muted-foreground">Loading flights...</span>
                </div>
              ) : flights.length === 0 ? (
                <div className="p-16 flex flex-col items-center gap-4 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-secondary/50 flex items-center justify-center">
                    <Plane className="w-7 h-7 text-muted-foreground/40" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">No flights yet</p>
                    <p className="text-muted-foreground text-xs mt-1">Submit your first flight plan to get started</p>
                  </div>
                  <button
                    onClick={() => navigate("/plan")}
                    className="flex items-center gap-2 text-primary text-sm font-mono hover:underline"
                  >
                    Plan your first flight <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <AnimatePresence>
                  <div className="divide-y divide-border/40">
                    {flights.map((f, i) => (
                      <motion.div
                        key={f.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05, duration: 0.3 }}
                        className="flex items-center gap-4 px-5 py-4 hover:bg-secondary/20 transition-colors group"
                      >
                        {/* Score ring */}
                        <ScoreRing score={f.trajectory_score ?? 0} />

                        {/* Route */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 text-sm">
                            <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <span className="truncate text-foreground font-medium">{f.origin}</span>
                            <ArrowRight className="w-3 h-3 text-primary shrink-0" />
                            <span className="truncate text-foreground">{f.destination}</span>
                          </div>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-xs font-mono text-muted-foreground border border-border/50 px-1.5 py-0.5 rounded-md">
                              {f.altitude_band}
                            </span>
                            <span className={`text-xs font-mono ${WEATHER_COLOR[f.weather_risk] ?? "text-zinc-500"}`}>
                              {f.weather_risk} risk
                            </span>
                            {f.conflicts > 0 && (
                              <span className="text-xs font-mono text-red-400 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {f.conflicts} conflict{f.conflicts !== 1 ? "s" : ""}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Right side */}
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <StatusPill status={f.status} />
                          <span className="text-xs text-muted-foreground font-mono">
                            {new Date(f.created_at).toLocaleDateString("en-US", {
                              month: "short", day: "numeric",
                            })}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </AnimatePresence>
              )}
            </div>
          </motion.div>

        </motion.div>
      </div>
    </div>
  );
}
