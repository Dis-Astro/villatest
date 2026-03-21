import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Image, Mail, Eye, Shield, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const [imageCount, setImageCount] = useState(0);
  const [hasSmtpConfig, setHasSmtpConfig] = useState(false);
  const [isPromoting, setIsPromoting] = useState(false);
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchStats = async () => {
      // Count gallery images
      const { count } = await supabase
        .from("gallery_images")
        .select("*", { count: "exact", head: true });

      if (count !== null) {
        setImageCount(count);
      }

      // Check SMTP config
      const { data } = await supabase
        .from("smtp_config")
        .select("id")
        .limit(1)
        .maybeSingle();

      setHasSmtpConfig(!!data);
    };

    fetchStats();
  }, []);

  const handlePromoteToAdmin = async () => {
    if (!user) return;

    setIsPromoting(true);
    try {
      const { data, error } = await supabase.rpc("promote_to_admin", {
        target_user_id: user.id,
      });

      if (error) throw error;

      if (data) {
        toast({
          title: "Promozione completata",
          description: "Ora sei un amministratore! Ricarica la pagina.",
        });
        window.location.reload();
      } else {
        toast({
          variant: "destructive",
          title: "Non autorizzato",
          description: "Solo il primo utente può auto-promuoversi",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Errore",
        description: error.message || "Impossibile promuovere ad admin",
      });
    } finally {
      setIsPromoting(false);
    }
  };

  const stats = [
    {
      title: "Immagini Galleria",
      value: imageCount.toString(),
      description: "Foto caricate",
      icon: Image,
      href: "/admin/gallery",
      color: "text-primary",
    },
    {
      title: "Configurazione SMTP",
      value: hasSmtpConfig ? "Configurato" : "Non configurato",
      description: hasSmtpConfig ? "Email pronta" : "Da configurare",
      icon: Mail,
      href: "/admin/smtp",
      color: hasSmtpConfig ? "text-primary" : "text-accent",
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="font-display text-3xl text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Benvenuto nel pannello di amministrazione di Villa Paris
          </p>
        </div>

        {/* Admin Promotion Banner */}
        {!isAdmin && (
          <Card className="border-accent/50 bg-accent/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-accent">
                <Shield className="h-5 w-5" />
                Diventa Amministratore
              </CardTitle>
              <CardDescription>
                Se sei il primo utente a registrarti, puoi promuoverti automaticamente ad amministratore
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handlePromoteToAdmin}
                disabled={isPromoting}
                className="bg-accent hover:bg-accent/90"
              >
                {isPromoting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Promozione in corso...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Promuovimi ad Admin
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat) => (
            <Link key={stat.title} to={stat.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <stat.icon
                    className={`h-5 w-5 ${stat.color} group-hover:scale-110 transition-transform`}
                  />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-display ${stat.color}`}>
                    {stat.value}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}

          {/* Quick Actions */}
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
              <Link
                to="/admin/gallery"
                className="block text-sm text-primary hover:underline"
              >
                → Gestisci galleria
              </Link>
              <Link
                to="/admin/smtp"
                className="block text-sm text-primary hover:underline"
              >
                → Configura email
              </Link>
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
              Da qui puoi gestire le immagini del sito pubblico e configurare l'invio email dal form contatti.
            </CardDescription>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none text-muted-foreground">
            <p>
              <strong>Galleria Foto:</strong> Carica nuove immagini per sezione (hero, location, eventi),
              riordinale con drag &amp; drop e modifica didascalie. Le immagini vengono mostrate
              automaticamente nel sito pubblico.
            </p>
            <p>
              <strong>Configurazione SMTP:</strong> Imposta il server email per
              ricevere i messaggi dal form contatti del sito.
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
