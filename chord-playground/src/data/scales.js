const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const FLAT_EQUIVALENTS = {
  Db: 'C#',
  Eb: 'D#',
  Gb: 'F#',
  Ab: 'G#',
  Bb: 'A#'
}

const NOTE_INDEX = NOTE_NAMES.reduce((map, note, index) => {
  map[note] = index
  return map
}, {})

const DEFAULT_OCTAVE = 4

const normalizeNoteName = (note) => {
  const match = note.match(/^([A-G](?:#|b)?)(\d+)?$/i)
  if (!match) return note
  let [_, pitchClass, octave] = match
  if (FLAT_EQUIVALENTS[pitchClass]) {
    pitchClass = FLAT_EQUIVALENTS[pitchClass]
  }
  const normalizedOctave = octave !== undefined ? Number(octave) : undefined
  return normalizedOctave === undefined ? pitchClass : `${pitchClass}${normalizedOctave}`
}

const getMidiFromNote = (note) => {
  const normalized = normalizeNoteName(note)
  const match = normalized.match(/^([A-G](?:#)?)(\d+)?$/i)
  if (!match) return null
  const pitchClass = match[1]
  const octave = match[2] !== undefined ? Number(match[2]) : DEFAULT_OCTAVE
  const index = NOTE_INDEX[pitchClass]
  if (index === undefined) return null
  return (octave + 1) * 12 + index
}

const midiToNote = (midi) => {
  const index = ((midi % 12) + 12) % 12
  const octave = Math.floor(midi / 12) - 1
  return `${NOTE_NAMES[index]}${octave}`
}

export const transpose = (note, semitoneOffset) => {
  const midi = getMidiFromNote(note)
  if (midi === null) return note
  return midiToNote(midi + semitoneOffset)
}

export const getScaleNotes = (root, intervals) => {
  const base = /\d/.test(root) ? root : `${root}${DEFAULT_OCTAVE}`
  return intervals.map((semitones) => transpose(base, semitones))
}

export const getPitchClass = (note) => normalizeNoteName(note).replace(/\d+/g, '')

export const KEYBOARD_LAYOUT = [
  { note: 'C3', computerKey: 'z', type: 'white' },
  { note: 'C#3', computerKey: 's', type: 'black' },
  { note: 'D3', computerKey: 'x', type: 'white' },
  { note: 'D#3', computerKey: 'd', type: 'black' },
  { note: 'E3', computerKey: 'c', type: 'white' },
  { note: 'F3', computerKey: 'v', type: 'white' },
  { note: 'F#3', computerKey: 'g', type: 'black' },
  { note: 'G3', computerKey: 'b', type: 'white' },
  { note: 'G#3', computerKey: 'h', type: 'black' },
  { note: 'A3', computerKey: 'n', type: 'white' },
  { note: 'A#3', computerKey: 'j', type: 'black' },
  { note: 'B3', computerKey: 'm', type: 'white' },
  { note: 'C4', computerKey: 'q', type: 'white' },
  { note: 'C#4', computerKey: '2', type: 'black' },
  { note: 'D4', computerKey: 'w', type: 'white' },
  { note: 'D#4', computerKey: '3', type: 'black' },
  { note: 'E4', computerKey: 'e', type: 'white' },
  { note: 'F4', computerKey: 'r', type: 'white' },
  { note: 'F#4', computerKey: '5', type: 'black' },
  { note: 'G4', computerKey: 't', type: 'white' },
  { note: 'G#4', computerKey: '6', type: 'black' },
  { note: 'A4', computerKey: 'y', type: 'white' },
  { note: 'A#4', computerKey: '7', type: 'black' },
  { note: 'B4', computerKey: 'u', type: 'white' },
  { note: 'C5', computerKey: 'i', type: 'white' },
  { note: 'C#5', computerKey: '9', type: 'black' },
  { note: 'D5', computerKey: 'o', type: 'white' }
]

export const KEY_TO_NOTE = KEYBOARD_LAYOUT.reduce((map, key) => {
  map[key.computerKey] = key.note
  return map
}, {})

export const ROOT_NOTES = NOTE_NAMES

export const SCALES = [
  {
    id: 'major',
    name: 'Major Scales',
    description: 'Bright tonal centers that feel open and optimistic.',
    modes: [
      {
        id: 'ionian',
        name: 'Ionian',
        aka: 'Major',
        vibe: 'Radiant & triumphant',
        intervals: [0, 2, 4, 5, 7, 9, 11],
        chords: [
          {
            id: 'I',
            degree: 'I',
            label: 'Tonic',
            quality: 'Major',
            rootOffset: 0,
            intervals: [0, 4, 7],
            color: '#FFD166',
            emotion: 'grounded',
            description: 'Home base — the chord that resolves tension.'
          },
          {
            id: 'ii',
            degree: 'ii',
            label: 'Supertonic',
            quality: 'Minor',
            rootOffset: 2,
            intervals: [0, 3, 7],
            color: '#06D6A0',
            emotion: 'hopeful',
            description: 'Adds lift and sets up the dominant.'
          },
          {
            id: 'iii',
            degree: 'iii',
            label: 'Mediant',
            quality: 'Minor',
            rootOffset: 4,
            intervals: [0, 3, 7],
            color: '#118AB2',
            emotion: 'dreamy',
            description: 'Smooth transition with bittersweet color.'
          },
          {
            id: 'IV',
            degree: 'IV',
            label: 'Subdominant',
            quality: 'Major',
            rootOffset: 5,
            intervals: [0, 4, 7],
            color: '#EF476F',
            emotion: 'expansive',
            description: 'Builds anticipation and movement.'
          },
          {
            id: 'V',
            degree: 'V',
            label: 'Dominant',
            quality: 'Major',
            rootOffset: 7,
            intervals: [0, 4, 7],
            color: '#8338EC',
            emotion: 'tense',
            description: 'Wants to resolve back to the tonic.'
          },
          {
            id: 'vi',
            degree: 'vi',
            label: 'Relative Minor',
            quality: 'Minor',
            rootOffset: 9,
            intervals: [0, 3, 7],
            color: '#073B4C',
            emotion: 'intimate',
            description: 'Emotional contrast while staying consonant.'
          },
          {
            id: 'vii°',
            degree: 'vii°',
            label: 'Leading Tone',
            quality: 'Diminished',
            rootOffset: 11,
            intervals: [0, 3, 6],
            color: '#FFD166',
            emotion: 'restless',
            description: 'Sharp tension with urgent pull upward.'
          }
        ],
        progressions: [
          {
            id: 'pop-lift',
            name: 'Pop Lift',
            degrees: ['I', 'V', 'vi', 'IV'],
            description: 'The go-to stadium singalong progression.',
            emotion: 'uplifting',
            narrative: 'Hopeful build that lands triumphantly.'
          },
          {
            id: 'soulful-rise',
            name: 'Soulful Rise',
            degrees: ['vi', 'IV', 'I', 'V'],
            description: 'Start wistful, then open into light.',
            emotion: 'bittersweet',
            narrative: 'Moves from introspection to release.'
          },
          {
            id: 'circle',
            name: 'Circle Walkdown',
            degrees: ['I', 'vi', 'ii', 'V'],
            description: 'Classic jazz cadence for easy looping.',
            emotion: 'curious',
            narrative: 'A gentle journey around the circle of fifths.'
          }
        ]
      },
      {
        id: 'lydian',
        name: 'Lydian',
        aka: 'Dream Major',
        vibe: 'Floating & cinematic',
        intervals: [0, 2, 4, 6, 7, 9, 11],
        chords: [
          {
            id: 'I',
            degree: 'I',
            label: 'Tonic',
            quality: 'Major',
            rootOffset: 0,
            intervals: [0, 4, 7],
            color: '#FFD166',
            emotion: 'glowing',
            description: 'Shimmering home base with raised fourth.'
          },
          {
            id: 'II',
            degree: 'II',
            label: 'Supertonic',
            quality: 'Major',
            rootOffset: 2,
            intervals: [0, 4, 7],
            color: '#06D6A0',
            emotion: 'expansive',
            description: 'Brilliant color with unresolved lift.'
          },
          {
            id: 'iii',
            degree: 'iii',
            label: 'Mediant',
            quality: 'Minor',
            rootOffset: 4,
            intervals: [0, 3, 7],
            color: '#118AB2',
            emotion: 'nostalgic',
            description: 'Keeps things gentle and airy.'
          },
          {
            id: '#iv°',
            degree: '#iv°',
            label: 'Lydian Leading',
            quality: 'Diminished',
            rootOffset: 6,
            intervals: [0, 3, 6],
            color: '#EF476F',
            emotion: 'mysterious',
            description: 'Highlight the raised fourth tension.'
          },
          {
            id: 'V',
            degree: 'V',
            label: 'Dominant',
            quality: 'Major',
            rootOffset: 7,
            intervals: [0, 4, 7],
            color: '#8338EC',
            emotion: 'confident',
            description: 'A bold landing pad before the tonic.'
          }
        ],
        progressions: [
          {
            id: 'wonder',
            name: 'Wonder Sequence',
            degrees: ['I', 'II', 'V', 'I'],
            description: 'Wide-eyed, floating sequence that never quite resolves.',
            emotion: 'wonder',
            narrative: 'Paints a dreamy cinematic arc.'
          },
          {
            id: 'suspension',
            name: 'Suspended Drift',
            degrees: ['I', '#iv°', 'I', 'II'],
            description: 'Lean into the raised fourth for ethereal vibes.',
            emotion: 'mysterious',
            narrative: 'Tension and release inside a glowing palette.'
          }
        ]
      }
    ]
  },
  {
    id: 'minor',
    name: 'Minor Scales',
    description: 'Brooding tonal centers with moody color.',
    modes: [
      {
        id: 'aeolian',
        name: 'Aeolian',
        aka: 'Natural Minor',
        vibe: 'Emotive & grounded',
        intervals: [0, 2, 3, 5, 7, 8, 10],
        chords: [
          {
            id: 'i',
            degree: 'i',
            label: 'Tonic Minor',
            quality: 'Minor',
            rootOffset: 0,
            intervals: [0, 3, 7],
            color: '#FFD166',
            emotion: 'introspective',
            description: 'The moody anchor chord.'
          },
          {
            id: 'III',
            degree: 'III',
            label: 'Mediant Major',
            quality: 'Major',
            rootOffset: 3,
            intervals: [0, 4, 7],
            color: '#118AB2',
            emotion: 'wistful',
            description: 'Shifts to the relative major color.'
          },
          {
            id: 'iv',
            degree: 'iv',
            label: 'Subdominant Minor',
            quality: 'Minor',
            rootOffset: 5,
            intervals: [0, 3, 7],
            color: '#06D6A0',
            emotion: 'pensive',
            description: 'Soft contrast with a warm hue.'
          },
          {
            id: 'v',
            degree: 'v',
            label: 'Dominant Minor',
            quality: 'Minor',
            rootOffset: 7,
            intervals: [0, 3, 7],
            color: '#118AB2',
            emotion: 'yearning',
            description: 'Tug toward the tonic without bright leading tone.'
          },
          {
            id: 'VI',
            degree: 'VI',
            label: 'Relative Major',
            quality: 'Major',
            rootOffset: 8,
            intervals: [0, 4, 7],
            color: '#EF476F',
            emotion: 'hopeful',
            description: 'Injects warmth and relief.'
          },
          {
            id: 'VII',
            degree: 'VII',
            label: 'Subtonic',
            quality: 'Major',
            rootOffset: 10,
            intervals: [0, 4, 7],
            color: '#8338EC',
            emotion: 'adventurous',
            description: 'Feels like a modal escape hatch.'
          }
        ],
        progressions: [
          {
            id: 'cinematic',
            name: 'Cinematic Minor',
            degrees: ['i', 'VI', 'III', 'VII'],
            description: 'Spacious, modern film score staple.',
            emotion: 'cinematic',
            narrative: 'Swells from darkness into epic release.'
          },
          {
            id: 'folk',
            name: 'Folk Sway',
            degrees: ['i', 'iv', 'i', 'VII'],
            description: 'Storytelling cadence with rustic flair.',
            emotion: 'earthy',
            narrative: 'Grounded verses that lean into modal turns.'
          }
        ]
      },
      {
        id: 'dorian',
        name: 'Dorian',
        aka: 'Hopeful Minor',
        vibe: 'Groovy & optimistic',
        intervals: [0, 2, 3, 5, 7, 9, 10],
        chords: [
          {
            id: 'i',
            degree: 'i',
            label: 'Tonic Minor',
            quality: 'Minor',
            rootOffset: 0,
            intervals: [0, 3, 7],
            color: '#FFD166',
            emotion: 'cool',
            description: 'Laid-back center with jazzy bite.'
          },
          {
            id: 'ii',
            degree: 'ii',
            label: 'Supertonic Minor',
            quality: 'Minor',
            rootOffset: 2,
            intervals: [0, 3, 7],
            color: '#06D6A0',
            emotion: 'confident',
            description: 'Sets up groovy call-and-response.'
          },
          {
            id: 'IV',
            degree: 'IV',
            label: 'Subdominant Major',
            quality: 'Major',
            rootOffset: 5,
            intervals: [0, 4, 7],
            color: '#118AB2',
            emotion: 'uplifting',
            description: 'Bright surprise that defines Dorian color.'
          },
          {
            id: 'v',
            degree: 'v',
            label: 'Dominant Minor',
            quality: 'Minor',
            rootOffset: 7,
            intervals: [0, 3, 7],
            color: '#EF476F',
            emotion: 'driving',
            description: 'Keeps the groove leaning forward.'
          },
          {
            id: 'VII',
            degree: 'VII',
            label: 'Modal Cadence',
            quality: 'Major',
            rootOffset: 10,
            intervals: [0, 4, 7],
            color: '#8338EC',
            emotion: 'adventurous',
            description: 'Modal dominant with swagger.'
          }
        ],
        progressions: [
          {
            id: 'neo-soul',
            name: 'Neo Soul Loop',
            degrees: ['i', 'VII', 'IV', 'i'],
            description: 'Laid-back loop for improvisation.',
            emotion: 'cool',
            narrative: 'Keeps you in motion without heavy tension.'
          },
          {
            id: 'groove',
            name: 'Funk Groove',
            degrees: ['i', 'IV', 'i', 'v'],
            description: 'Anchor the bass while chords dance.',
            emotion: 'groove',
            narrative: 'Balanced push-pull energy.'
          }
        ]
      }
    ]
  }
]

export const findScale = (scaleId) => SCALES.find((scale) => scale.id === scaleId)

export const findMode = (scale, modeId) =>
  scale?.modes.find((mode) => mode.id === modeId)

export const findChordById = (mode, chordId) =>
  mode?.chords.find((chord) => chord.id === chordId)

export const describeChordSymbol = (degree, quality) => {
  const suffix = quality === 'Major' ? '' : quality === 'Minor' ? 'm' : quality === 'Diminished' ? '°' : quality
  return `${degree}${suffix}`
}

export const buildChord = (rootNote, chord) => {
  const base = /\d/.test(rootNote) ? rootNote : `${rootNote}${DEFAULT_OCTAVE}`
  const chordRoot = transpose(base, chord.rootOffset)
  return chord.intervals.map((interval) => transpose(chordRoot, interval))
}

export const resolveProgressionChords = (rootNote, mode, progression) => {
  if (!mode || !progression) return []
  return progression.degrees.map((degreeId, index) => {
    const chord = findChordById(mode, degreeId)
    if (!chord) {
      return {
        id: `${degreeId}-${index}`,
        degree: degreeId,
        label: degreeId,
        quality: 'Unknown',
        notes: [],
        description: 'No chord data yet.'
      }
    }

    const notes = buildChord(rootNote, chord)
    return {
      id: chord.id,
      degree: chord.degree,
      quality: chord.quality,
      label: chord.label,
      notes,
      symbol: describeChordSymbol(chord.degree, chord.quality),
      emotion: chord.emotion,
      description: chord.description,
      color: chord.color
    }
  })
}

export const getModeSummary = (mode) => ({
  name: mode?.name,
  aka: mode?.aka,
  vibe: mode?.vibe,
  intervals: mode?.intervals
})

export default SCALES
