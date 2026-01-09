
import { GoogleGenAI, Modality } from "@google/genai";
import { GenerationConfig } from "../types";

const API_KEY = process.env.API_KEY || "";

export const generateSpeech = async (config: GenerationConfig) => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  // Construct the prompt based on settings
  let promptPrefix = `Style: ${config.mood}. Age: ${config.age}. Gender: ${config.gender}. `;
  if (config.preset) {
    promptPrefix += `Character Profile: ${config.preset.instruction} `;
  }
  
  const finalPrompt = `Speak the following text exactly as written: "${config.text}". Instructions: ${promptPrefix}`;
  const voiceName = config.preset?.voiceName || (config.gender === 'Female' ? 'Puck' : 'Kore');

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: finalPrompt }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: voiceName as any },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) {
    throw new Error("No audio data received from API");
  }

  return base64Audio;
};
