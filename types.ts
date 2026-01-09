
export type Mood = 'Neutral' | 'Happy' | 'Serious' | 'Sad' | 'Excited' | 'Professional' | 'Dramatic';
export type Gender = 'Male' | 'Female';
export type Age = 'Young' | 'Adult' | 'Senior';

export interface VoicePreset {
  id: string;
  name: string;
  description: string;
  voiceName: string; // Prebuilt voice name (Kore, Puck, Zephyr, Charon, Fenrir)
  instruction: string; // Specific prompt to shape the voice character
  icon: string;
}

export interface GenerationConfig {
  text: string;
  mood: Mood;
  age: Age;
  gender: Gender;
  preset?: VoicePreset;
}
