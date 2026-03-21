import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Server, Lock, User, Save, Loader2, Eye, EyeOff, TestTube } from "lucide-react";

interface SmtpConfigData {
  id?: string;
  host: string;
  port: number;
  username: string;
  password: string;
  use_tls: boolean;
  sender_email: string;
  sender_name: string;
}

const defaultConfig: SmtpConfigData = {
  host: "",
  port: 587,
  username: "",
  password: "",
  use_tls: true,
  sender_email: "",
  sender_name: "Villa Paris",
};

export default function SmtpConfig() {
  const [config, setConfig] = useState<SmtpConfigData>(defaultConfig);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchConfig = async () => {
      const { data, error } = await supabase
        .from("smtp_config")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching SMTP config:", error);
        toast({
          variant: "destructive",
          title: "Errore",
          description: "Impossibile caricare la configurazione",
        });
      } else if (data) {
        setConfig({
          id: data.id,
          host: data.host || "",
          port: data.port || 587,
          username: data.username || "",
          password: data.password || "",
          use_tls: data.use_tls ?? true,
          sender_email: data.sender_email || "",
          sender_name: data.sender_name || "Villa Paris",
        });
      }
      setIsLoading(false);
    };

    fetchConfig();
  }, [toast]);

  const handleSave = async () => {
    if (!config.host || !config.sender_email) {
      toast({
        variant: "destructive",
        title: "Campi obbligatori",
        description: "Compila almeno host e email mittente",
      });
      return;
    }

    setIsSaving(true);

    try {
      if (config.id) {
        // Update existing
        const { error } = await supabase
          .from("smtp_config")
          .update({
            host: config.host,
            port: config.port,
            username: config.username,
            password: config.password,
            use_tls: config.use_tls,
            sender_email: config.sender_email,
            sender_name: config.sender_name,
          })
          .eq("id", config.id);

        if (error) throw error;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from("smtp_config")
          .insert({
            host: config.host,
            port: config.port,
            username: config.username,
            password: config.password,
            use_tls: config.use_tls,
            sender_email: config.sender_email,
            sender_name: config.sender_name,
          })
          .select()
          .single();

        if (error) throw error;
        setConfig((prev) => ({ ...prev, id: data.id }));
      }

      toast({
        title: "Configurazione salvata",
        description: "Le impostazioni SMTP sono state salvate con successo",
      });
    } catch (error: any) {
      console.error("Save error:", error);
      toast({
        variant: "destructive",
        title: "Errore",
        description: error.message || "Impossibile salvare la configurazione",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-2xl">
        {/* Header */}
        <div>
          <h1 className="font-display text-3xl text-foreground">Configurazione SMTP</h1>
          <p className="text-muted-foreground mt-1">
            Configura il server email per ricevere i messaggi dal form contatti del sito
          </p>
        </div>

        {/* Config Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="w-5 h-5 text-primary" />
              Server SMTP
            </CardTitle>
            <CardDescription>
              Inserisci i dati del server di posta. Le email dal form contatti verranno inviate tramite questo server.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Host & Port */}
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="host">Host SMTP</Label>
                <Input
                  id="host"
                  placeholder="smtp.example.com"
                  value={config.host}
                  onChange={(e) => setConfig({ ...config, host: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="port">Porta</Label>
                <Input
                  id="port"
                  type="number"
                  placeholder="587"
                  value={config.port}
                  onChange={(e) => setConfig({ ...config, port: parseInt(e.target.value) || 587 })}
                />
              </div>
            </div>

            {/* Username & Password */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">
                  <User className="w-4 h-4 inline mr-2" />
                  Username
                </Label>
                <Input
                  id="username"
                  placeholder="user@example.com"
                  value={config.username}
                  onChange={(e) => setConfig({ ...config, username: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">
                  <Lock className="w-4 h-4 inline mr-2" />
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={config.password}
                    onChange={(e) => setConfig({ ...config, password: e.target.value })}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* TLS Toggle */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="space-y-1">
                <Label className="text-base">Usa TLS/SSL</Label>
                <p className="text-sm text-muted-foreground">
                  Connessione sicura (raccomandato)
                </p>
              </div>
              <Switch
                checked={config.use_tls}
                onCheckedChange={(checked) => setConfig({ ...config, use_tls: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Sender Config */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              Mittente
            </CardTitle>
            <CardDescription>
              L'email mittente riceverà anche le risposte. Il nome verrà mostrato come mittente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sender_email">Email Mittente</Label>
                <Input
                  id="sender_email"
                  type="email"
                  placeholder="noreply@villaparis.it"
                  value={config.sender_email}
                  onChange={(e) => setConfig({ ...config, sender_email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sender_name">Nome Mittente</Label>
                <Input
                  id="sender_name"
                  placeholder="Villa Paris"
                  value={config.sender_name}
                  onChange={(e) => setConfig({ ...config, sender_name: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvataggio...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salva Configurazione
              </>
            )}
          </Button>
        </div>

        {/* Help text */}
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="pt-6">
            <h4 className="font-medium text-foreground mb-2">Configurazioni comuni:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• <strong>Gmail:</strong> smtp.gmail.com, porta 587</li>
              <li>• <strong>Outlook:</strong> smtp-mail.outlook.com, porta 587</li>
              <li>• <strong>Yahoo:</strong> smtp.mail.yahoo.com, porta 587</li>
              <li>• <strong>Aruba:</strong> smtps.aruba.it, porta 465</li>
            </ul>
            <p className="text-xs text-muted-foreground mt-3">
              Nota: Per Gmail e altri provider, potrebbe essere necessario generare una password per app.
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
