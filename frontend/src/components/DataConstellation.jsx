import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * "Data Constellation" — jaringan titik data 3D yang saling terhubung,
 * dengan pulsa cahaya yang mengalir di antara node (seperti sinyal/data
 * yang sedang diproses). Bertema Data Science & AI, reaktif terhadap kursor.
 */
export default function DataConstellation() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      mount.clientWidth / mount.clientHeight,
      0.1,
      100
    );
    camera.position.z = 17;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    // ---- plasma colormap ----
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
      return stops[i].clone().lerp(stops[Math.min(i + 1, stops.length - 1)], t - i);
    };

    // ---- nodes ----
    const NODES = 150;
    const RADIUS = 9.5;
    const nodes = [];
    for (let i = 0; i < NODES; i++) {
      // distribusi dalam bola
      const u = Math.random();
      const v = Math.random();
      const theta = u * Math.PI * 2;
      const phi = Math.acos(2 * v - 1);
      const r = RADIUS * Math.cbrt(Math.random());
      nodes.push(
        new THREE.Vector3(
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.sin(phi) * Math.sin(theta) * 0.7,
          r * Math.cos(phi)
        )
      );
    }

    // titik node (glow)
    const nodePos = new Float32Array(NODES * 3);
    const nodeCol = new Float32Array(NODES * 3);
    nodes.forEach((n, i) => {
      nodePos[i * 3] = n.x;
      nodePos[i * 3 + 1] = n.y;
      nodePos[i * 3 + 2] = n.z;
      const c = plasma(n.length() / (RADIUS * 1.1));
      nodeCol[i * 3] = c.r;
      nodeCol[i * 3 + 1] = c.g;
      nodeCol[i * 3 + 2] = c.b;
    });
    const nodeGeo = new THREE.BufferGeometry();
    nodeGeo.setAttribute("position", new THREE.BufferAttribute(nodePos, 3));
    nodeGeo.setAttribute("color", new THREE.BufferAttribute(nodeCol, 3));

    const sprite = (() => {
      const c = document.createElement("canvas");
      c.width = c.height = 64;
      const x = c.getContext("2d");
      const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, "rgba(255,255,255,1)");
      g.addColorStop(0.3, "rgba(255,255,255,0.7)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      x.fillStyle = g;
      x.fillRect(0, 0, 64, 64);
      return new THREE.CanvasTexture(c);
    })();

    const nodeMat = new THREE.PointsMaterial({
      size: 0.32,
      map: sprite,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    group.add(new THREE.Points(nodeGeo, nodeMat));

    // ---- edges (hubungkan node terdekat) ----
    const edges = [];
    const THRESH = 3.6;
    for (let i = 0; i < NODES; i++) {
      let count = 0;
      for (let j = i + 1; j < NODES && count < 3; j++) {
        if (nodes[i].distanceTo(nodes[j]) < THRESH) {
          edges.push([i, j]);
          count++;
        }
      }
    }
    const linePos = new Float32Array(edges.length * 6);
    const lineCol = new Float32Array(edges.length * 6);
    edges.forEach((e, k) => {
      const a = nodes[e[0]];
      const b = nodes[e[1]];
      linePos.set([a.x, a.y, a.z, b.x, b.y, b.z], k * 6);
      const ca = plasma(a.length() / (RADIUS * 1.1));
      const cb = plasma(b.length() / (RADIUS * 1.1));
      lineCol.set([ca.r, ca.g, ca.b, cb.r, cb.g, cb.b], k * 6);
    });
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute("position", new THREE.BufferAttribute(linePos, 3));
    lineGeo.setAttribute("color", new THREE.BufferAttribute(lineCol, 3));
    const lineMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.12,
      blending: THREE.AdditiveBlending,
    });
    group.add(new THREE.LineSegments(lineGeo, lineMat));

    // ---- pulses (sinyal yang berjalan di sepanjang edge) ----
    const PULSES = Math.min(55, edges.length);
    const pulses = [];
    for (let i = 0; i < PULSES; i++) {
      pulses.push({
        edge: (Math.random() * edges.length) | 0,
        t: Math.random(),
        speed: 0.003 + Math.random() * 0.006,
      });
    }
    const pulsePos = new Float32Array(PULSES * 3);
    const pulseGeo = new THREE.BufferGeometry();
    pulseGeo.setAttribute("position", new THREE.BufferAttribute(pulsePos, 3));
    const pulseMat = new THREE.PointsMaterial({
      size: 0.5,
      map: sprite,
      color: new THREE.Color("#fff4d6"),
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    const pulsePoints = new THREE.Points(pulseGeo, pulseMat);
    group.add(pulsePoints);

    const updatePulses = () => {
      for (let i = 0; i < PULSES; i++) {
        const p = pulses[i];
        p.t += p.speed;
        if (p.t > 1) {
          p.t = 0;
          p.edge = (Math.random() * edges.length) | 0;
        }
        const e = edges[p.edge];
        const a = nodes[e[0]];
        const b = nodes[e[1]];
        pulsePos[i * 3] = a.x + (b.x - a.x) * p.t;
        pulsePos[i * 3 + 1] = a.y + (b.y - a.y) * p.t;
        pulsePos[i * 3 + 2] = a.z + (b.z - a.z) * p.t;
      }
      pulseGeo.attributes.position.needsUpdate = true;
    };

    // ---- interaksi ----
    const target = { x: 0, y: 0 };
    const onMove = (e) => {
      const r = mount.getBoundingClientRect();
      target.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
      target.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
    };
    window.addEventListener("pointermove", onMove);

    const onResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener("resize", onResize);

    let raf;
    let t = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      t += 0.0015;
      group.rotation.y = (reduce ? 0 : t) + target.x * 0.4;
      group.rotation.x = Math.sin(t * 0.5) * 0.1 + target.y * 0.3;
      lineMat.opacity = 0.1 + Math.abs(Math.sin(t * 2)) * 0.06;
      if (!reduce) updatePulses();
      camera.position.x += (target.x * 1.5 - camera.position.x) * 0.04;
      camera.position.y += (-target.y * 1.2 - camera.position.y) * 0.04;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", onResize);
      nodeGeo.dispose();
      nodeMat.dispose();
      lineGeo.dispose();
      lineMat.dispose();
      pulseGeo.dispose();
      pulseMat.dispose();
      sprite.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} className="hero-canvas" aria-hidden="true" />;
}