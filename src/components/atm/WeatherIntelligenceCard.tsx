import { motion } from "framer-motion";
import { Wind, Droplets, Thermometer, Eye, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { WeatherIntelligenceResult } from "@/lib/atmTypes";

interface Props {
  weather: WeatherIntelligenceResult;
}

const RISK_COLOR = {
  low: { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
  moderate: { text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30" },
  high: { text: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30" },
};

function RiskBar({ score, label }: { score: number; label: string }) {
  const color = score >= 60 ? "bg-red-500" : score >= 30 ? "bg-amber-500" : "bg-emerald-500";
  return (
    <div>
      <div className="flex justify-between text-[10px] text-white/40 mb-1">
        <span>{label}</span>
        <span className={score >= 60 ? "text-red-400" : score >= 30 ? "text-amber-400" : "text-emerald-400"}>
          {score}/100
        </span>
      </div>
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
    </div>
  );
}

export default function WeatherIntelligenceCard({ weather }: Props) {
  const ow = weather.origin_weather;
  const riskCfg = RISK_COLOR[ow.risk_level] ?? RISK_COLOR.low;
  const TrendIcon = weather.forecast.trend === "improving" ? TrendingDown : weather.forecast.trend === "degrading" ? TrendingUp : Minus;
  const trendColor = weather.forecast.trend === "improving" ? "text-emerald-400" : weather.forecast.trend === "degrading" ? "text-red-400" : "text-white/40";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="rounded-xl border border-white/10 bg-white/5 overflow-hidden"
    >
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
        <span className="text-xs font-semibold text-white/60 uppercase tracking-widest">Weather Intelligence</span>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${riskCfg.text} ${riskCfg.bg} ${riskCfg.border}`}>
          {ow.risk_level.toUpperCase()} RISK
        </span>
      </div>

      <div className="p-5 space-y-4">
        {/* Current conditions grid */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: Wind, label: "Wind", value: `${ow.wind_speed} km/h`, sub: `Gusts ${ow.wind_gusts}` },
            { icon: Droplets, label: "Precip", value: `${ow.precipitation} mm`, sub: ow.weather_description },
            { icon: Thermometer, label: "Temp", value: `${ow.temperature}°C`, sub: "Adj. urban" },
            { icon: Eye, label: "Visibility", value: ow.visibility_m >= 10000 ? "10+ km" : `${(ow.visibility_m / 1000).toFixed(1)} km`, sub: ow.visibility_m < 3000 ? "Poor" : "Good" },
          ].map(({ icon: Ic, label, value, sub }) => (
            <div key={label} className="bg-black/20 rounded-lg p-2.5 text-center">
              <Ic className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
              <p className="text-[10px] text-white/40">{label}</p>
              <p className="text-xs font-bold text-white">{value}</p>
              <p className="text-[9px] text-white/30">{sub}</p>
            </div>
          ))}
        </div>

        {/* Forecast timeline */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] text-white/40 uppercase tracking-widest">Risk Forecast</span>
            <TrendIcon className={`w-3 h-3 ${trendColor}`} />
            <span className={`text-[10px] ${trendColor}`}>{weather.forecast.trend}</span>
          </div>
          <div className="space-y-2">
            <RiskBar score={ow.risk_score} label="Now" />
            <RiskBar score={weather.forecast.t_plus_15.risk_score} label="+15 min" />
            <RiskBar score={weather.forecast.t_plus_30.risk_score} label="+30 min" />
          </div>
          <div className="flex justify-between text-[9px] text-white/25 mt-1">
            <span>±{weather.forecast.t_plus_15.uncertainty_pct}% uncertainty at +15</span>
            <span>±{weather.forecast.t_plus_30.uncertainty_pct}% at +30</span>
          </div>
        </div>

        {/* Micro-weather effects */}
        {ow.micro_effects && ow.micro_effects.length > 0 && (
          <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-lg p-3">
            <p className="text-[10px] text-cyan-400 font-semibold mb-1">Urban Micro-Weather Effects</p>
            {ow.micro_effects.map((effect, i) => (
              <p key={i} className="text-xs text-white/50">{effect}</p>
            ))}
          </div>
        )}

        {/* Recommendation */}
        <div className={`rounded-lg p-3 ${weather.recommendation === "proceed" ? "bg-emerald-500/10 border border-emerald-500/20" : weather.recommendation === "delay" ? "bg-amber-500/10 border border-amber-500/20" : "bg-sky-500/10 border border-sky-500/20"}`}>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-1">
            {weather.recommendation === "proceed" ? "✓ Proceed" : weather.recommendation === "delay" ? "⏸ Recommend Delay" : "↗ Recommend Reroute"}
          </p>
          <p className="text-xs text-white/60">{weather.recommendation_reason}</p>
        </div>
      </div>
    </motion.div>
  );
}
