// types/prisma.ts
// Types personnalisés pour éviter les problèmes d'import Prisma

export type UserRole = "Patient" | "Medecin";

export type AccessRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export type RecordType = "CONSULTATION" | "ORDONNANCE" | "ANALYSE" | "AUTRE";

// Type pour les données utilisateur lors de l'inscription
export interface UserRegistrationData {
  email: string;
  password: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  gender: string;
  address: string;
  phoneNumber: string;
  socialSecurityNumber: string;
  
  // Champs optionnels pour les patients
  dateOfBirth?: Date | null;
  bloodType?: string | null;
  allergies?: string | null;
  medicalHistory?: string | null;
  
  // Champs optionnels pour les médecins
  numeroOrdre?: string | null;
  speciality?: string | null;
  hospital?: string | null;
}

// Helper pour vérifier le rôle
export const isPatient = (role: UserRole): boolean => role === "Patient";
export const isMedecin = (role: UserRole): boolean => role === "Medecin";