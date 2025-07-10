
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  HomeIcon,
  UserIcon,
  CalendarIcon,
  DocumentTextIcon,
  ChatBubbleLeftIcon,
  ClipboardDocumentIcon,
  BellIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Subsection =
  | "antecedents"
  | "ordonnances"
  | "procedures"
  | "tests"
  | "resultats"
  | "dossiersMedicaux"
  | "profil"
  | "editProfile"
  | "profilSante"
  | "demanderRendezvous"
  | "historique"
  | "dossiersPartages"
  | "messagerie"
  | "accessRequests";

interface Patient {
  id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  address?: string;
  phoneNumber?: string;
  height?: string;
  weight?: string;
  bloodPressure?: { systolic: string; diastolic: string };
  heartRate?: string;
  temperature?: string;
  oxygen?: string;
  gender?: string;
  bloodType?: string;
  allergies?: string;
  medicalHistory?: string;
}

interface Consultation {
  id: string;
  date: string;
  doctorName: string;
  summary: string;
  documentHash?: string;
  authorizedUsers?: string[];
  createdBy?: string;
}

interface Appointment {
  id: string;
  date: string;
  location: string;
  status: "Confirmé" | "En attente" | "Passé" | "Refusé";
  isTeleconsultation?: boolean;
  doctorId?: string;
  doctorName?: string;
  createdBy?: string;
}

interface Result {
  id: string;
  type: string;
  date: string;
  description: string;
  fileUrl?: string;
  isShared: boolean;
  sharedWith?: { id: string; firstName: string; lastName: string };
  doctorName?: string;
}

interface ResultFormData {
  type: string;
  date: string;
  description: string;
  fileUrl?: string;
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

interface Notification {
  id: string;
  message: string;
  date: string;
  read: boolean;
  type: "accessRequest" | "appointment" | "consultation" | "result";
  relatedId?: string;
  medecinId?: string;
}

export default function PatientDashboard() {
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState("accueil");
  const [activeSubSection, setActiveSubSection] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null); // État pour l'ID du patient sélectionné
  const [patientAccessApproved, setPatientAccessApproved] = useState(false);
  const [formData, setFormData] = useState<DependentFormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [resultFormData, setResultFormData] = useState<ResultFormData>({
    type: "",
    date: "",
    description: "",
    fileUrl: "",
  });
  const [showResultForm, setShowResultForm] = useState(false);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [appointmentFormData, setAppointmentFormData] = useState({
    date: "",
    location: "",
    isTeleconsultation: false,
    doctorId: "",
    month: new Date().getMonth(),
  });
  const [isConsultationModalOpen, setIsConsultationModalOpen] = useState(false);
  const [consultationFormData, setConsultationFormData] = useState({
    date: "",
    doctorName: "",
    summary: "",
  });
  const [editingResultId, setEditingResultId] = useState<string | null>(null);
  const [editResultFormData, setEditResultFormData] = useState<ResultFormData>({
    type: "",
    date: "",
    description: "",
    fileUrl: "",
  });
const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("file", file);

  try {
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("token="))
      ?.split("=")[1];
    if (!token) throw new Error("Aucun token trouvé.");

    const res = await fetch("/api/patient/upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    console.log("Fichier uploadé :", data);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Une erreur inconnue s'est produite.";
    console.error("Erreur lors de l'upload :", errorMessage);
  }
};

  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    
    const fetchData = async () => {
      try {
        const token = document.cookie
          .split("; ")
          .find((row) => row.startsWith("token="))
          ?.split("=")[1];

        if (!token) {
          throw new Error("Aucun token trouvé. Veuillez vous reconnecter.");
        }

        const [patientRes, consultRes, apptRes, resultRes, doctorRes, notifRes] = await Promise.all([
          fetch("/api/patient/me", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("/api/patient/consultations", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("/api/patient/appointments", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("/api/patient/results", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("/api/medecin/available", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("/api/patient/notifications", { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        if (!patientRes.ok) throw new Error("Échec de la récupération du profil.");
        const patientData = await patientRes.json();
        setPatient({
          ...patientData,
          bloodPressure: patientData?.bloodPressure || { systolic: "", diastolic: "" },
        });

        if (!consultRes.ok) throw new Error("Échec de la récupération des consultations.");
        setConsultations(await consultRes.json());
        

        if (!apptRes.ok) throw new Error("Échec de la récupération des rendez-vous.");
        setAppointments(await apptRes.json());

        if (!resultRes.ok) throw new Error("Échec de la récupération des résultats.");
        setResults(await resultRes.json());

        if (!doctorRes.ok) throw new Error("Échec de la récupération des médecins.");
        setDoctors(await doctorRes.json());

        if (!notifRes.ok) throw new Error("Échec de la récupération des notifications.");
        const notifData = await notifRes.json();
        setNotifications(notifData.notifications || []);
      } catch (err: any) {
        setError(err.message || "Erreur lors de la récupération des données.");
        router.replace("/auth/login?role=patient");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [router]);

  useEffect(() => {
    if (activeSection === "dossiers" && activeSubSection === null) {
      setActiveSubSection("dossiersMedicaux");
    }
  }, [activeSection, activeSubSection]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!patient) return;
    const { name, value } = e.target;
    setPatient({ ...patient, [name]: value } as Patient);
  };

  const handleBloodPressureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!patient) return;
    const { name, value } = e.target;
    setPatient({
      ...patient,
      bloodPressure: {
        ...patient.bloodPressure,
        [name]: value,
      } as { systolic: string; diastolic: string },
    } as Patient);
  };

  const handleProfileSubmit = async () => {
  if (!patient) return;
  const token = document.cookie
    .split("; ")
    .find((row) => row.startsWith("token="))
    ?.split("=")[1];
  try {
    const res = await fetch("/api/patient/me", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        firstName: patient.firstName,
        lastName: patient.lastName,
        email: patient.email,
        phoneNumber: patient.phoneNumber,
        address: patient.address,
        dateOfBirth: patient.dateOfBirth ? new Date(patient.dateOfBirth) : null,
        weight: patient.weight,
        height: patient.height,
        bloodPressure: patient.bloodPressure,
        heartRate: patient.heartRate,
        oxygen: patient.oxygen,
        temperature: patient.temperature,
        bloodType: patient.bloodType,
        allergies: patient.allergies,
        medicalHistory: patient.medicalHistory,
      }),
    });
    if (!res.ok) throw new Error("Erreur lors de la mise à jour du profil.");
    const data = await res.json();
    setPatient({ ...data, bloodPressure: patient.bloodPressure });
    alert("Profil mis à jour avec succès !");
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Une erreur inconnue s'est produite.";
    setError(errorMessage);
  }
};

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (formData.password !== formData.confirmPassword) {
      alert("Les mots de passe ne correspondent pas.");
      return;
    }
    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1];
      const res = await fetch("/api/patient/dependents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
        }),
      });
      if (!res.ok) throw new Error("Erreur lors de l'ajout de la personne à charge.");
      setIsModalOpen(false);
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
      });
      alert("Personne à charge ajoutée avec succès !");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleResultChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setResultFormData({ ...resultFormData, [e.target.name]: e.target.value });
  };

  const handleResultSubmit = async () => {
  try {
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("token="))
      ?.split("=")[1];
    const res = await fetch("/api/patient/results", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ...resultFormData, doctorName: patient?.firstName }),
    });
    if (!res.ok) throw new Error("Erreur lors de l’ajout du résultat.");
    const newResult = await res.json();
    setResults([newResult, ...results]);
    setResultFormData({ type: "", date: "", description: "", fileUrl: "" });
    setShowResultForm(false);
    await fetch("/api/patient/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        message: `Nouveau résultat ajouté : ${newResult.type} (${new Date(newResult.date).toLocaleDateString()}) par ${newResult.doctorName}`,
        type: "result",
        relatedId: newResult.id,
      }),
    });
    alert("Résultat ajouté avec succès !");
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Une erreur inconnue s'est produite.";
    setError(errorMessage);
  }
};

  const handleEditResult = (result: Result) => {
    setEditingResultId(result.id);
    setEditResultFormData({
      type: result.type,
      date: new Date(result.date).toISOString().split("T")[0],
      description: result.description || "",
      fileUrl: result.fileUrl || "",
    });
  };

  const handleEditResultChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setEditResultFormData({ ...editResultFormData, [e.target.name]: e.target.value });
  };

  const handleEditResultSubmit = async (resultId: string) => {
    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1];
      const res = await fetch(`/api/patient/results/${resultId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editResultFormData),
      });
      if (!res.ok) throw new Error("Erreur lors de la mise à jour du résultat.");
      const updatedResult = await res.json();
      setResults(results.map((r) => (r.id === resultId ? updatedResult : r)));
      setEditingResultId(null);
      setEditResultFormData({ type: "", date: "", description: "", fileUrl: "" });
      alert("Résultat mis à jour avec succès !");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleShareResult = async (resultId: string, sharedWithId: string) => {
    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1];
      const res = await fetch(`/api/patient/results/${resultId}/share`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ sharedWithId }),
      });
      if (!res.ok) throw new Error("Erreur lors du partage du résultat.");
      const updatedResult = await res.json();
      setResults(results.map((r) => (r.id === resultId ? updatedResult : r)));
      alert("Résultat partagé avec succès !");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAppointmentFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setAppointmentFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleAppointmentSubmit = async () => {
    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1];
      if (!token) throw new Error("Aucun token trouvé.");

      const res = await fetch("/api/patient/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          date: new Date(appointmentFormData.date),
          location: appointmentFormData.location,
          isTeleconsultation: appointmentFormData.isTeleconsultation,
          doctorId: appointmentFormData.doctorId,
        }),
      });

      if (!res.ok) throw new Error("Erreur lors de la création du rendez-vous.");
      const newAppointment = await res.json();
      setAppointments([newAppointment, ...appointments]);
      setIsAppointmentModalOpen(false);
      setAppointmentFormData({ date: "", location: "", isTeleconsultation: false, doctorId: "", month: new Date().getMonth() });
      await fetch("/api/patient/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: `Nouveau rendez-vous créé : ${new Date(newAppointment.date).toLocaleString()} - ${newAppointment.location}`,
          type: "appointment",
          relatedId: newAppointment.id,
        }),
      });
      if (newAppointment.doctorId) {
        await fetch(`/api/medecin/notifications/${newAppointment.doctorId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            message: `${patient?.firstName} ${patient?.lastName} a demandé un rendez-vous le ${new Date(newAppointment.date).toLocaleString()}`,
            patientId: patient?.id,
          }),
        });
      }
      alert("Rendez-vous créé avec succès !");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAppointmentResponse = async (appointmentId: string, action: "accept" | "reschedule" | "decline") => {
  try {
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("token="))
      ?.split("=")[1];
    if (!token) throw new Error("Aucun token trouvé.");

    const appointment = appointments.find((a) => a.id === appointmentId);
    if (!appointment) throw new Error("Rendez-vous non trouvé.");

    let newStatus: "Confirmé" | "En attente" | "Refusé";
    switch (action) {
      case "accept":
        newStatus = "Confirmé";
        break;
      case "reschedule":
        newStatus = "En attente";
        break;
      case "decline":
        newStatus = "Refusé";
        break;
      default:
        throw new Error("Action non valide.");
    }

    const res = await fetch(`/api/patient/appointments/${appointmentId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: newStatus }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Erreur lors de la mise à jour du rendez-vous: ${errorText}`);
    }

    const updatedAppointment = await res.json();
    setAppointments(appointments.map((a) => (a.id === appointmentId ? updatedAppointment : a)));
    setNotifications(notifications.filter((n) => n.relatedId !== appointmentId));

    alert(`Rendez-vous ${action === "accept" ? "accepté" : action === "reschedule" ? "repoussé" : "refusé"} avec succès !`);
  } catch (err: any) {
    console.error("Erreur dans handleAppointmentResponse:", err.message);
    setError(err.message);
  }
};

  const handleConsultationFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setConsultationFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleConsultationSubmit = async () => {
    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1];
      if (!token) throw new Error("Aucun token trouvé.");

      const res = await fetch("/api/patient/consultations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          date: new Date(consultationFormData.date),
          doctorName: consultationFormData.doctorName,
          summary: consultationFormData.summary,
        }),
      });

      if (!res.ok) throw new Error("Erreur lors de la création de la consultation.");
      const newConsultation = await res.json();
      setConsultations([newConsultation, ...consultations]);
      setIsConsultationModalOpen(false);
      setConsultationFormData({ date: "", doctorName: "", summary: "" });
      await fetch("/api/patient/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: `Nouvelle consultation ajoutée : ${newConsultation.doctorName} (${new Date(newConsultation.date).toLocaleDateString()})`,
          type: "consultation",
          relatedId: newConsultation.id,
        }),
      });
      alert("Consultation créée avec succès !");
    } catch (err: any) {
      setError(err.message);
    }
  };

//  const handleAction = async (
//   notificationId: string,
//   action: "accept" | "decline"
// ) => {
//   try {
//     const token = document.cookie
//       .split("; ")
//       .find((row) => row.startsWith("token="))
//       ?.split("=")[1];

//     if (!token) {
//       alert("Token JWT manquant");
//       return;
//     }

//     console.log(
//       `Action ${action} pour notification ${notificationId} avec token :`,
//       token
//     );

//     const res = await fetch("/api/patient/notifications", {
//       method: "PATCH",
//       headers: {
//         Authorization: `Bearer ${token}`,
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({ notificationId, action }),
//     });

//     if (!res.ok) {
//       const errorText = await res.text();
//       throw new Error(`Erreur HTTP ${res.status}: ${errorText}`);
//     }

//     // On ignore la réponse car on met à jour l’état local directement
//     // const data = await res.json();

//     // ✅ Mettre à jour la notification localement
//     setNotifications((prev) =>
//       prev.map((n) =>
//         n.id === notificationId
//           ? {
//               ...n,
//               read: true,
//               message: `${n.message} (${action === "accept" ? "Accepté" : "Refusé"})`,
//             }
//           : n
//       )
//     );

//     // ✅ Optionnel : appeler approvePatientAccess si nécessaire
//     if (action === "accept") {
//       const acceptedNotif = notifications.find((n) => n.id === notificationId);
//       if (acceptedNotif?.relatedId) {
//         approvePatientAccess?.(acceptedNotif.relatedId); // s'il existe
//       }
//     }
//   } catch (err: any) {
//     console.error(`Erreur lors de l'action ${action} :`, err.message);
//     alert(`Échec : ${err.message}`);
//   }
// };
const handleAction = async (notificationId: string, action: "accept" | "decline") => {
  try {
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("token="))
      ?.split("=")[1];

    if (!token) {
      alert("Token JWT manquant");
      console.error("Aucun token trouvé dans les cookies.");
      return;
    }

    console.log("Démarrage de handleAction - Token:", token.substring(0, 10) + "...", "Notification ID:", notificationId, "Action:", action);

    const res = await fetch("/api/medecin/notifications", { // URL corrigée
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ notificationId, action }),
    });

    console.log("Réponse API brute:", { status: res.status, statusText: res.statusText });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Erreur API:", { status: res.status, error: errorText });
      throw new Error(`Erreur HTTP ${res.status}: ${errorText}`);
    }

    const data = await res.json();
    console.log("Données reçues de l'API:", data);

    // Mettre à jour l'état local
    setNotifications((prev) => {
      const updatedNotifications = prev.map((n) =>
        n.id === notificationId
          ? {
              ...n,
              read: true,
              message: data.message || // Privilégier le message de l'API
                (action === "accept"
                  ? `Le patient ${patient?.firstName || "Inconnu"} ${patient?.lastName || ""} a accepté votre demande d'accès.`
                  : action === "decline" && n.type === "accessRequest"
                  ? `Le patient ${patient?.firstName || "Inconnu"} ${patient?.lastName || ""} a refusé votre demande d'accès.`
                  : n.type === "appointment"
                  ? `Le patient ${patient?.firstName || "Inconnu"} ${patient?.lastName || ""} a refusé le rendez-vous programmé le ${new Date(n.date).toLocaleDateString("fr-FR")}.`
                  : n.message),
            }
          : n
      );
      console.log("Nouvel état notifications:", updatedNotifications);
      return updatedNotifications;
    });

    // Optionnel : appeler approvePatientAccess si nécessaire
    if (action === "accept") {
      const acceptedNotif = notifications.find((n) => n.id === notificationId);
      if (acceptedNotif?.relatedId) {
        approvePatientAccess?.(acceptedNotif.relatedId);
        console.log("approvePatientAccess appelé avec relatedId:", acceptedNotif.relatedId);
      }
    }
  } catch (err: any) {
    console.error(`Erreur lors de l'action ${action} :`, err.message);
    alert(`Échec : ${err.message}`);
  }
};

  const approvePatientAccess = (patientId: string) => {
    if (selectedPatientId && selectedPatientId === patientId) {
      setPatientAccessApproved(true); // Mettre à jour l'état à true pour autoriser l'accès
      // Optionnel : envoyer une notification au médecin
      // sendNotification(patientId, `${doctor?.firstName} ${doctor?.lastName} a approuvé l'accès.`);
    }
  };

  const handleAccessRequestResponse = async (notificationId: string, approve: boolean) => {
  try {
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("token="))
      ?.split("=")[1];
    if (!token) throw new Error("Aucun token trouvé.");

    const notification = notifications.find((n) => n.id === notificationId);
    if (!notification || notification.type !== "accessRequest" || !notification.relatedId) {
      throw new Error("Notification invalide ou non trouvée.");
    }

    console.log("Envoi de la requête avec relatedId:", notification.relatedId, "approve:", approve);

    const res = await fetch(`/api/patient/access/${notification.relatedId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ approve }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Erreur lors de la réponse à la demande d'accès: ${errorText}`);
    }

    setNotifications(notifications.filter((n) => n.id !== notificationId));
    if (approve) {
      await fetch(`/api/medecin/notifications/${notification.relatedId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: `${patient?.firstName} ${patient?.lastName} a approuvé votre demande d'accès aux dossiers médicaux.`,
          patientId: patient?.id,
          accessGranted: true,
        }),
      });
      alert("Accès approuvé avec succès ! Le médecin a été notifié.");
    } else {
      alert("Accès refusé.");
    }
  } catch (err: any) {
    console.error("Erreur dans handleAccessRequestResponse:", err.message);
    setError(err.message);
  }
};
  
  if (loading) return <div className="p-6 text-center text-gray-500">Chargement...</div>;
  if (error) return <div className="p-6 text-center text-red-500">Erreur : {error}</div>;
  if (!patient) return <div className="p-6 text-center text-red-500">Utilisateur non connecté</div>;

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-white shadow-lg p-4">
        <div className="mb-6">
          <img src="/assets/images/logo.png" alt="Meddata Secured" className="h-10" />
        </div>
        <nav className="space-y-2">
          <button
            onClick={() => {
              setActiveSection("accueil");
              setActiveSubSection(null);
              setIsDropdownOpen(null);
            }}
            className={`flex items-center w-full p-2 text-gray-700 hover:bg-blue-50 rounded-lg transition duration-200 ${
              activeSection === "accueil" ? "bg-blue-100 font-medium" : ""
            }`}
          >
            <HomeIcon className="h-5 w-5 mr-3" />
            Accueil
          </button>
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(isDropdownOpen === "profil" ? null : "profil")}
              className={`flex items-center w-full p-2 text-gray-700 hover:bg-blue-50 rounded-lg transition duration-200 ${
                activeSection === "profil" ? "bg-blue-100 font-medium" : ""
              }`}
            >
              <UserIcon className="h-5 w-5 mr-3" />
              Profil
              <svg
                className={`w-4 h-4 ml-auto ${isDropdownOpen === "profil" ? "transform rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {isDropdownOpen === "profil" && (
              <div className="absolute w-full mt-1 bg-white border rounded shadow-lg z-10">
                <button
                  onClick={() => {
                    setActiveSection("profil");
                    setActiveSubSection("profil");
                    setIsDropdownOpen(null);
                  }}
                  className="w-full text-left p-2 hover:bg-gray-100"
                >
                  Profil
                </button>
                <button
                  onClick={() => {
                    setActiveSection("profil");
                    setActiveSubSection("editProfile");
                    setIsDropdownOpen(null);
                  }}
                  className="w-full text-left p-2 hover:bg-gray-100"
                >
                  Modifier le profil
                </button>
              </div>
            )}
          </div>
          <button
            onClick={() => {
              setActiveSection("profilSante");
              setActiveSubSection("profilSante");
              setIsDropdownOpen(null);
            }}
            className={`flex items-center w-full p-2 text-gray-700 hover:bg-blue-50 rounded-lg transition duration-200 ${
              activeSection === "profilSante" ? "bg-blue-100 font-medium" : ""
            }`}
          >
            <UserIcon className="h-5 w-5 mr-3" />
            Profil de Santé
          </button>
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(isDropdownOpen === "rendezvous" ? null : "rendezvous")}
              className={`flex items-center w-full p-2 text-gray-700 hover:bg-blue-50 rounded-lg transition duration-200 ${
                activeSection === "rendezvous" ? "bg-blue-100 font-medium" : ""
              }`}
            >
              <CalendarIcon className="h-5 w-5 mr-3" />
              Mes rendez-vous
              <svg
                className={`w-4 h-4 ml-auto ${isDropdownOpen === "rendezvous" ? "transform rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {isDropdownOpen === "rendezvous" && (
              <div className="absolute w-full mt-1 bg-white border rounded shadow-lg z-10">
                <button
                  onClick={() => {
                    setActiveSection("rendezvous");
                    setActiveSubSection("demanderRendezvous");
                    setIsDropdownOpen(null);
                  }}
                  className="w-full text-left p-2 hover:bg-gray-100"
                >
                  Demander un rendez-vous
                </button>
                <button
                  onClick={() => {
                    setActiveSection("rendezvous");
                    setActiveSubSection("historique");
                    setIsDropdownOpen(null);
                  }}
                  className="w-full text-left p-2 hover:bg-gray-100"
                >
                  Historique
                </button>
              </div>
            )}
          </div>
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(isDropdownOpen === "dossiers" ? null : "dossiers")}
              className={`flex items-center w-full p-2 text-gray-700 hover:bg-blue-50 rounded-lg transition duration-200 ${
                activeSection === "dossiers" ? "bg-blue-100 font-medium" : ""
              }`}
            >
              <DocumentTextIcon className="h-5 w-5 mr-3" />
              Mes dossiers
              <svg
                className={`w-4 h-4 ml-auto ${isDropdownOpen === "dossiers" ? "transform rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {isDropdownOpen === "dossiers" && (
              <div className="absolute w-full mt-1 bg-white border rounded shadow-lg z-10">
                <button
                  onClick={() => {
                    setActiveSection("dossiers");
                    setActiveSubSection("dossiersMedicaux");
                    setIsDropdownOpen(null);
                  }}
                  className="w-full text-left p-2 hover:bg-gray-100"
                >
                  Mes dossiers médicaux
                </button>
                <button
                  onClick={() => {
                    setActiveSection("dossiers");
                    setActiveSubSection("dossiersPartages");
                    setIsDropdownOpen(null);
                  }}
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
              className={`flex items-center w-full p-2 text-gray-700 hover:bg-blue-50 rounded-lg transition duration-200 ${
                activeSection === "chat" ? "bg-blue-100 font-medium" : ""
              }`}
            >
              <ChatBubbleLeftIcon className="h-5 w-5 mr-3" />
              Med Chat
              <svg
                className={`w-4 h-4 ml-auto ${isDropdownOpen === "chat" ? "transform rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {isDropdownOpen === "chat" && (
              <div className="absolute w-full mt-1 bg-white border rounded shadow-lg z-10">
                <button
                  onClick={() => {
                    setActiveSection("chat");
                    setActiveSubSection("messagerie");
                    setIsDropdownOpen(null);
                  }}
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
              className={`flex items-center w-full p-2 text-gray-700 hover:bg-blue-50 rounded-lg transition duration-200 ${
                activeSection === "consultations" ? "bg-blue-100 font-medium" : ""
              }`}
            >
              <ClipboardDocumentIcon className="h-5 w-5 mr-3" />
              Mes consultations
              <svg
                className={`w-4 h-4 ml-auto ${isDropdownOpen === "consultations" ? "transform rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {isDropdownOpen === "consultations" && (
              <div className="absolute w-full mt-1 bg-white border rounded shadow-lg z-10">
                <button
                  onClick={() => {
                    setActiveSection("consultations");
                    setActiveSubSection("historique");
                    setIsDropdownOpen(null);
                  }}
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
        <header className="flex justify-between items-center mb-6 p-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl shadow-lg transform transition-all duration-300 hover:shadow-xl">
          <h1 className="text-xl md:text-2xl font-bold tracking-wide">
            Tableau de bord / <span className="text-yellow-300">{activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}</span> / <span className="text-teal-200">{patient?.firstName} {patient?.lastName}</span>
          </h1>
          <div className="flex space-x-4 items-center">
            <button
              onClick={() => setShowNotifPanel(!showNotifPanel)}
              className="relative p-2 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-colors duration-200"
              title="Notifications"
            >
              <BellIcon className="h-6 w-6 text-white" />
              {Array.isArray(notifications) && notifications.filter((n) => !n.read).length > 0 && (
                <span className="absolute top-0 right-0 inline-block w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {notifications.filter((n) => !n.read).length}
                </span>
              )}
            </button>
            <Cog6ToothIcon className="h-6 w-6 text-white hover:text-gray-200 cursor-pointer transition-colors duration-200" />
            <Button
              onClick={() => setIsModalOpen(true)}
              className="bg-yellow-400 text-gray-900 font-semibold px-4 py-2 rounded-lg hover:bg-yellow-500 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Ajouter des personnes à charge
            </Button>
          </div>
        </header>

        {showNotifPanel && (
  <Card className="absolute right-6 mt-2 w-80 max-h-80 overflow-y-auto rounded-2xl shadow-lg border bg-white z-50">
    <CardHeader>
      <CardTitle className="text-lg font-semibold text-gray-800">Notifications</CardTitle>
    </CardHeader>
    <CardContent>
      {Array.isArray(notifications) && notifications.length > 0 ? (
        <ul className="space-y-2 text-gray-700">
          {notifications
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .map((note) => (
              <li
  key={note.id}
  onClick={() => {
    if (note.type !== "accessRequest" || note.read) {
      setNotifications(
        notifications.map((n) => (n.id === note.id ? { ...n, read: true } : n))
      );
    }
  }}
  className={`cursor-pointer p-3 rounded-lg transition ${
    note.read ? "bg-gray-100" : "bg-blue-100"
  } hover:bg-blue-200`}
>
  <div className="flex flex-col gap-1">
    {/* Message principal avec icône */}
    <div className="flex items-start gap-2 text-sm">
      <span className="text-lg">🔔</span>
      <div className="flex-1">
        {note.type === "accessRequest" && (
          <span className="font-medium text-gray-800">
            Demande d'accès : {note.message}
          </span>
        )}
        {note.type === "appointment" && (
          <span>Nouveau rendez-vous : {note.message}</span>
        )}
        {note.type === "consultation" && (
          <span>Nouvelle consultation : {note.message}</span>
        )}
        {note.type === "result" && (
          <span>Nouveau résultat : {note.message}</span>
        )}
      </div>
    </div>

    {/* Date */}
    <div className="text-xs text-gray-500 pl-7">
      {new Date(note.date).toLocaleString()}
    </div>

    {/* Boutons actions */}
    {note.type === "accessRequest" && !note.read && note.relatedId && (
      <div className="flex justify-end gap-2 mt-2 pl-7">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleAction(note.id, "accept");
          }}
          className="bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-1 rounded"
        >
          Accepter
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleAction(note.id, "decline");
          }}
          className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1 rounded"
        >
          Refuser
        </button>
      </div>
    )}
  </div>
</li>

            ))}
        </ul>
      ) : (
        <p className="text-gray-500 italic p-2">Aucune notification.</p>
      )}
    </CardContent>
  </Card>
)}

        {activeSection === "accueil" && (
          <section className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 transform transition-all duration-300 hover:shadow-xl">
            <h1 className="text-3xl font-extrabold text-gray-800 mb-6 text-center bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Bienvenue, <span className="text-yellow-400">{patient?.firstName} {patient?.lastName}</span> !
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[
                { title: "Mes journaux", icon: HomeIcon, bg: "bg-blue-100", text: "text-blue-700", count: 0 },
                { title: "Mes rendez-vous", icon: CalendarIcon, bg: "bg-green-100", text: "text-green-700", count: appointments.length },
                { title: "Mes personnes à charge", icon: UserIcon, bg: "bg-yellow-100", text: "text-yellow-700", count: 0 },
                { title: "Mes visites", icon: ClipboardDocumentIcon, bg: "bg-purple-100", text: "text-purple-700", count: consultations.length },
              ].map(({ title, icon: Icon, bg, text, count }) => (
                <div
                  key={title}
                  className={`${bg} p-6 rounded-xl text-center hover:${bg.replace('100', '200')} hover:shadow-lg transition-all duration-300 transform hover:-translate-y-2`}
                >
                  <Icon className={`h-10 w-10 ${text} mx-auto mb-3`} />
                  <p className={`text-lg font-semibold ${text}`}>{title}</p>
                  <p className="text-2xl font-bold text-gray-800">{count}</p>
                </div>
              ))}
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6 bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
              Suivi des symptômes
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-gray-50 rounded-xl shadow-inner">
                <div className="space-y-4">
                  {["Mes journaux", "Symptôme 2", "Symptôme 3", "Symptôme 4"].map((item, index) => (
                    <div
                      key={index}
                      className="h-12 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg animate-pulse"
                    ></div>
                  ))}
                </div>
              </div>
              <div className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl shadow-md">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">MON DIAGNOSTIC</h3>
                    <p className="text-gray-600 italic">En cours...</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">MON HISTORIQUE</h3>
                    <p className="text-gray-600 italic">À consulter</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">MES MÉDICAMENTS ACTUELS</h3>
                    <p className="text-gray-600 italic">À jour</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {activeSection === "profil" && activeSubSection === "profil" && (
          <section>
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Mon Profil</h1>
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-gradient-to-br from-blue-50 to-white rounded-xl text-center">
                  <div className="w-24 h-24 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <UserIcon className="h-12 w-12 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-800 mb-2">{patient?.firstName} {patient?.lastName}</h3>
                  <p className="text-gray-600 mb-1">ID: {patient?.id}</p>
                  <p className="text-gray-600 mb-1">Né(e) le: {patient?.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : "Non spécifié"}</p>
                  <h4 className="text-lg font-medium text-gray-700 mt-4 mb-2">Contacts</h4>
                  <p className="text-gray-600 mb-1">Email: {patient?.email}</p>
                  <p className="text-gray-600 mb-1">Téléphone: {patient?.phoneNumber || "Non spécifié"}</p>
                  <p className="text-gray-600">Adresse: {patient?.address || "Non spécifié"}</p>
                </div>
                <div className="p-6 bg-gradient-to-br from-green-50 to-white rounded-xl">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Comptes liés</h3>
                  <div className="flex items-center p-2 bg-white rounded-lg shadow-md mb-2">
                    <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                      {patient?.firstName?.slice(0, 1)}
                    </span>
                    <div className="ml-2">
                      <p className="text-gray-900">{patient?.firstName}</p>
                      <p className="text-gray-500">{patient?.id}</p>
                      <p className="text-gray-500">Inscrit récemment</p>
                    </div>
                  </div>
                  <button className="mt-2 bg-green-200 text-green-600 px-4 py-1 rounded-lg">
                    Compte actif
                  </button>
                </div>
              </div>
              <div className="mt-6 text-center">
                <Button
                  onClick={() => {
                    setActiveSection("profil");
                    setActiveSubSection("editProfile");
                  }}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  Modifier Profil
                </Button>
              </div>
            </div>
          </section>
        )}

        {activeSection === "profil" && activeSubSection === "editProfile" && (
          <section>
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Modifier le profil</h1>
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-gradient-to-br from-green-50 to-white rounded-xl">
                  <div className="space-y-4">
                    <Input
                      type="text"
                      name="firstName"
                      value={patient?.firstName || ""}
                      onChange={handleProfileChange}
                      placeholder="Prénom"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <Input
                      type="text"
                      name="lastName"
                      value={patient?.lastName || ""}
                      onChange={handleProfileChange}
                      placeholder="Nom"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <Input
                      type="email"
                      name="email"
                      value={patient?.email || ""}
                      onChange={handleProfileChange}
                      placeholder="Email"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <Input
                      type="text"
                      name="phoneNumber"
                      value={patient?.phoneNumber || ""}
                      onChange={handleProfileChange}
                      placeholder="Numéro de téléphone"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <Input
                      type="text"
                      name="address"
                      value={patient?.address || ""}
                      onChange={handleProfileChange}
                      placeholder="Adresse"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <Input
                      type="date"
                      name="dateOfBirth"
                      value={
                        patient?.dateOfBirth
                          ? new Date(patient.dateOfBirth).toISOString().split("T")[0]
                          : ""
                      }
                      onChange={handleProfileChange}
                      placeholder="Date de naissance"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="mt-6 flex justify-center gap-4">
                    <Button
                      onClick={() => setActiveSubSection("profil")}
                      variant="outline"
                      className="px-6 py-2 rounded-lg border-gray-300 hover:bg-gray-100"
                    >
                      Annuler
                    </Button>
                    <Button
                      onClick={handleProfileSubmit}
                      className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
                    >
                      Enregistrer
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {activeSection === "profilSante" && activeSubSection === "profilSante" && (
          <section>
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Profil de Santé</h1>
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
              <div className="flex items-center mb-6 p-4 bg-gradient-to-br from-blue-50 to-white rounded-xl">
                <div className="w-24 h-24 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <UserIcon className="h-12 w-12 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {patient?.firstName} {patient?.lastName}
                  </h2>
                  <p className="text-gray-600">{patient?.id}</p>
                  <p className="text-gray-600">Inscrit récemment</p>
                </div>
                <Button
                  onClick={handleProfileSubmit}
                  className="ml-auto bg-blue-600 text-white px-4 py-2 rounded"
                >
                  Enregistrer le profil
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-gray-50 rounded-lg">
                  <label className="text-blue-600 mb-2 block">Poids</label>
                  <Input
                    type="text"
                    name="weight"
                    value={patient?.weight || ""}
                    onChange={handleProfileChange}
                    placeholder="kg"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <label className="text-blue-600 mt-2 block">Taille</label>
                  <Input
                    type="text"
                    name="height"
                    value={patient?.height || ""}
                    onChange={handleProfileChange}
                    placeholder="cm"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <label className="text-blue-600 mt-2 block">Pression artérielle (systolique)</label>
                  <Input
                    type="text"
                    name="systolic"
                    value={patient?.bloodPressure?.systolic || ""}
                    onChange={handleBloodPressureChange}
                    placeholder="mmHg"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <label className="text-blue-600 mt-2 block">Pression artérielle (diastolique)</label>
                  <Input
                    type="text"
                    name="diastolic"
                    value={patient?.bloodPressure?.diastolic || ""}
                    onChange={handleBloodPressureChange}
                    placeholder="mmHg"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <label className="text-blue-600 mt-2 block">Fréquence cardiaque</label>
                  <Input
                    type="text"
                    name="heartRate"
                    value={patient?.heartRate || ""}
                    onChange={handleProfileChange}
                    placeholder="bpm"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <label className="text-blue-600 mt-2 block">Taux d'oxygène</label>
                  <Input
                    type="text"
                    name="oxygen"
                    value={patient?.oxygen || ""}
                    onChange={handleProfileChange}
                    placeholder="%"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <label className="text-blue-600 mt-2 block">Température</label>
                  <Input
                    type="text"
                    name="temperature"
                    value={patient?.temperature || ""}
                    onChange={handleProfileChange}
                    placeholder="°C"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <label className="text-blue-600 mt-2 block">Groupe sanguin</label>
                  <Input
                    type="text"
                    name="bloodType"
                    value={patient?.bloodType || ""}
                    onChange={handleProfileChange}
                    placeholder="ex. A+, O-"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <label className="text-blue-600 mt-2 block">Allergies</label>
                  <Input
                    type="text"
                    name="allergies"
                    value={patient?.allergies || ""}
                    onChange={handleProfileChange}
                    placeholder="ex. Pénicilline, pollen"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <label className="text-blue-600 mt-2 block">Antécédents médicaux</label>
                  <Textarea
                    name="medicalHistory"
                    value={patient?.medicalHistory || ""}
                    onChange={handleProfileChange}
                    placeholder="Antécédents médicaux"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        {activeSection === "rendezvous" && (
          <section>
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Mes rendez-vous</h1>
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <button
                    onClick={() => setActiveSubSection("demanderRendezvous")}
                    className="text-blue-600 mr-2 hover:underline"
                  >
                    Demander un rendez-vous
                  </button>
                  <button
                    onClick={() => setActiveSubSection("historique")}
                    className="text-blue-600 hover:underline"
                  >
                    Historique
                  </button>
                </div>
                <Button
                  onClick={() => setIsAppointmentModalOpen(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded"
                >
                  + Créer un rendez-vous
                </Button>
              </div>
              {activeSubSection === "demanderRendezvous" && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  {appointments.filter((a) => new Date(a.date).getMonth() === appointmentFormData.month)
                    .length > 0 ? (
                    appointments
                      .filter((a) => new Date(a.date).getMonth() === appointmentFormData.month)
                      .map((a) => (
                        <div key={a.id} className="border p-3 rounded-lg mb-2">
                          <p>
                            {new Date(a.date).toLocaleString()} - {a.location} ({a.status})
                            {a.createdBy && a.createdBy !== patient?.id && (
                              <span> (Créé par Dr. {a.doctorName})</span>
                            )}
                          </p>
                          {a.createdBy && a.createdBy !== patient?.id && a.status === "En attente" && (
                            <div className="mt-2 flex space-x-2">
                              <Button
                                variant="outline"
                                onClick={() => handleAppointmentResponse(a.id, "accept")}
                              >
                                Accepter
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => handleAppointmentResponse(a.id, "reschedule")}
                              >
                                Repousser
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={() => handleAppointmentResponse(a.id, "decline")}
                              >
                                Refuser
                              </Button>
                            </div>
                          )}
                        </div>
                      ))
                  ) : (
                    <p className="text-gray-600">Aucun rendez-vous pour ce mois.</p>
                  )}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">Choisir un mois</label>
                    <Select
                      value={appointmentFormData.month.toString()}
                      onValueChange={(value) => setAppointmentFormData((prev) => ({ ...prev, month: parseInt(value) }))}
                    >
                      <SelectTrigger className="w-full mt-1">
                        <SelectValue placeholder="Sélectionner un mois" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => (
                          <SelectItem key={i} value={i.toString()}>
                            {new Date(2025, i, 1).toLocaleString('default', { month: 'long' })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              {activeSubSection === "historique" && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  {appointments.length > 0 ? (
                    appointments.map((a) => (
                      <div key={a.id} className="border p-3 rounded-lg mb-2">
                        <p>
                          {new Date(a.date).toLocaleString()} - {a.location} ({a.status})
                          {a.createdBy && a.createdBy !== patient?.id && (
                            <span> (Créé par Dr. {a.doctorName})</span>
                          )}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-600">Aucun rendez-vous dans l'historique.</p>
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {activeSection === "dossiers" && (
          <section>
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Mes dossiers</h1>
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
              {activeSubSection === "dossiersMedicaux" && (
                <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
                  <CardHeader className="bg-gradient-to-r from-blue-100 to-indigo-100 p-6 rounded-t-xl">
                    <CardTitle className="text-2xl font-bold text-gray-800 flex justify-between items-center">
                      Mes dossiers médicaux
                      <Button
                        variant="default"
                        className="bg-blue-600 text-white hover:bg-blue-700 transition duration-200"
                        onClick={() => document.getElementById("fileUpload")?.click()}
                      >
                        Télécharger
                      </Button>
                    </CardTitle>
                    <input
                      type="file"
                      id="fileUpload"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        setSelectedFile(e.target.files?.[0] || null);
                        handleFileUpload();
                      }}
                    />
                  </CardHeader>
                  <CardContent className="p-6 bg-white rounded-b-xl">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                      <button
                        onClick={() => setActiveSubSection("antecedents")}
                        className="flex-1 p-4 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-lg shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-1"
                      >
                        Antécédents médicaux
                      </button>
                      <button
                        onClick={() => setActiveSubSection("ordonnances")}
                        className="flex-1 p-4 bg-green-50 hover:bg-green-100 text-green-700 font-semibold rounded-lg shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-1"
                      >
                        Ordonnances
                      </button>
                      <button
                        onClick={() => setActiveSubSection("procedures")}
                        className="flex-1 p-4 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 font-semibold rounded-lg shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-1"
                      >
                        Procédures
                      </button>
                      <button
                        onClick={() => setActiveSubSection("tests")}
                        className="flex-1 p-4 bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold rounded-lg shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-1"
                      >
                        Tests de diagnostic
                      </button>
                      <button
                        onClick={() => setActiveSubSection("resultats")}
                        className="flex-1 p-4 bg-red-50 hover:bg-red-100 text-red-700 font-semibold rounded-lg shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-1"
                      >
                        Résultats médicaux
                      </button>
                    </div>
                    {activeSubSection === "antecedents" && (
                      <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
                        <h2 className="text-xl font-semibold mb-4 text-gray-800">Antécédents médicaux</h2>
                        <p className="text-gray-700">
                          {patient?.medicalHistory || "Aucun antécédent médical enregistré."}
                        </p>
                      </div>
                    )}
                    {activeSubSection === "ordonnances" && (
                      <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
                        <h2 className="text-xl font-semibold mb-4 text-gray-800">Ordonnances</h2>
                        <p className="text-gray-700">Aucune ordonnance disponible pour l'instant.</p>
                      </div>
                    )}
                    {activeSubSection === "procedures" && (
                      <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
                        <h2 className="text-xl font-semibold mb-4 text-gray-800">Procédures</h2>
                        <p className="text-gray-700">Aucune procédure disponible pour l'instant.</p>
                      </div>
                    )}
                    {activeSubSection === "tests" && (
                      <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
                        <h2 className="text-xl font-semibold mb-4 text-gray-800">Tests de diagnostic</h2>
                        <p className="text-gray-700">Aucun test de diagnostic disponible pour l'instant.</p>
                      </div>
                    )}
                    {activeSubSection === "resultats" && (
                      <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
                        <h2 className="text-xl font-semibold mb-4 text-gray-800">Résultats médicaux</h2>
                        {Array.isArray(results) && results.length > 0 ? (
                          <ul className="space-y-4">
                            {results.map((result) => (
                              <li key={result.id} className="p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
                                <p><strong>Type :</strong> {result.type}</p>
                                <p><strong>Date :</strong> {new Date(result.date).toLocaleDateString()}</p>
                                <p><strong>Description :</strong> {result.description}</p>
                                <p><strong>Fournisseur :</strong> Dr. {result.doctorName}</p>
                                {result.fileUrl && (
                                  <a
                                    href={result.fileUrl}
                                    className="text-blue-600 hover:underline mt-2 block"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    Voir le fichier
                                  </a>
                                )}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-gray-600">Aucun résultat médical disponible.</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
              {activeSubSection === "dossiersPartages" && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Dossiers partagés</h2>
                  <ul className="space-y-4">
                    {Array.isArray(results) &&
                      results
                        .filter((r) => r.isShared)
                        .map((r) => (
                          <li key={r.id} className="p-3 bg-gray-50 rounded-lg">
                            <p>
                              <strong>Type :</strong> {r.type}
                            </p>
                            <p>
                              <strong>Date :</strong> {new Date(r.date).toLocaleDateString()}
                            </p>
                            <p>
                              <strong>Partagé avec :</strong> {r.sharedWith?.firstName} {r.sharedWith?.lastName}
                            </p>
                          </li>
                        ))}
                    {Array.isArray(results) && results.filter((r) => r.isShared).length === 0 && (
                      <p className="text-gray-600">Aucun dossier partagé.</p>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}

        {activeSection === "chat" && activeSubSection === "messagerie" && (
          <section>
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Med Chat</h1>
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
              <p className="text-gray-600">À implémenter.</p>
            </div>
          </section>
        )}

        {activeSection === "consultations" && (
          <section>
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Mes consultations</h1>
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <button
                    onClick={() => setActiveSubSection("historique")}
                    className="text-blue-600 hover:underline"
                  >
                    Historique
                  </button>
                </div>
                <Button
                  onClick={() => setIsConsultationModalOpen(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded"
                >
                  + Créer une consultation
                </Button>
              </div>
              {activeSubSection === "historique" && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  {consultations.length > 0 ? (
                    consultations.map((c) => (
                      <div key={c.id} className="border p-3 rounded-lg mb-2">
                        <p>
                          <strong>Date :</strong> {new Date(c.date).toLocaleDateString("fr-FR")}
                        </p>
                        <p>
                          <strong>Médecin :</strong> {c.doctorName}
                        </p>
                        <p>
                          <strong>Résumé :</strong> {c.summary}
                        </p>
                        {c.createdBy && c.createdBy !== patient?.id && (
                          <p className="text-gray-500">Créé par Dr. {c.doctorName}</p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-600">Aucune consultation disponible.</p>
                  )}
                </div>
              )}
            </div>
          </section>
        )}

     {activeSection === "notifications" && (
  <section>
    <h1 className="text-3xl font-bold text-gray-800 mb-6">Notifications</h1>
    <Card className="bg-white p-6 rounded-xl shadow-lg">
      <CardContent>
        {notifications.length > 0 ? (
          <ul className="space-y-4">
            {notifications.map((note) => (
              <li key={note.id} className="border-b pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="mr-2">🔔</span>
                    {note.type === "accessRequest" && (
                      <span>
                        Demande d'accès de Dr. {note.medecinId}: {note.message || "Aucun motif"}
                      </span>
                    )}
                    {note.type === "appointment" && (
                      <span>Nouveau rendez-vous: {note.message}</span>
                    )}
                    {note.type === "consultation" && (
                      <span>Nouvelle consultation: {note.message}</span>
                    )}
                    {note.type === "result" && <span>Nouveau résultat: {note.message}</span>}
                    <br />
                    <small className="text-gray-400 text-xs">
                      {new Date(note.date).toLocaleString()}
                    </small>
                  </div>
                  {note.type === "accessRequest" && !note.read && note.relatedId && note.medecinId && (
                    <div className="mt-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAction(note.id, "accept");
                        }}
                        className="bg-green-500 text-white hover:bg-green-600 text-xs px-2 py-1 rounded mr-1"
                      >
                        Accepter
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAction(note.id, "decline");
                        }}
                        className="bg-red-500 text-white hover:bg-red-600 text-xs px-2 py-1 rounded"
                      >
                        Refuser
                      </button>
                    </div>
                  )}
                  <div className="text-xs text-gray-500 mt-1">
                    <p>Debug - type: {note.type}</p>
                    <p>Debug - read: {String(note.read)} (type: {typeof note.read})</p>
                    <p>Debug - relatedId: {note.relatedId || "undefined"} (type: {typeof note.relatedId})</p>
                    <p>Debug - medecinId: {note.medecinId || "undefined"} (type: {typeof note.medecinId})</p>
                    <p>Debug - Condition: {note.type === "accessRequest" && !note.read && note.relatedId && note.medecinId ? "true" : "false"}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 italic p-2">Aucune notification.</p>
        )}
      </CardContent>
    </Card>
  </section>
)}

        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-96 p-6 bg-white rounded-2xl">
              <CardHeader>
                <CardTitle>Ajouter une personne à charge</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Prénom *</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleFormChange}
                      className="mt-1 p-2 w-full border rounded"
                      required
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
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Confirmez le mot de passe *
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleFormChange}
                      className="mt-1 p-2 w-full border rounded"
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsModalOpen(false)}
                    >
                      Annuler
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      className="bg-blue-600 text-white"
                    >
                      Ajouter une personne à charge
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {isAppointmentModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-96 p-6 bg-white rounded-2xl">
              <CardHeader>
                <CardTitle>Créer un rendez-vous</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Médecin</label>
                    <select
                      name="doctorId"
                      value={appointmentFormData.doctorId}
                      onChange={handleAppointmentFormChange}
                      className="w-full p-2 border rounded-md"
                      required
                    >
                      <option value="">Sélectionner un médecin</option>
                      {Array.isArray(doctors) &&
                        doctors.map((d) => (
                          <option key={d.id} value={d.id}>
                            Dr. {d.firstName} {d.lastName} ({d.speciality})
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date et heure *</label>
                    <Input
                      type="datetime-local"
                      name="date"
                      value={appointmentFormData.date}
                      onChange={handleAppointmentFormChange}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Lieu *</label>
                    <Input
                      type="text"
                      name="location"
                      value={appointmentFormData.location}
                      onChange={handleAppointmentFormChange}
                      placeholder="ex. Hôpital Général"
                      required
                    />
                  </div>
                  <div>
                    <label className="flex items-center text-sm font-medium text-gray-700">
                      <Checkbox
                        name="isTeleconsultation"
                        checked={appointmentFormData.isTeleconsultation}
                        onCheckedChange={(checked) =>
                          setAppointmentFormData((prev) => ({
                            ...prev,
                            isTeleconsultation: !!checked,
                          }))
                        }
                        className="mr-2"
                      />
                      Téléconsultation
                    </label>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsAppointmentModalOpen(false)}
                    >
                      Annuler
                    </Button>
                    <Button
                      onClick={handleAppointmentSubmit}
                      className="bg-blue-600 text-white"
                    >
                      Créer le rendez-vous
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {isConsultationModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
	                <Card className="w-96 p-6 bg-white rounded-2xl">
              <CardHeader>
                <CardTitle>Créer une consultation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date *</label>
                    <Input
                      type="date"
                      name="date"
                      value={consultationFormData.date}
                      onChange={handleConsultationFormChange}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Médecin *</label>
                    <Input
                      type="text"
                      name="doctorName"
                      value={consultationFormData.doctorName}
                      onChange={handleConsultationFormChange}
                      placeholder="Nom du médecin"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Résumé *</label>
                    <Textarea
                      name="summary"
                      value={consultationFormData.summary}
                      onChange={handleConsultationFormChange}
                      placeholder="Résumé de la consultation"
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsConsultationModalOpen(false)}
                    >
                      Annuler
                    </Button>
                    <Button
                      onClick={handleConsultationSubmit}
                      className="bg-blue-600 text-white"
                    >
                      Créer la consultation
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {showResultForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-96 p-6 bg-white rounded-2xl">
              <CardHeader>
                <CardTitle>{editingResultId ? "Modifier le résultat" : "Ajouter un résultat"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Type *</label>
                    <Input
                      type="text"
                      name="type"
                      value={editingResultId ? editResultFormData.type : resultFormData.type}
                      onChange={editingResultId ? handleEditResultChange : handleResultChange}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date *</label>
                    <Input
                      type="date"
                      name="date"
                      value={editingResultId ? editResultFormData.date : resultFormData.date}
                      onChange={editingResultId ? handleEditResultChange : handleResultChange}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <Textarea
                      name="description"
                      value={editingResultId ? editResultFormData.description : resultFormData.description}
                      onChange={editingResultId ? handleEditResultChange : handleResultChange}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Fichier (URL)</label>
                    <Input
                      type="text"
                      name="fileUrl"
                      value={editingResultId ? editResultFormData.fileUrl : resultFormData.fileUrl}
                      onChange={editingResultId ? handleEditResultChange : handleResultChange}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowResultForm(false);
                        setEditingResultId(null);
                        setEditResultFormData({ type: "", date: "", description: "", fileUrl: "" });
                        setResultFormData({ type: "", date: "", description: "", fileUrl: "" });
                      }}
                    >
                      Annuler
                    </Button>
                    {editingResultId ? (
                      <Button
                        onClick={() => handleEditResultSubmit(editingResultId)}
                        className="bg-blue-600 text-white"
                      >
                        Enregistrer
                      </Button>
                    ) : (
                      <Button
                        onClick={handleResultSubmit}
                        className="bg-blue-600 text-white"
                      >
                        Ajouter
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}