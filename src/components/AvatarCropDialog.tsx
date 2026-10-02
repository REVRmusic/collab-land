import { useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

async function cropToBlob(src: string, area: Area): Promise<Blob> {
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = src;
  });
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  canvas.getContext("2d")!.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, 512, 512);
  return new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error("Recadrage impossible"))), "image/jpeg", 0.9));
}

export function AvatarCropDialog({ src, onCancel, onDone }: { src: string | null; onCancel: () => void; onDone: (b: Blob) => void | Promise<void> }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    if (!src || !area) return;
    setBusy(true);
    try {
      await onDone(await cropToBlob(src, area));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={!!src} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Recadrer la photo</DialogTitle></DialogHeader>
        <div className="relative h-72 w-full overflow-hidden rounded-xl bg-muted">
          {src && (
            <Cropper image={src} crop={crop} zoom={zoom} aspect={1} cropShape="round" showGrid={false}
              onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={(_, px) => setArea(px)} />
          )}
        </div>
        <Slider value={[zoom]} min={1} max={4} step={0.01} onValueChange={(v) => setZoom(v[0] ?? 1)} aria-label="Zoom" />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel}>Annuler</Button>
          <Button onClick={confirm} disabled={busy || !area}>{busy ? "Envoi…" : "Enregistrer"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
