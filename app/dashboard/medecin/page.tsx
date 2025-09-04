"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Logo from "@/components/Logo";
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

// Composant IntegrityCheckButton intégré
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
  patientId: string | null;
  medecinId: string;
  relatedId?: string | null; 
  type?: string; 
}

interface Result {
  id: string;
  type: string;
  date: string;
  description: string;
  fileUrl?: string;
  patientId: string;
  patient: { id: string; firstName: string; lastName: string };
  createdById: string;
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
  numeroOrdre?: string;
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
  const [motif, setMotif] = useState<string>("");
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string>("");
  const [uploadedHash, setUploadedHash] = useState<string | null>(null);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [sharedResults, setSharedResults] = useState<Result[]>([]);
  const [myResults, setMyResults] = useState<Result[]>([]);
  const [apptActionBusy, setApptActionBusy] = useState<string | null>(null);
    const [appointments, setAppointments] = useState<RendezVous[]>([]);
  // [B3] Tous les résultats visibles pour ce médecin (créés + partagés)
  const allResultsForDoctor = useMemo(
    () =>
      [...myResults, ...sharedResults].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
    [myResults, sharedResults]
);
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
  const [reschedLocation, setReschedLocation] = useState<string>("");
  const [reschedTele, setReschedTele] = useState<boolean>(false);

  // Place ce helper sous les états RDV (juste après rdvError)
  const patchRdvLocal = (id: string, partial: Partial<RendezVous>) => {
    setRendezvous(prev =>
      prev.map((rdv: RendezVous) => rdv.id === id ? { ...rdv, ...partial } : rdv)
    );
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

// 2) Initialisation : lit ton token actuel (tu as déjà getValidTokenOrRedirect)
useEffect(() => {
  const t = token ?? getValidTokenOrRedirect();
  if (!t) return;
  setToken(t);
  setTokenExp(decodeExp(t));
}, []);

useEffect(() => {
  if (!doctor) return;
  setProfileFormData({
    id: doctor.id,
    firstName: doctor.firstName || "",
    lastName: doctor.lastName || "",
    email: doctor.email || "",
    speciality: doctor.speciality || "",
    phoneNumber: doctor.phoneNumber || "",
    address: doctor.address || "",
    numeroOrdre: doctor.numeroOrdre || "",
  });
}, [doctor]);


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


// En haut du fichier (états du modal) :
const [isReschedOpen, setIsReschedOpen] = useState(false);
const [reschedId, setReschedId] = useState<string | null>(null);
const [reschedISO, setReschedISO] = useState<string>("");

// Ouvre le modal
const openResched = (id: string) => {
  setReschedId(id);
  setReschedISO("");
  setIsReschedOpen(true);
};



const loadAppointments = async () => {
  try {
    const token = getValidTokenOrRedirect();
    if (!token) return;
    const res = await fetch("/api/medecin/appointments", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(await res.text().catch(() => "HTTP " + res.status));
    const data = await res.json();
    setAppointments(Array.isArray(data) ? data : []);
  } catch (e) {
    console.error("loadAppointments:", e);
  }
};


const updateRdvStatus = async (
  id: string,
  action: "accept" | "decline" | "postpone",
  newDate?: string,
  newLocation?: string,
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
            isTeleconsultation:
              typeof newTele === "boolean" ? newTele : undefined,
            // status: "En attente médecin", // Maintient le statut en attente
            status: "En attente patient", 
          }
        : {
            status: action === "accept" ? "Confirmé" : "Refusé",
          };

    const res = await fetch(`/api/medecin/appointments/${id}`, {
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

    // 🔹 Mise à jour locale immédiate du state pour un rendu instantané
    setRendezvous((prev) =>
      prev.map((rdv) =>
        rdv.id === id
          ? {
              ...rdv,
              ...body,
              date: newDate ?? rdv.date,
              location: newLocation ?? rdv.location,
              isTeleconsultation:
                typeof newTele === "boolean" ? newTele : rdv.isTeleconsultation,
              status:
                action === "postpone"
                ? "En attente patient"
                : action === "accept"
                ? "Confirmé"
                : "Refusé",
            }
          : rdv
      )
    );

    // Optionnel : rafraîchir depuis l’API si nécessaire
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



  const [showResultModal, setShowResultModal] = useState(false);
  const [resultType, setResultType] = useState("");
  const [resultDate, setResultDate] = useState("");
  const [resultDescription, setResultDescription] = useState("");
  const [resultFileUrl, setResultFileUrl] = useState("");
  const [resultIsShared, setResultIsShared] = useState(false);
  const [resultError, setResultError] = useState<string | null>(null);
  const [appointmentFormData, setAppointmentFormData] = useState({
  month: new Date().getMonth(), // Mois en cours par défaut
});
  // === état pour un PDF local + handler de sélection ===
const [resultLocalFile, setResultLocalFile] = useState<File | null>(null);
const [resultLocalName, setResultLocalName] = useState<string>("");


  const [showProfileModal, setShowProfileModal] = useState(false);

const openResult = async (id: string) => {
  try {
    const token = getValidTokenOrRedirect();
    if (!token) return;

    const res = await fetch(`/api/medecin/files/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      let data: any = null;
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/json")) data = await res.json().catch(() => null);
      else data = { error: await res.text().catch(() => "") };

      if (res.status === 403 && data?.code === "EXPIRED") {
        alert(`L'autorisation a expiré${data?.expiredAt ? ` le ${new Date(data.expiredAt).toLocaleString("fr-FR")}` : ""}. Demandez un nouvel accès.`);
        return;
      }
      if (res.status === 403 && data?.code === "NO_GRANT") {
        alert("Vous n'avez pas d'autorisation active pour ce patient. Demandez un nouvel accès.");
        return;
      }
      if (res.status === 403 && data?.code === "NOT_IN_SCOPE") {
        alert("Le document demandé n'est pas inclus dans la permission accordée.");
        return;
      }
      if (res.status === 403 && data?.code === "BLOCKCHAIN_DENY") {
        alert("Accès refusé par la blockchain. Renouvelez la demande d'accès.");
        return;
      }

      if (!res.ok) {
  let data: any = null;
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) data = await res.json().catch(() => null);
  else data = { error: await res.text().catch(() => "") };

  if (res.status === 403 && data?.code === "EXPIRED") {
    alert(`Votre autorisation a expiré${data?.expiredAt ? ` le ${new Date(data.expiredAt).toLocaleString("fr-FR")}` : ""}. Vous pouvez envoyer une nouvelle demande d’accès.`);
    return;
  }
  if (res.status === 403 && data?.code === "REVOKED") {
    alert("Le patient a révoqué votre accès à son dossier. Vous pouvez envoyer une nouvelle demande d’accès.");
    return;
  }
  if (res.status === 403 && data?.code === "NO_GRANT") {
    alert("Vous n'avez pas d'autorisation active pour ce patient. Demandez un nouvel accès.");
    return;
  }
  if (res.status === 403 && data?.code === "NOT_IN_SCOPE") {
    alert("Le document demandé n'est pas inclus dans la permission accordée. Demandez une nouvelle autorisation incluant ce document.");
    return;
  }
  if (res.status === 403 && data?.code === "BLOCKCHAIN_DENY") {
    alert("Accès refusé par la blockchain. Veuillez renouveler la demande d'accès.");
    return;
  }

  alert(data?.error || `Erreur ${res.status}`);
  return;
}


      alert(data?.error || `Erreur ${res.status}`);
      return;
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    // éventuel cleanup plus tard: URL.revokeObjectURL(url)
  } catch (err: any) {
    console.error("openResult error:", err);
    alert("Impossible d'ouvrir le document.");
  }
};

// Ouvre le modal avec une date initiale
// const openReschedMed = (id: string, currentDateISO?: string) => {
//   setReschedId(id);
//   // <input type="datetime-local"> attend "YYYY-MM-DDTHH:mm"
//   const iso = currentDateISO ? new Date(currentDateISO).toISOString().slice(0,16) : "";
//   setReschedISO(iso);
//   setIsReschedOpen(true);
// };

const openReschedMed = (
  id: string,
  currentDateISO?: string,
  currentLocation?: string,
  currentTele?: boolean
) => {
  setReschedId(id);
  const iso = currentDateISO ? new Date(currentDateISO).toISOString().slice(0,16) : "";
  setReschedISO(iso);
  setReschedLocation(currentLocation ?? "");
  setReschedTele(!!currentTele);
  setIsReschedOpen(true);
};


// --- Dossier partagé : état global ---
const [shareGrant, setShareGrant] = useState<null | {
  id: string;
  scope: "ALL" | "RESULTS" | "TESTS" | "ORDONNANCES";
  expiresAt?: string;
}>(null);

const [grantedResults, setGrantedResults] = useState<any[]>([]);

// Modals
const [showGrantCategories, setShowGrantCategories] = useState(false);
const [showGrantFiles, setShowGrantFiles] = useState(false);
const [grantedAntecedents, setGrantedAntecedents] = useState<null | {
  medicalHistory?: string | null;
  allergies?: string | null;
}>(null);


// Catégorie sélectionnée
type Cat = "ANTECEDENTS" | "ORDONNANCES" | "PROCEDURES" | "TESTS" | "RESULTS" | "AUTRES";
const [selectedCat, setSelectedCat] = useState<Cat>("RESULTS");

// Normalisation des types côté UI
const classify = (r: any): Cat => {
  const t = String(r.type || "").toLowerCase();

  // Ordon­nances
  if (/ordonn|prescri/.test(t)) return "ORDONNANCES";

  // Procédures (si tes docs portent ces mots-clés)
  if (/(procédure|operation|opération|chirurgie|acte)/.test(t)) return "PROCEDURES";

  // Tests de diagnostic / imagerie
  if (/(^|\b)(test|imagerie|radio|scanner|irm|echo|échographie|ecg|eeg)(\b|$)/.test(t)) {
    return "TESTS";
  }

  // Résultats médicaux (résultat, analyse, bilan…)
  if (/(résultat|resultat|analyse|bilan|compte[- ]rendu)/.test(t)) return "RESULTS";

  // Par défaut, on considère "RESULTS" (ça évite de ranger un "Résultat" dans TEST)
  return "RESULTS";
};


// Grouper + trier
const byCat = (list: any[]) => {
  const groups: Record<Cat, any[]> = {
    ANTECEDENTS: [], // NB: ce sera géré à part (pas des fichiers)
    ORDONNANCES: [],
    PROCEDURES: [],
    TESTS: [],
    RESULTS: [],
    AUTRES: [],
  };
  for (const r of list) groups[classify(r)].push(r);
  (Object.keys(groups) as Cat[]).forEach(k => {
    groups[k].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  });
  return groups;
};




const handleDoctorAppointmentAction = async (
  appointmentId: string,
  action: "accept" | "decline" | "reschedule",
  payload?: { date?: string; location?: string; isTeleconsultation?: boolean }
) => {
  try {
    const token = getValidTokenOrRedirect();
    if (!token) return;

    const body: any = {};
    if (action === "accept") body.status = "Confirmé";
    if (action === "decline") body.status = "Refusé";
    if (action === "reschedule") {
      Object.assign(body, payload || {});
      body.status = "En attente patient";  // Corrigé : Statut explicite pour le report
    }

    const res = await fetch(`/api/medecin/appointments/${appointmentId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(t || `Erreur ${res.status}`);
    }

    const updated = await res.json();
    setRendezvous((prev) => prev.map(a => a.id === appointmentId ? updated : a));  // Corrigé : Mise à jour locale
    if (action === "reschedule") {
      alert("Proposition de nouvelle date envoyée 📅");
    } else if (action === "accept") {
      alert("Rendez-vous confirmé ✅");
    } else if (action === "decline") {
      alert("Rendez-vous refusé ❌");
    }
  } catch (e: any) {
    console.error("handleDoctorAppointmentAction:", e);
    alert(e?.message || "Erreur réseau");
  }
};

const onPickResultFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) {
    setUploadedFileUrl("");
    setUploadedHash(null);
    return;
  }
  if (file.type !== "application/pdf") {
    alert("Seuls les fichiers PDF sont acceptés.");
    (e.target as HTMLInputElement).value = "";
    return;
  }

  const token = getValidTokenOrRedirect();
  if (!token) return;

  const fd = new FormData();
  fd.append("file", file);
  fd.append("category", "results"); // <- classe le fichier côté serveur

  const up = await fetch("/api/medecin/upload", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
  });

  const data = await up.json().catch(() => ({}));
  if (!up.ok) {
    alert(data?.error || "Échec de l’upload");
    return;
  }

  // ✅ L’API renvoie un chemin RELATIF (ex: "results/2025-08-26/<hash>.pdf") et un hash
  setUploadedFileUrl(data.fileUrl);
  setUploadedHash(data.documentHash);

  // garde ton champ texte synchro si tu veux l’afficher
  setResultFileUrl(data.fileUrl);
};

const viewGrantedDocs = async (relatedId?: string | null) => {
  if (!relatedId) return;

  const token = getValidTokenOrRedirect();
  if (!token) return;

  try {
    const res = await fetch(`/api/medecin/access-requests/${relatedId}/grant`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    let payload: any = null;
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      payload = await res.json().catch(() => null);
    } else {
      payload = { error: await res.text().catch(() => "") };
    }

    if (!res.ok) {
      const err = payload?.error || `Erreur ${res.status}`;

      // messages pédagogiques
      if (res.status === 400 && /relatedId manquant/i.test(err)) {
        alert("Demande invalide : identifiant de la demande manquant.");
        return;
      }
      if (res.status === 404 && /Demande d'accès introuvable/i.test(err)) {
        alert("Cette demande n'existe pas ou ne vous est pas destinée.");
        return;
      }
      if (res.status === 409 && /n'est pas acceptée/i.test(err)) {
        alert("Cette demande n'a pas été acceptée par le patient.");
        return;
      }
      if (res.status === 404 && /Aucun grant trouvé/i.test(err)) {
        alert("Le patient n'a accordé aucun document pour cette demande (peut-être révoqué ou expiré).");
        return;
      }

      alert(err);
      return;
    }

    const { grant, results } = payload || {};
if (!grant) {
  alert("Aucune autorisation active n'a été trouvée pour cette demande.");
  return;
}

// Sauvegarde les infos du grant + résultats
setShareGrant({
  id: grant.id,
  scope: (grant.scope || "ALL") as "ALL" | "RESULTS" | "TESTS" | "ORDONNANCES",
  expiresAt: grant.expiresAt || undefined,
});
// Après setShareGrant(...)
setGrantedResults(Array.isArray(results) ? results : []);

// Nouveau : enregistrer antécédents si fournis
if (payload?.antecedents) {
  setGrantedAntecedents({
    medicalHistory: payload.antecedents.medicalHistory ?? null,
    allergies: payload.antecedents.allergies ?? null,
  });
} else {
  setGrantedAntecedents(null);
}

setGrantedResults(Array.isArray(results) ? results : []);

// Ouvre le modal de catégories
setShowGrantFiles(false);
setShowGrantCategories(true);

  } catch (e: any) {
    alert(e?.message || "Erreur réseau.");
  }
};

const markDoctorNotifsRead = async () => {
  const token = getValidTokenOrRedirect();
  if (!token) return;
  await fetch("/api/medecin/notifications", { method: "PUT", headers: { Authorization: `Bearer ${token}` } });
  // maj UI
  setNotifications((prev) => prev.map(n => ({ ...n, read: true })));
};

// exemple: dans ton onClick de la cloche/onglet "Notifications"
const onOpenDoctorNotifications = async () => {
  await markDoctorNotifsRead();
  // ...ouvrir le panneau...
};



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

 

const getValidTokenOrRedirect = (): string | null => {
  const token = document.cookie
    .split("; ")
    .find((row) => row.startsWith("token="))
    ?.split("=")[1];
  if (!token) {
    window.location.href = "/auth/login?role=medecin";
    return null;
  }
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    console.log("Payload du token:", payload); // Ajoutez ce log
    if (payload.exp && payload.exp < Date.now() / 1000) {
      window.location.href = "/auth/login?role=medecin";
      return null;
    }
    if (payload.role !== "Medecin") {
      console.log("Rôle incorrect:", payload.role);
      window.location.href = "/auth/login?role=medecin";
      return null;
    }
    return token;
  } catch (error) {
    window.location.href = "/auth/login?role=medecin";
    return null;
  }
};


  useEffect(() => {
  const fetchData = async () => {
    try {
      const t = token ?? getValidTokenOrRedirect();
      if (!t) return;

      const [doctorRes, rdvRes, consultRes, resultsRes, notifRes, allPatientsRes] = await Promise.all([
        fetch("/api/medecin/me", { headers: { Authorization: `Bearer ${t}` } }),
        fetch("/api/medecin/appointments", { headers: { Authorization: `Bearer ${t}` } }),
        fetch("/api/medecin/consultations", { headers: { Authorization: `Bearer ${t}` } }),
        fetch("/api/medecin/results", { headers: { Authorization: `Bearer ${t}` } }),
        fetch("/api/medecin/notifications", { headers: { Authorization: `Bearer ${t}` } }),
        fetch("/api/medecin/patients/all", { headers: { Authorization: `Bearer ${t}` } }),
      ]);

      const responses = [doctorRes, rdvRes, consultRes, resultsRes, notifRes, allPatientsRes];
      const endpoints = [
        "/api/medecin/me",
        "/api/medecin/appointments",
        "/api/medecin/consultations",
        "/api/medecin/results",
        "/api/medecin/notifications",
        "/api/medecin/patients/all",
      ];
      for (let i = 0; i < responses.length; i++) {
        const res = responses[i];
        if (res.status === 401) {
          alert("Session expirée. Veuillez vous reconnecter.");
          window.location.href = "/auth/login?role=medecin&expired=true";
          return;
        }
        if (!res.ok) console.warn(`⚠️ ${endpoints[i]} -> ${res.status}`);
      }

      // 1) Médecin (accepte {doctor:{...}} ou {...})
      const meJson = await doctorRes.json();
      const doctorFromApi: Doctor | null = meJson?.doctor ?? (meJson && meJson.firstName ? meJson : null);
      setDoctor(doctorFromApi);

      // -- RDV (remplace ton bloc actuel)
const rdvPayload = await rdvRes.json();
const rdvData: RendezVous[] = Array.isArray(rdvPayload)
  ? rdvPayload
  : Array.isArray(rdvPayload?.rendezVous)
  ? rdvPayload.rendezVous
  : Array.isArray(rdvPayload?.appointments)
  ? rdvPayload.appointments
  : [];
setRendezvous(rdvRes.ok ? rdvData : []);

      // 3) Consultations  (accepte {consultations:[...]} ou [...])
      const consultJson = await consultRes.json();
      const consultArr: Consultation[] = Array.isArray(consultJson)
        ? consultJson
        : Array.isArray(consultJson?.consultations) ? consultJson.consultations : [];
      setConsultations(consultArr);

      // 4) Résultats  (accepte {results:[...]} ou [...])
      const resultsJson = await resultsRes.json();
      const resultsArr: Result[] = Array.isArray(resultsJson)
        ? resultsJson
        : Array.isArray(resultsJson?.results) ? resultsJson.results : [];

      const my = doctorFromApi ? resultsArr.filter(r => r.createdById === doctorFromApi.id) : [];
      const shared = doctorFromApi ? resultsArr.filter(r => r.createdById !== doctorFromApi.id) : resultsArr;
      setMyResults(my);
      setSharedResults(shared);

      // 5) Notifications (accepte {notifications:[...]} ou [...])
      const notifJson = await notifRes.json();
      const notifArr: Notification[] = Array.isArray(notifJson)
        ? notifJson
        : Array.isArray(notifJson?.notifications) ? notifJson.notifications : [];
      setNotifications(
        (notifArr ?? []).map(n => ({
  
          id: n.id,
          message: n.message,
          date: typeof n.date === "string" ? n.date : new Date(n.date as any).toISOString(),
          read: !!n.read,
          patientId: n.patientId ?? null,
          medecinId: n.medecinId ?? "",
          relatedId: n.relatedId ?? null,   // 👈
          type: n.type ?? undefined,      
        }))
      );

      // 6) Patients (tableau, {patients:[...]}, ou {doctors:[...]} selon ton backend)
      const allPatientsJson = await allPatientsRes.json();
      const allPatientsData: Patient[] = Array.isArray(allPatientsJson)
        ? allPatientsJson
        : Array.isArray(allPatientsJson?.patients)
          ? allPatientsJson.patients
          : Array.isArray(allPatientsJson?.doctors)
            ? allPatientsJson.doctors
            : [];
      setAllPatients(allPatientsData);
      setPatients(allPatientsData);

      setLoading(false);
    } catch (err: any) {
      console.error("Erreur dans fetchData:", err.message);
      setError(err.message);
      router.replace("/auth/login?role=medecin");
    }
  };

  fetchData();
}, [router]);


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
          numeroOrdre: profileFormData.numeroOrdre,
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

  const sendNotification = async (patientId: string, message: string, type: "appointment" | "consultation" | "result" | "accessRequest" | "accessResponse") => {
  try {
    const token = getValidTokenOrRedirect();
    if (!token) return;

    // fallback doctor name depuis le token si state pas prêt
    let drFirst = doctor?.firstName;
    let drLast = doctor?.lastName;
    let drId = doctor?.id;

    if (!drFirst || !drLast || !drId) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        drFirst = drFirst || payload.firstName || "Médecin";
        drLast = drLast || payload.lastName || "";
        drId = drId || payload.id;
      } catch (_) {
        drFirst = drFirst || "Médecin";
        drLast = drLast || "";
      }
    }

    const res = await fetch("/api/patient/notifications", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        patientId,
        // on forme le message proprement, sans doublon de "Le Dr."
        message: `Le Dr. ${drFirst} ${drLast} ${message}`,
        medecinId: drId,
        type,
      }),
      credentials: "include",
    });

    if (!res.ok) {
      if (res.status === 401) {
        console.warn("Token expiré lors de l'envoi de notification");
        return;
      }
      const errorText = await res.text();
      throw new Error(`Erreur HTTP ${res.status}: ${errorText}`);
    }

    const newNotification: Notification = await res.json();
    setNotifications((prev) => [newNotification, ...prev]);
  } catch (err: any) {
    console.error("Erreur d'envoi de notification :", err.message);
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
        sendNotification(patient.id, `Votre rendez-vous a été ${action === "approve" ? "approuvé" : action === "reject" ? "rejeté" : "reprogrammé"}.`, "appointment");
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
      const token = getValidTokenOrRedirect();
      if (!token) return;

      console.log("Token utilisé pour consultation :", token.substring(0, 10) + "...");

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
        if (res.status === 401) {
          alert("Session expirée. Veuillez vous reconnecter.");
          window.location.href = "/auth/login?role=medecin&expired=true";
          return;
        }
        const errorText = await res.text();
        throw new Error(`Erreur HTTP ${res.status}: ${errorText}`);
      }
      
      const newConsult: Consultation = await res.json();
      setConsultations((prev) => [...prev, newConsult]);
      setShowConsultModal(false);
      setConsultDate("");
      setConsultSummary("");
      setConsultError(null);
      sendNotification(selectedPatient.id, "Une nouvelle consultation a été ajoutée à votre dossier.", "consultation");
      alert("Consultation enregistrée avec succès !" );
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
      const token = getValidTokenOrRedirect();
      if (!token) return;

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
        if (res.status === 401) {
          alert("Session expirée. Veuillez vous reconnecter.");
          window.location.href = "/auth/login?role=medecin&expired=true";
          return;
        }
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
      sendNotification(selectedPatient.id, "Un nouveau rendez-vous a été programmé.", "appointment");
      alert("Rendez-vous enregistré avec succès !");
    } catch (err: any) {
      console.error("Erreur lors de la création du rendez-vous :", err.message);
      setRdvError(`Échec : ${err.message}`);
    }
  };


function normalizeLink(raw: string): string | null {
  if (!raw) return null;
  let v = raw.trim().replace(/\\/g, "/");   // autorise les chemins Windows collés
  if (!v) return null;

  if (/^https?:\/\//i.test(v)) {
    // Lien http(s) accepté tel quel
    return v;
  }

  // Autorise un chemin relatif sous LOCAL_FILES_DIR
  v = v.replace(/^\/+/, ""); // enlève les / de tête
  if (v.toLowerCase().startsWith("results/")) {
    return v;                // ex: results/2025-08-26/result_jean.pdf
  }

  return null; // sinon invalide
}

const handleResultSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!selectedPatient) {
    setResultError("Veuillez sélectionner un patient.");
    return;
  }

  try {
    const token = getValidTokenOrRedirect();
    if (!token) return;

    let documentHash: string | null = null;
    let finalFileUrl = (resultFileUrl || "").trim();

    // --- 0) Règle de base : il faut un fichier OU un lien
    const normalized = normalizeLink(finalFileUrl);
    if (!resultLocalFile && !normalized) {
      setResultError("Choisissez un PDF OU saisissez un lien http(s) OU un chemin 'results/...'.");
      return;
    }

    // --- 1) Cas PDF local (prioritaire si présent)
    if (resultLocalFile) {
      // Hash du fichier local
      const buf = await resultLocalFile.arrayBuffer();
      const h = await crypto.subtle.digest("SHA-256", buf);
      documentHash = Array.from(new Uint8Array(h))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");

      // Upload du fichier vers API (qui renvoie un fileUrl **relatif**)
      const fd = new FormData();
      fd.append("file", resultLocalFile);
      fd.append("patientId", selectedPatient.id);

      const up = await fetch("/api/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!up.ok) throw new Error(await up.text().catch(() => "Échec upload"));
      const upJson = await up.json();

      finalFileUrl = upJson?.fileUrl || "";
      if (!finalFileUrl) throw new Error("Upload OK mais fileUrl manquant.");
    }

    // --- 2) Sinon, cas "lien" (normalized existe car testé plus haut)
    else if (normalized) {
      finalFileUrl = normalized;

      if (/^https?:\/\//i.test(finalFileUrl)) {
        // Tente de hasher le contenu distant (peut échouer à cause du CORS ; non bloquant)
        try {
          const resp = await fetch(finalFileUrl);
          if (resp.ok) {
            const buf = await resp.arrayBuffer();
            const h = await crypto.subtle.digest("SHA-256", buf);
            documentHash = Array.from(new Uint8Array(h))
              .map(b => b.toString(16).padStart(2, "0"))
              .join("");
          }
        } catch {
          /* on continue sans hash si CORS empêche le fetch */
        }
      } else {
        // Chemin local relatif "results/..." : pas de hash distant à faire ici
        // (la lecture/stream se fera côté API /api/medecin/files/[id] avec LOCAL_FILES_DIR)
      }
    }

    // --- 3) Création du résultat
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
        fileUrl: finalFileUrl,   // http(s) OU chemin relatif 'results/...'
        isShared: resultIsShared,
        documentHash,
      }),
    });

    if (!res.ok) {
      if (res.status === 401) {
        alert("Session expirée. Veuillez vous reconnecter.");
        document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
        window.location.href = "/auth/login?role=medecin&expired=true";
        return;
      }
      throw new Error(await res.text());
    }

    const newResult: Result = await res.json();
    setMyResults(prev => [...prev, newResult]);

    // Reset formulaire
    setShowResultModal(false);
    setResultType("");
    setResultDate("");
    setResultDescription("");
    setResultFileUrl("");
    setResultIsShared(false);
    setResultLocalFile(null);
    setResultLocalName("");
    setResultError(null);

    // notif patient (facultatif)
    sendNotification(
      selectedPatient.id,
      "Un nouveau résultat a été ajouté à votre dossier.",
      "result"
    );
    alert("Résultat enregistré avec succès !");
  } catch (err: any) {
    console.error("Erreur lors de la création du résultat :", err.message);
    setResultError(`Échec : ${err.message}`);
  }
};



  const filteredPatients = allPatients.filter((p) =>
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase())
  );

const toggleReadNotification = async (notificationId: string) => {
  try {
    const token = getValidTokenOrRedirect();
    if (!token) return;

    const notification = notifications.find((n) => n.id === notificationId);
    if (!notification || notification.read) return; // Ne rien faire si déjà lu

    const res = await fetch(`/api/medecin/notifications/${notificationId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ read: true }),
    });

    if (!res.ok) {
      if (res.status === 401) {
        alert("Session expirée. Veuillez vous reconnecter.");
        window.location.href = "/auth/login?role=medecin&expired=true";
        return;
      }
      throw new Error("Erreur lors de la mise à jour de la notification.");
    }

    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
  } catch (err: any) {
    console.error("Erreur dans toggleReadNotification:", err.message);
    setError(err.message);
  }
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
      requestAccessToPatient(patient.id, motif); // Nouvelle fonction pour demander l'accès via l'endpoint dédié
    }
  }
  setShowAccessRequest(false);
  setRequestPatientId(null);
  setPatientAccessApproved(false);
  setMotif(""); // Réinitialise le motif après confirmation
};

const requestAccessToPatient = async (patientId: string, motif: string) => {
    try {
      const token = getValidTokenOrRedirect();
      if (!token) return;

      const res = await fetch(`/api/patient/access`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          patientId, // Envoyer patientId
          resultId: null, // Facultatif, si vous partagez un résultat spécifique
          motif, // Ajouter le motif ici
        }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          alert("Session expirée. Veuillez vous reconnecter.");
          window.location.href = "/auth/login?role=medecin&expired=true";
          return;
        }
        const errorText = await res.text();
        throw new Error(`Erreur HTTP ${res.status}: ${errorText}`);
      }

      const { success, accessRequest } = await res.json();
      if (success) {
        alert("Demande d'accès envoyée avec succès !");
      }
    } catch (err: any) {
      console.error("Erreur lors de la demande d'accès :", err.message);
      alert(`Échec : ${err.message}`);
    }
  };

  const approvePatientAccess = (patientId: string) => {
  if (selectedPatient && selectedPatient.id === patientId) {
    setPatientAccessApproved(false); // Mettre à jour l'état immédiatement
    sendNotification(
      patientId,
      `${doctor?.firstName} ${doctor?.lastName} a approuvé l'accès à votre dossier.`
    , "accessResponse");
  }
};

  if (loading) return <div className="p-6 text-center text-gray-500">Chargement...</div>;
  if (error) return <div className="p-6 text-center text-red-500">Erreur : {error}</div>;
  if (!doctor) return <div className="p-6 text-center text-red-500">Utilisateur non connecté</div>;

  return (
    
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
      <aside className="fixed inset-y-0 left-0 w-64 overflow-y-auto bg-gradient-to-b from-blue-800 to-blue-600 text-white p-6 shadow-lg z-40">
        <div className="mb-12 flex flex-row items-center">
          <img src="/assets/images/logo.svg" alt="Meddata Secured" className="h-32 w-auto" />
          <Logo size="text-sm" className="ml-[-14px]" /> {/* Marge négative et bordure pour débogage */}
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
            className="w-full text-left p-3 mt-4 mb-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-200"
          >
            Se déconnecter
          </button>
        </div>
      </aside>

      <div className="flex-1 ml-64 h-screen overflow-hidden">
        <header className="sticky top-2 z-30">
          <div className="flex flex-nowrap items-center w-full mb-4 p-4 bg-gradient-to-r from-blue-100 to-white text-slate-900 rounded-xl shadow-md">
            <h1 className="text-2xl font-bold text-gray-800">
              Tableau de bord / {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)} / Dr.{" "}
              {doctor?.firstName} {doctor?.lastName}
            </h1>
            <div className="flex space-x-4 ml-auto">
              <button
                onClick={() => setShowNotifPanel(!showNotifPanel)}
                className="relative p-2 rounded-full bg-white hover:bg-gray-100 shadow-md"
                title="Notifications"
              >
                <BellIcon className="h-6 w-6 text-blue-600" />
                {notifications.filter((n) => !n.read).length > 0 && (
                  <span className="absolute top-0 right-0 inline-block w-5 h-5 bg-red-600 text-white text-xs font-bold rounded-full text-center leading-5">
                    {notifications.filter((n) => !n.read).length}
                  </span>
                )}
              </button> 
              <Cog6ToothIcon className="h-7 w-8 mt-2 text-blue-600 hover:text-blue-800 cursor-pointer" />
            </div>
          </div>
        </header>

         <div className="h-[calc(100vh-4.5rem)] overflow-y-auto px-6 pb-6">
        {showNotifPanel && (
  <Card className="absolute right-6 mt-2 w-80 max-h-80 overflow-y-auto rounded-xl shadow-lg bg-white border border-gray-200">
    <CardHeader>
      <CardTitle className="text-xl font-semibold text-gray-800">Notifications</CardTitle>
    </CardHeader>
    <CardContent>
      {notifications.length > 0 ? (
        <ul className="space-y-3 text-gray-700">
          {notifications
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .map((note) => {
              const msg = note.message ?? "";
              const isAccepted = /(approuv|accept)/i.test(msg);        // patient a accepté une demande DU médecin
              const isShared  = /(partag(e|é)|a partagé)/i.test(msg);  // patient a partagé spontanément
              const isDeclined = /refus/i.test(msg);
              const isRevoked  = /révoqu/i.test(msg);
            return (
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
                {/* 1) Cas “médecin a demandé” -> patient a accepté */}
                {note.type === "accessResponse" && note.relatedId && (isAccepted || isShared) && (
                  <div className="mt-2">
                    <Button
                      size="sm"
                      className="bg-blue-600 text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        viewGrantedDocs(note.relatedId); // ta fonction existante qui ouvre le modal des docs
                      }}
                    >
                      {isShared ? "Voir le dossier médical" : "Voir les documents"}
                    </Button>
                  </div>
                )}
              </li>
              );
            })}
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
                <div className="mb-4">
                  <label htmlFor="motif" className="block text-sm font-medium text-gray-700">Motif de la demande</label>
                  <Input
                    id="motif"
                    type="text"
                    value={motif}
                    onChange={(e) => setMotif(e.target.value)}
                    placeholder="Entrez votre motif ici..."
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAccessRequest(false);
                      setRequestPatientId(null);
                      setMotif(""); // Réinitialise en cas d'annulation
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
                  <p className="text-2xl text-gray-800">{myResults.length}</p>
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
                    sendNotification(selectedPatient.id, "Rappel: Votre rendez-vous est prévu bientôt.", "appointment")
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
                  <p className="text-gray-600 mb-1">Numero de l'Ordre: {doctor?.numeroOrdre}</p>
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
                  <Input
                    type="text"
                    name="numeroOrdre"
                    value={profileFormData.numeroOrdre}
                    onChange={handleProfileChange}
                    placeholder="Numéro de l'Ordre"
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
                    {filteredPatients.filter((p) => (p.dossier ?? "").includes("Créé par")).length > 0 ? (
                      filteredPatients
                        .filter((p) => (p.dossier ?? "").includes("Créé par"))
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
                            , "appointment")
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
                                  {rdv.status === "En attente médecin" && (
                                    <div className="inline-flex gap-2 ml-2">
                                      <Button size="sm" variant="outline" onClick={() => updateRdvStatus(rdv.id, "accept")} className="rounded">
                                        Accepter
                                      </Button>
                                      <Button size="sm" variant="destructive" onClick={() => updateRdvStatus(rdv.id, "decline")} className="rounded">
                                        Refuser
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          const d = prompt("Nouvelle date ISO (ex: 2025-09-10T10:00:00Z)");
                                          if (d) updateRdvStatus(rdv.id, "postpone", d);
                                        }}
                                        className="rounded"
                                      >
                                        Repousser
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

                        <h3 className="font-semibold text-lg text-gray-800 mt-6">📊 Résultats (créés par vous)</h3>
{myResults.filter((r) => r.patientId === selectedPatient.id).length > 0 ? (
  <ul className="list-disc ml-5 text-gray-600">
    {myResults
      .filter((r) => r.patientId === selectedPatient.id)
      .map((result) => (
        <li key={result.id} className="mb-2">
          {patients.find((p) => p.id === result.patientId)?.firstName}{" "}
          {patients.find((p) => p.id === result.patientId)?.lastName} - {result.type} -{" "}
          {new Date(result.date).toLocaleString()}: {result.description}
          {result.fileUrl && (
            <span>
              {" "}
              <Button
                size="sm"
                className="ml-2 bg-blue-600 text-white hover:bg-blue-700"
                onClick={() => openResult(result.id)}
              >
                Ouvrir
              </Button>

            </span>
          )}
          <IntegrityCheckButton
            resultId={result.id}
            token={getValidTokenOrRedirect() || ""}
          />
        </li>
      ))}
  </ul>
) : (
  <p className="ml-5 text-gray-500 text-center">Aucun résultat pour ce patient (créé par vous).</p>
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
        {/* --------- Bloc 1 : Tous les rendez-vous à confirmer --------- */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-red-600">À confirmer</h2>
          {rendezvous.filter((a) => a.status === "En attente médecin").length > 0 ? (
            rendezvous
              .filter((a) => a.status === "En attente médecin")
              .map((a) => (
                <Card key={a.id} className="mb-4 rounded-xl border border-gray-200">
                  <CardContent className="p-4">
                    <p className="text-gray-700">
                      {patients.find((p) => p.id === a.patientId)?.firstName}{" "}
                      {patients.find((p) => p.id === a.patientId)?.lastName} -{" "}
                      {new Date(a.date).toLocaleString()} - {a.location} (
                      {a.isTeleconsultation ? "Téléconsultation" : "Présentiel"}) - Statut: {a.status}
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
                        Approuver
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => updateRdvStatus(a.id, "decline")}
                        className="rounded"
                        disabled={apptActionBusy === a.id}
                      >
                        Décliner
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openReschedMed(a.id, a.date, a.location, a.isTeleconsultation)}
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
              value={activeSubSection || "today"}
              onChange={(e) => setActiveSubSection(e.target.value || "today")}
              className="p-2 border border-gray-300 rounded-xl"
            >
              <option value="today">Aujourd'hui</option>
              <option value="month">Mois</option>
            </select>
          </div>
          <Button
            onClick={() => setShowRdvModal(true)}
            className="bg-blue-600 text-white rounded-xl"
          >
            + Créer un rendez-vous
          </Button>
        </div>

        {/* Aujourd’hui */}
        {activeSubSection === "today" && (
          <div className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl">
            {(() => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const tomorrow = new Date(today);
              tomorrow.setDate(today.getDate() + 1);

              const todaysRdv = rendezvous.filter((a) => {
                const d = new Date(a.date);
                return d >= today && d < tomorrow;
              });

              return todaysRdv.length > 0 ? (
                todaysRdv.map((a) => (
                  <Card key={a.id} className="mb-4 rounded-xl border border-gray-200">
                    <CardContent className="p-4">
                      <p className="text-gray-700">
                        {patients.find((p) => p.id === a.patientId)?.firstName}{" "}
                        {patients.find((p) => p.id === a.patientId)?.lastName} -{" "}
                        {new Date(a.date).toLocaleString()} - {a.location} (
                        {a.isTeleconsultation ? "Téléconsultation" : "Présentiel"}) - Statut: {a.status}
                      </p>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p className="text-gray-600 text-center">Aucun rendez-vous aujourd'hui.</p>
              );
            })()}
          </div>
        )}

        {/* Mois */}
        {activeSubSection === "month" && (
          <div className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl">
            <div className="mb-4">
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
            {(() => {
              const monthlyRdv = rendezvous.filter((a) => {
                const d = new Date(a.date);
                return d.getMonth() === appointmentFormData.month && d.getFullYear() === new Date().getFullYear();
              });

              return monthlyRdv.length > 0 ? (
                monthlyRdv.map((a) => (
                  <Card key={a.id} className="mb-4 rounded-xl border border-gray-200">
                    <CardContent className="p-4">
                      <p className="text-gray-700">
                        {patients.find((p) => p.id === a.patientId)?.firstName}{" "}
                        {patients.find((p) => p.id === a.patientId)?.lastName} -{" "}
                        {new Date(a.date).toLocaleString()} - {a.location} (
                        {a.isTeleconsultation ? "Téléconsultation" : "Présentiel"}) - Statut: {a.status}
                      </p>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p className="text-gray-600 text-center">
                  Aucun rendez-vous prévu pour ce mois.
                </p>
              );
            })()}
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
                {myResults.length > 0 ? (
  <ul className="space-y-4">
    {myResults.map((result) => (
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
                  patients.find((p) => p.id === result.patientId)?.lastName || "Inconnu (ID: " + result.patientId + ")"}{" "}
              - <strong>Date :</strong> {new Date(result.date).toLocaleString()}
            </p>
            <p className="text-gray-600">{result.description}</p>
            {result.fileUrl && (
              <Button
                size="sm"
                className="ml-2 bg-blue-600 text-white hover:bg-blue-700"
                onClick={() => openResult(result.id)}
              >
                Ouvrir
              </Button>

            )}
            <IntegrityCheckButton
              resultId={result.id}
              token={getValidTokenOrRedirect() || ""}
            />
          </div>
        </CardContent>
      </Card>
    ))}
  </ul>
) : (
  <p className="text-gray-600 text-center">Aucun résultat (créé par vous) pour le moment.</p>
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
        {notifications.length > 0 ? (
          <ul className="space-y-4">
            {notifications
              .sort((a: Notification, b: Notification) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((note: Notification) => (
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
                    {/* 1) Cas “médecin a demandé” -> patient a accepté */}
                    {note.type === "accessResponse" &&
                      /approuv|accept/i.test(note.message || "") &&
                      note.relatedId && (
                        <div className="mt-2">
                          <Button
                            size="sm"
                            className="bg-blue-600 text-white"
                            onClick={(e) => {
                              e.stopPropagation();
                              viewGrantedDocs(note.relatedId);
                            }}
                          >
                            Voir les documents
                          </Button>
                          </div>
                    )}

                    {/* 2) Cas “patient a partagé spontanément son dossier” */}
                    {note.type === "accessResponse" &&
                      /(partag(e|é)|a partagé)/i.test(note.message || "") &&
                      note.relatedId && (
                        <div className="mt-2">
                          <Button
                            size="sm"
                            className="bg-blue-600 text-white"
                            onClick={(e) => {
                              e.stopPropagation();
                              viewGrantedDocs(note.relatedId);
                            }}
                          >
                            Voir le dossier médical
                          </Button>

                        </div>
                    )}

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
</div>

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
                  {/* Lien HTTP(s) optionnel */}
                  <div className="space-y-1">
                    <label className="block text-sm font-medium">Lien du fichier (URL)</label>
                    <input
                      type="text"
                      placeholder="https://…"
                      value={resultFileUrl}
                      onChange={(e) => setResultFileUrl(e.target.value)}
                      className="w-full rounded border px-3 py-2"
                    />
                      <p className="text-xs text-gray-500">
                        Laisse vide si tu téléverses un PDF ci-dessous.
                      </p>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium">Fichier PDF</label>
                    <input type="file" accept="application/pdf" onChange={onPickResultFile} />
                    {resultFileUrl && (
                      <p className="text-xs text-gray-500 mt-1">
                        Chemin cible: {resultFileUrl}
                      </p>
                    )}
                  </div>

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

        {/* Modal 1 — Choix de la catégorie */}
{showGrantCategories && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <Card className="w-[520px] p-6 bg-white rounded-xl shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl">Dossier médical partagé</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">
          Périmètre: <b>{shareGrant?.scope || "—"}</b>
          {shareGrant?.expiresAt ? (
            <> — valable jusqu’au {new Date(shareGrant.expiresAt).toLocaleString("fr-FR")}</>
          ) : null}
        </p>

        {(() => {
          const groups = byCat(grantedResults);
          // On n’affiche que les catégories présentes (et éventuellement conformes au scope)
          const scope = shareGrant?.scope || "ALL";
          const allow = (c: Cat) =>
            scope === "ALL" ||
            (scope === "RESULTS" && c === "RESULTS") ||
            (scope === "TESTS" && c === "TESTS") ||
            (scope === "ORDONNANCES" && c === "ORDONNANCES");

          const catMeta: Array<{ cat: Cat; label: string; emptyMsg: string; count: number }> = [
            {
              cat: "ANTECEDENTS",
              label: "Antécédents",
              emptyMsg: "Aucun antécédent saisi.",
              count: (grantedAntecedents?.medicalHistory ? 1 : 0) + (grantedAntecedents?.allergies ? 1 : 0),
            },
            { cat: "ORDONNANCES", label: "Ordonnances", emptyMsg: "Aucune ordonnance disponible.", count: groups["ORDONNANCES"].length },
            { cat: "PROCEDURES", label: "Procédures", emptyMsg: "Aucune procédure disponible.", count: groups["PROCEDURES"].length },
            { cat: "TESTS", label: "Test de diagnostic", emptyMsg: "Aucun test de diagnostic disponible.", count: groups["TESTS"].length },
            { cat: "RESULTS", label: "Résultats médicaux", emptyMsg: "Aucun résultat disponible.", count: groups["RESULTS"].length },
          ];
          return (
            <div className="grid grid-cols-1 gap-3">
              {catMeta.map(({cat, label, emptyMsg, count}) => {
                if (!allow(cat)) return null;
                return (
                  <Button
                    key={cat}
                    variant={count ? "default" : "outline"}
                    className={count ? "bg-blue-600 text-white justify-between" : "justify-between"}
                    disabled={!count}
                    onClick={() => { setSelectedCat(cat); setShowGrantCategories(false); setShowGrantFiles(true); }}
                  >
                    <span>{label}</span>
                    <span className="text-xs opacity-80">{count ? `${count} document(s)` : emptyMsg}</span>
                  </Button>
                );
              })}
            </div>
          );
        })()}
      </CardContent>

      <div className="flex justify-end gap-3 px-6 pb-4">
        <Button variant="outline" onClick={() => { setShowGrantCategories(false); setShareGrant(null); setGrantedResults([]); }}>
          Fermer
        </Button>
      </div>
    </Card>
  </div>
)}

{/* Modal 2 — Liste par catégorie */}
{showGrantFiles && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <Card className="w-[720px] p-6 bg-white rounded-xl shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl">
          {selectedCat === "ANTECEDENTS" && "Antécédents"}
          {selectedCat === "ORDONNANCES" && "Ordonnances"}
          {selectedCat === "PROCEDURES" && "Procédures"}
          {selectedCat === "TESTS" && "Test de diagnostic"}
          {selectedCat === "RESULTS" && "Résultats médicaux"}
          {selectedCat === "AUTRES" && "Autres documents"}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3 max-h-[60vh] overflow-auto">
        {(() => {
  // Catégorie Antécédents : pas de fichiers, on affiche le texte
  if (selectedCat === "ANTECEDENTS") {
    if (!grantedAntecedents || (!grantedAntecedents.medicalHistory && !grantedAntecedents.allergies)) {
      return <p className="text-sm text-gray-500 italic">Aucun antécédent saisi.</p>;
    }
    return (
      <div className="space-y-3">
        {grantedAntecedents.medicalHistory && (
          <div className="border rounded-lg px-3 py-2">
            <div className="font-medium">Antécédents</div>
            <div className="text-sm text-gray-700 whitespace-pre-wrap">{grantedAntecedents.medicalHistory}</div>
          </div>
        )}
        {grantedAntecedents.allergies && (
          <div className="border rounded-lg px-3 py-2">
            <div className="font-medium">Allergies</div>
            <div className="text-sm text-gray-700 whitespace-pre-wrap">{grantedAntecedents.allergies}</div>
          </div>
        )}
      </div>
    );
  }

  // Les autres catégories : fichiers
  const groups = byCat(grantedResults);
  const list = groups[selectedCat] || [];
  if (!list.length) {
    return <p className="text-sm text-gray-500 italic">Aucun document.</p>;
  }
  return list.map((doc: any) => (
    <div key={doc.id} className="flex items-center justify-between border rounded-lg px-3 py-2">
      <div className="min-w-0">
        <div className="font-medium truncate">{doc.type || "Document"}</div>
        <div className="text-xs text-gray-500">
          {new Date(doc.date).toLocaleString("fr-FR")} — {doc.description || "—"}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button size="sm" className="bg-blue-600 text-white" onClick={() => openResult(doc.id)}>
          Voir le fichier
        </Button>
          <IntegrityCheckButton
            resultId={doc.id}
            token={getValidTokenOrRedirect() || ""}
          />
      </div>
    </div>
  ));
})()}

      </CardContent>

      <div className="flex justify-between gap-3 px-6 pb-4">
        <Button variant="outline" onClick={() => { setShowGrantFiles(false); setShowGrantCategories(true); }}>
          ← Retour aux catégories
        </Button>
        <Button variant="outline" onClick={() => { setShowGrantFiles(false); setShareGrant(null); setGrantedResults([]); }}>
          Fermer
        </Button>
      </div>
    </Card>
  </div>
)}

{isReschedOpen && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <Card className="w-96 p-6 bg-white rounded-xl shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-gray-800">
          Reprogrammer le rendez-vous
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!reschedId) return;
            // <input type="datetime-local"> -> string locale "YYYY-MM-DDTHH:mm"
            const iso = reschedISO ? new Date(reschedISO).toISOString() : undefined;
            await updateRdvStatus(
              reschedId,
              "postpone",
              iso,
              reschedLocation.trim() ? reschedLocation.trim() : undefined,
              reschedTele
            );
            setIsReschedOpen(false);
            setReschedId(null);
            setReschedISO("");
            setReschedLocation("");
            setReschedTele(false);
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium">Nouvelle date</label>
            <Input
              type="datetime-local"
              value={reschedISO}
              onChange={(e) => setReschedISO(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Lieu (optionnel)</label>
            <Input
              type="text"
              placeholder="Ex: Cabinet A, salle 2"
              value={reschedLocation}
              onChange={(e) => setReschedLocation(e.target.value)}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              checked={reschedTele}
              onCheckedChange={(v) => setReschedTele(!!v)}
            />
            <span>Téléconsultation</span>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsReschedOpen(false);
                setReschedId(null);
              }}
              className="rounded-xl"
            >
              Annuler
            </Button>
            <Button type="submit" className="bg-blue-600 text-white rounded-xl">
              Envoyer la proposition
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




