"""
Portfolio backend — Muhammad Ghatfhaan Abdillah
FastAPI: menyajikan data profil & project, dan menerima pesan dari contact form.
Data project disajikan dari sini supaya frontend & backend selaras (single source of truth).
"""
import os
import smtplib
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from email.message import EmailMessage
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field

load_dotenv()  # baca file .env (GMAIL_USER, GMAIL_APP_PASSWORD, MAIL_TO)

DB_PATH = Path(__file__).parent / "messages.db"

# --- Konfigurasi email (diisi lewat file .env, tidak ditulis di kode) ---
GMAIL_USER = os.getenv("GMAIL_USER", "")                  # alamat Gmail pengirim
GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD", "")  # App Password 16 digit
MAIL_TO = os.getenv("MAIL_TO", GMAIL_USER)                # tujuan notifikasi (default: dirimu)

app = FastAPI(title="Portfolio API", version="1.0.0")

# Saat development Vite jalan di :5173. Tambahkan domain production-mu kalau sudah deploy.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


# ----------------------------- Database -----------------------------
@contextmanager
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db():
    with get_db() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS messages (
                id        INTEGER PRIMARY KEY AUTOINCREMENT,
                name      TEXT NOT NULL,
                email     TEXT NOT NULL,
                message   TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )


init_db()


# ----------------------------- Data profil -----------------------------
PROFILE = {
    "name": "Muhammad Ghatfhaan Abdillah",
    "role": "Information Systems Student",
    "focus": "Data Science",
    "tagline": "Membangun produk berbasis data dan AI lokal — dari dashboard analitik hingga situs bisnis yang telah live.",
    "university": "President University",
    "faculty": "Fakultas Ilmu Komputer",
    "major": "Information Systems",
    "semester": 6,
    "status": "Terbuka untuk kesempatan magang Data Science",
    "location": "Indonesia",
    "links": {
        "github": "https://github.com/afan7kartikamandiri-creator",
        "email": "mailto:ghatfhaanabdillah@gmail.com",
        "linkedin": "",  # isi apabila sudah tersedia
    },
}

SKILLS = [
    {"group": "Languages", "items": ["Python", "JavaScript", "SQL", "HTML/CSS"]},
    {"group": "Frameworks", "items": ["FastAPI", "React"]},
    {"group": "Data & AI", "items": ["PostgreSQL", "Ollama / LLaMA (local AI)"]},
    {"group": "Tools", "items": ["Git", "VS Code", "Vercel"]},
]

PROJECTS = [
    {
        "id": "gen-ai",
        "title": "GEN AI",
        "kind": "Proyek Akademik Utama",
        "year": "2025",
        "summary": "Dashboard analitik data berbasis web dengan integrasi AI lokal — "
                   "menjalankan model LLaMA via Ollama tanpa mengirim data ke cloud, "
                   "lalu menyajikan insight langsung di antarmuka.",
        "highlights": [
            "Integrasi local AI (Ollama/LLaMA) untuk analisis privat",
            "Pipeline data dari PostgreSQL ke visualisasi interaktif",
            "Backend FastAPI sebagai penghubung model dan antarmuka",
        ],
        "stack": ["Python", "FastAPI", "PostgreSQL", "Ollama/LLaMA", "JavaScript"],
        "links": {"demo": "", "repo": "https://github.com/afan7kartikamandiri-creator"},
        "featured": True,
    },
    {
        "id": "impress-print",
        "title": "Impress Print",
        "kind": "Produk Bisnis (Live)",
        "year": "2025",
        "summary": "Situs percetakan premium di Ciracas, Jakarta Timur. "
                   "Telah live dan digunakan untuk operasional bisnis nyata.",
        "highlights": [
            "Frontend React + backend FastAPI",
            "Deploy production di Vercel",
            "Custom domain & SEO (Search Console) dalam proses",
        ],
        "stack": ["React", "FastAPI", "Vercel"],
        "links": {"demo": "https://impress-print.vercel.app", "repo": ""},
        "featured": True,
    },
]

EXPERIENCE = [
    {
        "role": "Public Relations (Volunteer)",
        "org": "CompSphere Hackathon",
        "year": "2025",
        "summary": "Mengelola komunikasi dan publikasi acara hackathon kampus.",
    },
]


# ----------------------------- Models -----------------------------
class ContactIn(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    email: EmailStr
    message: str = Field(min_length=1, max_length=2000)


# ----------------------------- Email -----------------------------
def send_email_notification(name: str, email: str, message: str) -> None:
    """Kirim notifikasi pesan baru ke Gmail. Best-effort: error tidak menggagalkan request."""
    if not (GMAIL_USER and GMAIL_APP_PASSWORD and MAIL_TO):
        # kredensial belum diisi di .env — lewati pengiriman, pesan tetap tersimpan di DB
        return

    msg = EmailMessage()
    msg["Subject"] = f"[Portfolio] Pesan baru dari {name}"
    msg["From"] = GMAIL_USER
    msg["To"] = MAIL_TO
    msg["Reply-To"] = email  # tombol "Reply" langsung ke pengirim
    msg.set_content(
        f"Anda menerima pesan baru dari formulir kontak portfolio.\n\n"
        f"Nama   : {name}\n"
        f"Email  : {email}\n"
        f"Waktu  : {datetime.now().strftime('%d %b %Y, %H:%M')}\n\n"
        f"Pesan:\n{message}\n"
    )

    with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=15) as server:
        server.login(GMAIL_USER, GMAIL_APP_PASSWORD)
        server.send_message(msg)


# ----------------------------- Routes -----------------------------
@app.get("/api/profile")
def get_profile():
    return {"profile": PROFILE, "skills": SKILLS, "experience": EXPERIENCE}


@app.get("/api/projects")
def get_projects():
    return {"projects": PROJECTS}


@app.post("/api/contact")
def post_contact(payload: ContactIn):
    # 1) Simpan ke database (cadangan, tidak boleh hilang)
    try:
        with get_db() as conn:
            conn.execute(
                "INSERT INTO messages (name, email, message, created_at) VALUES (?, ?, ?, ?)",
                (
                    payload.name.strip(),
                    str(payload.email),
                    payload.message.strip(),
                    datetime.now(timezone.utc).isoformat(),
                ),
            )
    except Exception:
        raise HTTPException(status_code=500, detail="Gagal menyimpan pesan. Silakan coba beberapa saat lagi.")

    # 2) Kirim notifikasi ke Gmail (best-effort — gagal kirim tidak menggagalkan respons)
    try:
        send_email_notification(payload.name.strip(), str(payload.email), payload.message.strip())
    except Exception as e:
        print(f"[WARN] Notifikasi email gagal dikirim: {e}")

    return {"ok": True, "message": "Pesan Anda telah terkirim. Terima kasih, saya akan segera membalas."}


@app.get("/api/messages")
def list_messages():
    """Untuk meninjau pesan yang masuk (opsional — amankan atau hapus di production)."""
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM messages ORDER BY id DESC").fetchall()
    return {"messages": [dict(r) for r in rows]}


@app.get("/")
def root():
    return {"status": "ok", "service": "Afan Portfolio API"}