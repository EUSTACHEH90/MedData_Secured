
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";

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
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";



interface IntegrityCheckButtonProps {
  resultId: string;
  token: string;
}

function IntegrityCheckButton({ resultId, token }: IntegrityCheckButtonProps) {
  const [status, setStatus] = useState<null | string>(null);
  const [loading, setLoading] = useState(false);

  const verifyIntegrity = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/blockchain/result/${resultId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setStatus(data.verified);
      } else {
        setStatus(`Erreur : ${data.error}`);
      }
    } catch (error) {
      setStatus("❌ Erreur réseau.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-2">
      <button
        onClick={verifyIntegrity}
        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-200"
        disabled={loading}
      >
        {loading ? "Vérification..." : "🔒 Vérifier intégrité"}
      </button>
      {status && (
        <p className={`mt-1 text-sm ${status.includes('✅') ? 'text-green-600' : status.includes('❌') ? 'text-red-600' : 'text-yellow-600'}`}>
          {status}
        </p>
      )}
    </div>
  );
}

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
  patientId: string;
  medecinId: string;
  date: string;               // ISO
  location: string | null;
  status: "En attente patient" | "En attente médecin" | "Confirmé" | "Refusé";
  isTeleconsultation: boolean;
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

// --- Grants (autorisations actives) ---
type Grant = {
  id: string;
  medecinId: string;
  scope: "ANTECEDENTS" | "RESULTS" | "ORDONNANCES" | "TESTS" | "ALL";
  expiresAt: string;          // ISO
  revoked: boolean;
  accessRequestId: string | null;
  medecin?: { firstName: string | null; lastName: string | null; email?: string | null } | null;
};





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
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null);
  const [scope, setScope] = useState<"RESULTS" | "PRESCRIPTIONS" | "TESTS" | "ALL">("RESULTS");
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [selectedIds, setSelectedIds] = useState<string[]>([]); // optionnel si tu veux une liste de documents ciblés
  // Onglets internes de "Mes dossiers médicaux"
  type DossierTab = 'antecedents' | 'ordonnances' | 'procedures' | 'tests' | 'resultats';
  const [activeDossierTab, setActiveDossierTab] = useState<DossierTab | null>(null);
  const [activeSubSection, setActiveSubSection] = useState<Subsection  | null>('dossiersMedicaux');
  const [isDropdownOpen, setIsDropdownOpen] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null); // État pour l'ID du patient sélectionné
  const [patientAccessApproved, setPatientAccessApproved] = useState(false);
  const [appointmentFormData, setAppointmentFormData] = useState({
    date: "",
    location: "",
    isTeleconsultation: false,
    medecinId: "",
    month: new Date().getMonth(),
  });
  type RdvPeriod = "today" | "month";
  const [rdvPeriod, setRdvPeriod] = useState<RdvPeriod>("today");

  const [activeGrants, setActiveGrants] = useState<Grant[]>([]);
  const [revokingGrantId, setRevokingGrantId] = useState<string | null>(null);
  
  // Aujourd'hui (00:00 → 24:00)
const _today = new Date();
_today.setHours(0, 0, 0, 0);
const _tomorrow = new Date(_today);
_tomorrow.setDate(_today.getDate() + 1);

const todayAppointments = (appointments || []).filter(a => {
  const d = new Date(a.date);
  return d >= _today && d < _tomorrow;
});

// Mois sélectionné (année en cours)
const monthAppointments = (appointments || []).filter(a => {
  const d = new Date(a.date);
  return (
    d.getMonth() === appointmentFormData.month &&
    d.getFullYear() === new Date().getFullYear()
  );
});

// Liste à afficher en fonction de l’onglet
const rdvsToShow = rdvPeriod === "today" ? todayAppointments : monthAppointments;



  // state pour le partage initié par le patient
const [showShareModal, setShowShareModal] = useState(false);
const [shareDoctorId, setShareDoctorId] = useState<string>("");
const [shareScope, setShareScope] = useState<"RESULTS"|"PRESCRIPTIONS"|"TESTS"|"ANTECEDENTS"|"ALL">("ALL");
const [shareDuration, setShareDuration] = useState<number>(60);
const [shareSelectedIds, setShareSelectedIds] = useState<string[]>([]);
const [shareMotif, setShareMotif] = useState<string>("");


// utilitaire pour cocher/décocher un doc
const toggleShareSelect = (id: string) => {
  setShareSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
};

// 1) État token (au tout début du composant, après tes autres useState)
const [token, setToken] = useState<string | null>(null);
const [tokenExp, setTokenExp] = useState<number | null>(null); // exp en secondes (epoch)

// Petit helper pour décoder l’exp
function decodeExp(t: string): number | null {
  try {
    const payload = JSON.parse(atob(t.split(".")[1]));
    return typeof payload.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}

async function loadActiveGrants() {
  const token = getValidTokenOrRedirect();
  if (!token) return;

  const res = await fetch("/api/patient/grants", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    console.error("Erreur /api/patient/grants :", data?.error || res.status);
    return;
  }
  // tri par expiration décroissante
  const ordered: Grant[] = (data.grants || []).sort(
    (a: Grant, b: Grant) => new Date(b.expiresAt).getTime() - new Date(a.expiresAt).getTime()
  );
  setActiveGrants(ordered);
}


async function revokeGrantNow(grantId: string) {
  const token = getValidTokenOrRedirect();
  if (!token) return;

  try {
    setRevokingGrantId(grantId);
    const res = await fetch(`/api/patient/grants/${grantId}/revoke`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      alert(data?.error || `Erreur ${res.status}`);
      return;
    }
    // rafraîchir la liste
    await loadActiveGrants();
    // si tu tiens une map grantsByRequest, pense à y refléter la révocation si nécessaire
  } catch (e: any) {
    alert(e?.message || "Erreur lors de la révocation.");
  } finally {
    setRevokingGrantId(null);
  }
}



// 2) Initialisation : lit ton token actuel (tu as déjà getValidTokenOrRedirect)
useEffect(() => {
  const t = getValidTokenOrRedirect();
  if (!t) return;
  setToken(t);
  setTokenExp(decodeExp(t));
}, []);

// 3) Auto-refresh ~1 min avant expiration
useEffect(() => {
  if (!token || !tokenExp) return;

  const nowSec = Math.floor(Date.now() / 1000);
  const msUntilRefresh = Math.max(0, (tokenExp - nowSec) * 1000 - 60_000); // -1min

  let timer = window.setTimeout(async () => {
    try {
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.token) {
        // mets à jour cookie + state
        document.cookie = `token=${data.token}; path=/; max-age=7200; samesite=strict${location.protocol === "https:" ? "; secure" : ""}`;
        setToken(data.token);
        setTokenExp(decodeExp(data.token));
      } else if (res.status === 401) {
        // session expirée → retour login
        location.href = "/auth/login?role=patient&expired=1";
      }
    } catch {
      // en cas d’erreur, on retentera au prochain focus/navigation
    }
  }, msUntilRefresh);

  // Refresh aussi si l’onglet redevient visible et qu’il reste <2 min
  const onVis = () => {
    if (!tokenExp) return;
    const now = Math.floor(Date.now() / 1000);
    if (tokenExp - now < 120) {
      fetch("/api/auth/refresh", { method: "POST", headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(data => {
          if (data?.token) {
            document.cookie = `token=${data.token}; path=/; max-age=7200; samesite=strict${location.protocol === "https:" ? "; secure" : ""}`;
            setToken(data.token);
            setTokenExp(decodeExp(data.token));
          }
        })
        .catch(() => {});
    }
  };
  document.addEventListener("visibilitychange", onVis);

  return () => {
    window.clearTimeout(timer);
    document.removeEventListener("visibilitychange", onVis);
  };
}, [token, tokenExp]);



  // mappe la demande d'accès (relatedId) -> grant renvoyé par PATCH /api/patient/access/[relatedId]
  const [grantsByRequest, setGrantsByRequest] = useState<Record<string, {
    id: string;
    scope: "RESULTS" | "PRESCRIPTIONS" | "TESTS" | "ALL";
    expiresAt?: string;
    revoked?: boolean;
  }>>({});

  // Adapte les noms de tableaux si besoin :
// - results           → tes résultats (analyses, imageries…)
// - prescriptions     → tes ordonnances (si le state s’appelle autrement, remplace)
// - tests             → tes tests diagnostics (si distincts des "results")
// - antecedents       → tes antécédents (dossiers médicaux/historiques)
type DocKind = "RESULTS" | "PRESCRIPTIONS" | "TESTS" | "ANTECEDENTS";
type DocRow = { id: string; kind: DocKind; title: string; date?: string; raw?: any };

const formatDate = (d?: string) => (d ? new Date(d).toLocaleDateString("fr-FR") : "—");

// sécurise des tableaux potentiels (même s’ils n’existent pas)
const prescriptions: any[] = (patient as any)?.prescriptions ?? [];
const tests: any[] = (patient as any)?.tests ?? (patient as any)?.diagnosticTests ?? [];

// “Antécédents” = champs texte : on les virtualise pour l’affichage (pas d’ID serveur)
const antecedentsItems: DocRow[] = (() => {
  const arr: DocRow[] = [];
  if (patient?.medicalHistory) {
    arr.push({
      id: "ANTECEDENT__medicalHistory", // id virtuel (ne sera pas envoyé)
      kind: "ANTECEDENTS",
      title: `Antécédents — ${patient.medicalHistory.slice(0, 40)}${patient.medicalHistory.length > 40 ? "…" : ""}`,
    });
  }
  if (patient?.allergies) {
    arr.push({
      id: "ANTECEDENT__allergies", // id virtuel (ne sera pas envoyé)
      kind: "ANTECEDENTS",
      title: `Allergies — ${patient.allergies.slice(0, 40)}${patient.allergies.length > 40 ? "…" : ""}`,
    });
  }
  return arr;
})();

// construit la liste visible selon le périmètre
const visibleDocs: DocRow[] = (() => {
  const rows: DocRow[] = [];
  const includeAll = shareScope === "ALL";

  if (includeAll || shareScope === "RESULTS") {
    (results || []).forEach((r: any) => rows.push({
      id: r.id, kind: "RESULTS", title: `${r.type || "Résultat"} — ${formatDate(r.date)}`, date: r.date, raw: r
    }));
  }
  if (includeAll || shareScope === "PRESCRIPTIONS") {
    prescriptions.forEach((p: any) => rows.push({
      id: p.id, kind: "PRESCRIPTIONS", title: `${p.title || "Ordonnance"} — ${formatDate(p.date)}`, date: p.date, raw: p
    }));
  }
  if (includeAll || shareScope === "TESTS") {
    tests.forEach((t: any) => rows.push({
      id: t.id, kind: "TESTS", title: `${t.type || "Test"} — ${formatDate(t.date)}`, date: t.date, raw: t
    }));
  }
  if (includeAll || shareScope === "ANTECEDENTS") {
    antecedentsItems.forEach(a => rows.push(a));
  }

  return rows;
})();

// messages vides par catégorie
const emptyByScope: Record<"ALL"|"RESULTS"|"PRESCRIPTIONS"|"TESTS"|"ANTECEDENTS", string> = {
  ALL: "Aucun document disponible pour l'instant.",
  RESULTS: "Aucun résultat disponible pour l'instant.",
  PRESCRIPTIONS: "Aucune ordonnance disponible pour l'instant.",
  TESTS: "Aucun test disponible pour l'instant.",
  ANTECEDENTS: "Aucun antécédent disponible pour l'instant.",
};

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
  
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [rescheduleAppointmentId, setRescheduleAppointmentId] = useState<string | null>(null);
  const [apptActionBusy, setApptActionBusy] = useState<string | null>(null);
  
  
  
  const [rescheduleFormData, setRescheduleFormData] = useState({
  date: "",
  location: "",
  isTeleconsultation: false,
});

// remise en forme date pour <input type="datetime-local">
const toLocalInputValue = (iso: string) => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  return `${y}-${m}-${day}T${hh}:${mm}`;
};

// recharge les RDV
const loadAppointments = async () => {
  try {
    const token = getValidTokenOrRedirect();
    if (!token) return;
    const res = await fetch("/api/patient/appointments", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(await res.text().catch(() => "HTTP " + res.status));
    const data = await res.json();
    setAppointments(Array.isArray(data) ? data : []);
  } catch (e) {
    console.error("loadAppointments:", e);
  }
};

// actions patient: accepter / refuser / reprogrammer
// Remplacer toute la fonction updateRdvStatus par ceci :
const updateRdvStatus = async (
  id: string,
  action: "accept" | "decline" | "postpone",
  newDate?: string,
  newLocation?: string | null,
  newTele?: boolean
) => {
  try {
    const token = getValidTokenOrRedirect();
    if (!token) return;

    setApptActionBusy(id);

    const body: any =
      action === "postpone"
        ? {
            date: newDate,
            location: newLocation ?? null,
            isTeleconsultation: typeof newTele === "boolean" ? newTele : undefined,
            status: "En attente médecin", // Patient propose, médecin doit confirmer
          }
        : {
            status: action === "accept" ? "Confirmé" : "Refusé",
          };

    const res = await fetch(`/api/patient/appointments/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const t = await res.text().catch(() => "");
      alert(t || "Impossible de mettre à jour le rendez-vous.");
      return;
    }

    // Mise à jour locale immédiate du state pour un rendu instantané
    setAppointments((prev) =>
      prev.map((rdv) =>
        rdv.id === id
          ? {
              ...rdv,
              ...body,
              date: newDate ?? rdv.date,
              location: newLocation ?? rdv.location,
              isTeleconsultation:
                typeof newTele === "boolean" ? newTele : rdv.isTeleconsultation,
            }
          : rdv
      )
    );

    // Optionnel : Rafraîchir depuis l’API si nécessaire
    // await loadAppointments();

    if (action === "accept") alert("Rendez-vous confirmé ✅");
    if (action === "decline") alert("Rendez-vous refusé ❌");
    if (action === "postpone") alert("Proposition de nouvelle date envoyée 📅");
  } catch (e: any) {
    console.error("updateRdvStatus:", e);
    alert(e?.message || "Erreur réseau");
  } finally {
    setApptActionBusy(null);
  }
};

// ouverture du modal “Reprogrammer”
// Remplacer toute la fonction openRescheduleModal par ceci :
const openRescheduleModal = (a: Appointment) => {
  setRescheduleAppointmentId(a.id);
  setRescheduleFormData({
    date: toLocalInputValue(a.date),
    location: a.location || "",
    isTeleconsultation: !!a.isTeleconsultation,
  });
  setRescheduleModalOpen(true);  // Corrigé : Utiliser setRescheduleModalOpen au lieu de setShowRescheduleModal
};



// soumission du modal “Reprogrammer”
const submitReschedule = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!rescheduleAppointmentId) return;
  const iso = new Date(rescheduleFormData.date).toISOString(); // convertit la valeur de l'input en ISO
  await updateRdvStatus(
    rescheduleAppointmentId,
    "postpone",
    iso,
    rescheduleFormData.location || null,
    rescheduleFormData.isTeleconsultation
  );
  setRescheduleModalOpen(false);
  setRescheduleAppointmentId(null);
};


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
  const file = event.target.files?.[0] ?? null;
  setSelectedFile(file);
  if (!file) return;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("category", uploadCategory || "resultats"); // Utilisez la catégorie sélectionnée

  try {
    const token = getValidTokenOrRedirect();
    if (!token) return;

    const res = await fetch("/api/upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!res.ok) {
      if (res.status === 401) {
        alert("Session expirée. Veuillez vous reconnecter.");
        window.location.href = "/auth/login?role=patient&expired=true";
        return;
      }
      throw new Error(await res.text());
    }
    
    const data = await res.json();
    console.log("Fichier uploadé :", data);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Une erreur inconnue s'est produite.";
    console.error("Erreur lors de l'upload :", errorMessage);
  }
  };

  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadCategory, setUploadCategory] = useState<"resultats" | "ordonnances" | null>(null);
  const isExpired = (iso?: string) => !iso ? false : new Date(iso).getTime() <= Date.now();


  // --- [APPROVAL] état complémentaire ---
const [currentNoteId, setCurrentNoteId] = useState<string | null>(null);

// --- [APPROVAL] helpers ---
const openApproveModal = (note: Notification) => {
  if (!note.relatedId) {
    alert("Demande d'accès invalide (relatedId manquant).");
    return;
  }
  setShowApproveModal(true);
  setCurrentRequestId(note.relatedId);   // déjà dans ton state
  setCurrentNoteId(note.id);
  setScope("RESULTS");                   // défaut
  setDurationMinutes(60);
  setSelectedIds([]);                    // vide par défaut
};

const toggleSelectedId = (id: string, checked: boolean | string) => {
  const c = !!checked;
  setSelectedIds((prev) => (c ? [...prev, id] : prev.filter((x) => x !== id)));
};

const resetApprovalForm = () => {
  setShowApproveModal(false);
  setCurrentRequestId(null);
  setCurrentNoteId(null);
  setScope("RESULTS");
  setDurationMinutes(60);
  setSelectedIds([]);
};

const submitApproval = async () => {
  try {
    const token = getValidTokenOrRedirect();
    if (!token || !currentRequestId) return;

    const res = await fetch(`/api/patient/access/${currentRequestId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        approve: true,
        scope,                 // "RESULTS" | "PRESCRIPTIONS" | "TESTS" | "ALL"
        durationMinutes,       // ex. 60
        resourceIds: selectedIds, // [] si tout le scope
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Échec de l'approbation.");

    // mémorise le grant pour cette demande (relatedId)
    if (currentRequestId && data?.grant?.id) {
      setGrantsByRequest(prev => ({
        ...prev,
        [currentRequestId]: {
          id: data.grant.id,
          scope: data.grant.scope,
          expiresAt: data.grant.expiresAt, // string ISO renvoyée par l’API
          revoked: false,
          accessRequestId: data.grant.accessRequestId,
        },
      }));
    }


    // Marque la notification comme lue côté UI
    if (currentNoteId) {
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === currentNoteId ? { ...n, read: true, message: `${n.message} (Accepté)` } : n
        )
      );
    }

    // Rafraîchir l'UI avec ta fonction fetchData utilitaire
    await fetchData(
      setPatient,
      setConsultations,
      setAppointments,
      setResults,
      setDoctors,
      setNotifications,
      setLoading,
      setError,
      router,
      getValidTokenOrRedirect
    );

    resetApprovalForm();
    alert("Accès approuvé avec succès.");
  } catch (e: any) {
    alert(e?.message || "Erreur lors de l'approbation.");
  }
};

const declineFromNote = async (note: Notification) => {
  try {
    const token = getValidTokenOrRedirect();
    if (!token || !note.relatedId) return;

    const res = await fetch(`/api/patient/access/${note.relatedId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ approve: false }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Échec du refus.");

    setNotifications((prev) =>
      prev.map((n) =>
        n.id === note.id ? { ...n, read: true, message: `${n.message} (Refusé)` } : n
      )
    );

    alert("Accès refusé.");
  } catch (e: any) {
    alert(e?.message || "Erreur lors du refus.");
  }
};


const revokeGrant = async (relatedId: string) => {
  try {
    const token = getValidTokenOrRedirect();
    if (!token) return;

    const g = grantsByRequest[relatedId];
    if (!g?.id) {
      alert("Impossible de trouver l'autorisation associée (grant).");
      return;
    }

    const res = await fetch(`/api/patient/grants/${g.id}/revoke`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      alert(data?.error || `Erreur ${res.status}`);
      return;
    }

    // Marque localement comme révoqué
    setGrantsByRequest(prev => ({ ...prev, [relatedId]: { ...g, revoked: true } }));

    // Optionnel: mets à jour la notification liée
    setNotifications(prev =>
      prev.map(n =>
        n.relatedId === relatedId
          ? { ...n, read: true, message: `${n.message || "Demande"} (Révoqué)` }
          : n
      )
    );

    alert("Révocation de la demande d'accès réussie.");
    const msg =
      (typeof data?.message === "string" && data.message.trim())
        ? data.message
        : "Révocation de la demande d'accès reussi";

    // Mets à jour la notification liée avec ce libellé exact
    setNotifications(prev =>
      prev.map(n =>
        n.relatedId === relatedId
          ? { ...n, read: true, message: msg }
          : n
      )
    );

    // Affiche le même texte côté UI
    alert(msg);
  } catch (e: any) {
    alert(e?.message || "Erreur lors de la révocation.");
  }
};



  const fetchData = async (
  setPatient: React.Dispatch<React.SetStateAction<Patient | null>>,
  setConsultations: React.Dispatch<React.SetStateAction<Consultation[]>>,
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>,
  setResults: React.Dispatch<React.SetStateAction<Result[]>>,
  setDoctors: React.Dispatch<React.SetStateAction<Doctor[]>>,
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>,
  setError: React.Dispatch<React.SetStateAction<string | null>>,
  router: ReturnType<typeof useRouter>,
  getValidTokenOrRedirect: () => string | null
) => {
  try {
    const token = getValidTokenOrRedirect();
    if (!token) return;

    console.log("Début de fetchData avec token:", token);
    const [patientRes, consultRes, apptRes, resultRes, doctorRes, notifRes, grantsRes] = await Promise.all([
      fetch("/api/patient/me", { headers: { Authorization: `Bearer ${token}` } }),
      fetch("/api/patient/consultations", { headers: { Authorization: `Bearer ${token}` } }),
      fetch("/api/patient/appointments", { headers: { Authorization: `Bearer ${token}` } }),
      fetch("/api/patient/results", { headers: { Authorization: `Bearer ${token}` } }),
      fetch("/api/medecin/available", { headers: { Authorization: `Bearer ${token}` } }),
      fetch("/api/patient/notifications", { headers: { Authorization: `Bearer ${token}` } }),
      fetch("/api/patient/grants", { headers: { Authorization: `Bearer ${token}` } }),
    ]);

    const responses = [patientRes, consultRes, apptRes, resultRes, doctorRes, notifRes, grantsRes];
    for (const res of responses) {
      if (res.status === 401) {
        alert("Session expirée. Veuillez vous reconnecter.");
        window.location.href = "/auth/login?role=patient&expired=true";
        return;
      }
    }

    if (!patientRes.ok) throw new Error("Échec de la récupération du profil.");
    const patientData = await patientRes.json();
    console.log("Données patient:", patientData);
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
    
    if (!grantsRes.ok) throw new Error("Échec de la récupération des autorisations d'accès.");
    const grantsData = await grantsRes.json(); // { grants: [...] }

    const map: Record<string, {
      id: string;
      scope: "RESULTS" | "PRESCRIPTIONS" | "TESTS" | "ALL";
      expiresAt?: string;
      revoked?: boolean;
    }> = {};

for (const g of (grantsData.grants || [])) {
  if (g.accessRequestId) {
    map[g.accessRequestId] = {
      id: g.id,
      scope: g.scope,
      expiresAt: g.expiresAt,
      revoked: !!g.revoked,
    };
  }
}
setGrantsByRequest(map);

    
  } catch (err: any) {
    console.error("Erreur dans fetchData:", err.message);
    setError(err.message || "Erreur lors de la récupération des données.");
    router.replace("/auth/login?role=patient");
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  loadActiveGrants();

  
}, []);


useEffect(() => {
  const fetchData = async () => {
    try {
      const token = getValidTokenOrRedirect();
      if (!token) return;

      console.log("Début de fetchData avec token:", token);

      const [patientRes, consultRes, apptRes, resultRes, doctorRes, notifRes, grantsRes] = await Promise.all([
        fetch("/api/patient/me", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/patient/consultations", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/patient/appointments", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/patient/results", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/medecin/available", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/patient/notifications", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/patient/grants", { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      
      const responses = [patientRes, consultRes, apptRes, resultRes, doctorRes, notifRes, grantsRes];
      for (const res of responses) {
        if (res.status === 401) {
          alert("Session expirée. Veuillez vous reconnecter.");
          window.location.href = "/auth/login?role=patient&expired=true";
          return;
        }
      }

      if (!patientRes.ok) throw new Error("Échec de la récupération du profil.");
      const patientData = await patientRes.json();
      console.log("Données patient:", patientData);
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

      if (!grantsRes.ok) throw new Error("Échec de la récupération des autorisations d'accès.");
const grantsData = await grantsRes.json(); // { grants: [...] }

const map: Record<string, { id: string; scope: "RESULTS"|"PRESCRIPTIONS"|"TESTS"|"ALL"; expiresAt?: string; revoked?: boolean }> = {};
for (const g of (grantsData.grants || [])) {
  if (g.accessRequestId) {
    map[g.accessRequestId] = {
      id: g.id,
      scope: g.scope,
      expiresAt: g.expiresAt,
      revoked: !!g.revoked,
    };
  }
}
setGrantsByRequest(map);


      

      // Add this: Mark all notifications as read after fetch (if desired).
      // This calls PUT /api/patient/notifications to update backend, then updates UI.
      // await markPatientNotifsRead();
    } catch (err: any) {
      console.error("Erreur dans fetchData:", err.message);
      setError(err.message || "Erreur lors de la récupération des données.");
      router.replace("/auth/login?role=patient");
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, [router]);
  const getValidTokenOrRedirect = (): string | null => {
  const token = document.cookie
    .split("; ")
    .find((row) => row.startsWith("token="))
    ?.split("=")[1];

  if (!token) {
    console.log("Aucun token trouvé, redirection vers login.");
    alert("Session expirée. Veuillez vous reconnecter.");
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
    document.cookie = "role=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
    window.location.href = "/auth/login?role=patient&expired=true";
    return null;
  }

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    console.log("Payload du token:", payload);
    const currentTime = Date.now() / 1000;

    if (payload.role !== "Patient") {
      console.log("Rôle incorrect:", payload.role);
      alert("Accès non autorisé. Veuillez vous connecter en tant que patient.");
      document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
      document.cookie = "role=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
      window.location.href = "/auth/login?role=patient";
      return null;
    }

    if (payload.exp && payload.exp < currentTime) {
      console.log("Token expiré, redirection vers login.");
      alert("Votre session a expiré. Veuillez vous reconnecter.");
      document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
      document.cookie = "role=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
      window.location.href = "/auth/login?role=patient&expired=true";
      return null;
    }

    return token;
  } catch (error) {
    console.error("Erreur lors de la validation du token:", error);
    alert("Token invalide. Veuillez vous reconnecter.");
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
    document.cookie = "role=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
    window.location.href = "/auth/login?role=patient";
    return null;
  }
};
  

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!patient) return;
    const { name, value } = e.target;
    setPatient({ ...patient, [name]: value } as Patient);
  };

  

  // patient dashboard
// patient dashboard
const openPatientResult = async (id: string) => {
  try {
    const token = getValidTokenOrRedirect(); // ✅ utilise le helper
    if (!token) return;

    const res = await fetch(`/api/patient/files/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      // si le backend renvoie un JSON d'erreur, on le lit proprement
      let msg = "";
      try {
        const j = await res.json();
        msg = j?.error || "";
      } catch {}
      throw new Error(msg || `HTTP ${res.status}`);
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch (err: any) {
    alert(err?.message || "Impossible d’ouvrir le document.");
  }
};

const markPatientNotifsRead = async () => {
  const token = getValidTokenOrRedirect();
  if (!token) return;
  await fetch("/api/patient/notifications", { method: "PUT", headers: { Authorization: `Bearer ${token}` } });
  // maj UI
  setNotifications((prev) => prev.map(n => ({ ...n, read: true })));
};

// exemple: dans ton onClick de la cloche/onglet "Notifications"
const onOpenPatientNotifications = async () => {
  try {
    // await markPatientNotifsRead();
    // ...ouvrir le panneau...
  } catch (e) {
    console.error("Erreur lors du marquage des notifications :", e);
  }
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
    
    try {
      const token = getValidTokenOrRedirect();
      if (!token) return;

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

      if (!res.ok) {
        if (res.status === 401) {
          alert("Session expirée. Veuillez vous reconnecter.");
          window.location.href = "/auth/login?role=patient&expired=true";
          return;
        }
        throw new Error("Erreur lors de la mise à jour du profil.");
      }
      
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
    const token = getValidTokenOrRedirect();
    if (!token) return;

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

    if (!res.ok) {
      if (res.status === 401) {
        alert("Session expirée. Veuillez vous reconnecter.");
        window.location.href = "/auth/login?role=patient&expired=true";
        return;
      }
      throw new Error("Erreur lors de l'ajout de la personne à charge.");
    }

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
    const token = getValidTokenOrRedirect();
    if (!token) return;

    const res = await fetch(`/api/patient/results/${resultId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(editResultFormData),
    });

    if (!res.ok) {
      if (res.status === 401) {
        alert("Session expirée. Veuillez vous reconnecter.");
        window.location.href = "/auth/login?role=patient&expired=true";
        return;
      }
      throw new Error("Erreur lors de la mise à jour du résultat.");
    }

    const updatedResult = await res.json();
    setResults(results.map((r) => (r.id === resultId ? updatedResult : r)));
    setEditingResultId(null);
    setEditResultFormData({ type: "", date: "", description: "", fileUrl: "" });
    alert("Résultat mis à jour avec succès !");
  } catch (err: any) {
    setError(err.message);
  }
};

const updatePatientRdv = async (id: string, action: "accept"|"decline") => {
  const token = getValidTokenOrRedirect(); if (!token) return;
  const res = await fetch(`/api/patient/appointments/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ status: action === "accept" ? "Confirmé" : "Refusé" }),
  });
  if (!res.ok) return alert(await res.text().catch(()=> "Erreur mise à jour"));
  const updated = await res.json();
  setAppointments(prev => prev.map(x => x.id === updated.id ? updated : x));
};

 const handleShareResult = async (resultId: string, sharedWithId: string) => {
  try {
    const token = getValidTokenOrRedirect();
    if (!token) return;

    const res = await fetch(`/api/patient/results/${resultId}/share`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ sharedWithId }),
    });

    if (!res.ok) {
      if (res.status === 401) {
        alert("Session expirée. Veuillez vous reconnecter.");
        window.location.href = "/auth/login?role=patient&expired=true";
        return;
      }
      throw new Error("Erreur lors du partage du résultat.");
    }

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
      const token = getValidTokenOrRedirect();
      if (!token) return;

      const payload = {
  date: new Date(appointmentFormData.date),
  location: appointmentFormData.location,
  isTeleconsultation: appointmentFormData.isTeleconsultation,
};

console.log("Payload rendez-vous:", payload);

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
          medecinId: appointmentFormData.medecinId,
        }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          alert("Session expirée. Veuillez vous reconnecter.");
          window.location.href = "/auth/login?role=patient&expired=true";
          return;
        }
        throw new Error("Erreur lors de la création du rendez-vous.");
      }
      
      const newAppointment = await res.json();
      setAppointments([newAppointment, ...appointments]);
      setIsAppointmentModalOpen(false);
      setAppointmentFormData({ 
        date: "", 
        location: "", 
        isTeleconsultation: false, 
        medecinId: "", 
        month: new Date().getMonth() 
      });
      alert("Rendez-vous créé avec succès !");
    } catch (err: any) {
      setError(err.message);
    }
  };

//  const handleAppointmentResponse  = async (appointmentId: string, action: "accept" | "reschedule" | "decline") => {
//   try {
//     const token = getValidTokenOrRedirect();
//     if (!token) return;

//     const appointment = appointments.find((a) => a.id === appointmentId);
//     if (!appointment) throw new Error("Rendez-vous non trouvé.");

//     let newStatus: "Confirmé" | "En attente" | "Refusé";
//     switch (action) {
//       case "accept":
//         newStatus = "Confirmé";
//         break;
//       case "reschedule":
//         newStatus = "En attente";
//         break;
//       case "decline":
//         newStatus = "Refusé";
//         break;
//       default:
//         throw new Error("Action non valide.");
//     }
//     if (action === "reschedule") {
//     const appointment = appointments.find((a) => a.id === appointmentId);
//     if (appointment) {
//       setRescheduleFormData({
//         date: appointment.date,
//         // doctorId: appointment.doctorId || "",
//         location: appointment.location || "",
//         isTeleconsultation: appointment.isTeleconsultation || false,
//       });
//       setRescheduleAppointmentId(appointmentId);
//       setRescheduleModalOpen(true);
//     }
//     return; // Ne mettez pas à jour le statut immédiatement
//   }


//     const res = await fetch(`/api/patient/appointments/${appointmentId}`, {
//       method: "PUT",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${token}`,
//       },
//       body: JSON.stringify({ status: newStatus }),
//     });

//     if (!res.ok) {
//       if (res.status === 401) {
//         alert("Session expirée. Veuillez vous reconnecter.");
//         window.location.href = "/auth/login?role=patient&expired=true";
//         return;
//       }
//       const errorText = await res.text();
//       throw new Error(`Erreur lors de la mise à jour du rendez-vous: ${errorText}`);
//     }

//     const updatedAppointment = await res.json();
//     setAppointments(appointments.map((a) => (a.id === appointmentId ? updatedAppointment : a)));
//     setNotifications(notifications.filter((n) => n.relatedId !== appointmentId));

//     alert(`Rendez-vous ${action === "accept" ? "accepté" : action === "reschedule" ? "repoussé" : "refusé"} avec succès !`);
//   } catch (err: any) {
//     console.error("Erreur dans handleAppointmentResponse:", err.message);
//     setError(err.message);
//   }
// };

  const handleConsultationFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setConsultationFormData((prev) => ({ ...prev, [name]: value }));
  };

 const handleConsultationSubmit = async () => {
  try {
    const token = getValidTokenOrRedirect();
    if (!token) return;

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

    if (!res.ok) {
      if (res.status === 401) {
        alert("Session expirée. Veuillez vous reconnecter.");
        window.location.href = "/auth/login?role=patient&expired=true";
        return;
      }
      throw new Error("Erreur lors de la création de la consultation.");
    }

    const newConsultation = await res.json();
    setConsultations([newConsultation, ...consultations]);
    setIsConsultationModalOpen(false);
    setConsultationFormData({ date: "", doctorName: "", summary: "" });

    // Notification
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

const handleAction = async (notificationId: string, action: "accept" | "decline") => {
  try {
    const token = getValidTokenOrRedirect();
    if (!token) return;

    console.log("Démarrage de handleAction - Notification ID:", notificationId, "Action:", action);

    // Marquer la notification comme lue et envoyer l'action au serveur
    const res = await fetch(`/api/patient/notifications/${notificationId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action, read: true }), // Marquer comme lu
    });

    if (!res.ok) {
      if (res.status === 401) {
        alert("Session expirée. Veuillez vous reconnecter.");
        window.location.href = "/auth/login?role=patient&expired=true";
        return;
      }
      const errorText = await res.text();
      throw new Error(`Erreur HTTP ${res.status}: ${errorText}`);
    }

    const updatedNotification = await res.json();

    // Mettre à jour l'état local des notifications
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId
          ? {
              ...n,
              read: true,
              message: updatedNotification.message || n.message,
            }
          : n
      )
    );

    // Si l'action est "accept", approuver l'accès au patient
    if (action === "accept") {
      const acceptedNotif = notifications.find((n) => n.id === notificationId);
      if (acceptedNotif?.relatedId) {
        await handleAccessRequestResponse(notificationId, true);
      }
    } else {
      await handleAccessRequestResponse(notificationId, false);
    }
  } catch (err: any) {
    console.error(`Erreur lors de l'action ${action} :`, err.message);
    setError(`Échec : ${err.message}`);
  }
};


  const approvePatientAccess = (patientId: string) => {
    if (selectedPatientId && selectedPatientId === patientId) {
      setPatientAccessApproved(true); // Mettre à jour l'état à true pour autoriser l'accès
      // Optionnel : envoyer une notification au médecin
      // sendNotification(patientId, `${doctor?.firstName} ${doctor?.lastName} a approuvé l'accès.`);
    }
  };


const handleAccessRequestResponse = async (notificationId: string, accept: boolean) => {
  const token = getValidTokenOrRedirect();
  if (!token) return;

  const res = await fetch(`/api/patient/notifications/${notificationId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ action: accept ? "accept" : "decline" }),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error || `Erreur ${res.status}`);
  }

  // refresh minimal côté client
  setNotifications(prev =>
    prev.map(n =>
      n.id === notificationId
        ? { ...n, read: true, message: `${n.message} (${accept ? "Accepté" : "Refusé"})` }
        : n
    )
  );
};

  
  if (loading) return <div className="p-6 text-center text-gray-500">Chargement...</div>;
  if (error) return <div className="p-6 text-center text-red-500">Erreur : {error}</div>;
  if (!patient) return <div className="p-6 text-center text-red-500">Utilisateur non connecté</div>;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">

      <aside className="fixed inset-y-0 left-0 w-64 overflow-y-auto bg-white shadow-lg p-4 z-40">
        <div className="mb-12 flex flex-row items-center">
          <img src="/assets/images/logo.svg" alt="Meddata Secured" className="h-32 w-auto" />
          <Logo size="text-sm" className="ml-[-14px]" /> {/* Marge négative et bordure pour débogage */}
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
                <button onClick={() => { setActiveSection("dossiers"); setActiveSubSection("accessRequests"); setIsDropdownOpen(null); }} className="w-full text-left p-2 hover:bg-gray-100">
                  Voir les demandes d'accès
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

      <div className="flex-1 ml-64 h-screen overflow-hidden flex flex-col">
        <header className="sticky top-2 z-30">
        <div className="flex justify-between items-center mb-4 p-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl shadow-lg">
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
                <span className="absolute top-0 right-0 inline-flex w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full  items-center justify-center">
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
        </div>
        </header>
        <main className="flex-1 overflow-y-auto px-6 pb-6">

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
                  if (!note.read) {
                    // Marquer comme lu localement et sur le serveur
                    fetch(`/api/patient/notifications/${note.id}`, {
                      method: "PATCH",
                      headers: {
                        Authorization: `Bearer ${getValidTokenOrRedirect()}`,
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({ read: true }),
                    }).then(() => {
                      setNotifications((prev) =>
                        prev.map((n) => (n.id === note.id ? { ...n, read: true } : n))
                      );
                    });
                  }
                }}
                className={`cursor-pointer p-3 rounded-lg transition ${
                  note.read ? "bg-gray-100" : "bg-blue-100"
                } hover:bg-blue-200`}
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-lg">🔔</span>
                    <div className="flex-1">
                      {note.type === "accessRequest" && (
                        <span className="font-medium text-gray-800">
                          Demande d'accès : {note.message}
                        </span>
                      )}
                      {note.type === "appointment" && <span>Nouveau rendez-vous : {note.message}</span>}
                      {note.type === "consultation" && <span>Nouvelle consultation : {note.message}</span>}
                      {note.type === "result" && <span>Nouveau résultat : {note.message}</span>}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 pl-7">
                    {new Date(note.date).toLocaleString()}
                  </div>
                  {note.type === "accessRequest" && !note.read && note.relatedId && (
                    <div className="flex justify-end gap-2 mt-2 pl-7">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openApproveModal(note);
                        }}
                        className="bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-1 rounded"
                      >
                        Accepter
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          declineFromNote(note);
                        }}
                        className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1 rounded"
                      >
                        Refuser
                      </button>
                      {/* Bouton Révoquer si un grant ACTIF existe (lié à cette demande) */}
                      {!!grantsByRequest[note.relatedId] &&
                      !grantsByRequest[note.relatedId].revoked &&
                      !isExpired(grantsByRequest[note.relatedId].expiresAt) && (
                        <button
                          onClick={(e) => { e.stopPropagation(); revokeGrant(note.relatedId!); }}
                          className="bg-orange-500 hover:bg-orange-600 text-white text-xs px-3 py-1 rounded"
                        >
                          Révoquer l’accès
                        </button>
                      )}
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
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Mes rendez-vous</h1>
            <Card className="bg-white p-6 rounded-xl shadow-lg">
              <CardContent>
                {/* --------- Bloc 1 : Rendez-vous à confirmer --------- */}
                <div className="mb-8">
                  <h2 className="text-xl font-semibold mb-4 text-red-600">À confirmer</h2>
                  {appointments.filter((a) => a.status === "En attente patient").length > 0 ? (
                    appointments
                      .filter((a) => a.status === "En attente patient")
                      .map((a) => (
                        <Card key={a.id} className="mb-4 rounded-xl border border-gray-200">
                          <CardContent className="p-4">
                            <p className="text-gray-700">
                              {new Date(a.date).toLocaleString()} - {a.location} (
                              {a.isTeleconsultation ? "Téléconsultation" : "Présentiel"}) - Statut: {a.status}
                              {a.createdBy && a.createdBy !== patient?.id && (
                                <span> (Créé par Dr. {a.doctorName})</span>
                              )}
                            </p>
                            {/* --- Boutons action --- */}
                            <div className="flex gap-2 mt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateRdvStatus(a.id, "accept")}
                                className="rounded"
                                disabled={apptActionBusy === a.id}
                              >
                                Accepter
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => updateRdvStatus(a.id, "decline")}
                                className="rounded"
                                disabled={apptActionBusy === a.id}
                              >
                                Refuser
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openRescheduleModal(a)}
                                className="rounded"
                                disabled={apptActionBusy === a.id}
                              >
                                Reprogrammer
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                  ) : (
                    <p className="text-gray-600">Aucun rendez-vous en attente de confirmation.</p>
                  )}
                </div>
                
                {/* --------- Bloc 2 : Filtrage par période --------- */}
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <select
                      value={rdvPeriod}
                      onChange={(e) => setRdvPeriod(e.target.value as 'today'|'month')}
                    >
                      <option value="today">Aujourd’hui</option>
                      <option value="month">Ce mois</option>
                    </select>
                
                  </div>
                  <Button
                    onClick={() => setIsAppointmentModalOpen(true)}
                    className="bg-blue-600 text-white rounded-xl"
                  >
                    + Créer un rendez-vous
                  </Button>
                </div>
                
                {/* Aujourd’hui */}
                {/* Onglets RDV */}
                <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setRdvPeriod("today")}
            className={`px-3 py-1.5 rounded-full text-sm transition ${
              rdvPeriod === "today"
                ? "bg-blue-600 text-white shadow"
                : "bg-white text-gray-700 border"
            }`}
          >
            Aujourd'hui
          </button>
          
          <button
            onClick={() => setRdvPeriod("month")}
            className={`px-3 py-1.5 rounded-full text-sm transition ${
              rdvPeriod === "month"
                ? "bg-blue-600 text-white shadow"
                : "bg-white text-gray-700 border"
            }`}
          >
            Ce mois
          </button>
                </div>
          
                {/* Si l'onglet "mois" est actif, on affiche le sélecteur de mois */}
                {rdvPeriod === "month" && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Choisir un mois</label>
                    <Select
                      value={appointmentFormData.month.toString()}
                      onValueChange={(value) =>
                        setAppointmentFormData((prev) => ({ ...prev, month: parseInt(value) }))
                      }
                    >
                      <SelectTrigger className="w-full mt-1">
                        <SelectValue placeholder="Sélectionner un mois" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => (
                          <SelectItem key={i} value={i.toString()}>
                            {new Date(new Date().getFullYear(), i, 1).toLocaleString("fr-FR", { month: "long" })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Liste des RDV (aujourd'hui ou mois) */}
                <div className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl">
                  {rdvsToShow.length > 0 ? (
                    rdvsToShow.map((a) => (
                      <Card key={a.id} className="mb-4 rounded-xl border border-gray-200">
                        <CardContent className="p-4">
                          <p className="text-gray-700">
                            {new Date(a.date).toLocaleString("fr-FR")} — {a.location ?? "Lieu non précisé"} (
                            {a.isTeleconsultation ? "Téléconsultation" : "Présentiel"}) — Statut : {a.status}
                          </p>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <p className="text-gray-600 text-center">
                      {rdvPeriod === "today"
                        ? "Aucun rendez-vous aujourd'hui."
                        : "Aucun rendez-vous prévu ce mois-ci."}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
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
                      <Select value={uploadCategory || ""} onValueChange={(value) => setUploadCategory(value as "resultats" | "ordonnances")}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Choisir catégorie" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="resultats">Résultats médicaux</SelectItem>
                            <SelectItem value="ordonnances">Ordonnances</SelectItem>
                        </SelectContent>
                      </Select>
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
                      // ✅ nouveau
                      onChange={handleFileUpload}

                    />
                  </CardHeader>
                  <CardContent className="p-6 bg-white rounded-b-xl">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                      <button
                        onClick={() => setActiveDossierTab('antecedents')}
                        className="flex-1 p-4 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-lg shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-1"
                      >
                        Antécédents médicaux
                      </button>
                      <button
                        onClick={() => setActiveDossierTab('ordonnances')}
                        className="flex-1 p-4 bg-green-50 hover:bg-green-100 text-green-700 font-semibold rounded-lg shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-1"
                      >
                        Ordonnances
                      </button>
                      <button
                        onClick={() => setActiveDossierTab('procedures')}
                        className="flex-1 p-4 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 font-semibold rounded-lg shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-1"
                      >
                        Procédures
                      </button>
                      <button
                        onClick={() => setActiveDossierTab('tests')}
                        className="flex-1 p-4 bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold rounded-lg shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-1"
                      >
                        Tests de diagnostic
                      </button>
                      <button
                        onClick={() => setActiveDossierTab("resultats")}
                        className="flex-1 p-4 bg-red-50 hover:bg-red-100 text-red-700 font-semibold rounded-lg shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-1"
                      >
                        Résultats médicaux
                      </button>
                    </div>
                    {activeDossierTab === "antecedents" && (
                      <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
                        <h2 className="text-xl font-semibold mb-4 text-gray-800">Antécédents médicaux</h2>
                        <div>
                          <p><strong>Antécédents :</strong> {patient.medicalHistory || "Aucun antécédent enregistré."}</p>
                          <p><strong>Allergies :</strong> {patient.allergies || "Aucune allergie enregistrée."}</p>
                        </div>
                      </div>
                    )}
                    {activeDossierTab === "ordonnances" && (
                      <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
                        <h2 className="text-xl font-semibold mb-4 text-gray-800">Ordonnances</h2>
                        <p className="text-gray-700">Aucune ordonnance disponible pour l'instant.</p>
                      </div>
                    )}
                    {activeDossierTab === "procedures" && (
                      <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
                        <h2 className="text-xl font-semibold mb-4 text-gray-800">Procédures</h2>
                        <p className="text-gray-700">Aucune procédure disponible pour l'instant.</p>
                      </div>
                    )}
                    {activeDossierTab === "tests" && (
                      <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
                        <h2 className="text-xl font-semibold mb-4 text-gray-800">Tests de diagnostic</h2>
                        <p className="text-gray-700">Aucun test de diagnostic disponible pour l'instant.</p>
                      </div>
                    )}
                    {activeDossierTab === "resultats" && (
                      <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
                        <h2 className="text-xl font-semibold mb-4 text-gray-800">Résultats médicaux</h2>
                        {results.length > 0 ? (
                          <ul className="space-y-4">
                            {results.map((r) => (
                              <li key={r.id} className="p-3 bg-gray-50 rounded-lg">
                                <p><strong>Type :</strong> {r.type}</p>
                                <p><strong>Date :</strong> {new Date(r.date).toLocaleDateString()}</p>
                                <p><strong>Description :</strong> {r.description}</p>
                                {r.doctorName && (
                                  <p className="text-sm text-gray-600">
                                    <strong>Médecin :</strong> {r.doctorName}
                                  </p>
                                )}


                                {r.fileUrl && (
                                  <Button
                                    size="sm"
                                    className="ml-2 bg-blue-600 text-white hover:bg-blue-700"
                                    onClick={() => window.open(`/api/files/${r.id}`, "_blank")}
                                  >
                                    Ouvrir le PDF
                                  </Button>
                                )}
                                <IntegrityCheckButton
                                  resultId={r.id}
                                  token={getValidTokenOrRedirect() || ""}
                                />
                              </li>
                            ))}
                          </ul>
                          ) : (
                                <p>Aucun résultat disponible.</p>
                          )}
                        </div>
                      )}
                  </CardContent>
                </Card>
              )}
              <section className="mt-8 mb-4">
  <h2 className="text-xl font-semibold mb-3">Autorisations actives</h2>

  {activeGrants.length === 0 ? (
    <div className="text-gray-600 bg-white rounded-xl p-4 border border-gray-200">
      Aucune autorisation active pour l’instant.
    </div>
  ) : (
    <div className="space-y-3">
      {activeGrants.map((g: Grant) => {
        // ✅ On calcule les variables ICI (dans le scope de "g")
        const docName = [g.medecin?.firstName, g.medecin?.lastName]
          .filter(Boolean)
          .join(" ")
          .trim();
        const labelMedecin =
          docName || (g.medecinId ? `Médecin ${g.medecinId.slice(0, 8)}…` : "Médecin");
        const expires = new Date(g.expiresAt).toLocaleString("fr-FR");

        const scopeLabel =
          g.scope === "ALL"
            ? "Tout le dossier"
            : g.scope === "ANTECEDENTS"
            ? "Antécédents médicaux"
            : g.scope === "RESULTS"
            ? "Résultats médicaux"
            : g.scope === "ORDONNANCES"
            ? "Ordonnances"
            : "Tests de diagnostic";

        return (
          <div
            key={g.id}
            className="bg-white rounded-xl p-4 border border-gray-200 flex items-center justify-between"
          >
            <div>
              <div className="font-medium">Dossier Partagé : {scopeLabel}</div>
              <div className="text-sm text-gray-600">
                Médecin : {labelMedecin} • Expire le {expires}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                disabled={revokingGrantId === g.id}
                onClick={() => revokeGrantNow(g.id)} // ⚠️ utilise bien l'id du grant
                className="px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
              >
                {revokingGrantId === g.id ? "Révocation…" : "Révoquer"}
              </button>

              {/* Si tu as le bouton d’intégrité, sinon retire cette ligne
              {typeof IntegrityCheckButton !== "undefined" && (
                <IntegrityCheckButton grantId={g.id} />
              )}
              */}
            </div>
          </div>
        );
      })}
    </div>
  )}
</section>

              {activeSubSection === "dossiersPartages" && (
                <div>
                  <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Dossiers partagés</h2>
                    <Button onClick={() => setShowShareModal(true)} className="sm:ml-auto bg-blue-600 text-white rounded-xl">
                      Partager un dossier
                    </Button>
                  </div>
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
                            {r.fileUrl && (
                              <a
                                href={r.fileUrl}
                                className="text-blue-600 hover:underline"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Voir le fichier
                              </a>
                            )}
                            <IntegrityCheckButton
                              resultId={r.id}
                              token={getValidTokenOrRedirect() || ""}
                            />
                        </li>
                      ))}
                      {Array.isArray(results) && results.filter((r) => r.isShared).length === 0 && (
                        <p className="text-gray-600">Aucun dossier partagé.</p>
                      )}
                  </ul>
                </div>
              )}
              {/* --- Autorisations actives --- */}



              {activeSubSection === "accessRequests" && (
                <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
                  <h2 className="text-xl font-semibold mb-4 text-gray-800">Demandes d'accès</h2>
                  {notifications.filter(n => n.type === "accessRequest").length > 0 ? (
                    <ul className="space-y-4">
                      {notifications.filter(n => n.type === "accessRequest").map(note => {
                        // Trouver le nom du médecin à partir des données disponibles (par exemple via doctors ou une autre source)
                        const doctorName = note.medecinId ? doctors.find(d => d.id === note.medecinId)?.firstName + " " + doctors.find(d => d.id === note.medecinId)?.lastName : "Inconnu";
                        return (
                          <li key={note.id} className="p-4 bg-white rounded-lg shadow-md">
                            {!note.read && (
                              <p>Le Dr. {doctorName} demande l'accès à votre dossier. Veuillez accepter ou refuser.</p>
                            )}
                            <Select onValueChange={(value) => {/* Stockez le choix par note.id si multiple */}} disabled={note.read}>
                              <SelectTrigger><SelectValue placeholder="Choisir type à partager" /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="tout">Tout</SelectItem>
                                  <SelectItem value="resultats">Résultats médicaux</SelectItem>
                                  <SelectItem value="ordonnances">Ordonnances</SelectItem>
                                </SelectContent>
                              </Select>
                              <div className="mt-2 flex space-x-2">
                                {!note.read ? (
                                  <>
                                    <Button onClick={() => openApproveModal(note)}>
                                      Accepter
                                    </Button>
                                    <Button variant="destructive" onClick={() => declineFromNote(note)}>
                                      Refuser
                                    </Button>

                                  </>
                                ) : (
                              <div className="flex flex-col">
                                <p className="text-black-600">
                                  {note.message?.toLowerCase().includes('révocation')
                                    ? note.message
                                    : `Vous avez ${note.message.toLowerCase().includes('accepté') ? 'accepté' : 'refusé'} la demande d'accès à votre dossier au Dr. ${doctorName}.`}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {new Date().toLocaleString('fr-FR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  }).replace(' à ', ' ')}
                                </p>
                                {note.relatedId &&
                                  grantsByRequest[note.relatedId] &&
                                  !grantsByRequest[note.relatedId].revoked && (
                                    <button
                                      onClick={() => revokeGrant(note.relatedId!)}
                                      className="mt-2 w-max bg-red-600 text-white text-xs px-3 py-1 rounded hover:bg-red-700"
                                    >
                                      Révoquer l’accès (pour ce médecin)
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                    ) : (
                          <p>Aucune demande.</p>
                    )}
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
</main>

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
                      name="medecinId"
                      value={appointmentFormData.medecinId}
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
        {rescheduleModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <form
              onSubmit={submitReschedule}  // Corrigé : Utiliser submitReschedule (appelle updateRdvStatus avec "postpone")
              className="bg-white rounded-lg p-4 w-full max-w-md space-y-3"
            >
              <h3 className="text-lg font-semibold">Proposer une nouvelle date</h3>
              <label className="block text-sm">
                Date & heure
                <input
                  type="datetime-local"
                  className="mt-1 w-full border rounded px-2 py-1"
                  value={rescheduleFormData.date}
                  onChange={(e) =>
                    setRescheduleFormData((s) => ({ ...s, date: e.target.value }))
                  }
                  required
                />
              </label>
              <label className="block text-sm">
                Lieu
                <input
                  type="text"
                  className="mt-1 w-full border rounded px-2 py-1"
                  placeholder="Cabinet, hôpital, visioconsultation…"
                  value={rescheduleFormData.location}
                  onChange={(e) =>
                    setRescheduleFormData((s) => ({ ...s, location: e.target.value }))
                  }
                />
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={rescheduleFormData.isTeleconsultation}
                  onChange={(e) =>
                    setRescheduleFormData((s) => ({
                      ...s,
                      isTeleconsultation: e.target.checked,
                    }))
                  }
                />
                Téléconsultation
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="px-3 py-1 rounded border"
                  onClick={() => {
                    setRescheduleModalOpen(false);
                    setRescheduleAppointmentId(null);
                  }}
                >
                Annuler
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 rounded bg-indigo-600 text-white"
                >
                Envoyer
                </button>
            </div>
          </form>
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

        {showApproveModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-[480px] p-6 bg-white rounded-2xl">
              <CardHeader>
                <CardTitle>Autoriser l'accès au médecin</CardTitle>
              </CardHeader>
              <CardContent>
        <div className="space-y-4">
          {/* Scope */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Périmètre (scope)</label>
            <Select value={scope} onValueChange={(v) => setScope(v as any)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choisir un scope" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="RESULTS">Résultats</SelectItem>
                <SelectItem value="HISTORY">Antécédents</SelectItem>
                <SelectItem value="PRESCRIPTIONS">Ordonnances</SelectItem>
                <SelectItem value="TESTS">Tests de diagnostics</SelectItem>
                <SelectItem value="ALL">Tout le dossier</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Durée */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Durée (minutes)</label>
            <Input
              type="number"
              min={1}
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(parseInt(e.target.value || "0", 10))}
              placeholder="ex. 60"
            />
          </div>

          {/* Liste d'items optionnelle si scope fin — on montre un exemple pour les résultats */}
          {scope === "RESULTS" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sélectionner des documents (optionnel)
              </label>
              <div className="max-h-48 overflow-auto space-y-2 border rounded p-2">
                {results.map((r) => (
                  <label key={r.id} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={selectedIds.includes(r.id)}
                      onCheckedChange={(c) => toggleSelectedId(r.id, c)}
                    />
                    <span>
                      {r.type} — {new Date(r.date).toLocaleDateString()} {r.description ? `— ${r.description}` : ""}
                    </span>
                  </label>
                ))}
                {results.length === 0 && (
                  <p className="text-xs text-gray-500">Aucun résultat listé.</p>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={resetApprovalForm}>
              Annuler
            </Button>
            <Button className="bg-blue-600 text-white" onClick={submitApproval}>
              Confirmer l’approbation
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
)}

        {showShareModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-lg p-6 bg-white rounded-xl shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-800">
                  Partager votre dossier médical
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
              {/* Choix du médecin */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Médecin</label>
                    <select
                      value={shareDoctorId}
                      onChange={(e) => setShareDoctorId(e.target.value)}
                      className="w-full p-2 rounded-xl border-gray-300 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Sélectionner un médecin</option>
                        {doctors.map(d => (
                          <option key={d.id} value={d.id}>{d.firstName} {d.lastName}</option>
                        ))}
                    </select>
                </div>

              {/* Motif */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Motif</label>
                    <Input
                      value={shareMotif}
                      onChange={(e) => setShareMotif(e.target.value)}
                      placeholder="Ex: Analyse complète avant prochain rendez-vous"
                    />
                </div>

                {/* Périmètre & durée */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Périmètre</label>
                    <select
                      value={shareScope}
                      onChange={(e) => {
                        const next = e.target.value as typeof shareScope;
                        setShareScope(next);
                        // on réinitialise la sélection aux éléments visibles du nouveau filtre
                        setShareSelectedIds(prev => prev.filter(id => visibleDocs.some(d => d.id === id)));
                      }}
                      className="w-full p-2 rounded-xl border-gray-300 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="ALL">Tout le dossier</option>
                      <option value="RESULTS">Résultats</option>
                      <option value="PRESCRIPTIONS">Ordonnances</option>
                      <option value="TESTS">Tests</option>
                      <option value="ANTECEDENTS">Antécédents</option>
                    </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Durée (minutes)</label>
                  <Input
                    type="number"
                    min={1}
                    value={shareDuration}
                    onChange={(e) => setShareDuration(parseInt(e.target.value || "60", 10))}
                  />
                </div>
              </div>

              {/* Sélection fine (facultative) */}
              <div className="max-h-56 overflow-auto border rounded-lg p-2">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600">Sélectionner des documents précis (facultatif) :</p>
                    {visibleDocs.length > 0 && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="text-xs underline"
                          onClick={() => setShareSelectedIds(visibleDocs.map(d => d.id))}
                        >
                          Tout cocher
                        </button>
                        <button
                          type="button"
                          className="text-xs underline"
                          onClick={() => setShareSelectedIds([])}
                        >
                          Tout décocher
                        </button>
                </div>
                )}
              </div>

              {visibleDocs.length === 0 ? (
                <p className="text-sm text-gray-500">{emptyByScope[shareScope]}</p>
                ) : (
                  <ul className="space-y-2">
                    {visibleDocs.map((d) => (
                      <li key={d.id} className="flex items-center gap-2">
                        <input
                          id={`sel-${d.id}`}
                          type="checkbox"
                          checked={shareSelectedIds.includes(d.id)}
                          onChange={() =>
                            setShareSelectedIds(prev =>
                              prev.includes(d.id) ? prev.filter(x => x !== d.id) : [...prev, d.id]
                            )
                          }
                        />
                          <label htmlFor={`sel-${d.id}`} className="text-sm">
                            {d.title}
                          </label>
                      </li>
                    ))}
                  </ul>
              )}
              <small className="text-gray-500">
                Laissez vide pour partager l’intégralité du périmètre sélectionné ci-dessus.
              </small>
            </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => setShowShareModal(false)}>Annuler</Button>
        <Button className="bg-blue-600 text-white" onClick={async () => {
          try {
            const token = getValidTokenOrRedirect();
            if (!token) return;
            if (!shareDoctorId) { alert("Sélectionnez un médecin."); return; }

            // 1) Scope à envoyer au backend (il n'accepte pas ANTECEDENTS)
            const payloadScope = shareScope === "ANTECEDENTS" ? "ALL" : shareScope;

            // 2) on n’envoie que des IDs de fichiers réels (résultats/ordonnances/tests)
            const allowedIds = new Set<string>([
              ...(results ?? []).map((r: any) => r.id),
              ...prescriptions.map((p: any) => p.id),
              ...tests.map((t: any) => t.id),
            ]);

            let idsToSend = shareSelectedIds.filter(id => allowedIds.has(id));

            // si rien n’a été coché : pour un périmètre ≠ ALL, on partage tout ce périmètre (hors antécédents)
            if (idsToSend.length === 0 && shareScope !== "ALL") {
              idsToSend = visibleDocs
                .filter(d => d.kind !== "ANTECEDENTS")
                .map(d => d.id);
            }
            // 3) Envoi
            const res = await fetch("/api/patient/share", {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({
                medecinId: shareDoctorId,
                scope: payloadScope,           // "ALL" | "RESULTS" | "PRESCRIPTIONS" | "TESTS"
                durationMinutes: shareDuration,
                resourceIds: idsToSend,        // peut être [] (tout le périmètre) ou une sélection
                motif: shareMotif,
              }),
            });
            const data = await res.json().catch(() => null);
            if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);

            // mémorise le grant pour permettre "Révoquer" si tu l’affiches par relatedId:
            if (data?.accessRequest?.id && data?.grant?.id) {
              setGrantsByRequest(prev => ({
                ...prev,
                [data.accessRequest.id]: {
                  id: data.grant.id,
                  scope: data.grant.scope,
                  expiresAt: data.grant.expiresAt,
                  revoked: false,
                  accessRequestId: data.grant.accessRequestId,
                },
              }));
            }

            setShowShareModal(false);
            setShareDoctorId(""); setShareScope("ALL"); setShareDuration(60);
            setShareSelectedIds([]); setShareMotif("");

            alert("Dossier partagé avec succès. Le médecin a été notifié.");
          } catch (e: any) {
            alert(e?.message || "Échec du partage.");
          }
        }}>
          Partager
        </Button>
      </CardFooter>
    </Card>
  </div>
        )}


      </div>
    </div>
  );
};
