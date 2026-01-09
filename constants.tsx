
import { VoicePreset, Mood, Gender, Age } from './types';

export const MOODS: Mood[] = ['Neutral', 'Happy', 'Professional', 'Dramatic', 'Excited', 'Serious', 'Sad'];
export const GENDERS: Gender[] = ['Male', 'Female'];
export const AGES: Age[] = ['Young', 'Adult', 'Senior'];

export const ACTOR_PRESETS: VoicePreset[] = [
  {
    id: 'morgan-freeman',
    name: 'Morgan Freeman',
    description: 'Deep, authoritative, and warm narration.',
    voiceName: 'Charon',
    instruction: 'Speak with a very deep, calm, and wise tone. Emphasize pauses for gravitas. Sound like a legendary narrator.',
    icon: '🎙️'
  },
  {
    id: 'scarlett-johansson',
    name: 'Scarlett Johansson',
    description: 'Sultry, intelligent, and husky voice.',
    voiceName: 'Puck',
    instruction: 'Speak with a slightly husky, intelligent, and warm tone. Sound modern, friendly, yet sophisticated.',
    icon: '✨'
  },
  {
    id: 'tom-hanks',
    name: 'Tom Hanks',
    description: 'Friendly, relatable, and trustworthy.',
    voiceName: 'Kore',
    instruction: 'Speak with a friendly, everyday-hero quality. Relatable, honest, and warm. Sound like a trustworthy neighbor.',
    icon: '🤝'
  }
];
