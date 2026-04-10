import { useState } from 'react';

interface Props {
  onSave: (apiKey: string) => void;
  initialKey?: string;
}

export function SetupModal({ onSave, initialKey = '' }: Props) {
  const [key, setKey] = useState(initialKey);
  const [show, setShow] = useState(!initialKey);

  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        className="text-xs text-white/60 hover:text-white transition-colors font-semibold flex items-center gap-1"
        title="Configure AISStream API key"
      >
        ⚙ Setup
      </button>
    );
  }

  return (
    /* Scrollable overlay so nothing is cut off on small screens */
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto flex items-start justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl my-auto">
        {/* Coloured header strip */}
        <div className="h-2 rounded-t-3xl bg-gradient-to-r from-airbus-blue to-airbus-sky"/>

        <div className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-2xl bg-airbus-pale flex items-center justify-center text-2xl">⚙</div>
            <div>
              <h2 className="text-ink font-extrabold text-lg leading-none">Setup Elbspotter</h2>
              <p className="text-muted text-sm mt-0.5">Connect to live AIS ship data</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* API key input */}
            <div>
              <label className="block text-xs font-bold text-muted uppercase tracking-widest mb-2">
                AISStream API Key
                <span className="ml-1 text-ship-amber normal-case font-semibold tracking-normal">(required for ships)</span>
              </label>
              <input
                type="text"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="Paste your API key here…"
                className="w-full bg-airbus-pale border border-blue-100 rounded-xl px-3 py-2.5 text-ink text-sm font-mono placeholder-muted/40 focus:outline-none focus:border-airbus-sky focus:ring-2 focus:ring-airbus-sky/20 transition"
              />
              <p className="mt-2 text-xs text-muted leading-relaxed">
                Free key at{' '}
                <a href="https://aisstream.io" target="_blank" rel="noopener noreferrer"
                  className="text-airbus-sky hover:underline font-semibold">
                  aisstream.io
                </a>
                . Plane tracking (OpenSky) needs no key.
              </p>
            </div>

            {/* Info box */}
            <div className="bg-airbus-pale rounded-2xl p-4 border border-blue-100 space-y-2 text-sm text-ink/80">
              <p className="font-bold text-ink text-xs uppercase tracking-widest mb-2">What Elbspotter tracks</p>
              <p>🚢 Container & cruise ships within 4 km on the Elbe</p>
              <p>🐋 All 11 Airbus Beluga aircraft (XL & ST) within 15 km</p>
              <p>🔔 Desktop notifications when a vessel is spotted</p>
              <p>📍 Your location: Finkenwerder, Hamburg (53.545°N 9.834°E)</p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => { onSave(key.trim()); setShow(false); }}
                className="flex-1 bg-airbus-blue hover:bg-airbus-sky text-white font-bold py-2.5 px-4 rounded-xl transition-colors text-sm shadow-sm"
              >
                {key.trim() ? 'Save & Connect' : 'Continue (planes only)'}
              </button>
              {initialKey && (
                <button
                  onClick={() => setShow(false)}
                  className="px-4 py-2.5 border border-blue-200 text-muted hover:text-ink rounded-xl transition-colors text-sm"
                >
                  Cancel
                </button>
              )}
            </div>

            {!key.trim() && !initialKey && (
              <button
                onClick={() => { onSave(''); setShow(false); }}
                className="w-full text-xs text-muted/60 hover:text-muted transition-colors py-1"
              >
                Skip for now (plane tracking only)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
