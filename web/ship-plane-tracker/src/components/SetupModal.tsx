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
        className="text-xs text-white/30 hover:text-white/60 transition-colors font-mono"
        title="Configure AISStream API key"
      >
        ⚙ Setup
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-navy-800 border border-navy-600 rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">⚙</span>
          <div>
            <h2 className="text-white font-bold text-lg">Setup Elbe Watch</h2>
            <p className="text-white/50 text-sm">Connect to live AIS ship data</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-white/60 uppercase tracking-wide mb-2">
              AISStream API Key <span className="text-ship-amber">(required for ships)</span>
            </label>
            <input
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="Paste your API key here..."
              className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-white text-sm font-mono placeholder-white/20 focus:outline-none focus:border-airbus-sky transition-colors"
            />
            <p className="mt-2 text-xs text-white/40 leading-relaxed">
              Get a free API key at{' '}
              <a
                href="https://aisstream.io"
                target="_blank"
                rel="noopener noreferrer"
                className="text-airbus-sky hover:underline"
              >
                aisstream.io
              </a>
              . Plane tracking (OpenSky) works without any key.
            </p>
          </div>

          <div className="bg-navy-700/50 rounded-xl p-3 border border-navy-600">
            <div className="text-xs text-white/60 space-y-1.5">
              <p className="font-semibold text-white/80">What this app tracks:</p>
              <p>🚢 Container ships & cruise ships passing within 4 km on the Elbe</p>
              <p>🐋 All 11 Airbus Beluga aircraft (XL & ST) within 15 km</p>
              <p>🔔 Desktop notifications when a vessel is spotted</p>
              <p>📍 Your location: Finkenwerder, Hamburg (53.545°N 9.834°E)</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                onSave(key.trim());
                setShow(false);
              }}
              disabled={!key.trim() && !initialKey}
              className="flex-1 bg-airbus-blue hover:bg-airbus-sky disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
            >
              {key.trim() ? 'Save & Connect' : 'Continue (planes only)'}
            </button>
            {initialKey && (
              <button
                onClick={() => setShow(false)}
                className="px-4 py-2 border border-navy-600 text-white/60 hover:text-white rounded-lg transition-colors text-sm"
              >
                Cancel
              </button>
            )}
          </div>

          {!key.trim() && !initialKey && (
            <button
              onClick={() => { onSave(''); setShow(false); }}
              className="w-full text-xs text-white/30 hover:text-white/60 transition-colors py-1"
            >
              Skip for now (plane tracking only)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
