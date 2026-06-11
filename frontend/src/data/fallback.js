// Fallback statis — digunakan apabila backend FastAPI belum dinyalakan,
// agar halaman tetap tampil utuh. Saat backend aktif, data ditarik dari /api.

export const FALLBACK = {
  profile: {
    name: "Muhammad Ghatfhaan Abdillah",
    role: "Information Systems Student · Data Science",
    tagline:
      "Membangun produk berbasis data dan AI lokal — dari dashboard analitik hingga situs bisnis yang telah live.",
    university: "President University",
    faculty: "Fakultas Ilmu Komputer",
    major: "Information Systems",
    semester: 6,
    status: "Terbuka untuk kesempatan magang Data Science",
    links: {
      github: "https://github.com/afan7kartikamandiri-creator",
      email: "mailto:ghatfhaanabdillah@gmail.com",
      linkedin: "",
    },
  },
  skills: [
    { group: "Languages", items: ["Python", "JavaScript", "SQL", "HTML/CSS"] },
    { group: "Frameworks", items: ["FastAPI", "React"] },
    { group: "Data & AI", items: ["PostgreSQL", "Ollama / LLaMA"] },
    { group: "Tools", items: ["Git", "VS Code", "Vercel"] },
  ],
  experience: [
    {
      role: "Public Relations (Volunteer)",
      org: "CompSphere Hackathon",
      year: "2025",
      summary: "Mengelola komunikasi dan publikasi acara hackathon kampus.",
    },
  ],
  projects: [
    {
      id: "gen-ai",
      title: "GEN AI",
      kind: "Proyek Akademik Utama",
      year: "2025",
      summary:
        "Dashboard analitik data berbasis web dengan integrasi AI lokal — menjalankan model LLaMA melalui Ollama tanpa mengirim data ke cloud, lalu menyajikan insight langsung di antarmuka.",
      highlights: [
        "Integrasi local AI (Ollama/LLaMA) untuk analisis privat",
        "Pipeline data dari PostgreSQL ke visualisasi interaktif",
        "Backend FastAPI sebagai penghubung model dan antarmuka",
      ],
      stack: ["Python", "FastAPI", "PostgreSQL", "Ollama/LLaMA", "JavaScript"],
      links: { demo: "", repo: "https://github.com/afan7kartikamandiri-creator" },
    },
    {
      id: "impress-print",
      title: "Impress Print",
      kind: "Produk Bisnis (Live)",
      year: "2025",
      summary:
        "Situs percetakan premium di Ciracas, Jakarta Timur. Telah live dan digunakan untuk operasional bisnis nyata.",
      highlights: [
        "Frontend React + backend FastAPI",
        "Deploy production di Vercel",
        "Custom domain & SEO (Search Console) dalam proses",
      ],
      stack: ["React", "FastAPI", "Vercel"],
      links: { demo: "https://impress-print.vercel.app", repo: "" },
    },
  ],
};