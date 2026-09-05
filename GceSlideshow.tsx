import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Play, 
  HelpCircle, 
  Cpu, 
  Layers, 
  RefreshCw,
  Flame,
  Activity
} from 'lucide-react';
import { ThreeDCard } from './ThreeDCard';

interface Slide {
  id: string;
  subject: string;
  title: string;
  question: string;
  emoji: string;
  accentColor: string;
  gradient: string;
  interactiveElement: React.ReactNode;
  actionText: string;
  actionView: 'find' | 'join' | 'ask' | 'scan' | 'study' | 'upgrade' | 'prep' | 'practicals';
}

export default function GceSlideshow({ 
  onAction,
  language 
}: { 
  onAction: (view: any, subject?: string, topic?: string) => void;
  language: string;
}) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [direction, setDirection] = useState(0); // -1 for left, 1 for right
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Logic Gate Sandbox State (CS Slide)
  const [gateType, setGateType] = useState<'AND' | 'OR' | 'XOR'>('AND');
  const [inputA, setInputA] = useState(false);
  const [inputB, setInputB] = useState(false);

  // Chemistry Turbidity State
  const [temp, setTemp] = useState(25);
  const [isReacting, setIsReacting] = useState(false);
  const [reactionProgress, setReactionProgress] = useState(0);

  // Physics Frequency State
  const [frequency, setFrequency] = useState(440);

  // Logic gate calculation
  const getGateOutput = () => {
    if (gateType === 'AND') return inputA && inputB;
    if (gateType === 'OR') return inputA || inputB;
    if (gateType === 'XOR') return inputA !== inputB;
    return false;
  };

  // Run a quick simulation of chemical reaction rate
  useEffect(() => {
    let interval: any;
    if (isReacting) {
      interval = setInterval(() => {
        setReactionProgress((prev) => {
          const speed = (temp / 20) * 4; // higher temperature = faster reaction
          if (prev >= 100) {
            setIsReacting(false);
            return 100;
          }
          return prev + speed;
        });
      }, 100);
    } else {
      setReactionProgress(0);
    }
    return () => clearInterval(interval);
  }, [isReacting, temp]);

  const slides: Slide[] = [
    {
      id: 'cs',
      subject: 'COMPUTER SCIENCE',
      title: 'Interactive Gate Sandbox',
      question: 'How do electronic logic gates process GCE level binary conditions?',
      emoji: '💻',
      accentColor: 'text-purple-400 border-purple-500/30',
      gradient: 'from-slate-900 via-purple-950 to-indigo-950',
      actionText: 'Launch CS Syllabus Lab',
      actionView: 'practicals',
      interactiveElement: (
        <div className="bg-slate-950/80 border border-purple-500/20 p-4 rounded-2xl w-full max-w-sm mx-auto font-sans text-left">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] text-purple-400 font-bold tracking-widest uppercase">SANDBOX PREVIEW</span>
            <div className="flex gap-1.5">
              {(['AND', 'OR', 'XOR'] as const).map((type) => (
                <button
                  key={type}
                  onClick={(e) => {
                    e.stopPropagation();
                    setGateType(type);
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] font-black transition-all ${
                    gateType === type ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-around py-4 relative">
            {/* Input Lines & Toggles */}
            <div className="flex flex-col gap-4 z-10">
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setInputA(!inputA);
                  }}
                  className={`w-7 h-7 rounded-lg font-mono text-xs font-black transition-all border flex items-center justify-center ${
                    inputA 
                      ? 'bg-emerald-500 text-emerald-950 border-emerald-400 shadow-md shadow-emerald-500/20' 
                      : 'bg-slate-800 text-slate-500 border-slate-700'
                  }`}
                >
                  {inputA ? '1' : '0'}
                </button>
                <span className="text-[10px] font-bold text-slate-400">INPUT A</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setInputB(!inputB);
                  }}
                  className={`w-7 h-7 rounded-lg font-mono text-xs font-black transition-all border flex items-center justify-center ${
                    inputB 
                      ? 'bg-emerald-500 text-emerald-950 border-emerald-400 shadow-md shadow-emerald-500/20' 
                      : 'bg-slate-800 text-slate-500 border-slate-700'
                  }`}
                >
                  {inputB ? '1' : '0'}
                </button>
                <span className="text-[10px] font-bold text-slate-400">INPUT B</span>
              </div>
            </div>

            {/* Connecting dynamic wires using raw SVGs */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
              <path 
                d="M 50 25 L 140 40" 
                stroke={inputA ? '#10b981' : '#475569'} 
                strokeWidth={inputA ? '3' : '1.5'} 
                fill="none" 
                className="transition-all duration-300"
              />
              <path 
                d="M 50 65 L 140 55" 
                stroke={inputB ? '#10b981' : '#475569'} 
                strokeWidth={inputB ? '3' : '1.5'} 
                fill="none" 
                className="transition-all duration-300"
              />
              <path 
                d="M 195 48 L 260 48" 
                stroke={getGateOutput() ? '#10b981' : '#475569'} 
                strokeWidth={getGateOutput() ? '3' : '1.5'} 
                fill="none" 
                className="transition-all duration-300 animate-pulse"
              />
            </svg>

            {/* Gate Representation */}
            <div className="w-16 h-12 bg-slate-800 border border-purple-500/30 rounded-xl flex flex-col items-center justify-center relative shadow-lg z-10">
              <Cpu className="w-4 h-4 text-purple-400 mb-0.5" />
              <span className="text-[9px] font-black text-white">{gateType}</span>
            </div>

            {/* Output Display */}
            <div className="flex flex-col items-center gap-1 z-10">
              <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-mono text-xs font-black transition-all ${
                getGateOutput() 
                  ? 'bg-emerald-500 text-emerald-950 border-emerald-300 animate-pulse shadow-lg shadow-emerald-500/35' 
                  : 'bg-slate-900 text-slate-600 border-slate-850'
              }`}>
                {getGateOutput() ? '1' : '0'}
              </div>
              <span className="text-[9px] font-extrabold text-slate-400 uppercase">OUTPUT</span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'chemistry',
      subject: 'CHEMISTRY LAB',
      title: 'Reaction Rate & Turbidity',
      question: 'Investigate HCl & Thiosulfate reaction rates dynamically. Note how heat accelerates the precipitate.',
      emoji: '🧪',
      accentColor: 'text-amber-400 border-amber-500/30',
      gradient: 'from-slate-900 via-amber-950 to-stone-950',
      actionText: 'Enter Chemistry Lab',
      actionView: 'practicals',
      interactiveElement: (
        <div className="bg-slate-950/80 border border-amber-500/20 p-4 rounded-2xl w-full max-w-sm mx-auto font-sans text-left">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] text-amber-400 font-bold tracking-widest uppercase">KINETICS LIVE PREVIEW</span>
            <span className="text-[10px] text-slate-400 font-mono font-bold">Temp: {temp}°C</span>
          </div>

          {/* Temperature Slider */}
          <div className="mb-4">
            <input 
              type="range" 
              min="10" 
              max="90" 
              value={temp} 
              onChange={(e) => {
                e.stopPropagation();
                setTemp(Number(e.target.value));
              }}
              className="w-full accent-amber-500 cursor-pointer h-1 bg-slate-800 rounded-lg appearance-none"
            />
            <div className="flex justify-between text-[9px] text-slate-500 font-bold mt-1">
              <span>10°C (Cold)</span>
              <span>50°C (Warm)</span>
              <span>90°C (Hot)</span>
            </div>
          </div>

          <div className="flex items-center gap-4 py-2">
            {/* Flask render */}
            <div className="relative w-14 h-16 border-2 border-slate-400 rounded-b-xl rounded-t-md mx-auto flex flex-col justify-end overflow-hidden">
              {/* Fluid precipitate simulation */}
              <div 
                className="w-full transition-all duration-300"
                style={{
                  height: '60%',
                  backgroundColor: `rgba(245, 158, 11, ${0.15 + (reactionProgress / 100) * 0.75})`,
                  backdropFilter: `blur(${(reactionProgress / 100) * 6}px)`
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                {reactionProgress > 0 && (
                  <span className="text-[9px] font-black text-white bg-black/60 px-1 py-0.5 rounded">
                    {Math.round(reactionProgress)}%
                  </span>
                )}
              </div>
            </div>

            <div className="flex-1 space-y-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsReacting(!isReacting);
                  if (!isReacting) setReactionProgress(0);
                }}
                className={`w-full py-2 px-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                  isReacting 
                    ? 'bg-red-600 text-white animate-pulse' 
                    : 'bg-amber-500 text-amber-950 hover:bg-amber-400'
                }`}
              >
                {isReacting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Flame className="w-3.5 h-3.5" />}
                {isReacting ? 'Reset Reaction' : 'Inject HCl & Start'}
              </button>
              <p className="text-[9px] text-slate-400 italic">
                {isReacting ? 'Precipitate is rapidly gathering...' : 'Press to inject hydrochloric acid.'}
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'physics',
      subject: 'PHYSICS RESONANCE',
      title: 'Sound Waves & Air Columns',
      question: 'Experiment with sound waves inside resonance tubes. Change frequencies to target active standing harmonics.',
      emoji: '📐',
      accentColor: 'text-cyan-400 border-cyan-500/30',
      gradient: 'from-slate-900 via-cyan-950 to-sky-950',
      actionText: 'Launch Physics Lab',
      actionView: 'practicals',
      interactiveElement: (
        <div className="bg-slate-950/80 border border-cyan-500/20 p-4 rounded-2xl w-full max-w-sm mx-auto font-sans text-left">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] text-cyan-400 font-bold tracking-widest uppercase">OSCILLOSCOPE WAVE</span>
            <span className="text-[10px] text-slate-400 font-mono font-bold">{frequency} Hz</span>
          </div>

          {/* Dynamic Frequency Dial */}
          <div className="mb-4">
            <input 
              type="range" 
              min="200" 
              max="800" 
              value={frequency} 
              onChange={(e) => {
                e.stopPropagation();
                setFrequency(Number(e.target.value));
              }}
              className="w-full accent-cyan-500 cursor-pointer h-1 bg-slate-800 rounded-lg appearance-none"
            />
            <div className="flex justify-between text-[9px] text-slate-500 font-bold mt-1">
              <span>Bass (200Hz)</span>
              <span>Mid (500Hz)</span>
              <span>Treble (800Hz)</span>
            </div>
          </div>

          {/* Animated Wave Sandbox */}
          <div className="h-14 bg-slate-900 rounded-xl relative overflow-hidden flex items-center border border-slate-800">
            <svg className="w-full h-full absolute inset-0 pointer-events-none">
              <path 
                d={Array.from({ length: 100 }, (_, i) => {
                  const x = (i / 99) * 320;
                  const phase = Date.now() / 150;
                  // Amp scales with frequency slightly for cool physics look
                  const amp = 18 + Math.sin(frequency / 100) * 4;
                  const freqScale = frequency / 100;
                  const y = 28 + Math.sin(i * 0.15 * freqScale + phase) * amp;
                  return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                }).join(' ')}
                stroke="#22d3ee"
                strokeWidth="2"
                fill="none"
              />
            </svg>
            <div className="absolute bottom-1 right-2 flex items-center gap-1">
              <Activity className="w-3 h-3 text-cyan-400 animate-pulse" />
              <span className="text-[8px] font-mono text-cyan-400 font-black uppercase">standing resonance</span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'biology',
      subject: 'BIOLOGY PHYSIOLOGY',
      title: 'Enzyme Activity Chamber',
      question: 'Investigate how the salivary amylase enzyme behaves inside different GCE test tube scenarios.',
      emoji: '🍃',
      accentColor: 'text-emerald-400 border-emerald-500/30',
      gradient: 'from-slate-900 via-emerald-950 to-teal-950',
      actionText: 'Launch Biology Lab',
      actionView: 'practicals',
      interactiveElement: (
        <div className="bg-slate-950/80 border border-emerald-500/20 p-4 rounded-2xl w-full max-w-sm mx-auto font-sans text-left relative overflow-hidden">
          <span className="text-[10px] text-emerald-400 font-bold tracking-widest uppercase block mb-3">MICROSCOPIC ENZYME MOTION</span>
          
          <div className="h-20 bg-slate-900 rounded-xl relative overflow-hidden flex items-center justify-center">
            {/* Animated floating spheres representing enzymes and substrates */}
            <motion.div 
              animate={{
                x: [10, -20, 20, 10],
                y: [5, 15, -10, 5],
              }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="absolute w-4 h-4 rounded-full bg-emerald-500/60 blur-[1px] flex items-center justify-center text-[7px] text-white font-black"
            >
              E
            </motion.div>
            <motion.div 
              animate={{
                x: [-30, 40, -10, -30],
                y: [20, -10, 15, 20],
              }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
              className="absolute w-3.5 h-3.5 rounded-full bg-teal-500/60 blur-[1px] flex items-center justify-center text-[7px] text-white font-black"
            >
              S
            </motion.div>
            <motion.div 
              animate={{
                x: [40, -10, -40, 40],
                y: [-15, 20, -5, -15],
              }}
              transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
              className="absolute w-4.5 h-4.5 rounded-full bg-green-500/50 blur-[2px] flex items-center justify-center text-[7px] text-white font-black"
            >
              E-S
            </motion.div>

            {/* Microscopic visual backdrop */}
            <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(circle_at_center,white_1px,transparent_0)] bg-[length:12px_12px]" />
            <div className="text-center z-10">
              <span className="text-[10px] text-slate-300 font-bold bg-black/60 px-2 py-1 rounded-full border border-white/5">
                Active Temp: 37.5°C (Optimum)
              </span>
            </div>
          </div>
        </div>
      )
    }
  ];

  const handleNext = () => {
    setDirection(1);
    setCurrentIdx((prev) => (prev + 1) % slides.length);
  };

  const handlePrev = () => {
    setDirection(-1);
    setCurrentIdx((prev) => (prev - 1 + slides.length) % slides.length);
  };

  // Autoplay handler
  useEffect(() => {
    if (!isAutoPlaying) return;
    const t = setInterval(() => {
      handleNext();
    }, 8500);
    return () => clearInterval(t);
  }, [isAutoPlaying]);

  const activeSlide = slides[currentIdx];

  return (
    <div 
      className="relative w-full py-16 px-6 overflow-hidden select-none"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      <div className="max-w-6xl mx-auto flex flex-col items-center">
        {/* Title and subtitle */}
        <div className="text-center mb-12">
          <span className="text-indigo-650 font-black text-xs uppercase tracking-widest bg-indigo-50 px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 border border-indigo-100 shadow-sm mb-3">
            <Sparkles className="w-3.5 h-3.5 text-indigo-650 animate-pulse" /> GCE SYLLABUS INTERACTIVE DECKS
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 font-display tracking-tight leading-tight">
            Advanced Conceptual Decks
          </h2>
          <p className="text-slate-500 max-w-md mx-auto text-sm mt-3 font-medium">
            Slide, test, tweak, and discover scientific paradigms modeled directly from the Cameroon national examinations.
          </p>
        </div>

        {/* Carousel & Navigation container */}
        <div className="relative w-full flex items-center justify-between gap-4">
          
          {/* Left Arrow Button */}
          <button
            onClick={handlePrev}
            className="w-12 h-12 rounded-full bg-white border border-slate-100 shadow-lg hover:shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all text-slate-600 hover:text-indigo-600 shrink-0 cursor-pointer z-20"
            title="Previous Slide"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Active 3D Slide Frame */}
          <div className="flex-1 max-w-4xl h-[480px] md:h-[420px] flex items-center justify-center relative px-2">
            <AnimatePresence initial={false} mode="wait">
              <motion.div
                key={activeSlide.id}
                initial={{ opacity: 0, x: direction * 80, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -direction * 80, scale: 0.98 }}
                transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                className="w-full h-full"
              >
                <ThreeDCard 
                  depth={8} 
                  glareOpacity={0.25} 
                  className={`w-full h-full bg-gradient-to-br ${activeSlide.gradient} rounded-[2.5rem] border border-white/10 p-8 md:p-10 flex flex-col md:flex-row items-center gap-8 text-white relative shadow-2xl overflow-hidden`}
                >
                  {/* Decorative faint grid */}
                  <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(circle_at_2px_2px,white_1px,transparent_0)] bg-[length:24px_24px]" />
                  
                  {/* Subject details & descriptions */}
                  <div className="flex-1 flex flex-col justify-between h-full z-10 text-left">
                    <div>
                      <span className={`text-[11px] font-black tracking-widest uppercase border px-3 py-1 rounded-full ${activeSlide.accentColor} inline-block mb-4`}>
                        {activeSlide.subject}
                      </span>
                      <h3 className="text-2xl md:text-4xl font-extrabold font-display leading-tight mb-3">
                        {activeSlide.title}
                      </h3>
                      <p className="text-slate-300 text-sm md:text-base leading-relaxed font-medium">
                        {activeSlide.question}
                      </p>
                    </div>

                    <div className="pt-6">
                      <button
                        onClick={() => onAction(activeSlide.actionView, activeSlide.id)}
                        className="px-6 py-3.5 bg-white text-slate-900 hover:bg-slate-50 font-black uppercase text-xs tracking-wider rounded-xl cursor-pointer shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                      >
                        <Play className="w-3.5 h-3.5 fill-current text-slate-900" />
                        <span>{activeSlide.actionText}</span>
                      </button>
                    </div>
                  </div>

                  {/* Sandbox interactive content element */}
                  <div className="w-full md:w-[380px] shrink-0 z-10 flex flex-col justify-center">
                    {activeSlide.interactiveElement}
                  </div>
                </ThreeDCard>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right Arrow Button */}
          <button
            onClick={handleNext}
            className="w-12 h-12 rounded-full bg-white border border-slate-100 shadow-lg hover:shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all text-slate-600 hover:text-indigo-600 shrink-0 cursor-pointer z-20"
            title="Next Slide"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Dynamic slide progress indicator bulbs */}
        <div className="flex gap-2.5 mt-8">
          {slides.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => {
                setDirection(idx > currentIdx ? 1 : -1);
                setCurrentIdx(idx);
              }}
              className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                currentIdx === idx 
                  ? 'w-10 bg-indigo-600 shadow-md shadow-indigo-600/30' 
                  : 'w-2.5 bg-slate-300 hover:bg-slate-400'
              }`}
              title={`Jump to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
