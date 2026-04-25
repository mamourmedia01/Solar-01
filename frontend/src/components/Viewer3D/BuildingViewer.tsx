import { useRef, useEffect, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { GeoJSONPolygon } from "../../types";
import { Layers, Eye, EyeOff } from "lucide-react";

interface Props {
  polygon: GeoJSONPolygon | null;
  roofAreaM2: number;
  heightM: number;
  orientationDeg?: number;
  systemKw?: number;
}

interface LayerState {
  panels: boolean;
  shading: boolean;
  equipment: boolean;
  conduits: boolean;
}

// Project WGS84 coords to local metres relative to centroid
function projectCoords(coords: number[][], centroid: [number, number]): [number, number][] {
  const LAT_M = 111320;
  const LNG_M = Math.cos((centroid[1] * Math.PI) / 180) * 111320;
  return coords.map(([lng, lat]) => [
    (lng - centroid[0]) * LNG_M,
    (lat - centroid[1]) * LAT_M,
  ]);
}

function centroid2D(coords: number[][]): [number, number] {
  const n = coords.length;
  return [
    coords.reduce((s, c) => s + c[0], 0) / n,
    coords.reduce((s, c) => s + c[1], 0) / n,
  ];
}

// Check if a 2D point is inside a polygon (ray-cast)
function pointInPolygon(px: number, py: number, poly: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function buildScene(
  canvas: HTMLCanvasElement,
  polygon: GeoJSONPolygon | null,
  height: number,
  orientation: number,
  layers: LayerState,
  onScanComplete: () => void,
): () => void {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0f2f5);
  scene.fog = new THREE.Fog(0xf0f2f5, 80, 200);

  const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 500);
  camera.position.set(30, 40, 50);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.maxPolarAngle = Math.PI / 2.2;
  controls.minDistance = 5;
  controls.maxDistance = 150;

  // Lights
  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambient);
  const sun = new THREE.DirectionalLight(0xfff5e0, 1.8);
  sun.position.set(30, 60, 20);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 200;
  sun.shadow.camera.left = -60;
  sun.shadow.camera.right = 60;
  sun.shadow.camera.top = 60;
  sun.shadow.camera.bottom = -60;
  scene.add(sun);

  // Ground plane
  const groundGeo = new THREE.PlaneGeometry(200, 200);
  const groundMat = new THREE.MeshLambertMaterial({ color: 0xe8eaed });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Build footprint polygon
  let footprint: [number, number][] = [];
  let localCoords: [number, number][] = [];
  let extents = { minX: 0, maxX: 20, minY: 0, maxY: 20 };

  if (polygon && polygon.coordinates?.[0]?.length > 2) {
    const rawCoords = polygon.coordinates[0];
    const ctr = centroid2D(rawCoords);
    localCoords = projectCoords(rawCoords, ctr);
    footprint = localCoords;
    const xs = localCoords.map((c) => c[0]);
    const ys = localCoords.map((c) => c[1]);
    extents = {
      minX: Math.min(...xs), maxX: Math.max(...xs),
      minY: Math.min(...ys), maxY: Math.max(...ys),
    };
  } else {
    // Fallback rectangular building based on area
    const side = Math.sqrt(Math.max(100, 500)) / 2;
    footprint = [[-side, -side], [side, -side], [side, side], [-side, side]];
    localCoords = footprint;
    extents = { minX: -side, maxX: side, minY: -side, maxY: side };
  }

  const width = extents.maxX - extents.minX;
  const depth = extents.maxY - extents.minY;

  // Roof/building materials
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xd0d4d8, roughness: 0.9, metalness: 0 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0xc8cdd2, roughness: 0.85, metalness: 0 });

  // Extrude building from polygon
  const shape = new THREE.Shape();
  footprint.forEach(([x, y], i) => {
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  });
  shape.closePath();

  const extrudeSettings = { depth: height, bevelEnabled: false };
  const buildingGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  buildingGeo.rotateX(-Math.PI / 2);
  buildingGeo.translate(0, 0, 0);

  // Separate roof face (top)
  const buildingMesh = new THREE.Mesh(buildingGeo, [wallMat, roofMat]);
  buildingMesh.castShadow = true;
  buildingMesh.receiveShadow = true;
  scene.add(buildingMesh);

  // ---- SHADING ZONES (green / blue / yellow overlays) ----
  if (layers.shading) {
    const zoneData = [
      { color: 0x22c55e, opacity: 0.25, xFrac: [0, 0.6],  yFrac: [0.3, 1.0] }, // green — high irr
      { color: 0x06b6d4, opacity: 0.2,  xFrac: [0.5, 1.0], yFrac: [0.0, 0.7] }, // cyan — medium
      { color: 0xeab308, opacity: 0.2,  xFrac: [0.0, 0.5], yFrac: [0.0, 0.35] }, // yellow — low
    ];
    zoneData.forEach(({ color, opacity, xFrac, yFrac }) => {
      const zw = (xFrac[1] - xFrac[0]) * width;
      const zd = (yFrac[1] - yFrac[0]) * depth;
      const geo = new THREE.PlaneGeometry(zw, zd);
      const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(
        extents.minX + xFrac[0] * width + zw / 2,
        height + 0.05,
        -(extents.minY + yFrac[0] * depth + zd / 2),
      );
      scene.add(mesh);
    });
  }

  // ---- SOLAR PANELS ----
  const panelGroup = new THREE.Group();
  const PANEL_W = 1.0;
  const PANEL_H = 1.65;
  const PANEL_GAP = 0.15;
  const ROW_GAP = 0.3;
  const TILT = 0.2; // tilt height at back edge

  const panelMat = new THREE.MeshStandardMaterial({
    color: 0x1a2744, roughness: 0.3, metalness: 0.6,
  });
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x8899aa, roughness: 0.4, metalness: 0.8 });

  if (layers.panels) {
    const stepX = PANEL_W + PANEL_GAP;
    const stepY = PANEL_H + ROW_GAP;
    const margin = 1.5;

    let px = extents.minX + margin;
    while (px + PANEL_W < extents.maxX - margin) {
      let py = extents.minY + margin;
      while (py + PANEL_H < extents.maxY - margin) {
        const cx = px + PANEL_W / 2;
        const cy = py + PANEL_H / 2;
        if (!footprint.length || pointInPolygon(cx, cy, footprint)) {
          const panelGeo = new THREE.BoxGeometry(PANEL_W, 0.04, PANEL_H);
          const panel = new THREE.Mesh(panelGeo, panelMat);
          panel.position.set(cx, height + 0.06 + TILT / 2, -(cy));
          panel.rotation.x = Math.atan(TILT / PANEL_H);
          panel.castShadow = true;

          const frameGeo = new THREE.EdgesGeometry(panelGeo);
          const frameLines = new THREE.LineSegments(
            frameGeo, new THREE.LineBasicMaterial({ color: 0x4a6080, linewidth: 1 }),
          );
          panel.add(frameLines);
          panelGroup.add(panel);
        }
        py += stepY;
      }
      px += stepX;
    }
    scene.add(panelGroup);
  }

  // ---- HVAC / EQUIPMENT ----
  if (layers.equipment) {
    const hvacMat = new THREE.MeshStandardMaterial({ color: 0x8a9ba8, roughness: 0.6, metalness: 0.3 });
    const hvacPositions: [number, number][] = [
      [extents.minX + width * 0.15, extents.minY + depth * 0.15],
      [extents.minX + width * 0.7, extents.minY + depth * 0.2],
      [extents.minX + width * 0.5, extents.minY + depth * 0.55],
      [extents.minX + width * 0.2, extents.minY + depth * 0.75],
    ];
    hvacPositions.forEach(([hx, hy]) => {
      if (!pointInPolygon(hx, hy, footprint)) return;
      const w = 1.8 + Math.random();
      const d = 1.4 + Math.random() * 0.5;
      const h = 0.8 + Math.random() * 0.4;
      const geo = new THREE.BoxGeometry(w, h, d);
      const mesh = new THREE.Mesh(geo, hvacMat);
      mesh.position.set(hx, height + h / 2, -hy);
      mesh.castShadow = true;

      // Fan circles on top
      const fanGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.1, 12);
      const fanMat = new THREE.MeshStandardMaterial({ color: 0x6b7b8a, roughness: 0.5, metalness: 0.5 });
      const fan = new THREE.Mesh(fanGeo, fanMat);
      fan.position.set(0, h / 2 + 0.05, 0);
      mesh.add(fan);
      scene.add(mesh);
    });

    // Inverter boxes
    const invMat = new THREE.MeshStandardMaterial({ color: 0x4a6080, roughness: 0.5, metalness: 0.4 });
    [[extents.minX + width * 0.4, extents.minY + depth * 0.08],
     [extents.minX + width * 0.6, extents.minY + depth * 0.92]].forEach(([ix, iy]) => {
      const geo = new THREE.BoxGeometry(0.6, 0.8, 0.25);
      const mesh = new THREE.Mesh(geo, invMat);
      mesh.position.set(ix, height + 0.4, -iy);
      scene.add(mesh);
    });
  }

  // ---- CONDUITS ----
  if (layers.conduits) {
    const conduitMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
    const conduitY = height + 0.08;
    const routes: [number, number, number, number][] = [
      [extents.minX + width * 0.15, extents.minY + depth * 0.5, extents.maxX - 1, extents.minY + depth * 0.5],
      [extents.minX + width * 0.5,  extents.minY + 1,           extents.minX + width * 0.5, extents.maxY - 1],
    ];
    routes.forEach(([x1, y1, x2, y2]) => {
      const len = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
      const geo = new THREE.CylinderGeometry(0.05, 0.05, len, 6);
      const mesh = new THREE.Mesh(geo, conduitMat);
      mesh.rotation.z = Math.PI / 2;
      mesh.rotation.y = Math.atan2(y2 - y1, x2 - x1);
      mesh.position.set((x1 + x2) / 2, conduitY, -((y1 + y2) / 2));
      scene.add(mesh);
    });
  }

  // ---- LASER SCAN ANIMATION ----
  let scanLine: THREE.Mesh | null = null;
  let scanProgress = 0;
  let scanDone = false;
  {
    const lineGeo = new THREE.PlaneGeometry(width + 4, 0.15);
    const lineMat = new THREE.MeshBasicMaterial({
      color: 0x00ffe0, transparent: true, opacity: 0.8, depthWrite: false, side: THREE.DoubleSide,
    });
    scanLine = new THREE.Mesh(lineGeo, lineMat);
    scanLine.rotation.x = -Math.PI / 2;
    scanLine.position.set((extents.minX + extents.maxX) / 2, height + 0.12, -extents.minY);
    scene.add(scanLine);
  }

  // Fit camera
  const diagLen = Math.sqrt(width * width + depth * depth);
  camera.position.set(diagLen * 0.8, diagLen * 0.9, diagLen * 0.8);
  controls.target.set(0, height / 2, 0);
  controls.update();

  let animId: number;
  let elapsed = 0;
  const SCAN_DURATION = 2.5; // seconds

  const animate = (ts: number) => {
    animId = requestAnimationFrame(animate);
    controls.update();

    // Scan line sweep
    if (!scanDone && scanLine) {
      const dt = 0.016;
      elapsed += dt;
      const t = Math.min(elapsed / SCAN_DURATION, 1);
      scanProgress = t;
      const zPos = -(extents.minY + t * depth);
      scanLine.position.z = zPos;
      (scanLine.material as THREE.MeshBasicMaterial).opacity = 0.8 * (1 - t * 0.5);
      if (t >= 1) {
        scene.remove(scanLine);
        scanLine = null;
        scanDone = true;
        onScanComplete();
      }
    }

    renderer.render(scene, camera);
  };
  animate(0);

  const onResize = () => {
    if (!canvas.parentElement) return;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  };
  window.addEventListener("resize", onResize);

  return () => {
    cancelAnimationFrame(animId);
    window.removeEventListener("resize", onResize);
    renderer.dispose();
  };
}

export default function BuildingViewer({ polygon, roofAreaM2, heightM, orientationDeg = 180, systemKw }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [layers, setLayers] = useState<LayerState>({ panels: true, shading: true, equipment: true, conduits: true });
  const [showLayers, setShowLayers] = useState(false);
  const [scanning, setScanning] = useState(true);

  const toggleLayer = (key: keyof LayerState) =>
    setLayers((l) => ({ ...l, [key]: !l[key] }));

  const onScanComplete = useCallback(() => setScanning(false), []);

  useEffect(() => {
    if (!canvasRef.current) return;
    setScanning(true);
    return buildScene(canvasRef.current, polygon, heightM || 6, orientationDeg, layers, onScanComplete);
  }, [polygon, heightM, orientationDeg, layers, onScanComplete]);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden bg-[#f0f2f5]">
      <canvas ref={canvasRef} className="w-full h-full" />

      {/* HUD overlay */}
      <div className="absolute top-3 left-3 right-3 flex items-start justify-between pointer-events-none">
        <div className="glass-card px-3 py-2 text-xs space-y-0.5 pointer-events-auto">
          <p className="label-xs">3D Solar View</p>
          {systemKw && <p className="font-semibold text-apple-dark">{systemKw} kW system</p>}
          <p className="text-gray-500">{roofAreaM2.toLocaleString()} m² roof area</p>
        </div>

        {/* Layer toggle */}
        <div className="pointer-events-auto relative">
          <button
            onClick={() => setShowLayers(!showLayers)}
            className="glass-card p-2 hover:bg-white/80 transition-colors"
          >
            <Layers className="w-4 h-4 text-gray-600" />
          </button>
          {showLayers && (
            <div className="absolute right-0 top-10 glass-card p-3 w-44 space-y-2 z-10">
              <p className="label-xs mb-2">Layers</p>
              {(Object.entries(layers) as [keyof LayerState, boolean][]).map(([key, on]) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer text-sm capitalize">
                  <input
                    type="checkbox" checked={on}
                    onChange={() => toggleLayer(key)}
                    className="rounded"
                  />
                  {on
                    ? <Eye className="w-3.5 h-3.5 text-gray-500" />
                    : <EyeOff className="w-3.5 h-3.5 text-gray-400" />}
                  {key.replace("_", " ")}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Scan status */}
      {scanning && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 glass-card px-4 py-2 text-xs font-medium text-cyan-600 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
          Scanning rooftop…
        </div>
      )}

      {/* Shading legend */}
      {!scanning && (
        <div className="absolute bottom-3 right-3 glass-card px-3 py-2 text-xs space-y-1">
          <p className="label-xs mb-1">Irradiance</p>
          {[
            { color: "bg-green-500", label: ">4h peak sun" },
            { color: "bg-cyan-500",  label: "3–4h peak sun" },
            { color: "bg-yellow-400",label: "<3h / shadow" },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-sm ${color} opacity-70`} />
              <span className="text-gray-600">{label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
