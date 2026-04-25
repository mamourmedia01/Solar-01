/**
 * 3D Solar Roof Viewer
 * - Bird's-eye / drone default camera (top-down ~70° elevation)
 * - OrbitControls: rotate, zoom, pan freely
 * - Interactive panel editing: click roof to add/remove panel
 * - Layer toggles: panels, shading zones, equipment, conduits
 * - Live kW / panel count display
 * - Laser scan animation on load
 */

import { useRef, useEffect, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { GeoJSONPolygon } from "../../types";
import { Layers, Eye, EyeOff, Edit3, Lock, RotateCcw } from "lucide-react";

// ─────────────────────────────────────────────
// Geometry helpers
// ─────────────────────────────────────────────
function centroid2D(coords: number[][]): [number, number] {
  const n = coords.length;
  return [coords.reduce((s, c) => s + c[0], 0) / n, coords.reduce((s, c) => s + c[1], 0) / n];
}

function projectCoords(coords: number[][], ctr: [number, number]): [number, number][] {
  const LAT_M = 111320;
  const LNG_M = Math.cos((ctr[1] * Math.PI) / 180) * 111320;
  return coords.map(([lng, lat]) => [(lng - ctr[0]) * LNG_M, (lat - ctr[1]) * LAT_M]);
}

function pointInPolygon(px: number, py: number, poly: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]; const [xj, yj] = poly[j];
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

// ─────────────────────────────────────────────
// Panel grid generation
// ─────────────────────────────────────────────
const PANEL_W = 1.0;
const PANEL_H = 1.65;
const PANEL_GAP_X = 0.15;
const ROW_GAP = 0.3;
const PANEL_TILT = 0.18;
const MARGIN = 1.8;

interface PanelCell { col: number; row: number; cx: number; cy: number }

function buildPanelGrid(footprint: [number, number][], extents: Extents): PanelCell[] {
  const stepX = PANEL_W + PANEL_GAP_X;
  const stepY = PANEL_H + ROW_GAP;
  const cells: PanelCell[] = [];
  let col = 0;
  for (let px = extents.minX + MARGIN; px + PANEL_W < extents.maxX - MARGIN; px += stepX, col++) {
    let row = 0;
    for (let py = extents.minY + MARGIN; py + PANEL_H < extents.maxY - MARGIN; py += stepY, row++) {
      const cx = px + PANEL_W / 2;
      const cy = py + PANEL_H / 2;
      if (!footprint.length || pointInPolygon(cx, cy, footprint)) {
        cells.push({ col, row, cx, cy });
      }
    }
  }
  return cells;
}

interface Extents { minX: number; maxX: number; minY: number; maxY: number }

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface LayerState { panels: boolean; shading: boolean; equipment: boolean; conduits: boolean }
interface Props {
  polygon: GeoJSONPolygon | null;
  roofAreaM2: number;
  heightM: number;
  orientationDeg?: number;
  systemKw?: number;
}

// ─────────────────────────────────────────────
// Main viewer
// ─────────────────────────────────────────────
export default function BuildingViewer({ polygon, roofAreaM2, heightM, orientationDeg = 180, systemKw }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const roofMeshRef = useRef<THREE.Mesh | null>(null);
  const panelGroupRef = useRef<THREE.Group | null>(null);
  const allCellsRef = useRef<PanelCell[]>([]);
  const activePanelsRef = useRef<Set<string>>(new Set()); // "col,row"

  const [layers, setLayers] = useState<LayerState>({ panels: true, shading: true, equipment: true, conduits: true });
  const [showLayers, setShowLayers] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [scanning, setScanning] = useState(true);
  const [panelCount, setPanelCount] = useState(0);
  const [liveKw, setLiveKw] = useState(0);

  const KW_PER_PANEL = PANEL_W * PANEL_H * 0.22; // ~0.36 kWp per panel at 22% eff

  const rebuildPanels = useCallback(() => {
    const group = panelGroupRef.current;
    const scene = sceneRef.current;
    if (!group || !scene) return;

    while (group.children.length) group.remove(group.children[0]);

    const panelMat = new THREE.MeshStandardMaterial({ color: 0x1a2744, roughness: 0.3, metalness: 0.6 });
    const activePanels = activePanelsRef.current;

    allCellsRef.current.forEach(({ col, row, cx, cy }) => {
      const key = `${col},${row}`;
      if (!activePanels.has(key)) return;
      const geo = new THREE.BoxGeometry(PANEL_W, 0.04, PANEL_H);
      const mesh = new THREE.Mesh(geo, panelMat);
      const h = roofMeshRef.current ? (heightM || 6) : 6;
      mesh.position.set(cx, h + 0.06 + PANEL_TILT / 2, -cy);
      mesh.rotation.x = Math.atan(PANEL_TILT / PANEL_H);
      mesh.castShadow = true;
      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(geo),
        new THREE.LineBasicMaterial({ color: 0x4a6080 }),
      );
      mesh.add(edges);
      group.add(mesh);
    });

    const count = activePanels.size;
    setPanelCount(count);
    setLiveKw(parseFloat((count * KW_PER_PANEL).toFixed(1)));
  }, [heightM, KW_PER_PANEL]);

  // Click handler: toggle panel under mouse in edit mode
  const handleCanvasClick = useCallback((e: MouseEvent) => {
    if (!editMode) return;
    const canvas = canvasRef.current;
    const camera = cameraRef.current;
    const scene = sceneRef.current;
    if (!canvas || !camera || !scene) return;

    const rect = canvas.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1,
    );

    raycasterRef.current.setFromCamera(mouse, camera);

    // Test against roof plane mesh
    const roofPlane = roofMeshRef.current;
    if (!roofPlane) return;
    const hits = raycasterRef.current.intersectObject(roofPlane, false);
    if (!hits.length) return;

    const { x: hx, z: hz } = hits[0].point;
    const hy = -hz; // z in Three.js = -y in world coords

    // Find nearest panel cell
    let nearest: PanelCell | null = null;
    let minDist = Infinity;
    allCellsRef.current.forEach((cell) => {
      const d = Math.hypot(cell.cx - hx, cell.cy - hy);
      if (d < minDist) { minDist = d; nearest = cell; }
    });

    if (!nearest || minDist > Math.max(PANEL_W, PANEL_H)) return;

    const key = `${(nearest as PanelCell).col},${(nearest as PanelCell).row}`;
    if (activePanelsRef.current.has(key)) {
      activePanelsRef.current.delete(key);
    } else {
      activePanelsRef.current.add(key);
    }
    rebuildPanels();
  }, [editMode, rebuildPanels]);

  // Reset to default auto-placed panels
  const resetPanels = useCallback(() => {
    activePanelsRef.current = new Set(allCellsRef.current.map((c) => `${c.col},${c.row}`));
    rebuildPanels();
  }, [rebuildPanels]);

  // ─── Initial scene build ───
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(canvas.clientWidth || 800, canvas.clientHeight || 500);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xeef1f5);
    scene.fog = new THREE.Fog(0xeef1f5, 100, 250);
    sceneRef.current = scene;

    // Camera — bird's eye default (looking down ~65°)
    const camera = new THREE.PerspectiveCamera(40, canvas.clientWidth / canvas.clientHeight, 0.1, 600);
    cameraRef.current = camera;

    // Orbit controls
    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.maxPolarAngle = Math.PI / 1.9; // allow near-vertical
    controls.minDistance = 4;
    controls.maxDistance = 200;
    controlsRef.current = controls;

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.65));
    const sun = new THREE.DirectionalLight(0xfff8e7, 1.9);
    sun.position.set(25, 60, 15);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -80; sun.shadow.camera.right = 80;
    sun.shadow.camera.top = 80;  sun.shadow.camera.bottom = -80;
    sun.shadow.camera.far = 220;
    scene.add(sun);

    // Ground
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(300, 300),
      new THREE.MeshLambertMaterial({ color: 0xe0e4e8 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // ── Build footprint ──
    let footprint: [number, number][] = [];
    let extents: Extents = { minX: -15, maxX: 15, minY: -10, maxY: 10 };

    if (polygon?.coordinates?.[0]?.length > 2) {
      const raw = polygon.coordinates[0];
      const ctr = centroid2D(raw);
      footprint = projectCoords(raw, ctr);
      const xs = footprint.map((c) => c[0]); const ys = footprint.map((c) => c[1]);
      extents = { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
    } else {
      const side = Math.sqrt(Math.max(100, roofAreaM2)) / 2;
      const w = side * 1.6; const d = side;
      footprint = [[-w, -d], [w, -d], [w, d], [-w, d]];
      extents = { minX: -w, maxX: w, minY: -d, maxY: d };
    }

    const width = extents.maxX - extents.minX;
    const depth = extents.maxY - extents.minY;
    const h = heightM || 6;

    // ── Building extrusion ──
    const shape = new THREE.Shape();
    footprint.forEach(([x, y], i) => { i === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y); });
    shape.closePath();
    const extrudeGeo = new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: false });
    extrudeGeo.rotateX(-Math.PI / 2);

    const wallMat = new THREE.MeshStandardMaterial({ color: 0xcdd1d5, roughness: 0.9, metalness: 0 });
    const roofFaceMat = new THREE.MeshStandardMaterial({ color: 0xbec4c9, roughness: 0.85, metalness: 0 });
    const building = new THREE.Mesh(extrudeGeo, [wallMat, roofFaceMat]);
    building.castShadow = true;
    building.receiveShadow = true;
    scene.add(building);

    // Invisible roof plane for raycasting (click to place panels)
    const cx = (extents.minX + extents.maxX) / 2;
    const cz = -((extents.minY + extents.maxY) / 2);
    const roofPlaneGeo = new THREE.PlaneGeometry(width + 4, depth + 4);
    const roofPlaneMat = new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide });
    const roofPlane = new THREE.Mesh(roofPlaneGeo, roofPlaneMat);
    roofPlane.rotation.x = -Math.PI / 2;
    roofPlane.position.set(cx, h + 0.01, cz);
    scene.add(roofPlane);
    roofMeshRef.current = roofPlane;

    // ── Shading zones ──
    const shadingGroup = new THREE.Group();
    shadingGroup.name = "shading";
    const zones = [
      { color: 0x22c55e, opacity: 0.22, xF: [0, 0.6],  yF: [0.25, 1.0] },
      { color: 0x06b6d4, opacity: 0.18, xF: [0.5, 1.0], yF: [0.0, 0.65] },
      { color: 0xeab308, opacity: 0.20, xF: [0.0, 0.5], yF: [0.0, 0.3] },
    ];
    zones.forEach(({ color, opacity, xF, yF }) => {
      const zw = (xF[1] - xF[0]) * width; const zd = (yF[1] - yF[0]) * depth;
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(zw, zd),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false }),
      );
      m.rotation.x = -Math.PI / 2;
      m.position.set(extents.minX + xF[0] * width + zw / 2, h + 0.04, -(extents.minY + yF[0] * depth + zd / 2));
      shadingGroup.add(m);
    });
    scene.add(shadingGroup);

    // ── Equipment (HVAC + inverters) ──
    const eqGroup = new THREE.Group();
    eqGroup.name = "equipment";
    const hvacMat = new THREE.MeshStandardMaterial({ color: 0x8a9ba8, roughness: 0.6, metalness: 0.3 });
    const positions: [number, number][] = [
      [extents.minX + width * 0.12, extents.minY + depth * 0.12],
      [extents.minX + width * 0.72, extents.minY + depth * 0.18],
      [extents.minX + width * 0.48, extents.minY + depth * 0.58],
      [extents.minX + width * 0.18, extents.minY + depth * 0.72],
    ];
    positions.forEach(([hx, hy]) => {
      if (footprint.length && !pointInPolygon(hx, hy, footprint)) return;
      const hw = 1.8 + Math.random(); const hd2 = 1.4; const hh = 0.9;
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(hw, hh, hd2), hvacMat);
      mesh.position.set(hx, h + hh / 2, -hy);
      mesh.castShadow = true;
      const fan = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.35, 0.1, 12),
        new THREE.MeshStandardMaterial({ color: 0x6b7b8a, metalness: 0.5 }),
      );
      fan.position.set(0, hh / 2 + 0.05, 0);
      mesh.add(fan);
      eqGroup.add(mesh);
    });
    const invMat = new THREE.MeshStandardMaterial({ color: 0x3d5570, roughness: 0.5, metalness: 0.4 });
    [[extents.minX + width * 0.38, extents.minY + depth * 0.07],
     [extents.minX + width * 0.62, extents.minY + depth * 0.93]].forEach(([ix, iy]) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.25), invMat);
      m.position.set(ix, h + 0.4, -iy);
      eqGroup.add(m);
    });
    scene.add(eqGroup);

    // ── Conduits ──
    const conduitGroup = new THREE.Group();
    conduitGroup.name = "conduits";
    const conduitMat = new THREE.MeshStandardMaterial({ color: 0xdde3ea, roughness: 0.4 });
    const routes: [number, number, number, number][] = [
      [extents.minX + width * 0.12, extents.minY + depth * 0.5, extents.maxX - 1.5, extents.minY + depth * 0.5],
      [extents.minX + width * 0.5, extents.minY + 1.2, extents.minX + width * 0.5, extents.maxY - 1.2],
    ];
    routes.forEach(([x1, y1, x2, y2]) => {
      const len = Math.hypot(x2 - x1, y2 - y1);
      const geo = new THREE.CylinderGeometry(0.06, 0.06, len, 6);
      const mesh = new THREE.Mesh(geo, conduitMat);
      mesh.rotation.z = Math.PI / 2;
      mesh.rotation.y = Math.atan2(y2 - y1, x2 - x1);
      mesh.position.set((x1 + x2) / 2, h + 0.09, -((y1 + y2) / 2));
      conduitGroup.add(mesh);
    });
    scene.add(conduitGroup);

    // ── Panel group ──
    const panelGroup = new THREE.Group();
    panelGroup.name = "panels";
    scene.add(panelGroup);
    panelGroupRef.current = panelGroup;

    // Generate all possible cells
    const allCells = buildPanelGrid(footprint, extents);
    allCellsRef.current = allCells;
    activePanelsRef.current = new Set(allCells.map((c) => `${c.col},${c.row}`));

    // ── Laser scan animation ──
    const scanGeo = new THREE.PlaneGeometry(width + 6, 0.2);
    const scanMat = new THREE.MeshBasicMaterial({ color: 0x00ffe0, transparent: true, opacity: 0.85, depthWrite: false, side: THREE.DoubleSide });
    const scanLine = new THREE.Mesh(scanGeo, scanMat);
    scanLine.rotation.x = -Math.PI / 2;
    scanLine.position.set(cx, h + 0.13, -(extents.minY));
    scene.add(scanLine);

    // Camera: bird's-eye (high above, looking straight down-ish)
    const diag = Math.sqrt(width * width + depth * depth);
    camera.position.set(cx, h + diag * 1.4, cz + diag * 0.25);
    controls.target.set(cx, h, cz);
    controls.update();

    // ── Animate ──
    let animId: number;
    let elapsed = 0;
    const SCAN_DUR = 2.2;
    let scanDone = false;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      controls.update();

      if (!scanDone) {
        elapsed += 0.016;
        const t = Math.min(elapsed / SCAN_DUR, 1);
        scanLine.position.z = -(extents.minY + t * depth);
        (scanLine.material as THREE.MeshBasicMaterial).opacity = 0.85 * (1 - t * 0.4);
        if (t >= 1) {
          scene.remove(scanLine);
          scanDone = true;
          setScanning(false);
          // Build panels after scan
          rebuildPanels();
        }
      }

      // Sync layer visibility
      scene.getObjectByName("shading")!.visible = layers.shading;
      scene.getObjectByName("equipment")!.visible = layers.equipment;
      scene.getObjectByName("conduits")!.visible = layers.conduits;
      panelGroup.visible = layers.panels;

      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      if (!canvas.parentElement) return;
      const w = canvas.clientWidth; const h2 = canvas.clientHeight;
      camera.aspect = w / h2;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h2);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      rendererRef.current = null;
      sceneRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [polygon, heightM, roofAreaM2]);

  // Re-render when layers toggle (scene visibility handled in animation loop)
  useEffect(() => {
    // Trigger via ref so we don't need full rebuild
  }, [layers]);

  // Attach/detach click handler
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener("click", handleCanvasClick);
    return () => canvas.removeEventListener("click", handleCanvasClick);
  }, [handleCanvasClick]);

  const toggleLayer = (key: keyof LayerState) => setLayers((l) => ({ ...l, [key]: !l[key] }));

  const displayKw = liveKw || systemKw || 0;

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden bg-[#eef1f5] select-none">
      <canvas
        ref={canvasRef}
        className={`w-full h-full ${editMode ? "cursor-crosshair" : "cursor-grab active:cursor-grabbing"}`}
        style={{ display: "block" }}
      />

      {/* Top-left HUD */}
      <div className="absolute top-3 left-3 flex flex-col gap-2 pointer-events-none">
        <div className="glass-card px-3 py-2 text-xs pointer-events-auto space-y-0.5">
          <p className="label-xs">Solar Design</p>
          {displayKw > 0 && <p className="font-bold text-apple-dark text-sm">{displayKw.toFixed(1)} kWp</p>}
          {panelCount > 0 && <p className="text-gray-500">{panelCount} panels · {roofAreaM2.toLocaleString()} m²</p>}
        </div>

        {editMode && (
          <div className="glass-card px-3 py-2 text-xs text-cyan-700 font-medium flex items-center gap-1.5 pointer-events-none">
            <Edit3 className="w-3.5 h-3.5" />
            Click roof to add / remove panels
          </div>
        )}
      </div>

      {/* Top-right controls */}
      <div className="absolute top-3 right-3 flex flex-col gap-2">
        {/* Edit toggle */}
        <button
          onClick={() => setEditMode(!editMode)}
          className={`glass-card p-2.5 transition-colors ${editMode ? "bg-cyan-500/20 ring-1 ring-cyan-400" : "hover:bg-white/80"}`}
          title={editMode ? "Lock panel layout" : "Edit panel placement"}
        >
          {editMode ? <Lock className="w-4 h-4 text-cyan-600" /> : <Edit3 className="w-4 h-4 text-gray-600" />}
        </button>

        {/* Reset panels */}
        {editMode && (
          <button onClick={resetPanels} className="glass-card p-2.5 hover:bg-white/80 transition-colors" title="Reset to auto layout">
            <RotateCcw className="w-4 h-4 text-gray-600" />
          </button>
        )}

        {/* Layer toggle */}
        <div className="relative">
          <button onClick={() => setShowLayers(!showLayers)} className="glass-card p-2.5 hover:bg-white/80 transition-colors">
            <Layers className="w-4 h-4 text-gray-600" />
          </button>
          {showLayers && (
            <div className="absolute right-0 top-11 glass-card p-3 w-44 space-y-2 z-10">
              <p className="label-xs mb-2">Layers</p>
              {(Object.entries(layers) as [keyof LayerState, boolean][]).map(([key, on]) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer text-sm capitalize select-none">
                  <input type="checkbox" checked={on} onChange={() => toggleLayer(key)} className="rounded" />
                  {on ? <Eye className="w-3.5 h-3.5 text-gray-500" /> : <EyeOff className="w-3.5 h-3.5 text-gray-300" />}
                  {key.replace("_", " ")}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Scanning overlay */}
      {scanning && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 glass-card px-4 py-2 text-xs font-medium text-cyan-600 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
          Scanning rooftop…
        </div>
      )}

      {/* Shading legend */}
      {!scanning && layers.shading && (
        <div className="absolute bottom-3 right-3 glass-card px-3 py-2 text-xs space-y-1.5">
          <p className="label-xs">Irradiance zones</p>
          {[
            { color: "bg-green-500", label: ">4h peak sun" },
            { color: "bg-cyan-500",  label: "3–4h peak sun" },
            { color: "bg-yellow-400",label: "<3h / shadow zone" },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-sm ${color} opacity-70`} />
              <span className="text-gray-600">{label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Orbit hint */}
      {!scanning && !editMode && (
        <div className="absolute bottom-3 left-3 glass-card px-3 py-1.5 text-xs text-gray-400">
          Drag to rotate · Scroll to zoom · Right-drag to pan
        </div>
      )}
    </div>
  );
}
