import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

const GenerateQr: React.FC = () => {
  const [text, setText] = useState('');
  const [dataUrl, setDataUrl] = useState('');
  const [size, setSize] = useState(300);

  useEffect(() => {
    let mounted = true;
    if (!text) {
      setDataUrl('');
      return;
    }

    QRCode.toDataURL(text, { errorCorrectionLevel: 'H', margin: 1, width: size })
      .then(url => {
        if (mounted) setDataUrl(url);
      })
      .catch(() => {
        if (mounted) setDataUrl('');
      });

    return () => {
      mounted = false;
    };
  }, [text]);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Générer QR code</h2>

      <div className="mb-4 max-w-md">
        <label className="block text-sm font-medium text-slate-700 mb-2">Texte / URL</label>
        <div className="flex gap-2 items-center">
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg border border-slate-200"
            placeholder="Saisissez le texte ou l'URL à encoder"
          />
          <div className="ml-3 flex items-center gap-2">
            <label className="text-sm text-slate-600">Taille</label>
            <input
              type="number"
              min={100}
              max={1000}
              step={50}
              value={size}
              onChange={e => setSize(Number(e.target.value) || 0)}
              className="w-20 px-2 py-1 rounded-lg border border-slate-200"
            />
            <span className="text-sm text-slate-500">px</span>
          </div>
        </div>
      </div>

      {dataUrl ? (
        <div className="mt-4 flex items-start gap-4">
          <img src={dataUrl} alt="QR code" className="w-48 h-48 border rounded-md" />
          <div className="mt-4">
            <button
              onClick={() => {
                if (!dataUrl) return;
                const a = document.createElement('a');
                a.href = dataUrl;
                a.download = `qrcode-${Date.now()}.png`;
                a.click();
              }}
              className="px-3 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700"
            >
              Télécharger PNG
            </button>
          </div>
        </div>
      ) : (
        <div className="text-sm text-slate-500">Entrez du texte pour générer le QR code.</div>
      )}
    </div>
  );
};

export default GenerateQr;
