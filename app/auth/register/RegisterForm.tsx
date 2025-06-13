"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterForm() {
  const router = useRouter();
  const [role, setRole] = useState<"Patient" | "Medecin" | "">("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState("");
  const [address, setAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [socialSecurityNumber, setSocialSecurityNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Champs spécifiques patient
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [bloodType, setBloodType] = useState("");
  const [allergies, setAllergies] = useState("");
  const [medicalHistory, setMedicalHistory] = useState("");

  // Champs spécifiques médecin
  const [numeroOrdre, setNumeroOrdre] = useState("");
  const [speciality, setSpeciality] = useState("");
  const [hospital, setHospital] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const commonData = {
      role,
      firstName,
      lastName,
      gender,
      address,
      phoneNumber,
      socialSecurityNumber,
      email,
      password,
    };

    const data = role === "Patient"
      ? { ...commonData, dateOfBirth, bloodType, allergies, medicalHistory }
      : { ...commonData, numeroOrdre, speciality, hospital };

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        alert("Erreur: " + errorData.message);
        return;
      }

      alert("Inscription réussie !");
      // ✅ Redirection avec rôle en majuscule
      router.push(`/auth/login?role=${role}`);

    } catch (err) {
      alert("Erreur réseau lors de l'inscription");
    }
  };

  return (
    <div className="w-full max-w-md bg-white p-6 rounded shadow">
      <h2 className="text-2xl font-bold text-center mb-6">Créer un compte</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Choix du rôle */}
        <div className="flex gap-4 mb-2">
          <button
            type="button"
            onClick={() => setRole("Patient")}
            className={`flex-1 p-2 rounded border ${role === "Patient" ? "bg-blue-600 text-white" : ""}`}
          >
            Patient
          </button>
          <button
            type="button"
            onClick={() => setRole("Medecin")}
            className={`flex-1 p-2 rounded border ${role === "Medecin" ? "bg-blue-600 text-white" : ""}`}
          >
            Médecin
          </button>
        </div>

        {role && (
          <>
            {/* Champs communs */}
            <input required type="text" placeholder="Prénom" className="w-full p-2 border rounded" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            <input required type="text" placeholder="Nom" className="w-full p-2 border rounded" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            <select required className="w-full p-2 border rounded" value={gender} onChange={(e) => setGender(e.target.value)}>
              <option value="">-- Sexe --</option>
              <option value="Homme">Homme</option>
              <option value="Femme">Femme</option>
            </select>
            <input required type="text" placeholder="Adresse" className="w-full p-2 border rounded" value={address} onChange={(e) => setAddress(e.target.value)} />
            <input required type="tel" placeholder="Téléphone" className="w-full p-2 border rounded" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
            <input required type="text" placeholder="N° Sécurité Sociale" className="w-full p-2 border rounded" value={socialSecurityNumber} onChange={(e) => setSocialSecurityNumber(e.target.value)} />
            <input required type="email" placeholder="Email" className="w-full p-2 border rounded" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input required type="password" placeholder="Mot de passe" className="w-full p-2 border rounded" value={password} onChange={(e) => setPassword(e.target.value)} />

            {/* Spécifique Patient */}
            {role === "Patient" && (
              <>
                <input required type="date" className="w-full p-2 border rounded" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
                <input type="text" placeholder="Groupe sanguin" className="w-full p-2 border rounded" value={bloodType} onChange={(e) => setBloodType(e.target.value)} />
                <textarea placeholder="Allergies" className="w-full p-2 border rounded" value={allergies} onChange={(e) => setAllergies(e.target.value)} />
                <textarea placeholder="Antécédents médicaux" className="w-full p-2 border rounded" value={medicalHistory} onChange={(e) => setMedicalHistory(e.target.value)} />
              </>
            )}

            {/* Spécifique Médecin */}
            {role === "Medecin" && (
              <>
                <input required type="text" placeholder="N° inscription à l'Ordre (RPPS)" className="w-full p-2 border rounded" value={numeroOrdre} onChange={(e) => setNumeroOrdre(e.target.value)} />
                <input type="text" placeholder="Spécialité" className="w-full p-2 border rounded" value={speciality} onChange={(e) => setSpeciality(e.target.value)} />
                <input required type="text" placeholder="Hôpital" className="w-full p-2 border rounded" value={hospital} onChange={(e) => setHospital(e.target.value)} />
              </>
            )}

            <button type="submit" className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700">
              S'inscrire
            </button>
          </>
        )}
      </form>
    </div>
  );
}