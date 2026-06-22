/**
 * Villa Paris - Dynamic Images from Supabase
 *
 * Loads public gallery_images rows and replaces static Astro fallback images.
 * If Supabase has no images for a section, the static fallback remains visible.
 */
(function () {
  'use strict';

  var SUPABASE_URL = 'https://jalalwlaxtsejvzwuvvk.supabase.co';
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphbGFsd2xheHRzZWp2end1dnZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMDI0NjQsImV4cCI6MjA4NTc3ODQ2NH0.hFCHMQdlckaDW6ON9ZEnyA6kbF-lhTb48Tq6duiVXeg';
  var STORAGE_BASE = SUPABASE_URL + '/storage/v1/object/public/venue-photos/';

  function imgUrl(filePath) {
    return STORAGE_BASE + filePath;
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function fallbackSectionTags(section) {
    return String(section || '')
      .split('-')
      .map(function (tag) { return tag.trim().toLowerCase(); })
      .filter(Boolean);
  }

  function imageTags(img) {
    return Array.isArray(img.tags) && img.tags.length ? img.tags : fallbackSectionTags(img.section);
  }

  function tagLabel(tag) {
    return String(tag || '').replace(/-/g, ' ');
  }

  function normalizeGalleryTag(tag) {
    var aliases = {
      cuisine: 'cucina',
      cusine: 'cucina',
      kitchen: 'cucina'
    };
    var normalized = String(tag || '').trim().toLowerCase();
    return aliases[normalized] || normalized;
  }

  function currentGalleryTag(el) {
    var tag = new URLSearchParams(window.location.search).get('tag') || (el && el.getAttribute('data-gallery-current-tag')) || '';
    return normalizeGalleryTag(tag);
  }

  function localizedTagLabel(tag, locale) {
    var enLabels = {
      arredi: 'Furnishings',
      cerimonia: 'Ceremony',
      cuisine: 'Cuisine',
      cucina: 'Kitchen',
      dettagli: 'Details',
      esterni: 'Exteriors',
      evento: 'Events',
      fiori: 'Flowers',
      giardino: 'Garden',
      interni: 'Interiors',
      notte: 'Evening',
      piscina: 'Pool',
      ricevimento: 'Reception',
      sale: 'Halls',
      salone: 'Lounge',
      tramonto: 'Sunset',
      vista: 'View'
    };
    var itLabels = {
      arredi: 'Arredi',
      cerimonia: 'Cerimonia',
      cuisine: 'Cucina',
      cucina: 'Cucina',
      dettagli: 'Dettagli',
      esterni: 'Esterni',
      evento: 'Evento',
      fiori: 'Fiori',
      giardino: 'Giardino',
      interni: 'Interni',
      location: 'Location',
      momenti: 'Momenti',
      notte: 'Notte',
      piscina: 'Piscina',
      ricevimento: 'Ricevimento',
      ricorrenze: 'Ricorrenze',
      sale: 'Sale',
      salone: 'Salone',
      tramonto: 'Tramonto',
      vista: 'Vista'
    };
    tag = normalizeGalleryTag(tag);
    if (String(locale || '').toLowerCase().indexOf('en') === 0 && enLabels[tag]) {
      return enLabels[tag];
    }
    if (itLabels[tag]) {
      return itLabels[tag];
    }
    return tagLabel(tag).replace(/\b\w/g, function (letter) { return letter.toUpperCase(); });
  }

  function matchesGalleryTag(img, currentTag) {
    currentTag = normalizeGalleryTag(currentTag);
    if (!currentTag) return true;
    var tags = imageTags(img).map(normalizeGalleryTag);
    return tags.indexOf(currentTag) !== -1 || normalizeGalleryTag(img.section) === currentTag;
  }

  function captionForLocale(img, locale) {
    if (String(locale || '').toLowerCase().indexOf('en') === 0) {
      return img.caption_en || img.caption || img.file_name || 'Villa Paris';
    }
    return img.caption || img.file_name || 'Villa Paris';
  }

  function fetchImages() {
    var url = SUPABASE_URL + '/rest/v1/gallery_images?select=*&order=order_index.asc';
    return fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: 'Bearer ' + SUPABASE_ANON_KEY
      }
    })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .catch(function () {
        return [];
      });
  }

  function bySection(images, section) {
    return images.filter(function (img) { return img.section === section; });
  }

  function replaceSingleImage(el, sectionImages) {
    if (!sectionImages.length) return;
    var img = sectionImages[0];
    var locale = document.documentElement.lang || 'it';
    var caption = captionForLocale(img, locale);
    el.src = imgUrl(img.file_path);
    el.alt = caption;
    el.removeAttribute('data-dynamic-img');
  }

  function replaceGalleryGrid(container, allImages) {
    var sections = (container.getAttribute('data-dynamic-gallery') || '')
      .split(',')
      .map(function (s) { return s.trim(); })
      .filter(Boolean);
    var currentTag = currentGalleryTag(container);
    var locale = container.getAttribute('data-gallery-locale') || document.documentElement.lang || 'it';
    var images = [];

    if (sections.length === 1 && sections[0] === 'all') {
      images = allImages.slice();
    } else {
      sections.forEach(function (sec) {
        images = images.concat(bySection(allImages, sec));
      });
    }

    images = images
      .filter(function (img) { return matchesGalleryTag(img, currentTag); })
      .sort(function (a, b) { return (a.order_index || 0) - (b.order_index || 0); });

    if (!images.length) return;

    var html = '';
    images.forEach(function (img) {
      var caption = captionForLocale(img, locale);
      var tags = imageTags(img).slice(0, 3);

      html += '<div class="location-card group rounded-sm overflow-hidden bg-muted aspect-square" data-gallery-item data-gallery-tags="' + escapeHtml(imageTags(img).join(',')) + '">' +
        '<img src="' + escapeHtml(imgUrl(img.file_path)) + '" alt="' + escapeHtml(caption) + '" ' +
        'class="w-full h-full object-cover" loading="lazy" />' +
        '<div class="location-card-overlay flex items-end p-5">' +
        '<div>' +
        '<p class="text-white text-sm font-body font-medium mb-2">' + escapeHtml(caption) + '</p>' +
        '<div class="flex flex-wrap gap-1.5">';

      tags.forEach(function (tag) {
        html += '<span class="text-[10px] uppercase tracking-wider bg-white/15 text-white/80 px-2 py-0.5 rounded-sm">' +
          escapeHtml(localizedTagLabel(tag, locale)) +
          '</span>';
      });

      html += '</div></div></div></div>';
    });

    container.innerHTML = html;
  }

  function galleryCountLabel(count, locale) {
    var isEn = String(locale || '').toLowerCase().indexOf('en') === 0;
    if (isEn) return count + ' ' + (count === 1 ? 'image' : 'images');
    return count + ' ' + (count === 1 ? 'immagine' : 'immagini');
  }

  function replaceGalleryTagNav(allImages) {
    document.querySelectorAll('[data-gallery-tags-nav]').forEach(function (nav) {
      var basePath = nav.getAttribute('data-gallery-base-path') || window.location.pathname;
      var currentTag = currentGalleryTag(nav);
      var locale = nav.getAttribute('data-gallery-locale') || document.documentElement.lang || 'it';
      var isEn = String(locale).toLowerCase().indexOf('en') === 0;
      var counts = {};

      allImages.forEach(function (img) {
        imageTags(img).forEach(function (tag) {
          counts[tag] = (counts[tag] || 0) + 1;
        });
      });

      var tags = Object.keys(counts).sort(function (a, b) {
        return localizedTagLabel(a, locale).localeCompare(localizedTagLabel(b, locale));
      });

      if (!tags.length) return;

      var linkClass = 'flex min-w-max items-center justify-between gap-4 rounded-sm px-3 py-2 text-sm transition-colors';
      var activeClass = 'bg-primary text-primary-foreground';
      var inactiveClass = 'text-foreground/70 hover:bg-muted hover:text-foreground';
      var html = '';

      html += '<a href="' + escapeHtml(basePath) + '" class="' + linkClass + ' ' + (!currentTag ? activeClass : inactiveClass) + '">' +
        '<span>' + (isEn ? 'All Photos' : 'Tutte le foto') + '</span>' +
        '<span class="text-xs opacity-70">' + allImages.length + '</span>' +
        '</a>';

      tags.forEach(function (tag) {
        var href = basePath + '?tag=' + encodeURIComponent(tag);
        html += '<a href="' + escapeHtml(href) + '" class="' + linkClass + ' ' + (currentTag === tag ? activeClass : inactiveClass) + '">' +
          '<span>' + escapeHtml(localizedTagLabel(tag, locale)) + '</span>' +
          '<span class="text-xs opacity-70">' + counts[tag] + '</span>' +
          '</a>';
      });

      nav.innerHTML = html;

      var selectedImages = currentTag
        ? allImages.filter(function (img) { return matchesGalleryTag(img, currentTag); })
        : allImages;
      var section = nav.closest('section');
      var heading = section ? section.querySelector('[data-gallery-heading]') : null;
      var count = section ? section.querySelector('[data-gallery-count]') : null;
      if (heading) heading.textContent = currentTag ? localizedTagLabel(currentTag, locale) : (isEn ? 'All Photos' : 'Tutte le foto');
      if (count) count.textContent = galleryCountLabel(selectedImages.length, locale);
    });
  }

  function staticGalleryItems(container) {
    return Array.prototype.slice.call(container.querySelectorAll('[data-gallery-item]'));
  }

  function itemMatchesTag(item, currentTag) {
    if (!currentTag) return true;
    var tags = String(item.getAttribute('data-gallery-tags') || '')
      .split(',')
      .map(normalizeGalleryTag)
      .filter(Boolean);
    return tags.indexOf(normalizeGalleryTag(currentTag)) !== -1;
  }

  function galleryLightboxItems() {
    return Array.prototype.slice.call(document.querySelectorAll('[data-dynamic-gallery] [data-gallery-item]'))
      .filter(function (item) { return !item.hidden; })
      .map(function (item) {
        var img = item.querySelector('img');
        var caption = item.querySelector('p');
        if (!img) return null;
        return {
          el: item,
          src: img.currentSrc || img.src,
          alt: img.alt || 'Villa Paris',
          caption: caption ? caption.textContent.trim() : (img.alt || '')
        };
      })
      .filter(Boolean);
  }

  function ensureGalleryLightbox() {
    var existing = document.getElementById('gallery-lightbox');
    if (existing) return existing;

    var overlay = document.createElement('div');
    overlay.id = 'gallery-lightbox';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;display:none;align-items:center;justify-content:center;background:rgba(10,8,6,.94);padding:24px;';
    overlay.innerHTML =
      '<button type="button" data-lightbox-close aria-label="Chiudi" style="position:absolute;top:18px;right:18px;width:44px;height:44px;border:1px solid rgba(255,255,255,.25);border-radius:999px;background:rgba(255,255,255,.08);color:white;font-size:28px;line-height:1;cursor:pointer;">&times;</button>' +
      '<button type="button" data-lightbox-prev aria-label="Immagine precedente" style="position:absolute;left:18px;top:50%;transform:translateY(-50%);width:46px;height:46px;border:1px solid rgba(255,255,255,.25);border-radius:999px;background:rgba(255,255,255,.08);color:white;font-size:32px;line-height:1;cursor:pointer;">&#8249;</button>' +
      '<figure style="width:min(1180px,100%);height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;margin:0;">' +
      '<img data-lightbox-img alt="" style="max-width:100%;max-height:82vh;object-fit:contain;box-shadow:0 24px 80px rgba(0,0,0,.45);" />' +
      '<figcaption data-lightbox-caption style="max-width:860px;margin-top:16px;color:rgba(255,255,255,.82);font:400 15px/1.6 system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;text-align:center;"></figcaption>' +
      '</figure>' +
      '<button type="button" data-lightbox-next aria-label="Immagine successiva" style="position:absolute;right:18px;top:50%;transform:translateY(-50%);width:46px;height:46px;border:1px solid rgba(255,255,255,.25);border-radius:999px;background:rgba(255,255,255,.08);color:white;font-size:32px;line-height:1;cursor:pointer;">&#8250;</button>';

    document.body.appendChild(overlay);
    return overlay;
  }

  function openGalleryLightbox(startItem) {
    var items = galleryLightboxItems();
    var index = items.findIndex(function (item) { return item.el === startItem; });
    if (index < 0) return;

    var overlay = ensureGalleryLightbox();
    var img = overlay.querySelector('[data-lightbox-img]');
    var caption = overlay.querySelector('[data-lightbox-caption]');
    var previousOverflow = document.body.style.overflow;

    function show(nextIndex) {
      index = (nextIndex + items.length) % items.length;
      img.src = items[index].src;
      img.alt = items[index].alt;
      caption.textContent = items[index].caption || '';
    }

    function close() {
      overlay.style.display = 'none';
      overlay.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    }

    function onKeyDown(event) {
      if (event.key === 'Escape') close();
      if (event.key === 'ArrowLeft') show(index - 1);
      if (event.key === 'ArrowRight') show(index + 1);
    }

    overlay.onclick = function (event) {
      var target = event.target && event.target.closest ? event.target : null;
      if (event.target === overlay || (target && target.closest('[data-lightbox-close]'))) close();
      if (target && target.closest('[data-lightbox-prev]')) show(index - 1);
      if (target && target.closest('[data-lightbox-next]')) show(index + 1);
    };

    overlay.style.display = 'flex';
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);
    show(index);
  }

  function enableGalleryLightbox() {
    document.querySelectorAll('[data-dynamic-gallery] [data-gallery-item]').forEach(function (item) {
      item.style.cursor = 'zoom-in';
    });

    if (document.body.getAttribute('data-gallery-lightbox-ready') === 'true') return;
    document.body.setAttribute('data-gallery-lightbox-ready', 'true');
    document.addEventListener('click', function (event) {
      if (!event.target || !event.target.closest) return;
      var item = event.target.closest('[data-dynamic-gallery] [data-gallery-item]');
      if (!item || item.hidden) return;
      event.preventDefault();
      openGalleryLightbox(item);
    });
  }

  function applyStaticGalleryState() {
    document.querySelectorAll('[data-dynamic-gallery]').forEach(function (container) {
      var items = staticGalleryItems(container);
      if (!items.length) return;

      var currentTag = currentGalleryTag(container);
      var locale = container.getAttribute('data-gallery-locale') || document.documentElement.lang || 'it';
      var visibleCount = 0;

      items.forEach(function (item) {
        var visible = itemMatchesTag(item, currentTag);
        item.hidden = !visible;
        if (visible) visibleCount += 1;
      });

      var section = container.closest('section');
      var heading = section ? section.querySelector('[data-gallery-heading]') : null;
      var count = section ? section.querySelector('[data-gallery-count]') : null;
      var isEn = String(locale).toLowerCase().indexOf('en') === 0;
      if (heading) heading.textContent = currentTag ? localizedTagLabel(currentTag, locale) : (isEn ? 'All Photos' : 'Tutte le foto');
      if (count) count.textContent = galleryCountLabel(visibleCount, locale);
    });

    document.querySelectorAll('[data-gallery-tags-nav]').forEach(function (nav) {
      var currentTag = currentGalleryTag(nav);
      var locale = nav.getAttribute('data-gallery-locale') || document.documentElement.lang || 'it';
      nav.querySelectorAll('a[href]').forEach(function (link) {
        var url = new URL(link.getAttribute('href'), window.location.origin);
        var linkTag = normalizeGalleryTag(url.searchParams.get('tag') || '');
        var active = linkTag === currentTag;
        link.className = link.className
          .replace('bg-primary text-primary-foreground', '')
          .replace('text-foreground/70 hover:bg-muted hover:text-foreground', '')
          .trim();
        link.className += active
          ? ' bg-primary text-primary-foreground'
          : ' text-foreground/70 hover:bg-muted hover:text-foreground';
        if (linkTag && link.querySelector('span')) {
          link.querySelector('span').textContent = localizedTagLabel(linkTag, locale);
        }
      });
    });

    enableGalleryLightbox();
  }

  function replaceHeroSlider(container, sectionImages) {
    if (!sectionImages.length) return;

    if (sectionImages.length === 1) {
      var heroImg = container.querySelector('img');
      if (heroImg) {
        heroImg.src = imgUrl(sectionImages[0].file_path);
        heroImg.alt = captionForLocale(sectionImages[0], document.documentElement.lang || 'it');
      }
      return;
    }

    var imgContainer = container.querySelector('[data-hero-images]') || container;
    var existingImg = imgContainer.querySelector('img');
    if (!existingImg) return;

    var wrapper = document.createElement('div');
    wrapper.style.cssText = 'position:absolute;inset:0;';

    sectionImages.forEach(function (img, i) {
      var el = document.createElement('img');
      el.src = imgUrl(img.file_path);
      el.alt = captionForLocale(img, document.documentElement.lang || 'it');
      el.className = 'w-full h-full object-cover';
      el.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:opacity 1.5s ease;opacity:' + (i === 0 ? '1' : '0') + ';';
      el.setAttribute('data-slide-index', String(i));
      wrapper.appendChild(el);
    });

    existingImg.parentNode.insertBefore(wrapper, existingImg);
    existingImg.style.display = 'none';

    var current = 0;
    var slides = wrapper.querySelectorAll('img');
    setInterval(function () {
      slides[current].style.opacity = '0';
      current = (current + 1) % slides.length;
      slides[current].style.opacity = '1';
    }, 5000);
  }

  function replaceLocationCards(allImages) {
    var cards = document.querySelectorAll('[data-dynamic-img]');
    cards.forEach(function (el) {
      var section = el.getAttribute('data-dynamic-img');
      if (!section) return;
      replaceSingleImage(el, bySection(allImages, section));
    });
  }

  function init() {
    applyStaticGalleryState();

    fetchImages().then(function (allImages) {
      if (!allImages.length) return;

      document.querySelectorAll('[data-dynamic-slider]').forEach(function (container) {
        replaceHeroSlider(container, bySection(allImages, container.getAttribute('data-dynamic-slider')));
      });

      replaceLocationCards(allImages);

      document.querySelectorAll('[data-dynamic-gallery]').forEach(function (container) {
        replaceGalleryGrid(container, allImages);
      });

      replaceGalleryTagNav(allImages);
      enableGalleryLightbox();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
