import { useState } from 'react';

export interface AppSettings {
  apiKey: string;
  lat: number;
  lon: number;
  locationLabel: string;
  shipCloseKm: number;
  belugaCloseKm: number;
  notifyShipClose: boolean;
  notifyBelugaLanding: boolean;
}

const LS_SETTINGS = 'elbspotter_settings';

const DEFAULTS: AppSettings = {
  apiKey: '',
  lat: 53.5453971,
  lon: 9.8344917,
  locationLabel: 'Finkenwerder, Hamburg',
  shipCloseKm: 0.5,
  belugaCloseKm: 2.0,
  notifyShipClose: true,
  notifyBelugaLanding: true,
};

export function loadSettings(defaultApiKey: string): AppSettings {
  try {
    const stored = JSON.parse(localStorage.getItem(LS_SETTINGS) ?? '{}');
    return {
      ...DEFAULTS,
      apiKey: defaultApiKey,
      ...stored,
    };
  } catch {
    return { ...DEFAULTS, apiKey: defaultApiKey };
  }
}

function saveSettings(settings: AppSettings) {
  localStorage.setItem(LS_SETTINGS, JSON.stringify(settings));
}

interface Props {
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
}

export function SetupModal({ settings, onSave }: Props) {
  const [draft, setDraft] = useState<AppSettings>(settings);
  const [show, setShow] = useState(!settings.apiKey);

  const update = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const handleSave = () => {
    saveSettings(draft);
    onSave(draft);
    setShow(false);
  };

  if (!show) {
    return (
      <button
        onClick={() => { setDraft(settings); setShow(true); }}
        className="text-xs text-white/60 hover:text-white transition-colors font-semibold flex items-center gap-1"
      >
        ⚙ Settings
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto flex items-start justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl my-auto">
        <div className="h-2 rounded-t-3xl bg-gradient-to-r from-airbus-blue to-airbus-sky"/>

        <div className="p-5 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-airbus-pale flex items-center justify-center text-xl">⚙</div>
            <div>
              <h2 className="text-ink font-extrabold text-base leading-none">Settings</h2>
              <p className="text-muted text-xs mt-0.5">Configure tracking and notifications</p>
            </div>
          </div>

          {/* AIS Key */}
          <Section title="AIS Connection">
            <label className="block text-xs font-semibold text-muted mb-1">API Key</label>
            <input
              type="password"
              value={draft.apiKey}
              onChange={(e) => update('apiKey', e.target.value)}
              placeholder="Paste your AISStream key…"
              className="w-full bg-airbus-pale border border-blue-100 rounded-lg px-3 py-2 text-ink text-sm font-mono placeholder-muted/40 focus:outline-none focus:border-airbus-sky focus:ring-2 focus:ring-airbus-sky/20 transition"
            />
            <p className="mt-1 text-[11px] text-muted">
              Free at{' '}
              <a href="https://aisstream.io" target="_blank" rel="noopener noreferrer"
                className="text-airbus-sky hover:underline font-semibold">aisstream.io</a>
              . Beluga tracking needs no key.
            </p>
          </Section>

          {/* Location */}
          <Section title="Your Location">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-muted mb-1">Latitude</label>
                <input
                  type="number" step="0.0001"
                  value={draft.lat}
                  onChange={(e) => update('lat', parseFloat(e.target.value) || 0)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-muted mb-1">Longitude</label>
                <input
                  type="number" step="0.0001"
                  value={draft.lon}
                  onChange={(e) => update('lon', parseFloat(e.target.value) || 0)}
                  className={inputClass}
                />
              </div>
            </div>
            <div className="mt-2">
              <label className="block text-[11px] font-semibold text-muted mb-1">Label</label>
              <input
                type="text"
                value={draft.locationLabel}
                onChange={(e) => update('locationLabel', e.target.value)}
                placeholder="e.g. Finkenwerder, Hamburg"
                className={inputClass}
              />
            </div>
          </Section>

          {/* Notifications */}
          <Section title="Notifications">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox" checked={draft.notifyShipClose}
                  onChange={(e) => update('notifyShipClose', e.target.checked)}
                  className="mt-1 accent-airbus-blue"
                />
                <div className="flex-1">
                  <div className="text-xs font-bold text-ink">Ship nearby</div>
                  <div className="text-[11px] text-muted">Alert when a large ship is within:</div>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="number" step="0.1" min="0.1" max="10"
                      value={draft.shipCloseKm}
                      onChange={(e) => update('shipCloseKm', parseFloat(e.target.value) || 0.5)}
                      className="w-20 bg-airbus-pale border border-blue-100 rounded-lg px-2 py-1 text-sm font-mono text-ink focus:outline-none focus:border-airbus-sky transition"
                      disabled={!draft.notifyShipClose}
                    />
                    <span className="text-xs text-muted">km</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <input
                  type="checkbox" checked={draft.notifyBelugaLanding}
                  onChange={(e) => update('notifyBelugaLanding', e.target.checked)}
                  className="mt-1 accent-airbus-blue"
                />
                <div className="flex-1">
                  <div className="text-xs font-bold text-ink">Beluga landing</div>
                  <div className="text-[11px] text-muted">Alert when a Beluga is landing within:</div>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="number" step="0.5" min="0.5" max="20"
                      value={draft.belugaCloseKm}
                      onChange={(e) => update('belugaCloseKm', parseFloat(e.target.value) || 2.0)}
                      className="w-20 bg-airbus-pale border border-blue-100 rounded-lg px-2 py-1 text-sm font-mono text-ink focus:outline-none focus:border-airbus-sky transition"
                      disabled={!draft.notifyBelugaLanding}
                    />
                    <span className="text-xs text-muted">km</span>
                  </div>
                </div>
              </div>
            </div>
          </Section>

          {/* Buttons */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={handleSave}
              className="flex-1 bg-airbus-blue hover:bg-airbus-sky text-white font-bold py-2.5 px-4 rounded-xl transition-colors text-sm shadow-sm"
            >
              Save
            </button>
            <button
              onClick={() => setShow(false)}
              className="px-4 py-2.5 border border-blue-200 text-muted hover:text-ink rounded-xl transition-colors text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-bold text-muted uppercase tracking-widest mb-2">{title}</div>
      {children}
    </div>
  );
}

const inputClass = 'w-full bg-airbus-pale border border-blue-100 rounded-lg px-3 py-2 text-ink text-sm font-mono placeholder-muted/40 focus:outline-none focus:border-airbus-sky focus:ring-2 focus:ring-airbus-sky/20 transition';
