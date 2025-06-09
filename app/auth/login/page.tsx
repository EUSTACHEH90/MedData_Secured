"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const role = searchParams.get("role") as "patient" | "medecin" | null;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rpps, setRpps] = useState("");

  useEffect(() => {
    if (!role) {
      router.replace("/"); // redirection déclenchée APRES le rendu initial
    }
  }, [role, router]);

  if (!role) {
    return null; // attendre la redirection
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({ role, email, password, rpps });
    // API de connexion ici
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white p-6 rounded shadow">
        <h2 className="text-2xl font-bold text-center mb-6">
          Connexion {role === "medecin" ? "Médecin" : "Patient"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              type="email"
              className="w-full p-2 border rounded"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Mot de passe</label>
            <input
              type="password"
              className="w-full p-2 border rounded"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {role === "medecin" && (
            <div>
              <label className="block text-sm font-medium">Numéro RPPS</label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                value={rpps}
                onChange={(e) => setRpps(e.target.value)}
                required
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            Se connecter
          </button>
        </form>
      </div>
    </div>
  );
}
