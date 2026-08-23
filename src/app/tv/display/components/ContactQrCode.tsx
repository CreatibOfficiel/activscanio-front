'use client';

import QRCode from 'qrcode';
import { useEffect, useState } from 'react';

export function ContactQrCode({ url, name }: { url: string; name: string }) {
  const [source, setSource] = useState('');
  useEffect(() => {
    let active = true;
    QRCode.toDataURL(url, { width: 220, margin: 1, errorCorrectionLevel: 'M' })
      .then((data) => { if (active) setSource(data); })
      .catch(() => undefined);
    return () => { active = false; };
  }, [url]);
  // Data URL is generated locally from the admin-approved contact URL.
  // eslint-disable-next-line @next/next/no-img-element
  return source ? <img src={source} alt={`QR code pour contacter ${name}`} className="mt-6 h-[220px] w-[220px] rounded-xl bg-white p-2" /> : null;
}
