export const EMOTIONS = [
  {
    id: 'uplifting',
    name: 'Uplifting',
    color: '#FFD166',
    description: 'Big, open harmonies that feel like sunshine and forward motion.'
  },
  {
    id: 'bittersweet',
    name: 'Bittersweet',
    color: '#EF476F',
    description: 'Wistful chords that balance joy and melancholy.'
  },
  {
    id: 'curious',
    name: 'Curious',
    color: '#06D6A0',
    description: 'Playful movement that nudges you to explore new sounds.'
  },
  {
    id: 'wonder',
    name: 'Wonder',
    color: '#118AB2',
    description: 'Floating, cinematic progressions full of awe.'
  },
  {
    id: 'mysterious',
    name: 'Mysterious',
    color: '#8338EC',
    description: 'Chromatic colors and suspended tones that keep you guessing.'
  },
  {
    id: 'cinematic',
    name: 'Cinematic',
    color: '#FF6F91',
    description: 'Swelling minor landscapes built for storytelling.'
  },
  {
    id: 'earthy',
    name: 'Earthy',
    color: '#6D597A',
    description: 'Rooted, folky cadences with natural textures.'
  },
  {
    id: 'cool',
    name: 'Cool',
    color: '#4ECDC4',
    description: 'Laid-back and smooth with a hint of jazz.'
  },
  {
    id: 'groove',
    name: 'Groove',
    color: '#1A535C',
    description: 'Rhythmic drive that invites head nods and improvisation.'
  }
]

export const getEmotionById = (emotionId) =>
  EMOTIONS.find((emotion) => emotion.id === emotionId)

export default EMOTIONS
