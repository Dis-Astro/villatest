/**
 * Supabase Edge Function: send-contact-email
 *
 * Riceve i dati del form contatti dal sito pubblico e invia una email reale
 * usando la configurazione SMTP salvata nella tabella smtp_config dall'admin.
 *
 * Flusso:
 * 1. Valida i dati ricevuti (nome, email, messaggio, tipo evento)
 * 2. Controlla honeypot antispam
 * 3. Legge la configurazione SMTP dalla tabella smtp_config (service_role)
 * 4. Invia l'email via SMTP usando la libreria denomailer
 * 5. Restituisce successo o errore reale
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SmtpClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

// CORS headers per richieste dal sito pubblico
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  eventType: string;
  eventDate?: string;
  message: string;
  locale?: string;
  // Honeypot field — must be empty
  website?: string;
}

interface SmtpConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  use_tls: boolean;
  sender_email: string;
  sender_name: string;
}

/**
 * Validazione lato server dei dati del form.
 */
function validateForm(data: ContactFormData): string | null {
  if (!data.name || data.name.trim().length < 2) {
    return "Il nome è obbligatorio (minimo 2 caratteri).";
  }
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    return "Indirizzo email non valido.";
  }
  if (!data.eventType || data.eventType.trim().length === 0) {
    return "Il tipo di evento è obbligatorio.";
  }
  if (!data.message || data.message.trim().length < 10) {
    return "Il messaggio è obbligatorio (minimo 10 caratteri).";
  }
  // Honeypot check
  if (data.website && data.website.trim().length > 0) {
    return "__spam__";
  }
  return null;
}

/**
 * Costruisce il corpo HTML dell'email.
 */
function buildEmailHtml(data: ContactFormData): string {
  const eventTypeLabels: Record<string, string> = {
    matrimonio: "Matrimonio",
    "evento-privato": "Evento Privato",
    "evento-aziendale": "Evento Aziendale",
    wedding: "Wedding",
    "private-event": "Private Event",
    "corporate-event": "Corporate Event",
    altro: "Altro",
    other: "Other",
  };

  const eventLabel = eventTypeLabels[data.eventType] || data.eventType;
  const dateStr = data.eventDate || "Non specificata";
  const phoneStr = data.phone || "Non fornito";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Georgia, 'Times New Roman', serif; color: #2d3a2e; background: #faf9f6; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .header { text-align: center; border-bottom: 2px solid #c9a96e; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { font-size: 24px; font-weight: 300; color: #2d3a2e; letter-spacing: 2px; margin: 0; }
    .header p { font-size: 12px; color: #8a8a7a; text-transform: uppercase; letter-spacing: 3px; margin-top: 8px; }
    .field { margin-bottom: 20px; }
    .field-label { font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #8a8a7a; margin-bottom: 4px; }
    .field-value { font-size: 15px; color: #2d3a2e; line-height: 1.6; }
    .message-box { background: #f5f3ee; border-left: 3px solid #c9a96e; padding: 16px 20px; margin-top: 10px; }
    .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e2db; font-size: 11px; color: #8a8a7a; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Villa Paris</h1>
      <p>Nuova richiesta dal sito web</p>
    </div>

    <div class="field">
      <div class="field-label">Nome e Cognome</div>
      <div class="field-value">${escapeHtml(data.name)}</div>
    </div>

    <div class="field">
      <div class="field-label">Email</div>
      <div class="field-value"><a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a></div>
    </div>

    <div class="field">
      <div class="field-label">Telefono</div>
      <div class="field-value">${escapeHtml(phoneStr)}</div>
    </div>

    <div class="field">
      <div class="field-label">Tipo di Evento</div>
      <div class="field-value">${escapeHtml(eventLabel)}</div>
    </div>

    <div class="field">
      <div class="field-label">Data Evento</div>
      <div class="field-value">${escapeHtml(dateStr)}</div>
    </div>

    <div class="field">
      <div class="field-label">Messaggio</div>
      <div class="message-box">${escapeHtml(data.message).replace(/\n/g, "<br>")}</div>
    </div>

    <div class="footer">
      Questa email è stata inviata automaticamente dal form contatti di villaparis.rosetoabruzzo.it
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Metodo non consentito" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // 1. Parse body
    const data: ContactFormData = await req.json();

    // 2. Validate
    const validationError = validateForm(data);
    if (validationError === "__spam__") {
      // Silently accept spam to not reveal the honeypot
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (validationError) {
      return new Response(
        JSON.stringify({ success: false, error: validationError }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Read SMTP config from Supabase (using service_role key for admin-only table)
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: smtpData, error: smtpError } = await supabase
      .from("smtp_config")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (smtpError || !smtpData) {
      console.error("SMTP config error:", smtpError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Configurazione email non disponibile. Contattaci direttamente al telefono.",
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const smtp: SmtpConfig = smtpData;

    // 4. Send email via SMTP
    const client = new SmtpClient();

    const connectConfig: any = {
      hostname: smtp.host,
      port: smtp.port,
      username: smtp.username,
      password: smtp.password,
    };

    if (smtp.use_tls) {
      await client.connectTLS(connectConfig);
    } else {
      await client.connect(connectConfig);
    }

    const subject = `Nuova richiesta: ${data.eventType} — ${data.name}`;

    await client.send({
      from: `${smtp.sender_name} <${smtp.sender_email}>`,
      to: smtp.sender_email, // Invia al destinatario configurato (l'admin stesso)
      replyTo: data.email,
      subject: subject,
      content: buildEmailHtml(data),
      html: buildEmailHtml(data),
    });

    await client.close();

    // 5. Success
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Send email error:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Errore durante l'invio dell'email. Riprova più tardi o contattaci telefonicamente.",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
