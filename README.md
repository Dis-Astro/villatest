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

Per modificare testi o immagini, editare i file in `src/content/` e rifare la build.

## Admin

L'admin e una SPA React separata con:

- Autenticazione tramite Supabase Auth
- Gestione galleria con drag-and-drop
- Configurazione SMTP
- Dashboard di controllo

Il codice sorgente si trova in `admin-app/`. La build produce output in `public/admin/`, che viene incluso nella build Astro finale.

### Variabili d'ambiente admin

Creare `admin-app/.env` con:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

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
- Per il primo accesso, creare un utente admin tramite Supabase Dashboard

## Immagini

Le immagini sono in formato WebP in `public/images/`:

```
public/images/
  hero/           # Hero images (1920x1080)
  gallery/        # Galleria (800x600)
  spaces/         # Spazi della villa
  og/             # Open Graph (1200x630)
```

Per aggiungere o sostituire immagini:
1. Posizionare il file WebP nella cartella appropriata
2. Aggiornare il riferimento in `src/content/pages.ts` o `src/content/gallery.ts`
3. Rifare la build

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
    images/           # Immagini statiche
    admin/            # Build output admin (generato)
    robots.txt
  admin-app/          # Sorgente admin React/Vite
    src/
    package.json
    vite.config.ts
  astro.config.mjs
  package.json
  tailwind.config.ts
```

## Licenza

Villa Paris. Tutti i diritti riservati.
