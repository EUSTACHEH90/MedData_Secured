"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface LoginResponse {
  token?: string;
  role?: string;
  userId?: string;
  message?: string;
}

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlRole = searchParams.get("role") || "patient";
  const role = urlRole.toLowerCase() === "patient" ? "Patient" : "Medecin";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    console.log("Requête envoyée à /api/auth/login :", { email, password, role });

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      });

      const data: LoginResponse = await res.json();
      console.log("Réponse de l'API :", data);

      if (!res.ok) {
        setError(data.message || "Erreur lors de la connexion");
        console.log("Erreur API :", data.message);
        return;
      }

      console.log("Connexion réussie, stockage des données :", {
        token: data.token,
        role: data.role,
        userId: data.userId,
      });

      document.cookie = `token=${data.token}; path=/; max-age=7200; SameSite=Strict`;
      document.cookie = `role=${data.role}; path=/; max-age=7200; SameSite=Strict`;

      console.log("Cookies définis :", document.cookie);

      // Temporisation pour garantir que les cookies soient appliqués
      await new Promise((resolve) => setTimeout(resolve, 100));

      if (data.role === "Patient") {
        console.log("Redirection vers /dashboard/patient");
        router.push("/dashboard/patient");
      } else if (data.role === "Medecin") {
        console.log("Redirection vers /dashboard/medecin");
        router.push("/dashboard/medecin");
      } else {
        console.log("Rôle inattendu :", data.role);
        setError("Rôle invalide renvoyé par l'API");
      }

      console.log("Fin de handleSubmit");
    } catch (err: unknown) {
      setError("Erreur réseau lors de la connexion");
      console.error("Erreur réseau :", err);
    }
  };

  return (
    <div className="w-full max-w-md bg-white p-6 border rounded shadow">
      <h2 className="text-2xl font-semibold mb-5">Connexion ({role})</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Se connecter
        </button>
      </form>
    </div>
  );
}