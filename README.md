# Afan Kartika Mandiri — Portfolio

Portfolio full-stack: **React (Vite) + Three.js** di frontend, **FastAPI** di backend.
Tema visual "Latent Space" — point cloud 3D interaktif yang diwarnai *plasma colormap*,
nyambung sama fokus Data Science.

Data project & profil disajikan dari backend (`/api/...`), dan contact form beneran
nyimpen pesan ke SQLite — jadi frontend dan backend selaras, bukan dua hal terpisah.

```
afan-portfolio/
├── backend/          # FastAPI
│   ├── main.py
│   └── requirements.txt
└── frontend/         # React + Vite + Three.js
    ├── src/
    │   ├── App.jsx
    │   ├── index.css
    │   ├── components/ParticleField.jsx
    │   └── data/fallback.js
    └── package.json
```

## 1. Jalankan backend (FastAPI)

```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Cek di http://127.0.0.1:8000/api/projects — harusnya muncul JSON.

## 2. Jalankan frontend (React)

Buka terminal baru:

```bash
cd frontend
npm install
npm run dev
```

Buka http://localhost:5173

Vite sudah di-set proxy: semua request `/api` otomatis diteruskan ke FastAPI di `:8000`.
Kalau backend belum nyala, web tetap tampil pakai data fallback — cuma contact form-nya
yang butuh backend.

## 3. Yang perlu kamu ganti

- `backend/main.py` → `PROFILE["links"]["email"]` dan `linkedin` (isi yang aktif).
- Edit isi `PROJECTS` di `main.py` kalau mau nambah/ubah project. Frontend ikut otomatis.
- Foto/screenshot project bisa ditambahkan nanti di tiap card (`App.jsx` → `ProjectCard`).

## 4. Build production

```bash
cd frontend
npm run build      # hasil ada di frontend/dist
```

Frontend (`dist`) bisa di-deploy ke Vercel. Backend FastAPI di-deploy terpisah
(misal Railway/Render), lalu update `allow_origins` di `main.py` + base URL `/api`
di frontend ke domain backend production.

## Cek pesan yang masuk

`GET http://127.0.0.1:8000/api/messages` — list semua pesan dari contact form.
(Di production, amankan atau hapus endpoint ini.)
