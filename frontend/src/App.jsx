import { useEffect, useState } from "react";
import LiquidMetal from "./components/LiquidMetal.jsx";
import { useReveal } from "./hooks.js";
import { FALLBACK } from "./data/fallback.js";

export default function App() {
  const [data, setData] = useState(FALLBACK);

  // Tarik data dari backend; jika gagal, gunakan fallback.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [pRes, prRes] = await Promise.all([
          fetch("/api/profile"),
          fetch("/api/projects"),
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
      <LiquidMetal />
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
    issuer: "2rd Social Project Exhibition · 2025",
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

  const submit = async () => {
    if (!form.name || !form.email || !form.message) {
      setStatus({ type: "err", text: "Mohon lengkapi seluruh kolom terlebih dahulu." });
      return;
    }
    setSending(true);
    setStatus({ type: "", text: "Mengirim..." });
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (res.ok) {
        setStatus({ type: "ok", text: json.message || "Pesan berhasil terkirim." });
        setForm({ name: "", email: "", message: "" });
      } else {
        setStatus({ type: "err", text: json.detail || "Gagal mengirim pesan." });
      }
    } catch {
      setStatus({
        type: "err",
        text: "Tidak dapat terhubung ke server. Pastikan backend sedang berjalan.",
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
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nama Anda"
              />
            </div>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="anda@email.com"
              />
            </div>
            <div className="field">
              <label htmlFor="message">Pesan</label>
              <textarea
                id="message"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Halo Ghatfhaan, ..."
              />
            </div>
            <button className="btn btn-primary" onClick={submit} disabled={sending}>
              {sending ? "Mengirim..." : "Kirim pesan"}
            </button>
            <p className={`form-status ${status.type}`}>{status.text}</p>
          </div>
        </div>
      </div>
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