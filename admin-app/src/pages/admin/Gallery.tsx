import { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Upload,
  Trash2,
  GripVertical,
  Loader2,
  Edit2,
  Plus,
  Images,
  Image as ImageIcon,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Fallback images bundled in the site
import heroBg from "@/assets/hero-bg.webp";
import locationInterior from "@/assets/location-interior.webp";
import locationExterior from "@/assets/location-exterior.webp";
import locationCuisine from "@/assets/location-cuisine.webp";
import ricorrenzeImg from "@/assets/ricorrenze.webp";
import momentiImg from "@/assets/momenti.webp";

interface GalleryImage {
  id: string;
  file_path: string;
  file_name: string;
  caption: string | null;
  section: string;
  order_index: number;
}

const siteSection = [
  {
    key: "hero",
    label: "Home Page",
    description: "L'immagine principale che appare all'apertura del sito. Se carichi più foto, scorreranno automaticamente.",
    icon: "🏠",
    fallback: heroBg,
  },
  {
    key: "location-interior",
    label: "Interni",
    description: "Le foto degli ambienti interni della villa. Cliccando 'Interni' nel sito, il visitatore vedrà queste foto.",
    icon: "🏛️",
    fallback: locationInterior,
  },
  {
    key: "location-exterior",
    label: "Esterni",
    description: "Le foto dei giardini e degli spazi esterni. Visibili nella sezione Location e nella galleria.",
    icon: "🌿",
    fallback: locationExterior,
  },
  {
    key: "location-cuisine",
    label: "Allestimenti",
    description: "Le foto degli allestimenti e della mise en place. Appaiono nella sezione Location e nella galleria.",
    icon: "✨",
    fallback: locationCuisine,
  },
  {
    key: "events-ricorrenze",
    label: "Eventi — Ricorrenze",
    description: "Foto di battesimi, comunioni, compleanni e feste. Visibili nella sezione 'I tuoi momenti speciali'.",
    icon: "🎉",
    fallback: ricorrenzeImg,
  },
  {
    key: "events-momenti",
    label: "Eventi — Aziendali",
    description: "Foto di meeting, cene di lavoro ed eventi business.",
    icon: "💼",
    fallback: momentiImg,
  },
  {
    key: "opere-arte",
    label: "Opere d'Arte",
    description: "Foto delle opere d'arte esposte nella villa. Visibili nella galleria.",
    icon: "🖼️",
    fallback: null,
  },
];

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
function imgUrl(filePath: string) {
  return `${SUPABASE_URL}/storage/v1/object/public/venue-photos/${filePath}`;
}

/* ─── Sortable thumbnail ─── */
function SortableThumb({
  image,
  onEdit,
  onDelete,
}: {
  image: GalleryImage;
  onEdit: (img: GalleryImage) => void;
  onDelete: (img: GalleryImage) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group rounded-lg overflow-hidden border border-border bg-card shadow-sm"
    >
      <div
        {...attributes}
        {...listeners}
        className="absolute top-1.5 left-1.5 z-10 p-1.5 bg-black/50 rounded cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical size={14} className="text-white" />
      </div>

      <div className="aspect-square overflow-hidden">
        <img
          src={imgUrl(image.file_path)}
          alt={image.caption || image.file_name}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/placeholder.svg";
          }}
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
      </div>

      <div className="absolute bottom-1.5 right-1.5 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onEdit(image)} className="p-1.5 bg-card rounded hover:bg-muted transition-colors">
          <Edit2 size={12} className="text-foreground" />
        </button>
        <button onClick={() => onDelete(image)} className="p-1.5 bg-card rounded hover:bg-destructive/10 transition-colors">
          <Trash2 size={12} className="text-destructive" />
        </button>
      </div>

      {image.caption && (
        <div className="absolute bottom-1.5 left-1.5 right-12 opacity-0 group-hover:opacity-100 transition-opacity">
          <p className="text-white text-[10px] truncate bg-black/60 px-1.5 py-0.5 rounded">{image.caption}</p>
        </div>
      )}
    </div>
  );
}

/* ─── Section card ─── */
function SectionCard({
  section,
  images,
  onUpload,
  onEdit,
  onDelete,
  onReorder,
  isUploading,
  uploadingSection,
}: {
  section: (typeof siteSection)[0];
  images: GalleryImage[];
  onUpload: (files: FileList, sectionKey: string) => void;
  onEdit: (img: GalleryImage) => void;
  onDelete: (img: GalleryImage) => void;
  onReorder: (sectionKey: string, oldIndex: number, newIndex: number) => void;
  isUploading: boolean;
  uploadingSection: string | null;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIdx = images.findIndex((i) => i.id === active.id);
      const newIdx = images.findIndex((i) => i.id === over.id);
      onReorder(section.key, oldIdx, newIdx);
    }
  };

  const isBusy = isUploading && uploadingSection === section.key;
  const hasImages = images.length > 0;
  const hasFallback = !!section.fallback;

  return (
    <Card className="overflow-hidden">
      <div className="flex items-start justify-between p-5 pb-3 border-b border-border">
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-lg flex items-center gap-2">
            <span>{section.icon}</span>
            <span>{section.label}</span>
            <span className="text-xs font-body text-muted-foreground bg-muted px-2 py-0.5 rounded-full ml-1">
              {images.length} foto
            </span>
          </h3>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed max-w-xl">
            {section.description}
          </p>
          {images.length > 1 && (
            <p className="text-xs text-primary font-medium mt-1.5 flex items-center gap-1">
              <Images size={12} />
              Le foto scorreranno automaticamente sul sito
            </p>
          )}
        </div>

        <div className="flex-shrink-0 ml-4">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              if (e.target.files) onUpload(e.target.files, section.key);
              e.target.value = "";
            }}
            className="hidden"
            id={`upload-${section.key}`}
            disabled={isBusy}
          />
          <label htmlFor={`upload-${section.key}`}>
            <Button asChild size="sm" disabled={isBusy} className="cursor-pointer">
              <span>
                {isBusy ? (
                  <Loader2 size={14} className="mr-1.5 animate-spin" />
                ) : (
                  <Plus size={14} className="mr-1.5" />
                )}
                {hasImages ? "Aggiungi foto" : "Carica foto"}
              </span>
            </Button>
          </label>
        </div>
      </div>

      <CardContent className="p-4">
        {/* Show fallback image when no uploaded images exist */}
        {!hasImages && hasFallback && (
          <div className="mb-4">
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
              <ImageIcon size={12} />
              Immagine predefinita attualmente visibile sul sito — carica la tua per sostituirla
            </p>
            <label htmlFor={`upload-${section.key}`} className="cursor-pointer block">
              <div className="relative group rounded-lg overflow-hidden border-2 border-dashed border-primary/30 hover:border-primary/60 transition-colors max-w-xs">
                <img
                  src={section.fallback!}
                  alt={`${section.label} — immagine predefinita`}
                  className="w-full aspect-video object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                  <div className="bg-background/90 rounded-full p-3">
                    <Upload size={20} className="text-primary" />
                  </div>
                </div>
                <div className="absolute bottom-2 left-2">
                  <span className="text-[10px] bg-accent/90 text-accent-foreground px-2 py-0.5 rounded font-medium">
                    Predefinita
                  </span>
                </div>
              </div>
            </label>
          </div>
        )}

        {/* No fallback and no images */}
        {!hasImages && !hasFallback && (
          <label
            htmlFor={`upload-${section.key}`}
            className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/40 transition-colors"
          >
            <Upload className="w-8 h-8 text-muted-foreground mb-2" />
            <span className="text-sm text-muted-foreground">Carica la prima foto per questa sezione</span>
            <span className="text-xs text-muted-foreground mt-1">Apparirà subito sul sito</span>
          </label>
        )}

        {/* Uploaded images grid */}
        {hasImages && (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={images} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                {images.map((img) => (
                  <SortableThumb key={img.id} image={img} onEdit={onEdit} onDelete={onDelete} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── Main page ─── */
export default function Gallery() {
  const [allImages, setAllImages] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingSection, setUploadingSection] = useState<string | null>(null);
  const [editingImage, setEditingImage] = useState<GalleryImage | null>(null);
  const [deletingImage, setDeletingImage] = useState<GalleryImage | null>(null);
  const [newCaption, setNewCaption] = useState("");
  const { toast } = useToast();

  const fetchImages = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("gallery_images")
      .select("*")
      .order("order_index", { ascending: true });

    if (error) {
      toast({ variant: "destructive", title: "Errore", description: "Impossibile caricare le immagini" });
    } else {
      setAllImages(data || []);
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const imagesForSection = (key: string) => allImages.filter((i) => i.section === key);

  const handleUpload = async (files: FileList, sectionKey: string) => {
    setIsUploading(true);
    setUploadingSection(sectionKey);

    let successCount = 0;
    const existing = imagesForSection(sectionKey);
    let maxOrder = existing.length > 0 ? Math.max(...existing.map((i) => i.order_index)) : 0;

    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
      const filePath = `${sectionKey}/${fileName}`;

      const { error: uploadErr } = await supabase.storage.from("venue-photos").upload(filePath, file);
      if (uploadErr) {
        toast({ variant: "destructive", title: "Errore upload", description: `Impossibile caricare ${file.name}` });
        continue;
      }

      maxOrder += 1;
      const { error: dbErr } = await supabase.from("gallery_images").insert({
        file_path: filePath,
        file_name: file.name,
        section: sectionKey,
        order_index: maxOrder,
      });

      if (dbErr) {
        await supabase.storage.from("venue-photos").remove([filePath]);
        toast({ variant: "destructive", title: "Errore", description: `Impossibile salvare ${file.name}` });
        continue;
      }
      successCount++;
    }

    if (successCount > 0) {
      toast({
        title: "Fatto!",
        description: `${successCount} ${successCount === 1 ? "foto caricata" : "foto caricate"} — già visibile sul sito`,
      });
      fetchImages();
    }

    setIsUploading(false);
    setUploadingSection(null);
  };

  const handleReorder = async (sectionKey: string, oldIndex: number, newIndex: number) => {
    const sectionImages = imagesForSection(sectionKey);
    const reordered = arrayMove(sectionImages, oldIndex, newIndex);

    setAllImages((prev) => {
      const others = prev.filter((i) => i.section !== sectionKey);
      return [...others, ...reordered.map((img, idx) => ({ ...img, order_index: idx }))].sort(
        (a, b) => a.order_index - b.order_index
      );
    });

    for (let i = 0; i < reordered.length; i++) {
      await supabase.from("gallery_images").update({ order_index: i }).eq("id", reordered[i].id);
    }
    toast({ title: "Ordine aggiornato" });
  };

  const handleEdit = (img: GalleryImage) => {
    setEditingImage(img);
    setNewCaption(img.caption || "");
  };

  const saveEdit = async () => {
    if (!editingImage) return;
    const { error } = await supabase.from("gallery_images").update({ caption: newCaption }).eq("id", editingImage.id);
    if (error) {
      toast({ variant: "destructive", title: "Errore", description: "Impossibile salvare" });
    } else {
      toast({ title: "Salvato" });
      fetchImages();
    }
    setEditingImage(null);
    setNewCaption("");
  };

  const handleDelete = async () => {
    if (!deletingImage) return;
    await supabase.storage.from("venue-photos").remove([deletingImage.file_path]);
    const { error } = await supabase.from("gallery_images").delete().eq("id", deletingImage.id);
    if (error) {
      toast({ variant: "destructive", title: "Errore", description: "Impossibile eliminare" });
    } else {
      toast({ title: "Foto eliminata", description: "Rimossa dal sito" });
      fetchImages();
    }
    setDeletingImage(null);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl text-foreground">Gestione Foto del Sito</h1>
          <p className="text-muted-foreground mt-1">
            Ogni sezione mostra le foto attualmente sul sito. Le immagini con bordo tratteggiato sono quelle predefinite — carica le tue per sostituirle. Le modifiche sono <strong>immediate</strong>.
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {siteSection.map((section) => (
              <SectionCard
                key={section.key}
                section={section}
                images={imagesForSection(section.key)}
                onUpload={handleUpload}
                onEdit={handleEdit}
                onDelete={setDeletingImage}
                onReorder={handleReorder}
                isUploading={isUploading}
                uploadingSection={uploadingSection}
              />
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!editingImage} onOpenChange={() => setEditingImage(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifica Foto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {editingImage && (
              <img src={imgUrl(editingImage.file_path)} alt={editingImage.caption || editingImage.file_name} className="w-full h-48 object-cover rounded-lg" />
            )}
            <div className="space-y-2">
              <Label>Didascalia</Label>
              <Input value={newCaption} onChange={(e) => setNewCaption(e.target.value)} placeholder="Inserisci una didascalia..." />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingImage(null)}>Annulla</Button>
              <Button onClick={saveEdit}>Salva</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingImage} onOpenChange={() => setDeletingImage(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare questa foto?</AlertDialogTitle>
            <AlertDialogDescription>La foto verrà rimossa dal sito immediatamente. Questa azione non può essere annullata.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Elimina</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
