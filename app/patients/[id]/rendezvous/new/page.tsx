import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";

export default function NewRendezvousPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <Card className="w-full max-w-xl rounded-2xl shadow-xl border bg-white">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">📅 Nouveau Rendez-vous</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input type="date" placeholder="Date du rendez-vous" />
          <Input type="time" placeholder="Heure du rendez-vous" />
          <Textarea placeholder="Motif du rendez-vous" />

          <div className="flex justify-between gap-3">
            <Button variant="outline" asChild className="rounded-xl">
              <Link href="/dashboard">Annuler</Link>
            </Button>
            <Button className="rounded-xl">Enregistrer</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}