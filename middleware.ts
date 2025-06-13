// import { NextResponse } from "next/server";
// import type { NextRequest } from "next/server";
// import { jwtVerify } from "jose";

// const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

// export async function middleware(req: NextRequest) {
//   const protectedPaths = ["/dashboard/patient", "/dashboard/medecin"];
//   const pathname = req.nextUrl.pathname;

//   if (protectedPaths.some((path) => pathname.startsWith(path))) {
//     const token = req.cookies.get("token")?.value || req.headers.get("authorization")?.replace("Bearer ", "") || "";
//     const role = pathname.startsWith("/dashboard/patient") ? "Patient" : "Medecin";

//     if (!token) {
//       console.log(`Aucun token trouvé pour ${pathname}, redirection vers /auth/login?role=${role}`);
//       return NextResponse.redirect(new URL(`/auth/login?role=${role}`, req.url));
//     }

//     try {
//       // Vérification du token avec jose
//       const { payload } = await jwtVerify(token, JWT_SECRET, {
//         algorithms: ["HS256"],
//       });
//       console.log(`Token valide pour ${pathname}, payload :`, payload);
//       return NextResponse.next();
//     } catch (err) {
//       console.log(`Token invalide pour ${pathname}, erreur :`, err);
//       return NextResponse.redirect(new URL(`/auth/login?role=${role}`, req.url));
//     }
//   }

//   return NextResponse.next();
// }

// export const config = {
//   matcher: ["/dashboard/:path*"],
// };


import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function middleware(req: NextRequest) {
  const protectedPaths = ["/dashboard/patient", "/dashboard/medecin"];
  const pathname = req.nextUrl.pathname;

  // Vérifie si la route actuelle est protégée
  if (protectedPaths.some((path) => pathname.startsWith(path))) {
    const token = req.cookies.get("token")?.value || req.headers.get("authorization")?.replace("Bearer ", "") || "";
    const role = pathname.startsWith("/dashboard/patient") ? "Patient" : "Medecin";

    if (!token) {
      console.log(`Aucun token trouvé pour ${pathname}, redirection vers /auth/login?role=${role}`);
      return NextResponse.redirect(new URL(`/auth/login?role=${role}`, req.url));
    }

    try {
      // Vérification du token avec jose
      const { payload } = await jwtVerify(token, JWT_SECRET, {
        algorithms: ["HS256"],
      });
      console.log(`Token valide pour ${pathname}, payload :`, payload);

      // Injecte les informations décodées dans l'en-tête pour utilisation dans les routes API
      const requestHeaders = new Headers(req.headers);
      requestHeaders.set("user", JSON.stringify(payload));

      const response = NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });

      return response;
    } catch (err) {
      console.log(`Token invalide pour ${pathname}, erreur :`, err);
      return NextResponse.redirect(new URL(`/auth/login?role=${role}`, req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};