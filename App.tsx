
import React, { useState, useRef, useEffect } from 'react';
import { MOODS, GENDERS, AGES, ACTOR_PRESETS } from './constants';
import { Mood, Gender, Age, VoicePreset } from './types';
import { generateSpeech } from './services/geminiService';
import { decode, decodeAudioData, pcmToWav } from './services/audioUtils';

const App: React.FC = () => {
  const [text, setText] = useState('Welcome to VoxGemini. Type any text here to transform it into high-quality artificial speech with emotional depth.');
  const [mood, setMood] = useState<Mood>('Neutral');
  const [gender, setGender] = useState<Gender>('Male');
  const [age, setAge] = useState<Age>('Adult');
  const [selectedPreset, setSelectedPreset] = useState<VoicePreset | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAudioData, setLastAudioData] = useState<Uint8Array | null>(null);
  
  // New state for audio settings
  const [volume, setVolume] = useState(1.0);
  const [speed, setSpeed] = useState(1.0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const activeSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Update volume on existing gain node if audio is playing
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.setTargetAtTime(volume, audioContextRef.current?.currentTime || 0, 0.1);
    }
  }, [volume]);

  const stopActiveAudio = () => {
    if (activeSourceRef.current) {
      try {
        activeSourceRef.current.stop();
      } catch (e) {
        // Source might already be stopped
      }
      activeSourceRef.current = null;
    }
  };

  const playAudio = async (data: Uint8Array) => {
    stopActiveAudio();
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    
    // Ensure gain node exists
    if (!gainNodeRef.current) {
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.connect(audioContextRef.current.destination);
    }
    
    gainNodeRef.current.gain.setValueAtTime(volume, audioContextRef.current.currentTime);

    const audioBuffer = await decodeAudioData(data, audioContextRef.current, 24000, 1);
    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBuffer;
    
    // Apply playback speed
    source.playbackRate.value = speed;
    
    source.connect(gainNodeRef.current);
    source.start();
    activeSourceRef.current = source;
  };

  const handleGenerate = async () => {
    if (!text.trim()) return;
    
    setIsGenerating(true);
    setError(null);
    setLastAudioData(null);

    try {
      const base64Audio = await generateSpeech({
        text,
        mood,
        gender,
        age,
        preset: selectedPreset || undefined
      });

      const audioData = decode(base64Audio);
      setLastAudioData(audioData);
      await playAudio(audioData);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while generating speech.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReplay = () => {
    if (lastAudioData) {
      playAudio(lastAudioData);
    }
  };

  const handleDownload = () => {
    if (lastAudioData) {
      const wavBlob = pcmToWav(lastAudioData, 24000);
      const url = URL.createObjectURL(wavBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `voxgemini-${Date.now()}.wav`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const togglePreset = (preset: VoicePreset) => {
    if (selectedPreset?.id === preset.id) {
      setSelectedPreset(null);
    } else {
      setSelectedPreset(preset);
      if (preset.id === 'scarlett-johansson') setGender('Female');
      else setGender('Male');
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 lg:p-12 flex flex-col items-center">
      <header className="mb-12 text-center">
        <h1 className="text-5xl font-extrabold mb-2 gradient-text">VoxGemini</h1>
        <p className="text-slate-400 text-lg">Next-generation Neural Speech Synthesis</p>
      </header>

      <main className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Configuration */}
        <div className="lg:col-span-4 space-y-6">
          <section className="glass-panel p-6 rounded-2xl shadow-xl">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-sky-400 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-400"></span>
              Celebrity Presets
            </h2>
            <div className="space-y-3">
              {ACTOR_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => togglePreset(preset)}
                  className={`w-full p-4 rounded-xl text-left transition-all duration-300 flex items-center gap-3 border ${
                    selectedPreset?.id === preset.id
                      ? 'bg-sky-500/20 border-sky-500 ring-1 ring-sky-500'
                      : 'bg-slate-800/50 border-slate-700 hover:border-slate-500'
                  }`}
                >
                  <span className="text-2xl">{preset.icon}</span>
                  <div>
                    <div className="font-bold text-slate-100">{preset.name}</div>
                    <div className="text-xs text-slate-400 line-clamp-1">{preset.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="glass-panel p-6 rounded-2xl shadow-xl space-y-6">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase block mb-3 flex justify-between">
                <span>Audio Settings</span>
              </label>
              
              <div className="space-y-4">
                {/* Volume Control */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      </svg>
                      Volume
                    </span>
                    <span className="text-xs font-mono text-sky-400">{Math.round(volume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
                  />
                </div>

                {/* Speed Control */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Speed
                    </span>
                    <span className="text-xs font-mono text-sky-400">{speed.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={speed}
                    onChange={(e) => setSpeed(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase block mb-2">Mood</label>
              <div className="flex flex-wrap gap-2">
                {MOODS.map((m) => (
                  <button
                    key={m}
                    onClick={() => setMood(m)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      mood === m ? 'bg-sky-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase block mb-2">Age</label>
                <select
                  value={age}
                  onChange={(e) => setAge(e.target.value as Age)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none text-slate-200"
                >
                  {AGES.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase block mb-2">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as Gender)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none text-slate-200"
                >
                  {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Input & Actions */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="glass-panel p-8 rounded-3xl shadow-2xl flex-1 flex flex-col min-h-[400px]">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste or type your script here..."
              className="w-full h-full bg-transparent resize-none focus:outline-none text-xl leading-relaxed text-slate-200 placeholder-slate-600"
            />
            
            <div className="mt-8 pt-6 border-t border-slate-700/50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-slate-500 text-sm">
                Characters: {text.length}
              </div>
              
              <div className="flex items-center gap-3">
                {lastAudioData && !isGenerating && (
                  <>
                    <button
                      onClick={handleReplay}
                      title="Replay Audio"
                      className="p-4 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-2xl transition-colors border border-slate-700"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                    <button
                      onClick={handleDownload}
                      title="Download as WAV"
                      className="p-4 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-2xl transition-colors border border-slate-700"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </button>
                  </>
                )}
                
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !text.trim()}
                  className={`group relative px-8 py-4 rounded-2xl font-bold transition-all duration-300 flex items-center gap-3 overflow-hidden ${
                    isGenerating 
                      ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                      : 'bg-white text-slate-900 hover:bg-sky-400 hover:text-white'
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Synthesizing...
                    </>
                  ) : (
                    <>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Generate & Play
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-center text-sm">
              {error}
            </div>
          )}

          {isGenerating && (
            <div className="flex justify-center gap-1 h-8 items-center">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-sky-500 animate-bounce"
                  style={{ 
                    height: `${Math.random() * 100}%`,
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: '0.6s'
                  }}
                ></div>
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className="mt-auto pt-12 text-slate-500 text-sm">
        Built with Gemini 2.5 TTS &bull; Real-time Neural Synthesis
      </footer>
    </div>
  );
};

export default App;
