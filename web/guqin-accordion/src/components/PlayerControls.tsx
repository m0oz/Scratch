import { useCallback, useEffect, useRef, useState } from 'react'
import * as Tone from 'tone'
import type { GuqinPiece } from '../data/pieces'

interface Props {
  piece: GuqinPiece
  isPlaying: boolean
  setIsPlaying: (v: boolean) => void
  tempo: number
  onTempoChange: (bpm: number) => void
}

function beatToToneTime(beat: number, beatsPerBar: number): string {
  const bar = Math.floor(beat / beatsPerBar)
  const beatInBar = beat % beatsPerBar
  return `${bar}:${beatInBar}:0`
}

function beatsToDuration(beats: number): string {
  const map: Record<number, string> = {
    4: '1n', 3: '2n.', 2: '2n',
    1.5: '4n.', 1: '4n', 0.5: '8n', 0.25: '16n',
  }
  return map[beats] ?? '4n'
}

export default function PlayerControls({
  piece, isPlaying, setIsPlaying, tempo, onTempoChange,
}: Props) {
  const synthRef  = useRef<Tone.PolySynth | null>(null)
  const partRef   = useRef<Tone.Part | null>(null)
  const [volume, setVolume] = useState(-6)

  // Build the accordion synth chain once on mount
  useEffect(() => {
    const synth = new Tone.PolySynth(Tone.Synth)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    synth.set({
      oscillator: { type: 'fatsawtooth', count: 3, spread: 18 } as any,
      envelope:   { attack: 0.04, decay: 0.1, sustain: 0.88, release: 0.18 },
    })

    const filter  = new Tone.Filter({ frequency: 2000, type: 'lowpass', rolloff: -12 })
    const tremolo = new Tone.Tremolo({ frequency: 4.5, depth: 0.08 }).start()
    const reverb  = new Tone.Reverb({ decay: 1.2, wet: 0.18 })
    const vol     = new Tone.Volume(-6)

    synth.chain(filter, tremolo, reverb, vol, Tone.Destination)
    synthRef.current = synth

    return () => {
      synth.dispose(); filter.dispose()
      tremolo.dispose(); reverb.dispose(); vol.dispose()
    }
  }, [])

  // Keep transport BPM in sync
  useEffect(() => {
    Tone.Transport.bpm.value = tempo
  }, [tempo])

  const stopPlayback = useCallback(() => {
    Tone.Transport.stop()
    Tone.Transport.cancel()
    partRef.current?.dispose()
    partRef.current = null
    setIsPlaying(false)
  }, [setIsPlaying])

  // Stop when piece changes
  useEffect(() => { stopPlayback() }, [piece.id, stopPlayback])

  const handlePlay = async () => {
    await Tone.start()
    stopPlayback()

    const beatsPerBar = piece.timeSignature === '3/4' ? 3 : 4
    const events = piece.playbackNotes.map(([note, startBeat, durBeats]) => ({
      time:     beatToToneTime(startBeat, beatsPerBar),
      note:     note as string | string[],
      duration: beatsToDuration(durBeats),
    }))

    const part = new Tone.Part<{ time: string; note: string | string[]; duration: string }>(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (time, ev) => { synthRef.current?.triggerAttackRelease(ev.note as any, ev.duration, time) },
      events,
    )
    part.start(0)
    partRef.current = part

    const lastBeat = Math.max(...piece.playbackNotes.map(([, s, d]) => s + d))
    const stopAfterSec = (lastBeat / tempo) * 60 + 1.5
    Tone.Transport.schedule(() => stopPlayback(), `+${stopAfterSec}`)

    Tone.Transport.start()
    setIsPlaying(true)
  }

  return (
    <div className="bg-white rounded-xl px-5 py-4 shadow-sm border border-gray-100">
      <div className="flex flex-wrap items-center gap-5">
        <button
          onClick={isPlaying ? stopPlayback : handlePlay}
          className={`flex items-center gap-2 px-6 py-2 rounded-full font-semibold text-white
            transition-colors shadow-sm
            ${isPlaying ? 'bg-gray-500 hover:bg-gray-600' : 'bg-crimson hover:bg-red-900'}`}
        >
          <span className="text-base leading-none">{isPlaying ? '■' : '▶'}</span>
          {isPlaying ? 'Stop' : 'Play'}
        </button>

        <label className="flex items-center gap-2 text-sm text-gray-600">
          <span className="shrink-0">Tempo</span>
          <input
            type="range" min={36} max={200} step={4} value={tempo}
            onChange={(e) => onTempoChange(Number(e.target.value))}
            className="w-32 accent-crimson"
          />
          <span className="font-mono w-20 text-inkblack">{tempo} BPM</span>
        </label>

        <label className="flex items-center gap-2 text-sm text-gray-600">
          <span className="shrink-0">Volume</span>
          <input
            type="range" min={-30} max={0} step={2} value={volume}
            onChange={(e) => {
              const v = Number(e.target.value)
              setVolume(v)
              Tone.Destination.volume.value = v
            }}
            className="w-28 accent-crimson"
          />
          <span className="font-mono w-8 text-inkblack">{volume}</span>
        </label>
      </div>
    </div>
  )
}
