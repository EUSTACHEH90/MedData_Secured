import { Suspense } from "react";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <Suspense fallback={<div>Chargement...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
