import { useState, useEffect, useRef } from "react";
import { CheckCircle, AlertTriangle, Radio } from "lucide-react";
import type { FlightPlanData } from "@/pages/FlightPlan";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

interface Props {
  data: FlightPlanData;
  updateData: (d: Partial<FlightPlanData>) => void;
}

// Simple location coords lookup
const LOCATION_COORDS: Record<string, [number, number]> = {
  default_origin: [-73.985, 40.748],
  default_dest: [-73.978, 40.764],
};

function getCoords(location: string, fallback: [number, number]): [number, number] {
  const key = location.toLowerCase().trim();
  for (const [k, v] of Object.entries(LOCATION_COORDS)) {
    if (key.includes(k)) return v;
  }
  return fallback;
}

function interpolate(a: [number, number], b: [number, number], t: number): [number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

const StepMonitoring = ({ data, updateData }: Props) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<"nominal" | "alert">("nominal");
  const animRef = useRef<number | null>(null);

  const origin: [number, number] = getCoords(data.origin, [-73.985, 40.748]);
  const destination: [number, number] = getCoords(data.destination, [-73.94, 40.78]);

  // Generate a curved route with waypoints
  const routePoints: [number, number][] = [];
  const numPoints = 100;
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const lng = origin[0] + (destination[0] - origin[0]) * t;
    const lat = origin[1] + (destination[1] - origin[1]) * t;
    // Add slight curve
    const curve = Math.sin(t * Math.PI) * 0.008;
    routePoints.push([lng + curve * 0.5, lat + curve]);
  }

  useEffect(() => {
    if (!mapContainer.current || !data.monitoringActive) return;
    if (mapRef.current) return; // already init

    const center = interpolate(origin, destination, 0.5);
    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          "osm-tiles": {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "© OpenStreetMap contributors",
          },
        },
        layers: [
          {
            id: "osm-tiles",
            type: "raster",
            source: "osm-tiles",
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      center: center,
      zoom: 13,
      pitch: 50,
      bearing: -20,
    });

    map.on("load", () => {
      // Route line
      map.addSource("route", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates: routePoints },
        },
      });

      // Route glow (wider, transparent)
      map.addLayer({
        id: "route-glow",
        type: "line",
        source: "route",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": "#2dd4bf",
          "line-width": 10,
          "line-opacity": 0.25,
        },
      });

      // Route line (core)
      map.addLayer({
        id: "route-line",
        type: "line",
        source: "route",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": "#2dd4bf",
          "line-width": 4,
          "line-opacity": 0.9,
        },
      });

      // Origin marker
      new maplibregl.Marker({ color: "#2dd4bf" })
        .setLngLat(origin)
        .setPopup(new maplibregl.Popup().setText(`Origin: ${data.origin || "Start"}`))
        .addTo(map);

      // Destination marker
      new maplibregl.Marker({ color: "#f59e0b" })
        .setLngLat(destination)
        .setPopup(new maplibregl.Popup().setText(`Destination: ${data.destination || "End"}`))
        .addTo(map);

      // Vehicle marker (car icon)
      const el = document.createElement("div");
      el.style.width = "32px";
      el.style.height = "32px";
      el.style.borderRadius = "50%";
      el.style.background = "#2dd4bf";
      el.style.border = "3px solid #0d1117";
      el.style.boxShadow = "0 0 20px rgba(45, 212, 191, 0.5)";
      el.style.display = "flex";
      el.style.alignItems = "center";
      el.style.justifyContent = "center";
      el.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0d1117" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>`;

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat(origin)
        .addTo(map);
      markerRef.current = marker;
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [data.monitoringActive]);

  // Animate vehicle along route
  useEffect(() => {
    if (!data.monitoringActive || !markerRef.current) return;

    let startTime: number | null = null;
    const duration = 30000; // 30 seconds for full route

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const t = Math.min(elapsed / duration, 1);
      setProgress(t);

      // Simulate alert at 30-40%
      if (t >= 0.3 && t < 0.4) setStatus("alert");
      else setStatus("nominal");

      const idx = Math.floor(t * (routePoints.length - 1));
      const point = routePoints[idx];
      markerRef.current?.setLngLat(point);

      // Pan map to follow
      if (mapRef.current && idx % 5 === 0) {
        mapRef.current.panTo(point, { duration: 500 });
      }

      if (t < 1) {
        animRef.current = requestAnimationFrame(animate);
      }
    };

    // Small delay to allow marker to be created
    const timeout = setTimeout(() => {
      animRef.current = requestAnimationFrame(animate);
    }, 1000);

    return () => {
      clearTimeout(timeout);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [data.monitoringActive, markerRef.current]);

  if (!data.monitoringActive) {
    return (
      <div className="space-y-6">
        <p className="text-muted-foreground text-sm">
          Real-time flight monitoring with 3D route visualization.
        </p>
        <div className="py-10 text-center space-y-4">
          <Radio className="w-10 h-10 text-primary mx-auto opacity-40" />
          <p className="text-muted-foreground text-sm">Monitoring will activate once you start the simulation.</p>
          <button
            onClick={() => updateData({ monitoringActive: true })}
            className="px-5 py-2.5 bg-primary text-primary-foreground rounded-md font-medium text-sm hover:opacity-90 transition-opacity"
          >
            Start Flight Simulation
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status bar */}
      <div className={`flex items-center gap-3 p-3 rounded-lg border ${
        status === "nominal" ? "border-primary/30 bg-primary/5" : "border-accent/30 bg-accent/5"
      }`}>
        {status === "nominal" ? (
          <CheckCircle className="w-5 h-5 text-primary" />
        ) : (
          <AlertTriangle className="w-5 h-5 text-accent" />
        )}
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">
            {status === "nominal" ? "On Track — Nominal" : "Deviation Detected"}
          </p>
          <p className="text-xs text-muted-foreground font-mono">
            {status === "nominal"
              ? "All trajectory constraints within tolerance"
              : "Minor lateral deviation — evaluating"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Progress</p>
          <p className="text-sm font-mono font-bold text-primary">{Math.round(progress * 100)}%</p>
        </div>
      </div>

      {/* 3D Map */}
      <div
        ref={mapContainer}
        className="w-full rounded-lg overflow-hidden border border-border"
        style={{ height: "400px" }}
      />

      {/* Flight info strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-secondary rounded-lg p-3 text-center">
          <p className="text-lg font-bold font-mono text-foreground">{data.origin || "Origin"}</p>
          <p className="text-[10px] text-muted-foreground">From</p>
        </div>
        <div className="bg-secondary rounded-lg p-3 text-center">
          <p className="text-lg font-bold font-mono text-primary">{data.altitudeBand.toUpperCase()}</p>
          <p className="text-[10px] text-muted-foreground">Altitude Band</p>
        </div>
        <div className="bg-secondary rounded-lg p-3 text-center">
          <p className="text-lg font-bold font-mono text-foreground">{data.destination || "Dest"}</p>
          <p className="text-[10px] text-muted-foreground">To</p>
        </div>
      </div>
    </div>
  );
};

export default StepMonitoring;
