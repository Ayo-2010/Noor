import { GoogleGenAI, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export const generateTts = async (text: string, voice: 'Kore' | 'Zephyr' | 'Charon' | 'Puck' | 'Fenrir' = 'Kore') => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: `Read this Islamic exegesis text clearly and calmly: ${text.replace(/<[^>]*>?/gm, '')}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio || null;
  } catch (error) {
    console.error('Error generating TTS:', error);
  }
  return null;
};

export const playPcmBase64 = (base64: string) => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Int16Array(len / 2);
  for (let i = 0; i < len; i += 2) {
    bytes[i / 2] = binaryString.charCodeAt(i) | (binaryString.charCodeAt(i + 1) << 8);
  }

  const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
  const audioCtx = new AudioContextClass({ sampleRate: 24000 });
  const buffer = audioCtx.createBuffer(1, bytes.length, 24000);
  
  // Convert Int16 to Float32
  const float32Data = new Float32Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    float32Data[i] = bytes[i] / 32768.0;
  }
  buffer.copyToChannel(float32Data, 0);

  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  source.connect(audioCtx.destination);
  source.start();
  
  return { source, audioCtx };
};
