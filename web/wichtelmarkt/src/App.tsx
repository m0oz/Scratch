import { useEffect, useState } from 'react'
import { NAMES, type Name, unseal } from './draw'
import { Snow } from './Snow'

type Step = { kind: 'pick' } | { kind: 'confirm'; name: Name } | { kind: 'reveal'; name: Name; opened: boolean }

const STORE_KEY = 'wichtelmarkt.me'

const crests: Record<Name, string> = { Mo: '🦌', Cara: '🌹', Paul: '🦊', Maya: '🕊️' }

function load(): Name | null {
  try {
    const v = localStorage.getItem(STORE_KEY)
    return v && (NAMES as readonly string[]).includes(v) ? (v as Name) : null
  } catch {
    return null
  }
}

function save(name: Name | null) {
  try {
    if (name) localStorage.setItem(STORE_KEY, name)
    else localStorage.removeItem(STORE_KEY)
  } catch {
    /* private mode: just forget */
  }
}

export default function App() {
  const [step, setStep] = useState<Step>(() => {
    const me = load()
    return me ? { kind: 'reveal', name: me, opened: false } : { kind: 'pick' }
  })

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [step.kind])

  return (
    <>
      <Snow />
      <Bunting />
      <main className="stage">
        <header className="sign">
          <span className="sign-chain left" />
          <span className="sign-chain right" />
          <p className="sign-kicker">Anno Domini MMXXVI</p>
          <h1>Der Wichtelmarkt</h1>
          <p className="sign-sub">zu Mo, Cara, Paul &amp; Maya</p>
        </header>

        {step.kind === 'pick' && (
          <section className="parchment" key="pick">
            <h2>Wer tritt an den Stand?</h2>
            <p className="lead">Wähle deinen Namen, edle Seele, und das Los verrät dir, wen du beschenken darfst.</p>
            <div className="shields">
              {NAMES.map((n) => (
                <button key={n} className="shield" onClick={() => setStep({ kind: 'confirm', name: n })}>
                  <span className="crest" aria-hidden="true">{crests[n]}</span>
                  <span className="shield-name">{n}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {step.kind === 'confirm' && (
          <section className="parchment" key="confirm">
            <div className="big-crest" aria-hidden="true">{crests[step.name]}</div>
            <h2>Bist du wahrhaftig {step.name}?</h2>
            <p className="lead">
              Schwöre bei Glühwein und Lebkuchenherz, dass du nicht in fremdem Namen spähst.
              Wer schummelt, dem friert der Met ein.
            </p>
            <div className="actions">
              <button
                className="btn btn-gold"
                onClick={() => {
                  save(step.name)
                  setStep({ kind: 'reveal', name: step.name, opened: false })
                }}
              >
                Ja, ich schwöre es
              </button>
              <button className="btn btn-plain" onClick={() => setStep({ kind: 'pick' })}>
                Nein, zurück
              </button>
            </div>
          </section>
        )}

        {step.kind === 'reveal' && (
          <section className="parchment" key="reveal">
            <h2>Sei gegrüßt, {step.name}!</h2>
            {!step.opened ? (
              <>
                <p className="lead">Ein versiegelter Brief wartet auf dich. Brich das Siegel, wenn niemand über deine Schulter blickt.</p>
                <button className="letter" onClick={() => setStep({ ...step, opened: true })} aria-label="Siegel brechen">
                  <span className="letter-flap" />
                  <span className="seal">
                    <span className="seal-heart">♥</span>
                  </span>
                  <span className="letter-hint">Siegel brechen</span>
                </button>
              </>
            ) : (
              <div className="scroll">
                <p className="scroll-intro">Das Los hat entschieden. Du beschenkst</p>
                <p className="target">{unseal(step.name)}</p>
                <p className="scroll-outro">Hüte dieses Geheimnis wie einen Schatz ✦</p>
              </div>
            )}
            <button
              className="link"
              onClick={() => {
                save(null)
                setStep({ kind: 'pick' })
              }}
            >
              Ich bin nicht {step.name}
            </button>
          </section>
        )}

        <footer className="foot">
          <span>✦</span> Frohe Weihnacht &amp; ein gesegnetes Fest <span>✦</span>
        </footer>
      </main>
    </>
  )
}

function Bunting() {
  const colors = ['#8e1b2c', '#d9a441', '#2f4a32', '#e9d7b8', '#b5485c']
  return (
    <div className="bunting" aria-hidden="true">
      {Array.from({ length: 24 }, (_, i) => (
        <span key={i} className="pennant" style={{ background: colors[i % colors.length], animationDelay: `${(i % 6) * 0.25}s` }} />
      ))}
    </div>
  )
}
