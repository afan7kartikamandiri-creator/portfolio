import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * "Latent Space" — point cloud 3D yang berklaster seperti hasil embedding/UMAP.
 * Warna tiap titik dipetakan sepanjang plasma colormap (violet -> magenta -> amber)
 * berdasarkan jaraknya dari pusat. Cloud berputar pelan + parallax mengikuti mouse.
 */
export default function ParticleField() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      62,
      mount.clientWidth / mount.clientHeight,
      0.1,
      100
    );
    camera.position.z = 14;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    // ---- plasma colormap (stops dari matplotlib 'plasma', disederhanakan) ----
    const stops = [
      new THREE.Color("#5b2a86"),
      new THREE.Color("#8b5cf6"),
      new THREE.Color("#ec4899"),
      new THREE.Color("#fb7185"),
      new THREE.Color("#fbbf24"),
    ];
    const plasma = (t) => {
      t = Math.min(Math.max(t, 0), 1) * (stops.length - 1);
      const i = Math.floor(t);
      const f = t - i;
      const a = stops[i];
      const b = stops[Math.min(i + 1, stops.length - 1)];
      return a.clone().lerp(b, f);
    };

    // ---- bangun beberapa klaster gaussian (seolah cluster data) ----
    const CLUSTERS = 6;
    const PER_CLUSTER = 620;
    const COUNT = CLUSTERS * PER_CLUSTER;
    const positions = new Float32Array(COUNT * 3);
    const colors = new Float32Array(COUNT * 3);

    const gaussian = () => {
      // Box-Muller
      let u = 0, v = 0;
      while (u === 0) u = Math.random();
      while (v === 0) v = Math.random();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    };

    let p = 0;
    for (let c = 0; c < CLUSTERS; c++) {
      const ca = (c / CLUSTERS) * Math.PI * 2;
      const cx = Math.cos(ca) * 6.2;
      const cy = (Math.random() - 0.5) * 5;
      const cz = Math.sin(ca) * 6.2;
      for (let i = 0; i < PER_CLUSTER; i++) {
        const x = cx + gaussian() * 1.7;
        const y = cy + gaussian() * 1.7;
        const z = cz + gaussian() * 1.7;
        positions[p * 3] = x;
        positions[p * 3 + 1] = y;
        positions[p * 3 + 2] = z;

        const dist = Math.sqrt(x * x + y * y + z * z);
        const col = plasma(dist / 11);
        colors[p * 3] = col.r;
        colors[p * 3 + 1] = col.g;
        colors[p * 3 + 2] = col.b;
        p++;
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    // texture titik bundar lembut (glow)
    const sprite = (() => {
      const cnv = document.createElement("canvas");
      cnv.width = cnv.height = 64;
      const ctx = cnv.getContext("2d");
      const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, "rgba(255,255,255,1)");
      g.addColorStop(0.25, "rgba(255,255,255,0.85)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 64, 64);
      const tex = new THREE.CanvasTexture(cnv);
      return tex;
    })();

    const mat = new THREE.PointsMaterial({
      size: 0.13,
      map: sprite,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });

    const points = new THREE.Points(geo, mat);
    scene.add(points);

    // garis-garis tipis penghubung antar titik dekat pusat (kesan graph/neural)
    const lineGeo = new THREE.BufferGeometry();
    const linePos = [];
    for (let i = 0; i < 60; i++) {
      const a = Math.floor(Math.random() * COUNT);
      const b = Math.floor(Math.random() * COUNT);
      linePos.push(
        positions[a * 3], positions[a * 3 + 1], positions[a * 3 + 2],
        positions[b * 3], positions[b * 3 + 1], positions[b * 3 + 2]
      );
    }
    lineGeo.setAttribute("position", new THREE.Float32BufferAttribute(linePos, 3));
    const lineMat = new THREE.LineBasicMaterial({
      color: new THREE.Color("#8b5cf6"),
      transparent: true,
      opacity: 0.06,
    });
    const lines = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(lines);

    // ---- interaksi mouse (parallax) ----
    const target = { x: 0, y: 0 };
    const onMove = (e) => {
      const r = mount.getBoundingClientRect();
      target.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
      target.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
    };
    window.addEventListener("pointermove", onMove);

    // ---- resize ----
    const onResize = () => {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener("resize", onResize);

    // ---- loop ----
    let raf;
    let t = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      t += 0.0016;
      const rotY = reduceMotion ? 0 : t;
      points.rotation.y = rotY + target.x * 0.35;
      points.rotation.x = Math.sin(t * 0.6) * 0.12 + target.y * 0.25;
      lines.rotation.copy(points.rotation);
      camera.position.x += (target.x * 1.2 - camera.position.x) * 0.04;
      camera.position.y += (-target.y * 1.0 - camera.position.y) * 0.04;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    };
    animate();

    // ---- cleanup ----
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", onResize);
      geo.dispose();
      mat.dispose();
      sprite.dispose();
      lineGeo.dispose();
      lineMat.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} className="hero-canvas" aria-hidden="true" />;
}
