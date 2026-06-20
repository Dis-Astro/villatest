import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type SocialConnection = {
  id: string;
  provider: string;
  account_name: string;
  account_id: string | null;
  access_token: string | null;
  is_enabled: boolean;
};

type InstagramMedia = {
  id: string;
  caption?: string;
  media_type?: string;
  media_url?: string;
  thumbnail_url?: string;
  permalink?: string;
  timestamp?: string;
  children?: {
    data?: Array<{
      media_type?: string;
      media_url?: string;
      thumbnail_url?: string;
      permalink?: string;
    }>;
  };
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function assertAdmin(req: Request, supabaseUrl: string, anonKey: string) {
  const authorization = req.headers.get("Authorization");
  if (!authorization) {
    throw new Response(JSON.stringify({ success: false, error: "Sessione admin mancante" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
  });

  const { data, error } = await userClient.rpc("is_admin");
  if (error || data !== true) {
    throw new Response(JSON.stringify({ success: false, error: "Permessi insufficienti" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

function bestMediaUrl(item: InstagramMedia): string | null {
  if (item.media_url) return item.media_url;

  const firstChild = item.children?.data?.find((child) => child.media_url || child.thumbnail_url);
  if (!firstChild) return null;
  return firstChild.media_url || firstChild.thumbnail_url || null;
}

function bestThumbnailUrl(item: InstagramMedia): string | null {
  if (item.thumbnail_url) return item.thumbnail_url;
  if (item.media_type === "VIDEO") return item.media_url || null;

  const firstChild = item.children?.data?.find((child) => child.thumbnail_url || child.media_url);
  if (!firstChild) return null;
  return firstChild.thumbnail_url || firstChild.media_url || null;
}

async function fetchInstagramMedia(connection: SocialConnection, limit: number) {
  if (!connection.account_id || !connection.access_token) {
    throw new Error("Configura Instagram Business Account ID e access token");
  }

  const graphVersion = Deno.env.get("META_GRAPH_VERSION") || "v23.0";
  const fields = [
    "id",
    "caption",
    "media_type",
    "media_url",
    "thumbnail_url",
    "permalink",
    "timestamp",
    "children{media_type,media_url,thumbnail_url,permalink}",
  ].join(",");

  const url = new URL(`https://graph.facebook.com/${graphVersion}/${connection.account_id}/media`);
  url.searchParams.set("fields", fields);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("access_token", connection.access_token);

  const res = await fetch(url.toString());
  const payload = await res.json();

  if (!res.ok) {
    const message = payload?.error?.message || `Errore Meta API ${res.status}`;
    throw new Error(message);
  }

  return (payload?.data || []) as InstagramMedia[];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ success: false, error: "Metodo non consentito" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  let requestBody: { connectionId?: string; limit?: number } = {};

  try {
    await assertAdmin(req, supabaseUrl, anonKey);

    requestBody = await req.json();
    const { connectionId, limit = 12 } = requestBody;
    if (!connectionId) return json({ success: false, error: "connectionId mancante" }, 400);

    const serviceClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: connection, error: connectionError } = await serviceClient
      .from("social_connections")
      .select("*")
      .eq("id", connectionId)
      .single();

    if (connectionError || !connection) {
      return json({ success: false, error: "Connessione social non trovata" }, 404);
    }

    const typedConnection = connection as SocialConnection;
    if (typedConnection.provider !== "instagram") {
      return json({ success: false, error: "Sync disponibile solo per Instagram" }, 400);
    }
    if (!typedConnection.is_enabled) {
      return json({ success: false, error: "Connessione disattivata" }, 400);
    }

    const media = await fetchInstagramMedia(typedConnection, Math.min(Number(limit) || 12, 50));
    const rows = media
      .filter((item) => item.id && item.permalink)
      .map((item, index) => ({
        connection_id: typedConnection.id,
        provider: "instagram",
        provider_post_id: item.id,
        media_type: item.media_type || null,
        media_url: bestMediaUrl(item),
        thumbnail_url: bestThumbnailUrl(item),
        permalink: item.permalink!,
        caption: item.caption || null,
        published_at: item.timestamp || null,
        sort_index: index,
        raw: item,
      }));

    if (rows.length > 0) {
      const { error: upsertError } = await serviceClient
        .from("social_posts")
        .upsert(rows, { onConflict: "provider,provider_post_id" });

      if (upsertError) throw upsertError;
    }

    await serviceClient
      .from("social_connections")
      .update({
        last_sync_at: new Date().toISOString(),
        last_sync_error: null,
      })
      .eq("id", typedConnection.id);

    return json({ success: true, imported: rows.length });
  } catch (err) {
    if (err instanceof Response) return err;

    const message = err instanceof Error ? err.message : "Errore sconosciuto";
    console.error("sync-instagram-posts error:", err);

    try {
      const { connectionId } = requestBody;
      if (connectionId) {
        const serviceClient = createClient(supabaseUrl, serviceRoleKey);
        await serviceClient
          .from("social_connections")
          .update({ last_sync_error: message })
          .eq("id", connectionId);
      }
    } catch {
      // Ignore error logging failures.
    }

    return json({ success: false, error: message }, 500);
  }
});
