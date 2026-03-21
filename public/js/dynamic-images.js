/**
 * Villa Paris — Dynamic Images from Supabase
 *
 * Script JS minimale (no framework) che carica le immagini dalla tabella
 * gallery_images di Supabase e le inietta nelle sezioni del sito pubblico.
 *
 * Funzionamento:
 * 1. L'HTML statico generato da Astro contiene immagini fallback.
 * 2. Questo script interroga Supabase (anon key, RLS SELECT pubblico).
 * 3. Per ogni sezione con immagini caricate dall'admin, sostituisce i fallback.
 * 4. Se non ci sono immagini per una sezione, il fallback statico resta visibile.
 */
(function () {
  'use strict';

  // Configurazione Supabase (anon key pubblica, sicura da esporre)
  var SUPABASE_URL = 'https://jalalwlaxtsejvzwuvvk.supabase.co';
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphbGFsd2xheHRzZWp2end1dnZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMDI0NjQsImV4cCI6MjA4NTc3ODQ2NH0.hFCHMQdlckaDW6ON9ZEnyA6kbF-lhTb48Tq6duiVXeg';
  var STORAGE_BASE = SUPABASE_URL + '/storage/v1/object/public/venue-photos/';

  function imgUrl(filePath) {
    return STORAGE_BASE + filePath;
  }

  /**
   * Fetch tutte le immagini dalla tabella gallery_images (RLS: SELECT pubblico).
   * Ordinate per order_index ascendente.
   */
  function fetchImages() {
    var url = SUPABASE_URL + '/rest/v1/gallery_images?select=*&order=order_index.asc';
    return fetch(url, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
      }
    })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .catch(function () {
        return []; // fallback: array vuoto, le immagini statiche restano
      });
  }

  /**
   * Filtra immagini per sezione.
   */
  function bySection(images, section) {
    return images.filter(function (img) { return img.section === section; });
  }

  /**
   * Sostituisce l'immagine in un elemento [data-dynamic-img] con la prima
   * immagine disponibile dalla sezione specificata.
   */
  function replaceSingleImage(el, sectionImages) {
    if (!sectionImages.length) return;
    var img = sectionImages[0];
    el.src = imgUrl(img.file_path);
    if (img.caption) el.alt = img.caption;
    el.removeAttribute('data-dynamic-img');
  }

  /**
   * Gestisce un container [data-dynamic-gallery] che mostra una griglia
   * di immagini da una o più sezioni.
   */
  function replaceGalleryGrid(container, allImages) {
    var sections = (container.getAttribute('data-dynamic-gallery') || '').split(',').map(function (s) { return s.trim(); });
    var images = [];

    if (sections.length === 1 && sections[0] === 'all') {
      images = allImages;
    } else {
      sections.forEach(function (sec) {
        images = images.concat(bySection(allImages, sec));
      });
    }

    if (!images.length) return;

    // Genera HTML per la griglia
    var html = '';
    images.forEach(function (img) {
      var caption = img.caption || img.file_name;
      var sectionLabel = img.section.replace(/-/g, ' ');
      html += '<div class="location-card group rounded-sm overflow-hidden bg-muted">' +
        '<img src="' + imgUrl(img.file_path) + '" alt="' + caption.replace(/"/g, '&quot;') + '" ' +
        'class="w-full h-64 object-cover" loading="lazy" />' +
        '<div class="location-card-overlay flex items-end p-5">' +
        '<div>' +
        '<p class="text-white text-sm font-body font-medium mb-2">' + caption + '</p>' +
        '<span class="text-[10px] uppercase tracking-wider bg-white/15 text-white/80 px-2 py-0.5 rounded-sm">' + sectionLabel + '</span>' +
        '</div></div></div>';
    });

    container.innerHTML = html;
  }

  /**
   * Gestisce un container [data-dynamic-slider] che mostra immagini
   * in modalità slider/carousel per la hero.
   */
  function replaceHeroSlider(container, sectionImages) {
    if (!sectionImages.length) return;

    // Se c'è una sola immagine, sostituisci semplicemente
    if (sectionImages.length === 1) {
      var heroImg = container.querySelector('img');
      if (heroImg) {
        heroImg.src = imgUrl(sectionImages[0].file_path);
        if (sectionImages[0].caption) heroImg.alt = sectionImages[0].caption;
      }
      return;
    }

    // Più immagini: crea uno slider semplice con crossfade
    var imgContainer = container.querySelector('[data-hero-images]') || container;
    var existingImg = imgContainer.querySelector('img');
    if (!existingImg) return;

    // Prepara tutte le immagini sovrapposte
    var wrapper = document.createElement('div');
    wrapper.style.cssText = 'position:absolute;inset:0;';

    sectionImages.forEach(function (img, i) {
      var el = document.createElement('img');
      el.src = imgUrl(img.file_path);
      el.alt = img.caption || 'Villa Paris';
      el.className = 'w-full h-full object-cover';
      el.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:opacity 1.5s ease;opacity:' + (i === 0 ? '1' : '0') + ';';
      el.setAttribute('data-slide-index', String(i));
      wrapper.appendChild(el);
    });

    existingImg.parentNode.insertBefore(wrapper, existingImg);
    existingImg.style.display = 'none';

    // Auto-rotate ogni 5 secondi
    var current = 0;
    var slides = wrapper.querySelectorAll('img');
    setInterval(function () {
      slides[current].style.opacity = '0';
      current = (current + 1) % slides.length;
      slides[current].style.opacity = '1';
    }, 5000);
  }

  /**
   * Gestisce le card "I Nostri Spazi" nella homepage.
   * Ogni card ha data-dynamic-img="section-key".
   */
  function replaceLocationCards(allImages) {
    var cards = document.querySelectorAll('[data-dynamic-img]');
    cards.forEach(function (el) {
      var section = el.getAttribute('data-dynamic-img');
      if (!section) return;
      var sectionImages = bySection(allImages, section);
      replaceSingleImage(el, sectionImages);
    });
  }

  /**
   * Entry point: carica le immagini e aggiorna il DOM.
   */
  function init() {
    fetchImages().then(function (allImages) {
      if (!allImages.length) return; // nessuna immagine caricata, i fallback restano

      // 1. Hero slider
      var heroSliders = document.querySelectorAll('[data-dynamic-slider]');
      heroSliders.forEach(function (container) {
        var section = container.getAttribute('data-dynamic-slider');
        var sectionImages = bySection(allImages, section);
        replaceHeroSlider(container, sectionImages);
      });

      // 2. Immagini singole (card location, intro, ecc.)
      replaceLocationCards(allImages);

      // 3. Gallerie dinamiche
      var galleries = document.querySelectorAll('[data-dynamic-gallery]');
      galleries.forEach(function (container) {
        replaceGalleryGrid(container, allImages);
      });
    });
  }

  // Avvia quando il DOM è pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
