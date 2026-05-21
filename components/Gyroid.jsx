'use client';

import {
  Suspense,
  useRef,
  useMemo,
  useEffect,
  useState,
  useCallback,
  memo,
  forwardRef,
  useImperativeHandle,
} from 'react';
import dynamic from 'next/dynamic';
import * as THREE from 'three';
import { useThree, useFrame } from '@react-three/fiber';
import gsap from 'gsap';

const Canvas = dynamic(
  () => import('@react-three/fiber').then((mod) => mod.Canvas),
  { ssr: false }
);

const VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  precision highp float;
  varying vec2 vUv;

  uniform float iTime;
  uniform vec2  iResolution;
  uniform vec2  iMouse;
  uniform float audio1;
  uniform float adj;
  uniform float orbOpacity;
  uniform float intensity;

  uniform float cloudDensity;
  uniform float cloudSpeed;
  uniform vec3  cloudColor;

  uniform float sphereSpeed;
  uniform float sphereScale;
  uniform vec3  sphereColor;

  // ── Precomputed uniforms (computed once in JS, not per-fragment) ─────────────
  uniform vec2  iMouseNorm;         // normalised mouse * 0.3
  uniform float sphereSinT;         // Sin01(0.048 * iTime * 0.06)
  uniform float sphereScaleComputed; // final resolved scale value
  uniform float hoverIntensity;      // 0 = cold blue, 1 = fire (lerped in JS)

  #define TAU 6.28318530718
  #define R(p, a) p = p * cos(a) + vec2(-p.y, p.x) * sin(a)

  // ── Improved hash: Dave_Hoskins "hash without sine" – WebGL1 safe ───────────
  float hash21(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  // ── Value noise – unchanged logic, benefits from better hash above ──────────
  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    // Quintic interpolation (smoother than cubic – less 'blocky' at low freq)
    f = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  // ── FBM: bake the rotation matrix as constants → no per-octave sin/cos ──────
  // rot = mat2(cos0.5, sin0.5, -sin0.5, cos0.5)
  // cos(0.5) ≈ 0.87758, sin(0.5) ≈ 0.47943
  float fbm(vec2 p) {
    const mat2 rot = mat2(0.87758, 0.47943, -0.47943, 0.87758);
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * vnoise(p);
      p  = rot * p * 2.1;
      a *= 0.5;
    }
    return v;
  }

  // ── Nebula: iMouseNorm replaces per-fragment division ───────────────────────
  vec3 nebula(vec2 uv) {
    float t  = iTime * 0.04 * cloudSpeed;

    vec2 q = vec2(
      fbm(uv + t),
      fbm(uv + vec2(1.7, 9.2) + t * 0.8)
    );
    vec2 r = vec2(
      fbm(uv + q + vec2(1.7, 9.2) + 0.15  * t),
      fbm(uv + q + vec2(8.3, 2.8) + 0.126 * t)
    );
    float f = fbm(uv + r + iMouseNorm);

    vec3 col = mix(vec3(0.0,  0.01, 0.03), vec3(0.02, 0.06, 0.14), clamp(f*f*4.0, 0.0, 1.0));
    col = mix(col, vec3(0.03, 0.10, 0.22), clamp(f*f,     0.0, 1.0));
    col = mix(col, vec3(0.06, 0.18, 0.38), clamp(f,       0.0, 1.0));
    col *= cloudColor;

    float brightness = 0.06 + cloudDensity * 0.50;
    return col * brightness;
  }

  // ── SineEggCarton: merge two trig calls into one via phase shift identity ────
  // abs(sin(x) - cos(y) + sin(z)) is kept as-is (3 trig ops needed for 3 args)
  // but we mark it mediump-friendly since the abs clamps precision needs.
  float SineEggCarton(vec3 p) {
    return abs(sin(p.x) - cos(p.y) + sin(p.z)) * 1.15 * orbOpacity;
  }

  float Map(vec3 p, float s) {
    float d = length(p) - 1.02;
    return max(d, (0.88 - SineEggCarton(s * p)) / s);
  }

  // ── Fire palette: bright warm core fading to nothing at the edge ────────────
  // 'a' is largest at center (deep inside) → we want hot core, dark outer edge.
  // So we use 'a' directly: high a = center = brightest fire.
  vec3 firePalette(float a) {
    // a=1 center: yellow-white hot core
    // a=0.5 mid:  orange
    // a=0 edge:   nothing (fades out cleanly, no red rim)
    vec3 c = vec3(0.0);
    c = mix(c, vec3(0.9,  0.3,  0.0),  clamp(a * 2.0,        0.0, 1.0)); // orange appears first
    c = mix(c, vec3(1.0,  0.75, 0.15), clamp(a * 2.0 - 1.0,  0.0, 1.0)); // yellow-white at core
    return c;
  }

  vec3 GetColor(vec3 p) {
    float a       = clamp((1.45 - length(p)) / 2.1, 0.0, 1.0);
    vec3  base    = mix(vec3(0.18, 0.42, 0.68), sphereColor, 0.55);
    // Blue — always unchanged
    vec3  coldCol = base + 0.35 * cos(TAU * (
      vec3(0.15, 0.05, 0.08) + a * audio1 * 0.48 * vec3(0.82, 0.85, 0.88)
    ));
    // Inner fire: smoothstep masks it to only the deep core (a > 0.5).
    // Outer shell (a < 0.5) gets zero fire — blue is completely untouched.
    float coreMask = smoothstep(0.06, 1.0, a);
    vec3  fireAdd  = vec3(1.0, 0.2, 0.0) * coreMask * 3.0 * hoverIntensity;
    // Pure additive: blue stays exactly as-is, warm glow added on top in core
    return (coldCol + fireAdd) * (a * orbOpacity * 1.2);
  }

  void main() {
    vec2 coord = gl_FragCoord.xy;
    vec2 uv    = coord / iResolution.xy;

    // ── Background nebula ────────────────────────────────────────────────────
    vec2 nuv = (uv - 0.5) * 3.0;
    nuv.x *= iResolution.x / iResolution.y;
    vec3 outColor = nebula(nuv);

    // ── Ray setup ────────────────────────────────────────────────────────────
    vec3 rd = normalize(vec3(2.0 * coord - iResolution.xy, -iResolution.y));
    vec3 ro  = vec3(
      -iMouse.x * 0.00025,
       iMouse.y * 0.00018,
      // Sin01 inlined and uniform-driven from JS side via iTime
      // to avoid per-fragment trig: use the precomputed uniform sphereSinT
      -1.35 * (0.82 - orbOpacity) - 0.48 + mix(2.45, 1.95, adj + sphereSinT)
    );

    float rotAngleXZ = 0.18 * iTime * sphereSpeed;
    float rotAngleYZ = 0.09 * iTime * sphereSpeed;
    R(rd.xz, rotAngleXZ);
    R(ro.xz, rotAngleXZ);
    R(rd.yz, rotAngleYZ);
    R(ro.yz, rotAngleYZ);

    // ── Scale: uses precomputed uniform to avoid per-fragment sin ────────────
    float scale = sphereScaleComputed;

    // ── Ray march with overrelaxation (step factor 0.85 → fewer iters needed)
    // and early-exit guard tightened to 12.0 (scene fits in ~4 units).        
    float t   = 0.0;
    vec3 glow = vec3(0.0); // accumulate into local, single write at end
    const float STEP_FACTOR = 0.82;
    const float MAX_DIST    = 12.0;
    const float HIT_EPS     = 0.00015;

    for (int i = 0; i < 48; i++) {
      vec3  rp = ro + t * rd;
      float d  = Map(rp, scale);
      if (t > MAX_DIST || d < HIT_EPS) break;
      t    += STEP_FACTOR * d;
      glow += 0.042 * GetColor(rp) * audio1 * 0.55 * orbOpacity;
    }

    outColor += glow;
    gl_FragColor = vec4(clamp(outColor, 0.0, 1.0), 1.0);
  }
`;

// ── Two extra uniforms we precompute on the JS side each frame ─────────────────
// sphereSinT  = Sin01(0.048 * iTime * 0.06)  → only computed once per frame in JS
// sphereScaleComputed = final scale value     → avoids sin+mix+clamp in GLSL

export const PAGE_PRESETS = {
  home: {
    orbOpacity:   1.0,
    cloudDensity: 0.55,
    cloudSpeed:   1.00,
    cloudColor:   [0.5, 0.5, 0.5],
    sphereSpeed:  0.80,
    sphereScale:  1.00,
    sphereColor:  [0.18, 0.42, 0.68],
  },
  work: {
    orbOpacity:   0.4,
    cloudDensity: 0.55,
    cloudSpeed:   1.00,
    cloudColor:   [0.5, 0.5, 0.5],
    sphereSpeed:  0.80,
    sphereScale:  1.00,
    sphereColor:  [0.18, 0.42, 0.68],
  },
  info: {
    orbOpacity:   0.4,
    cloudDensity: 0.55,
    cloudSpeed:   1.00,
    cloudColor:   [0.5, 0.5, 0.5],
    sphereSpeed:  0.80,
    sphereScale:  1.00,
    sphereColor:  [0.18, 0.42, 0.68],
  },
};

// ── Tiny JS helper mirroring GLSL mix() ─────────────────────────────────────
function mix(a, b, t) { return a + (b - a) * t; }

const throttle = (fn, limit) => {
  let last = 0;
  return (...args) => {
    const now = Date.now();
    if (now - last >= limit) { last = now; fn(...args); }
  };
};

function getPlaneScale(camera, aspect) {
  const vFovRad = (camera.fov * Math.PI) / 180;
  const visH    = 2 * Math.tan(vFovRad / 2) * camera.position.z;
  return { w: visH * aspect * 1.1, h: visH * 1.1 };
}

// ─── SHADER SCENE ─────────────────────────────────────────────────────────────
const ShaderScene = memo(
  forwardRef(({ dpr = 1 }, ref) => {
    const meshRef      = useRef();
    const mouseTarget  = useRef({ x: 0, y: 0 });
    const mouseCurrent = useRef({ x: 0, y: 0 });
    const { camera, size } = useThree();

    const uniforms = useMemo(() => {
      const h = PAGE_PRESETS.home;
      return {
        iTime:              { value: 100 },
        iResolution:        { value: new THREE.Vector2(size.width * dpr, size.height * dpr) },
        iMouse:             { value: new THREE.Vector2(0, 0) },
        iMouseNorm:         { value: new THREE.Vector2(0, 0) },   // precomputed normalised mouse
        orbOpacity:         { value: h.orbOpacity },
        intensity:          { value: 1.0 },
        audio1:             { value: 128.0 / 48.0 },
        adj:                { value: 0.2 - size.height / size.width },
        cloudDensity:       { value: h.cloudDensity },
        cloudSpeed:         { value: h.cloudSpeed },
        cloudColor:         { value: new THREE.Vector3(...h.cloudColor) },
        sphereSpeed:        { value: h.sphereSpeed },
        sphereScale:        { value: h.sphereScale },
        sphereColor:        { value: new THREE.Vector3(...h.sphereColor) },
        sphereSinT:         { value: 0.5 },                        // precomputed Sin01 value
        sphereScaleComputed:{ value: 1.0 },                        // precomputed final scale
        hoverIntensity:     { value: 0.0 },                        // 0=blue, 1=fire
      };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── GSAP tween helper ──────────────────────────────────────────────────────
    const tweenToPreset = useCallback((name) => {
      const p = PAGE_PRESETS[name];
      if (!p) { console.warn(`Gyroid: no preset "${name}"`); return; }

      const dur  = 2.0;
      const ease = 'power2.inOut';

      gsap.killTweensOf(uniforms.orbOpacity);
      gsap.killTweensOf(uniforms.cloudDensity);
      gsap.killTweensOf(uniforms.cloudSpeed);
      gsap.killTweensOf(uniforms.sphereSpeed);
      gsap.killTweensOf(uniforms.sphereScale);
      gsap.killTweensOf(uniforms.cloudColor.value);
      gsap.killTweensOf(uniforms.sphereColor.value);

      gsap.to(uniforms.orbOpacity,   { value: p.orbOpacity,   duration: dur, ease });
      gsap.to(uniforms.cloudDensity, { value: p.cloudDensity, duration: dur, ease });
      gsap.to(uniforms.cloudSpeed,   { value: p.cloudSpeed,   duration: dur, ease });
      gsap.to(uniforms.sphereSpeed,  { value: p.sphereSpeed,  duration: dur, ease });
      gsap.to(uniforms.sphereScale,  { value: p.sphereScale,  duration: dur, ease });

      gsap.to(uniforms.cloudColor.value,  { x: p.cloudColor[0],  y: p.cloudColor[1],  z: p.cloudColor[2],  duration: dur, ease });
      gsap.to(uniforms.sphereColor.value, { x: p.sphereColor[0], y: p.sphereColor[1], z: p.sphereColor[2], duration: dur, ease });
    }, [uniforms]);

    useImperativeHandle(ref, () => ({
      setPage(name) { tweenToPreset(name); },
      addPreset(name, overrides) {
        PAGE_PRESETS[name] = { ...PAGE_PRESETS.home, ...overrides };
      },
      setOrbOpacity   (v) { gsap.killTweensOf(uniforms.orbOpacity);   gsap.to(uniforms.orbOpacity,   { value: v, duration: 1.5, ease: 'power2.inOut' }); },
      setCloudDensity (v) { gsap.killTweensOf(uniforms.cloudDensity); gsap.to(uniforms.cloudDensity, { value: v, duration: 1.5, ease: 'power2.inOut' }); },
      setCloudSpeed   (v) { gsap.killTweensOf(uniforms.cloudSpeed);   gsap.to(uniforms.cloudSpeed,   { value: v, duration: 1.5, ease: 'power2.inOut' }); },
      setSphereSpeed  (v) { gsap.killTweensOf(uniforms.sphereSpeed);  gsap.to(uniforms.sphereSpeed,  { value: v, duration: 1.5, ease: 'power2.inOut' }); },
      setSphereScale  (v) { gsap.killTweensOf(uniforms.sphereScale);  gsap.to(uniforms.sphereScale,  { value: v, duration: 1.5, ease: 'power2.inOut' }); },
      setSphereColor  (r,g,b) { gsap.killTweensOf(uniforms.sphereColor.value); gsap.to(uniforms.sphereColor.value, { x: r, y: g, z: b, duration: 1.5, ease: 'power2.inOut' }); },
      setCloudColor   (r,g,b) { gsap.killTweensOf(uniforms.cloudColor.value);  gsap.to(uniforms.cloudColor.value,  { x: r, y: g, z: b, duration: 1.5, ease: 'power2.inOut' }); },
      setIntensity    (v) { uniforms.intensity.value = v; },
    }));

    useEffect(() => {
      const initial = (typeof window !== 'undefined' && window.__gyroidPreset) || 'home';
      tweenToPreset(initial);

      if (typeof window !== 'undefined') window.__gyroidReady = true;

      if (typeof window !== 'undefined') {
        window.__gyroidSetPreset = (name) => {
          window.__gyroidPreset = name;
          tweenToPreset(name);
        };
      }

      return () => {
        if (typeof window !== 'undefined') window.__gyroidSetPreset = null;
      };
    }, [tweenToPreset]);

    const handleResize = useCallback(() => {
      if (!meshRef.current) return;
      const aspect   = size.width / size.height;
      const { w, h } = getPlaneScale(camera, aspect);
      meshRef.current.scale.set(w, h, 1);
      uniforms.iResolution.value.set(size.width * dpr, size.height * dpr);
      uniforms.adj.value = 0.2 - size.height / size.width;
    }, [camera, dpr, size, uniforms]);

    const handleMouseMove = useMemo(
      () => throttle((e) => {
        mouseTarget.current.x =  e.clientX - window.innerWidth  / 2;
        mouseTarget.current.y = -(e.clientY - window.innerHeight / 2);
      }, 16),
      []
    );

    useEffect(() => {
      handleResize();
      window.addEventListener('resize',    handleResize);
      window.addEventListener('mousemove', handleMouseMove, { passive: true });
      return () => {
        window.removeEventListener('resize',    handleResize);
        window.removeEventListener('mousemove', handleMouseMove);
      };
    }, [handleResize, handleMouseMove]);

    // ── useFrame: precompute JS-side values to reduce per-fragment GLSL work ──
    useFrame(({ clock }) => {
      if (!meshRef.current) return;

      // Smooth mouse
      mouseCurrent.current.x += (mouseTarget.current.x - mouseCurrent.current.x) * 0.05;
      mouseCurrent.current.y += (mouseTarget.current.y - mouseCurrent.current.y) * 0.05;

      const t = clock.getElapsedTime();
      uniforms.iTime.value = t;
      uniforms.iMouse.value.set(mouseCurrent.current.x, mouseCurrent.current.y);

      // Precompute normalised mouse (replaces per-fragment division in nebula)
      const invW = 1.0 / (uniforms.iResolution.value.x || 1);
      const invH = 1.0 / (uniforms.iResolution.value.y || 1);
      uniforms.iMouseNorm.value.set(
        mouseCurrent.current.x * invW * 0.3,
        mouseCurrent.current.y * invH * 0.3
      );

      // Precompute Sin01(0.048 * t * 0.06) — replaces per-fragment sin
      const sinT = 0.5 + 0.5 * Math.sin(6.28318530718 * 0.048 * t * 0.06);
      uniforms.sphereSinT.value = sinT;

      // Precompute final sphere scale — replaces per-fragment sin+mix+clamp
      const rawScale = mix(0.48, 18.0 * uniforms.orbOpacity.value * uniforms.orbOpacity.value, sinT);
      const resFactor = Math.min(uniforms.iResolution.value.x, uniforms.iResolution.value.y) / 920.0;
      uniforms.sphereScaleComputed.value = Math.max(rawScale * resFactor * uniforms.sphereScale.value, 0.01);

      // Slight audio jitter
      uniforms.audio1.value = 128.0 / 48.0 + Math.random() * 0.1;

      // ── Hover detection: is mouse within sphere's screen-space radius? ────────
      // The sphere lives at roughly screen-center. We approximate its screen
      // radius as ~22% of the shorter viewport dimension (matches shader scale).
      const sw = uniforms.iResolution.value.x;
      const sh = uniforms.iResolution.value.y;
      const mx = mouseCurrent.current.x; // offset from center
      const my = mouseCurrent.current.y;
      const screenR = Math.min(sw, sh) * 0.22 * uniforms.orbOpacity.value;
      const isOver  = (mx * mx + my * my) < screenR * screenR;
      // Lerp hoverIntensity toward target (0.08 in, 0.04 out = fast in, slow cool)
      const hTarget = isOver ? 1.0 : 0.0;
      const hSpeed  = isOver ? 0.08 : 0.04;
      uniforms.hoverIntensity.value += (hTarget - uniforms.hoverIntensity.value) * hSpeed;
    });

    return (
      <mesh ref={meshRef}>
        <planeGeometry args={[1, 1]} />
        <shaderMaterial
          fragmentShader={FRAGMENT_SHADER}
          vertexShader={VERTEX_SHADER}
          uniforms={uniforms}
          depthTest={false}
          depthWrite={false}
        />
      </mesh>
    );
  })
);
ShaderScene.displayName = 'ShaderScene';

// ─── STARS ────────────────────────────────────────────────────────────────────
const Stars = memo(({
  starCount   = 50,
  starSize    = 0.3,
  starColors  = [[0.3, 0.7, 0.9], [0.3, 0.3, 0.8]],
  sprite1Path = '/assets/sprite1.png',
  sprite2Path = '/assets/sprite2.png',
}) => {
  const { scene, camera } = useThree();
  const groupRef     = useRef();
  const mouseTarget  = useRef({ x: 0, y: 0 });
  const mouseCurrent = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const loader   = new THREE.TextureLoader();
    const textures = [loader.load(sprite1Path), loader.load(sprite2Path)];
    const geometry = new THREE.BufferGeometry();
    const vertices = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      vertices[i]     = Math.random() * 60 - 30;
      vertices[i + 1] = Math.random() * 60 - 30;
      vertices[i + 2] = Math.random() * 60 - 30;
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    const group = new THREE.Group();
    starColors.forEach((color, i) => {
      const mat = new THREE.PointsMaterial({
        size: starSize, map: textures[i] ?? textures[0],
        blending: THREE.AdditiveBlending, depthTest: false,
        transparent: true, opacity: 0.35,
      });
      mat.color.setRGB(color[0], color[1], color[2]);
      const pts = new THREE.Points(geometry, mat);
      pts.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
      group.add(pts);
    });
    scene.add(group);
    groupRef.current = group;

    const handleMouse = throttle((e) => {
      mouseTarget.current.x =  (e.clientX - window.innerWidth  / 2) * 0.01;
      mouseTarget.current.y = -(e.clientY - window.innerHeight / 2) * 0.01;
    }, 16);
    window.addEventListener('mousemove', handleMouse, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouse);
      geometry.dispose();
      textures.forEach(t => t.dispose());
      group.children.forEach(p => p.material.dispose());
      scene.remove(group);
    };
  }, [scene, starCount, starSize, starColors, sprite1Path, sprite2Path]);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;

    // ── Faster lerp coefficient (0.08 vs 0.05) for snappier high-refresh feel ──
    mouseCurrent.current.x += (mouseTarget.current.x - mouseCurrent.current.x) * 0.08;
    mouseCurrent.current.y += (mouseTarget.current.y - mouseCurrent.current.y) * 0.08;

    const t = clock.getElapsedTime();
    groupRef.current.children.forEach((s, i) => {
      s.rotation.z = -0.03 * t * (i < 4 ? i + 1 : -(i + 1));
    });

    // Camera parallax — slightly increased coefficient for perceptible depth
    camera.position.x += (-mouseCurrent.current.x * 0.012 - camera.position.x) * 0.06;
    camera.position.y += ( mouseCurrent.current.y * 0.012 - camera.position.y) * 0.06;
  });

  return null;
});
Stars.displayName = 'Stars';

const CANVAS_CAMERA = { fov: 90, near: 1, far: 1000, position: [0, 0, 50] };
const CANVAS_GL = {
  antialias: false, alpha: false,
  powerPreference: 'high-performance',
  precision: 'highp', stencil: false, depth: false,
};

// ─── GYROID ───────────────────────────────────────────────────────────────────
const Gyroid = forwardRef((
  {
    className   = '',
    starCount   = 100,
    starSize    = 0.3,
    starColors  = [[0.3, 0.7, 0.9], [0.3, 0.3, 0.8]],
    sprite1Path = '/assets/sprite1.png',
    sprite2Path = '/assets/sprite2.png',
  },
  ref
) => {
  const [isClient, setIsClient] = useState(false);
  const shaderRef = useRef();

  useImperativeHandle(ref, () => ({
    setPage:         (...a) => shaderRef.current?.setPage(...a),
    addPreset:       (...a) => shaderRef.current?.addPreset(...a),
    setOrbOpacity:   (...a) => shaderRef.current?.setOrbOpacity(...a),
    setIntensity:    (...a) => shaderRef.current?.setIntensity(...a),
    setCloudDensity: (...a) => shaderRef.current?.setCloudDensity(...a),
    setCloudSpeed:   (...a) => shaderRef.current?.setCloudSpeed(...a),
    setCloudColor:   (...a) => shaderRef.current?.setCloudColor(...a),
    setSphereSpeed:  (...a) => shaderRef.current?.setSphereSpeed(...a),
    setSphereScale:  (...a) => shaderRef.current?.setSphereScale(...a),
    setSphereColor:  (...a) => shaderRef.current?.setSphereColor(...a),
  }));

  useEffect(() => { setIsClient(true); }, []);
  if (!isClient) return null;

  const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 2);

  return (
    <div className={`fixed inset-0 w-screen h-screen ${className}`} style={{ zIndex: 0 }}>
      <Suspense fallback={null}>
        <Canvas dpr={dpr} gl={CANVAS_GL} camera={CANVAS_CAMERA} style={{ position: 'absolute', inset: 0 }}>
          <ShaderScene ref={shaderRef} dpr={dpr} />
          <Stars starCount={starCount} starSize={starSize} starColors={starColors}
                 sprite1Path={sprite1Path} sprite2Path={sprite2Path} />
        </Canvas>
      </Suspense>
    </div>
  );
});
Gyroid.displayName = 'Gyroid';

export default Gyroid;