// Generated once with a cryptographically random derangement (nobody draws themselves).
// Targets are lightly scrambled so a glance at the source does not spoil the surprise.
export const NAMES = ["Mo","Cara","Paul","Maya"] as const
export type Name = (typeof NAMES)[number]

const SEALED: Record<Name, string> = {
  "Mo": "NMH3zw==",
  "Cara": "PfPfzA==",
  "Paul": "N/PUyg==",
  "Maya": "Ov0="
}

export function unseal(giver: Name): string {
  const bytes = atob(SEALED[giver])
  let out = ''
  for (let i = 0; i < bytes.length; i++) {
    out += String.fromCharCode(bytes.charCodeAt(i) ^ (giver.charCodeAt(i % giver.length) + 7 * i + 42))
  }
  return out
}
