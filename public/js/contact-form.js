/**
 * Villa Paris — Contact Form Handler
 *
 * Script JS minimale (no framework) che gestisce l'invio reale del form contatti
 * tramite la Supabase Edge Function send-contact-email.
 *
 * Funzionamento:
 * 1. Intercetta il submit del form
 * 2. Valida i campi lato client
 * 3. Invia i dati alla Edge Function via fetch
 * 4. Mostra successo reale o errore reale
 * 5. Redirect alla pagina grazie solo dopo invio riuscito
 */
(function () {
  'use strict';

  var SUPABASE_URL = 'https://jalalwlaxtsejvzwuvvk.supabase.co';
  var FUNCTION_URL = SUPABASE_URL + '/functions/v1/send-contact-email';
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphbGFsd2xheHRzZWp2end1dnZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMDI0NjQsImV4cCI6MjA4NTc3ODQ2NH0.hFCHMQdlckaDW6ON9ZEnyA6kbF-lhTb48Tq6duiVXeg';

  function getForm() {
    return document.querySelector('[data-contact-form]');
  }

  function getLocale() {
    return document.documentElement.lang || 'it';
  }

  function getThankYouUrl() {
    var locale = getLocale();
    return locale === 'en' ? '/en/contacts/thank-you' : '/contatti/grazie';
  }

  /**
   * Mostra un messaggio di errore sotto il form.
   */
  function showError(form, message) {
    // Rimuovi errori precedenti
    var existing = form.querySelector('.form-error-msg');
    if (existing) existing.remove();

    var div = document.createElement('div');
    div.className = 'form-error-msg';
    div.setAttribute('role', 'alert');
    div.style.cssText = 'background:#fef2f2;border:1px solid #fca5a5;color:#991b1b;padding:12px 16px;border-radius:4px;margin-top:12px;font-size:14px;font-family:var(--font-body,sans-serif);';
    div.textContent = message;
    form.appendChild(div);

    // Auto-remove dopo 8 secondi
    setTimeout(function () {
      if (div.parentNode) div.remove();
    }, 8000);
  }

  /**
   * Mostra lo stato di caricamento sul pulsante.
   */
  function setLoading(btn, loading) {
    if (loading) {
      btn.setAttribute('data-original-text', btn.textContent);
      btn.textContent = getLocale() === 'en' ? 'Sending...' : 'Invio in corso...';
      btn.disabled = true;
      btn.style.opacity = '0.7';
    } else {
      btn.textContent = btn.getAttribute('data-original-text') || btn.textContent;
      btn.disabled = false;
      btn.style.opacity = '1';
    }
  }

  /**
   * Validazione lato client.
   */
  function validateClient(data) {
    var locale = getLocale();
    if (!data.name || data.name.trim().length < 2) {
      return locale === 'en' ? 'Please enter your full name.' : 'Inserisci il tuo nome e cognome.';
    }
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      return locale === 'en' ? 'Please enter a valid email address.' : 'Inserisci un indirizzo email valido.';
    }
    if (!data.eventType) {
      return locale === 'en' ? 'Please select an event type.' : 'Seleziona il tipo di evento.';
    }
    if (!data.message || data.message.trim().length < 10) {
      return locale === 'en' ? 'Please write a message (at least 10 characters).' : 'Scrivi un messaggio (almeno 10 caratteri).';
    }
    return null;
  }

  function init() {
    var form = getForm();
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var formData = {
        name: (form.querySelector('[name="name"]') || {}).value || '',
        email: (form.querySelector('[name="email"]') || {}).value || '',
        phone: (form.querySelector('[name="phone"]') || {}).value || '',
        eventType: (form.querySelector('[name="event-type"]') || {}).value || '',
        eventDate: (form.querySelector('[name="event-date"]') || {}).value || '',
        message: (form.querySelector('[name="message"]') || {}).value || '',
        website: (form.querySelector('[name="website"]') || {}).value || '',
        locale: getLocale()
      };

      // Validazione client
      var clientError = validateClient(formData);
      if (clientError) {
        showError(form, clientError);
        return;
      }

      var submitBtn = form.querySelector('[type="submit"]');
      setLoading(submitBtn, true);

      // Rimuovi errori precedenti
      var existing = form.querySelector('.form-error-msg');
      if (existing) existing.remove();

      fetch(FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
        },
        body: JSON.stringify(formData)
      })
        .then(function (res) {
          return res.json().then(function (body) {
            return { status: res.status, body: body };
          });
        })
        .then(function (result) {
          setLoading(submitBtn, false);

          if (result.body.success) {
            // Invio riuscito: redirect alla pagina grazie
            window.location.href = getThankYouUrl();
          } else {
            // Errore dal server
            var errorMsg = result.body.error ||
              (getLocale() === 'en'
                ? 'An error occurred. Please try again later.'
                : 'Si è verificato un errore. Riprova più tardi.');
            showError(form, errorMsg);
          }
        })
        .catch(function () {
          setLoading(submitBtn, false);
          var errorMsg = getLocale() === 'en'
            ? 'Connection error. Please check your internet and try again.'
            : 'Errore di connessione. Verifica la tua connessione internet e riprova.';
          showError(form, errorMsg);
        });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
