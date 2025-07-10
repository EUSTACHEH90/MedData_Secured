
// // "use client";

// // import { useEffect, useState } from "react";
// // import { useRouter } from "next/navigation";
// // import {
// //   HomeIcon,
// //   UserIcon,
// //   CalendarIcon,
// //   DocumentTextIcon,
// //   ClipboardDocumentIcon,
// //   BellIcon,
// //   Cog6ToothIcon,
// // } from "@heroicons/react/24/outline";
// // import { Button } from "@/components/ui/button";
// // import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// // import { Input } from "@/components/ui/input";
// // import { Textarea } from "@/components/ui/textarea";
// // import { Checkbox } from "@/components/ui/checkbox";
// // import Link from "next/link";

// // interface Patient {
// //   id: string;
// //   firstName: string;
// //   lastName: string;
// //   birthDate: string;
// //   dossier: string;
// // }

// // interface Notification {
// //   id: string;
// //   message: string;
// //   date: string;
// //   read: boolean;
// //   patientId?: string;
// // }

// // interface Result {
// //   id: string;
// //   type: string;
// //   date: string;
// //   description: string;
// //   fileUrl?: string;
// //   patientId: string;
// //   patient: { id: string; firstName: string; lastName: string };
// // }

// // interface RendezVous {
// //   id: string;
// //   date: string;
// //   location: string;
// //   status: string;
// //   isTeleconsultation: boolean;
// //   patientId: string;
// //   newDate?: string;
// // }

// // interface Consultation {
// //   id: string;
// //   date: string;
// //   summary: string;
// //   patientId: string;
// //   patient: { firstName: string; lastName: string };
// // }

// // interface Doctor {
// //   id: string;
// //   firstName: string;
// //   lastName: string;
// //   email: string;
// //   speciality: string;
// //   phoneNumber?: string;
// //   address?: string;
// // }

// // interface MedecinResponse {
// //   doctor?: Doctor;
// //   patients?: Patient[];
// //   allPatients?: Patient[]; // Added to fetch all patients
// //   notifications?: Notification[];
// //   sharedResults?: Result[];
// //   rendezvous?: RendezVous[];
// //   consultations?: Consultation[];
// // }

// // export default function DashboardMedecin() {
// //   const router = useRouter();
// //   const [doctor, setDoctor] = useState<Doctor | null>(null);
// //   const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
// //   const [patients, setPatients] = useState<Patient[]>([]);
// //   const [allPatients, setAllPatients] = useState<Patient[]>([]); // State for all patients
// //   const [notifications, setNotifications] = useState<Notification[]>([]);
// //   const [sharedResults, setSharedResults] = useState<Result[]>([]);
// //   const [rendezvous, setRendezvous] = useState<RendezVous[]>([]);
// //   const [consultations, setConsultations] = useState<Consultation[]>([]);
// //   const [search, setSearch] = useState("");
// //   const [loading, setLoading] = useState(true);
// //   const [error, setError] = useState<string | null>(null);
// //   const [activeSection, setActiveSection] = useState("accueil");
// //   const [activeSubSection, setActiveSubSection] = useState<string | null>(null);
// //   const [isDropdownOpen, setIsDropdownOpen] = useState<string | null>(null);
// //   const [showNotifPanel, setShowNotifPanel] = useState(false);
// //   const [showAccessRequest, setShowAccessRequest] = useState(false);
// //   const [requestPatientId, setRequestPatientId] = useState<string | null>(null);
// //   const [patientAccessApproved, setPatientAccessApproved] = useState<boolean>(false); // Nouvel état pour l'approbation

// //   const [showConsultModal, setShowConsultModal] = useState(false);
// //   const [consultDate, setConsultDate] = useState("");
// //   const [consultSummary, setConsultSummary] = useState("");
// //   const [consultError, setConsultError] = useState<string | null>(null);

// //   const [showRdvModal, setShowRdvModal] = useState(false);
// //   const [rdvDate, setRdvDate] = useState("");
// //   const [rdvLocation, setRdvLocation] = useState("");
// //   const [rdvIsTeleconsultation, setRdvIsTeleconsultation] = useState(false);
// //   const [rdvError, setRdvError] = useState<string | null>(null);

// //   const [showResultModal, setShowResultModal] = useState(false);
// //   const [resultType, setResultType] = useState("");
// //   const [resultDate, setResultDate] = useState("");
// //   const [resultDescription, setResultDescription] = useState("");
// //   const [resultFileUrl, setResultFileUrl] = useState("");
// //   const [resultIsShared, setResultIsShared] = useState(false);
// //   const [resultError, setResultError] = useState<string | null>(null);

// //   const [showProfileModal, setShowProfileModal] = useState(false);
// //   const [profileFormData, setProfileFormData] = useState<Doctor>({
// //     id: "",
// //     firstName: "",
// //     lastName: "",
// //     email: "",
// //     speciality: "",
// //     phoneNumber: "",
// //     address: "",
// //   });
// //   const [profileError, setProfileError] = useState<string | null>(null);

// //   useEffect(() => {
// //     const fetchMedecinData = async () => {
// //       try {
// //         const token = document.cookie
// //           .split("; ")
// //           .find((row) => row.startsWith("token="))
// //           ?.split("=")[1];

// //         if (!token) {
// //           throw new Error("Aucun token trouvé. Redirection...");
// //         }

// //         const role = document.cookie
// //           .split("; ")
// //           .find((row) => row.startsWith("role="))
// //           ?.split("=")[1]?.toLowerCase();
// //         if (role !== "medecin") {
// //           throw new Error("Rôle invalide. Redirection...");
// //         }

// //         const [meRes, rdvRes, consultRes, resultsRes, allPatientsRes] = await Promise.all([
// //           fetch("/api/medecin/me", {
// //             headers: { Authorization: `Bearer ${token}` },
// //             credentials: "include",
// //             cache: "no-store",
// //           }),
// //           fetch("/api/medecin/appointments", {
// //             headers: { Authorization: `Bearer ${token}` },
// //             credentials: "include",
// //             cache: "no-store",
// //           }),
// //           fetch("/api/medecin/consultations", {
// //             headers: { Authorization: `Bearer ${token}` },
// //             credentials: "include",
// //             cache: "no-store",
// //           }),
// //           fetch("/api/medecin/results", {
// //             headers: { Authorization: `Bearer ${token}` },
// //             credentials: "include",
// //             cache: "no-store",
// //           }),
// //           fetch("/api/patients/all", {
// //             headers: { Authorization: `Bearer ${token}` },
// //             credentials: "include",
// //             cache: "no-store",
// //           }),
// //         ]);

// //         if (!meRes.ok) throw new Error(`Erreur API /medecin/me: ${meRes.statusText}`);
// //         if (!rdvRes.ok) throw new Error(`Erreur API /medecin/appointments: ${rdvRes.statusText}`);
// //         if (!consultRes.ok) throw new Error(`Erreur API /medecin/consultations: ${consultRes.statusText}`);
// //         if (!resultsRes.ok) throw new Error(`Erreur API /medecin/results: ${resultsRes.statusText}`);
// //         if (!allPatientsRes.ok) throw new Error(`Erreur API /patients/all: ${allPatientsRes.statusText}`);

// //         const data: MedecinResponse = await meRes.json();
// //         const rdvData: RendezVous[] = await rdvRes.json();
// //         const consultData: Consultation[] = await consultRes.json();
// //         const resultsData: Result[] = await resultsRes.json();
// //         const allPatientsData: Patient[] = await allPatientsRes.json();

// //         setDoctor(data.doctor || null);
// //         setPatients(data.patients || []);
// //         setAllPatients(allPatientsData || []); // Set all patients
// //         setNotifications(data.notifications || []);
// //         setRendezvous(rdvData || []);
// //         setConsultations(consultData || []);
// //         setSharedResults(resultsData || []);

// //         if (data.doctor) {
// //           setProfileFormData({
// //             id: data.doctor.id,
// //             firstName: data.doctor.firstName,
// //             lastName: data.doctor.lastName,
// //             email: data.doctor.email,
// //             speciality: data.doctor.speciality,
// //             phoneNumber: data.doctor.phoneNumber || "",
// //             address: data.doctor.address || "",
// //           });
// //         }
// //       } catch (err: any) {
// //         setError(err.message || "Une erreur est survenue lors du chargement des données.");
// //         router.replace("/auth/login?role=medecin");
// //       } finally {
// //         setLoading(false);
// //       }
// //     };

// //     fetchMedecinData();
// //   }, [router]);

// //   const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
// //     const { name, value } = e.target;
// //     setProfileFormData((prev) => ({ ...prev, [name]: value }));
// //   };

// //   const handleProfileSubmit = async () => {
// //     try {
// //       const token = document.cookie
// //         .split("; ")
// //         .find((row) => row.startsWith("token="))
// //         ?.split("=")[1];

// //       const res = await fetch("/api/medecin/me", {
// //         method: "PUT",
// //         headers: {
// //           Authorization: `Bearer ${token}`,
// //           "Content-Type": "application/json",
// //         },
// //         body: JSON.stringify({
// //           firstName: profileFormData.firstName,
// //           lastName: profileFormData.lastName,
// //           email: profileFormData.email,
// //           speciality: profileFormData.speciality,
// //           phoneNumber: profileFormData.phoneNumber,
// //           address: profileFormData.address,
// //         }),
// //       });

// //       if (!res.ok) throw new Error(await res.text());
// //       const updatedDoctor: Doctor = await res.json();
// //       setDoctor(updatedDoctor);
// //       setShowProfileModal(false);
// //       setProfileError(null);
// //       alert("Profil mis à jour avec succès !");
// //     } catch (err: any) {
// //       setProfileError(err.message);
// //     }
// //   };

// //   const sendNotification = async (patientId: string, message: string) => {
// //   try {
// //     const token = document.cookie
// //       .split("; ")
// //       .find((row) => row.startsWith("token="))
// //       ?.split("=")[1];
// //     console.log("Token utilisé :", token);
// //     console.log("Envoi de notification à patientId :", patientId); // Log pour vérifier le destinataire

// //     if (!token) {
// //       throw new Error("Aucun token trouvé.");
// //     }

// //     const res = await fetch("/api/patient/notifications", {
// //       method: "POST",
// //       headers: {
// //         Authorization: `Bearer ${token}`,
// //         "Content-Type": "application/json",
// //       },
// //       body: JSON.stringify({ patientId, message }),
// //       credentials: "include",
// //     });

// //     if (!res.ok) {
// //       const errorText = await res.text();
// //       throw new Error(`Erreur HTTP ${res.status}: ${errorText}`);
// //     }

// //     const newNotification: Notification = await res.json();
// //     setNotifications((prev) => [...prev, newNotification]); // Cette ligne peut poser problème
// //   } catch (err: any) {
// //     console.error("Erreur d'envoi de notification :", err.message);
// //   }
// // };

// //   const manageAppointment = async (appointmentId: string, action: "approve" | "reject" | "reschedule") => {
// //     try {
// //       const token = document.cookie
// //         .split("; ")
// //         .find((row) => row.startsWith("token="))
// //         ?.split("=")[1];
// //       let updatedRdv = null;

// //       if (action === "reschedule") {
// //         const newDate = prompt("Entrez la nouvelle date (YYYY-MM-DD HH:MM):");
// //         if (newDate) {
// //           const res = await fetch(`/api/medecin/appointments/${appointmentId}`, {
// //             method: "PATCH",
// //             headers: {
// //               Authorization: `Bearer ${token}`,
// //               "Content-Type": "application/json",
// //             },
// //             body: JSON.stringify({ status: "Confirmé", newDate }),
// //           });
// //           if (!res.ok) throw new Error(`Erreur lors de la reprogrammation: ${res.statusText}`);
// //           updatedRdv = await res.json();
// //         }
// //       } else {
// //         const res = await fetch(`/api/medecin/appointments/${appointmentId}`, {
// //           method: "PATCH",
// //           headers: {
// //             Authorization: `Bearer ${token}`,
// //             "Content-Type": "application/json",
// //           },
// //           body: JSON.stringify({ status: action === "approve" ? "Confirmé" : "Rejeté" }),
// //         });
// //         if (!res.ok) throw new Error(`Erreur lors de la gestion du rendez-vous: ${res.statusText}`);
// //         updatedRdv = await res.json();
// //       }

// //       setRendezvous((prev) =>
// //         prev.map((rdv) =>
// //           rdv.id === appointmentId ? { ...rdv, ...updatedRdv, status: updatedRdv.status } : rdv
// //         )
// //       );

// //       const patient = patients.find((p) => p.id === updatedRdv.patientId);
// //       if (patient) {
// //         sendNotification(patient.id, `Votre rendez-vous a été ${action === "approve" ? "approuvé" : action === "reject" ? "rejeté" : "reprogrammé"}.`);
// //       }
// //     } catch (err: any) {
// //       console.error("Erreur de gestion du rendez-vous:", err.message);
// //     }
// //   };

// //   const handleConsultSubmit = async (e: React.FormEvent) => {
// //     e.preventDefault();
// //     if (!selectedPatient || !patientAccessApproved) return;

// //     try {
// //       const token = document.cookie
// //         .split("; ")
// //         .find((row) => row.startsWith("token="))
// //         ?.split("=")[1];

// //       const res = await fetch("/api/medecin/consultations", {
// //         method: "POST",
// //         headers: {
// //           Authorization: `Bearer ${token}`,
// //           "Content-Type": "application/json",
// //         },
// //         body: JSON.stringify({
// //           patientId: selectedPatient.id,
// //           date: consultDate,
// //           summary: consultSummary,
// //         }),
// //       });

// //       if (!res.ok) throw new Error(await res.text());
// //       const newConsult: Consultation = await res.json();
// //       setConsultations((prev) => [...prev, newConsult]);
// //       setShowConsultModal(false);
// //       setConsultDate("");
// //       setConsultSummary("");
// //       setConsultError(null);
// //       sendNotification(selectedPatient.id, "Une nouvelle consultation a été ajoutée à votre dossier.");
// //     } catch (err: any) {
// //       setConsultError(err.message);
// //     }
// //   };

// //   const handleRdvSubmit = async (e: React.FormEvent) => {
// //     e.preventDefault();
// //     if (!selectedPatient || !patientAccessApproved) return;

// //     try {
// //       const token = document.cookie
// //         .split("; ")
// //         .find((row) => row.startsWith("token="))
// //         ?.split("=")[1];

// //       const res = await fetch("/api/medecin/appointments", {
// //         method: "POST",
// //         headers: {
// //           Authorization: `Bearer ${token}`,
// //           "Content-Type": "application/json",
// //         },
// //         body: JSON.stringify({
// //           patientId: selectedPatient.id,
// //           date: rdvDate,
// //           location: rdvLocation,
// //           isTeleconsultation: rdvIsTeleconsultation,
// //         }),
// //       });

// //       if (!res.ok) throw new Error(await res.text());
// //       const newRdv: RendezVous = await res.json();
// //       setRendezvous((prev) => [...prev, newRdv]);
// //       setShowRdvModal(false);
// //       setRdvDate("");
// //       setRdvLocation("");
// //       setRdvIsTeleconsultation(false);
// //       setRdvError(null);
// //       sendNotification(selectedPatient.id, "Un nouveau rendez-vous a été programmé.");
// //     } catch (err: any) {
// //       setRdvError(err.message);
// //     }
// //   };

// //   const handleResultSubmit = async (e: React.FormEvent) => {
// //     e.preventDefault();
// //     if (!selectedPatient || !patientAccessApproved) return;

// //     try {
// //       const token = document.cookie
// //         .split("; ")
// //         .find((row) => row.startsWith("token="))
// //         ?.split("=")[1];

// //       const res = await fetch("/api/medecin/results", {
// //         method: "POST",
// //         headers: {
// //           Authorization: `Bearer ${token}`,
// //           "Content-Type": "application/json",
// //         },
// //         body: JSON.stringify({
// //           patientId: selectedPatient.id,
// //           type: resultType,
// //           date: resultDate,
// //           description: resultDescription,
// //           fileUrl: resultFileUrl,
// //           isShared: resultIsShared,
// //         }),
// //       });

// //       if (!res.ok) throw new Error(await res.text());
// //       const newResult: Result = await res.json();
// //       setSharedResults((prev) => [...prev, newResult]);
// //       setShowResultModal(false);
// //       setResultType("");
// //       setResultDate("");
// //       setResultDescription("");
// //       setResultFileUrl("");
// //       setResultIsShared(false);
// //       setResultError(null);
// //       sendNotification(selectedPatient.id, "Un nouveau résultat a été ajouté à votre dossier.");
// //     } catch (err: any) {
// //       setResultError(err.message);
// //     }
// //   };

// //   const filteredPatients = allPatients.filter((p) =>
// //     `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase())
// //   );

// //   const newNotifications = notifications.filter((n) => !n.read);
// //   const allNotifications = [...notifications].sort(
// //     (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
// //   );

// //   const toggleReadNotification = (id: string) => {
// //     setNotifications((prev) =>
// //       prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
// //     );
// //   };

// //   const handlePatientSelect = (patientId: string) => {
// //     setRequestPatientId(patientId);
// //     setShowAccessRequest(true);
// //   };

// //   const confirmAccess = () => {
// //     if (requestPatientId) {
// //       const patient = allPatients.find((p) => p.id === requestPatientId);
// //       if (patient) {
// //         setSelectedPatient(patient);
// //         // Ici, on envoie une notification au patient pour demander l'accès
// //         sendNotification(patient.id, "Le Dr. [Nom] demande l'accès à votre dossier. Veuillez accepter.");
// //       }
// //     }
// //     setShowAccessRequest(false);
// //     setRequestPatientId(null);
// //     setPatientAccessApproved(false); // L'accès n'est pas encore approuvé
// //   };

// //   const approvePatientAccess = (patientId: string) => {
// //     // Simule l'approbation par le patient (à remplacer par une API réelle)
// //     if (selectedPatient && selectedPatient.id === patientId) {
// //       setPatientAccessApproved(true);
// //       sendNotification(patientId, "L'accès à votre dossier a été approuvé par le patient.");
// //     }
// //   };

// //   if (loading) return <div className="p-6 text-center text-gray-500">Chargement...</div>;
// //   if (error) return <div className="p-6 text-center text-red-500">Erreur : {error}</div>;
// //   if (!doctor) return <div className="p-6 text-center text-red-500">Utilisateur non connecté</div>;

// //   return (
// //     <div className="flex h-screen bg-gray-100">
// //       <aside className="w-64 bg-white shadow-lg p-4">
// //         <div className="mb-6">
// //           <img src="/assets/images/logo.png" alt="Meddata Secured" className="h-10" />
// //         </div>
// //         <nav className="space-y-2">
// //           <button
// //             onClick={() => {
// //               setActiveSection("accueil");
// //               setActiveSubSection(null);
// //               setIsDropdownOpen(null);
// //             }}
// //             className={`flex items-center w-full p-2 text-gray-700 hover:bg-blue-50 rounded-lg transition duration-200 ${
// //               activeSection === "accueil" ? "bg-blue-100 font-medium" : ""
// //             }`}
// //           >
// //             <HomeIcon className="h-5 w-5 mr-3" />
// //             Accueil
// //           </button>
// //           <div className="relative">
// //             <button
// //               onClick={() => setIsDropdownOpen(isDropdownOpen === "profil" ? null : "profil")}
// //               className={`flex items-center w-full p-2 text-gray-700 hover:bg-blue-50 rounded-lg transition duration-200 ${
// //                 activeSection === "profil" ? "bg-blue-100 font-medium" : ""
// //               }`}
// //             >
// //               <UserIcon className="h-5 w-5 mr-3" />
// //               Profil
// //               <svg
// //                 className={`w-4 h-4 ml-auto ${isDropdownOpen === "profil" ? "transform rotate-180" : ""}`}
// //                 fill="none"
// //                 stroke="currentColor"
// //                 viewBox="0 0 24 24"
// //               >
// //                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
// //               </svg>
// //             </button>
// //             {isDropdownOpen === "profil" && (
// //               <div className="absolute w-full mt-1 bg-white border rounded shadow-lg z-10">
// //                 <button
// //                   onClick={() => {
// //                     setActiveSection("profil");
// //                     setActiveSubSection("profil");
// //                     setIsDropdownOpen(null);
// //                   }}
// //                   className="w-full text-left p-2 hover:bg-gray-100"
// //                 >
// //                   Voir Profil
// //                 </button>
// //                 <button
// //                   onClick={() => {
// //                     setActiveSection("profil");
// //                     setActiveSubSection("editProfile");
// //                     setIsDropdownOpen(null);
// //                   }}
// //                   className="w-full text-left p-2 hover:bg-gray-100"
// //                 >
// //                   Modifier Profil
// //                 </button>
// //               </div>
// //             )}
// //           </div>
// //           <div className="relative">
// //             <button
// //               onClick={() => setIsDropdownOpen(isDropdownOpen === "patients" ? null : "patients")}
// //               className={`flex items-center w-full p-2 text-gray-700 hover:bg-blue-50 rounded-lg transition duration-200 ${
// //                 activeSection === "patients" ? "bg-blue-100 font-medium" : ""
// //               }`}
// //             >
// //               <UserIcon className="h-5 w-5 mr-3" />
// //               Patients
// //               <svg
// //                 className={`w-4 h-4 ml-auto ${isDropdownOpen === "patients" ? "transform rotate-180" : ""}`}
// //                 fill="none"
// //                 stroke="currentColor"
// //                 viewBox="0 0 24 24"
// //               >
// //                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
// //               </svg>
// //             </button>
// //             {isDropdownOpen === "patients" && (
// //               <div className="absolute w-full mt-1 bg-white border rounded shadow-lg z-10">
// //                 <button
// //                   onClick={() => {
// //                     setActiveSection("patients");
// //                     setActiveSubSection("followed");
// //                     setIsDropdownOpen(null);
// //                   }}
// //                   className="w-full text-left p-2 hover:bg-gray-100"
// //                 >
// //                   Patients Suivis
// //                 </button>
// //                 <button
// //                   onClick={() => {
// //                     setActiveSection("patients");
// //                     setActiveSubSection("created");
// //                     setIsDropdownOpen(null);
// //                   }}
// //                   className="w-full text-left p-2 hover:bg-gray-100"
// //                 >
// //                   Patients Créés
// //                 </button>
// //               </div>
// //             )}
// //           </div>
// //           <button
// //             onClick={() => {
// //               setActiveSection("rendezvous");
// //               setActiveSubSection("today");
// //               setIsDropdownOpen(null);
// //             }}
// //             className={`flex items-center w-full p-2 text-gray-700 hover:bg-blue-50 rounded-lg transition duration-200 ${
// //               activeSection === "rendezvous" ? "bg-blue-100 font-medium" : ""
// //             }`}
// //           >
// //             <CalendarIcon className="h-5 w-5 mr-3" />
// //             Rendez-vous
// //           </button>
// //           <button
// //             onClick={() => {
// //               setActiveSection("consultations");
// //               setActiveSubSection("historique");
// //               setIsDropdownOpen(null);
// //             }}
// //             className={`flex items-center w-full p-2 text-gray-700 hover:bg-blue-50 rounded-lg transition duration-200 ${
// //               activeSection === "consultations" ? "bg-blue-100 font-medium" : ""
// //             }`}
// //           >
// //             <ClipboardDocumentIcon className="h-5 w-5 mr-3" />
// //             Consultations
// //           </button>
// //           <button
// //             onClick={() => {
// //               setActiveSection("results");
// //               setActiveSubSection("results");
// //               setIsDropdownOpen(null);
// //             }}
// //             className={`flex items-center w-full p-2 text-gray-700 hover:bg-blue-50 rounded-lg transition duration-200 ${
// //               activeSection === "results" ? "bg-blue-100 font-medium" : ""
// //             }`}
// //           >
// //             <DocumentTextIcon className="h-5 w-5 mr-3" />
// //             Résultats
// //           </button>
// //           <button
// //             onClick={() => {
// //               setActiveSection("notifications");
// //               setActiveSubSection("notifications");
// //               setIsDropdownOpen(null);
// //             }}
// //             className={`flex items-center w-full p-2 text-gray-700 hover:bg-blue-50 rounded-lg transition duration-200 ${
// //               activeSection === "notifications" ? "bg-blue-100 font-medium" : ""
// //             }`}
// //           >
// //             <BellIcon className="h-5 w-5 mr-3" />
// //             Notifications
// //           </button>
// //         </nav>
// //         <div className="mt-4"></div>
// //         <button
// //           onClick={() => {
// //             document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
// //             router.replace("/auth/login?role=medecin");
// //           }}
// //           className="w-full text-left p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-200"
// //         >
// //           Se déconnecter
// //         </button>
// //       </aside>

// //       <div className="flex-1 p-6">
// //         <header className="flex justify-between items-center mb-6 bg-white p-4 rounded-lg shadow-md">
// //           <h1 className="text-xl font-semibold text-gray-800">
// //             Tableau de bord / {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)} / Dr.{" "}
// //             {doctor?.firstName} {doctor?.lastName}
// //           </h1>
// //           <div className="flex space-x-4">
// //             <button
// //               onClick={() => setShowNotifPanel(!showNotifPanel)}
// //               className="relative rounded-full p-2 hover:bg-gray-200"
// //               title="Notifications"
// //             >
// //               <BellIcon className="h-6 w-6 text-gray-600 hover:text-gray-800" />
// //               {newNotifications.length > 0 && (
// //                 <span className="absolute top-0 right-0 inline-block w-5 h-5 bg-red-600 text-white text-xs font-bold rounded-full text-center leading-5">
// //                   {newNotifications.length}
// //                 </span>
// //               )}
// //             </button>
// //             <Cog6ToothIcon className="h-6 w-6 text-gray-600 hover:text-gray-800 cursor-pointer" />
// //           </div>
// //         </header>

// //         {showNotifPanel && (
// //           <Card className="absolute right-6 mt-2 w-80 max-h-80 overflow-y-auto rounded-2xl shadow-lg border bg-white z-50">
// //             <CardHeader>
// //               <CardTitle className="text-lg font-semibold text-gray-800">Notifications</CardTitle>
// //             </CardHeader>
// //             <CardContent>
// //               {allNotifications.length > 0 ? (
// //                 <ul className="space-y-2 text-gray-700">
// //                   {allNotifications.map((note) => (
// //                     <li
// //                       key={note.id}
// //                       onClick={() => toggleReadNotification(note.id)}
// //                       className={`cursor-pointer p-2 rounded ${
// //                         note.read ? "bg-gray-100" : "bg-primary/20 font-semibold"
// //                       } hover:bg-primary/30`}
// //                     >
// //                       🔔 {note.message}
// //                       <br />
// //                       <small className="text-gray-400">{new Date(note.date).toLocaleString()}</small>
// //                     </li>
// //                   ))}
// //                 </ul>
// //               ) : (
// //                 <p className="text-gray-500 italic p-2">Aucune notification.</p>
// //               )}
// //             </CardContent>
// //           </Card>
// //         )}

// //         {showAccessRequest && (
// //           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
// //             <Card className="w-96 p-6 bg-white rounded-2xl">
// //               <CardHeader>
// //                 <CardTitle>Demande d'accès</CardTitle>
// //               </CardHeader>
// //               <CardContent>
// //                 <p>Voulez-vous accéder au dossier du patient ?</p>
// //                 <div className="flex justify-end gap-2 mt-4">
// //                   <Button
// //                     variant="outline"
// //                     onClick={() => {
// //                       setShowAccessRequest(false);
// //                       setRequestPatientId(null);
// //                     }}
// //                   >
// //                     Annuler
// //                   </Button>
// //                   <Button onClick={confirmAccess}>Confirmer</Button>
// //                 </div>
// //               </CardContent>
// //             </Card>
// //           </div>
// //         )}

// //         {activeSection === "accueil" && (
// //           <section className="bg-white p-6 rounded-lg shadow-md">
// //             <h1 className="text-2xl font-semibold text-gray-900 mb-4">
// //               Bienvenue, Dr. {doctor?.firstName} {doctor?.lastName} !
// //             </h1>
// //             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
// //               <div className="p-4 bg-blue-50 rounded-lg text-center hover:bg-blue-100 transition duration-200">
// //                 <UserIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
// //                 <p className="text-gray-700 font-medium">Patients Suivis</p>
// //                 <p className="text-gray-500">{patients.length}</p>
// //               </div>
// //               <div className="p-4 bg-green-50 rounded-lg text-center hover:bg-green-100 transition duration-200">
// //                 <CalendarIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
// //                 <p className="text-gray-700 font-medium">Rendez-vous</p>
// //                 <p className="text-gray-500">{rendezvous.length}</p>
// //               </div>
// //               <div className="p-4 bg-yellow-50 rounded-lg text-center hover:bg-yellow-100 transition duration-200">
// //                 <ClipboardDocumentIcon className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
// //                 <p className="text-gray-700 font-medium">Consultations</p>
// //                 <p className="text-gray-500">{consultations.length}</p>
// //               </div>
// //               <div className="p-4 bg-purple-50 rounded-lg text-center hover:bg-purple-100 transition duration-200">
// //                 <DocumentTextIcon className="h-8 w-8 text-purple-600 mx-auto mb-2" />
// //                 <p className="text-gray-700 font-medium">Résultats</p>
// //                 <p className="text-gray-500">{sharedResults.length}</p>
// //               </div>
// //             </div>
// //             <Input
// //               placeholder="🔍 Rechercher un patient..."
// //               value={search}
// //               onChange={(e) => setSearch(e.target.value)}
// //               className="mb-4 w-full md:w-1/2"
// //             />
// //             {search && filteredPatients.length > 0 && ( // Afficher uniquement si une recherche est faite
// //               <div className="space-y-3">
// //                 {filteredPatients.map((patient) => (
// //                   <Card
// //                     key={patient.id}
// //                     onClick={() => handlePatientSelect(patient.id)}
// //                     className="cursor-pointer rounded-xl border border-gray-200 hover:border-primary"
// //                   >
// //                     <CardContent className="p-4">
// //                       <h3 className="font-semibold text-gray-800">{patient.firstName} {patient.lastName}</h3>
// //                     </CardContent>
// //                   </Card>
// //                 ))}
// //               </div>
// //             )}
// //             {!search && <p className="text-gray-500 text-center">Veuillez effectuer une recherche pour voir les patients.</p>}
// //             {selectedPatient && !patientAccessApproved && (
// //               <p className="mt-4 text-yellow-600 text-center">
// //                 Une demande d'accès a été envoyée à {selectedPatient.firstName} {selectedPatient.lastName}. Attendez l'approbation.
// //               </p>
// //             )}
// //             {selectedPatient && patientAccessApproved && (
// //               <div className="mt-6 flex gap-3">
// //                 <Button onClick={() => setShowRdvModal(true)}>📅 Nouveau RDV</Button>
// //                 <Button onClick={() => setShowConsultModal(true)}>🩺 Nouvelle Consultation</Button>
// //                 <Button onClick={() => setShowResultModal(true)}>📊 Nouveau Résultat</Button>
// //                 <Button
// //                   onClick={() =>
// //                     sendNotification(selectedPatient.id, "Rappel: Votre rendez-vous est prévu bientôt.")
// //                   }
// //                 >
// //                   🔔 Envoyer Notification
// //                 </Button>
// //               </div>
// //             )}
// //           </section>
// //         )}

// //         {activeSection === "profil" && activeSubSection === "profil" && (
// //           <section>
// //             <h1 className="text-3xl font-bold text-gray-900 mb-6">Mon Profil</h1>
// //             <div className="bg-white p-6 rounded-lg shadow-md">
// //               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
// //                 <div className="p-4 bg-gray-50 rounded-lg">
// //                   <h3 className="text-lg font-semibold text-gray-800 mb-2">À propos</h3>
// //                   <p className="text-gray-600">
// //                     Dr. {doctor?.firstName} {doctor?.lastName}
// //                   </p>
// //                   <p className="text-gray-500">{doctor?.id}</p>
// //                   <p className="text-gray-500">{doctor?.speciality}</p>
// //                   <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">Contacts</h3>
// //                   <p className="text-gray-600">{doctor?.email}</p>
// //                   <p className="text-gray-600">{doctor?.phoneNumber || "Non spécifié"}</p>
// //                   <p className="text-gray-600">{doctor?.address || "Non spécifié"}</p>
// //                 </div>
// //               </div>
// //             </div>
// //           </section>
// //         )}

// //         {activeSection === "profil" && activeSubSection === "editProfile" && (
// //           <section>
// //             <h1 className="text-3xl font-bold text-gray-900 mb-6">Modifier le Profil</h1>
// //             <div className="bg-white p-6 rounded-lg shadow-md">
// //               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
// //                 <div className="p-4 bg-gray-50 rounded-lg">
// //                   {profileError && <p className="text-red-500 mb-4">{profileError}</p>}
// //                   <Input
// //                     type="text"
// //                     name="firstName"
// //                     value={profileFormData.firstName}
// //                     onChange={handleProfileChange}
// //                     placeholder="Prénom"
// //                     className="mb-2"
// //                     required
// //                   />
// //                   <Input
// //                     type="text"
// //                     name="lastName"
// //                     value={profileFormData.lastName}
// //                     onChange={handleProfileChange}
// //                     placeholder="Nom"
// //                     className="mb-2"
// //                     required
// //                   />
// //                   <Input
// //                     type="email"
// //                     name="email"
// //                     value={profileFormData.email}
// //                     onChange={handleProfileChange}
// //                     placeholder="Email"
// //                     className="mb-2"
// //                     required
// //                   />
// //                   <Input
// //                     type="text"
// //                     name="speciality"
// //                     value={profileFormData.speciality}
// //                     onChange={handleProfileChange}
// //                     placeholder="Spécialité"
// //                     className="mb-2"
// //                     required
// //                   />
// //                   <Input
// //                     type="text"
// //                     name="phoneNumber"
// //                     value={profileFormData.phoneNumber}
// //                     onChange={handleProfileChange}
// //                     placeholder="Numéro de téléphone"
// //                     className="mb-2"
// //                   />
// //                   <Input
// //                     type="text"
// //                     name="address"
// //                     value={profileFormData.address}
// //                     onChange={handleProfileChange}
// //                     placeholder="Adresse"
// //                     className="mb-2"
// //                   />
// //                   <Button onClick={handleProfileSubmit} className="bg-blue-600 text-white mt-2">
// //                     Enregistrer
// //                   </Button>
// //                 </div>
// //               </div>
// //             </div>
// //           </section>
// //         )}

// //         {activeSection === "patients" && (
// //           <section>
// //             <h1 className="text-3xl font-bold text-gray-900 mb-6">Patients</h1>
// //             <div className="bg-white p-6 rounded-lg shadow-md">
// //               <div className="flex justify-between items-center mb-4">
// //                 <Input
// //                   placeholder="🔍 Rechercher un patient..."
// //                   value={search}
// //                   onChange={(e) => setSearch(e.target.value)}
// //                   className="w-1/3 rounded-xl"
// //                 />
// //                 <Link href="/patients/new">
// //                   <Button className="rounded-xl">+ Nouveau Patient</Button>
// //                 </Link>
// //               </div>
// //               {activeSubSection === "followed" && (
// //                 <div className="space-y-3">
// //                   {filteredPatients.length > 0 ? (
// //                     filteredPatients.map((patient) => (
// //                       <Card
// //                         key={patient.id}
// //                         onClick={() => handlePatientSelect(patient.id)}
// //                         className={`cursor-pointer rounded-xl border ${
// //                           selectedPatient?.id === patient.id
// //                             ? "border-2 border-primary bg-primary/10"
// //                             : "border-gray-200"
// //                         }`}
// //                       >
// //                         <CardContent className="p-4">
// //                           <h3 className="font-semibold text-gray-800">
// //                             {patient.firstName} {patient.lastName}
// //                           </h3>
// //                         </CardContent>
// //                       </Card>
// //                     ))
// //                   ) : (
// //                     <p className="text-gray-500 text-center">Aucun patient trouvé.</p>
// //                   )}
// //                 </div>
// //               )}
// //               {activeSubSection === "created" && (
// //                 <div className="space-y-3">
// //                   {filteredPatients.filter((p) => p.dossier.includes("Créé par")).length > 0 ? (
// //                     filteredPatients
// //                       .filter((p) => p.dossier.includes("Créé par"))
// //                       .map((patient) => (
// //                         <Card
// //                           key={patient.id}
// //                           onClick={() => handlePatientSelect(patient.id)}
// //                           className={`cursor-pointer rounded-xl border ${
// //                             selectedPatient?.id === patient.id
// //                               ? "border-2 border-primary bg-primary/10"
// //                               : "border-gray-200"
// //                           }`}
// //                         >
// //                           <CardContent className="p-4">
// //                             <h3 className="font-semibold text-gray-800">
// //                               {patient.firstName} {patient.lastName}
// //                             </h3>
// //                           </CardContent>
// //                         </Card>
// //                       ))
// //                   ) : (
// //                     <p className="text-gray-500 text-center">Aucun patient créé.</p>
// //                   )}
// //                 </div>
// //               )}
// //               {selectedPatient && !patientAccessApproved && (
// //                 <p className="mt-6 text-yellow-600 text-center">
// //                   Une demande d'accès a été envoyée à {selectedPatient.firstName} {selectedPatient.lastName}. Attendez l'approbation.
// //                 </p>
// //               )}
// //               {selectedPatient && patientAccessApproved && (
// //                 <Card className="mt-6 rounded-2xl shadow-xl p-6 border bg-white">
// //                   <CardHeader>
// //                     <CardTitle className="text-3xl font-bold text-gray-800">
// //                       {selectedPatient.firstName} {selectedPatient.lastName}
// //                     </CardTitle>
// //                     <p className="text-gray-500">Né(e) le {selectedPatient.birthDate}</p>
// //                   </CardHeader>
// //                   <CardContent>
// //                     <p className="mb-6 text-gray-700 text-base leading-relaxed">{selectedPatient.dossier}</p>
// //                     <div className="flex flex-wrap gap-3 mb-6">
// //                       <Button variant="outline" asChild className="rounded-xl">
// //                         <Link href={`/patients/${selectedPatient.id}/edit`}>✏️ Modifier</Link>
// //                       </Button>
// //                       <Button
// //                         variant="secondary"
// //                         className="rounded-xl"
// //                         onClick={() => setShowRdvModal(true)}
// //                       >
// //                         📅 Nouveau RDV
// //                       </Button>
// //                       <Button
// //                         variant="secondary"
// //                         className="rounded-xl"
// //                         onClick={() => setShowConsultModal(true)}
// //                       >
// //                         🩺 Nouvelle Consultation
// //                       </Button>
// //                       <Button
// //                         variant="secondary"
// //                         className="rounded-xl"
// //                         onClick={() => setShowResultModal(true)}
// //                       >
// //                         📊 Nouveau Résultat
// //                       </Button>
// //                       <Button
// //                         variant="secondary"
// //                         className="rounded-xl"
// //                         onClick={() =>
// //                           sendNotification(
// //                             selectedPatient.id,
// //                             "Rappel: Votre rendez-vous est prévu bientôt."
// //                           )
// //                         }
// //                       >
// //                         🔔 Envoyer Notification
// //                       </Button>
// //                     </div>
// //                     <div className="space-y-4">
// //                       <h3 className="font-semibold text-lg text-gray-800">📅 Rendez-vous Programmés</h3>
// //                       {rendezvous.filter((rdv) => rdv.patientId === selectedPatient.id).length > 0 ? (
// //                         <ul className="list-disc ml-5 text-gray-600 text-sm">
// //                           {rendezvous
// //                             .filter((rdv) => rdv.patientId === selectedPatient.id)
// //                             .map((rdv) => (
// //                               <li key={rdv.id}>
// //                                 {patients.find((p) => p.id === rdv.patientId)?.firstName}{" "}
// //                                 {patients.find((p) => p.id === rdv.patientId)?.lastName} -{" "}
// //                                 {new Date(rdv.date).toLocaleString()} - {rdv.location} (
// //                                 {rdv.isTeleconsultation ? "Téléconsultation" : "Présentiel"}) - Statut:{" "}
// //                                 {rdv.status}
// //                                 {rdv.status === "En attente" && (
// //                                   <div className="inline-flex gap-2 ml-2">
// //                                     <Button
// //                                       size="sm"
// //                                       variant="outline"
// //                                       onClick={() => manageAppointment(rdv.id, "approve")}
// //                                     >
// //                                       Approuver
// //                                     </Button>
// //                                     <Button
// //                                       size="sm"
// //                                       variant="destructive"
// //                                       onClick={() => manageAppointment(rdv.id, "reject")}
// //                                     >
// //                                       Rejeter
// //                                     </Button>
// //                                     <Button
// //                                       size="sm"
// //                                       variant="outline"
// //                                       onClick={() => manageAppointment(rdv.id, "reschedule")}
// //                                     >
// //                                       Reprogrammer
// //                                     </Button>
// //                                   </div>
// //                                 )}
// //                               </li>
// //                             ))}
// //                         </ul>
// //                       ) : (
// //                         <p className="ml-5 text-gray-500 text-center">Aucun rendez-vous programmé.</p>
// //                       )}

// //                       <h3 className="font-semibold text-lg text-gray-800 mt-6">🩺 Consultations Réalisées</h3>
// //                       {consultations.filter((consult) => consult.patientId === selectedPatient.id).length >
// //                       0 ? (
// //                         <ul className="list-disc ml-5 text-gray-600 text-sm">
// //                           {consultations
// //                             .filter((consult) => consult.patientId === selectedPatient.id)
// //                             .map((consult) => (
// //                               <li key={consult.id}>
// //                                 {patients.find((p) => p.id === consult.patientId)?.firstName}{" "}
// //                                 {patients.find((p) => p.id === consult.patientId)?.lastName} -{" "}
// //                                 {new Date(consult.date).toLocaleString()} - {consult.summary}
// //                               </li>
// //                             ))}
// //                         </ul>
// //                       ) : (
// //                         <p className="ml-5 text-gray-500 text-center">Aucune consultation réalisée.</p>
// //                       )}

// //                       <h3 className="font-semibold text-lg text-gray-800 mt-6">📊 Résultats Générés</h3>
// //                       {sharedResults.filter((result) => result.patientId === selectedPatient.id).length >
// //                       0 ? (
// //                         <ul className="list-disc ml-5 text-gray-600 text-sm">
// //                           {sharedResults
// //                             .filter((result) => result.patientId === selectedPatient.id)
// //                             .map((result) => (
// //                               <li key={result.id}>
// //                                 {patients.find((p) => p.id === result.patientId)?.firstName}{" "}
// //                                 {patients.find((p) => p.id === result.patientId)?.lastName} - {result.type} -{" "}
// //                                 {new Date(result.date).toLocaleString()}: {result.description}
// //                                 {result.fileUrl && (
// //                                   <span>
// //                                     {" "}
// //                                     <a href={result.fileUrl} className="text-blue-600 hover:underline">
// //                                       Voir le fichier
// //                                     </a>
// //                                   </span>
// //                                 )}
// //                               </li>
// //                             ))}
// //                         </ul>
// //                       ) : (
// //                         <p className="ml-5 text-gray-500 text-center">Aucun résultat généré.</p>
// //                       )}
// //                     </div>
// //                   </CardContent>
// //                 </Card>
// //               )}
// //             </div>
// //           </section>
// //         )}

// //         {activeSection === "rendezvous" && (
// //           <section>
// //             <h1 className="text-3xl font-bold text-gray-900 mb-6">Rendez-vous</h1>
// //             <div className="bg-white p-6 rounded-lg shadow-md">
// //               <div className="flex justify-between items-center mb-6">
// //                 <div>
// //                   <select
// //                     value={activeSubSection || "today"}
// //                     onChange={(e) => setActiveSubSection(e.target.value || "today")}
// //                     className="p-1 border rounded"
// //                   >
// //                     <option value="today">Aujourd'hui</option>
// //                     <option value="month">Mois</option>
// //                   </select>
// //                   <Input
// //                     type="text"
// //                     placeholder="Sélectionner un patient..."
// //                     value={search}
// //                     onChange={(e) => setSearch(e.target.value)}
// //                     className="ml-2 w-1/3 p-1 border rounded"
// //                     onBlur={(e) => {
// //                       const patient = patients.find((p) =>
// //                         `${p.firstName} ${p.lastName}`.toLowerCase() === e.target.value.toLowerCase()
// //                       );
// //                       if (patient) handlePatientSelect(patient.id);
// //                     }}
// //                   />
// //                 </div>
// //                 <Button
// //                   onClick={() => setShowRdvModal(true)}
// //                   className="bg-blue-600 text-white px-4 py-2 rounded"
// //                 >
// //                   + Créer un rendez-vous
// //                 </Button>
// //               </div>
// //               {activeSubSection === "today" && (
// //                 <div className="p-4 bg-gray-50 rounded-lg">
// //                   {rendezvous.filter((a) => new Date(a.date).toDateString() === new Date().toDateString())
// //                     .length > 0 ? (
// //                     rendezvous
// //                       .filter((a) => new Date(a.date).toDateString() === new Date().toDateString())
// //                       .map((a) => (
// //                         <div key={a.id} className="border p-3 rounded-lg mb-2">
// //                           <p>
// //                             {patients.find((p) => p.id === a.patientId)?.firstName}{" "}
// //                             {patients.find((p) => p.id === a.patientId)?.lastName} -{" "}
// //                             {new Date(a.date).toLocaleString()} - {a.location} (
// //                             {a.isTeleconsultation ? "Téléconsultation" : "Présentiel"}) - Statut: {a.status}
// //                           </p>
// //                           {a.status === "En attente" && (
// //                             <div className="flex gap-2 mt-2">
// //                               <Button
// //                                 size="sm"
// //                                 variant="outline"
// //                                 onClick={() => manageAppointment(a.id, "approve")}
// //                               >
// //                                 Approuver
// //                               </Button>
// //                               <Button
// //                                 size="sm"
// //                                 variant="destructive"
// //                                 onClick={() => manageAppointment(a.id, "reject")}
// //                               >
// //                                 Rejeter
// //                               </Button>
// //                               <Button
// //                                 size="sm"
// //                                 variant="outline"
// //                                 onClick={() => manageAppointment(a.id, "reschedule")}
// //                               >
// //                                 Reprogrammer
// //                               </Button>
// //                             </div>
// //                           )}
// //                         </div>
// //                       ))
// //                   ) : (
// //                     <p className="text-gray-600">Aucun rendez-vous aujourd'hui.</p>
// //                   )}
// //                 </div>
// //               )}
// //               {activeSubSection === "month" && (
// //                 <div className="grid grid-cols-7 gap-1 text-center">
// //                   <div className="p-2 font-semibold text-gray-500">DIM</div>
// //                   <div className="p-2 font-semibold text-gray-500">LUN</div>
// //                   <div className="p-2 font-semibold text-gray-500">MAR</div>
// //                   <div className="p-2 font-semibold text-gray-500">MER</div>
// //                   <div className="p-2 font-semibold text-gray-500">JEU</div>
// //                   <div className="p-2 font-semibold text-gray-500">VEN</div>
// //                   <div className="p-2 font-semibold text-gray-500">SAM</div>
// //                   {Array.from({ length: 30 }, (_, i) => (
// //                     <div
// //                       key={i + 1}
// //                       className={`p-2 ${
// //                         rendezvous.some((a) => new Date(a.date).getDate() === i + 1)
// //                           ? "bg-blue-100 rounded-full"
// //                           : ""
// //                       }`}
// //                     >
// //                       {i + 1}
// //                     </div>
// //                   ))}
// //                 </div>
// //               )}
// //             </div>
// //           </section>
// //         )}

// //         {activeSection === "consultations" && (
// //           <section>
// //             <h1 className="text-3xl font-bold text-gray-900 mb-6">Consultations</h1>
// //             <div className="bg-white p-6 rounded-lg shadow-md">
// //               <div className="flex justify-between items-center mb-6">
// //                 <button onClick={() => setActiveSubSection("historique")} className="text-blue-600">
// //                   Historique
// //                 </button>
// //                 <Input
// //                   type="text"
// //                   placeholder="Sélectionner un patient..."
// //                   value={search}
// //                   onChange={(e) => setSearch(e.target.value)}
// //                   className="w-1/3 p-1 border rounded"
// //                   onBlur={(e) => {
// //                     const patient = patients.find((p) =>
// //                       `${p.firstName} ${p.lastName}`.toLowerCase() === e.target.value.toLowerCase()
// //                     );
// //                     if (patient) handlePatientSelect(patient.id);
// //                   }}
// //                 />
// //                 <Button
// //                   onClick={() => setShowConsultModal(true)}
// //                   className="bg-blue-600 text-white px-4 py-2 rounded"
// //                 >
// //                   + Créer une consultation
// //                 </Button>
// //               </div>
// //               {activeSubSection === "historique" && (
// //                 <div className="p-4 bg-gray-50 rounded-lg">
// //                   {consultations.length > 0 ? (
// //                     consultations.map((c) => (
// //                       <div key={c.id} className="border p-3 rounded-lg mb-2">
// //                         <p>
// //                           <strong>Patient :</strong> {c.patient.firstName} {c.patient.lastName} - <strong>Date :</strong> {new Date(c.date).toLocaleString()}
// //                         </p>
// //                         <p>
// //                           <strong>Résumé :</strong> {c.summary}
// //                         </p>
// //                       </div>
// //                     ))
// //                   ) : (
// //                     <p className="text-gray-600">Aucune consultation disponible.</p>
// //                   )}
// //                 </div>
// //               )}
// //             </div>
// //           </section>
// //         )}

// //         {activeSection === "results" && (
// //           <section>
// //             <h1 className="text-3xl font-bold text-gray-900 mb-6">Résultats</h1>
// //             <div className="bg-white p-6 rounded-lg shadow-md">
// //               <Input
// //                 type="text"
// //                 placeholder="Sélectionner un patient..."
// //                 value={search}
// //                 onChange={(e) => setSearch(e.target.value)}
// //                 className="w-1/3 p-1 border rounded mb-4"
// //                 onBlur={(e) => {
// //                   const patient = patients.find((p) =>
// //                     `${p.firstName} ${p.lastName}`.toLowerCase() === e.target.value.toLowerCase()
// //                   );
// //                   if (patient) handlePatientSelect(patient.id);
// //                 }}
// //               />
// //               <Button
// //                 variant="default"
// //                 className="mb-4 bg-blue-600 text-white"
// //                 onClick={() => setShowResultModal(true)}
// //               >
// //                 Ajouter un résultat
// //               </Button>
// //               {sharedResults.length > 0 ? (
// //                 <ul className="space-y-4">
// //                   {sharedResults.map((result) => (
// //                     <li key={result.id} className="border p-4 rounded-lg">
// //                       <div className="flex justify-between items-center">
// //                         <div>
// //                           <h3 className="text-lg font-medium">{result.type}</h3>
// //                           <p><strong>Patient :</strong> {result.patient.firstName} {result.patient.lastName} - <strong>Date :</strong> {new Date(result.date).toLocaleString()}</p>
// //                           <p>{result.description}</p>
// //                           {result.fileUrl && (
// //                             <a
// //                               href={result.fileUrl}
// //                               className="text-blue-600 hover:underline"
// //                               target="_blank"
// //                               rel="noopener noreferrer"
// //                             >
// //                               Voir le fichier
// //                             </a>
// //                           )}
// //                         </div>
// //                       </div>
// //                     </li>
// //                   ))}
// //                 </ul>
// //               ) : (
// //                 <p className="text-gray-600">Aucun résultat disponible.</p>
// //               )}
// //             </div>
// //           </section>
// //         )}

// //         {activeSection === "notifications" && (
// //           <section>
// //             <h1 className="text-3xl font-bold text-gray-900 mb-6">Notifications</h1>
// //             <div className="bg-white p-6 rounded-lg shadow-md">
// //               {allNotifications.length > 0 ? (
// //                 <ul className="space-y-4">
// //                   {allNotifications.map((note) => (
// //                     <li
// //                       key={note.id}
// //                       onClick={() => toggleReadNotification(note.id)}
// //                       className={`cursor-pointer p-3 rounded-lg ${
// //                         note.read ? "bg-gray-100" : "bg-primary/20 font-semibold"
// //                       } hover:bg-primary/30`}
// //                     >
// //                       🔔 {note.message}
// //                       <br />
// //                       <small className="text-gray-400">{new Date(note.date).toLocaleString()}</small>
// //                     </li>
// //                   ))}
// //                 </ul>
// //               ) : (
// //                 <p className="text-gray-600">Aucune notification disponible.</p>
// //               )}
// //             </div>
// //           </section>
// //         )}

// //         {showConsultModal && (
// //           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
// //             <Card className="w-96 p-6 bg-white rounded-2xl">
// //               <CardHeader>
// //                 <CardTitle>Nouvelle Consultation</CardTitle>
// //               </CardHeader>
// //               <CardContent>
// //                 {consultError && <p className="text-red-500 mb-4">{consultError}</p>}
// //                 <form onSubmit={handleConsultSubmit} className="space-y-4">
// //                   <select
// //                     value={selectedPatient?.id || ""}
// //                     onChange={(e) => {
// //                       const patient = patients.find((p) => p.id === e.target.value);
// //                       if (patient) setSelectedPatient(patient);
// //                     }}
// //                     required
// //                   >
// //                     <option value="">Sélectionner un patient</option>
// //                     {patients.map((patient) => (
// //                       <option key={patient.id} value={patient.id}>
// //                         {patient.firstName} {patient.lastName}
// //                       </option>
// //                     ))}
// //                   </select>
// //                   <Input
// //                     type="datetime-local"
// //                     value={consultDate}
// //                     onChange={(e) => setConsultDate(e.target.value)}
// //                     required
// //                   />
// //                   <Textarea
// //                     placeholder="Résumé de la consultation"
// //                     value={consultSummary}
// //                     onChange={(e) => setConsultSummary(e.target.value)}
// //                     required
// //                   />
// //                   <div className="flex justify-end gap-2">
// //                     <Button
// //                       variant="outline"
// //                       onClick={() => {
// //                         setShowConsultModal(false);
// //                         setConsultError(null);
// //                       }}
// //                     >
// //                       Annuler
// //                     </Button>
// //                     <Button type="submit">Enregistrer</Button>
// //                   </div>
// //                 </form>
// //               </CardContent>
// //             </Card>
// //           </div>
// //         )}

// //         {showRdvModal && (
// //           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
// //             <Card className="w-96 p-6 bg-white rounded-2xl">
// //               <CardHeader>
// //                 <CardTitle>Nouveau Rendez-vous</CardTitle>
// //               </CardHeader>
// //               <CardContent>
// //                 {rdvError && <p className="text-red-500 mb-4">{rdvError}</p>}
// //                 <form onSubmit={handleRdvSubmit} className="space-y-4">
// //                   <select
// //                     value={selectedPatient?.id || ""}
// //                     onChange={(e) => {
// //                       const patient = patients.find((p) => p.id === e.target.value);
// //                       if (patient) setSelectedPatient(patient);
// //                     }}
// //                     required
// //                   >
// //                     <option value="">Sélectionner un patient</option>
// //                     {patients.map((patient) => (
// //                       <option key={patient.id} value={patient.id}>
// //                         {patient.firstName} {patient.lastName}
// //                       </option>
// //                     ))}
// //                   </select>
// //                   <Input
// //                     type="datetime-local"
// //                     value={rdvDate}
// //                     onChange={(e) => setRdvDate(e.target.value)}
// //                     required
// //                   />
// //                   <Input
// //                     placeholder="Lieu du rendez-vous"
// //                     value={rdvLocation}
// //                     onChange={(e) => setRdvLocation(e.target.value)}
// //                     required
// //                   />
// //                   <div className="flex items-center space-x-2">
// //                     <Checkbox
// //                       checked={rdvIsTeleconsultation}
// //                       onCheckedChange={(checked) => setRdvIsTeleconsultation(!!checked)}
// //                     />
// //                     <label>Téléconsultation</label>
// //                   </div>
// //                   <div className="flex justify-end gap-2">
// //                     <Button
// //                       variant="outline"
// //                       onClick={() => {
// //                         setShowRdvModal(false);
// //                         setRdvError(null);
// //                       }}
// //                     >
// //                       Annuler
// //                     </Button>
// //                     <Button type="submit">Enregistrer</Button>
// //                   </div>
// //                 </form>
// //               </CardContent>
// //             </Card>
// //           </div>
// //         )}

// //         {showResultModal && (
// //           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
// //             <Card className="w-96 p-6 bg-white rounded-2xl">
// //               <CardHeader>
// //                 <CardTitle>Nouveau Résultat</CardTitle>
// //               </CardHeader>
// //               <CardContent>
// //                 {resultError && <p className="text-red-500 mb-4">{resultError}</p>}
// //                 <form onSubmit={handleResultSubmit} className="space-y-4">
// //                   <select
// //                     value={selectedPatient?.id || ""}
// //                     onChange={(e) => {
// //                       const patient = patients.find((p) => p.id === e.target.value);
// //                       if (patient) setSelectedPatient(patient);
// //                     }}
// //                     required
// //                   >
// //                     <option value="">Sélectionner un patient</option>
// //                     {patients.map((patient) => (
// //                       <option key={patient.id} value={patient.id}>
// //                         {patient.firstName} {patient.lastName}
// //                       </option>
// //                     ))}
// //                   </select>
// //                   <Input
// //                     placeholder="Type (ex: Analyse sanguine)"
// //                     value={resultType}
// //                     onChange={(e) => setResultType(e.target.value)}
// //                     required
// //                   />
// //                   <Input
// //                     type="datetime-local"
// //                     value={resultDate}
// //                     onChange={(e) => setResultDate(e.target.value)}
// //                     required
// //                   />
// //                   <Textarea
// //                     placeholder="Description"
// //                     value={resultDescription}
// //                     onChange={(e) => setResultDescription(e.target.value)}
// //                     required
// //                   />
// //                   <Input
// //                     placeholder="URL du fichier (optionnel)"
// //                     value={resultFileUrl}
// //                     onChange={(e) => setResultFileUrl(e.target.value)}
// //                   />
// //                   <div className="flex items-center space-x-2">
// //                     <Checkbox
// //                       checked={resultIsShared}
// //                       onCheckedChange={(checked) => setResultIsShared(!!checked)}
// //                     />
// //                     <label>Partager avec un autre médecin</label>
// //                   </div>
// //                   <div className="flex justify-end gap-2">
// //                     <Button
// //                       variant="outline"
// //                       onClick={() => {
// //                         setShowResultModal(false);
// //                         setResultError(null);
// //                       }}
// //                     >
// //                       Annuler
// //                     </Button>
// //                     <Button type="submit">Enregistrer</Button>
// //                   </div>
// //                 </form>
// //               </CardContent>
// //             </Card>
// //           </div>
// //         )}
// //       </div>
// //     </div>
// //   );
// // }

// "use client";

// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import {
//   HomeIcon,
//   UserIcon,
//   CalendarIcon,
//   DocumentTextIcon,
//   ClipboardDocumentIcon,
//   BellIcon,
//   Cog6ToothIcon,
// } from "@heroicons/react/24/outline";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
// import { Checkbox } from "@/components/ui/checkbox";
// import Link from "next/link";

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

// interface Result {
//   id: string;
//   type: string;
//   date: string;
//   description: string;
//   fileUrl?: string;
//   patientId: string;
//   patient: { id: string; firstName: string; lastName: string };
// }

// interface RendezVous {
//   id: string;
//   date: string;
//   location: string;
//   status: string;
//   isTeleconsultation: boolean;
//   patientId: string;
//   newDate?: string;
// }

// interface Consultation {
//   id: string;
//   date: string;
//   summary: string;
//   patientId: string;
//   patient: { firstName: string; lastName: string };
// }

// interface Doctor {
//   id: string;
//   firstName: string;
//   lastName: string;
//   email: string;
//   speciality: string;
//   phoneNumber?: string;
//   address?: string;
// }

// interface MedecinResponse {
//   doctor?: Doctor;
//   patients?: Patient[];
//   allPatients?: Patient[];
//   notifications?: Notification[];
//   sharedResults?: Result[];
//   rendezvous?: RendezVous[];
//   consultations?: Consultation[];
// }

// export default function DashboardMedecin() {
//   const router = useRouter();
//   const [doctor, setDoctor] = useState<Doctor | null>(null);
//   const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
//   const [patients, setPatients] = useState<Patient[]>([]);
//   const [allPatients, setAllPatients] = useState<Patient[]>([]);
//   const [receivedNotifications, setReceivedNotifications] = useState<Notification[]>([]);
//   const [sentNotifications, setSentNotifications] = useState<Notification[]>([]);
//   const [sharedResults, setSharedResults] = useState<Result[]>([]);
//   const [rendezvous, setRendezvous] = useState<RendezVous[]>([]);
//   const [consultations, setConsultations] = useState<Consultation[]>([]);
//   const [search, setSearch] = useState("");
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [activeSection, setActiveSection] = useState("accueil");
//   const [activeSubSection, setActiveSubSection] = useState<string | null>(null);
//   const [isDropdownOpen, setIsDropdownOpen] = useState<string | null>(null);
//   const [showNotifPanel, setShowNotifPanel] = useState(false);
//   const [showAccessRequest, setShowAccessRequest] = useState(false);
//   const [requestPatientId, setRequestPatientId] = useState<string | null>(null);
//   const [patientAccessApproved, setPatientAccessApproved] = useState<boolean>(false);

//   const [showConsultModal, setShowConsultModal] = useState(false);
//   const [consultDate, setConsultDate] = useState("");
//   const [consultSummary, setConsultSummary] = useState("");
//   const [consultError, setConsultError] = useState<string | null>(null);

//   const [showRdvModal, setShowRdvModal] = useState(false);
//   const [rdvDate, setRdvDate] = useState("");
//   const [rdvLocation, setRdvLocation] = useState("");
//   const [rdvIsTeleconsultation, setRdvIsTeleconsultation] = useState(false);
//   const [rdvError, setRdvError] = useState<string | null>(null);

//   const [showResultModal, setShowResultModal] = useState(false);
//   const [resultType, setResultType] = useState("");
//   const [resultDate, setResultDate] = useState("");
//   const [resultDescription, setResultDescription] = useState("");
//   const [resultFileUrl, setResultFileUrl] = useState("");
//   const [resultIsShared, setResultIsShared] = useState(false);
//   const [resultError, setResultError] = useState<string | null>(null);

//   const [showProfileModal, setShowProfileModal] = useState(false);
//   const [profileFormData, setProfileFormData] = useState<Doctor>({
//     id: "",
//     firstName: "",
//     lastName: "",
//     email: "",
//     speciality: "",
//     phoneNumber: "",
//     address: "",
//   });
//   const [profileError, setProfileError] = useState<string | null>(null);

//   const getNotificationData = () => {
//     const newReceivedNotifications = Array.isArray(receivedNotifications)
//       ? receivedNotifications.filter((n) => !n.read)
//       : [];
//     const allReceivedNotifications = [...(Array.isArray(receivedNotifications) ? receivedNotifications : [])].sort(
//       (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
//     );
//     return { newReceivedNotifications, allReceivedNotifications };
//   };

//   useEffect(() => {
//     const fetchMedecinData = async () => {
//       try {
//         const token = document.cookie
//           .split("; ")
//           .find((row) => row.startsWith("token="))
//           ?.split("=")[1];

//         if (!token) {
//           throw new Error("Aucun token trouvé. Redirection...");
//         }

//         const role = document.cookie
//           .split("; ")
//           .find((row) => row.startsWith("role="))
//           ?.split("=")[1]?.toLowerCase();
//         if (role !== "medecin") {
//           throw new Error("Rôle invalide. Redirection...");
//         }

//         const [meRes, notificationsRes, rdvRes, consultRes, resultsRes, allPatientsRes] = await Promise.all([
//           fetch("/api/medecin/me", {
//             headers: { Authorization: `Bearer ${token}` },
//             credentials: "include",
//             cache: "no-store",
//           }),
//           fetch("/api/medecin/notifications", {
//             headers: { Authorization: `Bearer ${token}` },
//             credentials: "include",
//             cache: "no-store",
//           }),
//           fetch("/api/medecin/appointments", {
//             headers: { Authorization: `Bearer ${token}` },
//             credentials: "include",
//             cache: "no-store",
//           }),
//           fetch("/api/medecin/consultations", {
//             headers: { Authorization: `Bearer ${token}` },
//             credentials: "include",
//             cache: "no-store",
//           }),
//           fetch("/api/medecin/results", {
//             headers: { Authorization: `Bearer ${token}` },
//             credentials: "include",
//             cache: "no-store",
//           }),
//           fetch("/api/patients/all", {
//             headers: { Authorization: `Bearer ${token}` },
//             credentials: "include",
//             cache: "no-store",
//           }),
//         ]);

//         if (!meRes.ok) throw new Error(`Erreur API /medecin/me: ${meRes.statusText}`);
//         if (!notificationsRes.ok) throw new Error(`Erreur API /medecin/notifications: ${notificationsRes.statusText}`);
//         if (!rdvRes.ok) throw new Error(`Erreur API /medecin/appointments: ${rdvRes.statusText}`);
//         if (!consultRes.ok) throw new Error(`Erreur API /medecin/consultations: ${consultRes.statusText}`);
//         if (!resultsRes.ok) throw new Error(`Erreur API /medecin/results: ${resultsRes.statusText}`);
//         if (!allPatientsRes.ok) throw new Error(`Erreur API /patients/all: ${allPatientsRes.statusText}`);

//         const data: MedecinResponse = await meRes.json();
//         const notificationsResponse = await notificationsRes.json();
//         console.log("Réponse API notifications:", notificationsResponse);
//         const notificationsData: Notification[] = Array.isArray(notificationsResponse) ? notificationsResponse : [];
//         const rdvData: RendezVous[] = await rdvRes.json() || [];
//         const consultData: Consultation[] = await consultRes.json() || [];
//         const resultsData: Result[] = await resultsRes.json() || [];
//         const allPatientsData: Patient[] = await allPatientsRes.json() || [];

//         setDoctor(data.doctor || null);
//         setPatients(data.patients || []);
//         setAllPatients(allPatientsData);
//         setReceivedNotifications(notificationsData);
//         setRendezvous(rdvData);
//         setConsultations(consultData);
//         setSharedResults(resultsData);

//         if (data.doctor) {
//           setProfileFormData({
//             id: data.doctor.id,
//             firstName: data.doctor.firstName,
//             lastName: data.doctor.lastName,
//             email: data.doctor.email,
//             speciality: data.doctor.speciality,
//             phoneNumber: data.doctor.phoneNumber || "",
//             address: data.doctor.address || "",
//           });
//         }
//       } catch (err: any) {
//         setError(err.message || "Une erreur est survenue lors du chargement des données.");
//         router.replace("/auth/login?role=medecin");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchMedecinData();
//   }, [router]);

//   const { newReceivedNotifications, allReceivedNotifications } = getNotificationData();

//   const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
//     const { name, value } = e.target;
//     setProfileFormData((prev) => ({ ...prev, [name]: value }));
//   };

//   const handleProfileSubmit = async () => {
//     try {
//       const token = document.cookie
//         .split("; ")
//         .find((row) => row.startsWith("token="))
//         ?.split("=")[1];

//       const res = await fetch("/api/medecin/me", {
//         method: "PUT",
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           firstName: profileFormData.firstName,
//           lastName: profileFormData.lastName,
//           email: profileFormData.email,
//           speciality: profileFormData.speciality,
//           phoneNumber: profileFormData.phoneNumber,
//           address: profileFormData.address,
//         }),
//       });

//       if (!res.ok) throw new Error(await res.text());
//       const updatedDoctor: Doctor = await res.json();
//       setDoctor(updatedDoctor);
//       setShowProfileModal(false);
//       setProfileError(null);
//       alert("Profil mis à jour avec succès !");
//     } catch (err: any) {
//       setProfileError(err.message || "Erreur lors de la mise à jour du profil.");
//     }
//   };

//   const sendNotification = async (patientId: string, message: string) => {
//     try {
//       const token = document.cookie
//         .split("; ")
//         .find((row) => row.startsWith("token="))
//         ?.split("=")[1];
//       console.log("Token utilisé :", token);
//       console.log("Envoi de notification à patientId :", patientId);

//       if (!token) {
//         throw new Error("Aucun token trouvé.");
//       }

//       const res = await fetch("/api/patient/notifications", {
//         method: "POST",
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ patientId, message }),
//         credentials: "include",
//       });

//       if (!res.ok) {
//         const errorText = await res.text();
//         throw new Error(`Erreur HTTP ${res.status}: ${errorText}`);
//       }

//       const newNotification: Notification = await res.json();
//       setSentNotifications((prev) => [...prev, newNotification]);
//     } catch (err: any) {
//       console.error("Erreur d'envoi de notification :", err.message);
//     }
//   };

//   const manageAppointment = async (appointmentId: string, action: "approve" | "reject" | "reschedule") => {
//     try {
//       const token = document.cookie
//         .split("; ")
//         .find((row) => row.startsWith("token="))
//         ?.split("=")[1];
//       let updatedRdv = null;

//       if (action === "reschedule") {
//         const newDate = prompt("Entrez la nouvelle date (YYYY-MM-DD HH:MM):");
//         if (newDate) {
//           const res = await fetch(`/api/medecin/appointments/${appointmentId}`, {
//             method: "PATCH",
//             headers: {
//               Authorization: `Bearer ${token}`,
//               "Content-Type": "application/json",
//             },
//             body: JSON.stringify({ status: "Confirmé", newDate }),
//           });
//           if (!res.ok) throw new Error(`Erreur lors de la reprogrammation: ${res.statusText}`);
//           updatedRdv = await res.json();
//         }
//       } else {
//         const res = await fetch(`/api/medecin/appointments/${appointmentId}`, {
//           method: "PATCH",
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({ status: action === "approve" ? "Confirmé" : "Rejeté" }),
//         });
//         if (!res.ok) throw new Error(`Erreur lors de la gestion du rendez-vous: ${res.statusText}`);
//         updatedRdv = await res.json();
//       }

//       setRendezvous((prev) =>
//         prev.map((rdv) =>
//           rdv.id === appointmentId ? { ...rdv, ...updatedRdv, status: updatedRdv.status } : rdv
//         )
//       );

//       const patient = patients.find((p) => p.id === updatedRdv.patientId);
//       if (patient) {
//         sendNotification(patient.id, `Votre rendez-vous a été ${action === "approve" ? "approuvé" : action === "reject" ? "rejeté" : "reprogrammé"}.`);
//       }
//     } catch (err: any) {
//       console.error("Erreur de gestion du rendez-vous:", err.message);
//     }
//   };

//   const handleConsultSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!selectedPatient || !patientAccessApproved) return;

//     try {
//       const token = document.cookie
//         .split("; ")
//         .find((row) => row.startsWith("token="))
//         ?.split("=")[1];

//       const res = await fetch("/api/medecin/consultations", {
//         method: "POST",
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           patientId: selectedPatient.id,
//           date: consultDate,
//           summary: consultSummary,
//         }),
//       });

//       if (!res.ok) throw new Error(await res.text());
//       const newConsult: Consultation = await res.json();
//       setConsultations((prev) => [...prev, newConsult]);
//       setShowConsultModal(false);
//       setConsultDate("");
//       setConsultSummary("");
//       setConsultError(null);
//       sendNotification(selectedPatient.id, "Une nouvelle consultation a été ajoutée à votre dossier.");
//     } catch (err: any) {
//       setConsultError(err.message);
//     }
//   };

//   const handleRdvSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!selectedPatient || !patientAccessApproved) return;

//     try {
//       const token = document.cookie
//         .split("; ")
//         .find((row) => row.startsWith("token="))
//         ?.split("=")[1];

//       const res = await fetch("/api/medecin/appointments", {
//         method: "POST",
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           patientId: selectedPatient.id,
//           date: rdvDate,
//           location: rdvLocation,
//           isTeleconsultation: rdvIsTeleconsultation,
//         }),
//       });

//       if (!res.ok) throw new Error(await res.text());
//       const newRdv: RendezVous = await res.json();
//       setRendezvous((prev) => [...prev, newRdv]);
//       setShowRdvModal(false);
//       setRdvDate("");
//       setRdvLocation("");
//       setRdvIsTeleconsultation(false);
//       setRdvError(null);
//       sendNotification(selectedPatient.id, "Un nouveau rendez-vous a été programmé.");
//     } catch (err: any) {
//       setRdvError(err.message);
//     }
//   };

//   const handleResultSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!selectedPatient || !patientAccessApproved) return;

//     try {
//       const token = document.cookie
//         .split("; ")
//         .find((row) => row.startsWith("token="))
//         ?.split("=")[1];

//       const res = await fetch("/api/medecin/results", {
//         method: "POST",
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           patientId: selectedPatient.id,
//           type: resultType,
//           date: resultDate,
//           description: resultDescription,
//           fileUrl: resultFileUrl,
//           isShared: resultIsShared,
//         }),
//       });

//       if (!res.ok) throw new Error(await res.text());
//       const newResult: Result = await res.json();
//       setSharedResults((prev) => [...prev, newResult]);
//       setShowResultModal(false);
//       setResultType("");
//       setResultDate("");
//       setResultDescription("");
//       setResultFileUrl("");
//       setResultIsShared(false);
//       setResultError(null);
//       sendNotification(selectedPatient.id, "Un nouveau résultat a été ajouté à votre dossier.");
//     } catch (err: any) {
//       setResultError(err.message);
//     }
//   };

//   const filteredPatients = allPatients.filter((p) =>
//     `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase())
//   );

//   const toggleReadNotification = (id: string) => {
//     setReceivedNotifications((prev) =>
//       prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
//     );
//   };

//   const handlePatientSelect = (patientId: string) => {
//     setRequestPatientId(patientId);
//     setShowAccessRequest(true);
//   };

//   const confirmAccess = () => {
//     if (requestPatientId) {
//       const patient = allPatients.find((p) => p.id === requestPatientId);
//       if (patient) {
//         setSelectedPatient(patient);
//         sendNotification(patient.id, "Le Dr. [Nom] demande l'accès à votre dossier. Veuillez accepter.");
//       }
//     }
//     setShowAccessRequest(false);
//     setRequestPatientId(null);
//     setPatientAccessApproved(false);
//   };

//   const approvePatientAccess = (patientId: string) => {
//     if (selectedPatient && selectedPatient.id === patientId) {
//       setPatientAccessApproved(true);
//       sendNotification(patientId, "L'accès à votre dossier a été approuvé par le patient.");
//     }
//   };

//   if (loading) return <div className="p-6 text-center text-gray-500">Chargement...</div>;
//   if (error) return <div className="p-6 text-center text-red-500">Erreur : {error}</div>;
//   if (!doctor) return <div className="p-6 text-center text-red-500">Utilisateur non connecté</div>;

//   return (
//     <div className="flex h-screen bg-gray-100">
//       <aside className="w-64 bg-white shadow-lg p-4">
//         <div className="mb-6">
//           <img src="/assets/images/logo.png" alt="Meddata Secured" className="h-10" />
//         </div>
//         <nav className="space-y-2">
//           <button
//             onClick={() => {
//               setActiveSection("accueil");
//               setActiveSubSection(null);
//               setIsDropdownOpen(null);
//             }}
//             className={`flex items-center w-full p-2 text-gray-700 hover:bg-blue-50 rounded-lg transition duration-200 ${
//               activeSection === "accueil" ? "bg-blue-100 font-medium" : ""
//             }`}
//           >
//             <HomeIcon className="h-5 w-5 mr-3" />
//             Accueil
//           </button>
//           <div className="relative">
//             <button
//               onClick={() => setIsDropdownOpen(isDropdownOpen === "profil" ? null : "profil")}
//               className={`flex items-center w-full p-2 text-gray-700 hover:bg-blue-50 rounded-lg transition duration-200 ${
//                 activeSection === "profil" ? "bg-blue-100 font-medium" : ""
//               }`}
//             >
//               <UserIcon className="h-5 w-5 mr-3" />
//               Profil
//               <svg
//                 className={`w-4 h-4 ml-auto ${isDropdownOpen === "profil" ? "transform rotate-180" : ""}`}
//                 fill="none"
//                 stroke="currentColor"
//                 viewBox="0 0 24 24"
//               >
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
//               </svg>
//             </button>
//             {isDropdownOpen === "profil" && (
//               <div className="absolute w-full mt-1 bg-white border rounded shadow-lg z-10">
//                 <button
//                   onClick={() => {
//                     setActiveSection("profil");
//                     setActiveSubSection("profil");
//                     setIsDropdownOpen(null);
//                   }}
//                   className="w-full text-left p-2 hover:bg-gray-100"
//                 >
//                   Voir Profil
//                 </button>
//                 <button
//                   onClick={() => {
//                     setActiveSection("profil");
//                     setActiveSubSection("editProfile");
//                     setIsDropdownOpen(null);
//                   }}
//                   className="w-full text-left p-2 hover:bg-gray-100"
//                 >
//                   Modifier Profil
//                 </button>
//               </div>
//             )}
//           </div>
//           <div className="relative">
//             <button
//               onClick={() => setIsDropdownOpen(isDropdownOpen === "patients" ? null : "patients")}
//               className={`flex items-center w-full p-2 text-gray-700 hover:bg-blue-50 rounded-lg transition duration-200 ${
//                 activeSection === "patients" ? "bg-blue-100 font-medium" : ""
//               }`}
//             >
//               <UserIcon className="h-5 w-5 mr-3" />
//               Patients
//               <svg
//                 className={`w-4 h-4 ml-auto ${isDropdownOpen === "patients" ? "transform rotate-180" : ""}`}
//                 fill="none"
//                 stroke="currentColor"
//                 viewBox="0 0 24 24"
//               >
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
//               </svg>
//             </button>
//             {isDropdownOpen === "patients" && (
//               <div className="absolute w-full mt-1 bg-white border rounded shadow-lg z-10">
//                 <button
//                   onClick={() => {
//                     setActiveSection("patients");
//                     setActiveSubSection("followed");
//                     setIsDropdownOpen(null);
//                   }}
//                   className="w-full text-left p-2 hover:bg-gray-100"
//                 >
//                   Patients Suivis
//                 </button>
//                 <button
//                   onClick={() => {
//                     setActiveSection("patients");
//                     setActiveSubSection("created");
//                     setIsDropdownOpen(null);
//                   }}
//                   className="w-full text-left p-2 hover:bg-gray-100"
//                 >
//                   Patients Créés
//                 </button>
//               </div>
//             )}
//           </div>
//           <button
//             onClick={() => {
//               setActiveSection("rendezvous");
//               setActiveSubSection("today");
//               setIsDropdownOpen(null);
//             }}
//             className={`flex items-center w-full p-2 text-gray-700 hover:bg-blue-50 rounded-lg transition duration-200 ${
//               activeSection === "rendezvous" ? "bg-blue-100 font-medium" : ""
//             }`}
//           >
//             <CalendarIcon className="h-5 w-5 mr-3" />
//             Rendez-vous
//           </button>
//           <button
//             onClick={() => {
//               setActiveSection("consultations");
//               setActiveSubSection("historique");
//               setIsDropdownOpen(null);
//             }}
//             className={`flex items-center w-full p-2 text-gray-700 hover:bg-blue-50 rounded-lg transition duration-200 ${
//               activeSection === "consultations" ? "bg-blue-100 font-medium" : ""
//             }`}
//           >
//             <ClipboardDocumentIcon className="h-5 w-5 mr-3" />
//             Consultations
//           </button>
//           <button
//             onClick={() => {
//               setActiveSection("results");
//               setActiveSubSection("results");
//               setIsDropdownOpen(null);
//             }}
//             className={`flex items-center w-full p-2 text-gray-700 hover:bg-blue-50 rounded-lg transition duration-200 ${
//               activeSection === "results" ? "bg-blue-100 font-medium" : ""
//             }`}
//           >
//             <DocumentTextIcon className="h-5 w-5 mr-3" />
//             Résultats
//           </button>
//           <button
//             onClick={() => {
//               setActiveSection("notifications");
//               setActiveSubSection("notifications");
//               setIsDropdownOpen(null);
//             }}
//             className={`flex items-center w-full p-2 text-gray-700 hover:bg-blue-50 rounded-lg transition duration-200 ${
//               activeSection === "notifications" ? "bg-blue-100 font-medium" : ""
//             }`}
//           >
//             <BellIcon className="h-5 w-5 mr-3" />
//             Notifications
//           </button>
//         </nav>
//         <div className="mt-4"></div>
//         <button
//           onClick={() => {
//             document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
//             router.replace("/auth/login?role=medecin");
//           }}
//           className="w-full text-left p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-200"
//         >
//           Se déconnecter
//         </button>
//       </aside>

//       <div className="flex-1 p-6">
//         <header className="flex justify-between items-center mb-6 bg-white p-4 rounded-lg shadow-md">
//           <h1 className="text-xl font-semibold text-gray-800">
//             Tableau de bord / {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)} / Dr.{" "}
//             {doctor?.firstName} {doctor?.lastName}
//           </h1>
//           <div className="flex space-x-4">
//             <button
//               onClick={() => setShowNotifPanel(!showNotifPanel)}
//               className="relative rounded-full p-2 hover:bg-gray-200"
//               title="Notifications"
//             >
//               <BellIcon className="h-6 w-6 text-gray-600 hover:text-gray-800" />
//               {newReceivedNotifications.length > 0 && (
//                 <span className="absolute top-0 right-0 inline-block w-5 h-5 bg-red-600 text-white text-xs font-bold rounded-full text-center leading-5">
//                   {newReceivedNotifications.length}
//                 </span>
//               )}
//             </button>
//             <Cog6ToothIcon className="h-6 w-6 text-gray-600 hover:text-gray-800 cursor-pointer" />
//           </div>
//         </header>

//         {showNotifPanel && (
//           <Card className="absolute right-6 mt-2 w-80 max-h-80 overflow-y-auto rounded-2xl shadow-lg border bg-white z-50">
//             <CardHeader>
//               <CardTitle className="text-lg font-semibold text-gray-800">Notifications</CardTitle>
//             </CardHeader>
//             <CardContent>
//               {allReceivedNotifications.length > 0 ? (
//                 <ul className="space-y-2 text-gray-700">
//                   {allReceivedNotifications.map((note) => (
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

//         {showAccessRequest && (
//           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//             <Card className="w-96 p-6 bg-white rounded-2xl">
//               <CardHeader>
//                 <CardTitle>Demande d'accès</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <p>Voulez-vous accéder au dossier du patient ?</p>
//                 <div className="flex justify-end gap-2 mt-4">
//                   <Button
//                     variant="outline"
//                     onClick={() => {
//                       setShowAccessRequest(false);
//                       setRequestPatientId(null);
//                     }}
//                   >
//                     Annuler
//                   </Button>
//                   <Button onClick={confirmAccess}>Confirmer</Button>
//                 </div>
//               </CardContent>
//             </Card>
//           </div>
//         )}

//         {activeSection === "accueil" && (
//           <section className="bg-white p-6 rounded-lg shadow-md">
//             <h1 className="text-2xl font-semibold text-gray-900 mb-4">
//               Bienvenue, Dr. {doctor?.firstName} {doctor?.lastName} !
//             </h1>
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
//               <div className="p-4 bg-blue-50 rounded-lg text-center hover:bg-blue-100 transition duration-200">
//                 <UserIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
//                 <p className="text-gray-700 font-medium">Patients Suivis</p>
//                 <p className="text-gray-500">{patients.length}</p>
//               </div>
//               <div className="p-4 bg-green-50 rounded-lg text-center hover:bg-green-100 transition duration-200">
//                 <CalendarIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
//                 <p className="text-gray-700 font-medium">Rendez-vous</p>
//                 <p className="text-gray-500">{rendezvous.length}</p>
//               </div>
//               <div className="p-4 bg-yellow-50 rounded-lg text-center hover:bg-yellow-100 transition duration-200">
//                 <ClipboardDocumentIcon className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
//                 <p className="text-gray-700 font-medium">Consultations</p>
//                 <p className="text-gray-500">{consultations.length}</p>
//               </div>
//               <div className="p-4 bg-purple-50 rounded-lg text-center hover:bg-purple-100 transition duration-200">
//                 <DocumentTextIcon className="h-8 w-8 text-purple-600 mx-auto mb-2" />
//                 <p className="text-gray-700 font-medium">Résultats</p>
//                 <p className="text-gray-500">{sharedResults.length}</p>
//               </div>
//             </div>
//             <Input
//               placeholder="🔍 Rechercher un patient..."
//               value={search}
//               onChange={(e) => setSearch(e.target.value)}
//               className="mb-4 w-full md:w-1/2"
//             />
//             {search && filteredPatients.length > 0 && (
//               <div className="space-y-3">
//                 {filteredPatients.map((patient) => (
//                   <Card
//                     key={patient.id}
//                     onClick={() => handlePatientSelect(patient.id)}
//                     className="cursor-pointer rounded-xl border border-gray-200 hover:border-primary"
//                   >
//                     <CardContent className="p-4">
//                       <h3 className="font-semibold text-gray-800">{patient.firstName} {patient.lastName}</h3>
//                     </CardContent>
//                   </Card>
//                 ))}
//               </div>
//             )}
//             {!search && <p className="text-gray-500 text-center">Veuillez effectuer une recherche pour voir les patients.</p>}
//             {selectedPatient && !patientAccessApproved && (
//               <p className="mt-4 text-yellow-600 text-center">
//                 Une demande d'accès a été envoyée à {selectedPatient.firstName} {selectedPatient.lastName}. Attendez l'approbation.
//               </p>
//             )}
//             {selectedPatient && patientAccessApproved && (
//               <div className="mt-6 flex gap-3">
//                 <Button onClick={() => setShowRdvModal(true)}>📅 Nouveau RDV</Button>
//                 <Button onClick={() => setShowConsultModal(true)}>🩺 Nouvelle Consultation</Button>
//                 <Button onClick={() => setShowResultModal(true)}>📊 Nouveau Résultat</Button>
//                 <Button
//                   onClick={() =>
//                     sendNotification(selectedPatient.id, "Rappel: Votre rendez-vous est prévu bientôt.")
//                   }
//                 >
//                   🔔 Envoyer Notification
//                 </Button>
//               </div>
//             )}
//           </section>
//         )}

//         {activeSection === "profil" && activeSubSection === "profil" && (
//           <section>
//             <h1 className="text-3xl font-bold text-gray-900 mb-6">Mon Profil</h1>
//             <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div className="p-6 bg-gradient-to-br from-blue-50 to-white rounded-xl text-center">
//                   <div className="w-24 h-24 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
//                     <UserIcon className="h-12 w-12 text-blue-600" />
//                   </div>
//                   <h3 className="text-2xl font-semibold text-gray-800 mb-2">Dr. {doctor?.firstName} {doctor?.lastName}</h3>
//                   <p className="text-gray-600 mb-1">ID: {doctor?.id}</p>
//                   <p className="text-gray-600 mb-1">Spécialité: {doctor?.speciality}</p>
//                   <h4 className="text-lg font-medium text-gray-700 mt-4 mb-2">Contacts</h4>
//                   <p className="text-gray-600 mb-1">Email: {doctor?.email}</p>
//                   <p className="text-gray-600 mb-1">Téléphone: {doctor?.phoneNumber || "Non spécifié"}</p>
//                   <p className="text-gray-600">Adresse: {doctor?.address || "Non spécifié"}</p>
//                 </div>
//               </div>
//               <div className="mt-6 text-center">
//                 <Button
//                   onClick={() => {
//                     setActiveSection("profil");
//                     setActiveSubSection("editProfile");
//                   }}
//                   className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
//                 >
//                   Modifier Profil
//                 </Button>
//               </div>
//             </div>
//           </section>
//         )}

//         {activeSection === "profil" && activeSubSection === "editProfile" && (
//           <section>
//             <h1 className="text-3xl font-bold text-gray-900 mb-6">Modifier le Profil</h1>
//             <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div className="p-6 bg-gradient-to-br from-green-50 to-white rounded-xl">
//                   {profileError && <p className="text-red-500 mb-4 text-center">{profileError}</p>}
//                   <div className="space-y-4">
//                     <Input
//                       type="text"
//                       name="firstName"
//                       value={profileFormData.firstName}
//                       onChange={handleProfileChange}
//                       placeholder="Prénom"
//                       className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
//                       required
//                     />
//                     <Input
//                       type="text"
//                       name="lastName"
//                       value={profileFormData.lastName}
//                       onChange={handleProfileChange}
//                       placeholder="Nom"
//                       className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
//                       required
//                     />
//                     <Input
//                       type="email"
//                       name="email"
//                       value={profileFormData.email}
//                       onChange={handleProfileChange}
//                       placeholder="Email"
//                       className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
//                       required
//                     />
//                     <Input
//                       type="text"
//                       name="speciality"
//                       value={profileFormData.speciality}
//                       onChange={handleProfileChange}
//                       placeholder="Spécialité"
//                       className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
//                       required
//                     />
//                     <Input
//                       type="text"
//                       name="phoneNumber"
//                       value={profileFormData.phoneNumber}
//                       onChange={handleProfileChange}
//                       placeholder="Numéro de téléphone"
//                       className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
//                     />
//                     <Input
//                       type="text"
//                       name="address"
//                       value={profileFormData.address}
//                       onChange={handleProfileChange}
//                       placeholder="Adresse"
//                       className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
//                     />
//                   </div>
//                   <div className="mt-6 flex justify-center gap-4">
//                     <Button
//                       onClick={() => setShowProfileModal(false)}
//                       variant="outline"
//                       className="px-6 py-2 rounded-lg border-gray-300 hover:bg-gray-100"
//                     >
//                       Annuler
//                     </Button>
//                     <Button
//                       onClick={handleProfileSubmit}
//                       className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
//                     >
//                       Enregistrer
//                     </Button>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </section>
//         )}

//         {activeSection === "patients" && (
//           <section>
//             <h1 className="text-3xl font-bold text-gray-900 mb-6">Patients</h1>
//             <div className="bg-white p-6 rounded-lg shadow-md">
//               <div className="flex justify-between items-center mb-4">
//                 <Input
//                   placeholder="🔍 Rechercher un patient..."
//                   value={search}
//                   onChange={(e) => setSearch(e.target.value)}
//                   className="w-1/3 rounded-xl"
//                 />
//                 <Link href="/patients/new">
//                   <Button className="rounded-xl">+ Nouveau Patient</Button>
//                 </Link>
//               </div>
//               {activeSubSection === "followed" && (
//                 <div className="space-y-3">
//                   {filteredPatients.length > 0 ? (
//                     filteredPatients.map((patient) => (
//                       <Card
//                         key={patient.id}
//                         onClick={() => handlePatientSelect(patient.id)}
//                         className={`cursor-pointer rounded-xl border ${
//                           selectedPatient?.id === patient.id
//                             ? "border-2 border-primary bg-primary/10"
//                             : "border-gray-200"
//                         }`}
//                       >
//                         <CardContent className="p-4">
//                           <h3 className="font-semibold text-gray-800">
//                             {patient.firstName} {patient.lastName}
//                           </h3>
//                         </CardContent>
//                       </Card>
//                     ))
//                   ) : (
//                     <p className="text-gray-500 text-center">Aucun patient trouvé.</p>
//                   )}
//                 </div>
//               )}
//               {activeSubSection === "created" && (
//                 <div className="space-y-3">
//                   {filteredPatients.filter((p) => p.dossier.includes("Créé par")).length > 0 ? (
//                     filteredPatients
//                       .filter((p) => p.dossier.includes("Créé par"))
//                       .map((patient) => (
//                         <Card
//                           key={patient.id}
//                           onClick={() => handlePatientSelect(patient.id)}
//                           className={`cursor-pointer rounded-xl border ${
//                             selectedPatient?.id === patient.id
//                               ? "border-2 border-primary bg-primary/10"
//                               : "border-gray-200"
//                           }`}
//                         >
//                           <CardContent className="p-4">
//                             <h3 className="font-semibold text-gray-800">
//                               {patient.firstName} {patient.lastName}
//                             </h3>
//                           </CardContent>
//                         </Card>
//                       ))
//                   ) : (
//                     <p className="text-gray-500 text-center">Aucun patient créé.</p>
//                   )}
//                 </div>
//               )}
//               {selectedPatient && !patientAccessApproved && (
//                 <p className="mt-6 text-yellow-600 text-center">
//                   Une demande d'accès a été envoyée à {selectedPatient.firstName} {selectedPatient.lastName}. Attendez l'approbation.
//                 </p>
//               )}
//               {selectedPatient && patientAccessApproved && (
//                 <Card className="mt-6 rounded-2xl shadow-xl p-6 border bg-white">
//                   <CardHeader>
//                     <CardTitle className="text-3xl font-bold text-gray-800">
//                       {selectedPatient.firstName} {selectedPatient.lastName}
//                     </CardTitle>
//                     <p className="text-gray-500">Né(e) le {selectedPatient.birthDate}</p>
//                   </CardHeader>
//                   <CardContent>
//                     <p className="mb-6 text-gray-700 text-base leading-relaxed">{selectedPatient.dossier}</p>
//                     <div className="flex flex-wrap gap-3 mb-6">
//                       <Button variant="outline" asChild className="rounded-xl">
//                         <Link href={`/patients/${selectedPatient.id}/edit`}>✏️ Modifier</Link>
//                       </Button>
//                       <Button
//                         variant="secondary"
//                         className="rounded-xl"
//                         onClick={() => setShowRdvModal(true)}
//                       >
//                         📅 Nouveau RDV
//                       </Button>
//                       <Button
//                         variant="secondary"
//                         className="rounded-xl"
//                         onClick={() => setShowConsultModal(true)}
//                       >
//                         🩺 Nouvelle Consultation
//                       </Button>
//                       <Button
//                         variant="secondary"
//                         className="rounded-xl"
//                         onClick={() => setShowResultModal(true)}
//                       >
//                         📊 Nouveau Résultat
//                       </Button>
//                       <Button
//                         variant="secondary"
//                         className="rounded-xl"
//                         onClick={() =>
//                           sendNotification(
//                             selectedPatient.id,
//                             "Rappel: Votre rendez-vous est prévu bientôt."
//                           )
//                         }
//                       >
//                         🔔 Envoyer Notification
//                       </Button>
//                     </div>
//                     <div className="space-y-4">
//                       <h3 className="font-semibold text-lg text-gray-800">📅 Rendez-vous Programmés</h3>
//                       {rendezvous.filter((rdv) => rdv.patientId === selectedPatient.id).length > 0 ? (
//                         <ul className="list-disc ml-5 text-gray-600 text-sm">
//                           {rendezvous
//                             .filter((rdv) => rdv.patientId === selectedPatient.id)
//                             .map((rdv) => (
//                               <li key={rdv.id}>
//                                 {patients.find((p) => p.id === rdv.patientId)?.firstName}{" "}
//                                 {patients.find((p) => p.id === rdv.patientId)?.lastName} -{" "}
//                                 {new Date(rdv.date).toLocaleString()} - {rdv.location} (
//                                 {rdv.isTeleconsultation ? "Téléconsultation" : "Présentiel"}) - Statut:{" "}
//                                 {rdv.status}
//                                 {rdv.status === "En attente" && (
//                                   <div className="inline-flex gap-2 ml-2">
//                                     <Button
//                                       size="sm"
//                                       variant="outline"
//                                       onClick={() => manageAppointment(rdv.id, "approve")}
//                                     >
//                                       Approuver
//                                     </Button>
//                                     <Button
//                                       size="sm"
//                                       variant="destructive"
//                                       onClick={() => manageAppointment(rdv.id, "reject")}
//                                     >
//                                       Rejeter
//                                     </Button>
//                                     <Button
//                                       size="sm"
//                                       variant="outline"
//                                       onClick={() => manageAppointment(rdv.id, "reschedule")}
//                                     >
//                                       Reprogrammer
//                                     </Button>
//                                   </div>
//                                 )}
//                               </li>
//                             ))}
//                         </ul>
//                       ) : (
//                         <p className="ml-5 text-gray-500 text-center">Aucun rendez-vous programmé.</p>
//                       )}

//                       <h3 className="font-semibold text-lg text-gray-800 mt-6">🩺 Consultations Réalisées</h3>
//                       {consultations.filter((consult) => consult.patientId === selectedPatient.id).length >
//                       0 ? (
//                         <ul className="list-disc ml-5 text-gray-600 text-sm">
//                           {consultations
//                             .filter((consult) => consult.patientId === selectedPatient.id)
//                             .map((consult) => (
//                               <li key={consult.id}>
//                                 {patients.find((p) => p.id === consult.patientId)?.firstName}{" "}
//                                 {patients.find((p) => p.id === consult.patientId)?.lastName} -{" "}
//                                 {new Date(consult.date).toLocaleString()} - {consult.summary}
//                               </li>
//                             ))}
//                         </ul>
//                       ) : (
//                         <p className="ml-5 text-gray-500 text-center">Aucune consultation réalisée.</p>
//                       )}

//                       <h3 className="font-semibold text-lg text-gray-800 mt-6">📊 Résultats Générés</h3>
//                       {sharedResults.filter((result) => result.patientId === selectedPatient.id).length >
//                       0 ? (
//                         <ul className="list-disc ml-5 text-gray-600 text-sm">
//                           {sharedResults
//                             .filter((result) => result.patientId === selectedPatient.id)
//                             .map((result) => (
//                               <li key={result.id}>
//                                 {patients.find((p) => p.id === result.patientId)?.firstName}{" "}
//                                 {patients.find((p) => p.id === result.patientId)?.lastName} - {result.type} -{" "}
//                                 {new Date(result.date).toLocaleString()}: {result.description}
//                                 {result.fileUrl && (
//                                   <span>
//                                     {" "}
//                                     <a href={result.fileUrl} className="text-blue-600 hover:underline">
//                                       Voir le fichier
//                                     </a>
//                                   </span>
//                                 )}
//                               </li>
//                             ))}
//                         </ul>
//                       ) : (
//                         <p className="ml-5 text-gray-500 text-center">Aucun résultat généré.</p>
//                       )}
//                     </div>
//                   </CardContent>
//                 </Card>
//               )}
//             </div>
//           </section>
//         )}

//         {activeSection === "rendezvous" && (
//           <section>
//             <h1 className="text-3xl font-bold text-gray-900 mb-6">Rendez-vous</h1>
//             <div className="bg-white p-6 rounded-lg shadow-md">
//               <div className="flex justify-between items-center mb-6">
//                 <div>
//                   <select
//                     value={activeSubSection || "today"}
//                     onChange={(e) => setActiveSubSection(e.target.value || "today")}
//                     className="p-1 border rounded"
//                   >
//                     <option value="today">Aujourd'hui</option>
//                     <option value="month">Mois</option>
//                   </select>
//                   <Input
//                     type="text"
//                     placeholder="Sélectionner un patient..."
//                     value={search}
//                     onChange={(e) => setSearch(e.target.value)}
//                     className="ml-2 w-1/3 p-1 border rounded"
//                     onBlur={(e) => {
//                       const patient = patients.find((p) =>
//                         `${p.firstName} ${p.lastName}`.toLowerCase() === e.target.value.toLowerCase()
//                       );
//                       if (patient) handlePatientSelect(patient.id);
//                     }}
//                   />
//                 </div>
//                 <Button
//                   onClick={() => setShowRdvModal(true)}
//                   className="bg-blue-600 text-white px-4 py-2 rounded"
//                 >
//                   + Créer un rendez-vous
//                 </Button>
//               </div>
//               {activeSubSection === "today" && (
//                 <div className="p-4 bg-gray-50 rounded-lg">
//                   {rendezvous.filter((a) => new Date(a.date).toDateString() === new Date().toDateString())
//                     .length > 0 ? (
//                     rendezvous
//                       .filter((a) => new Date(a.date).toDateString() === new Date().toDateString())
//                       .map((a) => (
//                         <div key={a.id} className="border p-3 rounded-lg mb-2">
//                           <p>
//                             {patients.find((p) => p.id === a.patientId)?.firstName}{" "}
//                             {patients.find((p) => p.id === a.patientId)?.lastName} -{" "}
//                             {new Date(a.date).toLocaleString()} - {a.location} (
//                             {a.isTeleconsultation ? "Téléconsultation" : "Présentiel"}) - Statut: {a.status}
//                           </p>
//                           {a.status === "En attente" && (
//                             <div className="flex gap-2 mt-2">
//                               <Button
//                                 size="sm"
//                                 variant="outline"
//                                 onClick={() => manageAppointment(a.id, "approve")}
//                               >
//                                 Approuver
//                               </Button>
//                               <Button
//                                 size="sm"
//                                 variant="destructive"
//                                 onClick={() => manageAppointment(a.id, "reject")}
//                               >
//                                 Rejeter
//                               </Button>
//                               <Button
//                                 size="sm"
//                                 variant="outline"
//                                 onClick={() => manageAppointment(a.id, "reschedule")}
//                               >
//                                 Reprogrammer
//                               </Button>
//                             </div>
//                           )}
//                         </div>
//                       ))
//                   ) : (
//                     <p className="text-gray-600">Aucun rendez-vous aujourd'hui.</p>
//                   )}
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
//                   {Array.from({ length: 30 }, (_, i) => (
//                     <div
//                       key={i + 1}
//                       className={`p-2 ${
//                         rendezvous.some((a) => new Date(a.date).getDate() === i + 1)
//                           ? "bg-blue-100 rounded-full"
//                           : ""
//                       }`}
//                     >
//                       {i + 1}
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </div>
//           </section>
//         )}

//         {activeSection === "consultations" && (
//           <section>
//             <h1 className="text-3xl font-bold text-gray-900 mb-6">Consultations</h1>
//             <div className="bg-white p-6 rounded-lg shadow-md">
//               <div className="flex justify-between items-center mb-6">
//                 <button onClick={() => setActiveSubSection("historique")} className="text-blue-600">
//                   Historique
//                 </button>
//                 <Input
//                   type="text"
//                   placeholder="Sélectionner un patient..."
//                   value={search}
//                   onChange={(e) => setSearch(e.target.value)}
//                   className="w-1/3 p-1 border rounded"
//                   onBlur={(e) => {
//                     const patient = patients.find((p) =>
//                       `${p.firstName} ${p.lastName}`.toLowerCase() === e.target.value.toLowerCase()
//                     );
//                     if (patient) handlePatientSelect(patient.id);
//                   }}
//                 />
//                 <Button
//                   onClick={() => setShowConsultModal(true)}
//                   className="bg-blue-600 text-white px-4 py-2 rounded"
//                 >
//                   + Créer une consultation
//                 </Button>
//               </div>
//               {activeSubSection === "historique" && (
//                 <div className="p-4 bg-gray-50 rounded-lg">
//                   {consultations.length > 0 ? (
//                     consultations.map((c) => (
//                       <div key={c.id} className="border p-3 rounded-lg mb-2">
//                         <p>
//                           <strong>Patient :</strong> {c.patient.firstName} {c.patient.lastName} - <strong>Date :</strong> {new Date(c.date).toLocaleString()}
//                         </p>
//                         <p>
//                           <strong>Résumé :</strong> {c.summary}
//                         </p>
//                       </div>
//                     ))
//                   ) : (
//                     <p className="text-gray-600">Aucune consultation disponible.</p>
//                   )}
//                 </div>
//               )}
//             </div>
//           </section>
//         )}

//         {activeSection === "results" && (
//           <section>
//             <h1 className="text-3xl font-bold text-gray-900 mb-6">Résultats</h1>
//             <div className="bg-white p-6 rounded-lg shadow-md">
//               <Input
//                 type="text"
//                 placeholder="Sélectionner un patient..."
//                 value={search}
//                 onChange={(e) => setSearch(e.target.value)}
//                 className="w-1/3 p-1 border rounded mb-4"
//                 onBlur={(e) => {
//                   const patient = patients.find((p) =>
//                     `${p.firstName} ${p.lastName}`.toLowerCase() === e.target.value.toLowerCase()
//                   );
//                   if (patient) handlePatientSelect(patient.id);
//                 }}
//               />
//               <Button
//                 variant="default"
//                 className="mb-4 bg-blue-600 text-white"
//                 onClick={() => setShowResultModal(true)}
//               >
//                 Ajouter un résultat
//               </Button>
//               {sharedResults.length > 0 ? (
//                 <ul className="space-y-4">
//                   {sharedResults.map((result) => (
//                     <li key={result.id} className="border p-4 rounded-lg">
//                       <div className="flex justify-between items-center">
//                         <div>
//                           <h3 className="text-lg font-medium">{result.type}</h3>
//                           <p><strong>Patient :</strong> {result.patient.firstName} {result.patient.lastName} - <strong>Date :</strong> {new Date(result.date).toLocaleString()}</p>
//                           <p>{result.description}</p>
//                           {result.fileUrl && (
//                             <a
//                               href={result.fileUrl}
//                               className="text-blue-600 hover:underline"
//                               target="_blank"
//                               rel="noopener noreferrer"
//                             >
//                               Voir le fichier
//                             </a>
//                           )}
//                         </div>
//                       </div>
//                     </li>
//                   ))}
//                 </ul>
//               ) : (
//                 <p className="text-gray-600">Aucun résultat disponible.</p>
//               )}
//             </div>
//           </section>
//         )}

//         {activeSection === "notifications" && (
//           <section>
//             <h1 className="text-3xl font-bold text-gray-900 mb-6">Notifications</h1>
//             <div className="bg-white p-6 rounded-lg shadow-md">
//               {allReceivedNotifications.length > 0 ? (
//                 <ul className="space-y-4">
//                   {allReceivedNotifications.map((note) => (
//                     <li
//                       key={note.id}
//                       onClick={() => toggleReadNotification(note.id)}
//                       className={`cursor-pointer p-3 rounded-lg ${
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
//                 <p className="text-gray-600">Aucune notification disponible.</p>
//               )}
//             </div>
//           </section>
//         )}

//         {showConsultModal && (
//           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//             <Card className="w-96 p-6 bg-white rounded-2xl">
//               <CardHeader>
//                 <CardTitle>Nouvelle Consultation</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 {consultError && <p className="text-red-500 mb-4">{consultError}</p>}
//                 <form onSubmit={handleConsultSubmit} className="space-y-4">
//                   <select
//                     value={selectedPatient?.id || ""}
//                     onChange={(e) => {
//                       const patient = patients.find((p) => p.id === e.target.value);
//                       if (patient) setSelectedPatient(patient);
//                     }}
//                     required
//                   >
//                     <option value="">Sélectionner un patient</option>
//                     {patients.map((patient) => (
//                       <option key={patient.id} value={patient.id}>
//                         {patient.firstName} {patient.lastName}
//                       </option>
//                     ))}
//                   </select>
//                   <Input
//                     type="datetime-local"
//                     value={consultDate}
//                     onChange={(e) => setConsultDate(e.target.value)}
//                     required
//                   />
//                   <Textarea
//                     placeholder="Résumé de la consultation"
//                     value={consultSummary}
//                     onChange={(e) => setConsultSummary(e.target.value)}
//                     required
//                   />
//                   <div className="flex justify-end gap-2">
//                     <Button
//                       variant="outline"
//                       onClick={() => {
//                         setShowConsultModal(false);
//                         setConsultError(null);
//                       }}
//                     >
//                       Annuler
//                     </Button>
//                     <Button type="submit">Enregistrer</Button>
//                   </div>
//                 </form>
//               </CardContent>
//             </Card>
//           </div>
//         )}

//         {showRdvModal && (
//           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//             <Card className="w-96 p-6 bg-white rounded-2xl">
//               <CardHeader>
//                 <CardTitle>Nouveau Rendez-vous</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 {rdvError && <p className="text-red-500 mb-4">{rdvError}</p>}
//                 <form onSubmit={handleRdvSubmit} className="space-y-4">
//                   <select
//                     value={selectedPatient?.id || ""}
//                     onChange={(e) => {
//                       const patient = patients.find((p) => p.id === e.target.value);
//                       if (patient) setSelectedPatient(patient);
//                     }}
//                     required
//                   >
//                     <option value="">Sélectionner un patient</option>
//                     {patients.map((patient) => (
//                       <option key={patient.id} value={patient.id}>
//                         {patient.firstName} {patient.lastName}
//                       </option>
//                     ))}
//                   </select>
//                   <Input
//                     type="datetime-local"
//                     value={rdvDate}
//                     onChange={(e) => setRdvDate(e.target.value)}
//                     required
//                   />
//                   <Input
//                     placeholder="Lieu du rendez-vous"
//                     value={rdvLocation}
//                     onChange={(e) => setRdvLocation(e.target.value)}
//                     required
//                   />
//                   <div className="flex items-center space-x-2">
//                     <Checkbox
//                       checked={rdvIsTeleconsultation}
//                       onCheckedChange={(checked) => setRdvIsTeleconsultation(!!checked)}
//                     />
//                     <label>Téléconsultation</label>
//                   </div>
//                   <div className="flex justify-end gap-2">
//                     <Button
//                       variant="outline"
//                       onClick={() => {
//                         setShowRdvModal(false);
//                         setRdvError(null);
//                       }}
//                     >
//                       Annuler
//                     </Button>
//                     <Button type="submit">Enregistrer</Button>
//                   </div>
//                 </form>
//               </CardContent>
//             </Card>
//           </div>
//         )}

//         {showResultModal && (
//           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//             <Card className="w-96 p-6 bg-white rounded-2xl">
//               <CardHeader>
//                 <CardTitle>Nouveau Résultat</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 {resultError && <p className="text-red-500 mb-4">{resultError}</p>}
//                 <form onSubmit={handleResultSubmit} className="space-y-4">
//                   <select
//                     value={selectedPatient?.id || ""}
//                     onChange={(e) => {
//                       const patient = patients.find((p) => p.id === e.target.value);
//                       if (patient) setSelectedPatient(patient);
//                     }}
//                     required
//                   >
//                     <option value="">Sélectionner un patient</option>
//                     {patients.map((patient) => (
//                       <option key={patient.id} value={patient.id}>
//                         {patient.firstName} {patient.lastName}
//                       </option>
//                     ))}
//                   </select>
//                   <Input
//                     placeholder="Type (ex: Analyse sanguine)"
//                     value={resultType}
//                     onChange={(e) => setResultType(e.target.value)}
//                     required
//                   />
//                   <Input
//                     type="datetime-local"
//                     value={resultDate}
//                     onChange={(e) => setResultDate(e.target.value)}
//                     required
//                   />
//                   <Textarea
//                     placeholder="Description"
//                     value={resultDescription}
//                     onChange={(e) => setResultDescription(e.target.value)}
//                     required
//                   />
//                   <Input
//                     placeholder="URL du fichier (optionnel)"
//                     value={resultFileUrl}
//                     onChange={(e) => setResultFileUrl(e.target.value)}
//                   />
//                   <div className="flex items-center space-x-2">
//                     <Checkbox
//                       checked={resultIsShared}
//                       onCheckedChange={(checked) => setResultIsShared(!!checked)}
//                     />
//                     <label>Partager avec un autre médecin</label>
//                   </div>
//                   <div className="flex justify-end gap-2">
//                     <Button
//                       variant="outline"
//                       onClick={() => {
//                         setShowResultModal(false);
//                         setResultError(null);
//                       }}
//                     >
//                       Annuler
//                     </Button>
//                     <Button type="submit">Enregistrer</Button>
//                   </div>
//                 </form>
//               </CardContent>
//             </Card>
//           </div>
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
  ClipboardDocumentIcon,
  BellIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";

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

interface Result {
  id: string;
  type: string;
  date: string;
  description: string;
  fileUrl?: string;
  patientId: string;
  patient: { id: string; firstName: string; lastName: string };
}

interface RendezVous {
  id: string;
  date: string;
  location: string;
  status: string;
  isTeleconsultation: boolean;
  patientId: string;
  newDate?: string;
}

interface Consultation {
  id: string;
  date: string;
  summary: string;
  patientId: string;
  patient: { firstName: string; lastName: string };
}

interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  speciality: string;
  phoneNumber?: string;
  address?: string;
}

interface MedecinResponse {
  doctor?: Doctor;
  patients?: Patient[];
  allPatients?: Patient[];
  notifications?: Notification[];
  sharedResults?: Result[];
  rendezvous?: RendezVous[];
  consultations?: Consultation[];
}

export default function DashboardMedecin() {
  const router = useRouter();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [receivedNotifications, setReceivedNotifications] = useState<Notification[]>([]);
  const [sentNotifications, setSentNotifications] = useState<Notification[]>([]);
  const [sharedResults, setSharedResults] = useState<Result[]>([]);
  const [rendezvous, setRendezvous] = useState<RendezVous[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState("accueil");
  const [activeSubSection, setActiveSubSection] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState<string | null>(null);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [showAccessRequest, setShowAccessRequest] = useState(false);
  const [requestPatientId, setRequestPatientId] = useState<string | null>(null);
  const [patientAccessApproved, setPatientAccessApproved] = useState<boolean>(false);

  const [showConsultModal, setShowConsultModal] = useState(false);
  const [consultDate, setConsultDate] = useState("");
  const [consultSummary, setConsultSummary] = useState("");
  const [consultError, setConsultError] = useState<string | null>(null);

  const [showRdvModal, setShowRdvModal] = useState(false);
  const [rdvDate, setRdvDate] = useState("");
  const [rdvLocation, setRdvLocation] = useState("");
  const [rdvIsTeleconsultation, setRdvIsTeleconsultation] = useState(false);
  const [rdvError, setRdvError] = useState<string | null>(null);

  const [showResultModal, setShowResultModal] = useState(false);
  const [resultType, setResultType] = useState("");
  const [resultDate, setResultDate] = useState("");
  const [resultDescription, setResultDescription] = useState("");
  const [resultFileUrl, setResultFileUrl] = useState("");
  const [resultIsShared, setResultIsShared] = useState(false);
  const [resultError, setResultError] = useState<string | null>(null);

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileFormData, setProfileFormData] = useState<Doctor>({
    id: "",
    firstName: "",
    lastName: "",
    email: "",
    speciality: "",
    phoneNumber: "",
    address: "",
  });
  const [profileError, setProfileError] = useState<string | null>(null);

  const getNotificationData = () => {
    const newReceivedNotifications = Array.isArray(receivedNotifications)
      ? receivedNotifications.filter((n) => !n.read)
      : [];
    const allReceivedNotifications = [...(Array.isArray(receivedNotifications) ? receivedNotifications : [])].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    return { newReceivedNotifications, allReceivedNotifications };
  };

  // useEffect(() => {
  //   const fetchMedecinData = async () => {
  //     try {
  //       const token = document.cookie
  //         .split("; ")
  //         .find((row) => row.startsWith("token="))
  //         ?.split("=")[1];

  //       if (!token) {
  //         throw new Error("Aucun token trouvé. Redirection...");
  //       }

  //       const role = document.cookie
  //         .split("; ")
  //         .find((row) => row.startsWith("role="))
  //         ?.split("=")[1]?.toLowerCase();
  //       if (role !== "medecin") {
  //         throw new Error("Rôle invalide. Redirection...");
  //       }

  //       const [meRes, notificationsRes, rdvRes, consultRes, resultsRes, allPatientsRes] = await Promise.all([
  //         fetch("/api/medecin/me", {
  //           headers: { Authorization: `Bearer ${token}` },
  //           credentials: "include",
  //           cache: "no-store",
  //         }),
  //         fetch("/api/medecin/notifications", {
  //           headers: { Authorization: `Bearer ${token}` },
  //           credentials: "include",
  //           cache: "no-store",
  //         }),
  //         fetch("/api/medecin/appointments", {
  //           headers: { Authorization: `Bearer ${token}` },
  //           credentials: "include",
  //           cache: "no-store",
  //         }),
  //         fetch("/api/medecin/consultations", {
  //           headers: { Authorization: `Bearer ${token}` },
  //           credentials: "include",
  //           cache: "no-store",
  //         }),
  //         fetch("/api/medecin/results", {
  //           headers: { Authorization: `Bearer ${token}` },
  //           credentials: "include",
  //           cache: "no-store",
  //         }),
  //         fetch("/api/patients/all", {
  //           headers: { Authorization: `Bearer ${token}` },
  //           credentials: "include",
  //           cache: "no-store",
  //         }),
  //       ]);

  //       if (!meRes.ok) throw new Error(`Erreur API /medecin/me: ${meRes.statusText}`);
  //       if (!notificationsRes.ok) throw new Error(`Erreur API /medecin/notifications: ${notificationsRes.statusText}`);
  //       if (!rdvRes.ok) throw new Error(`Erreur API /medecin/appointments: ${rdvRes.statusText}`);
  //       if (!consultRes.ok) throw new Error(`Erreur API /medecin/consultations: ${consultRes.statusText}`);
  //       if (!resultsRes.ok) throw new Error(`Erreur API /medecin/results: ${resultsRes.statusText}`);
  //       if (!allPatientsRes.ok) throw new Error(`Erreur API /patients/all: ${allPatientsRes.statusText}`);

  //       const data: MedecinResponse = await meRes.json();
  //       const notificationsResponse = await notificationsRes.json();
  //       const notificationsData: Notification[] = Array.isArray(notificationsResponse) ? notificationsResponse : [];
  //       const rdvData: RendezVous[] = await rdvRes.json() || [];
  //       const consultData: Consultation[] = await consultRes.json() || [];
  //       const resultsData: Result[] = await resultsRes.json() || [];
  //       const allPatientsData: Patient[] = await allPatientsRes.json() || [];

  //       setDoctor(data.doctor || null);
  //       setPatients(data.patients || []);
  //       setAllPatients(allPatientsData);
  //       setReceivedNotifications(notificationsData);
  //       setRendezvous(rdvData);
  //       setConsultations(consultData);
  //       setSharedResults(resultsData);

  //       if (data.doctor) {
  //         setProfileFormData({
  //           id: data.doctor.id,
  //           firstName: data.doctor.firstName,
  //           lastName: data.doctor.lastName,
  //           email: data.doctor.email,
  //           speciality: data.doctor.speciality,
  //           phoneNumber: data.doctor.phoneNumber || "",
  //           address: data.doctor.address || "",
  //         });
  //       }
  //     } catch (err: any) {
  //       setError(err.message || "Une erreur est survenue lors du chargement des données.");
  //       router.replace("/auth/login?role=medecin");
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   fetchMedecinData();
  // }, [router]);
useEffect(() => {
  const fetchMedecinData = async () => {
    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1];

      if (!token) {
        throw new Error("Aucun token trouvé. Redirection...");
      }

      const role = document.cookie
        .split("; ")
        .find((row) => row.startsWith("role="))
        ?.split("=")[1]?.toLowerCase();

      if (role !== "medecin") {
        throw new Error("Rôle invalide. Redirection...");
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [meRes, notificationsRes, rdvRes, consultRes, resultsRes, allPatientsRes] =
        await Promise.all([
          fetch("/api/medecin/me", {
            headers,
            credentials: "include",
            cache: "no-store",
          }),
          fetch("/api/medecin/notifications", {
            headers,
            credentials: "include",
            cache: "no-store",
          }),
          fetch("/api/medecin/appointments", {
            headers,
            credentials: "include",
            cache: "no-store",
          }),
          fetch("/api/medecin/consultations", {
            headers,
            credentials: "include",
            cache: "no-store",
          }),
          fetch("/api/medecin/results", {
            headers,
            credentials: "include",
            cache: "no-store",
          }),
          fetch("/api/patients/all", {
            headers,
            credentials: "include",
            cache: "no-store",
          }),
        ]);

      if (!meRes.ok) throw new Error(`Erreur API /medecin/me: ${meRes.statusText}`);
      if (!notificationsRes.ok) throw new Error(`Erreur API /medecin/notifications: ${notificationsRes.statusText}`);
      if (!rdvRes.ok) throw new Error(`Erreur API /medecin/appointments: ${rdvRes.statusText}`);
      if (!consultRes.ok) throw new Error(`Erreur API /medecin/consultations: ${consultRes.statusText}`);
      if (!resultsRes.ok) throw new Error(`Erreur API /medecin/results: ${resultsRes.statusText}`);
      if (!allPatientsRes.ok) throw new Error(`Erreur API /patients/all: ${allPatientsRes.statusText}`);

      const meData: MedecinResponse = await meRes.json();
      const notifJson = await notificationsRes.json();
      const rdvJson = await rdvRes.json();
      const consultJson = await consultRes.json();
      const resultsJson = await resultsRes.json();
      const allPatientsJson = await allPatientsRes.json();

      const notificationsData: Notification[] = Array.isArray(notifJson.notifications)
        ? notifJson.notifications
        : [];

      const rdvData: RendezVous[] = Array.isArray(rdvJson.rendezVous)
        ? rdvJson.rendezVous
        : [];

      const consultData: Consultation[] = Array.isArray(consultJson.consultations)
        ? consultJson.consultations
        : [];

      const resultsData: Result[] = Array.isArray(resultsJson.results)
        ? resultsJson.results
        : [];

      const allPatientsData: Patient[] = Array.isArray(allPatientsJson.doctors)
        ? allPatientsJson.doctors
        : [];

      setDoctor(meData.doctor || null);
      setPatients(meData.patients || []);
      setAllPatients(allPatientsData);
      setReceivedNotifications(notificationsData);
      setRendezvous(rdvData);
      setConsultations(consultData);
      setSharedResults(resultsData);

      if (meData.doctor) {
        setProfileFormData({
          id: meData.doctor.id,
          firstName: meData.doctor.firstName,
          lastName: meData.doctor.lastName,
          email: meData.doctor.email,
          speciality: meData.doctor.speciality,
          phoneNumber: meData.doctor.phoneNumber || "",
          address: meData.doctor.address || "",
        });
      }
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue lors du chargement des données.");
      router.replace("/auth/login?role=medecin");
    } finally {
      setLoading(false);
    }
  };

  fetchMedecinData();
}, [router]);

  const { newReceivedNotifications, allReceivedNotifications } = getNotificationData();

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = async () => {
    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1];

      const res = await fetch("/api/medecin/me", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: profileFormData.firstName,
          lastName: profileFormData.lastName,
          email: profileFormData.email,
          speciality: profileFormData.speciality,
          phoneNumber: profileFormData.phoneNumber,
          address: profileFormData.address,
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      const updatedDoctor: Doctor = await res.json();
      setDoctor(updatedDoctor);
      setShowProfileModal(false);
      setProfileError(null);
      alert("Profil mis à jour avec succès !");
    } catch (err: any) {
      setProfileError(err.message || "Erreur lors de la mise à jour du profil.");
    }
  };

  const sendNotification = async (patientId: string, message: string) => {
    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1];
      console.log("Token utilisé :", token);
      console.log("Envoi de notification à patientId :", patientId);

      if (token) {
      // Décoder le token pour vérifier le rôle (sans validation)
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('Token payload:', payload);
      
      if (payload.role !== 'Medecin') {
        throw new Error(`Rôle incorrect: ${payload.role}. Vous devez être connecté en tant que médecin.`);
      }
    } else {
      throw new Error('Aucun token trouvé. Veuillez vous reconnecter.');
    }

      const res = await fetch("/api/patient/notifications", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ patientId, message }),
        credentials: "include",
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Erreur HTTP ${res.status}: ${errorText}`);
      }

      const newNotification: Notification = await res.json();
      setSentNotifications((prev) => [...prev, newNotification]);
    } catch (err: any) {
      console.error("Erreur d'envoi de notification :", err.message);
      // Afficher l'erreur à l'utilisateur
      alert(`Erreur: ${err.message}`);
    }
  };

  const manageAppointment = async (appointmentId: string, action: "approve" | "reject" | "reschedule") => {
    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1];
      let updatedRdv = null;

      if (action === "reschedule") {
        const newDate = prompt("Entrez la nouvelle date (YYYY-MM-DD HH:MM):");
        if (newDate) {
          const res = await fetch(`/api/medecin/appointments/${appointmentId}`, {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ status: "Confirmé", newDate }),
          });
          if (!res.ok) throw new Error(`Erreur lors de la reprogrammation: ${res.statusText}`);
          updatedRdv = await res.json();
        }
      } else {
        const res = await fetch(`/api/medecin/appointments/${appointmentId}`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: action === "approve" ? "Confirmé" : "Rejeté" }),
        });
        if (!res.ok) throw new Error(`Erreur lors de la gestion du rendez-vous: ${res.statusText}`);
        updatedRdv = await res.json();
      }

      setRendezvous((prev) =>
        prev.map((rdv) =>
          rdv.id === appointmentId ? { ...rdv, ...updatedRdv, status: updatedRdv.status } : rdv
        )
      );

      const patient = patients.find((p) => p.id === updatedRdv.patientId);
      if (patient) {
        sendNotification(patient.id, `Votre rendez-vous a été ${action === "approve" ? "approuvé" : action === "reject" ? "rejeté" : "reprogrammé"}.`);
      }
    } catch (err: any) {
      console.error("Erreur de gestion du rendez-vous:", err.message);
    }
  };

 const handleConsultSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!selectedPatient) {
    setConsultError("Veuillez sélectionner un patient.");
    return;
  }

  try {
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("token="))
      ?.split("=")[1];
    console.log("Token utilisé pour consultation :", token);
    console.log("Données envoyées :", {
      patientId: selectedPatient.id,
      date: consultDate,
      summary: consultSummary,
    });

    const res = await fetch("/api/medecin/consultations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        patientId: selectedPatient.id,
        date: consultDate,
        summary: consultSummary,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Erreur HTTP ${res.status}: ${errorText}`);
    }
    const newConsult: Consultation = await res.json();
    setConsultations((prev) => [...prev, newConsult]);
    setShowConsultModal(false);
    setConsultDate("");
    setConsultSummary("");
    setConsultError(null);
    sendNotification(selectedPatient.id, "Une nouvelle consultation a été ajoutée à votre dossier.");
    alert("Consultation enregistrée avec succès !");
  } catch (err: any) {
    console.error("Erreur lors de la création de la consultation :", err.message);
    setConsultError(`Échec : ${err.message}`);
  }
};

const handleRdvSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!selectedPatient) {
    setRdvError("Veuillez sélectionner un patient.");
    return;
  }

  try {
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("token="))
      ?.split("=")[1];
    console.log("Token utilisé pour rendez-vous :", token);
    console.log("Données envoyées :", {
      patientId: selectedPatient.id,
      date: rdvDate,
      location: rdvLocation,
      isTeleconsultation: rdvIsTeleconsultation,
    });

    const res = await fetch("/api/medecin/appointments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        patientId: selectedPatient.id,
        date: rdvDate,
        location: rdvLocation,
        isTeleconsultation: rdvIsTeleconsultation,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Erreur HTTP ${res.status}: ${errorText}`);
    }
    const newRdv: RendezVous = await res.json();
    setRendezvous((prev) => [...prev, newRdv]);
    setShowRdvModal(false);
    setRdvDate("");
    setRdvLocation("");
    setRdvIsTeleconsultation(false);
    setRdvError(null);
    sendNotification(selectedPatient.id, "Un nouveau rendez-vous a été programmé.");
    alert("Rendez-vous enregistré avec succès !");
  } catch (err: any) {
    console.error("Erreur lors de la création du rendez-vous :", err.message);
    setRdvError(`Échec : ${err.message}`);
  }
};

const handleResultSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!selectedPatient) {
    setResultError("Veuillez sélectionner un patient.");
    return;
  }

  try {
    const token = localStorage.getItem("token");

    console.log("Token utilisé pour résultat :", token);
    console.log("Données envoyées :", {
      patientId: selectedPatient.id,
      type: resultType,
      date: resultDate,
      description: resultDescription,
      fileUrl: resultFileUrl,
      isShared: resultIsShared,
    });

    const res = await fetch("/api/medecin/results", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        patientId: selectedPatient.id,
        type: resultType,
        date: resultDate,
        description: resultDescription,
        fileUrl: resultFileUrl,
        isShared: resultIsShared,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Erreur HTTP ${res.status}: ${errorText}`);
    }
    const newResult: Result = await res.json();
    setSharedResults((prev) => [...prev, newResult]);
    setShowResultModal(false);
    setResultType("");
    setResultDate("");
    setResultDescription("");
    setResultFileUrl("");
    setResultIsShared(false);
    setResultError(null);
    sendNotification(selectedPatient.id, "Un nouveau résultat a été ajouté à votre dossier.");
    alert("Résultat enregistré avec succès !");
  } catch (err: any) {
    console.error("Erreur lors de la création du résultat :", err.message);
    setResultError(`Échec : ${err.message}`);
  }
};
  const filteredPatients = allPatients.filter((p) =>
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase())
  );

  const toggleReadNotification = (id: string) => {
    setReceivedNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
    );
  };

  const handlePatientSelect = (patientId: string) => {
    setRequestPatientId(patientId);
    setShowAccessRequest(true);
  };

  const confirmAccess = () => {
    if (requestPatientId) {
      const patient = allPatients.find((p) => p.id === requestPatientId);
      if (patient) {
        setSelectedPatient(patient);
        sendNotification(patient.id, `Le Dr. ${doctor?.firstName} ${doctor?.lastName} demande l'accès à votre dossier. Veuillez accepter.`);
      }
    }
    setShowAccessRequest(false);
    setRequestPatientId(null);
    setPatientAccessApproved(false);
  };

  const approvePatientAccess = (patientId: string) => {
  if (selectedPatient && selectedPatient.id === patientId) {
    setPatientAccessApproved(false); // Mettre à jour l'état immédiatement
    sendNotification(
      patientId,
      `${doctor?.firstName} ${doctor?.lastName} a approuvé l'accès à votre dossier.`
    );
  }
};

  if (loading) return <div className="p-6 text-center text-gray-500">Chargement...</div>;
  if (error) return <div className="p-6 text-center text-red-500">Erreur : {error}</div>;
  if (!doctor) return <div className="p-6 text-center text-red-500">Utilisateur non connecté</div>;

  return (
    
    <div className="flex h-screen bg-gradient-to-br from-gray-100 to-gray-200">
      <aside className="w-64 bg-gradient-to-b from-blue-800 to-blue-600 text-white p-6 shadow-lg">
        <div className="mb-8">
          <img src="/assets/images/logo.png" alt="Meddata Secured" className="h-12" />
        </div>
        <nav className="space-y-4">
          <button
            onClick={() => {
              setActiveSection("accueil");
              setActiveSubSection(null);
              setIsDropdownOpen(null);
            }}
            className={`flex items-center w-full p-3 text-white hover:bg-blue-700 rounded-lg transition duration-200 ${
              activeSection === "accueil" ? "bg-blue-700 font-medium" : ""
            }`}
          >
            <HomeIcon className="h-6 w-6 mr-3" />
            Accueil
          </button>
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(isDropdownOpen === "profil" ? null : "profil")}
              className={`flex items-center w-full p-3 text-white hover:bg-blue-700 rounded-lg transition duration-200 ${
                activeSection === "profil" ? "bg-blue-700 font-medium" : ""
              }`}
            >
              <UserIcon className="h-6 w-6 mr-3" />
              Profil
              <svg
                className={`w-5 h-5 ml-auto ${isDropdownOpen === "profil" ? "transform rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {isDropdownOpen === "profil" && (
              <div className="absolute w-full mt-1 bg-blue-700 border rounded-lg shadow-lg z-10">
                <button
                  onClick={() => {
                    setActiveSection("profil");
                    setActiveSubSection("profil");
                    setIsDropdownOpen(null);
                  }}
                  className="w-full text-left p-3 text-white hover:bg-blue-600"
                >
                  Voir Profil
                </button>
                <button
                  onClick={() => {
                    setActiveSection("profil");
                    setActiveSubSection("editProfile");
                    setIsDropdownOpen(null);
                  }}
                  className="w-full text-left p-3 text-white hover:bg-blue-600"
                >
                  Modifier Profil
                </button>
              </div>
            )}
          </div>
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(isDropdownOpen === "patients" ? null : "patients")}
              className={`flex items-center w-full p-3 text-white hover:bg-blue-700 rounded-lg transition duration-200 ${
                activeSection === "patients" ? "bg-blue-700 font-medium" : ""
              }`}
            >
              <UserIcon className="h-6 w-6 mr-3" />
              Patients
              <svg
                className={`w-5 h-5 ml-auto ${isDropdownOpen === "patients" ? "transform rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {isDropdownOpen === "patients" && (
              <div className="absolute w-full mt-1 bg-blue-700 border rounded-lg shadow-lg z-10">
                <button
                  onClick={() => {
                    setActiveSection("patients");
                    setActiveSubSection("followed");
                    setIsDropdownOpen(null);
                  }}
                  className="w-full text-left p-3 text-white hover:bg-blue-600"
                >
                  Patients Suivis
                </button>
                <button
                  onClick={() => {
                    setActiveSection("patients");
                    setActiveSubSection("created");
                    setIsDropdownOpen(null);
                  }}
                  className="w-full text-left p-3 text-white hover:bg-blue-600"
                >
                  Patients Créés
                </button>
              </div>
            )}
          </div>
          <button
            onClick={() => {
              setActiveSection("rendezvous");
              setActiveSubSection("today");
              setIsDropdownOpen(null);
            }}
            className={`flex items-center w-full p-3 text-white hover:bg-blue-700 rounded-lg transition duration-200 ${
              activeSection === "rendezvous" ? "bg-blue-700 font-medium" : ""
            }`}
          >
            <CalendarIcon className="h-6 w-6 mr-3" />
            Rendez-vous
          </button>
          <button
            onClick={() => {
              setActiveSection("consultations");
              setActiveSubSection("historique");
              setIsDropdownOpen(null);
            }}
            className={`flex items-center w-full p-3 text-white hover:bg-blue-700 rounded-lg transition duration-200 ${
              activeSection === "consultations" ? "bg-blue-700 font-medium" : ""
            }`}
          >
            <ClipboardDocumentIcon className="h-6 w-6 mr-3" />
            Consultations
          </button>
          <button
            onClick={() => {
              setActiveSection("results");
              setActiveSubSection("results");
              setIsDropdownOpen(null);
            }}
            className={`flex items-center w-full p-3 text-white hover:bg-blue-700 rounded-lg transition duration-200 ${
              activeSection === "results" ? "bg-blue-700 font-medium" : ""
            }`}
          >
            <DocumentTextIcon className="h-6 w-6 mr-3" />
            Résultats
          </button>
          <button
            onClick={() => {
              setActiveSection("notifications");
              setActiveSubSection("notifications");
              setIsDropdownOpen(null);
            }}
            className={`flex items-center w-full p-3 text-white hover:bg-blue-700 rounded-lg transition duration-200 ${
              activeSection === "notifications" ? "bg-blue-700 font-medium" : ""
            }`}
          >
            <BellIcon className="h-6 w-6 mr-3" />
            Notifications
          </button>
        </nav>
        <div className="mt-auto">
          <button
            onClick={() => {
              document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
              router.replace("/auth/login?role=medecin");
            }}
            className="w-full text-left p-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-200"
          >
            Se déconnecter
          </button>
        </div>
      </aside>

      <div className="flex-1 p-6">
        <header className="flex justify-between items-center mb-6 bg-gradient-to-r from-blue-100 to-white p-4 rounded-xl shadow-md">
          <h1 className="text-2xl font-bold text-gray-800">
            Tableau de bord / {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)} / Dr.{" "}
            {doctor?.firstName} {doctor?.lastName}
          </h1>
          <div className="flex space-x-4">
            <button
              onClick={() => setShowNotifPanel(!showNotifPanel)}
              className="relative p-2 rounded-full bg-white hover:bg-gray-100 shadow-md"
              title="Notifications"
            >
              <BellIcon className="h-6 w-6 text-blue-600" />
              {newReceivedNotifications.length > 0 && (
                <span className="absolute top-0 right-0 inline-block w-5 h-5 bg-red-600 text-white text-xs font-bold rounded-full text-center leading-5">
                  {newReceivedNotifications.length}
                </span>
              )}
            </button>
            <Cog6ToothIcon className="h-6 w-6 text-blue-600 hover:text-blue-800 cursor-pointer" />
          </div>
        </header>

        {showNotifPanel && (
          <Card className="absolute right-6 mt-2 w-80 max-h-80 overflow-y-auto rounded-xl shadow-lg bg-white border border-gray-200">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-800">Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              {allReceivedNotifications.length > 0 ? (
                <ul className="space-y-3 text-gray-700">
                  {allReceivedNotifications.map((note) => (
                    <li
                      key={note.id}
                      onClick={() => toggleReadNotification(note.id)}
                      className={`cursor-pointer p-3 rounded-lg ${
                        note.read ? "bg-gray-50" : "bg-blue-50 font-medium"
                      } hover:bg-blue-100 transition`}
                    >
                      🔔 {note.message}
                      <br />
                      <small className="text-gray-500">{new Date(note.date).toLocaleString()}</small>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 italic p-3 text-center">Aucune notification.</p>
              )}
            </CardContent>
          </Card>
        )}

        {showAccessRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-96 p-6 bg-white rounded-xl shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-800">Demande d'accès</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">Voulez-vous accéder au dossier du patient ?</p>
                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAccessRequest(false);
                      setRequestPatientId(null);
                    }}
                    className="rounded-xl"
                  >
                    Annuler
                  </Button>
                  <Button onClick={confirmAccess} className="bg-blue-600 text-white rounded-xl">
                    Confirmer
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeSection === "accueil" && (
          <section className="bg-white p-6 rounded-xl shadow-lg">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">
              Bienvenue, Dr. {doctor?.firstName} {doctor?.lastName} !
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <Card className="bg-gradient-to-br from-blue-50 to-white hover:shadow-xl transition-shadow rounded-xl">
                <CardContent className="p-6 text-center">
                  <UserIcon className="h-10 w-10 text-blue-600 mx-auto mb-3" />
                  <p className="text-gray-700 font-semibold">Patients Suivis</p>
                  <p className="text-2xl text-gray-800">{patients.length}</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-green-50 to-white hover:shadow-xl transition-shadow rounded-xl">
                <CardContent className="p-6 text-center">
                  <CalendarIcon className="h-10 w-10 text-green-600 mx-auto mb-3" />
                  <p className="text-gray-700 font-semibold">Rendez-vous</p>
                  <p className="text-2xl text-gray-800">{rendezvous.length}</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-yellow-50 to-white hover:shadow-xl transition-shadow rounded-xl">
                <CardContent className="p-6 text-center">
                  <ClipboardDocumentIcon className="h-10 w-10 text-yellow-600 mx-auto mb-3" />
                  <p className="text-gray-700 font-semibold">Consultations</p>
                  <p className="text-2xl text-gray-800">{consultations.length}</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-50 to-white hover:shadow-xl transition-shadow rounded-xl">
                <CardContent className="p-6 text-center">
                  <DocumentTextIcon className="h-10 w-10 text-purple-600 mx-auto mb-3" />
                  <p className="text-gray-700 font-semibold">Résultats</p>
                  <p className="text-2xl text-gray-800">{sharedResults.length}</p>
                </CardContent>
              </Card>
            </div>
            <Input
              placeholder="🔍 Rechercher un patient..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mb-4 w-full md:w-1/2 p-2 rounded-xl border-gray-300 focus:ring-2 focus:ring-blue-500"
            />
            {search && filteredPatients.length > 0 && (
              <div className="space-y-4">
                {filteredPatients.map((patient) => (
                  <Card
                    key={patient.id}
                    onClick={() => handlePatientSelect(patient.id)}
                    className="cursor-pointer rounded-xl border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition"
                  >
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-gray-800">{patient.firstName} {patient.lastName}</h3>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            {!search && <p className="text-gray-500 text-center">Veuillez effectuer une recherche pour voir les patients.</p>}
            {selectedPatient && !patientAccessApproved && (
              <p className="mt-4 text-yellow-600 text-center">
                Une demande d'accès a été envoyée à {selectedPatient.firstName} {selectedPatient.lastName}. Attendez l'approbation.
              </p>
            )}
            {selectedPatient && patientAccessApproved && (
              <div className="mt-6 flex gap-4">
                <Button onClick={() => setShowRdvModal(true)} className="bg-blue-600 text-white rounded-xl">
                  📅 Nouveau RDV
                </Button>
                <Button onClick={() => setShowConsultModal(true)} className="bg-green-600 text-white rounded-xl">
                  🩺 Nouvelle Consultation
                </Button>
                <Button onClick={() => setShowResultModal(true)} className="bg-purple-600 text-white rounded-xl">
                  📊 Nouveau Résultat
                </Button>
                <Button
                  onClick={() =>
                    sendNotification(selectedPatient.id, "Rappel: Votre rendez-vous est prévu bientôt.")
                  }
                  className="bg-yellow-600 text-white rounded-xl"
                >
                  🔔 Envoyer Notification
                </Button>
              </div>
            )}
          </section>
        )}

        {activeSection === "profil" && activeSubSection === "profil" && (
          <section>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Mon Profil</h1>
            <Card className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-xl shadow-lg">
              <CardContent>
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <UserIcon className="h-12 w-12 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-800 mb-2">Dr. {doctor?.firstName} {doctor?.lastName}</h2>
                  <p className="text-gray-600 mb-1">ID: {doctor?.id}</p>
                  <p className="text-gray-600 mb-1">Spécialité: {doctor?.speciality}</p>
                  <div className="mt-4 text-center">
                    <h3 className="text-lg font-medium text-gray-700 mb-2">Contacts</h3>
                    <p className="text-gray-600 mb-1">Email: {doctor?.email}</p>
                    <p className="text-gray-600 mb-1">Téléphone: {doctor?.phoneNumber || "Non spécifié"}</p>
                    <p className="text-gray-600">Adresse: {doctor?.address || "Non spécifié"}</p>
                  </div>
                  <Button
                    onClick={() => {
                      setActiveSection("profil");
                      setActiveSubSection("editProfile");
                    }}
                    className="mt-6 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
                  >
                    Modifier Profil
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {activeSection === "profil" && activeSubSection === "editProfile" && (
          <section>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Modifier le Profil</h1>
            <Card className="bg-gradient-to-br from-green-50 to-white p-6 rounded-xl shadow-lg">
              <CardContent>
                {profileError && <p className="text-red-500 mb-4 text-center">{profileError}</p>}
                <div className="space-y-4">
                  <Input
                    type="text"
                    name="firstName"
                    value={profileFormData.firstName}
                    onChange={handleProfileChange}
                    placeholder="Prénom"
                    className="w-full p-2 rounded-xl border-gray-300 focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <Input
                    type="text"
                    name="lastName"
                    value={profileFormData.lastName}
                    onChange={handleProfileChange}
                    placeholder="Nom"
                    className="w-full p-2 rounded-xl border-gray-300 focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <Input
                    type="email"
                    name="email"
                    value={profileFormData.email}
                    onChange={handleProfileChange}
                    placeholder="Email"
                    className="w-full p-2 rounded-xl border-gray-300 focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <Input
                    type="text"
                    name="speciality"
                    value={profileFormData.speciality}
                    onChange={handleProfileChange}
                    placeholder="Spécialité"
                    className="w-full p-2 rounded-xl border-gray-300 focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <Input
                    type="text"
                    name="phoneNumber"
                    value={profileFormData.phoneNumber}
                    onChange={handleProfileChange}
                    placeholder="Numéro de téléphone"
                    className="w-full p-2 rounded-xl border-gray-300 focus:ring-2 focus:ring-blue-500"
                  />
                  <Input
                    type="text"
                    name="address"
                    value={profileFormData.address}
                    onChange={handleProfileChange}
                    placeholder="Adresse"
                    className="w-full p-2 rounded-xl border-gray-300 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="mt-6 flex justify-center gap-4">
                  <Button
                    onClick={() => setShowProfileModal(false)}
                    variant="outline"
                    className="rounded-xl border-gray-300 hover:bg-gray-100"
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={handleProfileSubmit}
                    className="bg-green-600 text-white rounded-xl hover:bg-green-700"
                  >
                    Enregistrer
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {activeSection === "patients" && (
          <section>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Patients</h1>
            <Card className="bg-white p-6 rounded-xl shadow-lg">
              <CardContent>
                <div className="flex justify-between items-center mb-6">
                  <Input
                    placeholder="🔍 Rechercher un patient..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-1/3 p-2 rounded-xl border-gray-300 focus:ring-2 focus:ring-blue-500"
                  />
                  <Link href="/patients/new">
                    <Button className="bg-blue-600 text-white rounded-xl">+ Nouveau Patient</Button>
                  </Link>
                </div>
                {activeSubSection === "followed" && (
                  <div className="space-y-4">
                    {filteredPatients.length > 0 ? (
                      filteredPatients.map((patient) => (
                        <Card
                          key={patient.id}
                          onClick={() => handlePatientSelect(patient.id)}
                          className={`cursor-pointer rounded-xl border ${
                            selectedPatient?.id === patient.id
                              ? "border-2 border-blue-500 bg-blue-50"
                              : "border-gray-200"
                          } hover:bg-gray-50 transition`}
                        >
                          <CardContent className="p-4">
                            <h3 className="font-semibold text-gray-800">
                              {patient.firstName} {patient.lastName}
                            </h3>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center">Aucun patient trouvé.</p>
                    )}
                  </div>
                )}
                {activeSubSection === "created" && (
                  <div className="space-y-4">
                    {filteredPatients.filter((p) => p.dossier.includes("Créé par")).length > 0 ? (
                      filteredPatients
                        .filter((p) => p.dossier.includes("Créé par"))
                        .map((patient) => (
                          <Card
                            key={patient.id}
                            onClick={() => handlePatientSelect(patient.id)}
                            className={`cursor-pointer rounded-xl border ${
                              selectedPatient?.id === patient.id
                                ? "border-2 border-blue-500 bg-blue-50"
                                : "border-gray-200"
                            } hover:bg-gray-50 transition`}
                          >
                            <CardContent className="p-4">
                              <h3 className="font-semibold text-gray-800">
                                {patient.firstName} {patient.lastName}
                              </h3>
                            </CardContent>
                          </Card>
                        ))
                    ) : (
                      <p className="text-gray-500 text-center">Aucun patient créé.</p>
                    )}
                  </div>
                )}
                {selectedPatient && !patientAccessApproved && (
                  <p className="mt-6 text-yellow-600 text-center">
                    Une demande d'accès a été envoyée à {selectedPatient.firstName} {selectedPatient.lastName}. Attendez l'approbation.
                  </p>
                )}
                {selectedPatient && patientAccessApproved && (
                  <Card className="mt-6 rounded-xl shadow-xl p-6 bg-gradient-to-br from-white to-blue-50">
                    <CardHeader>
                      <CardTitle className="text-3xl font-bold text-gray-800">
                        {selectedPatient.firstName} {selectedPatient.lastName}
                      </CardTitle>
                      <p className="text-gray-600">Né(e) le {selectedPatient.birthDate}</p>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-6 text-gray-700">{selectedPatient.dossier}</p>
                      <div className="flex flex-wrap gap-3 mb-6">
                        <Button variant="outline" asChild className="rounded-xl">
                          <Link href={`/patients/${selectedPatient.id}/edit`}>✏️ Modifier</Link>
                        </Button>
                        <Button
                          variant="secondary"
                          className="rounded-xl bg-green-600 text-white"
                          onClick={() => setShowRdvModal(true)}
                        >
                          📅 Nouveau RDV
                        </Button>
                        <Button
                          variant="secondary"
                          className="rounded-xl bg-blue-600 text-white"
                          onClick={() => setShowConsultModal(true)}
                        >
                          🩺 Nouvelle Consultation
                        </Button>
                        <Button
                          variant="secondary"
                          className="rounded-xl bg-purple-600 text-white"
                          onClick={() => setShowResultModal(true)}
                        >
                          📊 Nouveau Résultat
                        </Button>
                        <Button
                          variant="secondary"
                          className="rounded-xl bg-yellow-600 text-white"
                          onClick={() =>
                            sendNotification(
                              selectedPatient.id,
                              "Rappel: Votre rendez-vous est prévu bientôt."
                            )
                          }
                        >
                          🔔 Envoyer Notification
                        </Button>
                      </div>
                      <div className="space-y-4">
                        <h3 className="font-semibold text-lg text-gray-800">📅 Rendez-vous Programmés</h3>
                        {rendezvous.filter((rdv) => rdv.patientId === selectedPatient.id).length > 0 ? (
                          <ul className="list-disc ml-5 text-gray-600">
                            {rendezvous
                              .filter((rdv) => rdv.patientId === selectedPatient.id)
                              .map((rdv) => (
                                <li key={rdv.id} className="mb-2">
                                  {patients.find((p) => p.id === rdv.patientId)?.firstName}{" "}
                                  {patients.find((p) => p.id === rdv.patientId)?.lastName} -{" "}
                                  {new Date(rdv.date).toLocaleString()} - {rdv.location} (
                                  {rdv.isTeleconsultation ? "Téléconsultation" : "Présentiel"}) - Statut:{" "}
                                  {rdv.status}
                                  {rdv.status === "En attente" && (
                                    <div className="inline-flex gap-2 ml-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => manageAppointment(rdv.id, "approve")}
                                        className="rounded"
                                      >
                                        Approuver
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => manageAppointment(rdv.id, "reject")}
                                        className="rounded"
                                      >
                                        Rejeter
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => manageAppointment(rdv.id, "reschedule")}
                                        className="rounded"
                                      >
                                        Reprogrammer
                                      </Button>
                                    </div>
                                  )}
                                </li>
                              ))}
                          </ul>
                        ) : (
                          <p className="ml-5 text-gray-500 text-center">Aucun rendez-vous programmé.</p>
                        )}

                        <h3 className="font-semibold text-lg text-gray-800 mt-6">🩺 Consultations Réalisées</h3>
                        {consultations.filter((consult) => consult.patientId === selectedPatient.id).length >
                        0 ? (
                          <ul className="list-disc ml-5 text-gray-600">
                            {consultations
                              .filter((consult) => consult.patientId === selectedPatient.id)
                              .map((consult) => (
                                <li key={consult.id} className="mb-2">
                                  {patients.find((p) => p.id === consult.patientId)?.firstName}{" "}
                                  {patients.find((p) => p.id === consult.patientId)?.lastName} -{" "}
                                  {new Date(consult.date).toLocaleString()} - {consult.summary}
                                </li>
                              ))}
                          </ul>
                        ) : (
                          <p className="ml-5 text-gray-500 text-center">Aucune consultation réalisée.</p>
                        )}

                        <h3 className="font-semibold text-lg text-gray-800 mt-6">📊 Résultats Générés</h3>
                        {sharedResults.filter((result) => result.patientId === selectedPatient.id).length >
                        0 ? (
                          <ul className="list-disc ml-5 text-gray-600">
                            {sharedResults
                              .filter((result) => result.patientId === selectedPatient.id)
                              .map((result) => (
                                <li key={result.id} className="mb-2">
                                  {patients.find((p) => p.id === result.patientId)?.firstName}{" "}
                                  {patients.find((p) => p.id === result.patientId)?.lastName} - {result.type} -{" "}
                                  {new Date(result.date).toLocaleString()}: {result.description}
                                  {result.fileUrl && (
                                    <span>
                                      {" "}
                                      <a href={result.fileUrl} className="text-blue-600 hover:underline">
                                        Voir le fichier
                                      </a>
                                    </span>
                                  )}
                                </li>
                              ))}
                          </ul>
                        ) : (
                          <p className="ml-5 text-gray-500 text-center">Aucun résultat généré.</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </section>
        )}

        {activeSection === "rendezvous" && (
          <section>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Rendez-vous</h1>
            <Card className="bg-white p-6 rounded-xl shadow-lg">
              <CardContent>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <select
                      value={activeSubSection || "today"}
                      onChange={(e) => setActiveSubSection(e.target.value || "today")}
                      className="p-2 border border-gray-300 rounded-xl"
                    >
                      <option value="today">Aujourd'hui</option>
                      <option value="month">Mois</option>
                    </select>
                    <Input
                      type="text"
                      placeholder="Sélectionner un patient..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="ml-2 w-1/3 p-2 rounded-xl border-gray-300 focus:ring-2 focus:ring-blue-500"
                      onBlur={(e) => {
                        const patient = patients.find((p) =>
                          `${p.firstName} ${p.lastName}`.toLowerCase() === e.target.value.toLowerCase()
                        );
                        if (patient) handlePatientSelect(patient.id);
                      }}
                    />
                  </div>
                  <Button
                    onClick={() => setShowRdvModal(true)}
                    className="bg-blue-600 text-white rounded-xl"
                  >
                    + Créer un rendez-vous
                  </Button>
                </div>
                {activeSubSection === "today" && (
                  <div className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl">
                    {rendezvous.filter((a) => new Date(a.date).toDateString() === new Date().toDateString())
                      .length > 0 ? (
                      rendezvous
                        .filter((a) => new Date(a.date).toDateString() === new Date().toDateString())
                        .map((a) => (
                          <Card key={a.id} className="mb-4 rounded-xl border border-gray-200">
                            <CardContent className="p-4">
                              <p className="text-gray-700">
                                {patients.find((p) => p.id === a.patientId)?.firstName}{" "}
                                {patients.find((p) => p.id === a.patientId)?.lastName} -{" "}
                                {new Date(a.date).toLocaleString()} - {a.location} (
                                {a.isTeleconsultation ? "Téléconsultation" : "Présentiel"}) - Statut: {a.status}
                              </p>
                              {a.status === "En attente" && (
                                <div className="flex gap-2 mt-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => manageAppointment(a.id, "approve")}
                                    className="rounded"
                                  >
                                    Approuver
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => manageAppointment(a.id, "reject")}
                                    className="rounded"
                                  >
                                    Rejeter
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => manageAppointment(a.id, "reschedule")}
                                    className="rounded"
                                  >
                                    Reprogrammer
                                  </Button>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))
                    ) : (
                      <p className="text-gray-600 text-center">Aucun rendez-vous aujourd'hui.</p>
                    )}
                  </div>
                )}
                {activeSubSection === "month" && (
                  <div className="grid grid-cols-7 gap-1 text-center">
                    <div className="p-2 font-semibold text-gray-700">DIM</div>
                    <div className="p-2 font-semibold text-gray-700">LUN</div>
                    <div className="p-2 font-semibold text-gray-700">MAR</div>
                    <div className="p-2 font-semibold text-gray-700">MER</div>
                    <div className="p-2 font-semibold text-gray-700">JEU</div>
                    <div className="p-2 font-semibold text-gray-700">VEN</div>
                    <div className="p-2 font-semibold text-gray-700">SAM</div>
                    {Array.from({ length: 30 }, (_, i) => (
                      <div
                        key={i + 1}
                        className={`p-2 rounded-full ${
                          rendezvous.some((a) => new Date(a.date).getDate() === i + 1)
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-200 text-gray-500"
                        }`}
                      >
                        {i + 1}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        )}

        {activeSection === "consultations" && (
          <section>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Consultations</h1>
            <Card className="bg-white p-6 rounded-xl shadow-lg">
              <CardContent>
                <div className="flex justify-between items-center mb-6">
                  <button
                    onClick={() => setActiveSubSection("historique")}
                    className="text-blue-600 font-medium hover:underline"
                  >
                    Historique
                  </button>
                  <Input
                    type="text"
                    placeholder="Sélectionner un patient..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-1/3 p-2 rounded-xl border-gray-300 focus:ring-2 focus:ring-blue-500"
                    onBlur={(e) => {
                      const patient = patients.find((p) =>
                        `${p.firstName} ${p.lastName}`.toLowerCase() === e.target.value.toLowerCase()
                      );
                      if (patient) handlePatientSelect(patient.id);
                    }}
                  />
                  <Button
                    onClick={() => setShowConsultModal(true)}
                    className="bg-blue-600 text-white rounded-xl"
                  >
                    + Créer une consultation
                  </Button>
                </div>
                {activeSubSection === "historique" && (
                  <div className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl">
                    {consultations.length > 0 ? (
                      consultations.map((c) => (
                        <Card key={c.id} className="mb-4 rounded-xl border border-gray-200">
                          <CardContent className="p-4">
                            <p className="text-gray-700">
                              <strong>Patient :</strong>{" "}
                      {c.patient
                        ? `${c.patient.firstName} ${c.patient.lastName}`
                        : patients.find((p) => p.id === c.patientId)?.firstName +
                          " " +
                          patients.find((p) => p.id === c.patientId)?.lastName || "Inconnu (ID: " + c.patientId + ")"}
                      {" - "}
                              <strong>Date :</strong> {new Date(c.date).toLocaleString()}
                            </p>
                            <p className="text-gray-700"><strong>Résumé :</strong> {c.summary}</p>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <p className="text-gray-600 text-center">Aucune consultation disponible.</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        )}

        {activeSection === "results" && (
          <section>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Résultats</h1>
            <Card className="bg-white p-6 rounded-xl shadow-lg">
              <CardContent>
                <Input
                  type="text"
                  placeholder="Sélectionner un patient..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-1/3 p-2 rounded-xl border-gray-300 mb-4 focus:ring-2 focus:ring-blue-500"
                  onBlur={(e) => {
                    const patient = patients.find((p) =>
                      `${p.firstName} ${p.lastName}`.toLowerCase() === e.target.value.toLowerCase()
                    );
                    if (patient) handlePatientSelect(patient.id);
                  }}
                />
                <Button
                  variant="default"
                  className="mb-4 bg-blue-600 text-white rounded-xl"
                  onClick={() => setShowResultModal(true)}
                >
                  Ajouter un résultat
                </Button>
                {sharedResults.length > 0 ? (
                  <ul className="space-y-4">
                    {sharedResults.map((result) => (
                      <Card key={result.id} className="rounded-xl border border-gray-200">
                        <CardContent className="p-4">
                          <div>
                            <h3 className="text-lg font-medium text-gray-800">{result.type}</h3>
                            <p className="text-gray-600">
                              <strong>Patient :</strong>{" "}
                      {result.patient
                        ? `${result.patient.firstName} ${result.patient.lastName}`
                        : patients.find((p) => p.id === result.patientId)?.firstName +
                          " " +
                          patients.find((p) => p.id === result.patientId)?.lastName || "Inconnu (ID: " + result.patientId + ")"}
                      {" - "}
                              <strong>Date :</strong> {new Date(result.date).toLocaleString()}
                            </p>
                            <p className="text-gray-600">{result.description}</p>
                            {result.fileUrl && (
                              <a
                                href={result.fileUrl}
                                className="text-blue-600 hover:underline"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Voir le fichier
                              </a>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-600 text-center">Aucun résultat disponible.</p>
                )}
              </CardContent>
            </Card>
          </section>
        )}

        {activeSection === "notifications" && (
          <section>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Notifications</h1>
            <Card className="bg-white p-6 rounded-xl shadow-lg">
              <CardContent>
                {allReceivedNotifications.length > 0 ? (
                  <ul className="space-y-4">
                    {allReceivedNotifications.map((note) => (
                      <Card
                        key={note.id}
                        onClick={() => toggleReadNotification(note.id)}
                        className={`cursor-pointer rounded-xl ${
                          note.read ? "bg-gray-50" : "bg-blue-50"
                        } hover:bg-blue-100 transition`}
                      >
                        <CardContent className="p-4">
                          <p className="text-gray-700">🔔 {note.message}</p>
                          <small className="text-gray-500">{new Date(note.date).toLocaleString()}</small>
                        </CardContent>
                      </Card>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-600 text-center">Aucune notification disponible.</p>
                )}
              </CardContent>
            </Card>
          </section>
        )}

        {showConsultModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-96 p-6 bg-white rounded-xl shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-800">Nouvelle Consultation</CardTitle>
              </CardHeader>
              <CardContent>
                {consultError && <p className="text-red-500 mb-4 text-center">{consultError}</p>}
                <form onSubmit={handleConsultSubmit} className="space-y-4">
                  <select
                    value={selectedPatient?.id || ""}
                    onChange={(e) => {
                      const patient = patients.find((p) => p.id === e.target.value);
                      if (patient) setSelectedPatient(patient);
                    }}
                    className="w-full p-2 rounded-xl border-gray-300 focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Sélectionner un patient</option>
                    {patients.map((patient) => (
                      <option key={patient.id} value={patient.id}>
                        {patient.firstName} {patient.lastName}
                      </option>
                    ))}
                  </select>
                  <Input
                    type="datetime-local"
                    value={consultDate}
                    onChange={(e) => setConsultDate(e.target.value)}
                    className="w-full p-2 rounded-xl border-gray-300 focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <Textarea
                    placeholder="Résumé de la consultation"
                    value={consultSummary}
                    onChange={(e) => setConsultSummary(e.target.value)}
                    className="w-full p-2 rounded-xl border-gray-300 focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <div className="flex justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowConsultModal(false);
                        setConsultError(null);
                      }}
                      className="rounded-xl"
                    >
                      Annuler
                    </Button>
                    <Button type="submit" className="bg-blue-600 text-white rounded-xl">
                      Enregistrer
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {showRdvModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-96 p-6 bg-white rounded-xl shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-800">Nouveau Rendez-vous</CardTitle>
              </CardHeader>
              <CardContent>
                {rdvError && <p className="text-red-500 mb-4 text-center">{rdvError}</p>}
                <form onSubmit={handleRdvSubmit} className="space-y-4">
                  <select
                    value={selectedPatient?.id || ""}
                    onChange={(e) => {
                      const patient = patients.find((p) => p.id === e.target.value);
                      if (patient) setSelectedPatient(patient);
                    }}
                    className="w-full p-2 rounded-xl border-gray-300 focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Sélectionner un patient</option>
                    {patients.map((patient) => (
                      <option key={patient.id} value={patient.id}>
                        {patient.firstName} {patient.lastName}
                      </option>
                    ))}
                  </select>
                  <Input
                    type="datetime-local"
                    value={rdvDate}
                    onChange={(e) => setRdvDate(e.target.value)}
                    className="w-full p-2 rounded-xl border-gray-300 focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <Input
                    placeholder="Lieu du rendez-vous"
                    value={rdvLocation}
                    onChange={(e) => setRdvLocation(e.target.value)}
                    className="w-full p-2 rounded-xl border-gray-300 focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={rdvIsTeleconsultation}
                      onCheckedChange={(checked) => setRdvIsTeleconsultation(!!checked)}
                      className="rounded"
                    />
                    <label className="text-gray-700">Téléconsultation</label>
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowRdvModal(false);
                        setRdvError(null);
                      }}
                      className="rounded-xl"
                    >
                      Annuler
                    </Button>
                    <Button type="submit" className="bg-blue-600 text-white rounded-xl">
                      Enregistrer
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {showResultModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-96 p-6 bg-white rounded-xl shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-800">Nouveau Résultat</CardTitle>
              </CardHeader>
              <CardContent>
                {resultError && <p className="text-red-500 mb-4 text-center">{resultError}</p>}
                <form onSubmit={handleResultSubmit} className="space-y-4">
                  <select
                    value={selectedPatient?.id || ""}
                    onChange={(e) => {
                      const patient = patients.find((p) => p.id === e.target.value);
                      if (patient) setSelectedPatient(patient);
                    }}
                    className="w-full p-2 rounded-xl border-gray-300 focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Sélectionner un patient</option>
                    {patients.map((patient) => (
                      <option key={patient.id} value={patient.id}>
                        {patient.firstName} {patient.lastName}
                      </option>
                    ))}
                  </select>
                  <Input
                    placeholder="Type (ex: Analyse sanguine)"
                    value={resultType}
                    onChange={(e) => setResultType(e.target.value)}
                    className="w-full p-2 rounded-xl border-gray-300 focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <Input
                    type="datetime-local"
                    value={resultDate}
                    onChange={(e) => setResultDate(e.target.value)}
                    className="w-full p-2 rounded-xl border-gray-300 focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <Textarea
                    placeholder="Description"
                    value={resultDescription}
                    onChange={(e) => setResultDescription(e.target.value)}
                    className="w-full p-2 rounded-xl border-gray-300 focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <Input
                    placeholder="URL du fichier (optionnel)"
                    value={resultFileUrl}
                    onChange={(e) => setResultFileUrl(e.target.value)}
                    className="w-full p-2 rounded-xl border-gray-300 focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={resultIsShared}
                      onCheckedChange={(checked) => setResultIsShared(!!checked)}
                      className="rounded"
                    />
                    <label className="text-gray-700">Partager avec un autre médecin</label>
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowResultModal(false);
                        setResultError(null);
                      }}
                      className="rounded-xl"
                    >
                      Annuler
                    </Button>
                    <Button type="submit" className="bg-blue-600 text-white rounded-xl">
                      Enregistrer
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      
    </div>
    
  );
}