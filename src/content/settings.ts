export interface GlobalSettings {
  logo: {
    src: string;
    alt: string;
    width: number;
    height: number;
  };
  navigation: {
    it: Array<{
      label: string;
      href: string;
    }>;
    en: Array<{
      label: string;
      href: string;
    }>;
  };
  footer: {
    it: {
      title: string;
      description: string;
      address: string;
      phone: string;
      email: string;
      social: Array<{
        platform: string;
        url: string;
        label: string;
      }>;
      copyright: string;
    };
    en: {
      title: string;
      description: string;
      address: string;
      phone: string;
      email: string;
      social: Array<{
        platform: string;
        url: string;
        label: string;
      }>;
      copyright: string;
    };
  };
  cta: {
    it: {
      text: string;
      href: string;
    };
    en: {
      text: string;
      href: string;
    };
  };
}

export const urlMap: Record<string, string> = {
  '/': '/en',
  '/matrimoni': '/en/weddings',
  '/galleria': '/en/gallery',
  '/contatti': '/en/contacts',
  '/contatti/grazie': '/en/contacts/thank-you',
  '/en': '/',
  '/en/weddings': '/matrimoni',
  '/en/gallery': '/galleria',
  '/en/contacts': '/contatti',
  '/en/contacts/thank-you': '/contatti/grazie',
  '/privacy': '/en/privacy',
  '/cookie': '/en/cookie',
  '/en/privacy': '/privacy',
  '/en/cookie': '/cookie'
};

export function normalizeRoutePath(pathname: string): string {
  let normalized = pathname.replace(/\/$/, '') || '/';

  if (normalized.endsWith('/index.html')) {
    normalized = normalized.slice(0, -'/index.html'.length) || '/';
  } else if (normalized.endsWith('.html')) {
    normalized = normalized.slice(0, -'.html'.length) || '/';
  }

  return normalized || '/';
}

export function getAlternateUrl(pathname: string, fromLocale: 'it' | 'en'): string {
  const normalized = normalizeRoutePath(pathname);
  const mapped = urlMap[normalized];
  if (mapped) return mapped;
  // fallback: simple prefix toggle
  return fromLocale === 'it' ? `/en${normalized}` : (normalized.replace('/en', '') || '/');
}

export const globalSettings: GlobalSettings = {
  logo: {
    src: '/images/logo-villa-paris.webp',
    alt: 'Villa Paris - Roseto degli Abruzzi',
    width: 180,
    height: 60
  },
  navigation: {
    it: [
      { label: 'Home', href: '/' },
      { label: 'Matrimoni', href: '/matrimoni' },
      { label: 'Galleria', href: '/galleria' },
      { label: 'Contatti', href: '/contatti' }
    ],
    en: [
      { label: 'Home', href: '/en' },
      { label: 'Weddings', href: '/en/weddings' },
      { label: 'Gallery', href: '/en/gallery' },
      { label: 'Contacts', href: '/en/contacts' }
    ]
  },
  footer: {
    it: {
      title: 'Villa Paris',
      description: 'Location esclusiva per matrimoni ed eventi a Roseto degli Abruzzi. Una cornice elegante e raffinata per il tuo giorno speciale.',
      address: 'Via Acquaviva, 11 - 64026 Roseto degli Abruzzi (TE)',
      phone: '+39 085 8937706',
      email: 'info@villaparis.it',
      social: [
        { platform: 'instagram', url: 'https://www.instagram.com/villaparis_roseto/', label: 'Instagram' },
        { platform: 'facebook', url: 'https://www.facebook.com/villaparisroseto/', label: 'Facebook' }
      ],
      copyright: '© 2026 Villa Paris. Tutti i diritti riservati.'
    },
    en: {
      title: 'Villa Paris',
      description: 'Exclusive venue for weddings and events in Roseto degli Abruzzi. An elegant and refined setting for your special day.',
      address: 'Via Acquaviva, 11 - 64026 Roseto degli Abruzzi (TE), Italy',
      phone: '+39 085 8937706',
      email: 'info@villaparis.it',
      social: [
        { platform: 'instagram', url: 'https://www.instagram.com/villaparis_roseto/', label: 'Instagram' },
        { platform: 'facebook', url: 'https://www.facebook.com/villaparisroseto/', label: 'Facebook' }
      ],
      copyright: '© 2026 Villa Paris. All rights reserved.'
    }
  },
  cta: {
    it: {
      text: 'Richiedi disponibilità',
      href: '/contatti'
    },
    en: {
      text: 'Request availability',
      href: '/en/contacts'
    }
  }
};
