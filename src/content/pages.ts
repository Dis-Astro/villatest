export interface PageContent {
  hero: {
    title: string;
    subtitle?: string;
    description?: string;
    image: string;
    cta?: {
      text: string;
      href: string;
    };
  };
  sections?: Array<{
    type: 'intro' | 'services' | 'gallery' | 'testimonials' | 'cta';
    title?: string;
    description?: string;
    content?: any;
    images?: string[];
  }>;
  seo: {
    title: string;
    description: string;
    image?: string;
  };
}

export const pages: Record<string, Record<'it' | 'en', PageContent>> = {
  home: {
    it: {
      hero: {
        title: 'Villa Paris',
        subtitle: 'Location Esclusiva per Matrimoni',
        description: 'Una cornice elegante e raffinata a Roseto degli Abruzzi per celebrare il tuo giorno più speciale.',
        image: '/images/hero/home-hero.webp',
        cta: {
          text: 'Scopri di più',
          href: '#intro'
        }
      },
      sections: [
        {
          type: 'intro',
          title: 'Benvenuti a Villa Paris',
          description: 'Immersa nella splendida cornice di Roseto degli Abruzzi, Villa Paris è la location perfetta per matrimoni ed eventi esclusivi. La nostra struttura unisce eleganza, tradizione e servizi moderni per creare momenti indimenticabili.',
          images: ['/images/spaces/villa-paris-estate.webp']
        },
        {
          type: 'services',
          title: 'I Nostri Servizi',
          description: 'Offriamo pacchetti completi per matrimoni, eventi aziendali e celebrazioni private.',
          images: ['/images/spaces/villa-paris-sala.webp']
        },
        {
          type: 'gallery',
          title: 'Galleria',
          description: 'Scopri la bellezza e l\'eleganza di Villa Paris attraverso le nostre immagini.',
          images: [
            '/images/gallery/villa-exterior-1.webp',
            '/images/gallery/sala-principale.webp',
            '/images/gallery/giardino-cerimonia.webp',
            '/images/gallery/tavoli-recezione.webp',
            '/images/gallery/dettagli-fiori.webp',
            '/images/gallery/vista-mare.webp'
          ]
        }
      ],
      seo: {
        title: 'Villa Paris - Location Matrimoni Roseto degli Abruzzi',
        description: 'Location esclusiva per matrimoni ed eventi a Roseto degli Abruzzi. Una cornice elegante e raffinata per celebrare il tuo giorno speciale.',
        image: '/images/og/og-home.jpg'
      }
    },
    en: {
      hero: {
        title: 'Villa Paris',
        subtitle: 'Exclusive Wedding Venue',
        description: 'An elegant and refined setting in Roseto degli Abruzzi to celebrate your most special day.',
        image: '/images/hero/home-hero.webp',
        cta: {
          text: 'Discover more',
          href: '#intro'
        }
      },
      sections: [
        {
          type: 'intro',
          title: 'Welcome to Villa Paris',
          description: 'Nestled in the splendid setting of Roseto degli Abruzzi, Villa Paris is the perfect venue for exclusive weddings and events. Our facility combines elegance, tradition and modern services to create unforgettable moments.',
          images: ['/images/spaces/villa-paris-estate.webp']
        },
        {
          type: 'services',
          title: 'Our Services',
          description: 'We offer complete packages for weddings, corporate events and private celebrations.',
          images: ['/images/spaces/villa-paris-sala.webp']
        },
        {
          type: 'gallery',
          title: 'Gallery',
          description: 'Discover the beauty and elegance of Villa Paris through our images.',
          images: [
            '/images/gallery/villa-exterior-1.webp',
            '/images/gallery/sala-principale.webp',
            '/images/gallery/giardino-cerimonia.webp',
            '/images/gallery/tavoli-recezione.webp',
            '/images/gallery/dettagli-fiori.webp',
            '/images/gallery/vista-mare.webp'
          ]
        }
      ],
      seo: {
        title: 'Villa Paris - Wedding Venue Roseto degli Abruzzi',
        description: 'Exclusive venue for weddings and events in Roseto degli Abruzzi. An elegant and refined setting to celebrate your special day.',
        image: '/images/og/og-home.jpg'
      }
    }
  },
  weddings: {
    it: {
      hero: {
        title: 'Matrimoni a Villa Paris',
        subtitle: 'Il Tuo Giorno Speciale',
        description: 'Trasforma il tuo sogno in realtà nella location più elegante di Roseto degli Abruzzi.',
        image: '/images/hero/weddings-hero.webp'
      },
      sections: [
        {
          type: 'intro',
          title: 'Matrimoni Indimenticabili',
          description: 'Villa Paris offre la cornice perfetta per il tuo matrimonio. Con i nostri giardini, sale raffinate e servizio impeccabile, ogni dettaglio sarà curato per rendere il tuo giorno unico.',
          images: [
            '/images/gallery/giardino-cerimonia.webp',
            '/images/gallery/sala-principale.webp',
            '/images/gallery/tavoli-recezione.webp'
          ]
        }
      ],
      seo: {
        title: 'Matrimoni a Villa Paris - Location Roseto degli Abruzzi',
        description: 'Organizza il tuo matrimonio perfetto a Villa Paris. Location esclusiva con giardini, sale eleganti e servizio impeccabile a Roseto degli Abruzzi.',
        image: '/images/og/og-matrimoni.jpg'
      }
    },
    en: {
      hero: {
        title: 'Weddings at Villa Paris',
        subtitle: 'Your Special Day',
        description: 'Make your dream come true in the most elegant venue in Roseto degli Abruzzi.',
        image: '/images/hero/weddings-hero.webp'
      },
      sections: [
        {
          type: 'intro',
          title: 'Unforgettable Weddings',
          description: 'Villa Paris offers the perfect setting for your wedding. With our gardens, elegant halls and impeccable service, every detail will be taken care of to make your day unique.',
          images: [
            '/images/gallery/giardino-cerimonia.webp',
            '/images/gallery/sala-principale.webp',
            '/images/gallery/tavoli-recezione.webp'
          ]
        }
      ],
      seo: {
        title: 'Weddings at Villa Paris - Venue Roseto degli Abruzzi',
        description: 'Plan your perfect wedding at Villa Paris. Exclusive venue with gardens, elegant halls and impeccable service in Roseto degli Abruzzi.',
        image: '/images/og/og-matrimoni.jpg'
      }
    }
  },
  gallery: {
    it: {
      hero: {
        title: 'Galleria',
        subtitle: 'Momenti Indimenticabili',
        description: 'Scopri la bellezza e l\'eleganza di Villa Paris attraverso le nostre immagini.',
        image: '/images/hero/gallery-hero.webp'
      },
      seo: {
        title: 'Galleria - Villa Paris Roseto degli Abruzzi',
        description: 'Scopri le immagini di Villa Paris, location esclusiva per matrimoni ed eventi a Roseto degli Abruzzi.',
        image: '/images/og/og-galleria.jpg'
      }
    },
    en: {
      hero: {
        title: 'Gallery',
        subtitle: 'Unforgettable Moments',
        description: 'Discover the beauty and elegance of Villa Paris through our images.',
        image: '/images/hero/gallery-hero.webp'
      },
      seo: {
        title: 'Gallery - Villa Paris Roseto degli Abruzzi',
        description: 'Discover images of Villa Paris, exclusive venue for weddings and events in Roseto degli Abruzzi.',
        image: '/images/og/og-galleria.jpg'
      }
    }
  },
  contacts: {
    it: {
      hero: {
        title: 'Contatti',
        subtitle: 'Rimaniamo in Contatto',
        description: 'Contattaci per scoprire come Villa Paris può rendere il tuo evento indimenticabile.',
        image: '/images/hero/contacts-hero.webp'
      },
      seo: {
        title: 'Contatti - Villa Paris Roseto degli Abruzzi',
        description: 'Contatta Villa Paris per informazioni sulla nostra location per matrimoni ed eventi a Roseto degli Abruzzi.',
        image: '/images/og/og-contatti.jpg'
      }
    },
    en: {
      hero: {
        title: 'Contacts',
        subtitle: 'Get in Touch',
        description: 'Contact us to discover how Villa Paris can make your event unforgettable.',
        image: '/images/hero/contacts-hero.webp'
      },
      seo: {
        title: 'Contacts - Villa Paris Roseto degli Abruzzi',
        description: 'Contact Villa Paris for information about our wedding and event venue in Roseto degli Abruzzi.',
        image: '/images/og/og-contatti.jpg'
      }
    }
  }
};
