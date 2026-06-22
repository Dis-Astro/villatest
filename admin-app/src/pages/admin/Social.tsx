import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  EyeOff,
  Instagram,
  Link2,
  Loader2,
  RefreshCw,
  Save,
  Share2,
  ShieldCheck,
  Trash2,
} from "lucide-react";

interface SocialConnection {
  id: string;
  provider: "instagram" | "facebook" | "tiktok";
  account_name: string;
  account_id: string | null;
  access_token?: string | null;
  token_expires_at: string | null;
  is_enabled: boolean;
  auto_sync: boolean;
  last_sync_at: string | null;
  last_sync_error: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface SocialPost {
  id: string;
  provider: "instagram" | "facebook" | "tiktok";
  provider_post_id: string;
  media_type: string | null;
  media_url: string | null;
  thumbnail_url: string | null;
  permalink: string;
  caption: string | null;
  published_at: string | null;
  is_visible: boolean;
}

const emptyForm = {
  account_name: "Villa Paris Instagram",
  account_id: "",
  access_token: "",
  token_expires_at: "",
  is_enabled: true,
  auto_sync: false,
  import_limit: 12,
};

function formatDate(value: string | null) {
  if (!value) return "Mai";
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function postImage(post: SocialPost) {
  if (post.media_type === "VIDEO") return post.thumbnail_url || post.media_url;
  return post.media_url || post.thumbnail_url;
}

export default function SocialIntegrations() {
  const [connections, setConnections] = useState<SocialConnection[]>([]);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  const instagramConnection = useMemo(
    () => connections.find((connection) => connection.provider === "instagram"),
    [connections]
  );

  const visiblePostCount = posts.filter((post) => post.is_visible).length;

  const fetchData = async () => {
    setIsLoading(true);

    const [{ data: connectionData, error: connectionError }, { data: postData, error: postError }] =
      await Promise.all([
        supabase
          .from("social_connections")
          .select("id,provider,account_name,account_id,token_expires_at,is_enabled,auto_sync,last_sync_at,last_sync_error,created_at,updated_at")
          .order("created_at", { ascending: true }),
        supabase
          .from("social_posts")
          .select("id,provider,provider_post_id,media_type,media_url,thumbnail_url,permalink,caption,published_at,is_visible")
          .order("published_at", { ascending: false })
          .limit(48),
      ]);

    if (connectionError || postError) {
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Impossibile caricare le impostazioni social",
      });
    } else {
      setConnections((connectionData || []) as SocialConnection[]);
      setPosts((postData || []) as SocialPost[]);

      const instagram = (connectionData || []).find((item) => item.provider === "instagram") as
        | SocialConnection
        | undefined;

      if (instagram) {
        setForm({
          account_name: instagram.account_name || "Villa Paris Instagram",
          account_id: instagram.account_id || "",
          access_token: "",
          token_expires_at: instagram.token_expires_at ? instagram.token_expires_at.slice(0, 10) : "",
          is_enabled: instagram.is_enabled,
          auto_sync: instagram.auto_sync,
          import_limit: form.import_limit,
        });
      }
    }

    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    if (!form.account_name.trim() || !form.account_id.trim()) {
      toast({
        variant: "destructive",
        title: "Dati mancanti",
        description: "Inserisci nome account e Instagram Business Account ID",
      });
      return;
    }

    if (!instagramConnection && !form.access_token.trim()) {
      toast({
        variant: "destructive",
        title: "Token mancante",
        description: "Per la prima connessione serve un access token Meta valido",
      });
      return;
    }

    setIsSaving(true);
    const payload = {
      provider: "instagram",
      account_name: form.account_name.trim(),
      account_id: form.account_id.trim(),
      token_expires_at: form.token_expires_at ? new Date(form.token_expires_at).toISOString() : null,
      is_enabled: form.is_enabled,
      auto_sync: form.auto_sync,
    } as Record<string, unknown>;

    if (form.access_token.trim()) {
      payload.access_token = form.access_token.trim();
    }

    const result = instagramConnection
      ? await supabase.from("social_connections").update(payload as any).eq("id", instagramConnection.id)
      : await supabase.from("social_connections").insert(payload as any);

    if (result.error) {
      toast({
        variant: "destructive",
        title: "Errore",
        description: result.error.message || "Impossibile salvare la connessione",
      });
    } else {
      if (instagramConnection && !form.is_enabled) {
        await supabase.from("social_posts").update({ is_visible: false }).eq("provider", "instagram");
      }

      toast({
        title: "Connessione salvata",
        description: "Le impostazioni Instagram sono state aggiornate",
      });
      setForm((prev) => ({ ...prev, access_token: "" }));
      await fetchData();
    }

    setIsSaving(false);
  };

  const handleSync = async () => {
    if (!instagramConnection) return;
    setIsSyncing(true);

    const { data, error } = await supabase.functions.invoke("sync-instagram-posts", {
      body: {
        connectionId: instagramConnection.id,
        limit: form.import_limit,
      },
    });

    if (error || !data?.success) {
      toast({
        variant: "destructive",
        title: "Sync non riuscita",
        description: data?.error || error?.message || "Controlla token, account ID e deploy della funzione",
      });
    } else {
      toast({
        title: "Instagram sincronizzato",
        description: `${data.imported || 0} post aggiornati`,
      });
      await fetchData();
    }

    setIsSyncing(false);
  };

  const togglePostVisibility = async (post: SocialPost) => {
    const { error } = await supabase
      .from("social_posts")
      .update({ is_visible: !post.is_visible })
      .eq("id", post.id);

    if (error) {
      toast({ variant: "destructive", title: "Errore", description: "Impossibile aggiornare il post" });
    } else {
      setPosts((prev) => prev.map((item) => (item.id === post.id ? { ...item, is_visible: !item.is_visible } : item)));
    }
  };

  const deletePost = async (post: SocialPost) => {
    const { error } = await supabase.from("social_posts").delete().eq("id", post.id);
    if (error) {
      toast({ variant: "destructive", title: "Errore", description: "Impossibile eliminare il post" });
    } else {
      setPosts((prev) => prev.filter((item) => item.id !== post.id));
      toast({ title: "Post rimosso" });
    }
  };

  const disconnectInstagram = async () => {
    if (!instagramConnection) return;

    const [{ error: hideError }, { error: deleteError }] = await Promise.all([
      supabase.from("social_posts").update({ is_visible: false }).eq("provider", "instagram"),
      supabase.from("social_connections").delete().eq("id", instagramConnection.id),
    ]);

    if (hideError || deleteError) {
      toast({ variant: "destructive", title: "Errore", description: "Impossibile disconnettere Instagram" });
    } else {
      toast({ title: "Instagram disconnesso", description: "I post importati sono stati nascosti dal sito" });
      setForm(emptyForm);
      await fetchData();
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
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl text-foreground">Social</h1>
            <p className="text-muted-foreground mt-1">
              Connetti i profili social e ripubblica sul sito i contenuti approvati.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Aggiorna
            </Button>
            <Button onClick={handleSync} disabled={!instagramConnection || isSyncing}>
              {isSyncing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Instagram className="w-4 h-4 mr-2" />}
              Sincronizza Instagram
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Instagram className="w-4 h-4 text-primary" />
                  Instagram
                </span>
                <Badge variant={instagramConnection ? "default" : "secondary"}>
                  {instagramConnection ? "Connesso" : "Da configurare"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {visiblePostCount} post visibili sul sito
            </CardContent>
          </Card>

          <Card className="opacity-75">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-muted-foreground" />
                  Facebook
                </span>
                <Badge variant="outline">Pronto schema</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Struttura database pronta; sync da collegare con token Pagina.
            </CardContent>
          </Card>

          <Card className="opacity-75">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-muted-foreground" />
                  TikTok
                </span>
                <Badge variant="outline">Fase successiva</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Collegabile con API ufficiale quando l'app social e approvata.
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,520px)_1fr]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link2 className="w-5 h-5 text-primary" />
                  Connessione Instagram
                </CardTitle>
                <CardDescription>
                  Usa un account Instagram Business o Creator collegato a Meta. Il token viene salvato solo in Supabase.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="account_name">Nome visualizzato</Label>
                  <Input
                    id="account_name"
                    value={form.account_name}
                    onChange={(event) => setForm({ ...form, account_name: event.target.value })}
                    placeholder="Villa Paris Instagram"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="account_id">Instagram Business Account ID</Label>
                  <Input
                    id="account_id"
                    value={form.account_id}
                    onChange={(event) => setForm({ ...form, account_id: event.target.value })}
                    placeholder="17841400000000000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="access_token">
                    Access token Meta {instagramConnection ? "(lascia vuoto per non cambiarlo)" : ""}
                  </Label>
                  <Input
                    id="access_token"
                    type="password"
                    value={form.access_token}
                    onChange={(event) => setForm({ ...form, access_token: event.target.value })}
                    placeholder={instagramConnection ? "Token gia salvato" : "EAAB..."}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="token_expires_at">Scadenza token</Label>
                    <Input
                      id="token_expires_at"
                      type="date"
                      value={form.token_expires_at}
                      onChange={(event) => setForm({ ...form, token_expires_at: event.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="import_limit">Post da importare</Label>
                    <Input
                      id="import_limit"
                      type="number"
                      min={1}
                      max={50}
                      value={form.import_limit}
                      onChange={(event) => setForm({ ...form, import_limit: Number(event.target.value) || 12 })}
                    />
                  </div>
                </div>

                <div className="space-y-3 rounded-md border border-border p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <Label className="text-base">Connessione attiva</Label>
                      <p className="text-sm text-muted-foreground">Se spento, la sync viene bloccata e i post importati vengono nascosti.</p>
                    </div>
                    <Switch
                      checked={form.is_enabled}
                      onCheckedChange={(checked) => setForm({ ...form, is_enabled: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <Label className="text-base">Auto sync</Label>
                      <p className="text-sm text-muted-foreground">Flag pronto per scheduler Supabase o cron esterno.</p>
                    </div>
                    <Switch
                      checked={form.auto_sync}
                      onCheckedChange={(checked) => setForm({ ...form, auto_sync: checked })}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Salva connessione
                  </Button>
                  {instagramConnection && (
                    <Button variant="outline" onClick={disconnectInstagram}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Disconnetti
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-muted/30 border-dashed">
              <CardContent className="pt-6 space-y-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 mt-0.5 text-primary" />
                  <p>Non inserire mai token Instagram nel codice pubblico. Questa pagina li salva in una tabella protetta da RLS.</p>
                </div>
                <div className="flex items-start gap-2">
                  <Clock className="w-4 h-4 mt-0.5 text-primary" />
                  <p>I long-lived token Meta scadono periodicamente: aggiorna la data per ricordarti il rinnovo.</p>
                </div>
                <a
                  href="https://developers.facebook.com/docs/instagram-platform/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  Documentazione Meta Instagram
                  <ExternalLink className="w-3 h-3" />
                </a>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-3">
                <span>Post importati</span>
                <Badge variant="secondary">{posts.length} totali</Badge>
              </CardTitle>
              <CardDescription>
                Decidi quali post appaiono nella sezione Instagram della home.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {instagramConnection?.last_sync_error && (
                <div className="mb-4 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                  <AlertCircle className="w-4 h-4 mt-0.5" />
                  <span>{instagramConnection.last_sync_error}</span>
                </div>
              )}

              {instagramConnection?.last_sync_at && (
                <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  Ultima sync: {formatDate(instagramConnection.last_sync_at)}
                </div>
              )}

              {posts.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground">
                  <Instagram className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p>Nessun post importato.</p>
                  <p className="text-sm">Salva la connessione e premi "Sincronizza Instagram".</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {posts.map((post) => {
                    const image = postImage(post);
                    return (
                      <div key={post.id} className="rounded-md border border-border overflow-hidden bg-card">
                        <div className="aspect-square bg-muted">
                          {image ? (
                            <img src={image} alt={post.caption || "Instagram post"} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                              <Instagram className="w-8 h-8" />
                            </div>
                          )}
                        </div>
                        <div className="p-3 space-y-3">
                          <p className="text-xs text-muted-foreground line-clamp-3">
                            {post.caption || "Senza didascalia"}
                          </p>
                          <div className="flex items-center justify-between gap-2">
                            <Badge variant={post.is_visible ? "default" : "secondary"}>
                              {post.is_visible ? "Visibile" : "Nascosto"}
                            </Badge>
                            <span className="text-[11px] text-muted-foreground">
                              {formatDate(post.published_at)}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="flex-1" onClick={() => togglePostVisibility(post)}>
                              {post.is_visible ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
                              {post.is_visible ? "Nascondi" : "Mostra"}
                            </Button>
                            <Button size="sm" variant="outline" asChild>
                              <a href={post.permalink} target="_blank" rel="noopener noreferrer" aria-label="Apri su Instagram">
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => deletePost(post)}>
                              <Trash2 className="w-3 h-3 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
