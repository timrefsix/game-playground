let audioContext
const activeVoices = new Map()

const DEFAULT_OPTIONS = {
  type: 'sine',
  attack: 0.01,
  release: 0.3,
  gain: 0.2
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

const ensureContext = async () => {
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (!AudioContextClass) {
      console.warn('Web Audio API is not supported in this browser.')
      return null
    }
    audioContext = new AudioContextClass()
  }

  if (audioContext.state === 'suspended') {
    try {
      await audioContext.resume()
    } catch (error) {
      console.error('Unable to resume audio context', error)
    }
  }

  return audioContext
}

const noteToFrequency = (note) => {
  const match = note.match(/^([A-G](?:#|b)?)(\d+)?$/i)
  if (!match) return null
  let [, pitchClass, octave] = match
  const flatMap = { Db: 'C#', Eb: 'D#', Gb: 'F#', Ab: 'G#', Bb: 'A#' }
  if (flatMap[pitchClass]) {
    pitchClass = flatMap[pitchClass]
  }
  const pitchIndex = NOTE_NAMES.indexOf(pitchClass)
  if (pitchIndex === -1) return null
  const octaveNumber = octave ? parseInt(octave, 10) : 4
  const midiNumber = (octaveNumber + 1) * 12 + pitchIndex
  const frequency = 440 * Math.pow(2, (midiNumber - 69) / 12)
  return frequency
}

const stopVoice = (note) => {
  const voice = activeVoices.get(note)
  if (!voice) return

  const { gainNode, oscillator, context, release } = voice
  const now = context.currentTime
  gainNode.gain.cancelScheduledValues(now)
  gainNode.gain.setValueAtTime(gainNode.gain.value, now)
  gainNode.gain.linearRampToValueAtTime(0, now + release)
  oscillator.stop(now + release + 0.02)
  activeVoices.delete(note)
}

export const playNote = async (note, opts = {}) => {
  const context = await ensureContext()
  if (!context) return

  const existing = activeVoices.get(note)
  if (existing) {
    return
  }

  const frequency = noteToFrequency(note)
  if (!frequency) return

  const { type, attack, release, gain } = { ...DEFAULT_OPTIONS, ...opts }
  const oscillator = context.createOscillator()
  oscillator.type = type
  oscillator.frequency.value = frequency

  const gainNode = context.createGain()
  gainNode.gain.setValueAtTime(0, context.currentTime)
  gainNode.gain.linearRampToValueAtTime(gain, context.currentTime + attack)

  oscillator.connect(gainNode)
  gainNode.connect(context.destination)

  oscillator.start()
  activeVoices.set(note, { oscillator, gainNode, context, release })
}

export const stopNote = (note) => {
  stopVoice(note)
}

export const playChord = async (notes, opts = {}) => {
  const context = await ensureContext()
  if (!context) return

  await Promise.all(notes.map((note) => playNote(note, opts)))
  setTimeout(() => {
    notes.forEach((note) => stopNote(note))
  }, (opts.sustain || 0.6) * 1000)
}

export const stopAll = () => {
  Array.from(activeVoices.keys()).forEach((note) => stopVoice(note))
}

export const getAudioContext = async () => ensureContext()
