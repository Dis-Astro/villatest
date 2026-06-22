import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Shield, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Dashboard() {
  const { logout } = useAuth();

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-3xl text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Benvenuto nel pannello di amministrazione di Villa Paris
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                Azioni Rapide
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm text-primary hover:underline"
              >
                → Visualizza il sito
              </a>
              <a
                href="/admin"
                className="block text-sm text-primary hover:underline"
              >
                → Ricarica admin panel
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Amministrazione
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" size="sm" onClick={logout} className="w-full">
                <LogOut className="w-4 h-4 mr-2" />
                Esci
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Welcome Message */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-xl">
              Gestione Villa Paris
            </CardTitle>
            <CardDescription>
              Pannello di amministrazione locale per Villa Paris.
            </CardDescription>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none text-muted-foreground">
            <p>
              <strong>Galleria Foto:</strong> Le immagini del sito sono gestite
              tramite file statici in <code>/public/images/</code>. Per aggiornare
              la galleria, carica i file WebP nelle cartelle corrispondenti e
              aggiorna i dati in <code>/src/content/gallery.ts</code>.
            </p>
            <p>
              <strong>Email:</strong> Il form contatti utilizza Supabase Edge
              Function. Per configurare l'invio email, aggiorna la configurazione
              SMTP su Supabase Dashboard.
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}