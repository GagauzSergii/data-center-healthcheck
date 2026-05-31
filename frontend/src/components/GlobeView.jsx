/**
 * GlobeView.jsx
 *
 * Renders a 3D globe using react-globe.gl styled to match the reference:
 *  - Light grey/white continents, pale water
 *  - Lime-green atmospheric glow (#c8f000)
 *  - Node markers: green glow (healthy) / red pulse (critical)
 *  - White animated arcs connecting all nodes
 *  - Slow auto-rotation
 */

import Globe from "react-globe.gl";
import { useRef, useEffect, useMemo, useState, useCallback } from "react";
import * as THREE from "three";

// Colour constants (matches reference image palette)
const COLOR_LIME = "#c8f000";
const COLOR_GREEN = "#22c55e";
const COLOR_RED = "#ef4444";

/**
 * Generate arc pairs between all nodes to simulate traffic.
 * Returns an array of { startLat, startLng, endLat, endLng } objects.
 */
function buildArcs(nodes) {
  const arcs = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      arcs.push({
        startLat: nodes[i].latitude,
        startLng: nodes[i].longitude,
        endLat: nodes[j].latitude,
        endLng: nodes[j].longitude,
        color: "rgba(200,240,0,0.22)",   // subtle lime arcs
      });
    }
  }
  return arcs;
}

export default function GlobeView({ nodes, onNodeClick }) {
  const globeRef = useRef(null);
  const [globeReady, setGlobeReady] = useState(false);
  const [countries, setCountries] = useState({ features: [] });

  useEffect(() => {
    // Fetch GeoJSON for world map continents/countries (using lightweight D3 dataset with standardized borders)
    fetch("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson")
      .then((res) => res.json())
      .then((data) => setCountries(data));
  }, []);

  // Start auto-rotation once globe is ready
  useEffect(() => {
    if (!globeReady || !globeRef.current) return;
    const controls = globeRef.current.controls();
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.35;   // gentle, like reference
    controls.enableZoom = true;
    controls.enablePan = false;
    controls.minDistance = 200;
    controls.maxDistance = 700;
  }, [globeReady]);

  // Custom globe material — white/light water surface matching reference
  const globeMaterial = useMemo(() => {
    const mat = new THREE.MeshPhongMaterial();
    mat.color = new THREE.Color(0xffffff);       // white oceans
    mat.specular = new THREE.Color(0xffffff);
    mat.shininess = 5;
    mat.transparent = true;
    mat.opacity = 0.95;
    return mat;
  }, []);

  // Point marker data with color/size based on status
  // We use a ref to keep object references stable between polling intervals
  // so that react-globe.gl doesn't destroy and recreate the HTML badges,
  // which causes CSS animations to stutter/reset.
  const prevPointsRef = useRef([]);
  const pointsData = useMemo(() => {
    const nextPoints = nodes.map((n) => {
      const prev = prevPointsRef.current.find((p) => p.id === n.id);
      // If the node's status hasn't changed, return the exact same object reference
      if (prev && prev.status === n.status && prev.latitude === n.latitude && prev.longitude === n.longitude) {
        return prev;
      }
      return {
        ...n,
        lat: n.latitude,
        lng: n.longitude,
        color: n.status === "critical" ? COLOR_RED : COLOR_LIME,
        size: n.status === "critical" ? 0.7 : 0.5,
      };
    });
    prevPointsRef.current = nextPoints;
    return nextPoints;
  }, [nodes]);

  // Arc data
  const arcsData = useMemo(() => buildArcs(nodes), [nodes]);

  // Custom HTML label for each node (glassmorphic square badge like reference)
  const htmlElement = useCallback((d) => {
    const el = document.createElement("div");
    el.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      pointer-events: none;
      transform: translate(-50%, -100%);
    `;

    const badge = document.createElement("div");
    badge.style.cssText = `
      background: rgba(255, 255, 255, 0.5);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      color: #0f1117;
      font-family: 'Inter', sans-serif;
      font-size: 11px;
      font-weight: 600;
      padding: 10px 14px;
      border-radius: 14px;
      border: 1px solid rgba(255, 255, 255, 0.9);
      white-space: nowrap;
      margin-bottom: 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.05);
    `;

    const iconColor = d.status === "critical" ? "#ef4444" : "#84cc16";
    const bgIconColor = d.status === "critical" ? "rgba(239,68,68,0.2)" : "rgba(132,204,22,0.15)";
    const shadow = d.status === "critical" ? "none" : `0 0 10px ${bgIconColor}`;
    const animationClass = d.status === "critical" ? "neon-pulse-critical" : "";
    
    badge.innerHTML = `
      <div class="${animationClass}" style="width: 28px; height: 28px; border-radius: 50%; background: ${bgIconColor}; color: ${iconColor}; display: flex; align-items: center; justify-content: center; box-shadow: ${shadow}; transition: all 0.3s ease;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M12 8v4l3 3"></path>
        </svg>
      </div>
      <div>${d.name}</div>
    `;

    el.appendChild(badge);
    return el;
  }, []);

  return (
    <div className="w-full h-full flex items-center justify-center">
      <style>{`
        @keyframes neon-pulse-critical {
          0% { 
            box-shadow: 0 0 10px rgba(239,68,68,0.5), 0 0 20px rgba(239,68,68,0.3); 
            background: rgba(239,68,68,0.2); 
            transform: scale(1); 
          }
          100% { 
            box-shadow: 0 0 25px rgba(239,68,68,1), 0 0 50px rgba(239,68,68,0.8), 0 0 10px rgba(239,68,68,0.8) inset; 
            background: rgba(239,68,68,0.4); 
            transform: scale(1.15); 
          }
        }
        .neon-pulse-critical {
          animation: neon-pulse-critical 0.6s ease-in-out infinite alternate !important;
        }
      `}</style>
      <Globe
        ref={globeRef}
        onGlobeReady={() => setGlobeReady(true)}
        width={undefined}
        height={undefined}

        /* ── Globe surface (Oceans) ── */
        globeImageUrl={null}
        globeMaterial={globeMaterial}
        backgroundColor="rgba(0,0,0,0)"

        /* ── Polygons (Continents) ── */
        polygonsData={countries.features}
        polygonAltitude={(d) => (d.properties.name === "Ukraine" || d.id === "UKR") ? 0.02 : 0.015}
        polygonCapColor={(d) => (d.properties.name === "Ukraine" || d.id === "UKR") ? "#fcd34d" : "#d1d5db"}  // Yellow for Ukraine, grey otherwise
        polygonSideColor={(d) => (d.properties.name === "Ukraine" || d.id === "UKR") ? "#f59e0b" : "#9ca3af"} // Orange/dark yellow sides
        polygonStrokeColor={(d) => (d.properties.name === "Ukraine" || d.id === "UKR") ? "#f59e0b" : "#9ca3af"}

        /* ── Atmosphere glow ── */
        showAtmosphere={true}
        atmosphereColor="#00aaff" // Pure sky blue/cyan to avoid any purple tint
        atmosphereAltitude={0.25}

        /* ── Graticule lines ── */
        showGraticules={true}

        /* ── Node point markers ── */
        pointsData={pointsData}
        pointLat="lat"
        pointLng="lng"
        pointColor="color"
        pointRadius="size"
        pointAltitude={0.02}
        pointResolution={32}
        onPointClick={(point) => onNodeClick && onNodeClick(point)}

        /* ── HTML labels ── */
        htmlElementsData={pointsData}
        htmlElement={htmlElement}
        htmlAltitude={0.08}

        /* ── Arcs (traffic lanes) - Neon ── */
        arcsData={arcsData}
        arcStartLat="startLat"
        arcStartLng="startLng"
        arcEndLat="endLat"
        arcEndLng="endLng"
        arcColor={() => COLOR_LIME} // Neon lime arcs
        arcDashLength={0.4}
        arcDashGap={0.2}
        arcDashAnimateTime={2000}
        arcStroke={0.5}
        arcAltitude={0.2}
      />
    </div>
  );
}
