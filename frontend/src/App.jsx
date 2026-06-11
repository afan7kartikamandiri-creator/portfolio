import { useEffect, useRef, useState } from "react";
import DataConstellation from "./components/DataConstellation.jsx";
import { useReveal } from "./hooks.js";
import { FALLBACK } from "./data/fallback.js";

// Kosong saat lokal (pakai proxy Vite). Saat online, di-set ke URL backend Render
// lewat env var VITE_API_BASE di Vercel.
const API = import.meta.env.VITE_API_BASE || "";

// Endpoint Formspree untuk contact form (gratis, tanpa backend).
// Ganti XXXXXXXX dengan ID form dari dashboard Formspree-mu.
const FORMSPREE = "https://formspree.io/f/mwvjndzw";

// Confetti kecil (canvas murni, tanpa library). Meledak dari titik (x, y).
function fireConfetti(x, y) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const canvas = document.createElement("canvas");
  canvas.style.cssText =
    "position:fixed;inset:0;pointer-events:none;z-index:9999";
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  const colors = ["#8b5cf6", "#ec4899", "#fbbf24", "#a78bfa", "#f472b6"];
  const parts = Array.from({ length: 90 }, () => {
    const a = Math.random() * Math.PI * 2;
    const sp = 4 + Math.random() * 7;
    return {
      x, y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp - 4,
      size: 5 + Math.random() * 6,
      color: colors[(Math.random() * colors.length) | 0],
      rot: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 0.3,
    };
  });
  const start = performance.now();
  let raf;
  const tick = (t) => {
    const e = t - start;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    parts.forEach((p) => {
      p.vy += 0.22;
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.spin;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - e / 1800);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    });
    if (e < 1800) raf = requestAnimationFrame(tick);
    else {
      cancelAnimationFrame(raf);
      canvas.remove();
    }
  };
  raf = requestAnimationFrame(tick);
}

// Perayaan: beberapa ledakan confetti dari beberapa titik di layar.
function celebrate() {
  const w = window.innerWidth;
  const bursts = [
    [w * 0.5, window.innerHeight * 0.32],
    [w * 0.2, window.innerHeight * 0.42],
    [w * 0.8, window.innerHeight * 0.42],
  ];
  bursts.forEach(([x, y], i) => setTimeout(() => fireConfetti(x, y), i * 180));
}

export default function App() {
  const [data, setData] = useState(FALLBACK);

  // Tarik data dari backend; jika gagal, gunakan fallback.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [pRes, prRes] = await Promise.all([
          fetch(`${API}/api/profile`),
          fetch(`${API}/api/projects`),
        ]);
        if (!pRes.ok || !prRes.ok) return;
        const prof = await pRes.json();
        const proj = await prRes.json();
        if (!alive) return;
        setData({
          profile: prof.profile,
          skills: prof.skills,
          experience: prof.experience,
          projects: proj.projects,
        });
      } catch {
        /* diam — gunakan fallback */
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <>
      <Preloader />
      <CustomCursor />
      <ScrollProgress />
      <Nav />
      <Hero profile={data.profile} />
      <About profile={data.profile} />
      <Skills skills={data.skills} />
      <Projects projects={data.projects} />
      <Experience experience={data.experience} />
      <Contact profile={data.profile} />
      <Footer profile={data.profile} />
    </>
  );
}

/* ----------------------------- PRELOADER ----------------------------- */
function Preloader() {
  const [fading, setFading] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.body.classList.add("loading");
    const t1 = setTimeout(() => setFading(true), reduce ? 80 : 1900);
    const t2 = setTimeout(() => {
      setGone(true);
      document.body.classList.remove("loading");
    }, reduce ? 200 : 2500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      document.body.classList.remove("loading");
    };
  }, []);

  if (gone) return null;
  return (
    <div className={`preloader ${fading ? "out" : ""}`}>
      <div className="preloader-inner">
        <span className="preloader-name">
          Muhammad <span className="gradient-text">Ghatfhaan</span> Abdillah
        </span>
        <div className="preloader-bar">
          <span />
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- CUSTOM CURSOR ----------------------------- */
function CustomCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);

  useEffect(() => {
    if (window.matchMedia("(hover: none)").matches) return; // perangkat sentuh
    const dot = dotRef.current;
    const ring = ringRef.current;
    let mx = window.innerWidth / 2,
      my = window.innerHeight / 2,
      rx = mx,
      ry = my;

    const move = (e) => {
      mx = e.clientX;
      my = e.clientY;
      dot.style.transform = `translate(${mx}px, ${my}px)`;
    };
    const over = (e) => {
      const hot = e.target.closest(
        "a, button, .cert-thumb, .project-card, input, textarea, .chip"
      );
      ring.classList.toggle("hover", !!hot);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseover", over);

    let raf;
    const loop = () => {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      ring.style.transform = `translate(${rx}px, ${ry}px)`;
      raf = requestAnimationFrame(loop);
    };
    loop();
    document.body.classList.add("has-cursor");

    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseover", over);
      cancelAnimationFrame(raf);
      document.body.classList.remove("has-cursor");
    };
  }, []);

  return (
    <>
      <div ref={dotRef} className="cursor-dot" aria-hidden="true" />
      <div ref={ringRef} className="cursor-ring" aria-hidden="true" />
    </>
  );
}

/* ----------------------------- SCROLL PROGRESS ----------------------------- */
function ScrollProgress() {
  const [p, setP] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      setP(max > 0 ? (h.scrollTop / max) * 100 : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return <div className="scroll-progress" style={{ width: `${p}%` }} />;
}

/* ----------------------------- NAV ----------------------------- */
function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <nav className={`nav ${scrolled ? "scrolled" : ""}`}>
      <div className="container nav-inner">
        <a href="#top" className="nav-brand">
          MGA<b>.</b>
        </a>
        <div className="nav-links">
          <a href="#about">About</a>
          <a href="#work">Work</a>
          <a href="#experience">Experience</a>
          <a href="#contact" className="nav-cta">
            Contact
          </a>
        </div>
      </div>
    </nav>
  );
}

/* ----------------------------- HERO ----------------------------- */
function Hero({ profile }) {
  return (
    <header className="hero" id="top">
      <DataConstellation />
      <div className="container hero-inner">
        <span className="hero-status">
          <span className="status-dot" />
          {profile.status}
        </span>
        <h1>
          Muhammad <span className="gradient-text">Ghatfhaan</span>
          <br />
          Abdillah
        </h1>
        <p className="hero-role">{"// "}{profile.role}</p>
        <p className="hero-tagline">{profile.tagline}</p>
        <div className="hero-actions">
          <a className="btn btn-primary" href="#work">
            Lihat Proyek
          </a>
          <a
            className="btn btn-ghost"
            href={profile.links?.github}
            target="_blank"
            rel="noreferrer"
          >
            GitHub ↗
          </a>
        </div>
      </div>
      <span className="hero-hint">Gerakkan kursor · gulir ke bawah</span>
    </header>
  );
}

/* ----------------------------- ABOUT ----------------------------- */
function About({ profile }) {
  const [ref, cls] = useReveal();
  return (
    <section className="section" id="about">
      <div className="container" ref={ref}>
        <span className="eyebrow">01 — Profil</span>
        <h2 className="section-title">Tentang saya</h2>
        <div className={`about-grid ${cls}`}>
          <div>
            <p className="about-lead">
              Mahasiswa <span className="gradient-text">Information Systems</span> dengan
              fokus pada Data Science, yang gemar mengubah data mentah menjadi keputusan.
            </p>
            <p className="about-body">
              Saat ini saya menempuh semester 6 di President University, Fakultas Ilmu
              Komputer. Minat utama saya berada di persimpangan antara data dan produk:
              membangun pipeline data, bereksperimen dengan AI lokal (Ollama/LLaMA), serta
              mengubah hasil analisis menjadi antarmuka yang benar-benar dapat digunakan.
              Saya belum memiliki pengalaman magang, dan justru itulah yang sedang saya
              upayakan — kesempatan untuk menerapkan keterampilan ini pada permasalahan nyata.
            </p>
          </div>
          <aside className="about-card">
            <div className="row">
              <span className="k">Kampus</span>
              <span className="v">{profile.university}</span>
            </div>
            <div className="row">
              <span className="k">Fakultas</span>
              <span className="v">{profile.faculty}</span>
            </div>
            <div className="row">
              <span className="k">Jurusan</span>
              <span className="v">{profile.major}</span>
            </div>
            <div className="row">
              <span className="k">Semester</span>
              <span className="v">{profile.semester}</span>
            </div>
            <div className="row">
              <span className="k">Fokus</span>
              <span className="v gradient-text">Data Science</span>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

/* ----------------------------- SKILLS ----------------------------- */
function Skills({ skills }) {
  const [ref, cls] = useReveal();
  return (
    <section className="section" style={{ paddingTop: 0 }}>
      <div className="container" ref={ref}>
        <span className="eyebrow">02 — Tech Stack</span>
        <h2 className="section-title">Teknologi yang digunakan</h2>
        <div className={`skills-grid ${cls}`}>
          {skills.map((col) => (
            <div className="skill-col" key={col.group}>
              <h4>{col.group}</h4>
              {col.items.map((it) => (
                <span className="chip" key={it}>
                  {it}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ----------------------------- PROJECTS ----------------------------- */
function Projects({ projects }) {
  const [ref, cls] = useReveal();
  return (
    <section className="section" id="work">
      <div className="container" ref={ref}>
        <span className="eyebrow">03 — Selected Work</span>
        <h2 className="section-title">Proyek yang telah diselesaikan</h2>
        <div className={`projects-list ${cls}`}>
          {projects.map((p, i) => (
            <ProjectCard key={p.id} project={p} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ProjectCard({ project, index }) {
  const onMove = (e) => {
    const card = e.currentTarget;
    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    card.style.transform = `perspective(1000px) rotateY(${px * 6}deg) rotateX(${
      -py * 6
    }deg)`;
  };
  const onLeave = (e) => {
    e.currentTarget.style.transform =
      "perspective(1000px) rotateY(0deg) rotateX(0deg)";
  };

  return (
    <article className="project-card" onMouseMove={onMove} onMouseLeave={onLeave}>
      <div className="project-inner">
        <div className="project-head">
          <span className="project-index">
            {String(index + 1).padStart(2, "0")} / {project.year}
          </span>
          <span className="project-kind">{project.kind}</span>
        </div>
        <h3 className="project-title">{project.title}</h3>
        <p className="project-summary">{project.summary}</p>
        {project.highlights?.length > 0 && (
          <ul className="project-highlights">
            {project.highlights.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        )}
        <div className="project-stack">
          {project.stack.map((s) => (
            <span className="stack-tag" key={s}>
              {s}
            </span>
          ))}
        </div>
        <div className="project-links">
          {project.links?.demo ? (
            <a
              className="project-link"
              href={project.links.demo}
              target="_blank"
              rel="noreferrer"
            >
              Live Demo ↗
            </a>
          ) : (
            <span className="project-link disabled">Demo segera hadir</span>
          )}
          {project.links?.repo ? (
            <a
              className="project-link"
              href={project.links.repo}
              target="_blank"
              rel="noreferrer"
            >
              Source Code ↗
            </a>
          ) : (
            <span className="project-link disabled">Repositori privat</span>
          )}
        </div>
      </div>
    </article>
  );
}

/* ----------------------------- EXPERIENCE ----------------------------- */
// Taruh file gambar sertifikat di: frontend/public/certs/
// dengan nama persis seperti pada "src" di bawah.
const CERTS = [
  {
    src: "/certs/compsphere.png",
    title: "CompSphere Hackathon",
    issuer: "Public Relations — Volunteer · 2025",
  },
  {
    src: "/certs/second-winner.jpg",
    title: "Second Winner — Content Poster Competition",
    issuer: "3rd Social Project Exhibition · 2025",
  },
];

function Experience({ experience }) {
  const [ref, cls] = useReveal();
  const [zoom, setZoom] = useState(null);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setZoom(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <section className="section" id="experience">
      <div className="container" ref={ref}>
        <span className="eyebrow">04 — Activities</span>
        <h2 className="section-title">Pengalaman & kegiatan</h2>
        <div className={cls} style={{ marginTop: 40 }}>
          {experience.map((e) => (
            <div className="exp-item" key={e.role + e.org}>
              <span className="exp-year">{e.year}</span>
              <div>
                <div className="exp-role">{e.role}</div>
                <div className="exp-org">{e.org}</div>
                <p className="exp-summary">{e.summary}</p>
              </div>
            </div>
          ))}
        </div>

        <h3 className="cert-heading">Sertifikat</h3>
        <div className={`cert-gallery ${cls}`}>
          {CERTS.map((c) => (
            <button
              type="button"
              className="cert-thumb"
              key={c.src}
              onClick={() => setZoom(c)}
            >
              <img src={c.src} alt={c.title} loading="lazy" />
              <span className="cert-meta">
                <span className="cert-title">{c.title}</span>
                <span className="cert-issuer">{c.issuer}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {zoom && (
        <div
          className="lightbox"
          onClick={() => setZoom(null)}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className="lightbox-close"
            aria-label="Tutup"
            onClick={() => setZoom(null)}
          >
            ×
          </button>
          <img
            className="lightbox-img"
            src={zoom.src}
            alt={zoom.title}
            onClick={(e) => e.stopPropagation()}
          />
          <span className="lightbox-cap">{zoom.title}</span>
        </div>
      )}
    </section>
  );
}

/* ----------------------------- CONTACT ----------------------------- */
function Contact({ profile }) {
  const [ref, cls] = useReveal();
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState({ type: "", text: "" });
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const btnRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setShowModal(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const update = (k, v) => {
    setForm({ ...form, [k]: v });
    if (success) setSuccess(false); // reset agar bisa muncul lagi
  };

  const submit = async () => {
    if (!form.name || !form.email || !form.message) {
      setStatus({ type: "err", text: "Mohon lengkapi seluruh kolom terlebih dahulu." });
      return;
    }
    setSending(true);
    setStatus({ type: "", text: "Mengirim..." });
    try {
      const res = await fetch(FORMSPREE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setStatus({
          type: "ok",
          text: "Pesan Anda telah terkirim. Terima kasih, saya akan segera membalas.",
        });
        setForm({ name: "", email: "", message: "" });
        setSuccess(true);
        setShowModal(true);
        celebrate();
      } else {
        setStatus({ type: "err", text: "Gagal mengirim pesan. Silakan coba lagi." });
      }
    } catch {
      setStatus({
        type: "err",
        text: "Tidak dapat mengirim pesan. Periksa koneksi internet Anda.",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="section" id="contact">
      <div className="container" ref={ref}>
        <span className="eyebrow">05 — Contact</span>
        <h2 className="section-title">Mari terhubung</h2>
        <div className={`contact-grid ${cls}`}>
          <div>
            <p className="contact-lead">
              Saya sedang terbuka untuk kesempatan{" "}
              <span className="gradient-text">magang Data Science</span>. Apabila terdapat
              peluang yang sesuai, silakan hubungi saya.
            </p>
            <p className="contact-sub">
              Pesan dari formulir ini dikirim ke backend FastAPI dan disimpan — bukan
              sekadar elemen dekoratif.
            </p>
            <div className="contact-direct">
              {profile.links?.email && (
                <a href={profile.links.email}>✉ Email langsung</a>
              )}
              {profile.links?.github && (
                <a href={profile.links.github} target="_blank" rel="noreferrer">
                  ⌥ GitHub
                </a>
              )}
              {profile.links?.linkedin && (
                <a href={profile.links.linkedin} target="_blank" rel="noreferrer">
                  in LinkedIn
                </a>
              )}
            </div>
          </div>

          <div className="form">
            <div className="field">
              <label htmlFor="name">Nama</label>
              <input
                id="name"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="Nama Anda"
              />
            </div>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="anda@email.com"
              />
            </div>
            <div className="field">
              <label htmlFor="message">Pesan</label>
              <textarea
                id="message"
                value={form.message}
                onChange={(e) => update("message", e.target.value)}
                placeholder="Halo Ghatfhaan, ..."
              />
            </div>
            <button
              ref={btnRef}
              className="btn btn-primary"
              onClick={submit}
              disabled={sending}
            >
              {sending ? "Mengirim..." : "Kirim pesan"}
            </button>

            {success ? (
              <div className="form-success">
                <svg className="check" viewBox="0 0 52 52" aria-hidden="true">
                  <circle className="check-circle" cx="26" cy="26" r="24" />
                  <path className="check-mark" d="M14 27 L22 35 L38 18" />
                </svg>
                <span>{status.text}</span>
              </div>
            ) : (
              <p className={`form-status ${status.type}`}>{status.text}</p>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div
          className="success-modal"
          onClick={() => setShowModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="success-card" onClick={(e) => e.stopPropagation()}>
            <svg className="check check-lg" viewBox="0 0 52 52" aria-hidden="true">
              <circle className="check-circle" cx="26" cy="26" r="24" />
              <path className="check-mark" d="M14 27 L22 35 L38 18" />
            </svg>
            <h3 className="success-title">Pesan Terkirim!</h3>
            <p className="success-text">
              Terima kasih sudah menghubungi saya. Saya akan segera membalas
              melalui email.
            </p>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setShowModal(false)}
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

/* ----------------------------- FOOTER ----------------------------- */
function Footer({ profile }) {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <span>© {new Date().getFullYear()} Muhammad Ghatfhaan Abdillah</span>
        <span>Built with React · FastAPI · Three.js</span>
      </div>
    </footer>
  );
}