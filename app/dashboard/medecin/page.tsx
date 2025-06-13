// "use client";

// import { useEffect, useState } from "react";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import Link from "next/link";
// import { BellIcon } from "@heroicons/react/24/outline";
// import { useRouter } from "next/navigation";

// interface Patient {
//   id: string;
//   firstName: string;
//   lastName: string;
//   birthDate: string;
//   dossier: string;
// }

// interface Notification {
//   id: string;
//   message: string;
//   date: string;
//   read: boolean;
//   patientId?: string;
// }

// export default function DashboardMedecin() {
//   const router = useRouter();
//   const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
//   const [patients, setPatients] = useState<Patient[]>([]);
//   const [notifications, setNotifications] = useState<Notification[]>([]);
//   const [search, setSearch] = useState("");
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [showNotifPanel, setShowNotifPanel] = useState(false);

//   useEffect(() => {
//     const fetchMedecinData = async () => {
//       try {
//         const token = localStorage.getItem("token");
//         const role = localStorage.getItem("role")?.toLowerCase();
//         if (!token || role !== "medecin") {
//           router.replace("/auth/login?role=medecin"); // Changé de push à replace
//           return;
//         }

//         const res = await fetch("/api/medecin/me", {
//           headers: { Authorization: `Bearer ${token}` },
//           cache: "no-store",
//         });

//         if (!res.ok) throw new Error("Erreur lors de la récupération des données.");

//         const data = await res.json();
//         setPatients(data.patients || []);
//         setNotifications(data.notifications || []);
//       } catch (err: any) {
//         setError(err.message || "Erreur inconnue.");
//         router.replace("/auth/login?role=medecin"); // Changé de push à replace
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchMedecinData();
//   }, [router]);

//   const filteredPatients = patients.filter((p) =>
//     `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase())
//   );

//   const newNotifications = notifications.filter((n) => !n.read);
//   const allNotifications = [...notifications].sort(
//     (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
//   );

//   function toggleReadNotification(id: string) {
//     setNotifications((prev) =>
//       prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
//     );
//   }

//   if (loading) return <div className="p-6 text-gray-600 text-center">Chargement...</div>;
//   if (error) return <div className="p-6 text-red-500 text-center">Erreur : {error}</div>;

//   return (
//     <div className="relative min-h-screen bg-gray-50 p-6">
//       <div className="absolute top-4 right-6 z-50">
//         <button
//           onClick={() => setShowNotifPanel(!showNotifPanel)}
//           className="relative rounded-full p-2 hover:bg-gray-200"
//           title="Notifications"
//         >
//           <BellIcon className="w-7 h-7 text-gray-700" />
//           {newNotifications.length > 0 && (
//             <span className="absolute top-0 right-0 inline-block w-5 h-5 bg-red-600 text-white text-xs font-bold rounded-full text-center leading-5">
//               {newNotifications.length}
//             </span>
//           )}
//         </button>

//         {showNotifPanel && (
//           <Card className="absolute right-0 mt-2 w-80 max-h-80 overflow-y-auto rounded-2xl shadow-lg border bg-white z-50">
//             <CardHeader>
//               <CardTitle className="text-lg font-semibold text-gray-800">Notifications</CardTitle>
//             </CardHeader>
//             <CardContent>
//               {allNotifications.length > 0 ? (
//                 <ul className="space-y-2 text-gray-700">
//                   {allNotifications.map((note) => (
//                     <li
//                       key={note.id}
//                       onClick={() => toggleReadNotification(note.id)}
//                       className={`cursor-pointer p-2 rounded ${
//                         note.read ? "bg-gray-100" : "bg-primary/20 font-semibold"
//                       } hover:bg-primary/30`}
//                     >
//                       🔔 {note.message}
//                       <br />
//                       <small className="text-gray-400">{new Date(note.date).toLocaleString()}</small>
//                     </li>
//                   ))}
//                 </ul>
//               ) : (
//                 <p className="text-gray-500 italic p-2">Aucune notification.</p>
//               )}
//             </CardContent>
//           </Card>
//         )}
//       </div>

//       <div className="grid grid-cols-12 gap-6">
//         <div className="col-span-4 bg-white rounded-2xl p-5 shadow-md border flex flex-col">
//           <div className="flex justify-between items-center mb-4">
//             <h2 className="text-2xl font-bold text-gray-800">Patients</h2>
//             <Link href="/patients/new">
//               <Button className="rounded-xl px-4 py-2">+ Nouveau</Button>
//             </Link>
//           </div>

//           <Input
//             placeholder="🔍 Rechercher un patient..."
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//             className="mb-4 rounded-xl"
//           />

//           <div className="space-y-3 overflow-y-auto" style={{ maxHeight: "calc(100vh - 200px)" }}>
//             {filteredPatients.map((patient) => (
//               <Card
//                 key={patient.id}
//                 onClick={() => setSelectedPatient(patient)}
//                 className={`cursor-pointer rounded-xl border ${
//                   selectedPatient?.id === patient.id
//                     ? "border-2 border-primary bg-primary/10"
//                     : "border-gray-200"
//                 }`}
//               >
//                 <CardContent className="p-4">
//                   <h3 className="font-semibold text-gray-800">{patient.firstName} {patient.lastName}</h3>
//                   <p className="text-sm text-gray-500">Né(e) le {patient.birthDate}</p>
//                 </CardContent>
//               </Card>
//             ))}
//             {filteredPatients.length === 0 && (
//               <p className="text-gray-500 text-center">Aucun patient trouvé.</p>
//             )}
//           </div>
//         </div>

//         <div className="col-span-8">
//           {selectedPatient ? (
//             <Card className="rounded-2xl shadow-xl p-6 border bg-white">
//               <CardHeader>
//                 <CardTitle className="text-3xl font-bold text-gray-800">
//                   {selectedPatient.firstName} {selectedPatient.lastName}
//                 </CardTitle>
//                 <p className="text-gray-500">Né(e) le {selectedPatient.birthDate}</p>
//               </CardHeader>

//               <CardContent>
//                 <p className="mb-6 text-gray-700 text-base leading-relaxed">{selectedPatient.dossier}</p>

//                 <div className="flex flex-wrap gap-3 mb-6">
//                   <Button variant="outline" asChild className="rounded-xl">
//                     <Link href={`/patients/${selectedPatient.id}/edit`}>✏️ Modifier</Link>
//                   </Button>
//                   <Button variant="secondary" asChild className="rounded-xl">
//                     <Link href={`/patients/${selectedPatient.id}/rendezvous/new`}>📅 Nouveau RDV</Link>
//                   </Button>
//                   <Button variant="secondary" asChild className="rounded-xl">
//                     <Link href={`/patients/${selectedPatient.id}/consultations/new`}>🩺 Nouvelle Consultation</Link>
//                   </Button>
//                 </div>

//                 <div className="space-y-4">
//                   <h3 className="font-semibold text-lg text-gray-800">📅 Historique des RDV</h3>
//                   <ul className="list-disc ml-5 text-gray-600 text-sm">
//                     <li>15/06/2025 à 10h - Contrôle annuel</li>
//                     <li>20/03/2025 à 09h - Bilan complet</li>
//                   </ul>

//                   <h3 className="font-semibold text-lg text-gray-800 mt-6">🩺 Historique des consultations</h3>
//                   <ul className="list-disc ml-5 text-gray-600 text-sm">
//                     <li>02/06/2025 - Suivi diabète</li>
//                     <li>12/04/2025 - Résultats analyses sanguines</li>
//                   </ul>
//                 </div>
//               </CardContent>
//             </Card>
//           ) : (
//             <div className="flex items-center justify-center h-full text-gray-400 text-lg italic">
//               Sélectionnez un patient pour afficher son dossier
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }


"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { BellIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  dossier: string;
}

interface Notification {
  id: string;
  message: string;
  date: string;
  read: boolean;
  patientId?: string;
}

interface MedecinResponse {
  patients?: Patient[];
  notifications?: Notification[];
}

export default function DashboardMedecin() {
  const router = useRouter();
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNotifPanel, setShowNotifPanel] = useState(false);

  useEffect(() => {
    const fetchMedecinData = async () => {
      try {
        // Récupérer le token depuis les cookies
        const token = document.cookie
          .split("; ")
          .find((row) => row.startsWith("token="))
          ?.split("=")[1];

        if (!token) {
          setError("Aucun token trouvé. Redirection...");
          router.replace("/auth/login?role=medecin");
          return;
        }

        // Vérifier le rôle (optionnel)
        const role = document.cookie
          .split("; ")
          .find((row) => row.startsWith("role="))
          ?.split("=")[1]?.toLowerCase();
        if (role !== "medecin") {
          setError("Rôle invalide. Redirection...");
          router.replace("/auth/login?role=medecin");
          return;
        }

        // Appel à l'API avec le token dans l'en-tête
        const res = await fetch("http://localhost:3000/api/medecin/me", {
          headers: {
            Authorization: `Bearer ${token}`, // Assurez-vous que le token est inclus
          },
          credentials: "include", // Inclure les cookies dans la requête
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error(`Erreur API: ${res.status} ${res.statusText}`);
        }

        const data: MedecinResponse = await res.json();
        setPatients(data.patients || []);
        setNotifications(data.notifications || []);
      } catch (err: any) {
        setError(err.message || "Une erreur est survenue lors du chargement des données.");
        router.replace("/auth/login?role=medecin");
      } finally {
        setLoading(false);
      }
    };

    fetchMedecinData();
  }, [router]);

  const filteredPatients = patients.filter((p) =>
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase())
  );

  const newNotifications = notifications.filter((n) => !n.read);
  const allNotifications = [...notifications].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const toggleReadNotification = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
    );
  };

  if (loading) return <div className="p-6 text-gray-600 text-center">Chargement...</div>;
  if (error) return <div className="p-6 text-red-500 text-center">Erreur : {error}</div>;

  return (
    <div className="relative min-h-screen bg-gray-50 p-6">
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
                  <h3 className="font-semibold text-gray-800">{patient.firstName} {patient.lastName}</h3>
                  <p className="text-sm text-gray-500">Né(e) le {patient.birthDate}</p>
                </CardContent>
              </Card>
            ))}
            {filteredPatients.length === 0 && (
              <p className="text-gray-500 text-center">Aucun patient trouvé.</p>
            )}
          </div>
        </div>

        <div className="col-span-8">
          {selectedPatient ? (
            <Card className="rounded-2xl shadow-xl p-6 border bg-white">
              <CardHeader>
                <CardTitle className="text-3xl font-bold text-gray-800">
                  {selectedPatient.firstName} {selectedPatient.lastName}
                </CardTitle>
                <p className="text-gray-500">Né(e) le {selectedPatient.birthDate}</p>
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