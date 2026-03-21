# Villa Paris - Sito Web

Sito web per Villa Paris, location per matrimoni ed eventi a Roseto degli Abruzzi (TE).

## Architettura

Il progetto si compone di due parti indipendenti:

| Componente | Stack | Percorso | Output |
|---|---|---|---|
| **Sito pubblico** | Astro SSG + Tailwind CSS | `/` (root) | `dist/` |
| **Admin** | React + Vite + TypeScript | `/admin-app/` (sorgente) | `public/admin/` (build) |

Il sito pubblico e statico, generato con Astro, e l'admin e una SPA React separata servita sotto `/admin/`.

## Sito Pubblico

### Caratteristiche

- **Static Site Generation** con Astro: HTML puro, nessun framework JS nel bundle finale
- **SEO-first**: meta tag completi, sitemap XML, robots.txt, JSON-LD (LocalBusiness)
- **Multilingua IT/EN**: italiano sulla root (`/`), inglese su `/en/`
- **No-JS baseline**: il sito funziona correttamente anche con JavaScript disabilitato
- **Immagini dinamiche**: JS progressivo carica immagini da Supabase se disponibili, altrimenti usa le statiche
- **Form contatti reale**: invio email tramite Supabase Edge Function + SMTP configurato dall'admin
- **Performance**: lazy loading immagini, CSS ottimizzato, font preconnect
- **Design system**: palette verde scuro / oro / avorio, tipografia serif + sans

### Struttura pagine

| Pagina | IT | EN |
|---|---|---|
| Home | `/` | `/en/` |
| Matrimoni | `/matrimoni/` | `/en/weddings/` |
| Galleria | `/galleria/` | `/en/gallery/` |
| Contatti | `/contatti/` | `/en/contacts/` |
| Grazie | `/contatti/grazie/` | `/en/contacts/thank-you/` |

### Contenuti

I contenuti sono gestiti tramite file TypeScript in `src/content/`:

- `settings.ts`: navigazione, contatti, CTA, social
- `pages.ts`: hero, sezioni, SEO metadata per ogni pagina
- `gallery.ts`: immagini galleria con tag e caption multilingua

Per modificare testi o immagini statiche, editare i file in `src/content/` e rifare la build.

### Immagini dinamiche da Supabase

Lo script `public/js/dynamic-images.js` implementa un enhancement progressivo: se l'admin ha caricato immagini su Supabase, queste sostituiscono le statiche. Il meccanismo funziona tramite attributi `data-dynamic-*` sugli elementi HTML.

| Attributo | Funzione |
|---|---|
| `data-dynamic-hero="section"` | Sostituisce il background-image dell'hero con la prima immagine della sezione |
| `data-dynamic-img="section"` | Sostituisce il `src` di un `<img>` con la prima immagine della sezione |
| `data-dynamic-gallery` | Popola la griglia galleria con tutte le immagini da Supabase |

**Sezioni admin mappate al pubblico:**

| Sezione admin | Dove appare nel sito |
|---|---|
| `hero` | Hero homepage |
| `location-interior` | Card "Interni" nella homepage, hero matrimoni |
| `location-exterior` | Card "Esterni" nella homepage |
| `location-cuisine` | Card "Allestimenti" nella homepage |
| `events-ricorrenze` | Immagine "Ricorrenze" nella homepage |
| `events-momenti` | Immagine "Eventi aziendali" nella homepage |
| `opere-arte` | Galleria |

Se JavaScript e disabilitato o Supabase non e raggiungibile, il sito mostra le immagini statiche da `public/images/`.

### Form contatti

Il form contatti (`public/js/contact-form.js`) invia i dati a una Supabase Edge Function (`supabase/functions/send-contact-email/index.ts`) che:

1. Legge la configurazione SMTP dalla tabella `smtp_config`
2. Invia l'email con i dati del form al destinatario configurato
3. Mostra un messaggio di conferma e reindirizza alla pagina di ringraziamento

Senza JavaScript il form ha un `action` di fallback verso la pagina di ringraziamento.

## Admin

L'admin e una SPA React separata con:

- Autenticazione tramite Supabase Auth
- Gestione galleria con drag-and-drop organizzata per sezioni
- Configurazione SMTP per l'invio email dal form contatti
- Dashboard di controllo con statistiche

Il codice sorgente si trova in `admin-app/`. La build produce output in `public/admin/`, che viene incluso nella build Astro finale.

### Variabili d'ambiente admin

Creare `admin-app/.env` con:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Sezioni galleria admin

L'admin organizza le immagini in sezioni che corrispondono alle aree del sito pubblico:

| Sezione | Descrizione |
|---|---|
| Home Page | Immagine principale hero del sito |
| Interni | Foto degli ambienti interni |
| Esterni | Foto dei giardini e spazi esterni |
| Allestimenti | Mise en place e decorazioni |
| Eventi - Ricorrenze | Battesimi, comunioni, compleanni |
| Eventi - Aziendali | Meeting, cene di lavoro |
| Opere d'Arte | Opere esposte nella villa |

## Sviluppo

```bash
# Installazione dipendenze (entrambi i progetti)
npm install
cd admin-app && npm install && cd ..

# Server di sviluppo (solo sito pubblico)
npm run dev

# Server di sviluppo admin (separato)
cd admin-app && npm run dev
```

## Build per produzione

```bash
# Build completa (admin + pubblico)
npm run build:all

# Oppure separatamente:
npm run build:admin    # compila admin in public/admin/
npm run build          # compila Astro in dist/
```

Il comando `build:all` esegue in sequenza:
1. Build dell'admin React (`admin-app/`) con output in `public/admin/`
2. Build di Astro che copia `public/` (incluso `admin/`) in `dist/`

### Cartella da caricare sul server

Tutto il contenuto di `dist/`:

```bash
rsync -av dist/ user@server:/var/www/villaparis/
```

## Configurazione server

### Nginx (consigliata)

```nginx
server {
    listen 80;
    server_name villaparis.rosetoabruzzo.it;
    root /var/www/villaparis;
    index index.html;

    # Gzip
    gzip on;
    gzip_types text/css application/javascript image/svg+xml application/json;

    # Cache asset statici
    location ~* \.(css|js|png|jpg|jpeg|webp|gif|ico|svg|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Sito pubblico statico: file diretti
    location / {
        try_files $uri $uri/ $uri.html =404;
    }

    # Admin SPA: fallback a index.html per client-side routing
    location /admin/ {
        try_files $uri $uri/ /admin/index.html;
    }
}
```

### Apache

```apache
# .htaccess nella root del sito
<IfModule mod_rewrite.c>
    RewriteEngine On

    # Admin SPA fallback
    RewriteCond %{REQUEST_URI} ^/admin/
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^ /admin/index.html [L]

    # Sito pubblico: nessun rewrite (file statici)
</IfModule>

<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/css application/javascript image/svg+xml
</IfModule>

<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/webp "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
</IfModule>
```

## Supabase Edge Function

La Edge Function `send-contact-email` va deployata su Supabase:

```bash
# Deploy della Edge Function
supabase functions deploy send-contact-email
```

Assicurarsi che il progetto Supabase abbia:
- La tabella `smtp_config` con la configurazione email (gestita dall'admin)
- La tabella `gallery_images` per le immagini (gestita dall'admin)
- Lo storage bucket `venue-photos` per i file immagine

## Note IT/EN

- L'italiano e la lingua predefinita, servito dalla root `/`
- L'inglese e servito sotto `/en/`
- Ogni pagina ha tag `hreflang` corretti per SEO multilingua
- Il language switcher nel header permette di cambiare lingua

## Note /admin

- L'admin e accessibile su `/admin/`
- Richiede autenticazione Supabase
- Il `robots.txt` blocca l'indicizzazione di `/admin/`
- L'admin non interferisce con il sito pubblico statico
- Per il primo accesso: registrarsi, poi usare il pulsante "Promuovimi ad Admin" nella dashboard

## Immagini

Le immagini statiche sono in formato WebP in `public/images/`:

```
public/images/
  hero/           # Hero images (1920x1080)
  gallery/        # Galleria (800x600)
  spaces/         # Spazi della villa
  og/             # Open Graph (1200x630)
```

Le immagini dinamiche caricate dall'admin vanno su Supabase Storage (bucket `venue-photos`) e vengono servite direttamente da Supabase CDN.

## Struttura progetto

```
/
  src/
    components/       # Header.astro, Footer.astro
    content/          # Contenuti statici (settings, pages, gallery)
    layouts/          # Layout.astro
    pages/            # Pagine IT + /en/ per EN
    styles/           # global.css (design system)
  public/
    images/           # Immagini statiche (fallback)
    js/               # Script progressivi (dynamic-images, contact-form)
    admin/            # Build output admin (generato)
    robots.txt
  admin-app/          # Sorgente admin React/Vite
    src/
    package.json
    vite.config.ts
  supabase/
    functions/        # Edge Functions (send-contact-email)
    migrations/       # Schema database
    config.toml
  astro.config.mjs
  package.json
  tailwind.config.ts
```

## Licenza

Villa Paris. Tutti i diritti riservati.
