
// "use client";

// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import { 
//   HomeIcon, 
//   UserIcon, 
//   CalendarIcon, 
//   DocumentTextIcon, 
//   ChatBubbleLeftIcon, 
//   ClipboardDocumentIcon 
// } from "@heroicons/react/24/outline";
// import { BellIcon, Cog6ToothIcon } from "@heroicons/react/24/outline";

// interface Patient {
//   id: string;
//   email: string;
//   role: string;
//   firstName?: string;
//   lastName?: string;
//   dateOfBirth?: string;
//   address?: string;
//   height?: string;
//   weight?: string;
//   bloodPressure?: { systolic: string; diastolic: string };
//   heartRate?: string;
//   temperature?: string;
//   oxygen?: string;
//   gender?: string;
//   bloodGroup?: string;
//   allergies?: string;
// }

// interface Consultation {
//   id: string;
//   date: string;
//   doctorName: string;
//   summary: string;
//   documentHash?: string;
//   authorizedUsers?: string[];
// }

// interface Appointment {
//   id: string;
//   date: string;
//   location: string;
//   status: "Confirmé" | "En attente" | "Passé";
//   isTeleconsultation?: boolean;
// }

// interface Result {
//   id: string;
//   type: string;
//   date: string;
//   documentHash?: string;
//   sharedWith?: string[];
// }

// interface Doctor {
//   id: string;
//   firstName: string;
//   lastName: string;
//   speciality: string;
// }

// export default function PatientDashboard() {
//   const router = useRouter();
//   const [patient, setPatient] = useState<Patient | null>(null);
//   const [consultations, setConsultations] = useState<Consultation[]>([]);
//   const [appointments, setAppointments] = useState<Appointment[]>([]);
//   const [results, setResults] = useState<Result[]>([]);
//   const [doctors, setDoctors] = useState<Doctor[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [activeSection, setActiveSection] = useState("accueil");
//   const [activeSubSection, setActiveSubSection] = useState<string | null>(null);
//   const [isDropdownOpen, setIsDropdownOpen] = useState<string | null>(null);

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const token = document.cookie
//           .split("; ")
//           .find((row) => row.startsWith("token="))
//           ?.split("=")[1];

//         if (!token) {
//           setError("Aucun token trouvé. Veuillez vous reconnecter.");
//           router.replace("/auth/login?role=patient");
//           return;
//         }

//         const [patientRes, consultRes, apptRes, resultRes, doctorRes] = await Promise.all([
//           fetch("/api/patient/me", { headers: { Authorization: `Bearer ${token}` } }),
//           fetch("/api/patient/consultations", { headers: { Authorization: `Bearer ${token}` } }),
//           fetch("/api/patient/appointments", { headers: { Authorization: `Bearer ${token}` } }),
//           fetch("/api/patient/results", { headers: { Authorization: `Bearer ${token}` } }),
//           fetch("/api/medecin/available", { headers: { Authorization: `Bearer ${token}` } }),
//         ]);

//         if (!patientRes.ok) throw new Error("Échec de la récupération du profil.");
//         const patientData = await patientRes.json();
//         setPatient({
//           ...patientData,
//           bloodPressure: patientData.bloodPressure || { systolic: "", diastolic: "" },
//         });

//         if (!consultRes.ok) throw new Error("Échec de la récupération des consultations.");
//         setConsultations(await consultRes.json());

//         if (!apptRes.ok) throw new Error("Échec de la récupération des rendez-vous.");
//         setAppointments(await apptRes.json());

//         if (!resultRes.ok) throw new Error("Échec de la récupération des résultats.");
//         setResults(await resultRes.json());

//         if (!doctorRes.ok) throw new Error("Échec de la récupération des médecins.");
//         setDoctors(await doctorRes.json());
//       } catch (err: any) {
//         setError(err.message || "Erreur lors de la récupération des données.");
//         router.replace("/auth/login?role=patient");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchData();
//   }, [router]);

//   if (loading) return <div className="p-6 text-center text-gray-500">Chargement...</div>;
//   if (error) return <div className="p-6 text-center text-red-500">Erreur : {error}</div>;
//   if (!patient) return <div className="p-6 text-center text-red-500">Utilisateur non connecté</div>;

//   const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setPatient({ ...patient, [e.target.name]: e.target.value } as Patient);
//   };

//   const handleBloodPressureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const { name, value } = e.target;
//     setPatient({
//       ...patient,
//       bloodPressure: { ...patient.bloodPressure, [name]: value },
//     } as Patient);
//   };

//   const handleProfileSubmit = async () => {
//     if (!patient) return;
//     const token = document.cookie
//       .split("; ")
//       .find((row) => row.startsWith("token="))
//       ?.split("=")[1];
//     const res = await fetch("/api/patient/me", {
//       method: "PUT",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${token}`,
//       },
//       body: JSON.stringify(patient),
//     });
//     const data = await res.json();
//     console.log("Profil mis à jour :", data);
//   };

//   const handleAction = (action: string, itemId: string) => {
//     alert(`${action} pour ${itemId} simulé avec succès !`);
//   };

//   return (
//     <div className="flex h-screen bg-gray-100">
//       <aside className="w-64 bg-white shadow-lg p-4">
//         <div className="mb-6">
//           <img src="/meddata-secured-logo.png" alt="Meddata Secured" className="h-10" />
//         </div>
//         <nav className="space-y-2">
//           <button
//             onClick={() => { setActiveSection("accueil"); setActiveSubSection(null); setIsDropdownOpen(null); }}
//             className={`flex items-center w-full p-2 text-gray-700 hover:bg-blue-50 rounded-lg transition duration-200 ${activeSection === "accueil" ? "bg-blue-100 font-medium" : ""}`}
//           >
//             <HomeIcon className="h-5 w-5 mr-3" />
//             Accueil
//           </button>
//           <div className="relative">
//             <button
//               onClick={() => setIsDropdownOpen(isDropdownOpen === "profil" ? null : "profil")}
//               className={`flex items-center w-full p-2 text-gray-700 hover:bg-blue-50 rounded-lg transition duration-200 ${activeSection === "profil" ? "bg-blue-100 font-medium" : ""}`}
//             >
//               <UserIcon className="h-5 w-5 mr-3" />
//               Profil
//               <svg className={`w-4 h-4 ml-auto ${isDropdownOpen === "profil" ? "transform rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
//               </svg>
//             </button>
//             {isDropdownOpen === "profil" && (
//               <div className="absolute w-full mt-1 bg-white border rounded shadow-lg z-10">
//                 <button
//                   onClick={() => { setActiveSection("profil"); setActiveSubSection("profil"); setIsDropdownOpen(null); }}
//                   className="w-full text-left p-2 hover:bg-gray-100"
//                 >
//                   Profil
//                 </button>
//                 <button
//                   onClick={() => { setActiveSection("profil"); setActiveSubSection("editProfile"); setIsDropdownOpen(null); }}
//                   className="w-full text-left p-2 hover:bg-gray-100"
//                 >
//                   Edit Profile
//                 </button>
//               </div>
//             )}
//           </div>
//           <button
//             onClick={() => { setActiveSection("profilSante"); setActiveSubSection("profilSante"); setIsDropdownOpen(null); }}
//             className={`flex items-center w-full p-2 text-gray-700 hover:bg-blue-50 rounded-lg transition duration-200 ${activeSection === "profilSante" ? "bg-blue-100 font-medium" : ""}`}
//           >
//             <UserIcon className="h-5 w-5 mr-3" />
//             Profil de Santé
//           </button>
//           <div className="relative">
//             <button
//               onClick={() => setIsDropdownOpen(isDropdownOpen === "rendezvous" ? null : "rendezvous")}
//               className={`flex items-center w-full p-2 text-gray-700 hover:bg-blue-50 rounded-lg transition duration-200 ${activeSection === "rendezvous" ? "bg-blue-100 font-medium" : ""}`}
//             >
//               <CalendarIcon className="h-5 w-5 mr-3" />
//               Mes rendez-vous
//               <svg className={`w-4 h-4 ml-auto ${isDropdownOpen === "rendezvous" ? "transform rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
//               </svg>
//             </button>
//             {isDropdownOpen === "rendezvous" && (
//               <div className="absolute w-full mt-1 bg-white border rounded shadow-lg z-10">
//                 <button
//                   onClick={() => { setActiveSection("rendezvous"); setActiveSubSection("today"); setIsDropdownOpen(null); }}
//                   className="w-full text-left p-2 hover:bg-gray-100"
//                 >
//                   Aujourd'hui
//                 </button>
//                 <button
//                   onClick={() => { setActiveSection("rendezvous"); setActiveSubSection("month"); setIsDropdownOpen(null); }}
//                   className="w-full text-left p-2 hover:bg-gray-100"
//                 >
//                   Mois
//                 </button>
//               </div>
//             )}
//           </div>
//           <div className="relative">
//             <button
//               onClick={() => setIsDropdownOpen(isDropdownOpen === "dossiers" ? null : "dossiers")}
//               className={`flex items-center w-full p-2 text-gray-700 hover:bg-blue-50 rounded-lg transition duration-200 ${activeSection === "dossiers" ? "bg-blue-100 font-medium" : ""}`}
//             >
//               <DocumentTextIcon className="h-5 w-5 mr-3" />
//               Mes dossiers
//               <svg className={`w-4 h-4 ml-auto ${isDropdownOpen === "dossiers" ? "transform rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
//               </svg>
//             </button>
//             {isDropdownOpen === "dossiers" && (
//               <div className="absolute w-full mt-1 bg-white border rounded shadow-lg z-10">
//                 <button
//                   onClick={() => { setActiveSection("dossiers"); setActiveSubSection("dossiersMedicaux"); setIsDropdownOpen(null); }}
//                   className="w-full text-left p-2 hover:bg-gray-100"
//                 >
//                   Mes dossiers médicaux
//                 </button>
//                 <button
//                   onClick={() => { setActiveSection("dossiers"); setActiveSubSection("dossiersPartages"); setIsDropdownOpen(null); }}
//                   className="w-full text-left p-2 hover:bg-gray-100"
//                 >
//                   Dossiers partagés
//                 </button>
//               </div>
//             )}
//           </div>
//           <div className="relative">
//             <button
//               onClick={() => setIsDropdownOpen(isDropdownOpen === "chat" ? null : "chat")}
//               className={`flex items-center w-full p-2 text-gray-700 hover:bg-blue-50 rounded-lg transition duration-200 ${activeSection === "chat" ? "bg-blue-100 font-medium" : ""}`}
//             >
//               <ChatBubbleLeftIcon className="h-5 w-5 mr-3" />
//               Med Chat
//               <svg className={`w-4 h-4 ml-auto ${isDropdownOpen === "chat" ? "transform rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
//               </svg>
//             </button>
//             {isDropdownOpen === "chat" && (
//               <div className="absolute w-full mt-1 bg-white border rounded shadow-lg z-10">
//                 <button
//                   onClick={() => { setActiveSection("chat"); setActiveSubSection("messagerie"); setIsDropdownOpen(null); }}
//                   className="w-full text-left p-2 hover:bg-gray-100"
//                 >
//                   Messagerie
//                 </button>
//               </div>
//             )}
//           </div>
//           <div className="relative">
//             <button
//               onClick={() => setIsDropdownOpen(isDropdownOpen === "consultations" ? null : "consultations")}
//               className={`flex items-center w-full p-2 text-gray-700 hover:bg-blue-50 rounded-lg transition duration-200 ${activeSection === "consultations" ? "bg-blue-100 font-medium" : ""}`}
//             >
//               <ClipboardDocumentIcon className="h-5 w-5 mr-3" />
//               Mes consultations
//               <svg className={`w-4 h-4 ml-auto ${isDropdownOpen === "consultations" ? "transform rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
//               </svg>
//             </button>
//             {isDropdownOpen === "consultations" && (
//               <div className="absolute w-full mt-1 bg-white border rounded shadow-lg z-10">
//                 <button
//                   onClick={() => { setActiveSection("consultations"); setActiveSubSection("hopitaux"); setIsDropdownOpen(null); }}
//                   className="w-full text-left p-2 hover:bg-gray-100"
//                 >
//                   Hôpitaux
//                 </button>
//                 <button
//                   onClick={() => { setActiveSection("consultations"); setActiveSubSection("historique"); setIsDropdownOpen(null); }}
//                   className="w-full text-left p-2 hover:bg-gray-100"
//                 >
//                   Historique
//                 </button>
//               </div>
//             )}
//           </div>
//         </nav>
//         <div className="mt-4"></div> {/* Espacement ajouté */}
//         <button
//           onClick={() => {
//             document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
//             router.replace("/auth/login?role=patient");
//           }}
//           className="w-full text-left p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-200"
//         >
//           Se déconnecter
//         </button>
//       </aside>

//       <div className="flex-1 p-6">
//         <header className="flex justify-between items-center mb-6 bg-white p-4 rounded-lg shadow-md">
//           <h1 className="text-xl font-semibold text-gray-800">Tableau de bord / Profil / {patient?.firstName} {patient?.lastName}</h1>
//           <div className="flex space-x-4">
//             <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200">Ajouter des personnes à charge</button>
//             <div className="flex space-x-3">
//               <BellIcon className="h-6 w-6 text-gray-600 hover:text-gray-800 cursor-pointer" />
//               <Cog6ToothIcon className="h-6 w-6 text-gray-600 hover:text-gray-800 cursor-pointer" />
//             </div>
//           </div>
//         </header>

//         {activeSection === "accueil" && (
//           <section className="bg-white p-6 rounded-lg shadow-md">
//             <h1 className="text-2xl font-semibold text-gray-900 mb-4">Bienvenue, {patient?.firstName} {patient?.lastName} !</h1>
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
//               <div className="p-4 bg-blue-50 rounded-lg text-center hover:bg-blue-100 transition duration-200">
//                 <HomeIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
//                 <p className="text-gray-700 font-medium">Mes journaux</p>
//                 <p className="text-gray-500">0</p>
//               </div>
//               <div className="p-4 bg-green-50 rounded-lg text-center hover:bg-green-100 transition duration-200">
//                 <CalendarIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
//                 <p className="text-gray-700 font-medium">Mes rendez-vous</p>
//                 <p className="text-gray-500">0</p>
//               </div>
//               <div className="p-4 bg-yellow-50 rounded-lg text-center hover:bg-yellow-100 transition duration-200">
//                 <UserIcon className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
//                 <p className="text-gray-700 font-medium">Mes personnes à charge</p>
//                 <p className="text-gray-500">0</p>
//               </div>
//               <div className="p-4 bg-purple-50 rounded-lg text-center hover:bg-purple-100 transition duration-200">
//                 <ClipboardDocumentIcon className="h-8 w-8 text-purple-600 mx-auto mb-2" />
//                 <p className="text-gray-700 font-medium">Mes visites</p>
//                 <p className="text-gray-500">0</p>
//               </div>
//             </div>
//             <h2 className="text-xl font-semibold text-gray-900 mb-4">Suivi des symptômes</h2>
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               <div className="p-4 bg-gray-50 rounded-lg">
//                 <div className="space-y-3">
//                   <div className="h-6 bg-gray-200 rounded"></div>
//                   <div className="h-6 bg-gray-200 rounded"></div>
//                   <div className="h-6 bg-gray-200 rounded"></div>
//                   <div className="h-6 bg-gray-200 rounded"></div>
//                 </div>
//               </div>
//               <div className="p-4 bg-gray-50 rounded-lg">
//                 <p className="text-gray-700 font-medium mb-2">MON DIAGNOSTIC</p>
//                 <p className="text-gray-600">En cours...</p>
//                 <p className="text-gray-700 font-medium mt-4 mb-2">MON HISTORIQUE</p>
//                 <p className="text-gray-600">À consulter</p>
//                 <p className="text-gray-700 font-medium mt-4 mb-2">MES MÉDICAMENTS ACTUELS</p>
//                 <p className="text-gray-600">À jour</p>
//               </div>
//             </div>
//           </section>
//         )}

//         {activeSection === "profil" && activeSubSection === "profil" && (
//           <section>
//             <h1 className="text-3xl font-bold text-gray-900 mb-6">Mon Profil</h1>
//             <div className="bg-white p-6 rounded-lg shadow-md">
//               <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-4">
//                 <div>
//                   <h2 className="text-lg font-semibold text-gray-900">Profil</h2>
//                   <p className="text-gray-600">Comptes liés</p>
//                 </div>
//                 <div>
//                   <button className="text-gray-500 hover:text-gray-700">...</button>
//                 </div>
//               </div>
//               <div className="grid grid-cols-2 gap-4">
//                 <div className="p-4 bg-gray-50 rounded-lg">
//                   <h3 className="text-md font-medium text-gray-700 mb-2">À PROPOS</h3>
//                   <p className="text-gray-600">Ethan Williams</p>
//                   <p className="text-gray-600">AR202563311</p>
//                   <p className="text-gray-600">Dim, 6 avr 2025 13:58</p>
//                   <h3 className="text-md font-medium text-gray-700 mt-4 mb-2">CONTACTS</h3>
//                   <p className="text-gray-600">ethanrush119@gmail.com</p>
//                   <p className="text-gray-600">+2260158470</p>
//                 </div>
//                 <div className="p-4 bg-gray-50 rounded-lg">
//                   <h3 className="text-md font-medium text-gray-700 mb-2">Comptes liés</h3>
//                   <div className="flex items-center p-2 bg-white rounded-lg shadow">
//                     <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">E</span>
//                     <div className="ml-2">
//                       <p className="text-gray-900">Ethan</p>
//                       <p className="text-gray-600">123 AR202563311</p>
//                       <p className="text-gray-600">Dim, 6 avr 2025 13:58</p>
//                     </div>
//                   </div>
//                   <button className="mt-2 bg-green-100 text-green-700 px-2 py-1 rounded">Compte actif</button>
//                 </div>
//               </div>
//             </div>
//           </section>
//         )}

//         {activeSection === "profil" && activeSubSection === "editProfile" && (
//           <section>
//             <h1 className="text-3xl font-bold text-gray-900 mb-6">Edit Profile</h1>
//             <div className="bg-white p-6 rounded-lg shadow-md">
//               <div className="grid grid-cols-2 gap-4">
//                 <div className="p-4 bg-gray-50 rounded-lg">
//                   <input type="text" name="firstName" value={patient?.firstName || ""} onChange={handleProfileChange} placeholder="Prénom" className="w-full p-2 border rounded mb-2" />
//                   <input type="text" name="lastName" value={patient?.lastName || ""} onChange={handleProfileChange} placeholder="Nom" className="w-full p-2 border rounded mb-2" />
//                   <input type="text" name="email" value={patient?.email || ""} onChange={handleProfileChange} placeholder="Email" className="w-full p-2 border rounded mb-2" />
//                   <button onClick={handleProfileSubmit} className="bg-blue-600 text-white px-4 py-2 rounded mt-2">Enregistrer</button>
//                 </div>
//               </div>
//             </div>
//           </section>
//         )}

//         {activeSection === "profilSante" && activeSubSection === "profilSante" && (
//           <section>
//             <h1 className="text-3xl font-bold text-gray-900 mb-6">Profil de Santé</h1>
//             <div className="bg-white p-6 rounded-lg shadow-md">
//               <div className="flex items-center mb-6">
//                 <img src="/health-profile-banner.jpg" alt="Bannière Profil de Santé" className="w-full h-32 object-cover rounded-t-lg" />
//                 <div className="ml-4">
//                   <h2 className="text-xl font-semibold text-gray-900">{patient?.firstName} {patient?.lastName}</h2>
//                   <p className="text-gray-600">123 AR202563311</p>
//                   <p className="text-gray-600">Inscrit il y a 2 mois</p>
//                 </div>
//                 <button className="ml-auto bg-blue-600 text-white px-4 py-2 rounded">Modifier le profil</button>
//               </div>
//               <div className="grid grid-cols-2 gap-4">
//                 <div className="p-4 bg-gray-50 rounded-lg">
//                   <button className="text-blue-600 mb-2">Poids</button>
//                   <input type="text" placeholder="kg" className="w-full p-2 border rounded" />
//                   <button className="text-blue-600 mt-2">Taille</button>
//                   <input type="text" placeholder="cm" className="w-full p-2 border rounded" />
//                   <button className="text-blue-600 mt-2">Pression artérielle</button>
//                   <input type="text" placeholder="mmHg" className="w-full p-2 border rounded" />
//                   <button className="text-blue-600 mt-2">Fréquence cardiaque</button>
//                   <input type="text" placeholder="bpm" className="w-full p-2 border rounded" />
//                   <button className="text-blue-600 mt-2">Taux d'oxygène</button>
//                   <input type="text" placeholder="%" className="w-full p-2 border rounded" />
//                   <button className="text-blue-600 mt-2">Température</button>
//                   <input type="text" placeholder="°C" className="w-full p-2 border rounded" />
//                   <button className="text-blue-600 mt-2">Allergies</button>
//                   <input type="text" placeholder="" className="w-full p-2 border rounded" />
//                 </div>
//               </div>
//             </div>
//           </section>
//         )}

//         {activeSection === "rendezvous" && (
//           <section>
//             <h1 className="text-3xl font-bold text-gray-900 mb-6">Mes rendez-vous</h1>
//             <div className="bg-white p-6 rounded-lg shadow-md">
//               <div className="flex justify-between items-center mb-6">
//                 <div>
//                   <button
//                     onClick={() => setActiveSubSection("today")}
//                     className="text-blue-600 mr-2"
//                   >
//                     Aujourd'hui
//                   </button>
//                   <span className="text-gray-900">Juin 2025</span>
//                   <select
//                     value={activeSubSection === "month" ? "month" : ""}
//                     onChange={(e) => setActiveSubSection(e.target.value || null)}
//                     className="ml-2 p-1 border rounded"
//                   >
//                     <option value="">Mois</option>
//                     <option value="month">Juin 2025</option>
//                   </select>
//                 </div>
//                 <button className="bg-blue-600 text-white px-4 py-2 rounded">+ Créer un rendez-vous</button>
//               </div>
//               {activeSubSection === "today" && (
//                 <div className="p-4 bg-gray-50 rounded-lg">
//                   <p className="text-gray-600">Aucun rendez-vous aujourd'hui.</p>
//                 </div>
//               )}
//               {activeSubSection === "month" && (
//                 <div className="grid grid-cols-7 gap-1 text-center">
//                   <div className="p-2 font-semibold text-gray-500">DIM</div>
//                   <div className="p-2 font-semibold text-gray-500">LUN</div>
//                   <div className="p-2 font-semibold text-gray-500">MAR</div>
//                   <div className="p-2 font-semibold text-gray-500">MER</div>
//                   <div className="p-2 font-semibold text-gray-500">JEU</div>
//                   <div className="p-2 font-semibold text-gray-500">VEN</div>
//                   <div className="p-2 font-semibold text-gray-500">SAM</div>
//                   <div className="p-2">1</div>
//                   <div className="p-2">2</div>
//                   <div className="p-2">3</div>
//                   <div className="p-2">4</div>
//                   <div className="p-2">5</div>
//                   <div className="p-2">6</div>
//                   <div className="p-2">7</div>
//                   <div className="p-2">8</div>
//                   <div className="p-2">9</div>
//                   <div className="p-2">10</div>
//                   <div className="p-2">11</div>
//                   <div className="p-2">12</div>
//                   <div className="p-2 bg-blue-100 rounded-full">13</div>
//                   <div className="p-2">14</div>
//                   <div className="p-2">15</div>
//                   <div className="p-2">16</div>
//                   <div className="p-2">17</div>
//                   <div className="p-2">18</div>
//                   <div className="p-2">19</div>
//                   <div className="p-2">20</div>
//                   <div className="p-2">21</div>
//                 </div>
//               )}
//             </div>
//           </section>
//         )}

//         {activeSection === "dossiers" && (
//           <section>
//             <h1 className="text-3xl font-bold text-gray-900 mb-6">Mes dossiers</h1>
//             <div className="bg-white p-6 rounded-lg shadow-md">
//               {activeSubSection === "dossiersMedicaux" && (
//                 <div>
//                   <div className="flex justify-between mb-4">
//                     <h2 className="text-xl font-semibold text-gray-900">Mes dossiers médicaux</h2>
//                     <button className="bg-blue-600 text-white px-4 py-2 rounded">Téléverser</button>
//                   </div>
//                   <h3 className="text-lg font-medium text-gray-700 mb-4">Raccourcis</h3>
//                   <div className="grid grid-cols-4 gap-4 mb-6">
//                     <button className="p-4 bg-gray-50 rounded-lg text-gray-600">Historique patient</button>
//                     <button className="p-4 bg-gray-50 rounded-lg text-gray-600">Prescriptions</button>
//                     <button className="p-4 bg-gray-50 rounded-lg text-gray-600">Procédures</button>
//                     <button className="p-4 bg-gray-50 rounded-lg text-gray-600">Tests diagnostiques</button>
//                   </div>
//                   <h3 className="text-lg font-medium text-gray-700 mb-4">Fichiers récents</h3>
//                   <div className="p-4 bg-gray-50 rounded-lg">
//                     <div className="flex items-center p-2 bg-white rounded-lg shadow mb-2">
//                       <img src="/word-icon.png" alt="Word" className="w-6 h-6 mr-2" />
//                       <div>
//                         <p className="text-gray-900">ar202563311_word_1743951</p>
//                         <p className="text-gray-600">720809.docx</p>
//                         <p className="text-gray-600">ajouté Dim, 6 avr 2025 15:02</p>
//                       </div>
//                     </div>
//                   </div>
//                   <div className="mt-4 text-gray-600">Informations de prévisualisation</div>
//                   <div className="p-4 bg-gray-50 rounded-lg text-center">
//                     <img src="/preview-icon.png" alt="Prévisualisation" className="w-16 h-16 mx-auto mb-2" />
//                     <p>Cliquez sur la prévisualisation pour voir les détails d'un fichier ou dossier</p>
//                   </div>
//                 </div>
//               )}
//               {activeSubSection === "dossiersPartages" && (
//                 <div>
//                   <h2 className="text-xl font-semibold text-gray-900 mb-4">Dossiers partagés</h2>
//                   <ul className="space-y-4">
//                     {results.filter((r) => r.sharedWith?.length).map((r) => (
//                       <li key={r.id} className="p-3 bg-gray-50 rounded-lg">
//                         <p><strong>Type :</strong> {r.type}</p>
//                         <p><strong>Partagé avec :</strong> {r.sharedWith?.join(", ") || "Aucun"}</p>
//                       </li>
//                     ))}
//                   </ul>
//                 </div>
//               )}
//             </div>
//           </section>
//         )}

//         {activeSection === "chat" && activeSubSection === "messagerie" && (
//           <section>
//             <h1 className="text-3xl font-bold text-gray-900 mb-6">Med Chat</h1>
//             <div className="bg-white p-6 rounded-lg shadow-md">
//               <p className="text-gray-600">À implémenter.</p>
//             </div>
//           </section>
//         )}

//         {activeSection === "consultations" && (
//           <section>
//             <h1 className="text-3xl font-bold text-gray-900 mb-6">Mes consultations</h1>
//             <div className="bg-white p-6 rounded-lg shadow-md">
//               {activeSubSection === "hopitaux" && (
//                 <ul className="space-y-4">
//                   {consultations.map((c) => (
//                     <li key={c.id} className="p-3 bg-gray-50 rounded-lg">
//                       <p><strong>Date :</strong> {new Date(c.date).toLocaleDateString("fr-FR")}</p>
//                       <p><strong>Médecin :</strong> {c.doctorName}</p>
//                       <p><strong>Résumé :</strong> {c.summary}</p>
//                     </li>
//                   ))}
//                 </ul>
//               )}
//               {activeSubSection === "historique" && (
//                 <div className="p-4 bg-gray-50 rounded-lg">
//                   <p className="text-gray-600">Aucun historique disponible pour l'instant.</p>
//                 </div>
//               )}
//             </div>
//           </section>
//         )}
//       </div>
//     </div>
//   );
// }

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  HomeIcon, 
  UserIcon, 
  CalendarIcon, 
  DocumentTextIcon, 
  ChatBubbleLeftIcon, 
  ClipboardDocumentIcon 
} from "@heroicons/react/24/outline";
import { BellIcon, Cog6ToothIcon } from "@heroicons/react/24/outline";

interface Patient {
  id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  address?: string;
  height?: string;
  weight?: string;
  bloodPressure?: { systolic: string; diastolic: string };
  heartRate?: string;
  temperature?: string;
  oxygen?: string;
  gender?: string;
  bloodGroup?: string;
  allergies?: string;
}

interface Consultation {
  id: string;
  date: string;
  doctorName: string;
  summary: string;
  documentHash?: string;
  authorizedUsers?: string[];
}

interface Appointment {
  id: string;
  date: string;
  location: string;
  status: "Confirmé" | "En attente" | "Passé";
  isTeleconsultation?: boolean;
}

interface Result {
  id: string;
  type: string;
  date: string;
  documentHash?: string;
  sharedWith?: string[];
}

interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  speciality: string;
}

interface DependentFormData {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  password: string;
  confirmPassword: string;
}

export default function PatientDashboard() {
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState("accueil");
  const [activeSubSection, setActiveSubSection] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<DependentFormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = document.cookie
          .split("; ")
          .find((row) => row.startsWith("token="))
          ?.split("=")[1];

        if (!token) {
          setError("Aucun token trouvé. Veuillez vous reconnecter.");
          router.replace("/auth/login?role=patient");
          return;
        }

        const [patientRes, consultRes, apptRes, resultRes, doctorRes] = await Promise.all([
          fetch("/api/patient/me", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("/api/patient/consultations", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("/api/patient/appointments", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("/api/patient/results", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("/api/medecin/available", { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        if (!patientRes.ok) throw new Error("Échec de la récupération du profil.");
        const patientData = await patientRes.json();
        setPatient({
          ...patientData,
          bloodPressure: patientData.bloodPressure || { systolic: "", diastolic: "" },
        });

        if (!consultRes.ok) throw new Error("Échec de la récupération des consultations.");
        setConsultations(await consultRes.json());

        if (!apptRes.ok) throw new Error("Échec de la récupération des rendez-vous.");
        setAppointments(await apptRes.json());

        if (!resultRes.ok) throw new Error("Échec de la récupération des résultats.");
        setResults(await resultRes.json());

        if (!doctorRes.ok) throw new Error("Échec de la récupération des médecins.");
        setDoctors(await doctorRes.json());
      } catch (err: any) {
        setError(err.message || "Erreur lors de la récupération des données.");
        router.replace("/auth/login?role=patient");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  if (loading) return <div className="p-6 text-center text-gray-500">Chargement...</div>;
  if (error) return <div className="p-6 text-center text-red-500">Erreur : {error}</div>;
  if (!patient) return <div className="p-6 text-center text-red-500">Utilisateur non connecté</div>;

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPatient({ ...patient, [e.target.name]: e.target.value } as Patient);
  };

  const handleBloodPressureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPatient({
      ...patient,
      bloodPressure: { ...patient.bloodPressure, [name]: value },
    } as Patient);
  };

  const handleProfileSubmit = async () => {
    if (!patient) return;
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("token="))
      ?.split("=")[1];
    const res = await fetch("/api/patient/me", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(patient),
    });
    const data = await res.json();
    console.log("Profil mis à jour :", data);
  };

  const handleAction = (action: string, itemId: string) => {
    alert(`${action} pour ${itemId} simulé avec succès !`);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    if (formData.password !== formData.confirmPassword) {
      alert("Les mots de passe ne correspondent pas.");
      return;
    }
    console.log("Form submitted:", formData);
    setIsModalOpen(false);
    setFormData({ firstName: "", lastName: "", email: "", phone: "", password: "", confirmPassword: "" });
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-white shadow-lg p-4">
        <div className="mb-6">
          <img src="/meddata-secured-logo.png" alt="Meddata Secured" className="h-10" />
        </div>
        <nav className="space-y-2">
          <button
            onClick={() => { setActiveSection("accueil"); setActiveSubSection(null); setIsDropdownOpen(null); }}
            className={`flex items-center w-full p-2 text-gray-700 hover:bg-blue-50 rounded-lg transition duration-200 ${activeSection === "accueil" ? "bg-blue-100 font-medium" : ""}`}
          >
            <HomeIcon className="h-5 w-5 mr-3" />
            Accueil
          </button>
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(isDropdownOpen === "profil" ? null : "profil")}
              className={`flex items-center w-full p-2 text-gray-700 hover:bg-blue-50 rounded-lg transition duration-200 ${activeSection === "profil" ? "bg-blue-100 font-medium" : ""}`}
            >
              <UserIcon className="h-5 w-5 mr-3" />
              Profil
              <svg className={`w-4 h-4 ml-auto ${isDropdownOpen === "profil" ? "transform rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {isDropdownOpen === "profil" && (
              <div className="absolute w-full mt-1 bg-white border rounded shadow-lg z-10">
                <button
                  onClick={() => { setActiveSection("profil"); setActiveSubSection("profil"); setIsDropdownOpen(null); }}
                  className="w-full text-left p-2 hover:bg-gray-100"
                >
                  Profil
                </button>
                <button
                  onClick={() => { setActiveSection("profil"); setActiveSubSection("editProfile"); setIsDropdownOpen(null); }}
                  className="w-full text-left p-2 hover:bg-gray-100"
                >
                  Edit Profile
                </button>
              </div>
            )}
          </div>
          <button
            onClick={() => { setActiveSection("profilSante"); setActiveSubSection("profilSante"); setIsDropdownOpen(null); }}
            className={`flex items-center w-full p-2 text-gray-700 hover:bg-blue-50 rounded-lg transition duration-200 ${activeSection === "profilSante" ? "bg-blue-100 font-medium" : ""}`}
          >
            <UserIcon className="h-5 w-5 mr-3" />
            Profil de Santé
          </button>
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(isDropdownOpen === "rendezvous" ? null : "rendezvous")}
              className={`flex items-center w-full p-2 text-gray-700 hover:bg-blue-50 rounded-lg transition duration-200 ${activeSection === "rendezvous" ? "bg-blue-100 font-medium" : ""}`}
            >
              <CalendarIcon className="h-5 w-5 mr-3" />
              Mes rendez-vous
              <svg className={`w-4 h-4 ml-auto ${isDropdownOpen === "rendezvous" ? "transform rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {isDropdownOpen === "rendezvous" && (
              <div className="absolute w-full mt-1 bg-white border rounded shadow-lg z-10">
                <button
                  onClick={() => { setActiveSection("rendezvous"); setActiveSubSection("today"); setIsDropdownOpen(null); }}
                  className="w-full text-left p-2 hover:bg-gray-100"
                >
                  Aujourd'hui
                </button>
                <button
                  onClick={() => { setActiveSection("rendezvous"); setActiveSubSection("month"); setIsDropdownOpen(null); }}
                  className="w-full text-left p-2 hover:bg-gray-100"
                >
                  Mois
                </button>
              </div>
            )}
          </div>
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(isDropdownOpen === "dossiers" ? null : "dossiers")}
              className={`flex items-center w-full p-2 text-gray-700 hover:bg-blue-50 rounded-lg transition duration-200 ${activeSection === "dossiers" ? "bg-blue-100 font-medium" : ""}`}
            >
              <DocumentTextIcon className="h-5 w-5 mr-3" />
              Mes dossiers
              <svg className={`w-4 h-4 ml-auto ${isDropdownOpen === "dossiers" ? "transform rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {isDropdownOpen === "dossiers" && (
              <div className="absolute w-full mt-1 bg-white border rounded shadow-lg z-10">
                <button
                  onClick={() => { setActiveSection("dossiers"); setActiveSubSection("dossiersMedicaux"); setIsDropdownOpen(null); }}
                  className="w-full text-left p-2 hover:bg-gray-100"
                >
                  Mes dossiers médicaux
                </button>
                <button
                  onClick={() => { setActiveSection("dossiers"); setActiveSubSection("dossiersPartages"); setIsDropdownOpen(null); }}
                  className="w-full text-left p-2 hover:bg-gray-100"
                >
                  Dossiers partagés
                </button>
              </div>
            )}
          </div>
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(isDropdownOpen === "chat" ? null : "chat")}
              className={`flex items-center w-full p-2 text-gray-700 hover:bg-blue-50 rounded-lg transition duration-200 ${activeSection === "chat" ? "bg-blue-100 font-medium" : ""}`}
            >
              <ChatBubbleLeftIcon className="h-5 w-5 mr-3" />
              Med Chat
              <svg className={`w-4 h-4 ml-auto ${isDropdownOpen === "chat" ? "transform rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {isDropdownOpen === "chat" && (
              <div className="absolute w-full mt-1 bg-white border rounded shadow-lg z-10">
                <button
                  onClick={() => { setActiveSection("chat"); setActiveSubSection("messagerie"); setIsDropdownOpen(null); }}
                  className="w-full text-left p-2 hover:bg-gray-100"
                >
                  Messagerie
                </button>
              </div>
            )}
          </div>
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(isDropdownOpen === "consultations" ? null : "consultations")}
              className={`flex items-center w-full p-2 text-gray-700 hover:bg-blue-50 rounded-lg transition duration-200 ${activeSection === "consultations" ? "bg-blue-100 font-medium" : ""}`}
            >
              <ClipboardDocumentIcon className="h-5 w-5 mr-3" />
              Mes consultations
              <svg className={`w-4 h-4 ml-auto ${isDropdownOpen === "consultations" ? "transform rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {isDropdownOpen === "consultations" && (
              <div className="absolute w-full mt-1 bg-white border rounded shadow-lg z-10">
                <button
                  onClick={() => { setActiveSection("consultations"); setActiveSubSection("hopitaux"); setIsDropdownOpen(null); }}
                  className="w-full text-left p-2 hover:bg-gray-100"
                >
                  Hôpitaux
                </button>
                <button
                  onClick={() => { setActiveSection("consultations"); setActiveSubSection("historique"); setIsDropdownOpen(null); }}
                  className="w-full text-left p-2 hover:bg-gray-100"
                >
                  Historique
                </button>
              </div>
            )}
          </div>
        </nav>
        <div className="mt-4"></div>
        <button
          onClick={() => {
            document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
            router.replace("/auth/login?role=patient");
          }}
          className="w-full text-left p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-200"
        >
          Se déconnecter
        </button>
      </aside>

      <div className="flex-1 p-6">
        <header className="flex justify-between items-center mb-6 bg-white p-4 rounded-lg shadow-md">
          <h1 className="text-xl font-semibold text-gray-800">Tableau de bord / Profil / {patient?.firstName} {patient?.lastName}</h1>
          <div className="flex space-x-4">
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200"
            >
              Ajouter des personnes à charge
            </button>
            <div className="flex space-x-3">
              <BellIcon className="h-6 w-6 text-gray-600 hover:text-gray-800 cursor-pointer" />
              <Cog6ToothIcon className="h-6 w-6 text-gray-600 hover:text-gray-800 cursor-pointer" />
            </div>
          </div>
        </header>

        {activeSection === "accueil" && (
          <section className="bg-white p-6 rounded-lg shadow-md">
            <h1 className="text-2xl font-semibold text-gray-900 mb-4">Bienvenue, {patient?.firstName} {patient?.lastName} !</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <div className="p-4 bg-blue-50 rounded-lg text-center hover:bg-blue-100 transition duration-200">
                <HomeIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="text-gray-700 font-medium">Mes journaux</p>
                <p className="text-gray-500">0</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg text-center hover:bg-green-100 transition duration-200">
                <CalendarIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-gray-700 font-medium">Mes rendez-vous</p>
                <p className="text-gray-500">0</p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg text-center hover:bg-yellow-100 transition duration-200">
                <UserIcon className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                <p className="text-gray-700 font-medium">Mes personnes à charge</p>
                <p className="text-gray-500">0</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg text-center hover:bg-purple-100 transition duration-200">
                <ClipboardDocumentIcon className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <p className="text-gray-700 font-medium">Mes visites</p>
                <p className="text-gray-500">0</p>
              </div>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Suivi des symptômes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="space-y-3">
                  <div className="h-6 bg-gray-200 rounded"></div>
                  <div className="h-6 bg-gray-200 rounded"></div>
                  <div className="h-6 bg-gray-200 rounded"></div>
                  <div className="h-6 bg-gray-200 rounded"></div>
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700 font-medium mb-2">MON DIAGNOSTIC</p>
                <p className="text-gray-600">En cours...</p>
                <p className="text-gray-700 font-medium mt-4 mb-2">MON HISTORIQUE</p>
                <p className="text-gray-600">À consulter</p>
                <p className="text-gray-700 font-medium mt-4 mb-2">MES MÉDICAMENTS ACTUELS</p>
                <p className="text-gray-600">À jour</p>
              </div>
            </div>
          </section>
        )}

        {activeSection === "profil" && activeSubSection === "profil" && (
          <section>
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Mon Profil</h1>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Profil</h2>
                  <p className="text-gray-600">Comptes liés</p>
                </div>
                <div>
                  <button className="text-gray-500 hover:text-gray-700">...</button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-md font-medium text-gray-700 mb-2">À PROPOS</h3>
                  <p className="text-gray-600">Ethan Williams</p>
                  <p className="text-gray-600">AR202563311</p>
                  <p className="text-gray-600">Dim, 6 avr 2025 13:58</p>
                  <h3 className="text-md font-medium text-gray-700 mt-4 mb-2">CONTACTS</h3>
                  <p className="text-gray-600">ethanrush119@gmail.com</p>
                  <p className="text-gray-600">+2260158470</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-md font-medium text-gray-700 mb-2">Comptes liés</h3>
                  <div className="flex items-center p-2 bg-white rounded-lg shadow">
                    <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">E</span>
                    <div className="ml-2">
                      <p className="text-gray-900">Ethan</p>
                      <p className="text-gray-600">123 AR202563311</p>
                      <p className="text-gray-600">Dim, 6 avr 2025 13:58</p>
                    </div>
                  </div>
                  <button className="mt-2 bg-green-100 text-green-700 px-2 py-1 rounded">Compte actif</button>
                </div>
              </div>
            </div>
          </section>
        )}

        {activeSection === "profil" && activeSubSection === "editProfile" && (
          <section>
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Edit Profile</h1>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <input type="text" name="firstName" value={patient?.firstName || ""} onChange={handleProfileChange} placeholder="Prénom" className="w-full p-2 border rounded mb-2" />
                  <input type="text" name="lastName" value={patient?.lastName || ""} onChange={handleProfileChange} placeholder="Nom" className="w-full p-2 border rounded mb-2" />
                  <input type="text" name="email" value={patient?.email || ""} onChange={handleProfileChange} placeholder="Email" className="w-full p-2 border rounded mb-2" />
                  <button onClick={handleProfileSubmit} className="bg-blue-600 text-white px-4 py-2 rounded mt-2">Enregistrer</button>
                </div>
              </div>
            </div>
          </section>
        )}

        {activeSection === "profilSante" && activeSubSection === "profilSante" && (
          <section>
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Profil de Santé</h1>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center mb-6">
                <img src="/health-profile-banner.jpg" alt="Bannière Profil de Santé" className="w-full h-32 object-cover rounded-t-lg" />
                <div className="ml-4">
                  <h2 className="text-xl font-semibold text-gray-900">{patient?.firstName} {patient?.lastName}</h2>
                  <p className="text-gray-600">123 AR202563311</p>
                  <p className="text-gray-600">Inscrit il y a 2 mois</p>
                </div>
                <button className="ml-auto bg-blue-600 text-white px-4 py-2 rounded">Modifier le profil</button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <button className="text-blue-600 mb-2">Poids</button>
                  <input type="text" placeholder="kg" className="w-full p-2 border rounded" />
                  <button className="text-blue-600 mt-2">Taille</button>
                  <input type="text" placeholder="cm" className="w-full p-2 border rounded" />
                  <button className="text-blue-600 mt-2">Pression artérielle</button>
                  <input type="text" placeholder="mmHg" className="w-full p-2 border rounded" />
                  <button className="text-blue-600 mt-2">Fréquence cardiaque</button>
                  <input type="text" placeholder="bpm" className="w-full p-2 border rounded" />
                  <button className="text-blue-600 mt-2">Taux d'oxygène</button>
                  <input type="text" placeholder="%" className="w-full p-2 border rounded" />
                  <button className="text-blue-600 mt-2">Température</button>
                  <input type="text" placeholder="°C" className="w-full p-2 border rounded" />
                  <button className="text-blue-600 mt-2">Allergies</button>
                  <input type="text" placeholder="" className="w-full p-2 border rounded" />
                </div>
              </div>
            </div>
          </section>
        )}

        {activeSection === "rendezvous" && (
          <section>
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Mes rendez-vous</h1>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <button
                    onClick={() => setActiveSubSection("today")}
                    className="text-blue-600 mr-2"
                  >
                    Aujourd'hui
                  </button>
                  <span className="text-gray-900">Juin 2025</span>
                  <select
                    value={activeSubSection === "month" ? "month" : ""}
                    onChange={(e) => setActiveSubSection(e.target.value || null)}
                    className="ml-2 p-1 border rounded"
                  >
                    <option value="">Mois</option>
                    <option value="month">Juin 2025</option>
                  </select>
                </div>
                <button className="bg-blue-600 text-white px-4 py-2 rounded">+ Créer un rendez-vous</button>
              </div>
              {activeSubSection === "today" && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-600">Aucun rendez-vous aujourd'hui.</p>
                </div>
              )}
              {activeSubSection === "month" && (
                <div className="grid grid-cols-7 gap-1 text-center">
                  <div className="p-2 font-semibold text-gray-500">DIM</div>
                  <div className="p-2 font-semibold text-gray-500">LUN</div>
                  <div className="p-2 font-semibold text-gray-500">MAR</div>
                  <div className="p-2 font-semibold text-gray-500">MER</div>
                  <div className="p-2 font-semibold text-gray-500">JEU</div>
                  <div className="p-2 font-semibold text-gray-500">VEN</div>
                  <div className="p-2 font-semibold text-gray-500">SAM</div>
                  <div className="p-2">1</div>
                  <div className="p-2">2</div>
                  <div className="p-2">3</div>
                  <div className="p-2">4</div>
                  <div className="p-2">5</div>
                  <div className="p-2">6</div>
                  <div className="p-2">7</div>
                  <div className="p-2">8</div>
                  <div className="p-2">9</div>
                  <div className="p-2">10</div>
                  <div className="p-2">11</div>
                  <div className="p-2">12</div>
                  <div className="p-2 bg-blue-100 rounded-full">13</div>
                  <div className="p-2">14</div>
                  <div className="p-2">15</div>
                  <div className="p-2">16</div>
                  <div className="p-2">17</div>
                  <div className="p-2">18</div>
                  <div className="p-2">19</div>
                  <div className="p-2">20</div>
                  <div className="p-2">21</div>
                </div>
              )}
            </div>
          </section>
        )}

        {activeSection === "dossiers" && (
          <section>
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Mes dossiers</h1>
            <div className="bg-white p-6 rounded-lg shadow-md">
              {activeSubSection === "dossiersMedicaux" && (
                <div>
                  <div className="flex justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Mes dossiers médicaux</h2>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded">Téléverser</button>
                  </div>
                  <h3 className="text-lg font-medium text-gray-700 mb-4">Raccourcis</h3>
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    <button className="p-4 bg-gray-50 rounded-lg text-gray-600">Historique patient</button>
                    <button className="p-4 bg-gray-50 rounded-lg text-gray-600">Prescriptions</button>
                    <button className="p-4 bg-gray-50 rounded-lg text-gray-600">Procédures</button>
                    <button className="p-4 bg-gray-50 rounded-lg text-gray-600">Tests diagnostiques</button>
                  </div>
                  <h3 className="text-lg font-medium text-gray-700 mb-4">Fichiers récents</h3>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center p-2 bg-white rounded-lg shadow mb-2">
                      <img src="/word-icon.png" alt="Word" className="w-6 h-6 mr-2" />
                      <div>
                        <p className="text-gray-900">ar202563311_word_1743951</p>
                        <p className="text-gray-600">720809.docx</p>
                        <p className="text-gray-600">ajouté Dim, 6 avr 2025 15:02</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 text-gray-600">Informations de prévisualisation</div>
                  <div className="p-4 bg-gray-50 rounded-lg text-center">
                    <img src="/preview-icon.png" alt="Prévisualisation" className="w-16 h-16 mx-auto mb-2" />
                    <p>Cliquez sur la prévisualisation pour voir les détails d'un fichier ou dossier</p>
                  </div>
                </div>
              )}
              {activeSubSection === "dossiersPartages" && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Dossiers partagés</h2>
                  <ul className="space-y-4">
                    {results.filter((r) => r.sharedWith?.length).map((r) => (
                      <li key={r.id} className="p-3 bg-gray-50 rounded-lg">
                        <p><strong>Type :</strong> {r.type}</p>
                        <p><strong>Partagé avec :</strong> {r.sharedWith?.join(", ") || "Aucun"}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}

        {activeSection === "chat" && activeSubSection === "messagerie" && (
          <section>
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Med Chat</h1>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <p className="text-gray-600">À implémenter.</p>
            </div>
          </section>
        )}

        {activeSection === "consultations" && (
          <section>
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Mes consultations</h1>
            <div className="bg-white p-6 rounded-lg shadow-md">
              {activeSubSection === "hopitaux" && (
                <ul className="space-y-4">
                  {consultations.map((c) => (
                    <li key={c.id} className="p-3 bg-gray-50 rounded-lg">
                      <p><strong>Date :</strong> {new Date(c.date).toLocaleDateString("fr-FR")}</p>
                      <p><strong>Médecin :</strong> {c.doctorName}</p>
                      <p><strong>Résumé :</strong> {c.summary}</p>
                    </li>
                  ))}
                </ul>
              )}
              {activeSubSection === "historique" && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-600">Aucun historique disponible pour l'instant.</p>
                </div>
              )}
            </div>
          </section>
        )}

        {isModalOpen && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-96">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Ajouter une personne à charge</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                  ×
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Prénom *</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleFormChange}
                    className="mt-1 p-2 w-full border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nom de famille</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleFormChange}
                    className="mt-1 p-2 w-full border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">E-mail (facultatif)</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleFormChange}
                    className="mt-1 p-2 w-full border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Téléphone (facultatif)</label>
                  <div className="flex space-x-2">
                    <select
                      name="phoneCountry"
                      onChange={handleFormChange}
                      className="mt-1 p-2 w-1/3 border rounded"
                    >
                      <option>Sélectionnez un pays</option>
                      <option value="+1">+1 (USA)</option>
                      <option value="+33">+33 (France)</option>
                      <option value="+226">+226 (Burkina Faso)</option>
                    </select>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleFormChange}
                      className="mt-1 p-2 w-2/3 border rounded"
                      placeholder="xxx-xxx-xxxx"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Mot de passe *</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleFormChange}
                    className="mt-1 p-2 w-full border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Confirmez le mot de passe *</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleFormChange}
                    className="mt-1 p-2 w-full border rounded"
                  />
                </div>
                <button
                  onClick={handleSubmit}
                  className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
                >
                  Ajouter une personne à charge
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}