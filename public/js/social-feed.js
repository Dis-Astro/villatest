/**
 * Villa Paris - Public social feed from Supabase cache.
 *
 * Reads visible rows from social_posts and renders them into containers with:
 *   data-social-feed="instagram"
 */
(function () {
  'use strict';

  var SUPABASE_URL = 'https://jalalwlaxtsejvzwuvvk.supabase.co';
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphbGFsd2xheHRzZWp2end1dnZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMDI0NjQsImV4cCI6MjA4NTc3ODQ2NH0.hFCHMQdlckaDW6ON9ZEnyA6kbF-lhTb48Tq6duiVXeg';

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatDate(value, locale) {
    if (!value) return '';
    try {
      return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'it-IT', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }).format(new Date(value));
    } catch (_) {
      return '';
    }
  }

  function fetchPosts(provider, limit) {
    var params = [
      'select=provider,media_type,media_url,thumbnail_url,permalink,caption,published_at',
      'provider=eq.' + encodeURIComponent(provider),
      'is_visible=eq.true',
      'order=published_at.desc',
      'limit=' + encodeURIComponent(String(limit))
    ].join('&');

    return fetch(SUPABASE_URL + '/rest/v1/social_posts?' + params, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: 'Bearer ' + SUPABASE_ANON_KEY
      }
    }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    }).catch(function () {
      return [];
    });
  }

  function renderPost(post, locale) {
    var image = post.media_type === 'VIDEO'
      ? (post.thumbnail_url || post.media_url)
      : (post.media_url || post.thumbnail_url);

    if (!image || !post.permalink) return '';

    var caption = escapeHtml(post.caption || 'Villa Paris Instagram');
    var date = formatDate(post.published_at, locale);
    var label = locale === 'en' ? 'View on Instagram' : 'Vedi su Instagram';

    return '' +
      '<a class="location-card group rounded-sm overflow-hidden bg-muted block" href="' + escapeHtml(post.permalink) + '" target="_blank" rel="noopener noreferrer">' +
        '<div class="aspect-square overflow-hidden">' +
          '<img src="' + escapeHtml(image) + '" alt="' + caption + '" class="w-full h-full object-cover" loading="lazy" />' +
        '</div>' +
        '<div class="location-card-overlay flex items-end p-5">' +
          '<div>' +
            '<p class="text-white text-sm font-body font-medium mb-2">' + caption + '</p>' +
            '<span class="text-[10px] uppercase tracking-wider bg-white/15 text-white/80 px-2 py-0.5 rounded-sm">' + escapeHtml(label) + (date ? ' - ' + escapeHtml(date) : '') + '</span>' +
          '</div>' +
        '</div>' +
      '</a>';
  }

  function initFeed(container) {
    var provider = container.getAttribute('data-social-feed') || 'instagram';
    var limit = parseInt(container.getAttribute('data-limit') || '6', 10);
    var locale = container.getAttribute('data-locale') || document.documentElement.lang || 'it';
    var section = container.closest('[data-social-section]');

    fetchPosts(provider, limit).then(function (posts) {
      if (!posts.length) {
        if (section) section.setAttribute('hidden', '');
        return;
      }

      container.innerHTML = posts.map(function (post) {
        return renderPost(post, locale);
      }).join('');

      if (section) section.removeAttribute('hidden');
    });
  }

  function init() {
    var feeds = document.querySelectorAll('[data-social-feed]');
    feeds.forEach(initFeed);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
