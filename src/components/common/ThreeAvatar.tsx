import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { GLTF } from "three-stdlib";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { VisemeFrame } from "@/types/viseme";

type ThreeAvatarProps = {
  gender: "male" | "female";
  modelUrl?: string;
  playheadMs?: number;
  visemes?: VisemeFrame[];
  idle?: boolean;
  height?: number;
  /** Optional manual camera; usually unnecessary with autoFrameFace */
  cameraPos?: [number, number, number];
  orbitTarget?: [number, number, number];
  modelGroupPosition?: [number, number, number];
  /** Auto-aim at the head and zoom so the face fills the frame */
  autoFrameFace?: boolean;
  /** If you know your head mesh name, set this to lock the visemes onto it */
  morphMeshName?: string;
};

/* ------------------ helpers ------------------ */

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function clamp01(x: number) { return Math.max(0, Math.min(1, x)); }

function sampleViseme(visemes: VisemeFrame[] | undefined, playheadMs: number) {
  if (!visemes || visemes.length === 0) return { mouth: 0, smile: 0, label: undefined as string | undefined };
  if (playheadMs <= visemes[0].t) {
    const v = visemes[0]; return { mouth: v.mouth ?? 0, smile: v.smile ?? 0, label: v.label };
  }
  const last = visemes[visemes.length - 1];
  if (playheadMs >= last.t) return { mouth: last.mouth ?? 0, smile: last.smile ?? 0, label: last.label };
  for (let i = 0; i < visemes.length - 1; i++) {
    const a = visemes[i], b = visemes[i + 1];
    if (playheadMs >= a.t && playheadMs <= b.t) {
      const span = b.t - a.t || 1;
      const tt = (playheadMs - a.t) / span;
      return {
        mouth: lerp(a.mouth ?? 0, b.mouth ?? 0, tt),
        smile: lerp(a.smile ?? 0, b.smile ?? 0, tt),
        label: tt < 0.5 ? a.label : b.label,
      };
    }
  }
  return { mouth: 0, smile: 0, label: undefined };
}

function allMorphMeshes(root: THREE.Object3D): THREE.Mesh[] {
  const arr: THREE.Mesh[] = [];
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    const ok = mesh.morphTargetInfluences && mesh.morphTargetDictionary && Array.isArray(mesh.morphTargetInfluences);
    if (ok) arr.push(mesh);
  });
  return arr;
}

function scoreMeshForFace(mesh: THREE.Mesh) {
  const name = (mesh.name || "").toLowerCase();
  let score = 0;
  if (name.includes("head") || name.includes("face") || name.includes("mouth") || name.includes("jaw")) score += 2;
  const dict = mesh.morphTargetDictionary ?? {};
  const keys = Object.keys(dict).map((k) => k.toLowerCase());
  const hits = ["viseme", "mouth", "jaw", "aa", "mbp", "s", "t", "k", "iy", "uw"]
    .reduce((acc, token) => acc + (keys.some((k) => k.includes(token)) ? 1 : 0), 0);
  score += hits;
  return score;
}

function pickBestMorphMesh(root: THREE.Object3D, preferredName?: string): THREE.Mesh | null {
  const meshes = allMorphMeshes(root);
  if (meshes.length === 0) return null;
  if (preferredName) {
    const byName = meshes.find(
      (m) => m.name === preferredName || m.name.toLowerCase().includes(preferredName.toLowerCase())
    );
    if (byName) return byName;
  }
  return meshes.slice().sort((a, b) => scoreMeshForFace(b) - scoreMeshForFace(a))[0];
}

function buildVisemeIndexMap(mesh: THREE.Mesh) {
  const dict = mesh.morphTargetDictionary ?? {};
  const out: Record<string, number> = {};
  const keys = Object.keys(dict);
  const add = (name: string, aliases: string[]) => {
    for (const k of keys) {
      const kk = k.toLowerCase();
      for (const a of aliases) {
        if (kk === a || kk.endsWith(`.${a}`) || kk.includes(a)) { out[name] = dict[k] as number; return; }
      }
    }
  };
  add("AA", ["viseme_aa","aa","v_aa","mouthopen","jawopen"]);
  add("AE", ["viseme_ae","ae"]);
  add("AH", ["viseme_ah","ah"]);
  add("AO", ["viseme_ao","ao"]);
  add("EH", ["viseme_eh","eh","ey","e"]);
  add("ER", ["viseme_er","er"]);
  add("IY", ["viseme_iy","iy","ee"]);
  add("UW", ["viseme_uw","uw","oo"]);
  add("OH", ["viseme_oh","oh","ou"]);
  add("FV", ["viseme_fv","fv"]);
  add("L", ["viseme_l","l"]);
  add("MBP", ["viseme_mbp","mbp","m","b","p","shut"]);
  add("TH", ["viseme_th","th"]);
  add("CH", ["viseme_ch","ch","jh","sh"]);
  add("R", ["viseme_r","r"]);
  add("S", ["viseme_s","s","z"]);
  add("T", ["viseme_t","t","d"]);
  add("K", ["viseme_k","k","g"]);
  add("BLINK", ["eyeblink","blink","blink_l","blink_r","eye_blink","eyesblinking"]);

  if (out["AA"] == null) {
    for (const k of keys) {
      const kk = k.toLowerCase();
      if (kk.includes("jaw") || kk.includes("open") || kk.includes("mouth")) { out["AA"] = dict[k] as number; break; }
    }
  }
  return out;
}

/* ------------------ fallback stylized head (only if no GLB) ------------------ */

function FallbackHead(props: { gender: "male" | "female"; playheadMs?: number; visemes?: VisemeFrame[]; idle?: boolean; }) {
  const { gender, playheadMs = 0, visemes, idle = true } = props;
  const group = useRef<THREE.Group>(null);
  const eyesL = useRef<THREE.Group>(null);
  const eyesR = useRef<THREE.Group>(null);
  const mouthRef = useRef<THREE.Mesh>(null);
  const skinColor = useMemo(() => new THREE.Color(gender === "male" ? "#f0c8a8" : "#f4d6bf"), [gender]);
  const headGeo = useMemo(() => new THREE.SphereGeometry(1, 48, 48), []);
  const hairGeo = useMemo(() => new THREE.SphereGeometry(1.05, 48, 48), []);
  const eyeWhiteGeo = useMemo(() => new THREE.SphereGeometry(0.12, 24, 24), []);
  const pupilGeo = useMemo(() => new THREE.SphereGeometry(0.05, 16, 16), []);
  const mouthGeo = useMemo(() => new THREE.TorusGeometry(0.18, 0.06, 24, 48), []);
  const skinMat = useMemo(() => new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.6 }), [skinColor]);
  const hairMat = useMemo(() => new THREE.MeshStandardMaterial({ color: new THREE.Color("#2b2b2b"), roughness: 0.8, metalness: 0.1 }), []);
  const whiteMat = useMemo(() => new THREE.MeshStandardMaterial({ color: new THREE.Color("#ffffff"), roughness: 0.4 }), []);
  const blackMat = useMemo(() => new THREE.MeshStandardMaterial({ color: new THREE.Color("#111111"), roughness: 0.6 }), []);
  const mouthMat = useMemo(() => new THREE.MeshStandardMaterial({ color: new THREE.Color("#b03030"), roughness: 0.7 }), []);
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (group.current && idle) {
      group.current.rotation.y = 0.06 * Math.sin(t * 0.7);
      group.current.rotation.x = 0.03 * Math.sin(t * 0.9);
      group.current.position.y = 0.02 * Math.sin(t * 1.2);
    }
    const eyeNudge = idle ? 0.05 * Math.sin(t * 0.8) : 0;
    if (eyesL.current) eyesL.current.rotation.y = eyeNudge;
    if (eyesR.current) eyesR.current.rotation.y = eyeNudge;
    const { mouth } = sampleViseme(visemes, playheadMs ?? 0);
    if (mouthRef.current) {
      const w = clamp01(mouth);
      mouthRef.current.scale.set(1, 0.85 + w * 0.6, 1);
      mouthRef.current.position.y = -0.2 - w * 0.05;
    }
  });
  return (
    <group ref={group} position={[0, 1.6, 0]}>
      <mesh geometry={headGeo} material={skinMat} />
      <mesh geometry={hairGeo} material={hairMat} />
      <group position={[0, 0.15, 0.96]}>
        <group ref={eyesL} position={[-0.35, 0, 0]}>
          <mesh geometry={eyeWhiteGeo} material={whiteMat} />
          <mesh geometry={pupilGeo} material={blackMat} position={[0, 0, 0.08]} />
        </group>
        <group ref={eyesR} position={[0.35, 0, 0]}>
          <mesh geometry={eyeWhiteGeo} material={whiteMat} />
          <mesh geometry={pupilGeo} material={blackMat} position={[0, 0, 0.08]} />
        </group>
      </group>
      <mesh position={[0, -0.05, 1]}>
        <coneGeometry args={[0.08, 0.18, 20]} />
        <meshStandardMaterial color="#e8b9a0" roughness={0.7} />
      </mesh>
      <mesh ref={mouthRef} geometry={mouthGeo} material={mouthMat} rotation={[Math.PI / 2, 0, 0]} position={[0, -0.35, 0.92]} />
    </group>
  );
}

/* ------------------ GLTF head/body + auto face framing ------------------ */

function GLTFHead({
  modelUrl,
  playheadMs = 0,
  visemes,
  idle = true,
  controlsRef,
  enableAutoFrame,
  morphMeshName,
}: {
  modelUrl: string;
  playheadMs?: number;
  visemes?: VisemeFrame[];
  idle?: boolean;
  controlsRef: React.RefObject<OrbitControlsImpl>;
  enableAutoFrame: boolean;
  morphMeshName?: string;
}) {
  const gltf = useGLTF(modelUrl) as unknown as GLTF;
  const root = gltf.scene as THREE.Group;
  const morphMesh = useMemo(() => (root ? pickBestMorphMesh(root, morphMeshName) : null), [root, morphMeshName]);
  const dict = morphMesh?.morphTargetDictionary ?? null;
  const influ = morphMesh?.morphTargetInfluences ?? null;
  const indexMap = useMemo(() => (morphMesh ? buildVisemeIndexMap(morphMesh) : {}), [morphMesh]);

  // auto-framing
  const { camera } = useThree();
  const framedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!enableAutoFrame || !root || framedRef.current) return;

    const bbox = new THREE.Box3().setFromObject(root);
    const size = new THREE.Vector3(); bbox.getSize(size);
    const center = new THREE.Vector3(); bbox.getCenter(center);

    // Head/eyes near the top of the bbox (top 12%)
    const headY = bbox.max.y - size.y * 0.12;
    const target = new THREE.Vector3(center.x, headY, center.z);

    // Distance so face fills the view (for ~35° fov)
    const dist = Math.max(0.42, size.y * 0.46);

    camera.position.set(target.x, target.y, target.z + dist);
    camera.lookAt(target);

    if (controlsRef.current) {
      controlsRef.current.target.copy(target);
      controlsRef.current.update();
    }
    framedRef.current = true;
  }, [enableAutoFrame, root, camera, controlsRef]);

  // Blink timer
  const blinkTimer = useRef(0);
  const nextBlinkAt = useRef(Math.random() * 3 + 2);
  const blinkPhase = useRef(0);
  const blinking = useRef(false);

  useFrame((state, delta) => {
    if (!morphMesh || !dict || !influ) return;

    if (idle) {
      const t = state.clock.getElapsedTime();
      morphMesh.parent?.rotation.set(0.012 * Math.sin(t * 0.9), 0.025 * Math.sin(t * 0.7), 0);
      morphMesh.parent?.position.set(0, 0.005 * Math.sin(t * 1.0), 0);
    }

    for (let i = 0; i < influ.length; i++) influ[i] = 0;

    const { mouth, label } = sampleViseme(visemes, playheadMs ?? 0);
    const weight = clamp01(mouth);
    if (label && indexMap[label] != null) {
      influ[indexMap[label]!] = weight;
    } else {
      const tryOrder = ["AA","AH","AO","IY","UW","OH","AE","EH","ER","MBP","L","TH","CH","R","S","T","K"];
      for (const key of tryOrder) {
        const idx = indexMap[key];
        if (idx != null) { influ[idx] = weight; break; }
      }
    }

    if (idle || weight < 0.2) {
      blinkTimer.current += delta;
      if (!blinking.current && blinkTimer.current >= nextBlinkAt.current) {
        blinking.current = true; blinkTimer.current = 0;
        nextBlinkAt.current = Math.random() * 4 + 2; blinkPhase.current = 0;
      }
      if (blinking.current) {
        blinkPhase.current += delta * 12;
        const p = blinkPhase.current;
        const v = p <= 0.5 ? p * 2 : 1 - (p - 0.5) * 2;
        const bIdx = indexMap["BLINK"];
        if (bIdx != null) influ[bIdx] = Math.max(influ[bIdx] ?? 0, clamp01(v));
        if (blinkPhase.current >= 1) { blinking.current = false; blinkPhase.current = 0; }
      }
    }
  });

  return <primitive object={root} />;
}

/* ------------------ public component ------------------ */

export default function ThreeAvatar({
  gender,
  modelUrl,
  playheadMs = 0,
  visemes,
  idle = true,
  height = 620,
  cameraPos = [0, 1.6, 1.1],
  orbitTarget = [0, 1.6, 0],
  modelGroupPosition = [0, 0, 0],
  autoFrameFace = true,
  morphMeshName,
}: ThreeAvatarProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null!);

  return (
    <div className="w-full rounded-2xl border border-neutral-800 bg-neutral-950" style={{ height }}>
      <Canvas camera={{ position: cameraPos, fov: 35 }}>
        <ambientLight intensity={0.55} />
        <directionalLight position={[3, 4, 2]} intensity={1.0} />
        <directionalLight position={[-3, -2, 2]} intensity={0.35} />

        <group position={modelGroupPosition}>
          {modelUrl ? (
            <GLTFHead
              modelUrl={modelUrl}
              playheadMs={playheadMs}
              visemes={visemes}
              idle={idle}
              controlsRef={controlsRef}
              enableAutoFrame={autoFrameFace}
              morphMeshName={morphMeshName}
            />
          ) : (
            <FallbackHead gender={gender} playheadMs={playheadMs} visemes={visemes} idle={idle} />
          )}
        </group>

        <OrbitControls
          ref={controlsRef}
          enablePan={false}
          minDistance={0.5}
          maxDistance={3}
          target={new THREE.Vector3(...orbitTarget)}
        />
      </Canvas>
    </div>
  );
}

useGLTF.preload?.("/models/male.glb");
useGLTF.preload?.("/models/female.glb");
