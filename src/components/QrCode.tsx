import qrcode from 'qrcode-generator';
import { useMemo } from 'react';
import { PALETTE as P, paint } from '../pixel/sprite';
import { Sprite } from '../pixel/Sprite';

/** A QR code drawn as pixel art, so it matches the rest of the game. */
export function QrCode({ url, label }: { url: string; label: string }) {
  const art = useMemo(() => {
    const qr = qrcode(0, 'M');
    qr.addData(url);
    qr.make();
    const n = qr.getModuleCount();
    const size = n + 4; // quiet zone so phones can read it
    const src = paint(`qr-${url}`, size, size, (p) => {
      p.rect(0, 0, size, size, P.white);
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) p.px(c + 2, r + 2, P.ink);
    });
    return { src, size };
  }, [url]);

  return <Sprite src={art.src} w={art.size} h={art.size} scale={2} alt={label} className="qr" />;
}
