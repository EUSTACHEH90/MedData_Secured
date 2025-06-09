"use client"

import { useState } from "react"

export default function RegisterPage() {
  const [role, setRole] = useState<"patient" | "medecin" | "">("")
  const [nom, setNom] = useState("")
  const [prenom, setPrenom] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rpps, setRpps] = useState("")
  const [phone, setPhone] = useState("")
  const [hopital, setHopital] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log({ role, nom, prenom, email, password, phone, rpps, hopital })
    // ➔ Ici, tu feras l'appel à ton API
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white p-6 rounded shadow">
        <h2 className="text-2xl font-bold text-center mb-6">Créer un compte</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Choix du rôle */}
          <div className="flex gap-4 mb-2">
            <button
              type="button"
              onClick={() => setRole("patient")}
              className={`flex-1 p-2 rounded border ${role === "patient" ? "bg-blue-600 text-white" : ""}`}
            >
              Patient
            </button>
            <button
              type="button"
              onClick={() => setRole("medecin")}
              className={`flex-1 p-2 rounded border ${role === "medecin" ? "bg-blue-600 text-white" : ""}`}
            >
              Médecin
            </button>
          </div>

          {role && (
            <>
              <div>
                <label className="block text-sm font-medium">Nom</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Prénom</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  value={prenom}
                  onChange={(e) => setPrenom(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Téléphone</label>
                <input
                  type="tel"
                  className="w-full p-2 border rounded"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

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

              {/* Si médecin, demander RPPS + Hôpital */}
              {role === "medecin" && (
                <>
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

                  <div>
                    <label className="block text-sm font-medium">Hôpital de fonction</label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded"
                      value={hopital}
                      onChange={(e) => setHopital(e.target.value)}
                      required
                    />
                  </div>
                </>
              )}

              <button type="submit" className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700">
                S'inscrire
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  )
}
