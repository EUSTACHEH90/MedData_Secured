// // app/api/medecin/upload/route.ts
// import { NextResponse } from "next/server";
// import { jwtVerify } from "jose";
// import path from "node:path";
// import fs from "node:fs/promises";
// import crypto from "node:crypto";

// export const runtime = "nodejs";
// export const dynamic = "force-dynamic";

// const JWT_SECRET = process.env.JWT_SECRET
//   ? new TextEncoder().encode(process.env.JWT_SECRET)
//   : null;

// // Chemin racine privé (même convention que /api/medecin/files/[id])
// const LOCAL_FILES_DIR = path.resolve(process.env.LOCAL_FILES_DIR || "./storage");

// export async function POST(req: Request) {
//   try {
//     if (!JWT_SECRET) {
//       return NextResponse.json({ error: "JWT_SECRET manquant" }, { status: 500 });
//     }
//     const token = req.headers.get("authorization")?.split(" ")[1];
//     if (!token) return NextResponse.json({ error: "Token manquant" }, { status: 401 });

//     const { payload } = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
//     const role = String(payload.role || "").toLowerCase();
//     if (role !== "medecin") return NextResponse.json({ error: "Réservé au médecin" }, { status: 403 });

//     const form = await req.formData();
//     const file = form.get("file") as File | null;
//     const category = String(form.get("category") || "results");
//     if (!file) return NextResponse.json({ error: "Aucun fichier" }, { status: 400 });

//     const ab = await file.arrayBuffer();
//     const buf = Buffer.from(ab);

//     // Hash SHA-256 du contenu
//     const documentHash = crypto.createHash("sha256").update(buf).digest("hex");

//     // Nom/chemin relatif déterministe
//     const ext = path.extname(file.name) || ".bin";
//     const yyyyMmDd = new Date().toISOString().slice(0, 10); // 2025-08-26
//     const rel = path.join(category, yyyyMmDd, `${documentHash}${ext}`);
//     const abs = path.join(LOCAL_FILES_DIR, rel);

//     await fs.mkdir(path.dirname(abs), { recursive: true });
//     await fs.writeFile(abs, buf);

//     return NextResponse.json(
//       { fileUrl: rel, documentHash, size: buf.length, mime: file.type || null },
//       { status: 201 }
//     );
//   } catch (e: any) {
//     console.error("Upload medecin failed:", e?.message || e);
//     return NextResponse.json({ error: "Échec upload" }, { status: 500 });
//   }
// }


// app/api/upload/route.ts
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const JWT_SECRET = process.env.JWT_SECRET
  ? new TextEncoder().encode(process.env.JWT_SECRET)
  : null;

// Dossier racine où stocker les PDFs (config .env.local)
// ex: LOCAL_FILES_DIR=C:\meddata\storage  (Windows)  ou  /var/meddata/storage (Linux)
const LOCAL_FILES_DIR = path.resolve(process.env.LOCAL_FILES_DIR || "./storage");

export async function POST(req: Request) {
  try {
    if (!JWT_SECRET) {
      return NextResponse.json({ error: "JWT_SECRET manquant" }, { status: 500 });
    }

    // Auth médecin
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ error: "Token manquant" }, { status: 401 });
    const { payload } = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
    const role = String(payload.role || "").toLowerCase();
    if (role !== "medecin") return NextResponse.json({ error: "Réservé au médecin" }, { status: 403 });

    // Récup form-data
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const patientId = String(form.get("patientId") || "");
    if (!file) return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
    if (!patientId) return NextResponse.json({ error: "patientId manquant" }, { status: 400 });

    // Contrôle MIME
    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Seuls les PDF sont acceptés." }, { status: 415 });
    }

    // Chemin relatif: results/YYYY-MM-DD/{patientId}-{hash8}.pdf
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");

    // nom safe
    const rand = crypto.randomBytes(6).toString("hex");
    const relDir = path.join("results", `${y}-${m}-${d}`);
    const relFile = `${patientId}-${rand}.pdf`;
    const relPath = path.join(relDir, relFile);            // <-- chemin RELATIF qu'on renverra
    const absPath = path.join(LOCAL_FILES_DIR, relPath);   // <-- chemin ABSOLU disque

    // Création dossier + écriture fichier
    await fsp.mkdir(path.dirname(absPath), { recursive: true });
    const buf = Buffer.from(await file.arrayBuffer());
    await fsp.writeFile(absPath, buf);

    // On répond avec un chemin **relatif** (jamais l'absolu disque)
    return NextResponse.json({ ok: true, fileUrl: relPath }, { status: 201 });
  } catch (e: any) {
    console.error("Upload error:", e?.message || e);
    return NextResponse.json({ error: "Erreur upload" }, { status: 500 });
  }
}
