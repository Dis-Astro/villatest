export interface GalleryItem {
  id: string;
  src: string;
  alt: {
    it: string;
    en: string;
  };
  caption: {
    it: string;
    en: string;
  };
  tags: string[];
  order: number;
  width: number;
  height: number;
}

export const galleryItems: GalleryItem[] = [
  {
    id: 'villa-exterior-1',
    src: '/images/gallery/villa-exterior-1.webp',
    alt: {
      it: 'Esterno di Villa Paris con giardino',
      en: 'Exterior of Villa Paris with garden'
    },
    caption: {
      it: 'La facciata principale immersa nel verde',
      en: 'The main facade surrounded by greenery'
    },
    tags: ['esterni', 'giardino'],
    order: 1,
    width: 800,
    height: 600
  },
  {
    id: 'villa-exterior-2',
    src: '/images/gallery/villa-exterior-2.webp',
    alt: {
      it: 'Villa Paris al tramonto',
      en: 'Villa Paris at sunset'
    },
    caption: {
      it: 'L\'atmosfera magica del tramonto sulla villa',
      en: 'The magical sunset atmosphere over the villa'
    },
    tags: ['esterni', 'tramonto'],
    order: 2,
    width: 800,
    height: 600
  },
  {
    id: 'sala-principale',
    src: '/images/gallery/sala-principale.webp',
    alt: {
      it: 'Sala principale per ricevimenti',
      en: 'Main hall for receptions'
    },
    caption: {
      it: 'La sala principale: eleganza e raffinatezza',
      en: 'The main hall: elegance and refinement'
    },
    tags: ['interni', 'sale'],
    order: 3,
    width: 800,
    height: 600
  },
  {
    id: 'giardino-cerimonia',
    src: '/images/gallery/giardino-cerimonia.webp',
    alt: {
      it: 'Giardino per cerimonie all\'aperto',
      en: 'Garden for outdoor ceremonies'
    },
    caption: {
      it: 'Spazio verde perfetto per cerimonie',
      en: 'Perfect green space for ceremonies'
    },
    tags: ['giardino', 'cerimonia'],
    order: 4,
    width: 800,
    height: 600
  },
  {
    id: 'tavoli-recezione',
    src: '/images/gallery/tavoli-recezione.webp',
    alt: {
      it: 'Tavoli apparecchiati per ricevimento',
      en: 'Set tables for reception'
    },
    caption: {
      it: 'Allestimento elegante per i tuoi ospiti',
      en: 'Elegant setup for your guests'
    },
    tags: ['interni', 'ricevimento'],
    order: 5,
    width: 800,
    height: 600
  },
  {
    id: 'dettagli-fiori',
    src: '/images/gallery/dettagli-fiori.webp',
    alt: {
      it: 'Dettagli floreali per matrimoni',
      en: 'Floral details for weddings'
    },
    caption: {
      it: 'Composizioni floreali uniche ed eleganti',
      en: 'Unique and elegant floral compositions'
    },
    tags: ['dettagli', 'fiori'],
    order: 6,
    width: 800,
    height: 600
  },
  {
    id: 'pool-area',
    src: '/images/gallery/pool-area.webp',
    alt: {
      it: 'Area piscina della villa',
      en: 'Pool area of the villa'
    },
    caption: {
      it: 'Relax e stile nella nostra area piscina',
      en: 'Relax and style in our pool area'
    },
    tags: ['esterni', 'piscina'],
    order: 7,
    width: 800,
    height: 600
  },
  {
    id: 'vista-mare',
    src: '/images/gallery/vista-mare.webp',
    alt: {
      it: 'Vista mare dalla villa',
      en: 'Sea view from the villa'
    },
    caption: {
      it: 'La splendida vista sul mare Adriatico',
      en: 'The splendid view of the Adriatic Sea'
    },
    tags: ['esterni', 'vista'],
    order: 8,
    width: 800,
    height: 600
  },
  {
    id: 'cucina-eventi',
    src: '/images/gallery/cucina-eventi.webp',
    alt: {
      it: 'Cucina professionale per eventi',
      en: 'Professional kitchen for events'
    },
    caption: {
      it: 'Cucina attrezzata per catering di alta qualità',
      en: 'Equipped kitchen for high-quality catering'
    },
    tags: ['interni', 'cucina'],
    order: 9,
    width: 800,
    height: 600
  },
  {
    id: 'interni-salone',
    src: '/images/gallery/interni-salone.webp',
    alt: {
      it: 'Salone interno della villa',
      en: 'Internal lounge of the villa'
    },
    caption: {
      it: 'Ambiente raffinato per eventi privati',
      en: 'Refined environment for private events'
    },
    tags: ['interni', 'salone'],
    order: 10,
    width: 800,
    height: 600
  },
  {
    id: 'dettagli-arredi',
    src: '/images/gallery/dettagli-arredi.webp',
    alt: {
      it: 'Dettagli degli arredi della villa',
      en: 'Details of villa furnishings'
    },
    caption: {
      it: 'Arredi eleganti e curati nei minimi dettagli',
      en: 'Elegant and carefully crafted furnishings'
    },
    tags: ['dettagli', 'arredi'],
    order: 11,
    width: 800,
    height: 600
  },
  {
    id: 'notte-evento',
    src: '/images/gallery/notte-evento.webp',
    alt: {
      it: 'Villa Paris durante un evento serale',
      en: 'Villa Paris during an evening event'
    },
    caption: {
      it: 'L\'atmosfera magica degli eventi notturni',
      en: 'The magical atmosphere of evening events'
    },
    tags: ['esterni', 'notte', 'evento'],
    order: 12,
    width: 800,
    height: 600
  }
];

export function getGalleryItemsByTag(tag?: string): GalleryItem[] {
  if (!tag) return galleryItems.sort((a, b) => a.order - b.order);
  return galleryItems
    .filter(item => item.tags.includes(tag))
    .sort((a, b) => a.order - b.order);
}

export function getGalleryTags(): string[] {
  const tags = new Set<string>();
  galleryItems.forEach(item => {
    item.tags.forEach(tag => tags.add(tag));
  });
  return Array.from(tags).sort();
}
