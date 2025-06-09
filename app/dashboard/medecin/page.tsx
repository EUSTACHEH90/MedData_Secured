"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { BellIcon } from "@heroicons/react/24/outline";

type Patient = {
  id: string;
  nom: string;
  prenom: string;
  dateNaissance: string;
  dossier: string;
};

type Notification = {
  id: string;
  message: string;
  date: string;
  read: boolean;
  patientId?: string;
};

const patientsMock: Patient[] = [
  { id: "1", nom: "Dupont", prenom: "Jean", dateNaissance: "1990-05-01", dossier: "Diabète de type II, suivi régulier." },
  { id: "2", nom: "Martin", prenom: "Alice", dateNaissance: "1985-03-15", dossier: "Hypertension, traitement en cours." },
  { id: "3", nom: "Bernard", prenom: "Lucas", dateNaissance: "1978-09-22", dossier: "Aucun antécédent médical significatif." },
];

const initialNotifications: Notification[] = [
  { id: "n1", message: "RDV programmé avec Jean Dupont le 15/06 à 10h", date: "2025-06-01T10:00:00", read: false, patientId: "1" },
  { id: "n2", message: "Nouvelle consultation ajoutée pour Alice Martin", date: "2025-06-02T14:30:00", read: false, patientId: "2" },
  { id: "n3", message: "RDV programmé avec Lucas Bernard le 20/06 à 09h", date: "2025-06-01T09:00:00", read: true, patientId: "3" },
];

export default function DashboardMedecin() {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [search, setSearch] = useState("");
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [showNotifPanel, setShowNotifPanel] = useState(false);

  const filteredPatients = patientsMock.filter((p) =>
    `${p.nom} ${p.prenom}`.toLowerCase().includes(search.toLowerCase())
  );

  const newNotifications = notifications.filter((n) => !n.read);
  const allNotifications = [...notifications].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  function toggleReadNotification(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
    );
  }

  return (
    <div className="relative min-h-screen bg-gray-50 p-6">
      {/* Cloche notifications en haut à droite */}
      <div className="absolute top-4 right-6 z-50">
        <button
          onClick={() => setShowNotifPanel(!showNotifPanel)}
          className="relative rounded-full p-2 hover:bg-gray-200"
          title="Notifications"
        >
          <BellIcon className="w-7 h-7 text-gray-700" />
          {newNotifications.length > 0 && (
            <span className="absolute top-0 right-0 inline-block w-5 h-5 bg-red-600 text-white text-xs font-bold rounded-full text-center leading-5">
              {newNotifications.length}
            </span>
          )}
        </button>

        {showNotifPanel && (
          <Card className="absolute right-0 mt-2 w-80 max-h-80 overflow-y-auto rounded-2xl shadow-lg border bg-white z-50">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-800">Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              {allNotifications.length > 0 ? (
                <ul className="space-y-2 text-gray-700">
                  {allNotifications.map((note) => (
                    <li
                      key={note.id}
                      onClick={() => toggleReadNotification(note.id)}
                      className={`cursor-pointer p-2 rounded ${
                        note.read ? "bg-gray-100" : "bg-primary/20 font-semibold"
                      } hover:bg-primary/30`}
                    >
                      🔔 {note.message}
                      <br />
                      <small className="text-gray-400">{new Date(note.date).toLocaleString()}</small>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 italic p-2">Aucune notification.</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Colonne gauche */}
        <div className="col-span-4 bg-white rounded-2xl p-5 shadow-md border flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">Patients</h2>
            <Link href="/patients/new">
              <Button className="rounded-xl px-4 py-2">+ Nouveau</Button>
            </Link>
          </div>

          <Input
            placeholder="🔍 Rechercher un patient..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mb-4 rounded-xl"
          />

          <div className="space-y-3 overflow-y-auto" style={{ maxHeight: "calc(100vh - 200px)" }}>
            {filteredPatients.map((patient) => (
              <Card
                key={patient.id}
                onClick={() => setSelectedPatient(patient)}
                className={`cursor-pointer rounded-xl border ${
                  selectedPatient?.id === patient.id
                    ? "border-2 border-primary bg-primary/10"
                    : "border-gray-200"
                }`}
              >
                <CardContent className="p-4">
                  <h3 className="font-semibold text-gray-800">{patient.prenom} {patient.nom}</h3>
                  <p className="text-sm text-gray-500">Né(e) le {patient.dateNaissance}</p>
                </CardContent>
              </Card>
            ))}
            {filteredPatients.length === 0 && (
              <p className="text-gray-500 text-center">Aucun patient trouvé.</p>
            )}
          </div>
        </div>

        {/* Colonne droite */}
        <div className="col-span-8">
          {selectedPatient ? (
            <Card className="rounded-2xl shadow-xl p-6 border bg-white">
              <CardHeader>
                <CardTitle className="text-3xl font-bold text-gray-800">
                  {selectedPatient.prenom} {selectedPatient.nom}
                </CardTitle>
                <p className="text-gray-500">Né(e) le {selectedPatient.dateNaissance}</p>
              </CardHeader>

              <CardContent>
                <p className="mb-6 text-gray-700 text-base leading-relaxed">{selectedPatient.dossier}</p>

                <div className="flex flex-wrap gap-3 mb-6">
                  <Button variant="outline" asChild className="rounded-xl">
                    <Link href={`/patients/${selectedPatient.id}/edit`}>✏️ Modifier</Link>
                  </Button>
                  <Button variant="secondary" asChild className="rounded-xl">
                    <Link href={`/patients/${selectedPatient.id}/rendezvous/new`}>📅 Nouveau RDV</Link>
                  </Button>
                  <Button variant="secondary" asChild className="rounded-xl">
                    <Link href={`/patients/${selectedPatient.id}/consultations/new`}>🩺 Nouvelle Consultation</Link>
                  </Button>
                </div>

                {/* Historique fictif */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-gray-800">📅 Historique des RDV</h3>
                  <ul className="list-disc ml-5 text-gray-600 text-sm">
                    <li>15/06/2025 à 10h - Contrôle annuel</li>
                    <li>20/03/2025 à 09h - Bilan complet</li>
                  </ul>

                  <h3 className="font-semibold text-lg text-gray-800 mt-6">🩺 Historique des consultations</h3>
                  <ul className="list-disc ml-5 text-gray-600 text-sm">
                    <li>02/06/2025 - Suivi diabète</li>
                    <li>12/04/2025 - Résultats analyses sanguines</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 text-lg italic">
              Sélectionnez un patient pour afficher son dossier
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
