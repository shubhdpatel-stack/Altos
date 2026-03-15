import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-evtol.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="eVTOL aircraft flying over urban cityscape with trajectory paths"
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
      </div>

      {/* Grid overlay */}
      <div className="absolute inset-0 grid-pattern opacity-30" />

      <div className="container relative z-10 py-32">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px w-12 bg-primary" />
            <span className="text-primary font-mono text-sm tracking-widest uppercase">
              Altos Platform
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6 tracking-tight">
            Advanced Low Altitude{" "}
            <span className="text-gradient-primary">Traffic Operation</span>{" "}
            System
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed">
            A software platform for managing high-frequency
            eVTOL and rotorcraft operations in mixed airspace environments — with real-time conflict analysis and weather-aware routing.
          </p>

          <div className="flex flex-wrap gap-4">
            <Link to="/plan" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-md font-medium hover:opacity-90 transition-opacity">
              Plan Flight
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mt-0.5">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
            <a href="#overview" className="inline-flex items-center gap-2 border border-border text-foreground px-6 py-3 rounded-md font-medium hover:bg-secondary transition-colors">
              Learn More
            </a>
          </div>
        </motion.div>

        {/* Stats strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl"
        >
          {[
            { label: "Clearance Latency", value: "Reduced" },
            { label: "Operational Delays", value: "Minimized" },
            { label: "Safety & Predictability", value: "Improved" },
          ].map((stat) => (
            <div key={stat.label} className="glass-card rounded-lg p-5">
              <p className="text-2xl font-bold text-primary mb-1">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
