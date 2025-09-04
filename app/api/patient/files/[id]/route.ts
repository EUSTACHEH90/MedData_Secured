
// // app/api/patient/files/[id]/route.ts
// import { NextResponse } from "next/server";
// import prisma from "@/lib/prisma";
// import { jwtVerify } from "jose";
// import fs from "node:fs";
// import fsp from "node:fs/promises";
// import path from "node:path";

// export const runtime = "nodejs";
// export const dynamic = "force-dynamic";

// const JWT_SECRET = process.env.JWT_SECRET
//   ? new TextEncoder().encode(process.env.JWT_SECRET)
//   : null;

// // Dossier racine pour les PDF locaux (doit exister physiquement)
// // .env.local -> LOCAL_FILES_DIR=D:\medapp\storage (ou /home/user/storage)
// const LOCAL_FILES_DIR = path.resolve(process.env.LOCAL_FILES_DIR || "./storage");

// function isHttpUrl(u?: string | null): u is string {
//   if (!u) return false;
//   try {
//     const x = new URL(u);
//     return x.protocol === "http:" || x.protocol === "https:";
//   } catch {
//     return false;
//   }
// }

// function devError(e: unknown, extra: Record<string, any> = {}) {
//   const body =
//     process.env.NODE_ENV === "production"
//       ? { error: "Erreur serveur" }
//       : {
//           error: "Erreur serveur",
//           message: e instanceof Error ? e.message : String(e),
//           stack: e instanceof Error ? e.stack : undefined,
//           ...extra,
//         };
//   return NextResponse.json(body, { status: 500 });
// }

// export async function GET(req: Request, { params }: { params: { id: string } }) {
//   const url = new URL(req.url);
//   const debug = url.searchParams.get("debug") === "1";

//   try {
//     if (!JWT_SECRET) {
//       return NextResponse.json({ error: "JWT_SECRET manquant" }, { status: 500 });
//     }

//     const token = req.headers.get("authorization")?.split(" ")[1];
//     if (!token) return NextResponse.json({ error: "Token manquant" }, { status: 401 });

//     // Auth patient
//     let payload: any;
//     try {
//       ({ payload } = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] }));
//     } catch (e) {
//       return NextResponse.json({ error: "Token invalide ou expiré" }, { status: 401 });
//     }
//     const role = String(payload.role || "").toLowerCase().trim();
//     const patientId = String(payload.id || "");
//     if (role !== "patient") {
//       return NextResponse.json({ error: "Réservé au patient" }, { status: 403 });
//     }

//     // Charger le résultat
//     const result = await prisma.result.findUnique({
//       where: { id: params.id },
//       select: { id: true, patientId: true, fileUrl: true, type: true, description: true },
//     });

//     if (!result) return NextResponse.json({ error: "Document introuvable" }, { status: 404 });
//     if (result.patientId !== patientId) {
//       return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
//     }
//     if (!result.fileUrl) {
//       return NextResponse.json({ error: "Aucun fichier associé" }, { status: 404 });
//     }

//     // Mode debug: renvoie les infos au lieu de streamer
//     if (debug) {
//       const rel = result.fileUrl.replace(/^[/\\]+/, "");
//       const abs = path.resolve(LOCAL_FILES_DIR, rel);
//       const exists = await fsp.stat(abs).then(s => s.isFile()).catch(() => false);
//       return NextResponse.json({
//         debug: true,
//         LOCAL_FILES_DIR,
//         fileUrl: result.fileUrl,
//         isHttp: isHttpUrl(result.fileUrl),
//         abs,
//         absInsideRoot: abs.startsWith(LOCAL_FILES_DIR),
//         exists,
//       });
//     }

//     // Cas URL HTTP(S) -> proxy
//     if (isHttpUrl(result.fileUrl)) {
//       const upstream = await fetch(result.fileUrl);
//       if (!upstream.ok || !upstream.body) {
//         return NextResponse.json({ error: "Fichier indisponible" }, { status: 502 });
//       }
//       const headers = new Headers();
//       headers.set("Content-Type", upstream.headers.get("content-type") || "application/pdf");
//       headers.set("Content-Disposition", `inline; filename="${result.id}.pdf"`);
//       headers.set("Cache-Control", "no-store");
//       return new Response(upstream.body, { status: 200, headers });
//     }

//     // Sinon: chemin local relatif -> LOCAL_FILES_DIR
//     const rel = result.fileUrl.replace(/^[/\\]+/, "");
//     const abs = path.resolve(LOCAL_FILES_DIR, rel);
//     if (!abs.startsWith(LOCAL_FILES_DIR)) {
//       return NextResponse.json({ error: "Chemin invalide" }, { status: 400 });
//     }

//     const exists = await fsp.stat(abs).then(s => s.isFile()).catch(() => false);
//     if (!exists) return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });

//     // Stream du PDF
//     const stream = fs.createReadStream(abs);
//     const headers = new Headers();
//     headers.set("Content-Type", "application/pdf");
//     headers.set("Content-Disposition", `inline; filename="${path.basename(abs)}"`);
//     headers.set("Cache-Control", "no-store");

//     // @ts-ignore Node stream -> Response OK (runtime node)
//     return new Response(stream, { status: 200, headers });
//   } catch (e) {
//     console.error("Erreur /api/patient/files/[id] :", e);
//     return devError(e, { route: "patient/files/[id]" });
//   }
// }


// app/api/patient/files/[id]/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { jwtVerify } from "jose";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const JWT_SECRET = process.env.JWT_SECRET
  ? new TextEncoder().encode(process.env.JWT_SECRET)
  : null;

const LOCAL_FILES_DIR = path.resolve(process.env.LOCAL_FILES_DIR || "./storage");

function isHttpUrl(u?: string | null): u is string {
  if (!u) return false;
  try {
    const x = new URL(u);
    return x.protocol === "http:" || x.protocol === "https:";
  } catch {
    return false;
  }
}

function isGoogleDriveUrl(u?: string | null): u is string {
  if (!u) return false;
  try {
    const x = new URL(u);
    return x.hostname === "docs.google.com" && x.pathname.startsWith("/document/d/");
  } catch {
    return false;
  }
}

function devError(e: unknown, extra: Record<string, any> = {}) {
  const body =
    process.env.NODE_ENV === "production"
      ? { error: "Erreur serveur" }
      : {
          error: "Erreur serveur",
          message: e instanceof Error ? e.message : String(e),
          stack: e instanceof Error ? e.stack : undefined,
          ...extra,
        };
  return NextResponse.json(body, { status: 500 });
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const url = new URL(req.url);
  const debug = url.searchParams.get("debug") === "1";

  try {
    if (!JWT_SECRET) {
      return NextResponse.json({ error: "JWT_SECRET manquant" }, { status: 500 });
    }

    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ error: "Token manquant" }, { status: 401 });

    // Auth patient
    let payload: any;
    try {
      ({ payload } = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] }));
    } catch (e) {
      return NextResponse.json({ error: "Token invalide ou expiré" }, { status: 401 });
    }
    const role = String(payload.role || "").toLowerCase().trim();
    const patientId = String(payload.id || "");
    if (role !== "patient") {
      return NextResponse.json({ error: "Réservé au patient" }, { status: 403 });
    }

    // Charger le résultat
    const result = await prisma.result.findUnique({
      where: { id: params.id },
      select: { id: true, patientId: true, fileUrl: true, type: true, description: true },
    });

    if (!result) return NextResponse.json({ error: "Document introuvable" }, { status: 404 });
    if (result.patientId !== patientId) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }
    if (!result.fileUrl) {
      return NextResponse.json({ error: "Aucun fichier associé" }, { status: 404 });
    }

    // Mode debug: renvoie les infos au lieu de streamer
    if (debug) {
      const rel = result.fileUrl.replace(/^[/\\]+/, "");
      const abs = path.resolve(LOCAL_FILES_DIR, rel);
      const exists = await fsp.stat(abs).then(s => s.isFile()).catch(() => false);
      return NextResponse.json({
        debug: true,
        LOCAL_FILES_DIR,
        fileUrl: result.fileUrl,
        isHttp: isHttpUrl(result.fileUrl),
        isGoogleDrive: isGoogleDriveUrl(result.fileUrl),
        abs,
        absInsideRoot: abs.startsWith(LOCAL_FILES_DIR),
        exists,
      });
    }

    // Cas Google Drive
    if (isGoogleDriveUrl(result.fileUrl)) {
      const match = result.fileUrl.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
      if (!match) {
        return NextResponse.json({ error: "URL Google Drive invalide" }, { status: 400 });
      }
      const fileId = match[1];
      const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
      const upstream = await fetch(downloadUrl);
      if (!upstream.ok || !upstream.body) {
        return NextResponse.json({ error: "Fichier indisponible" }, { status: 502 });
      }
      const headers = new Headers();
      headers.set("Content-Type", upstream.headers.get("content-type") || "application/pdf");
      headers.set("Content-Disposition", `inline; filename="${result.id}.pdf"`);
      headers.set("Cache-Control", "no-store");
      return new Response(upstream.body, { status: 200, headers });
    }

    // Cas URL HTTP(S) -> proxy
    if (isHttpUrl(result.fileUrl)) {
      const upstream = await fetch(result.fileUrl);
      if (!upstream.ok || !upstream.body) {
        return NextResponse.json({ error: "Fichier indisponible" }, { status: 502 });
      }
      const headers = new Headers();
      headers.set("Content-Type", upstream.headers.get("content-type") || "application/pdf");
      headers.set("Content-Disposition", `inline; filename="${result.id}.pdf"`);
      headers.set("Cache-Control", "no-store");
      return new Response(upstream.body, { status: 200, headers });
    }

    // Sinon: chemin local relatif -> LOCAL_FILES_DIR
    const rel = result.fileUrl.replace(/^[/\\]+/, "");
    const abs = path.resolve(LOCAL_FILES_DIR, rel);
    if (!abs.startsWith(LOCAL_FILES_DIR)) {
      return NextResponse.json({ error: "Chemin invalide" }, { status: 400 });
    }

    const exists = await fsp.stat(abs).then(s => s.isFile()).catch(() => false);
    if (!exists) return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });

    // Stream du PDF
    const stream = fs.createReadStream(abs);
    const headers = new Headers();
    headers.set("Content-Type", "application/pdf");
    headers.set("Content-Disposition", `inline; filename="${path.basename(abs)}"`);
    headers.set("Cache-Control", "no-store");

    // @ts-ignore Node stream -> Response OK (runtime node)
    return new Response(stream, { status: 200, headers });
  } catch (e) {
    console.error("Erreur /api/patient/files/[id] :", e);
    return devError(e, { route: "patient/files/[id]" });
  }
}