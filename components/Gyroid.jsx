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
void main(){
  vUv=uv;
  gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);
}`;

const FRAGMENT_SHADER = `
precision mediump float;
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
uniform vec2  iMouseNorm;
uniform float sphereSinT;
uniform float sphereScaleComputed;
uniform float hoverIntensity;

#define TAU 6.28318530718
#define R(p,a) p=p*cos(a)+vec2(-p.y,p.x)*sin(a)

highp float hash21(highp vec2 p){
  highp vec3 p3=fract(vec3(p.xyx)*0.1031);
  p3+=dot(p3,p3.yzx+33.33);
  return fract((p3.x+p3.y)*p3.z);
}

float vnoise(vec2 p){
  vec2 i=floor(p);
  vec2 f=fract(p);
  f=f*f*f*(f*(f*6.0-15.0)+10.0);
  float a=hash21(i);
  float b=hash21(i+vec2(1.0,0.0));
  float c=hash21(i+vec2(0.0,1.0));
  float d=hash21(i+vec2(1.0,1.0));
  return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);
}

float fbm(vec2 p){
  const mat2 rot=mat2(0.87758,0.47943,-0.47943,0.87758);
  float v=0.0,a=0.5;
  for(int i=0;i<4;i++){v+=a*vnoise(p);p=rot*p*2.1;a*=0.5;}
  return v;
}

vec3 nebula(vec2 uv){
  float t=iTime*0.04*cloudSpeed;
  vec2 q=vec2(fbm(uv+t),fbm(uv+vec2(1.7,9.2)+t*0.8));
  vec2 r=vec2(fbm(uv+q+vec2(1.7,9.2)+0.15*t),fbm(uv+q+vec2(8.3,2.8)+0.126*t));
  float f=fbm(uv+r+iMouseNorm);
  vec3 col=mix(vec3(0.0,0.01,0.03),vec3(0.02,0.06,0.14),clamp(f*f*4.0,0.0,1.0));
  col=mix(col,vec3(0.03,0.10,0.22),clamp(f*f,0.0,1.0));
  col=mix(col,vec3(0.06,0.18,0.38),clamp(f,0.0,1.0));
  return col*cloudColor*(0.06+cloudDensity*0.50);
}

float Map(vec3 p,float s){
  float d=length(p)-1.02;
  return max(d,(0.88-abs(sin(p.x*s)-cos(p.y*s)+sin(p.z*s))*1.15*orbOpacity)/s);
}

vec3 GetColor(vec3 p){
  float a=clamp((1.45-length(p))/2.1,0.0,1.0);
  vec3 base=mix(vec3(0.18,0.42,0.68),sphereColor,0.55);
  vec3 coldCol=base+0.35*cos(TAU*(vec3(0.15,0.05,0.08)+a*audio1*0.48*vec3(0.82,0.85,0.88)));
  vec3 fireAdd=vec3(1.0,0.2,0.0)*smoothstep(0.06,1.0,a)*3.0*hoverIntensity;
  return(coldCol+fireAdd)*(a*orbOpacity*1.2);
}

void main(){
  vec2 coord=gl_FragCoord.xy;
  vec2 uv=coord/iResolution.xy;
  vec2 nuv=(uv-0.5)*3.0;
  nuv.x*=iResolution.x/iResolution.y;
  vec3 outColor=nebula(nuv);

  vec3 rd=normalize(vec3(2.0*coord-iResolution.xy,-iResolution.y));
  vec3 ro=vec3(
    -iMouse.x*0.00025,
     iMouse.y*0.00018,
    -1.35*(0.82-orbOpacity)-0.48+mix(2.45,1.95,adj+sphereSinT)
  );

  float axz=0.18*iTime*sphereSpeed;
  float ayz=0.09*iTime*sphereSpeed;
  R(rd.xz,axz);R(ro.xz,axz);
  R(rd.yz,ayz);R(ro.yz,ayz);

  float t=0.0;
  vec3 glow=vec3(0.0);
  float glowMul=0.042*audio1*0.55*orbOpacity;

  for(int i=0;i<36;i++){
    vec3 rp=ro+t*rd;
    float d=Map(rp,sphereScaleComputed);
    if(t>12.0||d<0.0008) break;
    t+=0.88*d;
    glow+=glowMul*GetColor(rp);
  }

  gl_FragColor=vec4(clamp(outColor+glow,0.0,1.0),1.0);
}`;

export const PAGE_PRESETS = {
  home: { orbOpacity:1.0, cloudDensity:0.55, cloudSpeed:1.00, cloudColor:[0.5,0.5,0.5], sphereSpeed:0.80, sphereScale:1.00, sphereColor:[0.18,0.42,0.68] },
  work: { orbOpacity:0.4, cloudDensity:0.55, cloudSpeed:1.00, cloudColor:[0.5,0.5,0.5], sphereSpeed:0.80, sphereScale:1.00, sphereColor:[0.18,0.42,0.68] },
  info: { orbOpacity:0.4, cloudDensity:0.55, cloudSpeed:1.00, cloudColor:[0.5,0.5,0.5], sphereSpeed:0.80, sphereScale:1.00, sphereColor:[0.18,0.42,0.68] },
};

const jsmix = (a,b,t) => a+(b-a)*t;
const AUDIO_BASE = 128.0/48.0;
const TAU = Math.PI*2;

const sharedMouse = { tx:0, ty:0 };
let   mouseCount  = 0;
let   mouseLast   = 0;
function onMouseMove(e){
  const now=performance.now();
  if(now-mouseLast<32) return;
  mouseLast=now;
  sharedMouse.tx=e.clientX-window.innerWidth*0.5;
  sharedMouse.ty=-(e.clientY-window.innerHeight*0.5);
}
function regMouse(){
  if(mouseCount===0) window.addEventListener('mousemove',onMouseMove,{passive:true});
  mouseCount++;
}
function unregMouse(){
  mouseCount--;
  if(mouseCount===0) window.removeEventListener('mousemove',onMouseMove);
}

function getPlaneScale(camera,aspect){
  const h=2*Math.tan((camera.fov*Math.PI/180)*0.5)*camera.position.z;
  return { w:h*aspect*1.1, h:h*1.1 };
}

let audioJitter=0, audioAge=0;

const TWEEN_OPTS = { dur:2.0, ease:'power2.inOut' };

const ShaderScene = memo(forwardRef(({ dpr=1 },ref) => {
  const meshRef     = useRef();
  const mouseSmooth = useRef({ x:0, y:0 });
  const invRes      = useRef({ x:1, y:1 });
  const resCache    = useRef({ sw:0, sh:0, minSide:0 });
  const { camera, size } = useThree();

  const uniforms = useMemo(() => {
    const h=PAGE_PRESETS.home;
    return {
      iTime:              { value:100 },
      iResolution:        { value:new THREE.Vector2(size.width*dpr,size.height*dpr) },
      iMouse:             { value:new THREE.Vector2(0,0) },
      iMouseNorm:         { value:new THREE.Vector2(0,0) },
      orbOpacity:         { value:h.orbOpacity },
      intensity:          { value:1.0 },
      audio1:             { value:AUDIO_BASE },
      adj:                { value:0.2-size.height/size.width },
      cloudDensity:       { value:h.cloudDensity },
      cloudSpeed:         { value:h.cloudSpeed },
      cloudColor:         { value:new THREE.Vector3(...h.cloudColor) },
      sphereSpeed:        { value:h.sphereSpeed },
      sphereScale:        { value:h.sphereScale },
      sphereColor:        { value:new THREE.Vector3(...h.sphereColor) },
      sphereSinT:         { value:0.5 },
      sphereScaleComputed:{ value:1.0 },
      hoverIntensity:     { value:0.0 },
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  const tweenToPreset = useCallback((name) => {
    const p=PAGE_PRESETS[name];
    if(!p){ console.warn(`Gyroid: no preset "${name}"`); return; }
    const { dur, ease } = TWEEN_OPTS;
    const kill=gsap.killTweensOf.bind(gsap);
    kill(uniforms.orbOpacity);   kill(uniforms.cloudDensity);
    kill(uniforms.cloudSpeed);   kill(uniforms.sphereSpeed);
    kill(uniforms.sphereScale);  kill(uniforms.cloudColor.value);
    kill(uniforms.sphereColor.value);
    gsap.to(uniforms.orbOpacity,   {value:p.orbOpacity,   duration:dur,ease});
    gsap.to(uniforms.cloudDensity, {value:p.cloudDensity, duration:dur,ease});
    gsap.to(uniforms.cloudSpeed,   {value:p.cloudSpeed,   duration:dur,ease});
    gsap.to(uniforms.sphereSpeed,  {value:p.sphereSpeed,  duration:dur,ease});
    gsap.to(uniforms.sphereScale,  {value:p.sphereScale,  duration:dur,ease});
    gsap.to(uniforms.cloudColor.value,  {x:p.cloudColor[0],  y:p.cloudColor[1],  z:p.cloudColor[2],  duration:dur,ease});
    gsap.to(uniforms.sphereColor.value, {x:p.sphereColor[0], y:p.sphereColor[1], z:p.sphereColor[2], duration:dur,ease});
  },[uniforms]);

  const tweenUniform = useCallback((u,v) => {
    gsap.killTweensOf(u);
    gsap.to(u,{value:v,duration:1.5,ease:'power2.inOut'});
  },[]);

  useImperativeHandle(ref,()=>({
    setPage(name){ tweenToPreset(name); },
    addPreset(name,ov){ PAGE_PRESETS[name]={...PAGE_PRESETS.home,...ov}; },
    setOrbOpacity(v)   { tweenUniform(uniforms.orbOpacity,v); },
    setCloudDensity(v) { tweenUniform(uniforms.cloudDensity,v); },
    setCloudSpeed(v)   { tweenUniform(uniforms.cloudSpeed,v); },
    setSphereSpeed(v)  { tweenUniform(uniforms.sphereSpeed,v); },
    setSphereScale(v)  { tweenUniform(uniforms.sphereScale,v); },
    setSphereColor(r,g,b){ gsap.killTweensOf(uniforms.sphereColor.value); gsap.to(uniforms.sphereColor.value,{x:r,y:g,z:b,duration:1.5,ease:'power2.inOut'}); },
    setCloudColor(r,g,b) { gsap.killTweensOf(uniforms.cloudColor.value);  gsap.to(uniforms.cloudColor.value, {x:r,y:g,z:b,duration:1.5,ease:'power2.inOut'}); },
    setIntensity(v){ uniforms.intensity.value=v; },
  }));

  useEffect(() => {
    tweenToPreset((typeof window!=='undefined'&&window.__gyroidPreset)||'home');
    if(typeof window!=='undefined'){
      window.__gyroidReady=true;
      window.__gyroidSetPreset=(name)=>{ window.__gyroidPreset=name; tweenToPreset(name); };
    }
    regMouse();
    return ()=>{
      if(typeof window!=='undefined') window.__gyroidSetPreset=null;
      unregMouse();
    };
  },[tweenToPreset]);

  const handleResize = useCallback(() => {
    if(!meshRef.current) return;
    const aspect=size.width/size.height;
    const {w,h}=getPlaneScale(camera,aspect);
    meshRef.current.scale.set(w,h,1);
    const rw=size.width*dpr, rh=size.height*dpr;
    uniforms.iResolution.value.set(rw,rh);
    uniforms.adj.value=0.2-size.height/size.width;
    invRes.current.x=1.0/(rw||1);
    invRes.current.y=1.0/(rh||1);
    resCache.current.sw=rw;
    resCache.current.sh=rh;
    resCache.current.minSide=Math.min(rw,rh);
  },[camera,dpr,size,uniforms]);

  useEffect(() => {
    handleResize();
    window.addEventListener('resize',handleResize);
    return ()=>window.removeEventListener('resize',handleResize);
  },[handleResize]);

  useFrame(({clock}) => {
    if(!meshRef.current) return;

    const ms=mouseSmooth.current;
    ms.x+=(sharedMouse.tx-ms.x)*0.05;
    ms.y+=(sharedMouse.ty-ms.y)*0.05;

    const t=clock.getElapsedTime();
    uniforms.iTime.value=t;
    uniforms.iMouse.value.set(ms.x,ms.y);
    uniforms.iMouseNorm.value.set(ms.x*invRes.current.x*0.3, ms.y*invRes.current.y*0.3);

    const sinT=0.5+0.5*Math.sin(TAU*0.048*t*0.06);
    uniforms.sphereSinT.value=sinT;

    const op=uniforms.orbOpacity.value;
    const rawScale=jsmix(0.48,18.0*op*op,sinT);
    uniforms.sphereScaleComputed.value=Math.max(rawScale*(resCache.current.minSide/920.0)*uniforms.sphereScale.value,0.01);

    if(++audioAge>=8){ audioJitter=Math.random()*0.1; audioAge=0; }
    uniforms.audio1.value=AUDIO_BASE+audioJitter;

    const screenR=resCache.current.minSide*0.22*op;
    const isOver=(ms.x*ms.x+ms.y*ms.y)<screenR*screenR;
    uniforms.hoverIntensity.value+=(( isOver?1.0:0.0)-uniforms.hoverIntensity.value)*(isOver?0.08:0.04);
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[1,1]}/>
      <shaderMaterial
        fragmentShader={FRAGMENT_SHADER}
        vertexShader={VERTEX_SHADER}
        uniforms={uniforms}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
}));
ShaderScene.displayName='ShaderScene';

const Stars = memo(({
  starCount=50,
  starSize=0.3,
  starColors=[[0.3,0.7,0.9],[0.3,0.3,0.8]],
  sprite1Path='/assets/sprite1.png',
  sprite2Path='/assets/sprite2.png',
}) => {
  const { scene, camera } = useThree();
  const groupRef    = useRef();
  const mouseSmooth = useRef({ x:0, y:0 });
  const camPos      = useRef({ x:0, y:0 });

  useEffect(() => {
    const loader=new THREE.TextureLoader();
    const textures=[loader.load(sprite1Path),loader.load(sprite2Path)];
    const geometry=new THREE.BufferGeometry();
    const verts=new Float32Array(starCount*3);
    for(let i=0;i<starCount*3;i+=3){
      verts[i]  =Math.random()*60-30;
      verts[i+1]=Math.random()*60-30;
      verts[i+2]=Math.random()*60-30;
    }
    geometry.setAttribute('position',new THREE.BufferAttribute(verts,3));
    const group=new THREE.Group();
    starColors.forEach((color,i) => {
      const mat=new THREE.PointsMaterial({
        size:starSize, map:textures[i]??textures[0],
        blending:THREE.AdditiveBlending, depthTest:false,
        transparent:true, opacity:0.35,
      });
      mat.color.setRGB(color[0],color[1],color[2]);
      const pts=new THREE.Points(geometry,mat);
      pts.rotation.set(Math.random()*6,Math.random()*6,Math.random()*6);
      group.add(pts);
    });
    scene.add(group);
    groupRef.current=group;
    regMouse();
    return ()=>{
      unregMouse();
      geometry.dispose();
      textures.forEach(t=>t.dispose());
      group.children.forEach(p=>p.material.dispose());
      scene.remove(group);
    };
  },[scene,starCount,starSize,starColors,sprite1Path,sprite2Path]);

  useFrame(({clock}) => {
    if(!groupRef.current) return;
    const ms=mouseSmooth.current;
    ms.x+=(sharedMouse.tx*0.01-ms.x)*0.08;
    ms.y+=(sharedMouse.ty*0.01-ms.y)*0.08;

    const t=clock.getElapsedTime();
    const ch=groupRef.current.children;
    for(let i=0,l=ch.length;i<l;i++){
      ch[i].rotation.z=-0.03*t*(i<4?i+1:-(i+1));
    }

    const tx=-ms.x*0.012;
    const ty= ms.y*0.012;
    const dx=(tx-camera.position.x)*0.06;
    const dy=(ty-camera.position.y)*0.06;
    if(Math.abs(dx)>0.0001||Math.abs(dy)>0.0001){
      camera.position.x+=dx;
      camera.position.y+=dy;
    }
  });

  return null;
});
Stars.displayName='Stars';

const CANVAS_CAMERA={ fov:90, near:1, far:1000, position:[0,0,50] };
const CANVAS_GL={
  antialias:false, alpha:false,
  powerPreference:'high-performance',
  precision:'mediump',
  stencil:false, depth:false,
};

const DPR = typeof window!=='undefined' ? Math.min(window.devicePixelRatio,2) : 1;

const Gyroid = forwardRef(({
  className='',
  starCount=100,
  starSize=0.3,
  starColors=[[0.3,0.7,0.9],[0.3,0.3,0.8]],
  sprite1Path='/assets/sprite1.png',
  sprite2Path='/assets/sprite2.png',
},ref) => {
  const [isClient,setIsClient]=useState(false);
  const shaderRef=useRef();

  useImperativeHandle(ref,()=>({
    setPage:         (...a)=>shaderRef.current?.setPage(...a),
    addPreset:       (...a)=>shaderRef.current?.addPreset(...a),
    setOrbOpacity:   (...a)=>shaderRef.current?.setOrbOpacity(...a),
    setIntensity:    (...a)=>shaderRef.current?.setIntensity(...a),
    setCloudDensity: (...a)=>shaderRef.current?.setCloudDensity(...a),
    setCloudSpeed:   (...a)=>shaderRef.current?.setCloudSpeed(...a),
    setCloudColor:   (...a)=>shaderRef.current?.setCloudColor(...a),
    setSphereSpeed:  (...a)=>shaderRef.current?.setSphereSpeed(...a),
    setSphereScale:  (...a)=>shaderRef.current?.setSphereScale(...a),
    setSphereColor:  (...a)=>shaderRef.current?.setSphereColor(...a),
  }));

  useEffect(()=>{ setIsClient(true); },[]);
  if(!isClient) return null;

  return (
    <div className={`fixed inset-0 w-screen h-screen ${className}`} style={{zIndex:0}}>
      <Suspense fallback={null}>
        <Canvas dpr={DPR} gl={CANVAS_GL} camera={CANVAS_CAMERA} style={{position:'absolute',inset:0}}>
          <ShaderScene ref={shaderRef} dpr={DPR}/>
          <Stars starCount={starCount} starSize={starSize} starColors={starColors}
                 sprite1Path={sprite1Path} sprite2Path={sprite2Path}/>
        </Canvas>
      </Suspense>
    </div>
  );
});
Gyroid.displayName='Gyroid';

export default Gyroid;