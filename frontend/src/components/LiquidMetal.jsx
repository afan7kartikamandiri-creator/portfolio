import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * "Liquid Metal" — blob organik dengan permukaan logam cair iridescent.
 * Vertex shader mendistorsi sphere memakai simplex noise (morphing),
 * fragment shader memberi efek fresnel + gradien plasma (violet→magenta→amber)
 * sehingga terlihat seperti oil-slick / liquid metal premium.
 * Bereaksi terhadap pergerakan kursor.
 */
export default function LiquidMetal() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      mount.clientWidth / mount.clientHeight,
      0.1,
      100
    );
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    const noiseGLSL = `
      vec3 mod289(vec3 x){return x - floor(x*(1.0/289.0))*289.0;}
      vec4 mod289(vec4 x){return x - floor(x*(1.0/289.0))*289.0;}
      vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
      vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314*r;}
      float snoise(vec3 v){
        const vec2 C = vec2(1.0/6.0, 1.0/3.0);
        const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
        vec3 i  = floor(v + dot(v, C.yyy));
        vec3 x0 = v - i + dot(i, C.xxx);
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min(g.xyz, l.zxy);
        vec3 i2 = max(g.xyz, l.zxy);
        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;
        i = mod289(i);
        vec4 p = permute(permute(permute(
                  i.z + vec4(0.0, i1.z, i2.z, 1.0))
                + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                + i.x + vec4(0.0, i1.x, i2.x, 1.0));
        float n_ = 0.142857142857;
        vec3 ns = n_ * D.wyz - D.xzx;
        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_);
        vec4 x = x_ * ns.x + ns.yyyy;
        vec4 y = y_ * ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);
        vec4 b0 = vec4(x.xy, y.xy);
        vec4 b1 = vec4(x.zw, y.zw);
        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
        vec3 p0 = vec3(a0.xy, h.x);
        vec3 p1 = vec3(a0.zw, h.y);
        vec3 p2 = vec3(a1.xy, h.z);
        vec3 p3 = vec3(a1.zw, h.w);
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
        p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m*m;
        return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
      }
      float fbm(vec3 p){
        float f=0.0; float a=0.5;
        for(int i=0;i<4;i++){ f += a*snoise(p); p*=2.0; a*=0.5; }
        return f;
      }
    `;

    const vertex = `
      uniform float uTime;
      uniform float uAmp;
      varying vec3 vNormal;
      varying vec3 vView;
      varying float vNoise;
      ${noiseGLSL}
      vec3 displace(vec3 p){
        vec3 nrm = normalize(p);
        float n = fbm(p*0.85 + vec3(0.0, 0.0, uTime*0.32));
        return p + nrm * n * uAmp;
      }
      void main(){
        vec3 displaced = displace(position);
        float n = fbm(position*0.85 + vec3(0.0,0.0,uTime*0.32));
        vNoise = n;
        vec3 nrm = normalize(position);
        vec3 tangent = normalize(cross(nrm, vec3(0.0,1.0,0.0)+0.0001));
        vec3 bitangent = normalize(cross(nrm, tangent));
        float eps = 0.12;
        vec3 pA = displace(position + tangent*eps);
        vec3 pB = displace(position + bitangent*eps);
        vec3 newNormal = normalize(cross(pA - displaced, pB - displaced));
        newNormal *= sign(dot(newNormal, nrm));
        vec4 mv = modelViewMatrix * vec4(displaced, 1.0);
        vView = normalize(-mv.xyz);
        vNormal = normalize(normalMatrix * newNormal);
        gl_Position = projectionMatrix * mv;
      }
    `;

    const fragment = `
      precision highp float;
      uniform float uTime;
      uniform vec3 uA;
      uniform vec3 uB;
      uniform vec3 uC;
      varying vec3 vNormal;
      varying vec3 vView;
      varying float vNoise;
      void main(){
        vec3 N = normalize(vNormal);
        vec3 V = normalize(vView);
        float fres = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 2.3);
        float t = clamp(vNoise*0.5 + 0.5 + fres*0.45 + sin(uTime*0.4)*0.05, 0.0, 1.0);
        vec3 col = mix(uA, uB, smoothstep(0.0, 0.6, t));
        col = mix(col, uC, smoothstep(0.6, 1.0, t));
        vec3 L = normalize(vec3(0.4, 0.7, 0.6));
        float diff = clamp(dot(N, L), 0.0, 1.0);
        col *= 0.32 + 0.68*diff;
        col += fres * uB * 1.25;
        vec3 H = normalize(L + V);
        float spec = pow(clamp(dot(N, H), 0.0, 1.0), 64.0);
        col += spec * 0.9;
        col = col / (col + vec3(0.6));        // tone map lembut
        col = pow(col, vec3(0.85));
        gl_FragColor = vec4(col, 1.0);
      }
    `;

    const uniforms = {
      uTime: { value: 0 },
      uAmp: { value: 0.55 },
      uA: { value: new THREE.Color("#7c3aed") }, // violet
      uB: { value: new THREE.Color("#ec4899") }, // magenta
      uC: { value: new THREE.Color("#fbbf24") }, // amber
    };

    const geometry = new THREE.IcosahedronGeometry(1.55, 20);
    const material = new THREE.ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      uniforms,
    });
    const blob = new THREE.Mesh(geometry, material);
    scene.add(blob);

    // posisikan blob ke kanan pada layar lebar agar tidak menutupi teks kiri
    const placeBlob = () => {
      const wide = mount.clientWidth > 820;
      blob.position.x = wide ? 1.4 : 0;
      blob.position.y = wide ? 0 : 0.4;
    };
    placeBlob();

    const target = { x: 0, y: 0 };
    let ampBoost = 0;
    const onMove = (e) => {
      const r = mount.getBoundingClientRect();
      target.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
      target.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
      ampBoost = 0.25;
    };
    window.addEventListener("pointermove", onMove);

    const onResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
      placeBlob();
    };
    window.addEventListener("resize", onResize);

    let raf;
    let t = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      if (!reduceMotion) t += 0.01;
      ampBoost *= 0.94;
      uniforms.uTime.value = t;
      uniforms.uAmp.value = 0.5 + ampBoost;
      blob.rotation.y += reduceMotion ? 0 : 0.0016;
      blob.rotation.x += (target.y * 0.3 - blob.rotation.x) * 0.05;
      blob.rotation.z += (target.x * 0.2 - blob.rotation.z) * 0.05;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", onResize);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} className="hero-canvas" aria-hidden="true" />;
}