import { Suspense } from "react";
import RegisterForm from "./RegisterForm";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <Suspense fallback={<div>Chargement...</div>}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
