import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Flame, 
  Tv, 
  Beaker, 
  Activity, 
  Lock, 
  Sparkles, 
  Play, 
  RotateCcw, 
  HelpCircle, 
  ChevronRight, 
  Database, 
  Layers, 
  Info, 
  Thermometer, 
  Sun, 
  Cpu, 
  FileText,
  Lightbulb,
  CheckCircle2,
  AlertCircle,
  Plus,
  Check,
  CheckSquare,
  FileCheck,
  Binary,
  Dna
} from 'lucide-react';
import { PRACTICALS_DATA } from '../data/practicalsData';
import { ThreeDCard } from './ThreeDCard';

interface PracticalsSectionProps {
  isPremium: boolean;
  onTriggerUpgrade?: () => void;
  language?: 'ENGLISH' | 'FRENCH' | 'SPANISH' | 'CHINESE';
}

type SubjectId = 'chemistry' | 'physics' | 'biology' | 'computer_science';

interface Topic {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const getExperimentIcon = (id: string, subject: SubjectId) => {
  if (id === 'titration') return <Beaker className="w-5 h-5 text-pink-500" />;
  if (id === 'salt_analysis') return <Flame className="w-5 h-5 text-amber-500" />;
  if (id === 'pendulum') return <Activity className="w-5 h-5 text-blue-500" />;
  if (id === 'ohms_law') return <Cpu className="w-5 h-5 text-emerald-500" />;
  if (id === 'photosynthesis') return <Sun className="w-5 h-5 text-amber-500" />;
  if (id === 'food_tests') return <Beaker className="w-5 h-5 text-indigo-500" />;
  if (id === 'logic_gates') return <Tv className="w-5 h-5 text-purple-500" />;
  if (id === 'sql_sandbox') return <Database className="w-5 h-5 text-cyan-500" />;

  // General fallback icons per subject
  if (subject === 'chemistry') return <Beaker className="w-5 h-5 text-rose-500" />;
  if (subject === 'physics') return <Thermometer className="w-5 h-5 text-blue-500" />;
  if (subject === 'biology') return <Dna className="w-5 h-5 text-emerald-500" />;
  return <Binary className="w-5 h-5 text-purple-500" />;
};

export default function PracticalsSection({ isPremium, onTriggerUpgrade, language = 'ENGLISH' }: PracticalsSectionProps) {
  const [selectedSubject, setSelectedSubject] = useState<SubjectId | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  const currentExperiment = selectedSubject && selectedTopic 
    ? PRACTICALS_DATA[selectedSubject]?.find(e => e.id === selectedTopic)
    : null;

  // Unified bench simulator states
  const [unifiedValue, setUnifiedValue] = useState<number>(50);
  const [recordedObservations, setRecordedObservations] = useState<{ x: number; y: number | string }[]>([]);
  const [userCalcAnswer, setUserCalcAnswer] = useState<string>('');
  const [calcFeedback, setCalcFeedback] = useState<string>('');
  const [calcSuccess, setCalcSuccess] = useState<boolean | null>(null);
  const [vivaAnswers, setVivaAnswers] = useState<Record<number, number>>({});
  const [checkedSteps, setCheckedSteps] = useState<Record<number, boolean>>({});
  
  // Sequential practice step states for unified lab bench
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [benchActivityState, setBenchActivityState] = useState<string>('idle');
  const [virtualWatchTime, setVirtualWatchTime] = useState<number>(0);
  const [virtualWatchActive, setVirtualWatchActive] = useState<boolean>(false);

  // Titration simulator states
  const [acidVolume, setAcidVolume] = useState(0); // mL added
  const [indicator, setIndicator] = useState<'phenolphthalein' | 'methyl_orange' | 'bromothymol'>('phenolphthalein');
  const [isTitrationCompleted, setIsTitrationCompleted] = useState(false);
  const [titrationFeedback, setTitrationFeedback] = useState('');
  const [flaskColor, setFlaskColor] = useState('rgba(236, 72, 153, 0.55)'); // initial Phenolphthalein in base NaOH (deep pink)
  const [isDripping, setIsDripping] = useState(false);
  const [titrationTries, setTitrationTries] = useState(0);
  const dripIntervalRef = useRef<any>(null);

  // Salt analysis states
  const [mysterySalt, setMysterySalt] = useState<{ name: string; cation: string; anion: string; formula: string; code: string }>({ name: 'Copper Sulfate', cation: 'Cu2+', anion: 'SO42-', formula: 'CuSO4', code: 'Salt Omega' });
  const [addedReagents, setAddedReagents] = useState<string[]>([]);
  const [precipitateText, setPrecipitateText] = useState('No reagent added yet. Solution is pale blue and clear.');
  const [saltGuessCation, setSaltGuessCation] = useState('');
  const [saltGuessAnion, setSaltGuessAnion] = useState('');
  const [saltFeedback, setSaltFeedback] = useState('');

  // Pendulum simulator states
  const [pendulumLength, setPendulumLength] = useState(1.0); // meters
  const [pendulumGravity, setPendulumGravity] = useState(9.8); // m/s^2
  const [isPendulumSwinging, setIsPendulumSwinging] = useState(false);
  const [stopwatchTime, setStopwatchTime] = useState(0); // seconds
  const [isStopwatchRunning, setIsStopwatchRunning] = useState(false);
  const [measuredPeriod, setMeasuredPeriod] = useState<number | null>(null);
  const [calcG, setCalcG] = useState('');
  const [gFeedback, setGFeedback] = useState('');
  const pendulumAngleRef = useRef(0);
  const pendulumAnimRef = useRef<any>(null);
  const stopwatchIntervalRef = useRef<any>(null);

  // Ohm's law states
  const [ohmsVoltage, setOhmsVoltage] = useState(5.0); // volts
  const [ohmsRheostat, setOhmsRheostat] = useState(20); // ohms (adjustable resistance)
  const [unknownResistor] = useState(10); // fixed internal unknown resistor
  const [recordedOhmsPoints, setRecordedOhmsPoints] = useState<{ V: number; I: number }[]>([]);
  const [ohmsGuess, setOhmsGuess] = useState('');
  const [ohmsFeedback, setOhmsFeedback] = useState('');

  // Photosynthesis states
  const [lightDistance, setLightDistance] = useState(40); // cm
  const [tempCelsius, setTempCelsius] = useState(25); // Celsius
  const [bubblesCount, setBubblesCount] = useState(0);
  const [isPhotosynthesisRunning, setIsPhotosynthesisRunning] = useState(false);
  const bubblesAnimRef = useRef<any>(null);

  // Biochemical Food Test states
  const [selectedFood, setSelectedFood] = useState<'potato' | 'milk' | 'egg' | 'oil'>('potato');
  const [selectedReagent, setSelectedReagent] = useState<'iodine' | 'biuret' | 'benedicts' | 'ethanol'>('iodine');
  const [isHeating, setIsHeating] = useState(false);
  const [foodTestResult, setFoodTestResult] = useState({ color: 'rgba(248, 250, 252, 0.9)', description: 'Ready to test.' });

  // Custom states for upgraded, separate experiments
  const [thioVolume, setThioVolume] = useState<number>(30); // mL (Reactant A)
  const [hclConc, setHclConc] = useState<number>(1.0); // M (Reactant B)
  const [reactionStage, setReactionStage] = useState<'idle' | 'mixing' | 'reacting' | 'completed'>('idle');
  const [crossOpacity, setCrossOpacity] = useState<number>(1);

  const [calAcidVol, setCalAcidVol] = useState<number>(50); // mL
  const [calBaseVol, setCalBaseVol] = useState<number>(50); // mL
  const [calAcidConc, setCalAcidConc] = useState<number>(1.0); // M
  const [calTemp, setCalTemp] = useState<number>(25.0); // Current calorimeter temp
  const [calStage, setCalStage] = useState<'idle' | 'pouring' | 'stirring' | 'completed'>('idle');

  const [resFrequency, setResFrequency] = useState<number>(384); // Hz
  const [resWaterLength, setResWaterLength] = useState<number>(20); // cm
  const [isTuningForkStruck, setIsTuningForkStruck] = useState<boolean>(false);

  const [hookeMass, setHookeMass] = useState<number>(100); // grams

  const [amylaseTemp, setAmylaseTemp] = useState<number>(37); // °C
  const [amylaseTimeMinutes, setAmylaseTimeMinutes] = useState<number>(0); // timer
  const [amylaseDrops, setAmylaseDrops] = useState<string[]>(['blue-black', 'blue-black', 'blue-black', 'blue-black', 'blue-black', 'blue-black']);
  const [amylaseStage, setAmylaseStage] = useState<'idle' | 'running' | 'completed'>('idle');

  const [bitwiseBits, setBitwiseBits] = useState<number[]>([0, 0, 0, 0, 0, 0, 0, 0]);
  const [bitwiseBitsB, setBitwiseBitsB] = useState<number[]>([0, 1, 0, 1, 1, 0, 1, 0]);
  const [bitwiseOp, setBitwiseOp] = useState<'AND' | 'OR' | 'XOR' | 'SHIFT_L' | 'SHIFT_R'>('AND');

  const [subnetPrefix, setSubnetPrefix] = useState<number>(24);

  // Logic gates states
  const [gateType, setGateType] = useState<'AND' | 'OR' | 'NOT' | 'XOR' | 'NAND' | 'NOR'>('AND');
  const [inputA, setInputA] = useState(false);
  const [inputB, setInputB] = useState(false);

  // SQL queries states
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM results WHERE score >= 80;');
  const [sqlResult, setSqlResult] = useState<any[]>([]);
  const [sqlError, setSqlError] = useState('');
  const [sqlSuccess, setSqlQuerySuccess] = useState(false);

  // Generate mystery salt on init or reset
  const SALTS = [
    { name: 'Copper Sulfate', formula: 'CuSO4', cation: 'Cu2+', anion: 'SO42-', code: 'Sample Alpha' },
    { name: 'Iron(II) Chloride', formula: 'FeCl2', cation: 'Fe2+', anion: 'Cl-', code: 'Sample Beta' },
    { name: 'Iron(III) Sulfate', formula: 'Fe2(SO4)3', cation: 'Fe3+', anion: 'SO42-', code: 'Sample Gamma' },
    { name: 'Zinc Chloride', formula: 'ZnCl2', cation: 'Zn2+', anion: 'Cl-', code: 'Sample Delta' },
    { name: 'Aluminum Chloride', formula: 'AlCl3', cation: 'Al3+', anion: 'Cl-', code: 'Sample Epsilon' }
  ];

  const resetSaltAnalysis = () => {
    const randomSalt = SALTS[Math.floor(Math.random() * SALTS.length)];
    setMysterySalt(randomSalt);
    setAddedReagents([]);
    setSaltGuessCation('');
    setSaltGuessAnion('');
    setSaltFeedback('');
    let initialColorDesc = 'No reagent added yet. Solution is clear.';
    if (randomSalt.cation === 'Cu2+') initialColorDesc = 'No reagent added yet. Solution is pale blue and clear.';
    else if (randomSalt.cation === 'Fe2+') initialColorDesc = 'No reagent added yet. Solution is pale green.';
    else if (randomSalt.cation === 'Fe3+') initialColorDesc = 'No reagent added yet. Solution is pale yellow-orange.';
    setPrecipitateText(initialColorDesc);
  };

  const startReactionRate = () => {
    setReactionStage('mixing');
    setCrossOpacity(1);
    setBenchActivityState('reacting');
    setVirtualWatchTime(0);
    setVirtualWatchActive(false);
    
    setTimeout(() => {
      setReactionStage('reacting');
      setVirtualWatchActive(true);
      
      const expectedRate = 0.005 * unifiedValue + 0.01;
      const totalTime = 1 / expectedRate;
      
      let elapsed = 0;
      const interval = setInterval(() => {
        elapsed += 0.1;
        const progress = Math.min(1, elapsed / totalTime);
        setCrossOpacity(1 - progress);
        if (progress >= 1) {
          clearInterval(interval);
          setReactionStage('completed');
          setVirtualWatchActive(false);
          setBenchActivityState('done');
        }
      }, 100);
    }, 1200);
  };

  const startCalorimetry = () => {
    setCalStage('pouring');
    setBenchActivityState('pouring');
    setTimeout(() => {
      setCalStage('stirring');
      setBenchActivityState('stirring');
      
      const dT = 5.7 * unifiedValue;
      const targetTemp = 25.0 + dT;
      
      let currentT = 25.0;
      const interval = setInterval(() => {
        currentT += 0.2;
        if (currentT >= targetTemp) {
          currentT = targetTemp;
          clearInterval(interval);
          setCalStage('completed');
          setBenchActivityState('done');
        }
        setCalTemp(currentT);
      }, 50);
    }, 1000);
  };

  const strikeTuningFork = () => {
    setIsTuningForkStruck(true);
    setBenchActivityState('vibrating');
    setTimeout(() => {
      setIsTuningForkStruck(false);
      setBenchActivityState('idle');
    }, 4000);
  };

  const runAmylaseTest = () => {
    setAmylaseStage('running');
    setBenchActivityState('incubating');
    setAmylaseDrops(['blue-black', 'blue-black', 'blue-black', 'blue-black', 'blue-black', 'blue-black']);
    
    const temp = unifiedValue;
    const diff = Math.abs(temp - 37);
    const digestionTime = Math.max(20, 20 + diff * diff * 0.4);
    
    let step = 0;
    const interval = setInterval(() => {
      const wellTime = (step + 1) * 10;
      const isDigested = wellTime >= digestionTime;
      
      setAmylaseDrops(prev => {
        const next = [...prev];
        if (isDigested) {
          next[step] = 'amber';
        } else {
          if (wellTime + 5 >= digestionTime) {
            next[step] = 'purple-amber';
          } else {
            next[step] = 'blue-black';
          }
        }
        return next;
      });
      
      step++;
      if (step >= 6) {
        clearInterval(interval);
        setAmylaseStage('completed');
        setBenchActivityState('done');
      }
    }, 600);
  };

  useEffect(() => {
    if (selectedTopic === 'salt_analysis') {
      resetSaltAnalysis();
    }
  }, [selectedTopic]);

  useEffect(() => {
    if (selectedTopic && selectedSubject) {
      const exp = PRACTICALS_DATA[selectedSubject]?.find(e => e.id === selectedTopic);
      if (exp) {
        setUnifiedValue(exp.inputDefault !== undefined ? exp.inputDefault : 50);
      }
      setRecordedObservations([]);
      setUserCalcAnswer('');
      setCalcFeedback('');
      setCalcSuccess(null);
      setVivaAnswers({});
      setCheckedSteps({});
      setActiveStepIndex(0);
      setBenchActivityState('idle');
      setVirtualWatchTime(0);
      setVirtualWatchActive(false);

      // Reset custom upgraded experiment states
      setThioVolume(30);
      setHclConc(1.0);
      setReactionStage('idle');
      setCrossOpacity(1);

      setCalAcidVol(50);
      setCalBaseVol(50);
      setCalAcidConc(1.0);
      setCalTemp(25.0);
      setCalStage('idle');

      setResFrequency(384);
      setResWaterLength(20);
      setIsTuningForkStruck(false);

      setHookeMass(100);

      setAmylaseTemp(37);
      setAmylaseTimeMinutes(0);
      setAmylaseDrops(['blue-black', 'blue-black', 'blue-black', 'blue-black', 'blue-black', 'blue-black']);
      setAmylaseStage('idle');

      setBitwiseBits([0, 0, 0, 0, 0, 0, 0, 0]);
      setBitwiseBitsB([0, 1, 0, 1, 1, 0, 1, 0]);
      setBitwiseOp('AND');
      setSubnetPrefix(24);
    }
  }, [selectedTopic, selectedSubject]);

  // Dynamic Stopwatch Interval for Physics and General practice timer
  useEffect(() => {
    let watchId: any = null;
    if (virtualWatchActive) {
      watchId = setInterval(() => {
        setVirtualWatchTime((prev) => parseFloat((prev + 0.1).toFixed(1)));
      }, 100);
    } else {
      if (watchId) clearInterval(watchId);
    }
    return () => {
      if (watchId) clearInterval(watchId);
    };
  }, [virtualWatchActive]);

  // Titration logic
  useEffect(() => {
    // Exact endpoint volume should be around 25.0 mL of Acid
    const excess = acidVolume - 25.0;
    
    if (indicator === 'phenolphthalein') {
      if (excess < -0.5) {
        setFlaskColor('rgba(236, 72, 153, 0.65)'); // bright deep pink in strong base
      } else if (excess >= -0.5 && excess < 0) {
        // transitioning color
        const opacity = 0.65 * (Math.abs(excess) / 0.5);
        setFlaskColor(`rgba(236, 72, 153, ${Math.max(0.12, opacity)})`); // light pink near end point
      } else {
        setFlaskColor('rgba(241, 245, 249, 0.4)'); // completely colorless in acid
      }
    } else if (indicator === 'methyl_orange') {
      if (excess < -0.3) {
        setFlaskColor('rgba(245, 158, 11, 0.7)'); // yellow in basic
      } else if (excess >= -0.3 && excess <= 0.3) {
        setFlaskColor('rgba(234, 88, 12, 0.8)'); // orange at endpoint pH
      } else {
        setFlaskColor('rgba(239, 68, 68, 0.85)'); // red in acidic
      }
    } else if (indicator === 'bromothymol') {
      if (excess < -0.4) {
        setFlaskColor('rgba(37, 99, 235, 0.7)'); // blue in basic
      } else if (excess >= -0.4 && excess <= 0.4) {
        setFlaskColor('rgba(22, 163, 74, 0.75)'); // green at neutral pH
      } else {
        setFlaskColor('rgba(234, 179, 8, 0.75)'); // yellow in acidic
      }
    }
  }, [acidVolume, indicator]);

  const handleAddAcid = (amount: number) => {
    setAcidVolume(prev => {
      const next = Math.min(50, prev + amount);
      if (next >= 50) {
        setIsDripping(false);
      }
      return next;
    });
  };

  const toggleTitrationDrip = () => {
    if (isDripping) {
      setIsDripping(false);
    } else {
      if (acidVolume >= 50) {
        setTitrationFeedback("Burette is empty! Reset to perform another titration run.");
        return;
      }
      setIsDripping(true);
    }
  };

  useEffect(() => {
    if (isDripping) {
      dripIntervalRef.current = setInterval(() => {
        handleAddAcid(0.1);
      }, 100);
    } else {
      if (dripIntervalRef.current) {
        clearInterval(dripIntervalRef.current);
      }
    }
    return () => {
      if (dripIntervalRef.current) clearInterval(dripIntervalRef.current);
    };
  }, [isDripping]);

  const verifyTitration = () => {
    setTitrationTries(t => t + 1);
    const diff = Math.abs(acidVolume - 25.0);
    if (diff < 0.2) {
      setIsTitrationCompleted(true);
      setTitrationFeedback(`🎉 CONGRATULATIONS! You successfully reached the exact equivalence endpoint at ${acidVolume.toFixed(2)} mL! The pink color of phenolphthalein just vanished, which indicates a perfectly neutralized solution of sodium hydroxide with hydrochloric acid. You are certified for volumetric analysis!`);
    } else if (diff < 0.8) {
      setTitrationFeedback(`Very close! Volume is ${acidVolume.toFixed(2)} mL. Your solution color is transitional, but not perfectly neutralized. Try to get closer to 25.00 mL with slow drips (0.1 mL)!`);
    } else if (acidVolume > 25.0) {
      setTitrationFeedback(`You overshot the endpoint! Volume is ${acidVolume.toFixed(2)} mL. The solution is already acidic. Press "Reset Burette" and be more careful when approaching the equivalence volume.`);
    } else {
      setTitrationFeedback(`Still basic. You added ${acidVolume.toFixed(2)} mL. Add more acid from the burette to neutralize the 25.0 mL NaOH solution.`);
    }
  };

  const resetTitration = () => {
    setAcidVolume(0);
    setIsTitrationCompleted(false);
    setTitrationFeedback('');
    setIsDripping(false);
    setFlaskColor('rgba(236, 72, 153, 0.65)');
  };

  // Salt analysis chemistry logic
  const addSaltReagent = (reagent: 'NaOH' | 'NH3' | 'BaCl2' | 'AgNO3') => {
    setAddedReagents(prev => [...prev, reagent]);
    
    if (reagent === 'NaOH') {
      if (mysterySalt.cation === 'Cu2+') {
        setPrecipitateText('Added NaOH: A beautiful, pale blue gelatinous precipitate forms. It does not dissolve in excess NaOH.');
      } else if (mysterySalt.cation === 'Fe2+') {
        setPrecipitateText('Added NaOH: A dirty green precipitate forms instantly. It is insoluble in excess NaOH.');
      } else if (mysterySalt.cation === 'Fe3+') {
        setPrecipitateText('Added NaOH: A reddish-brown gelatinous precipitate forms instantly. It is insoluble in excess NaOH.');
      } else if (mysterySalt.cation === 'Zn2+') {
        setPrecipitateText('Added NaOH: A gelatinous white precipitate forms. Crucially, it dissolves completely in excess NaOH to form a clear, colorless solution.');
      } else if (mysterySalt.cation === 'Al3+') {
        setPrecipitateText('Added NaOH: A chalky white precipitate forms. It dissolves in excess NaOH to form a clear, colorless solution.');
      }
    } else if (reagent === 'NH3') {
      if (mysterySalt.cation === 'Cu2+') {
        setPrecipitateText('Added Ammonia solution: A light blue precipitate forms first. Upon adding excess Ammonia, the precipitate dissolves to give a magnificent, deep dark royal blue solution.');
      } else if (mysterySalt.cation === 'Fe2+') {
        setPrecipitateText('Added Ammonia solution: A dirty green precipitate forms, insoluble in excess.');
      } else if (mysterySalt.cation === 'Fe3+') {
        setPrecipitateText('Added Ammonia solution: A reddish-brown precipitate forms, insoluble in excess.');
      } else if (mysterySalt.cation === 'Zn2+') {
        setPrecipitateText('Added Ammonia solution: A white precipitate forms. It dissolves easily in excess ammonia to give a clear, colorless solution (Zinc-ammine complex).');
      } else if (mysterySalt.cation === 'Al3+') {
        setPrecipitateText('Added Ammonia solution: A white precipitate forms. Crucially, it is completely insoluble in excess ammonia, distinguishing it from Zinc!');
      }
    } else if (reagent === 'BaCl2') {
      if (mysterySalt.anion === 'SO42-') {
        setPrecipitateText('Added Barium Chloride: A thick, dense white precipitate of Barium Sulfate (BaSO₄) forms. Adding dilute HCl does NOT dissolve this precipitate, confirming Sulfate presence!');
      } else {
        setPrecipitateText('Added Barium Chloride: No change. Solution remains clear.');
      }
    } else if (reagent === 'AgNO3') {
      if (mysterySalt.anion === 'Cl-') {
        setPrecipitateText('Added Silver Nitrate: A white, curd-like precipitate of Silver Chloride (AgCl) forms. This precipitate dissolves completely when dilute ammonia solution is added, confirming Chloride presence!');
      } else {
        setPrecipitateText('Added Silver Nitrate: No change. Solution remains clear.');
      }
    }
  };

  const verifySaltGuess = () => {
    if (!saltGuessCation || !saltGuessAnion) {
      setSaltFeedback('Please select both a Cation and an Anion to submit your qualitative analysis.');
      return;
    }

    if (saltGuessCation === mysterySalt.cation && saltGuessAnion === mysterySalt.anion) {
      setSaltFeedback(`🎉 EXTRAORDINARY LAB SKILL! You identified the mystery substance: ${mysterySalt.name} (${mysterySalt.formula}) correctly! Your analytical deduction based on chemical precipitation laws is highly accurate!`);
    } else {
      setSaltFeedback(`Incorrect identification. Review the precipitate reactions. Zinc and Aluminum white precipitates differ when treated with excess Ammonia. Sulfate forms insoluble precipitates with BaCl2, and Chloride forms precipitates with AgNO3. Try again!`);
    }
  };


  // Pendulum simulator physics logic
  useEffect(() => {
    if (isStopwatchRunning) {
      stopwatchIntervalRef.current = setInterval(() => {
        setStopwatchTime(prev => prev + 0.05);
      }, 50);
    } else {
      if (stopwatchIntervalRef.current) clearInterval(stopwatchIntervalRef.current);
    }
    return () => {
      if (stopwatchIntervalRef.current) clearInterval(stopwatchIntervalRef.current);
    };
  }, [isStopwatchRunning]);

  const toggleStopwatch = () => {
    if (isStopwatchRunning) {
      setIsStopwatchRunning(false);
      // Auto-set the measured period for 10 oscillations!
      // In theory, period T = 2 * pi * sqrt(L/g)
      // 10 oscillations is 10 * T
      const theoreticalT = 2 * Math.PI * Math.sqrt(pendulumLength / pendulumGravity);
      const measuredT = stopwatchTime / 10;
      setMeasuredPeriod(measuredT);
    } else {
      setStopwatchTime(0);
      setIsStopwatchRunning(true);
    }
  };

  const checkGravityCalculations = () => {
    const parsedG = parseFloat(calcG);
    if (isNaN(parsedG)) {
      setGFeedback('Please enter a valid numeric value for your calculated g.');
      return;
    }
    const theoreticalG = pendulumGravity;
    const errorPct = (Math.abs(parsedG - theoreticalG) / theoreticalG) * 100;
    
    if (errorPct < 5) {
      setGFeedback(`🎉 BRUCELLIUS EXPERIMENT COMPLETE! Your calculated gravity is ${parsedG.toFixed(2)} m/s², which is within ${errorPct.toFixed(1)}% of the real acceleration of gravity (${theoreticalG} m/s²). Excellent timing and calculation technique!`);
    } else {
      setGFeedback(`Your calculated g is ${parsedG.toFixed(2)} m/s². The theoretical value is ${theoreticalG} m/s² (an error of ${errorPct.toFixed(1)}%). Remember the formula: T = t_total / 10, then g = 4 * π² * L / T². Re-measure or recalculate!`);
    }
  };

  // Ohm's law verification logic
  // Rheostat + unknown fixed resistor
  // Total R = Rheostat + Unknown
  // I = V / Total R
  const recordedCurrent = ohmsVoltage / (ohmsRheostat + unknownResistor);
  const recordedVoltsAcrossUnknown = recordedCurrent * unknownResistor;

  const recordOhmPoint = () => {
    if (recordedOhmsPoints.length >= 8) {
      setOhmsFeedback("You have enough points to trace the graph. Test your resistor value!");
    }
    const newPoint = {
      V: Number(recordedVoltsAcrossUnknown.toFixed(2)),
      I: Number((recordedCurrent * 1000).toFixed(1)) // milliAmperes
    };
    // Avoid duplicates
    if (!recordedOhmsPoints.some(p => p.V === newPoint.V && p.I === newPoint.I)) {
      setRecordedOhmsPoints(prev => [...prev, newPoint].sort((a,b) => a.V - b.V));
    }
  };

  const checkOhmsResistor = () => {
    const val = parseFloat(ohmsGuess);
    if (isNaN(val)) {
      setOhmsFeedback('Please write a valid number for resistance.');
      return;
    }
    if (Math.abs(val - unknownResistor) < 0.5) {
      setOhmsFeedback(`🎉 CIRCUIT VERIFIED PERFECTLY! The unknown resistor value is indeed ${unknownResistor} Ohms. You calculated the inverse of the line gradient correctly (R = V / I)!`);
    } else {
      setOhmsFeedback(`Incorrect resistor value. Take readings of voltage across the unknown resistor (V_resistor) and divide by the current (I in Amperes). Remember that I in the table is in milliAmperes (mA)!`);
    }
  };

  // Photosynthesis biology logic
  // Oxygen bubble release rate
  // Bubble rate decreases as distance of light increases: inverse square relationship
  // Rate also depends on Temperature: optimal around 30C, drops above 40C (enzyme denaturation)
  const calculateBubbleRate = () => {
    // base bubble rate at 10cm distance is 50 bubbles/min
    const distanceFactor = Math.pow(20 / Math.max(10, lightDistance), 1.5);
    let tempFactor = 1.0;
    if (tempCelsius < 15) tempFactor = 0.3;
    else if (tempCelsius < 25) tempFactor = 0.7 + 0.03 * (tempCelsius - 25);
    else if (tempCelsius >= 25 && tempCelsius <= 35) tempFactor = 1.0 + 0.02 * (tempCelsius - 25);
    else if (tempCelsius > 35 && tempCelsius < 45) tempFactor = 1.2 - 0.1 * (tempCelsius - 35);
    else tempFactor = 0.05; // denaturation

    const bubblesPerMin = Math.round(55 * distanceFactor * tempFactor);
    return Math.max(1, bubblesPerMin);
  };

  const bubbleRate = calculateBubbleRate();

  useEffect(() => {
    if (isPhotosynthesisRunning) {
      // release bubbles visually on interval
      const intervalMs = (60 / bubbleRate) * 1000;
      bubblesAnimRef.current = setInterval(() => {
        setBubblesCount(p => p + 1);
      }, Math.max(250, intervalMs));
    } else {
      if (bubblesAnimRef.current) clearInterval(bubblesAnimRef.current);
    }
    return () => {
      if (bubblesAnimRef.current) clearInterval(bubblesAnimRef.current);
    };
  }, [isPhotosynthesisRunning, bubbleRate]);


  // Biology food test logic
  const runFoodTest = () => {
    setIsHeating(false);
    if (selectedReagent === 'iodine') {
      if (selectedFood === 'potato') {
        setFoodTestResult({ color: 'rgba(15, 23, 42, 0.95)', description: 'Iodine Solution turns a dramatic Blue-Black. POSITIVE FOR STARCH.' });
      } else {
        setFoodTestResult({ color: 'rgba(217, 119, 6, 0.4)', description: 'Iodine remains orange-brown. NEGATIVE FOR STARCH.' });
      }
    } else if (selectedReagent === 'biuret') {
      if (selectedFood === 'milk' || selectedFood === 'egg') {
        setFoodTestResult({ color: 'rgba(139, 92, 246, 0.7)', description: 'Biuret solution changes to a deep Purple/Violet color. POSITIVE FOR PROTEINS.' });
      } else {
        setFoodTestResult({ color: 'rgba(147, 197, 253, 0.5)', description: 'Biuret remains light blue. NEGATIVE FOR PROTEINS.' });
      }
    } else if (selectedReagent === 'ethanol') {
      if (selectedFood === 'oil' || selectedFood === 'milk') {
        setFoodTestResult({ color: 'rgba(255, 255, 255, 0.85)', description: 'White, cloudy, milky emulsion forms when ethanol is mixed with water. POSITIVE FOR LIPIDS.' });
      } else {
        setFoodTestResult({ color: 'rgba(241, 245, 249, 0.3)', description: 'Remains clear and colorless. NEGATIVE FOR LIPIDS.' });
      }
    } else if (selectedReagent === 'benedicts') {
      setFoodTestResult({ color: 'rgba(59, 130, 246, 0.5)', description: 'Benedicts added, but wait! Reducing sugars require boiling heat to react. Click "Apply Heat (virtual Bunsen)" to activate.' });
    }
  };

  useEffect(() => {
    if (selectedTopic === 'food_tests') {
      runFoodTest();
    }
  }, [selectedFood, selectedReagent]);

  const applyHeatToBenedicts = () => {
    if (selectedReagent !== 'benedicts') return;
    setIsHeating(true);
    setTimeout(() => {
      setIsHeating(false);
      if (selectedFood === 'milk' || selectedFood === 'potato') {
        // Milk contains lactose, potato contains trace reducing sugars (or we make it turn green-orange, milk is highly positive)
        if (selectedFood === 'milk') {
          setFoodTestResult({ color: 'rgba(220, 38, 38, 0.9)', description: 'Boiling completed! solution changed from Blue to Green, then Orange, and finally dense Brick-Red precipitate. EXTREMELY POSITIVE FOR REDUCING SUGARS.' });
        } else {
          setFoodTestResult({ color: 'rgba(234, 88, 12, 0.8)', description: 'Boiling completed! solution changed from Blue to yellow-orange precipitate. MODERATELY POSITIVE FOR REDUCING SUGARS.' });
        }
      } else {
        setFoodTestResult({ color: 'rgba(59, 130, 246, 0.7)', description: 'Boiling completed! Solution remained light blue. NEGATIVE FOR REDUCING SUGARS.' });
      }
    }, 2500);
  };

  // Logic gates evaluation
  const evaluateLogicGate = () => {
    switch (gateType) {
      case 'AND': return inputA && inputB;
      case 'OR': return inputA || inputB;
      case 'NOT': return !inputA;
      case 'XOR': return inputA !== inputB;
      case 'NAND': return !(inputA && inputB);
      case 'NOR': return !(inputA || inputB);
      default: return false;
    }
  };

  const gateResult = evaluateLogicGate();

  // SQL Sandbox logic
  const runSQLQuery = () => {
    setSqlError('');
    setSqlQuerySuccess(false);
    
    const queryClean = sqlQuery.toLowerCase().trim().replace(/\s+/g, ' ');
    
    if (!queryClean.startsWith('select')) {
      setSqlError('Error: Only DQL queries (SELECT) are authorized on our secure GCE Relational engine.');
      return;
    }

    if (!queryClean.includes('from results') && !queryClean.includes('from students')) {
      setSqlError('Table not found. Please SELECT from "results" or "students" as defined in the schema below.');
      return;
    }

    // Mock data structures
    const STUDENTS_DB = [
      { id: 101, name: 'Sone Divine', gender: 'M', region: 'South West', points: 94.5 },
      { id: 102, name: 'Bih Clara', gender: 'F', region: 'North West', points: 82.0 },
      { id: 103, name: 'Abessolo Jean', gender: 'M', region: 'Centre', points: 76.8 },
      { id: 104, name: 'Mekinda Marie', gender: 'F', region: 'Littoral', points: 91.2 },
      { id: 105, name: 'Ndi Emmanuel', gender: 'M', region: 'West', points: 65.0 }
    ];

    const RESULTS_DB = [
      { id: 1, student_id: 101, subject: 'Mathematics', score: 95, grade: 'A', status: 'PAST_PAPER' },
      { id: 2, student_id: 101, subject: 'Physics', score: 92, grade: 'A', status: 'PAST_PAPER' },
      { id: 3, student_id: 102, subject: 'Mathematics', score: 81, grade: 'B', status: 'CONCOURS' },
      { id: 4, student_id: 103, subject: 'Chemistry', score: 78, grade: 'B', status: 'PAST_PAPER' },
      { id: 5, student_id: 104, subject: 'Biology', score: 89, grade: 'A', status: 'TOURNAMENT' },
      { id: 6, student_id: 105, subject: 'Physics', score: 58, grade: 'D', status: 'CONCOURS' }
    ];

    try {
      if (queryClean.includes('from students')) {
        let data = [...STUDENTS_DB];
        if (queryClean.includes('points >= 80') || queryClean.includes('points > 80')) {
          data = data.filter(s => s.points >= 80);
        } else if (queryClean.includes("gender = 'f'") || queryClean.includes("gender='f'")) {
          data = data.filter(s => s.gender === 'F');
        }
        setSqlResult(data);
        setSqlQuerySuccess(true);
      } else if (queryClean.includes('from results')) {
        let data = [...RESULTS_DB];
        if (queryClean.includes('score >= 80') || queryClean.includes('score > 80')) {
          data = data.filter(r => r.score >= 80);
        } else if (queryClean.includes("grade = 'a'") || queryClean.includes("grade='a'")) {
          data = data.filter(r => r.grade === 'A');
        }
        setSqlResult(data);
        setSqlQuerySuccess(true);
      }
    } catch (err: any) {
      setSqlError('SQL Execution Error: ' + err.message);
    }
  };

  // Trigger default SQL run on mount of the topic
  useEffect(() => {
    if (selectedTopic === 'sql_sandbox') {
      runSQLQuery();
    }
  }, [selectedTopic]);


  // Rendering Locked Screen for non-Premium
  if (!isPremium) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-24 px-6 max-w-4xl mx-auto space-y-8 animate-fadeIn">
        <div className="w-24 h-24 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-[2rem] flex items-center justify-center text-white shadow-xl shadow-indigo-200/50 relative">
          <Lock className="w-10 h-10" />
          <motion.div 
            animate={{ scale: [1, 1.12, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ repeat: Infinity, duration: 3 }}
            className="absolute -inset-2 bg-indigo-500 rounded-[2.5rem] -z-10"
          />
        </div>
        
        <div className="space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-[10px] font-black uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5 fill-amber-500" />
            <span>Exclusive Premium Feature</span>
          </div>
          <h2 className="text-4xl font-extrabold text-slate-800 font-display">
            Interactive Laboratory &amp; Practical Simulator
          </h2>
          <p className="text-slate-500 text-sm max-w-2xl mx-auto leading-relaxed font-semibold">
            Unlock fully immersive virtual lab simulations across Chemistry, Physics, Biology, and Computer Science. Master your official Cameroon National Curriculum (GCE, Baccalauréat, Concours) practicals through hands-on graphical test tubes, titration burettes, pendulum oscillations, and electrical circuits.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full max-w-3xl">
          <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm text-left">
            <span className="text-2xl block mb-2">🧪</span>
            <h4 className="font-extrabold text-slate-800 text-xs uppercase mb-1">Chemistry Lab</h4>
            <p className="text-[10px] text-slate-400 font-bold leading-normal">Acid-Base titration burettes, color-changing indicators, and qualitative salt analyses.</p>
          </div>
          <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm text-left">
            <span className="text-2xl block mb-2">📐</span>
            <h4 className="font-extrabold text-slate-800 text-xs uppercase mb-1">Physics Lab</h4>
            <p className="text-[10px] text-slate-400 font-bold leading-normal">Interactive simple pendulum oscillations and Ohm's Law electrical resistor tests.</p>
          </div>
          <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm text-left">
            <span className="text-2xl block mb-2">🍃</span>
            <h4 className="font-extrabold text-slate-800 text-xs uppercase mb-1">Biology Lab</h4>
            <p className="text-[10px] text-slate-400 font-bold leading-normal">Elodea photosynthesis factor testing and biochemical food tests with burner animations.</p>
          </div>
          <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm text-left">
            <span className="text-2xl block mb-2">💻</span>
            <h4 className="font-extrabold text-slate-800 text-xs uppercase mb-1">CS Terminal</h4>
            <p className="text-[10px] text-slate-400 font-bold leading-normal">Neon logic gates visual boards and SQL database query engines with direct live grids.</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onTriggerUpgrade}
          className="px-8 py-4 bg-gradient-to-r from-[#800080] to-[#2f47b3] text-white font-extrabold text-xs uppercase tracking-widest rounded-2xl shadow-xl hover:shadow-[#2f47b3]/30 transition-all transform hover:scale-[1.03] active:scale-95 cursor-pointer"
        >
          Activate Premium Premium Account &amp; Unlock Labs
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <span className="bg-indigo-50 text-[#2f47b3] text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-indigo-100">
            Premium Virtual Lab Suite
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 font-display mt-2">
            🔬 Academic Science &amp; Technology Practicals
          </h1>
          <p className="text-slate-500 text-xs mt-1 font-semibold leading-relaxed">
            Hands-on educational simulations to dominate your official paper practical exams and university entrance competitions.
          </p>
        </div>
        
        {(selectedSubject || selectedTopic) && (
          <button
            onClick={() => {
              if (selectedTopic) {
                setSelectedTopic(null);
              } else {
                setSelectedSubject(null);
              }
            }}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 self-start"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{selectedTopic ? 'Back to Topics' : 'Back to Subjects'}</span>
          </button>
        )}
      </div>

      {/* STEP 1: Select Subject */}
      {!selectedSubject && (
        <div className="space-y-6">
          <h3 className="text-lg font-black text-slate-800 uppercase tracking-wider">Choose a Practical Syllabus Subject</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { id: 'chemistry', name: 'Chemistry Lab', desc: 'Quantitative titration curves & chemical indicators', emoji: '🧪', color: 'from-pink-500/10 to-rose-500/10 border-pink-100 hover:border-pink-300 text-pink-700' },
              { id: 'physics', name: 'Physics Lab', desc: 'Oscillations, mechanics, gravity & electrical circuitry', emoji: '📐', color: 'from-blue-500/10 to-indigo-500/10 border-blue-100 hover:border-blue-300 text-blue-700' },
              { id: 'biology', name: 'Biology Lab', desc: 'Physiology, food tests & plant photosynthesis', emoji: '🍃', color: 'from-emerald-500/10 to-teal-500/10 border-emerald-100 hover:border-emerald-300 text-emerald-700' },
              { id: 'computer_science', name: 'Computer Science', desc: 'Logic gates, neon wire paths & relational SQL queries', emoji: '💻', color: 'from-purple-500/10 to-indigo-500/10 border-purple-100 hover:border-purple-300 text-purple-700' }
            ].map((sub) => (
              <ThreeDCard key={sub.id} depth={8} glareOpacity={0.2} className="w-full h-56 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
                <button
                  onClick={() => setSelectedSubject(sub.id as SubjectId)}
                  className="p-6 w-full h-full text-left transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden group rounded-[2rem]"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${sub.color} opacity-0 group-hover:opacity-100 transition-opacity duration-350 -z-10`} />
                  <div>
                    <span className="text-4xl block mb-4">{sub.emoji}</span>
                    <h4 className="font-extrabold text-slate-800 text-base mb-1.5">{sub.name}</h4>
                    <p className="text-xs text-slate-500 font-semibold leading-relaxed">{sub.desc}</p>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-indigo-600 mt-4">
                    <span>Enter Lab</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </button>
              </ThreeDCard>
            ))}
          </div>
        </div>
      )}

      {/* STEP 2: Select Topic */}
      {selectedSubject && !selectedTopic && (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <span className="text-2xl">
              {selectedSubject === 'chemistry' ? '🧪' : selectedSubject === 'physics' ? '📐' : selectedSubject === 'biology' ? '🍃' : '💻'}
            </span>
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-wider">
              {selectedSubject.replace('_', ' ')} Practicals Topics
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {PRACTICALS_DATA[selectedSubject].map((topic) => (
              <ThreeDCard key={topic.id} depth={6} glareOpacity={0.15} className="w-full bg-white border border-slate-150 rounded-3xl shadow-sm hover:border-indigo-300 transition-all">
                <button
                  onClick={() => setSelectedTopic(topic.id)}
                  className="p-6 w-full h-full text-left flex items-start gap-4 cursor-pointer group rounded-3xl"
                >
                  <div className="p-4 bg-slate-50 rounded-2xl group-hover:bg-indigo-50 transition-colors shrink-0">
                    {getExperimentIcon(topic.id, selectedSubject)}
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">{topic.title}</h4>
                    <p className="text-xs text-slate-500 font-semibold leading-relaxed">{topic.description}</p>
                    <span className="inline-flex items-center gap-1 text-[10px] font-black text-[#2f47b3] uppercase tracking-widest pt-2">
                      <span>Initialize Simulation</span>
                      <Play className="w-3 h-3 fill-current animate-pulse" />
                    </span>
                  </div>
                </button>
              </ThreeDCard>
            ))}
          </div>
        </div>
      )}

      {/* STEP 3: The Simulations */}
      {selectedTopic && (
        <div className="bg-slate-50/50 rounded-3xl border border-slate-150 p-6 md:p-8">
          
          {/* CHEMISTRY SIMULATION 1: ACID-BASE TITRATION */}
          {selectedTopic === 'titration' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Visual Apparatus */}
              <div className="lg:col-span-5 bg-white border border-slate-150 rounded-[2.5rem] p-6 flex flex-col items-center justify-between min-h-[500px]">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-4 text-center">Volumetric Glassware Bench</h4>
                
                {/* Visual Burette and Beaker assembly */}
                <div className="relative w-full max-w-[280px] h-[340px] flex flex-col items-center justify-start">
                  
                  {/* Burette Body */}
                  <div className="relative w-6 h-52 bg-slate-100 border border-slate-300 rounded-b-md flex flex-col justify-end overflow-hidden shadow-inner">
                    {/* Liquid remaining inside burette */}
                    <div 
                      className="w-full bg-sky-200/50 border-t-2 border-sky-400/80 transition-all duration-300"
                      style={{ height: `${(1 - acidVolume / 50) * 100}%` }}
                    />
                    {/* Grads ticks */}
                    <div className="absolute inset-0 flex flex-col justify-between text-[7px] font-mono font-bold text-slate-400 p-0.5 pointer-events-none">
                      <span>0 mL</span>
                      <span>10 mL</span>
                      <span>20 mL</span>
                      <span>30 mL</span>
                      <span>40 mL</span>
                      <span>50 mL</span>
                    </div>
                  </div>

                  {/* Stopcock valve assembly */}
                  <div className="relative w-12 h-8 flex items-center justify-center -mt-1 z-10">
                    <div className="w-2 h-6 bg-slate-400 border border-slate-500 rounded" />
                    <motion.button 
                      onClick={toggleTitrationDrip}
                      animate={{ rotate: isDripping ? 90 : 0 }}
                      className="absolute w-8 h-3 bg-red-600 rounded-full border border-red-700 cursor-pointer shadow-md flex items-center justify-center text-[7px] text-white font-black"
                    >
                      VALVE
                    </motion.button>
                  </div>

                  {/* Falling Drips Animation */}
                  <div className="h-10 w-1 relative flex justify-center">
                    {isDripping && (
                      <motion.div 
                        animate={{ y: [0, 36], opacity: [1, 0] }}
                        transition={{ repeat: Infinity, duration: 0.4, ease: 'linear' }}
                        className="w-1.5 h-1.5 bg-sky-300 rounded-full absolute"
                      />
                    )}
                  </div>

                  {/* Conical Flask */}
                  <div className="relative w-28 h-20 mt-1 flex justify-center">
                    {/* SVG Flask path */}
                    <svg viewBox="0 0 100 80" className="w-full h-full drop-shadow-md">
                      <path d="M40,0 L60,0 L60,15 L95,75 L5,75 L40,15 Z" fill="none" stroke="#94a3b8" strokeWidth="2" />
                      {/* Flask Liquid */}
                      <path 
                        d="M20,50 L80,50 L95,75 L5,75 Z" 
                        fill={flaskColor} 
                        className="transition-colors duration-500" 
                      />
                    </svg>
                    {/* Solution statistics overlay */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                      <span className="text-[10px] font-black text-slate-700 bg-white/90 px-1.5 py-0.5 rounded-md border border-slate-100">
                        pH {(13.0 - (acidVolume * 0.24)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bench Info */}
                <div className="w-full border-t border-slate-100 pt-4 text-center mt-4">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Analyte Content</p>
                  <p className="text-xs text-slate-700 font-extrabold">25.0 mL of Sodium Hydroxide (NaOH)</p>
                </div>
              </div>

              {/* Right Column: Controls & Dashboard */}
              <div className="lg:col-span-7 bg-white border border-slate-150 rounded-[2.5rem] p-6 md:p-8 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 bg-rose-50 text-rose-700 rounded-md text-[9px] font-black uppercase tracking-wider border border-rose-100">Lab Procedure</span>
                    <h4 className="font-extrabold text-slate-800 text-sm uppercase">Equivalence Endpoint Discovery</h4>
                  </div>
                  
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    You are titration-testing <strong className="text-slate-800 font-bold">25.0 mL of NaOH (aq)</strong> using standard <strong className="text-slate-800 font-bold">0.1 M HCl (aq)</strong> inside the burette. Add HCl slowly using the valve controls or manual incremental buttons to reach the neutralization endpoint.
                  </p>

                  {/* Indicator selector */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 space-y-2">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block">Choose Chemical Indicator</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'phenolphthalein', label: 'Phenolphthalein', range: 'pH 8.2 - 10.0', desc: 'Pink to Colorless' },
                        { id: 'methyl_orange', label: 'Methyl Orange', range: 'pH 3.1 - 4.4', desc: 'Yellow to Red' },
                        { id: 'bromothymol', label: 'Bromothymol Blue', range: 'pH 6.0 - 7.6', desc: 'Blue to Yellow' }
                      ].map((ind) => (
                        <button
                          key={ind.id}
                          onClick={() => setIndicator(ind.id as any)}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${indicator === ind.id ? 'ring-2 ring-indigo-500 bg-indigo-50/20 border-indigo-200' : 'bg-white hover:bg-slate-50 border-slate-150'}`}
                        >
                          <p className="text-[11px] font-black text-slate-800">{ind.label}</p>
                          <p className="text-[9px] text-slate-400 font-bold mt-0.5">{ind.range}</p>
                          <p className="text-[9px] text-indigo-600 font-black tracking-tighter uppercase mt-1">{ind.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Incremental Controls */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block">Burette Acid Delivery Controls</label>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => handleAddAcid(10.0)}
                        className="px-3.5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black cursor-pointer active:scale-95 transition-all hover:bg-slate-800"
                      >
                        +10.0 mL (Fast)
                      </button>
                      <button
                        onClick={() => handleAddAcid(1.0)}
                        className="px-3.5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black cursor-pointer active:scale-95 transition-all hover:bg-slate-800"
                      >
                        +1.0 mL
                      </button>
                      <button
                        onClick={() => handleAddAcid(0.1)}
                        className="px-3.5 py-2.5 bg-[#2f47b3] text-white rounded-xl text-xs font-black cursor-pointer active:scale-95 transition-all hover:bg-blue-700"
                        title="Incremental micro-dripping for exact endpoint"
                      >
                        +0.1 mL (Micro Drip)
                      </button>
                      <button
                        onClick={toggleTitrationDrip}
                        className={`px-4 py-2.5 rounded-xl text-xs font-black cursor-pointer active:scale-95 transition-all flex items-center gap-1.5 ${isDripping ? 'bg-red-600 text-white animate-pulse hover:bg-red-700' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
                      >
                        {isDripping ? 'Stop Flow' : 'Continuous Flow'}
                      </button>
                      <button
                        onClick={resetTitration}
                        className="px-3 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-black cursor-pointer hover:bg-slate-50"
                      >
                        Reset Burette
                      </button>
                    </div>
                  </div>
                </div>

                {/* Results Analysis */}
                <div className="bg-slate-50 border border-slate-150 p-5 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Acid Volume Added</span>
                      <span className="text-2xl font-mono font-black text-slate-800">{acidVolume.toFixed(2)} mL</span>
                    </div>
                    <button
                      onClick={verifyTitration}
                      className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
                    >
                      Check End Point
                    </button>
                  </div>

                  {titrationFeedback && (
                    <div className={`p-4 rounded-xl text-xs font-bold leading-relaxed border ${isTitrationCompleted ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-amber-50 border-amber-100 text-amber-800'}`}>
                      <p>{titrationFeedback}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* CHEMISTRY SIMULATION 2: QUALITATIVE SALT ANALYSIS */}
          {selectedTopic === 'salt_analysis' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
              {/* Left visual column */}
              <div className="lg:col-span-5 bg-white border border-slate-150 rounded-[2.5rem] p-6 flex flex-col items-center justify-between min-h-[480px]">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Reagent Reaction Test Tube</h4>
                <div className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-md mb-4">{mysterySalt.code}</div>

                {/* Visual Test Tube */}
                <div className="relative w-24 h-60 border-4 border-slate-300 rounded-b-full flex flex-col justify-end overflow-hidden shadow-md">
                  {/* Test tube liquid based on salt cation and added reagents */}
                  <div 
                    className="w-full h-[65%] transition-all duration-500 relative"
                    style={{ 
                      backgroundColor: 
                        addedReagents.includes('NaOH') || addedReagents.includes('NH3')
                          ? mysterySalt.cation === 'Cu2+' ? 'rgba(59, 130, 246, 0.7)' // deep blue Cu(OH)2 or copper ammine
                            : mysterySalt.cation === 'Fe2+' ? 'rgba(16, 185, 129, 0.55)' // dirty green
                            : mysterySalt.cation === 'Fe3+' ? 'rgba(180, 83, 9, 0.65)' // reddish brown
                            : 'rgba(241, 245, 249, 0.85)' // zinc/aluminum white gel
                          : mysterySalt.cation === 'Cu2+' ? 'rgba(191, 219, 254, 0.4)' // pale blue CuSO4
                          : mysterySalt.cation === 'Fe2+' ? 'rgba(209, 250, 229, 0.4)' // pale green Fe2+
                          : mysterySalt.cation === 'Fe3+' ? 'rgba(254, 243, 199, 0.5)' // pale yellow-orange Fe3+
                          : 'rgba(241, 245, 249, 0.2)' // colorless clear
                    }}
                  >
                    {/* Visual Precipitate Cloud inside tube if reaction took place */}
                    {(addedReagents.length > 0) && (
                      <motion.div 
                        initial={{ scale: 0.2, opacity: 0 }}
                        animate={{ scale: 1, opacity: 0.85 }}
                        className={`absolute inset-x-2 bottom-4 top-1/3 rounded-3xl filter blur-[1.5px] ${
                          mysterySalt.cation === 'Cu2+' ? 'bg-blue-650' 
                            : mysterySalt.cation === 'Fe2+' ? 'bg-emerald-850' 
                            : mysterySalt.cation === 'Fe3+' ? 'bg-amber-900' 
                            : 'bg-white shadow-inner'
                        }`}
                      />
                    )}
                  </div>
                </div>

                <div className="w-full border-t border-slate-100 pt-4 text-center mt-6">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Salt Analyzed</p>
                  <p className="text-xs text-slate-800 font-extrabold">Mystery Aqueous Salt Solution</p>
                </div>
              </div>

              {/* Right panel controls */}
              <div className="lg:col-span-7 bg-white border border-slate-150 rounded-[2.5rem] p-6 md:p-8 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-md text-[9px] font-black uppercase tracking-wider border border-amber-100">Qualitative Chemistry</span>
                    <h4 className="font-extrabold text-slate-800 text-sm uppercase">Salt Precipitation Reactions</h4>
                  </div>
                  
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Perform qualitative tests using NaOH or Ammonia to deduce the cation. Add BaCl2 or AgNO3 to identify the anion. Submit your analytical report below.
                  </p>

                  {/* Reagent Addition buttons */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 space-y-2">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block">Add Laboratory Reagent</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => addSaltReagent('NaOH')}
                        className="p-3 bg-slate-900 text-white rounded-xl text-xs font-black cursor-pointer hover:bg-slate-800 active:scale-95 transition-all text-center"
                      >
                        Add Sodium Hydroxide (NaOH)
                      </button>
                      <button
                        onClick={() => addSaltReagent('NH3')}
                        className="p-3 bg-slate-900 text-white rounded-xl text-xs font-black cursor-pointer hover:bg-slate-800 active:scale-95 transition-all text-center"
                      >
                        Add Ammonia Solution (NH₃)
                      </button>
                      <button
                        onClick={() => addSaltReagent('BaCl2')}
                        className="p-3 bg-slate-900 text-white rounded-xl text-xs font-black cursor-pointer hover:bg-slate-800 active:scale-95 transition-all text-center"
                      >
                        Add Barium Chloride (BaCl₂)
                      </button>
                      <button
                        onClick={() => addSaltReagent('AgNO3')}
                        className="p-3 bg-slate-900 text-white rounded-xl text-xs font-black cursor-pointer hover:bg-slate-800 active:scale-95 transition-all text-center"
                      >
                        Add Silver Nitrate (AgNO₃)
                      </button>
                    </div>
                  </div>

                  {/* Precipitate observation text */}
                  <div className="border border-indigo-100 bg-indigo-50/20 p-4 rounded-2xl">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Visual Observation / PPT</span>
                    <p className="text-xs text-indigo-950 font-bold leading-relaxed mt-1">{precipitateText}</p>
                  </div>
                </div>

                {/* Guess submission */}
                <div className="bg-slate-50 border border-slate-150 p-5 rounded-2xl space-y-4">
                  <h5 className="text-[10px] font-black text-slate-600 uppercase tracking-wider">Qualitative Analysis Report Form</h5>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 block mb-1">DEDUCED CATION</label>
                      <select 
                        value={saltGuessCation} 
                        onChange={e => setSaltGuessCation(e.target.value)}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"
                      >
                        <option value="">Select Cation...</option>
                        <option value="Cu2+">Copper (Cu²+)</option>
                        <option value="Fe2+">Iron(II) (Fe²+)</option>
                        <option value="Fe3+">Iron(III) (Fe³+)</option>
                        <option value="Zn2+">Zinc (Zn²+)</option>
                        <option value="Al3+">Aluminum (Al³+)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[9px] font-bold text-slate-400 block mb-1">DEDUCED ANION</label>
                      <select 
                        value={saltGuessAnion} 
                        onChange={e => setSaltGuessAnion(e.target.value)}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"
                      >
                        <option value="">Select Anion...</option>
                        <option value="SO42-">Sulfate (SO₄²⁻)</option>
                        <option value="Cl-">Chloride (Cl⁻)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={verifySaltGuess}
                      className="flex-1 py-3.5 bg-[#2f47b3] hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 cursor-pointer text-center"
                    >
                      Verify Chemical Deduction
                    </button>
                    <button
                      onClick={resetSaltAnalysis}
                      className="px-4 py-3.5 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      New Unknown
                    </button>
                  </div>

                  {saltFeedback && (
                    <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-[#800080]">
                      {saltFeedback}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}


          {/* PHYSICS SIMULATION 1: SIMPLE PENDULUM (g ACCELERATION) */}
          {selectedTopic === 'pendulum' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
              {/* Left Visual Column */}
              <div className="lg:col-span-5 bg-white border border-slate-150 rounded-[2.5rem] p-6 flex flex-col items-center justify-between min-h-[480px]">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-4">Oscillating Pendulum Rig</h4>

                {/* Animated Pendulum Swing using CSS/SVG */}
                <div className="relative w-full h-[260px] flex justify-center overflow-hidden border border-slate-100/50 rounded-2xl bg-slate-50/20">
                  
                  {/* Stand Ceiling */}
                  <div className="absolute top-4 w-20 h-2 bg-slate-700 rounded" />
                  
                  {/* Hanging string and bob container */}
                  <motion.div 
                    animate={isPendulumSwinging ? { 
                      rotate: [-24, 24, -24] 
                    } : { rotate: 0 }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 2 * Math.PI * Math.sqrt(pendulumLength / pendulumGravity), 
                      ease: 'easeInOut' 
                    }}
                    style={{ transformOrigin: 'top center' }}
                    className="absolute top-5 flex flex-col items-center"
                  >
                    {/* Hanging String */}
                    <div 
                      className="w-0.5 bg-slate-400"
                      style={{ height: `${pendulumLength * 130}px` }}
                    />
                    {/* Metal Bob */}
                    <div className="w-6 h-6 bg-radial from-slate-300 to-slate-600 rounded-full border border-slate-700 shadow-md -mt-1" />
                  </motion.div>
                </div>

                {/* Digital Bench Stats */}
                <div className="w-full border-t border-slate-100 pt-4 grid grid-cols-2 gap-2 text-center">
                  <div className="bg-slate-50 p-2 rounded-xl">
                    <span className="text-[9px] text-slate-400 font-bold block">STRING LENGTH L</span>
                    <span className="text-sm font-mono font-black text-slate-800">{pendulumLength.toFixed(2)} m</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl">
                    <span className="text-[9px] text-slate-400 font-bold block">LOCAL GRAVITY G</span>
                    <span className="text-sm font-mono font-black text-slate-800">{pendulumGravity.toFixed(2)} m/s²</span>
                  </div>
                </div>
              </div>

              {/* Right Panel controls */}
              <div className="lg:col-span-7 bg-white border border-slate-150 rounded-[2.5rem] p-6 md:p-8 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-[9px] font-black uppercase tracking-wider border border-blue-100">Mechanics Rig</span>
                    <h4 className="font-extrabold text-slate-800 text-sm uppercase">Gravity Measurement (g)</h4>
                  </div>
                  
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Set the string length ($L$), initiate swinging, and count the time for <strong className="text-slate-800 font-bold">10 full oscillations</strong> using the digital stopwatch to determine gravity $g$.
                  </p>

                  {/* Sliders */}
                  <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-150">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[10px] font-black text-slate-600 uppercase">Adjust Pendulum Length (m)</label>
                        <span className="text-xs font-bold text-slate-700">{pendulumLength.toFixed(2)} meters</span>
                      </div>
                      <input 
                        type="range" 
                        min="0.2" 
                        max="1.5" 
                        step="0.1" 
                        value={pendulumLength}
                        onChange={e => {
                          setPendulumLength(parseFloat(e.target.value));
                          setStopwatchTime(0);
                        }}
                        className="w-full accent-[#2f47b3]"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[10px] font-black text-slate-600 uppercase">Select Target Environment (Gravity)</label>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { id: 9.8, label: 'Earth (9.8)' },
                          { id: 1.62, label: 'Moon (1.62)' },
                          { id: 3.71, label: 'Mars (3.71)' },
                          { id: 24.79, label: 'Jupiter (24.8)' }
                        ].map((env) => (
                          <button
                            key={env.id}
                            onClick={() => {
                              setPendulumGravity(env.id);
                              setStopwatchTime(0);
                            }}
                            className={`p-2 rounded-xl border text-[10px] font-black text-center transition-all cursor-pointer ${pendulumGravity === env.id ? 'bg-indigo-600 text-white border-transparent' : 'bg-white hover:bg-slate-50 border-slate-150 text-slate-700'}`}
                          >
                            {env.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Swing controls */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsPendulumSwinging(!isPendulumSwinging)}
                      className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer active:scale-95 transition-all text-center ${isPendulumSwinging ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
                    >
                      {isPendulumSwinging ? '🛑 Freeze Pendulum' : '▶️ Release Pendulum'}
                    </button>
                  </div>
                </div>

                {/* Timing panel */}
                <div className="bg-slate-50 border border-slate-150 p-5 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Lab Stopwatch (10 Oscillations)</span>
                      <span className="text-2xl font-mono font-black text-slate-800">{stopwatchTime.toFixed(2)}s</span>
                    </div>
                    <button
                      onClick={toggleStopwatch}
                      disabled={!isPendulumSwinging}
                      className={`px-6 py-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${isStopwatchRunning ? 'bg-amber-600 text-white' : 'bg-slate-900 text-white disabled:opacity-30'}`}
                    >
                      {isStopwatchRunning ? 'Stop (Record)' : 'Start Timer'}
                    </button>
                  </div>

                  {measuredPeriod !== null && (
                    <div className="bg-white border border-slate-150 p-4 rounded-xl space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-xs font-bold text-slate-700">
                        <div>
                          <span className="text-[9px] text-slate-400 block">Total time (10 osc)</span>
                          <span className="font-mono text-slate-800">{(measuredPeriod * 10).toFixed(2)}s</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 block">Deducted Period T</span>
                          <span className="font-mono text-slate-800">{measuredPeriod.toFixed(3)}s</span>
                        </div>
                      </div>

                      <div className="border-t border-slate-100 pt-3 space-y-2">
                        <label className="text-[9px] font-black text-slate-600 uppercase block">Solve for g in m/s² (using $g = 4\\pi^2 L / T^2$)</label>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="Enter your gravity estimate..."
                            value={calcG}
                            onChange={e => setCalcG(e.target.value)}
                            className="flex-1 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg px-3 py-2 text-xs font-mono font-bold outline-none"
                          />
                          <button
                            onClick={checkGravityCalculations}
                            className="px-4 bg-[#2f47b3] text-white text-xs font-black uppercase rounded-lg cursor-pointer hover:bg-blue-700 active:scale-95 transition-all"
                          >
                            Verify
                          </button>
                        </div>
                      </div>

                      {gFeedback && (
                        <p className="text-xs text-indigo-950 bg-indigo-50/45 p-3 rounded-lg border border-indigo-100 font-bold leading-relaxed">{gFeedback}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* PHYSICS SIMULATION 2: OHM'S LAW */}
          {selectedTopic === 'ohms_law' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
              {/* Left Column: Circuit board layout */}
              <div className="lg:col-span-5 bg-white border border-slate-150 rounded-[2.5rem] p-6 flex flex-col items-center justify-between min-h-[480px]">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-4">Electrical Circuit Rig</h4>

                {/* Circuit schematic */}
                <div className="relative w-full h-[260px] border border-slate-150 rounded-2xl bg-slate-50/50 flex flex-col items-center justify-center p-4">
                  {/* DC Supply */}
                  <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-slate-900 text-slate-100 p-2.5 rounded-xl border border-slate-700 flex flex-col items-center w-28 text-center select-none shadow-sm">
                    <span className="text-[8px] font-black uppercase text-indigo-400">DC POWER SOURCE</span>
                    <span className="text-xs font-mono font-bold">{ohmsVoltage.toFixed(1)} Volts</span>
                  </div>

                  {/* Wire lines loop */}
                  <div className="w-[80%] h-[160px] border-4 border-dashed border-slate-350 rounded-xl" />

                  {/* Ammeter Series */}
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-[#2f47b3] text-white p-2 rounded-xl border border-blue-800 flex flex-col items-center w-16 text-center select-none shadow-sm">
                    <span className="text-[7px] font-black uppercase">AMMETER (I)</span>
                    <span className="text-[10px] font-mono font-bold">{(recordedCurrent * 1000).toFixed(1)} mA</span>
                  </div>

                  {/* Resistor Component right side */}
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-amber-50 border-2 border-dashed border-amber-600 rounded-xl p-2.5 flex flex-col items-center w-20 text-center shadow-xs">
                    <span className="text-[7px] font-black uppercase text-amber-800">UNKNOWN R</span>
                    <div className="w-8 h-3 bg-yellow-100 border border-yellow-600 rounded-md my-1" />
                    <span className="text-[9px] font-bold text-amber-700">Resistor</span>
                  </div>

                  {/* Voltmeter Parallel */}
                  <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-emerald-600 text-white p-2 rounded-xl border border-emerald-800 flex flex-col items-center w-24 text-center select-none shadow-sm">
                    <span className="text-[7px] font-black uppercase text-emerald-100">VOLTMETER (V)</span>
                    <span className="text-xs font-mono font-bold">{recordedVoltsAcrossUnknown.toFixed(2)} V</span>
                  </div>
                </div>

                {/* Rheostat and rheostat label */}
                <div className="w-full border-t border-slate-100 pt-4 text-center">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Series Rheostat (Resistance Box)</p>
                  <p className="text-xs text-slate-800 font-extrabold">{ohmsRheostat} Ohms</p>
                </div>
              </div>

              {/* Right panel circuit parameters */}
              <div className="lg:col-span-7 bg-white border border-slate-150 rounded-[2.5rem] p-6 md:p-8 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md text-[9px] font-black uppercase tracking-wider border border-emerald-100">Electrodynamics</span>
                    <h4 className="font-extrabold text-slate-800 text-sm uppercase">Verification of Ohm's Law</h4>
                  </div>
                  
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Adjust the DC voltage source and Rheostat series resistance. Record the voltage across the unknown resistor and the corresponding current to trace a characteristic table. Find the resistor's actual resistance.
                  </p>

                  {/* Sliders */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[10px] font-black text-slate-600 uppercase">DC SOURCE VOLTAGE (V)</label>
                        <span className="text-xs font-bold text-slate-700">{ohmsVoltage.toFixed(1)} Volts</span>
                      </div>
                      <input 
                        type="range" 
                        min="1" 
                        max="15" 
                        step="0.5" 
                        value={ohmsVoltage}
                        onChange={e => setOhmsVoltage(parseFloat(e.target.value))}
                        className="w-full accent-indigo-600"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[10px] font-black text-slate-600 uppercase">RHEOSTAT SLIDER RESISTANCE</label>
                        <span className="text-xs font-bold text-slate-700">{ohmsRheostat} Ω</span>
                      </div>
                      <input 
                        type="range" 
                        min="5" 
                        max="100" 
                        step="5" 
                        value={ohmsRheostat}
                        onChange={e => setOhmsRheostat(parseInt(e.target.value))}
                        className="w-full accent-indigo-600"
                      />
                    </div>
                  </div>

                  <button
                    onClick={recordOhmPoint}
                    className="w-full py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase cursor-pointer hover:bg-slate-800 transition-colors"
                  >
                    📌 Record Data Point (V, I)
                  </button>
                </div>

                {/* Table & Guess check */}
                <div className="bg-slate-50 border border-slate-150 p-5 rounded-2xl space-y-4">
                  <h5 className="text-[10px] font-black text-slate-600 uppercase tracking-wider">Recorded Characteristics Grid</h5>
                  
                  {recordedOhmsPoints.length === 0 ? (
                    <div className="py-6 text-center text-slate-400 text-xs italic">
                      No data points recorded yet. Change sliders and click "Record Data Point".
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left text-slate-600">
                        <thead>
                          <tr className="border-b border-slate-200">
                            <th className="py-1 font-bold">Voltage V_resistor (Volts)</th>
                            <th className="py-1 font-bold">Current I (milliAmperes)</th>
                            <th className="py-1 font-bold">Current I (Amperes)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recordedOhmsPoints.map((pt, idx) => (
                            <tr key={idx} className="border-b border-slate-150 font-mono">
                              <td className="py-1">{pt.V.toFixed(2)} V</td>
                              <td className="py-1">{pt.I.toFixed(1)} mA</td>
                              <td className="py-1">{(pt.I / 1000).toFixed(4)} A</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="border-t border-slate-200 pt-4 space-y-3">
                    <label className="text-[9px] font-black text-slate-600 uppercase block">Estimate Unknown Resistance value in Ω ($R = V / I$)</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Enter resistance estimate in Ohms..."
                        value={ohmsGuess}
                        onChange={e => setOhmsGuess(e.target.value)}
                        className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none font-mono"
                      />
                      <button
                        onClick={checkOhmsResistor}
                        className="px-5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase rounded-lg cursor-pointer transition-all active:scale-95"
                      >
                        Check Resistor
                      </button>
                    </div>

                    {ohmsFeedback && (
                      <p className="text-xs text-[#800080] font-extrabold leading-normal bg-white p-3 rounded-lg border border-slate-100">{ohmsFeedback}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}


          {/* BIOLOGY SIMULATION 1: PHOTOSYNTHESIS RATE FACTOR */}
          {selectedTopic === 'photosynthesis' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
              {/* Left Column: Elodea plant assembly */}
              <div className="lg:col-span-5 bg-white border border-slate-150 rounded-[2.5rem] p-6 flex flex-col items-center justify-between min-h-[480px]">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-4">Elodea Aquatics Gas Bench</h4>

                {/* Animated Beaker and lamp */}
                <div className="relative w-full h-[280px] border border-slate-150 rounded-2xl bg-gradient-to-b from-blue-50/10 to-emerald-50/10 flex flex-col items-center justify-between p-4 overflow-hidden">
                  
                  {/* Virtual Light lamp hanging on left/right based on distance */}
                  <div 
                    className="absolute top-4 bg-yellow-100 border border-yellow-400 p-2 rounded-xl flex items-center gap-1.5 shadow-sm transition-all duration-500"
                    style={{ left: `${(100 - lightDistance) * 0.7}%` }}
                  >
                    <Sun className="w-5 h-5 text-amber-500 animate-pulse" />
                    <div className="text-[8px] font-black">LAMP SOURCE</div>
                  </div>

                  {/* Water Beaker with plant inside */}
                  <div className="relative w-36 h-40 border-4 border-slate-300 rounded-b-3xl bg-sky-200/40 flex flex-col items-center justify-end overflow-hidden mt-16 shadow-inner">
                    
                    {/* Visual Elodea Leaf stalks */}
                    <div className="w-1.5 h-28 bg-emerald-700 rounded-t absolute bottom-0 flex flex-col justify-between p-0.5">
                      <div className="w-4 h-2 bg-emerald-600 rounded-full -ml-1.5" />
                      <div className="w-4 h-2 bg-emerald-600 rounded-full -ml-1.5" />
                      <div className="w-4 h-2 bg-emerald-600 rounded-full -ml-1.5" />
                      <div className="w-4 h-2 bg-emerald-600 rounded-full -ml-1.5" />
                    </div>

                    {/* visual rising oxygen bubbles */}
                    {isPhotosynthesisRunning && (
                      <div className="absolute inset-0">
                        <motion.div 
                          animate={{ y: [130, -10], opacity: [0, 1, 0] }}
                          transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                          className="w-1.5 h-1.5 bg-white/80 rounded-full absolute left-1/2 -ml-1.5"
                        />
                        <motion.div 
                          animate={{ y: [130, -10], opacity: [0, 1, 0] }}
                          transition={{ repeat: Infinity, duration: 1.9, delay: 0.4, ease: 'linear' }}
                          className="w-2 h-2 bg-white/80 rounded-full absolute left-1/2"
                        />
                        <motion.div 
                          animate={{ y: [130, -10], opacity: [0, 1, 0] }}
                          transition={{ repeat: Infinity, duration: 1.2, delay: 0.8, ease: 'linear' }}
                          className="w-1 h-1 bg-white/80 rounded-full absolute left-[45%]"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Live indicators */}
                <div className="w-full border-t border-slate-100 pt-4 grid grid-cols-2 gap-2 text-center">
                  <div className="bg-slate-50 p-2 rounded-xl">
                    <span className="text-[9px] text-slate-400 font-bold block">LIGHT DISTANCE</span>
                    <span className="text-xs font-mono font-black text-slate-800">{lightDistance} cm</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl">
                    <span className="text-[9px] text-slate-400 font-bold block">TEMP (°C)</span>
                    <span className="text-xs font-mono font-black text-slate-800">{tempCelsius}°C</span>
                  </div>
                </div>
              </div>

              {/* Right Panel controls */}
              <div className="lg:col-span-7 bg-white border border-slate-150 rounded-[2.5rem] p-6 md:p-8 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-md text-[9px] font-black uppercase tracking-wider border border-amber-100">Plant Physiology</span>
                    <h4 className="font-extrabold text-slate-800 text-sm uppercase">Factors Affecting Photosynthesis</h4>
                  </div>
                  
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Quantify photosynthesis rates by counting oxygen bubbles released from the cut stem of an aquatic plant under different light intensities (distance) and water temperatures.
                  </p>

                  {/* Sliders */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[10px] font-black text-slate-600 uppercase">Lamp Distance from Elodea (cm)</label>
                        <span className="text-xs font-bold text-slate-700">{lightDistance} cm</span>
                      </div>
                      <input 
                        type="range" 
                        min="10" 
                        max="100" 
                        step="5" 
                        value={lightDistance}
                        onChange={e => setLightDistance(parseInt(e.target.value))}
                        className="w-full accent-emerald-600"
                      />
                      <span className="text-[8px] text-slate-400 font-bold uppercase mt-0.5 block">Notice: Inverse square relationship holds true (closer lamp = higher intensity)</span>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[10px] font-black text-slate-600 uppercase">Beaker Water Temperature (°C)</label>
                        <span className="text-xs font-bold text-slate-700">{tempCelsius}°C</span>
                      </div>
                      <input 
                        type="range" 
                        min="10" 
                        max="50" 
                        step="1" 
                        value={tempCelsius}
                        onChange={e => setTempCelsius(parseInt(e.target.value))}
                        className="w-full accent-emerald-600"
                      />
                      <span className="text-[8px] text-slate-400 font-bold uppercase mt-0.5 block">Notice: Enzyme active above 15°C, peaks at 35°C, denatures/dies above 42°C.</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setIsPhotosynthesisRunning(!isPhotosynthesisRunning);
                        setBubblesCount(0);
                      }}
                      className={`flex-1 py-3.5 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer active:scale-95 transition-all text-center ${isPhotosynthesisRunning ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
                    >
                      {isPhotosynthesisRunning ? 'Stop Bubble Logger' : 'Start Light & Heat Exposure'}
                    </button>
                  </div>
                </div>

                {/* Bubble rate counter panel */}
                <div className="bg-slate-50 border border-slate-150 p-5 rounded-2xl space-y-3">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Photosynthetic Production Rate</span>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-3.5 rounded-xl border border-slate-100">
                      <span className="text-[9px] text-slate-400 block font-bold uppercase">Estimated Bubble Release Rate</span>
                      <span className="text-lg font-mono font-black text-emerald-700">{isPhotosynthesisRunning ? `${bubbleRate} bubbles/min` : 'Inactive'}</span>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-slate-100">
                      <span className="text-[9px] text-slate-400 block font-bold uppercase">Logged Bubbles Count</span>
                      <span className="text-lg font-mono font-black text-slate-800">{bubblesCount} bubbles</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}


          {/* BIOLOGY SIMULATION 2: BIOCHEMICAL FOOD TESTS */}
          {selectedTopic === 'food_tests' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
              {/* Left Column: Visual test beaker */}
              <div className="lg:col-span-5 bg-white border border-slate-150 rounded-[2.5rem] p-6 flex flex-col items-center justify-between min-h-[480px]">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-4 font-display">Biochemical Test Tube and Bunsen</h4>

                {/* Animated Test tube and bunsen burner */}
                <div className="relative w-full h-[260px] border border-slate-150 rounded-2xl bg-slate-50/50 flex flex-col items-center justify-end p-4 overflow-hidden">
                  
                  {/* Test tube container */}
                  <motion.div 
                    animate={isHeating ? { y: [0, -6, 0] } : {}}
                    transition={{ repeat: Infinity, duration: 1.2 }}
                    className="relative w-12 h-36 border-4 border-slate-350 rounded-b-full flex flex-col justify-end overflow-hidden shadow-md bg-white z-10"
                  >
                    <div 
                      className="w-full h-[70%] transition-colors duration-700" 
                      style={{ backgroundColor: foodTestResult.color }}
                    />
                  </motion.div>

                  {/* Virtual flame if heating */}
                  {isHeating && (
                    <div className="absolute bottom-1 flex flex-col items-center">
                      {/* Fire SVG */}
                      <motion.div 
                        animate={{ scaleY: [1, 1.25, 0.95, 1.15, 1] }}
                        transition={{ repeat: Infinity, duration: 0.6 }}
                        className="w-8 h-10 bg-gradient-to-t from-red-600 via-amber-500 to-yellow-300 rounded-t-full filter blur-[0.5px]"
                      />
                      <div className="w-12 h-1 bg-slate-400" />
                    </div>
                  )}
                </div>

                {/* Status Indicator */}
                <div className="w-full border-t border-slate-100 pt-4 text-center mt-4">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active Extract</p>
                  <p className="text-xs text-slate-800 font-extrabold capitalize">{selectedFood} Juice Solution</p>
                </div>
              </div>

              {/* Right Panel controls */}
              <div className="lg:col-span-7 bg-white border border-slate-150 rounded-[2.5rem] p-6 md:p-8 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-[9px] font-black uppercase tracking-wider border border-indigo-100">Food Tests</span>
                    <h4 className="font-extrabold text-slate-800 text-sm uppercase">Biochemical Identification</h4>
                  </div>
                  
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Test different food extracts with biochemical indicators to identify key macromolecules (Starch, glucose, protein, lipids). Benedict's solution requires heat to complete.
                  </p>

                  {/* Food Extract selection */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider">Select Food sample Extract</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { id: 'potato', label: '🥔 Potato juice' },
                        { id: 'milk', label: '🥛 Dairy Milk' },
                        { id: 'egg', label: '🥚 Egg White' },
                        { id: 'oil', label: '🌻 Vegetable Oil' }
                      ].map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setSelectedFood(item.id as any)}
                          className={`p-2.5 rounded-xl border text-[10px] font-black text-center transition-all cursor-pointer ${selectedFood === item.id ? 'bg-indigo-600 text-white border-transparent' : 'bg-slate-50 hover:bg-slate-100 border-slate-150 text-slate-700'}`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Reagent selection */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider">Select Diagnostic Chemical Reagent</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { id: 'iodine', label: 'Iodine Solution (Starch)' },
                        { id: 'biuret', label: 'Biuret (Protein)' },
                        { id: 'benedicts', label: "Benedict's (Glucose)" },
                        { id: 'ethanol', label: 'Ethanol Emulsion (Lipid)' }
                      ].map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setSelectedReagent(item.id as any)}
                          className={`p-2.5 rounded-xl border text-[10px] font-black text-center transition-all cursor-pointer ${selectedReagent === item.id ? 'bg-indigo-600 text-white border-transparent' : 'bg-slate-50 hover:bg-slate-100 border-slate-150 text-slate-700'}`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Results block */}
                <div className="bg-slate-50 border border-slate-150 p-5 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Observed Color Outcome</span>
                      <span className="text-sm font-extrabold text-slate-800 capitalize">{selectedReagent} added to {selectedFood}</span>
                    </div>
                    
                    {selectedReagent === 'benedicts' && (
                      <button
                        onClick={applyHeatToBenedicts}
                        disabled={isHeating}
                        className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-amber-500 text-white font-black text-[10px] uppercase rounded-xl shadow-sm cursor-pointer disabled:opacity-30 active:scale-95 transition-all"
                      >
                        {isHeating ? 'Heating tube...' : '🔥 Apply Heat'}
                      </button>
                    )}
                  </div>

                  <div className="bg-white border border-slate-150 p-4 rounded-xl text-xs font-bold leading-relaxed text-indigo-950">
                    <p>{foodTestResult.description}</p>
                  </div>
                </div>
              </div>
            </div>
          )}


          {/* COMPUTER SCIENCE SIMULATION 1: INTERACTIVE LOGIC GATES */}
          {selectedTopic === 'logic_gates' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
              {/* Left Column: Visual gates circuit layout */}
              <div className="lg:col-span-6 bg-white border border-slate-150 rounded-[2.5rem] p-6 flex flex-col items-center justify-between min-h-[460px]">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-4 font-display">Neon Logic Circuits Board</h4>

                {/* Glow Wire circuit visualization */}
                <div className="relative w-full h-[260px] border border-slate-150 rounded-2xl bg-[#0f172a] p-4 flex flex-col items-center justify-center overflow-hidden">
                  
                  {/* Grid lines background */}
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:1.5rem_1.5rem] opacity-20" />

                  {/* Connection paths */}
                  <div className="flex items-center gap-10 z-10 w-full max-w-sm justify-between">
                    {/* Inputs */}
                    <div className="flex flex-col gap-12">
                      <button
                        onClick={() => setInputA(!inputA)}
                        className={`w-12 h-12 rounded-xl border-2 flex flex-col items-center justify-center font-mono font-black transition-all cursor-pointer shadow-md ${inputA ? 'bg-sky-500/20 text-sky-400 border-sky-400 shadow-sky-500/10' : 'bg-slate-800/40 text-slate-500 border-slate-700'}`}
                      >
                        <span className="text-[9px] uppercase tracking-tighter text-slate-400">INPUT A</span>
                        <span className="text-sm">{inputA ? '1' : '0'}</span>
                      </button>

                      {gateType !== 'NOT' && (
                        <button
                          onClick={() => setInputB(!inputB)}
                          className={`w-12 h-12 rounded-xl border-2 flex flex-col items-center justify-center font-mono font-black transition-all cursor-pointer shadow-md ${inputB ? 'bg-sky-500/20 text-sky-400 border-sky-400 shadow-sky-500/10' : 'bg-slate-800/40 text-slate-500 border-slate-700'}`}
                        >
                          <span className="text-[9px] uppercase tracking-tighter text-slate-400">INPUT B</span>
                          <span className="text-sm">{inputB ? '1' : '0'}</span>
                        </button>
                      )}
                    </div>

                    {/* Wires to Gate */}
                    <div className="flex-1 flex flex-col justify-around h-24 relative">
                      <div 
                        className={`h-1.5 w-full transition-all duration-300 rounded ${inputA ? 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.65)]' : 'bg-slate-700'}`} 
                      />
                      {gateType !== 'NOT' && (
                        <div 
                          className={`h-1.5 w-full transition-all duration-300 rounded ${inputB ? 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.65)]' : 'bg-slate-700'}`} 
                        />
                      )}
                    </div>

                    {/* Logic Gate Body */}
                    <div className="w-20 h-16 bg-slate-800 border-2 border-slate-600 rounded-2xl flex flex-col items-center justify-center text-center shadow-lg relative shrink-0">
                      <span className="text-xs font-black font-mono text-indigo-300">{gateType}</span>
                      <span className="text-[7px] font-bold uppercase text-slate-400 mt-0.5">GATE</span>
                    </div>

                    {/* Wire to Output */}
                    <div className="flex-1 flex flex-col justify-center h-16 relative">
                      <div 
                        className={`h-1.5 w-full transition-all duration-300 rounded ${gateResult ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]' : 'bg-slate-700'}`} 
                      />
                    </div>

                    {/* Lightbulb Output */}
                    <div className="flex flex-col items-center justify-center shrink-0">
                      <div 
                        className={`w-14 h-14 rounded-full border-2 flex flex-col items-center justify-center font-black transition-all ${gateResult ? 'bg-emerald-500/20 text-emerald-400 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.35)]' : 'bg-slate-800/40 text-slate-500 border-slate-700'}`}
                      >
                        <Lightbulb className={`w-5 h-5 ${gateResult ? 'fill-current animate-pulse' : ''}`} />
                        <span className="text-[9px] font-mono font-bold mt-0.5">{gateResult ? '1' : '0'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Subtext */}
                <div className="w-full border-t border-slate-100 pt-4 text-center mt-4">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Gate Output Formula</p>
                  <p className="text-xs text-slate-800 font-extrabold font-mono uppercase">
                    {gateType === 'NOT' ? `OUT = NOT A` : `OUT = A ${gateType} B`}
                  </p>
                </div>
              </div>

              {/* Right Panel controls */}
              <div className="lg:col-span-6 bg-white border border-slate-150 rounded-[2.5rem] p-6 md:p-8 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-md text-[9px] font-black uppercase tracking-wider border border-purple-100">Boolean Algebra</span>
                    <h4 className="font-extrabold text-slate-800 text-sm uppercase">Interactive Logic Gates Board</h4>
                  </div>
                  
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Select a logic gate and toggle the inputs (0 or 1) by clicking on the input blocks on the left circuit. See how Boolean logic dictates high/low current flow.
                  </p>

                  {/* Gate type buttons */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block">Choose Logic Gate Operator</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['AND', 'OR', 'NOT', 'XOR', 'NAND', 'NOR'].map((gate) => (
                        <button
                          key={gate}
                          onClick={() => setGateType(gate as any)}
                          className={`p-2.5 rounded-xl border text-xs font-black font-mono tracking-wide text-center transition-all cursor-pointer ${gateType === gate ? 'bg-[#2f47b3] text-white border-transparent' : 'bg-slate-50 hover:bg-slate-100 border-slate-150 text-slate-700'}`}
                        >
                          {gate}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Truth Table */}
                <div className="bg-slate-50 border border-slate-150 p-5 rounded-2xl space-y-3">
                  <h5 className="text-[10px] font-black text-slate-600 uppercase tracking-wider">Active Truth Table Verification</h5>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left text-slate-600 font-mono">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="py-1">Input A</th>
                          {gateType !== 'NOT' && <th className="py-1">Input B</th>}
                          <th className="py-1 text-right text-indigo-600">Output ({gateType})</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { a: false, b: false },
                          { a: false, b: true },
                          { a: true, b: false },
                          { a: true, b: true }
                        ].filter((pt, index) => gateType !== 'NOT' || index % 2 === 0).map((pt, idx) => {
                          const isCurrentRow = pt.a === inputA && (gateType === 'NOT' || pt.b === inputB);
                          const calcVal = () => {
                            switch (gateType) {
                              case 'AND': return pt.a && pt.b;
                              case 'OR': return pt.a || pt.b;
                              case 'NOT': return !pt.a;
                              case 'XOR': return pt.a !== pt.b;
                              case 'NAND': return !(pt.a && pt.b);
                              case 'NOR': return !(pt.a || pt.b);
                              default: return false;
                            }
                          };
                          return (
                            <tr key={idx} className={`border-b border-slate-150 font-mono ${isCurrentRow ? 'bg-indigo-50/70 font-black text-indigo-900' : ''}`}>
                              <td className="py-1.5">{pt.a ? '1' : '0'}</td>
                              {gateType !== 'NOT' && <td className="py-1.5">{pt.b ? '1' : '0'}</td>}
                              <td className="py-1.5 text-right font-black text-indigo-600">{calcVal() ? '1' : '0'} {isCurrentRow && '👈 active'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}


          {/* COMPUTER SCIENCE SIMULATION 2: SQL QUERY SANDBOX */}
          {selectedTopic === 'sql_sandbox' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
              {/* Left Column: Visual databases schemas */}
              <div className="lg:col-span-4 bg-white border border-slate-150 rounded-[2.5rem] p-6 flex flex-col justify-between min-h-[460px]">
                <div className="space-y-4 w-full">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 font-display">Database Schema Inspector</h4>
                  
                  {/* Schema 1: results table */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 space-y-2 font-mono text-[10px]">
                    <h5 className="font-black text-[#2f47b3] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Table: results</span>
                    </h5>
                    <div className="border-t border-slate-200 pt-1.5 space-y-1.5 text-slate-500 font-semibold">
                      <p><strong className="text-slate-800 font-bold">id</strong>: INT (Primary Key)</p>
                      <p><strong className="text-slate-800 font-bold">student_id</strong>: INT</p>
                      <p><strong className="text-slate-800 font-bold">subject</strong>: VARCHAR</p>
                      <p><strong className="text-slate-800 font-bold">score</strong>: INT</p>
                      <p><strong className="text-slate-800 font-bold">grade</strong>: VARCHAR</p>
                    </div>
                  </div>

                  {/* Schema 2: students table */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 space-y-2 font-mono text-[10px]">
                    <h5 className="font-black text-[#2f47b3] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Table: students</span>
                    </h5>
                    <div className="border-t border-slate-200 pt-1.5 space-y-1.5 text-slate-500 font-semibold">
                      <p><strong className="text-slate-800 font-bold">id</strong>: INT (Primary Key)</p>
                      <p><strong className="text-slate-800 font-bold">name</strong>: VARCHAR</p>
                      <p><strong className="text-slate-800 font-bold">gender</strong>: VARCHAR</p>
                      <p><strong className="text-slate-800 font-bold">region</strong>: VARCHAR</p>
                      <p><strong className="text-slate-800 font-bold">points</strong>: REAL</p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50/50 p-4 rounded-2xl text-center text-[10px] text-blue-900 font-bold">
                  👩‍💻 Tip: Type SQL queries using standard SELECT statements with WHERE clauses to query mock tables!
                </div>
              </div>

              {/* Right Panel Query execution */}
              <div className="lg:col-span-8 bg-white border border-slate-150 rounded-[2.5rem] p-6 md:p-8 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 bg-[#800080]/10 text-[#800080] rounded-md text-[9px] font-black uppercase tracking-wider border border-[#800080]/10">DBMS engine</span>
                    <h4 className="font-extrabold text-slate-800 text-sm uppercase">Relational Query Playground</h4>
                  </div>
                  
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Write standard query statements. Verify structural query clauses including SELECT, FROM, WHERE, ORDER BY to prepare for theory and practical computer database exams.
                  </p>

                  {/* Predefined SQL statements for quick click */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Quick templates</label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          setSqlQuery('SELECT * FROM results WHERE score >= 80;');
                        }}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[10px] font-bold rounded-lg cursor-pointer"
                      >
                        High Scores
                      </button>
                      <button
                        onClick={() => {
                          setSqlQuery("SELECT * FROM students WHERE region = 'North West';");
                        }}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[10px] font-bold rounded-lg cursor-pointer"
                      >
                        Filter Region
                      </button>
                      <button
                        onClick={() => {
                          setSqlQuery('SELECT name, points FROM students ORDER BY points DESC;');
                        }}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[10px] font-bold rounded-lg cursor-pointer"
                      >
                        Order By Points
                      </button>
                    </div>
                  </div>

                  {/* SQL text editor */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block">Edit SQL Command</label>
                    <div className="relative">
                      <textarea
                        value={sqlQuery}
                        onChange={e => setSqlQuery(e.target.value)}
                        className="w-full h-24 p-4 bg-slate-900 text-sky-400 font-mono text-xs rounded-2xl outline-none border border-slate-800 focus:border-indigo-500 shadow-inner"
                      />
                      <button
                        onClick={runSQLQuery}
                        className="absolute bottom-3 right-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-wider rounded-lg shadow-sm cursor-pointer transition-all active:scale-95"
                      >
                        Run Query
                      </button>
                    </div>
                  </div>
                </div>

                {/* Output Console */}
                <div className="bg-slate-50 border border-slate-150 p-5 rounded-2xl space-y-3">
                  <h5 className="text-[10px] font-black text-slate-600 uppercase tracking-wider">DBMS Engine Console Outputs</h5>

                  {sqlError && (
                    <div className="p-3 bg-red-50 text-red-700 border border-red-100 text-[11px] font-mono font-bold rounded-lg">
                      {sqlError}
                    </div>
                  )}

                  {sqlSuccess && sqlResult.length > 0 && (
                    <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-xs">
                      <table className="w-full text-left text-[11px] font-mono text-slate-700">
                        <thead>
                          <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                            {Object.keys(sqlResult[0]).map((key) => (
                              <th key={key} className="p-2 font-bold capitalize">{key}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {sqlResult.map((row, rIdx) => (
                            <tr key={rIdx} className="border-b border-slate-150 hover:bg-slate-50">
                              {Object.values(row).map((val: any, vIdx) => (
                                <td key={vIdx} className="p-2 font-semibold">{val.toString()}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {sqlSuccess && sqlResult.length === 0 && (
                    <div className="py-4 text-center font-mono text-slate-400 text-xs bg-white rounded-xl border border-slate-150">
                      Query executed successfully but returned 0 rows.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

                    {/* UNIFIED LAB BENCH SIMULATOR FOR ADDITIONAL SYLLABUS EXPERIMENTS */}
          {currentExperiment && ['unified_bench', 'reaction_rate', 'calorimetry', 'resonance_sound', 'hookes_law', 'amylase_temp'].includes(currentExperiment.simulatorType) && (
            <div className="space-y-8 animate-fadeIn">
              
              {/* Objective Box */}
              <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-xs flex items-start gap-3">
                <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl">
                  <Info className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Practical Syllabus Objective</h4>
                  <p className="text-xs text-slate-700 font-extrabold leading-normal">{currentExperiment.objective}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Visual Apparatus & Sliders */}
                <div className="lg:col-span-5 bg-white border border-slate-150 rounded-[2.5rem] p-6 md:p-8 flex flex-col justify-between min-h-[520px] space-y-6 shadow-xs">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                      <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">Virtual Measuring Bench</h4>
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[9px] font-black uppercase tracking-wider">Device Online</span>
                    </div>

                    {/* Interactive Animated Visual Rig depending on Experiment ID */}
                    <div className="relative w-full min-h-[220px] bg-slate-950 rounded-3xl p-4 flex flex-col items-center justify-center overflow-hidden border border-slate-800 shadow-inner group">
                      {/* Grid background */}
                      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:14px_14px] opacity-25" />
                      
                      {/* Live status indicators */}
                      <div className="absolute top-3 left-3 flex items-center gap-2 z-10">
                        <span className="flex h-2 w-2 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-[8px] font-mono text-emerald-400 font-bold tracking-wider">
                          MONITOR: {benchActivityState.toUpperCase()}
                        </span>
                      </div>

                      {/* Display live seconds stopwatch if active */}
                      {virtualWatchActive && (
                        <div className="absolute top-3 right-3 bg-red-950 border border-red-800/50 rounded-md px-2 py-0.5 text-[10px] font-mono text-rose-400 font-black z-10 animate-pulse flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                          <span>ELAPSED: {virtualWatchTime}s</span>
                        </div>
                      )}

                      {/* Experiment-specific customized simulation views */}
                      <div className="w-full flex items-center justify-center h-full z-10 mt-6 pb-2">
                        
                        {/* 1. reaction_rate: Reaction Rate of Sodium Thiosulfate & HCl */}
                        {currentExperiment.id === 'reaction_rate' && (
                          <div className="relative flex flex-col items-center justify-center w-full max-w-[240px]">
                            {/* Paper card underneath with black X */}
                            <div className="absolute bottom-[-10px] w-28 h-4 bg-white border border-slate-400 rounded flex items-center justify-center shadow-md">
                              <span 
                                style={{ opacity: crossOpacity }}
                                className="font-black text-black text-sm select-none transition-opacity duration-300"
                              >
                                ✖ BLACK CROSS
                              </span>
                            </div>
                            {/* Glass Beaker Body */}
                            <div className="relative w-24 h-28 border-3 border-slate-300 border-t-0 rounded-b-3xl flex items-end overflow-hidden shadow-lg bg-white/10 backdrop-blur-xs">
                              {/* Liquid Filling / Precipitating */}
                              {reactionStage !== 'idle' && (
                                <motion.div 
                                  initial={{ height: 0 }}
                                  animate={{ height: '70%' }}
                                  style={{ 
                                    backgroundColor: `rgba(${220 + (1 - crossOpacity) * 35}, ${225 - (1 - crossOpacity) * 20}, ${150 + (1 - crossOpacity) * 50}, ${0.1 + (1 - crossOpacity) * 0.9})`
                                  }}
                                  className="w-full relative flex items-center justify-center transition-all duration-300"
                                >
                                  {/* Sulfur micro-bubbles inside reacting state */}
                                  {reactionStage === 'reacting' && (
                                    <div className="absolute inset-0 overflow-hidden flex justify-around">
                                      {[...Array(6)].map((_, i) => (
                                        <motion.div 
                                          key={i}
                                          animate={{ y: [40, -10], opacity: [0, 1, 0] }}
                                          transition={{ repeat: Infinity, duration: 1.0 + Math.random(), delay: i * 0.15 }}
                                          className="w-1 h-1 rounded-full bg-yellow-400/50"
                                        />
                                      ))}
                                    </div>
                                  )}
                                </motion.div>
                              )}
                              {reactionStage === 'idle' && (
                                <div className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-500 font-bold tracking-widest">
                                  EMPTY FLASK
                                </div>
                              )}
                            </div>
                            
                            {/* Pouring pouring streams */}
                            {reactionStage === 'mixing' && (
                              <div className="absolute top-[-30px] inset-x-0 flex justify-between px-4">
                                <motion.div animate={{ y: [0, 20] }} className="w-1 h-12 bg-yellow-300 rounded" />
                                <motion.div animate={{ y: [0, 20] }} className="w-1 h-12 bg-sky-300 rounded" />
                              </div>
                            )}
                          </div>
                        )}

                        {/* 2. calorimetry: Enthalpy of Neutralization */}
                        {currentExperiment.id === 'calorimetry' && (
                          <div className="relative flex items-center justify-center gap-6 w-full">
                            {/* Insulated Calorimeter Styrofoam Cup */}
                            <div className="relative w-24 h-28 bg-slate-100 border border-slate-300 rounded-b-3xl flex flex-col items-center justify-between p-2 shadow-lg">
                              <div className="w-26 h-3 bg-slate-300 rounded-full border border-slate-400 absolute top-[-3px]" />
                              
                              {/* Stirrer stick */}
                              <motion.div 
                                animate={calStage === 'stirring' ? { rotate: [0, 360] } : { rotate: 0 }}
                                transition={calStage === 'stirring' ? { repeat: Infinity, duration: 1.2, ease: 'linear' } : undefined}
                                className="w-1.5 h-16 bg-slate-500 rounded-full origin-top absolute top-0 left-1/3"
                              />

                              {/* Water Level */}
                              <div className="w-full h-16 bg-gradient-to-t from-cyan-300/40 to-sky-300/20 rounded-b-2xl mt-auto relative overflow-hidden">
                                {calStage === 'pouring' && (
                                  <div className="absolute inset-0 flex items-center justify-center text-[9px] text-cyan-600 font-black animate-pulse">POURING...</div>
                                )}
                              </div>
                            </div>

                            {/* physical rising thermometer */}
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-[9px] font-bold text-slate-400">CALORIMETER THERMOMETER</span>
                              <div className="relative w-4 h-28 bg-slate-900 border border-slate-700 rounded-full flex items-end justify-center overflow-hidden p-0.5">
                                <motion.div 
                                  animate={{ height: `${(calTemp - 25.0) / 12 * 100}%` }}
                                  className="w-full bg-rose-500 rounded-full min-h-[4px]"
                                />
                              </div>
                              <span className="text-xs font-mono font-black text-rose-400 bg-rose-950 px-1.5 py-0.5 rounded border border-rose-900">
                                {calTemp.toFixed(1)} °C
                              </span>
                            </div>
                          </div>
                        )}

                        {/* 3. resonance_sound: Speed of Sound using Resonance Tube */}
                        {currentExperiment.id === 'resonance_sound' && (
                          <div className="relative flex justify-around items-center w-full max-w-[280px]">
                            {/* Glass column with adjustable water level */}
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-[8px] font-bold text-slate-500 uppercase">Resonance Tube</span>
                              <div className="relative w-12 h-32 border-2 border-slate-300 border-t-0 rounded-b-xl flex flex-col justify-end overflow-hidden bg-slate-900/50">
                                {/* Air Column at Top */}
                                <div className="w-full flex-1 relative flex items-center justify-center">
                                  {isTuningForkStruck && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-around overflow-hidden">
                                      {/* Resonant waves glowing if matching length */}
                                      {Math.abs(resWaterLength - (34000 / (4 * unifiedValue))) <= 3 ? (
                                        <motion.div 
                                          animate={{ scale: [0.9, 1.1, 0.9], opacity: [0.3, 0.8, 0.3] }}
                                          transition={{ repeat: Infinity, duration: 0.4 }}
                                          className="w-8 h-12 border-3 border-rose-500 rounded-full bg-rose-500/10"
                                        />
                                      ) : (
                                        <motion.div 
                                          animate={{ scale: [1, 1.05, 1], opacity: [0.1, 0.3, 0.1] }}
                                          transition={{ repeat: Infinity, duration: 1 }}
                                          className="w-6 h-8 border border-sky-400 rounded-full bg-sky-400/5"
                                        />
                                      )}
                                    </div>
                                  )}
                                  <span className="text-xs font-mono font-black text-slate-400 absolute bottom-1">
                                    L = {resWaterLength}cm
                                  </span>
                                </div>
                                {/* Water Level */}
                                <div 
                                  style={{ height: `${(100 - resWaterLength) / 100 * 100}%` }}
                                  className="w-full bg-gradient-to-t from-sky-500/60 to-blue-600/40 border-t border-sky-400"
                                />
                              </div>
                            </div>

                            {/* Hovering Tuning Fork */}
                            <div className="flex flex-col items-center gap-1.5">
                              <span className="text-[8px] font-bold text-slate-500 uppercase">Tuning Fork</span>
                              <motion.div 
                                animate={isTuningForkStruck ? { x: [-1.5, 1.5, -1.5], rotate: [-0.5, 0.5, -0.5] } : {}}
                                transition={isTuningForkStruck ? { repeat: Infinity, duration: 0.05 } : undefined}
                                className="p-3 bg-gradient-to-b from-slate-400 to-slate-500 rounded-xl flex flex-col items-center border border-slate-300 shadow"
                              >
                                <span className="font-mono font-black text-slate-900 text-xs">{unifiedValue} Hz</span>
                                <span className="text-[7px] font-bold text-slate-800">struck: {isTuningForkStruck ? "YES" : "NO"}</span>
                              </motion.div>
                              
                              <button 
                                onClick={strikeTuningFork}
                                className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded text-[9px] font-black uppercase tracking-wider cursor-pointer"
                              >
                                🔊 Strike Fork
                              </button>
                            </div>
                          </div>
                        )}

                        {/* 4. hookes_law: Hooke's Law & Spring Constant */}
                        {currentExperiment.id === 'hookes_law' && (
                          <div className="relative flex justify-center gap-8 items-center w-full max-w-[260px]">
                            {/* Ruler */}
                            <div className="w-8 h-36 bg-amber-500/10 border border-amber-500/30 rounded flex flex-col justify-between p-1 text-[8px] font-mono text-amber-500">
                              <span>0 cm</span>
                              <span>10 cm</span>
                              <span>20 cm</span>
                              <span>30 cm</span>
                              <span>40 cm</span>
                            </div>

                            {/* Hanging Stand & Spring */}
                            <div className="relative w-24 h-36 border-t-4 border-l-2 border-slate-400 flex flex-col items-center">
                              {/* Spring graphic */}
                              <motion.div 
                                style={{ height: `${60 + (0.08 * hookeMass) * 1.5}px` }}
                                className="w-4 border-x border-dashed border-sky-400 flex flex-col justify-around transition-all duration-300"
                              >
                                {[...Array(12)].map((_, idx) => (
                                  <div key={idx} className="w-full h-[2px] bg-slate-300 rotate-12" />
                                ))}
                              </motion.div>

                              {/* Slotted masses */}
                              <motion.div 
                                style={{ transform: `scale(${1 + hookeMass / 500 * 0.15})` }}
                                className="w-8 h-6 bg-gradient-to-r from-yellow-600 to-yellow-500 border border-yellow-700 rounded-md flex items-center justify-center shadow-lg transition-transform"
                              >
                                <span className="text-[8px] font-black text-yellow-950">{hookeMass}g</span>
                              </motion.div>
                            </div>
                          </div>
                        )}

                        {/* 5. amylase_temp: Amylase Enzyme Rate vs Temperature */}
                        {currentExperiment.id === 'amylase_temp' && (
                          <div className="relative flex flex-col items-center gap-4 w-full">
                            <span className="text-[10px] font-bold text-slate-400">Iodine Spotting Tile (Wells 1 to 6)</span>
                            <div className="grid grid-cols-6 gap-3 bg-slate-900 p-3 rounded-2xl border border-slate-800 shadow-inner">
                              {amylaseDrops.map((color, idx) => (
                                <div key={idx} className="flex flex-col items-center gap-1">
                                  <motion.div 
                                    animate={amylaseStage === 'running' ? { scale: [0.9, 1.1, 0.9] } : {}}
                                    className={`w-7 h-7 rounded-full border-2 border-slate-700 shadow-md flex items-center justify-center transition-colors duration-500 ${
                                      color === 'blue-black' ? 'bg-indigo-950 border-indigo-400' :
                                      color === 'purple-amber' ? 'bg-purple-800 border-amber-500 animate-pulse' :
                                      'bg-amber-600 border-amber-300'
                                    }`}
                                  >
                                    <span className="text-[7px] font-bold text-white select-none">W{idx + 1}</span>
                                  </motion.div>
                                  <span className="text-[7px] font-mono text-slate-500">{(idx + 1) * 10}s</span>
                                </div>
                              ))}
                            </div>
                            
                            <button 
                              onClick={runAmylaseTest}
                              disabled={amylaseStage === 'running'}
                              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer transition-colors shadow"
                            >
                              {amylaseStage === 'running' ? '⏱️ INCUBATING & DROPPING...' : '🧪 Run Iodine Spot Test'}
                            </button>
                          </div>
                        )}

                        {/* 6. binary_bitwise: Interactive bit shifter */}
                        {currentExperiment.id === 'binary_bitwise' && (
                          <div className="relative flex flex-col items-center gap-4 w-full">
                            <span className="text-[10px] font-bold text-slate-400">Interactive 8-Bit Registers</span>
                            <div className="space-y-3 w-full">
                              {/* Register A */}
                              <div className="flex flex-col gap-1">
                                <div className="flex justify-between items-center text-[8px] font-bold text-slate-500 uppercase">
                                  <span>Register A</span>
                                  <span className="text-sky-400">VAL: {bitwiseBits.reduce((acc, b, i) => acc + b * Math.pow(2, 7 - i), 0)}</span>
                                </div>
                                <div className="grid grid-cols-8 gap-1.5">
                                  {bitwiseBits.map((bit, idx) => (
                                    <button 
                                      key={idx}
                                      onClick={() => setBitwiseBits(prev => {
                                        const next = [...prev];
                                        next[idx] = next[idx] === 1 ? 0 : 1;
                                        // Update unifiedValue as the register sum
                                        const sum = next.reduce((acc, b, i) => acc + b * Math.pow(2, 7 - i), 0);
                                        setUnifiedValue(sum);
                                        return next;
                                      })}
                                      className={`py-1.5 rounded font-mono font-black text-xs border cursor-pointer transition-all ${
                                        bit === 1 ? 'bg-sky-500 text-slate-950 border-sky-300 shadow' : 'bg-slate-900 text-slate-500 border-slate-800'
                                      }`}
                                    >
                                      {bit}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Register B */}
                              <div className="flex flex-col gap-1">
                                <div className="flex justify-between items-center text-[8px] font-bold text-slate-500 uppercase">
                                  <span>Register B (Static Mask)</span>
                                  <span className="text-amber-400">VAL: {bitwiseBitsB.reduce((acc, b, i) => acc + b * Math.pow(2, 7 - i), 0)}</span>
                                </div>
                                <div className="grid grid-cols-8 gap-1.5">
                                  {bitwiseBitsB.map((bit, idx) => (
                                    <div 
                                      key={idx}
                                      className={`py-1 text-center rounded font-mono font-bold text-xs border ${
                                        bit === 1 ? 'bg-amber-600/30 text-amber-300 border-amber-500/50' : 'bg-slate-900 text-slate-600 border-slate-850'
                                      }`}
                                    >
                                      {bit}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 7. subnetting_ip: IP Subnet routing layout */}
                        {currentExperiment.id === 'subnetting_ip' && (
                          <div className="relative flex flex-col items-center gap-3 w-full max-w-[280px]">
                            <span className="text-[10px] font-bold text-slate-400">Classless Subnet Router Simulation</span>
                            <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 font-mono text-[9px] text-slate-300 space-y-1 select-none">
                              <div className="flex justify-between"><span className="text-slate-500">SUBNET PREFIX:</span> <span className="text-emerald-400">192.168.1.0/{subnetPrefix}</span></div>
                              <div className="flex justify-between"><span className="text-slate-500">SUBNET MASK:</span> <span className="text-sky-400">
                                {subnetPrefix === 24 ? '255.255.255.0' :
                                 subnetPrefix === 25 ? '255.255.255.128' :
                                 subnetPrefix === 26 ? '255.255.255.192' :
                                 subnetPrefix === 27 ? '255.255.255.224' :
                                 subnetPrefix === 28 ? '255.255.255.240' :
                                 subnetPrefix === 29 ? '255.255.255.248' : '255.255.255.252'}
                              </span></div>
                              <div className="flex justify-between"><span className="text-slate-500">USABLE IPS:</span> <span className="text-amber-400">{Math.pow(2, 32 - subnetPrefix) - 2} Hosts</span></div>
                              <div className="flex justify-between"><span className="text-slate-500">BROADCAST ADDR:</span> <span className="text-rose-400">192.168.1.{Math.pow(2, 32 - subnetPrefix) - 1}</span></div>
                            </div>
                          </div>
                        )}

                        {/* Fallback layout (subject-specific general default) */}
                        {['reaction_rate', 'calorimetry', 'resonance_sound', 'hookes_law', 'amylase_temp', 'binary_bitwise', 'subnetting_ip'].indexOf(currentExperiment.id) === -1 && (
                          <>
                            {selectedSubject === 'chemistry' && (
                              <div className="relative flex flex-col items-center justify-center">
                                <div className="relative w-20 h-24 border-3 border-slate-300 border-t-0 rounded-b-2xl flex items-end overflow-hidden shadow-lg bg-slate-900/40">
                                  {activeStepIndex === 0 && benchActivityState === 'idle' && (
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 text-xs text-slate-500 font-bold">Empty</div>
                                  )}
                                  {benchActivityState !== 'idle' && (
                                    <motion.div 
                                      initial={{ height: 0 }}
                                      animate={{ height: benchActivityState === 'poured' ? '40%' : '70%' }}
                                      className={`w-full relative transition-all duration-700 ${benchActivityState === 'indicated' || benchActivityState === 'reacting' || benchActivityState === 'done' ? 'bg-gradient-to-t from-pink-600/80 to-pink-400/50' : 'bg-gradient-to-t from-sky-600/80 to-sky-400/50'}`}
                                    >
                                      <div className="absolute -top-1 left-0 right-0 h-2 bg-white/20 rounded-full animate-pulse" />
                                      {benchActivityState === 'reacting' && (
                                        <div className="absolute inset-0 overflow-hidden flex justify-around">
                                          {[...Array(6)].map((_, i) => (
                                            <motion.div 
                                              key={i}
                                              animate={{ y: [40, -10], opacity: [0, 1, 0] }}
                                              transition={{ repeat: Infinity, duration: 1.5 + Math.random(), delay: i * 0.2 }}
                                              className="w-1.5 h-1.5 rounded-full bg-white/40"
                                            />
                                          ))}
                                        </div>
                                      )}
                                    </motion.div>
                                  )}
                                </div>
                                {benchActivityState === 'done' && (
                                  <motion.div animate={{ scale: [0.8, 1.2, 0.8] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute -top-4 text-amber-300 text-xs font-bold">
                                    🌟 Done
                                  </motion.div>
                                )}
                              </div>
                            )}

                            {selectedSubject === 'physics' && (
                              <div className="relative flex flex-col items-center justify-center w-full">
                                <div className="w-16 h-1 bg-slate-600 rounded-full" />
                                <motion.div 
                                  animate={virtualWatchActive ? { rotate: [-28, 28, -28] } : { rotate: 0 }}
                                  transition={virtualWatchActive ? { repeat: Infinity, duration: Math.max(1, 2.5 - (unifiedValue / 40)), ease: "easeInOut" } : undefined}
                                  style={{ transformOrigin: 'top center' }}
                                  className="w-0.5 h-20 bg-slate-400 relative flex flex-col items-center"
                                >
                                  <div className="absolute bottom-0 w-6 h-6 rounded-full bg-gradient-to-r from-slate-400 to-slate-200 border border-slate-500 shadow-md flex items-center justify-center">
                                    <span className="text-[7px] font-black text-slate-800">m</span>
                                  </div>
                                </motion.div>
                                {benchActivityState === 'timing' && (
                                  <div className="absolute inset-x-0 bottom-1 bg-sky-950 border border-sky-800 rounded p-1 text-[8px] font-mono text-sky-400 font-bold text-center">
                                    ⚡ OSCILLATING...
                                  </div>
                                )}
                              </div>
                            )}

                            {selectedSubject === 'biology' && (
                              <div className="relative flex flex-col items-center justify-center w-full">
                                <div className="relative w-24 h-24 rounded-full border-4 border-emerald-800/40 bg-emerald-950/20 flex items-center justify-center overflow-hidden">
                                  {benchActivityState === 'idle' && (
                                    <span className="text-[10px] text-emerald-700/60 font-black tracking-widest">SLIDE EMPTY</span>
                                  )}
                                  {benchActivityState !== 'idle' && (
                                    <div className="relative w-full h-full p-2 grid grid-cols-3 gap-2">
                                      {[...Array(6)].map((_, i) => (
                                        <motion.div 
                                          key={i}
                                          animate={benchActivityState === 'incubating' ? { scale: [1, 1.2, 1], rotate: [0, 180] } : {}}
                                          transition={{ repeat: Infinity, duration: 3, delay: i * 0.3 }}
                                          className="w-4 h-4 rounded-full bg-emerald-500/30 border border-emerald-400/50 flex items-center justify-center text-[7px]"
                                        >
                                          🌱
                                        </motion.div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {selectedSubject === 'computer_science' && (
                              <div className="relative flex flex-col items-center justify-center w-full font-mono text-[9px] text-emerald-400 space-y-1">
                                <div className="w-5/6 bg-slate-950 border border-slate-800 rounded-xl p-3">
                                  <div>REG_EAX: 0x{unifiedValue.toString(16).toUpperCase().padStart(2, '0')}</div>
                                  <div>REG_EBX: 0x{Math.round(unifiedValue * 1.5).toString(16).toUpperCase().padStart(2, '0')}</div>
                                </div>
                              </div>
                            )}
                          </>
                        )}

                      </div>

                      {/* Ambient moving flare/glow */}
                      <motion.div 
                        animate={{ x: [-150, 300], opacity: [0, 0.4, 0] }}
                        transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
                        className="absolute w-16 h-16 bg-sky-500/5 blur-2xl rounded-full animate-pulse"
                      />
                    </div>

                    {/* Adjustable Parameter Inputs Section */}
                    <div className="space-y-4 mt-6">
                      
                      {/* Controls specifically for reaction_rate */}
                      {currentExperiment.id === 'reaction_rate' && (
                        <div className="space-y-4 bg-slate-50 border border-slate-150 p-4 rounded-2xl">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block font-sans">Reagent Concentrator Mixer</span>
                          
                          {/* Slider 1: Temperature */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center text-[9px] font-bold text-slate-600">
                              <span>1. WATER BATH TEMPERATURE (°C)</span>
                              <span className="font-mono text-indigo-600 font-extrabold">{unifiedValue} °C</span>
                            </div>
                            <input 
                              type="range"
                              min={10} max={90} step={5}
                              value={unifiedValue}
                              onChange={(e) => setUnifiedValue(Number(e.target.value))}
                              disabled={reactionStage === 'reacting' || reactionStage === 'mixing'}
                              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                          </div>

                          {/* Slider 2: Thiosulfate Volume */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center text-[9px] font-bold text-slate-600">
                              <span>2. SODIUM THIOSULFATE VOL (mL)</span>
                              <span className="font-mono text-indigo-600 font-extrabold">{thioVolume} mL</span>
                            </div>
                            <input 
                              type="range"
                              min={10} max={50} step={5}
                              value={thioVolume}
                              onChange={(e) => setThioVolume(Number(e.target.value))}
                              disabled={reactionStage === 'reacting' || reactionStage === 'mixing'}
                              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                          </div>

                          {/* Slider 3: HCl concentration */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center text-[9px] font-bold text-slate-600">
                              <span>3. HYDROCHLORIC ACID CONC (M)</span>
                              <span className="font-mono text-indigo-600 font-extrabold">{hclConc} M</span>
                            </div>
                            <input 
                              type="range"
                              min={0.1} max={2.0} step={0.1}
                              value={hclConc}
                              onChange={(e) => setHclConc(Number(e.target.value))}
                              disabled={reactionStage === 'reacting' || reactionStage === 'mixing'}
                              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                          </div>

                          <button 
                            onClick={startReactionRate}
                            disabled={reactionStage === 'reacting' || reactionStage === 'mixing'}
                            className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 text-white rounded-xl text-xs font-black cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
                          >
                            🧪 Mix Reagents & Run
                          </button>
                        </div>
                      )}

                      {/* Controls specifically for calorimetry */}
                      {currentExperiment.id === 'calorimetry' && (
                        <div className="space-y-4 bg-slate-50 border border-slate-150 p-4 rounded-2xl">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block font-sans">Adiabatic Calorimeter Mixer</span>
                          
                          {/* NaOH Conc (maps to unifiedValue) */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center text-[9px] font-bold text-slate-600">
                              <span>1. NaOH BASE CONCENTRATION (M)</span>
                              <span className="font-mono text-indigo-600 font-extrabold">{unifiedValue} M</span>
                            </div>
                            <input 
                              type="range"
                              min={0.1} max={2.0} step={0.1}
                              value={unifiedValue}
                              onChange={(e) => setUnifiedValue(Number(e.target.value))}
                              disabled={calStage === 'pouring' || calStage === 'stirring'}
                              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                          </div>

                          {/* Volumes */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[8px] font-bold text-slate-500">HCl VOLUME (mL)</label>
                              <input 
                                type="number"
                                min={10} max={100}
                                value={calAcidVol}
                                onChange={(e) => setCalAcidVol(Math.max(10, Math.min(100, Number(e.target.value))))}
                                disabled={calStage === 'pouring' || calStage === 'stirring'}
                                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[8px] font-bold text-slate-500">NaOH VOLUME (mL)</label>
                              <input 
                                type="number"
                                min={10} max={100}
                                value={calBaseVol}
                                onChange={(e) => setCalBaseVol(Math.max(10, Math.min(100, Number(e.target.value))))}
                                disabled={calStage === 'pouring' || calStage === 'stirring'}
                                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                              />
                            </div>
                          </div>

                          <button 
                            onClick={startCalorimetry}
                            disabled={calStage === 'pouring' || calStage === 'stirring'}
                            className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 text-white rounded-xl text-xs font-black cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
                          >
                            🌡️ Pour solutions & Stir
                          </button>
                        </div>
                      )}

                      {/* Controls specifically for resonance_sound */}
                      {currentExperiment.id === 'resonance_sound' && (
                        <div className="space-y-4 bg-slate-50 border border-slate-150 p-4 rounded-2xl">
                          {/* Frequency slider (maps to unifiedValue) */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center text-[9px] font-bold text-slate-600">
                              <span>TUNING FORK FREQUENCY (Hz)</span>
                              <span className="font-mono text-indigo-600 font-extrabold">{unifiedValue} Hz</span>
                            </div>
                            <input 
                              type="range"
                              min={256} max={512} step={16}
                              value={unifiedValue}
                              onChange={(e) => setUnifiedValue(Number(e.target.value))}
                              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                          </div>

                          {/* Water Column Length */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center text-[9px] font-bold text-slate-600">
                              <span>ADJUST TUBE WATER LENGTH (cm)</span>
                              <span className="font-mono text-indigo-600 font-extrabold">{resWaterLength} cm</span>
                            </div>
                            <input 
                              type="range"
                              min={10} max={80} step={1}
                              value={resWaterLength}
                              onChange={(e) => setResWaterLength(Number(e.target.value))}
                              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                          </div>
                        </div>
                      )}

                      {/* Controls specifically for hookes_law */}
                      {currentExperiment.id === 'hookes_law' && (
                        <div className="space-y-4 bg-slate-50 border border-slate-150 p-4 rounded-2xl">
                          {/* Load mass slider (maps to unifiedValue) */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center text-[9px] font-bold text-slate-600">
                              <span>SUSPENDED BRASS LOAD MASS (g)</span>
                              <span className="font-mono text-indigo-600 font-extrabold">{unifiedValue} g</span>
                            </div>
                            <input 
                              type="range"
                              min={50} max={500} step={50}
                              value={unifiedValue}
                              onChange={(e) => {
                                setUnifiedValue(Number(e.target.value));
                                setHookeMass(Number(e.target.value));
                              }}
                              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                          </div>
                        </div>
                      )}

                      {/* Controls specifically for amylase_temp */}
                      {currentExperiment.id === 'amylase_temp' && (
                        <div className="space-y-4 bg-slate-50 border border-slate-150 p-4 rounded-2xl">
                          {/* Temperature slider (maps to unifiedValue) */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center text-[9px] font-bold text-slate-600">
                              <span>WATER BATH TEMPERATURE (°C)</span>
                              <span className="font-mono text-[#2f47b3] font-extrabold">{unifiedValue} °C</span>
                            </div>
                            <input 
                              type="range"
                              min={10} max={80} step={5}
                              value={unifiedValue}
                              onChange={(e) => setUnifiedValue(Number(e.target.value))}
                              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                          </div>
                        </div>
                      )}

                      {/* Controls specifically for binary_bitwise */}
                      {currentExperiment.id === 'binary_bitwise' && (
                        <div className="space-y-4 bg-slate-50 border border-slate-150 p-4 rounded-2xl font-sans">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Bitwise Operator Selection</span>
                          <div className="grid grid-cols-5 gap-1">
                            {(['AND', 'OR', 'XOR', 'SHIFT_L', 'SHIFT_R'] as const).map((op) => (
                              <button 
                                key={op}
                                onClick={() => setBitwiseOp(op)}
                                className={`py-1 rounded text-[9px] font-bold border transition-colors cursor-pointer ${
                                  bitwiseOp === op ? 'bg-sky-600 text-white border-sky-400 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                }`}
                              >
                                {op}
                              </button>
                            ))}
                          </div>

                          {/* Visual operation output */}
                          <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 font-mono text-[9px] text-slate-300">
                            <div className="flex justify-between"><span>A (Dec {unifiedValue}):</span> <span>{bitwiseBits.join('')}</span></div>
                            <div className="flex justify-between"><span>B (Dec {bitwiseBitsB.reduce((acc, b, i) => acc + b * Math.pow(2, 7 - i), 0)}):</span> <span>{bitwiseBitsB.join('')}</span></div>
                            <div className="h-px bg-slate-800 my-1" />
                            <div className="flex justify-between font-black text-emerald-400">
                              <span>RESULT:</span>
                              <span>
                                {bitwiseOp === 'AND' ? bitwiseBits.map((b, i) => b & bitwiseBitsB[i]).join('') :
                                 bitwiseOp === 'OR' ? bitwiseBits.map((b, i) => b | bitwiseBitsB[i]).join('') :
                                 bitwiseOp === 'XOR' ? bitwiseBits.map((b, i) => b ^ bitwiseBitsB[i]).join('') :
                                 bitwiseOp === 'SHIFT_L' ? [...bitwiseBits.slice(1), 0].join('') :
                                 [0, ...bitwiseBits.slice(0, 7)].join('')}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Controls specifically for subnetting_ip */}
                      {currentExperiment.id === 'subnetting_ip' && (
                        <div className="space-y-4 bg-slate-50 border border-slate-150 p-4 rounded-2xl">
                          {/* Prefix slider */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center text-[9px] font-bold text-slate-600">
                              <span>SELECT CIDR PREFIX PREFIX MASK</span>
                              <span className="font-mono text-indigo-600 font-extrabold">/{subnetPrefix}</span>
                            </div>
                            <input 
                              type="range"
                              min={24} max={30} step={1}
                              value={subnetPrefix}
                              onChange={(e) => {
                                setSubnetPrefix(Number(e.target.value));
                                setUnifiedValue(Number(e.target.value));
                              }}
                              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                          </div>
                        </div>
                      )}

                      {/* General Fallback Slider Input for other experiments */}
                      {['reaction_rate', 'calorimetry', 'resonance_sound', 'hookes_law', 'amylase_temp', 'binary_bitwise', 'subnetting_ip'].indexOf(currentExperiment.id) === -1 && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider">
                              {currentExperiment.inputLabel || 'Adjustment Parameter'}:
                            </label>
                            <span className="text-xs font-mono font-black text-[#2f47b3] bg-indigo-50/50 px-2 py-0.5 rounded border border-indigo-100">
                              {unifiedValue} {currentExperiment.unit || ''}
                            </span>
                          </div>
                          
                          <input 
                            type="range"
                            min={currentExperiment.inputMin !== undefined ? currentExperiment.inputMin : 10}
                            max={currentExperiment.inputMax !== undefined ? currentExperiment.inputMax : 100}
                            step={currentExperiment.inputStep !== undefined ? currentExperiment.inputStep : 5}
                            value={unifiedValue}
                            onChange={(e) => setUnifiedValue(Number(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                          />

                          <p className="text-[10px] text-slate-400 font-semibold italic">
                            Formula applied: {currentExperiment.outputFormula || ''}
                          </p>
                        </div>
                      )}

                    </div>
                  </div>

                  {/* Actions area */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                    <button
                      onClick={() => {
                        const yVal = currentExperiment.calculate ? currentExperiment.calculate(unifiedValue) : unifiedValue;
                        if (!recordedObservations.find(o => o.x === unifiedValue)) {
                          setRecordedObservations(prev => [...prev, { x: unifiedValue, y: yVal }].sort((a, b) => a.x - b.x));
                        }
                      }}
                      className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black cursor-pointer text-center transition-colors active:scale-98 flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Plus className="w-4 h-4 text-white" />
                      <span>Record Observation</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        setUnifiedValue(currentExperiment.inputDefault !== undefined ? currentExperiment.inputDefault : 50);
                        setRecordedObservations([]);
                        setUserCalcAnswer('');
                        setCalcFeedback('');
                        setCalcSuccess(null);
                        setActiveStepIndex(0);
                        setBenchActivityState('idle');
                        setVirtualWatchTime(0);
                        setVirtualWatchActive(false);

                        // Reset custom states
                        setThioVolume(30);
                        setHclConc(1.0);
                        setReactionStage('idle');
                        setCrossOpacity(1);

                        setCalAcidVol(50);
                        setCalBaseVol(50);
                        setCalAcidConc(1.0);
                        setCalTemp(25.0);
                        setCalStage('idle');

                        setResFrequency(384);
                        setResWaterLength(20);
                        setIsTuningForkStruck(false);

                        setHookeMass(100);

                        setAmylaseTemp(37);
                        setAmylaseTimeMinutes(0);
                        setAmylaseDrops(['blue-black', 'blue-black', 'blue-black', 'blue-black', 'blue-black', 'blue-black']);
                        setAmylaseStage('idle');

                        setBitwiseBits([0, 0, 0, 0, 0, 0, 0, 0]);
                        setBitwiseBitsB([0, 1, 0, 1, 1, 0, 1, 0]);
                        setBitwiseOp('AND');
                        setSubnetPrefix(24);
                      }}
                      className="px-4 py-3 border border-slate-200 text-slate-500 hover:bg-slate-50 rounded-xl text-xs font-black cursor-pointer transition-colors"
                    >
                      Reset Bench
                    </button>
                  </div>

                </div>

                {/* Right Column: Labs Guide & Calculations & Viva Voce */}
                <div className="lg:col-span-7 space-y-6">
                  
                  {/* Tabbed right hand panel */}
                  <div className="bg-white border border-slate-150 rounded-[2.5rem] p-6 md:p-8 space-y-6 shadow-xs">
                    
                    {/* Part 1: Theory & Core Apparatus */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-black uppercase tracking-widest text-[#2f47b3] border-b border-indigo-50 pb-2">I. Lab Manual &amp; Theory</h4>
                      <p className="text-xs text-slate-500 font-semibold leading-relaxed">{currentExperiment.theory}</p>
                      
                      <div className="flex flex-wrap items-center gap-2 pt-2">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mr-1">Apparatus:</span>
                        {currentExperiment.apparatus.map((app, aIdx) => (
                          <span key={aIdx} className="px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg text-[10px] font-bold">
                            📦 {app}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Part 2: Procedure steps checklist */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between border-b border-indigo-50 pb-2">
                        <h4 className="text-xs font-black uppercase tracking-widest text-[#2f47b3]">II. Step-by-Step Lab Procedure</h4>
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded text-[9px] font-black uppercase tracking-wider">
                          Practice Progress: {activeStepIndex} / {currentExperiment.procedure.length}
                        </span>
                      </div>
                      
                      {activeStepIndex === currentExperiment.procedure.length && (
                        <motion.div 
                          initial={{ scale: 0.95, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="p-5 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-100 rounded-3xl space-y-2 text-center"
                        >
                          <div className="text-2xl">🎉🏆</div>
                          <h4 className="text-xs font-black uppercase tracking-widest text-emerald-800">Experiment Practice Completed!</h4>
                          <p className="text-[11px] text-emerald-700 font-semibold leading-relaxed">
                            Excellent job! You have safely and systematically completed all procedural steps of this GCE syllabus experiment on the Virtual Measuring Bench.
                          </p>
                          <p className="text-[10px] text-slate-500 font-semibold">
                            You can now view your digital notebook records below, perform calculations, and test your skills in the Viva-Voce oral exam!
                          </p>
                        </motion.div>
                      )}

                      <div className="space-y-3">
                        {currentExperiment.procedure.map((step, sIdx) => {
                          const isCompleted = sIdx < activeStepIndex;
                          const isActive = sIdx === activeStepIndex;
                          const isLocked = sIdx > activeStepIndex;
                          
                          let cardClass = '';
                          if (isCompleted) {
                            cardClass = 'bg-emerald-50/20 border-emerald-100 text-slate-500';
                          } else if (isActive) {
                            cardClass = 'bg-white border-indigo-300 ring-2 ring-indigo-500/10 text-slate-800 shadow-md';
                          } else {
                            cardClass = 'bg-slate-50/50 border-slate-200 text-slate-400 opacity-60 cursor-not-allowed';
                          }

                          // Function to get procedural buttons labels depending on subject
                          const getPracticeBtnText = (idx: number) => {
                            if (selectedSubject === 'chemistry') {
                              if (idx === 0) return '🧪 Pour Sample Solution (25.0 mL)';
                              if (idx === 1) return '💧 Add Indicator Reagent (3 drops)';
                              if (idx === 2) return '⚙️ Calibrate Reagent Parameters';
                              if (idx === 3) return '🔥 Run Chemical Reaction Analysis';
                              if (idx === 4) return '💾 Save Results to Lab Notebook';
                              if (idx === 5) return '📐 Verify Post-Lab Calculations';
                            }
                            if (selectedSubject === 'physics') {
                              if (idx === 0) return '🔩 Secure/Mount Physics Apparatus';
                              if (idx === 1) return '⚙️ Configure Dimension Settings';
                              if (idx === 2) return '⏱️ Start Digital Stopwatch Timer';
                              if (idx === 3) return '🔴 Stop Stopwatch and Capture Period';
                              if (idx === 4) return '💾 Record Period Values to Notebook';
                              if (idx === 5) return '📐 Verify Post-Lab calculations';
                            }
                            if (selectedSubject === 'biology') {
                              if (idx === 0) return '🧫 Mount Specimen Slide on Platform';
                              if (idx === 1) return '⚙️ Set Environmental Factors';
                              if (idx === 2) return '🌡️ Start Incubator Sequence';
                              if (idx === 3) return '🔬 Peer into Lens & Count Changes';
                              if (idx === 4) return '💾 Record Rate Output to Notebook';
                              if (idx === 5) return '📐 Complete Oral Verification Checks';
                            }
                            if (selectedSubject === 'computer_science') {
                              if (idx === 0) return '🖥️ Initialize CPU Register Blocks';
                              if (idx === 1) return '⚙️ Bind Byte Parameters to VM';
                              if (idx === 2) return '▶️ Run Algorithm Tracing Step';
                              if (idx === 3) return '👁️ Verify Memory Map Outputs';
                              if (idx === 4) return '💾 Save Code Traces to Lab Notebook';
                              if (idx === 5) return '📐 Complete Truth Table Validation';
                            }
                            return '🧪 Practice Active Procedure Step';
                          };

                          const handlePracticeStep = (idx: number) => {
                            if (idx !== activeStepIndex) return;

                            if (selectedSubject === 'chemistry') {
                              if (idx === 0) {
                                setBenchActivityState('poured');
                                setActiveStepIndex(1);
                              } else if (idx === 1) {
                                setBenchActivityState('indicated');
                                setActiveStepIndex(2);
                              } else if (idx === 2) {
                                setBenchActivityState('parameter_set');
                                setActiveStepIndex(3);
                              } else if (idx === 3) {
                                setBenchActivityState('reacting');
                                setActiveStepIndex(4);
                              } else if (idx === 4) {
                                const yVal = currentExperiment.calculate ? currentExperiment.calculate(unifiedValue) : unifiedValue;
                                if (!recordedObservations.find(o => o.x === unifiedValue)) {
                                  setRecordedObservations(prev => [...prev, { x: unifiedValue, y: yVal }].sort((a, b) => a.x - b.x));
                                }
                                setBenchActivityState('done');
                                setActiveStepIndex(5);
                              } else if (idx === 5) {
                                setActiveStepIndex(6);
                              }
                            } else if (selectedSubject === 'physics') {
                              if (idx === 0) {
                                setBenchActivityState('clamped');
                                setActiveStepIndex(1);
                              } else if (idx === 1) {
                                setBenchActivityState('parameter_set');
                                setActiveStepIndex(2);
                              } else if (idx === 2) {
                                setVirtualWatchTime(0);
                                setVirtualWatchActive(true);
                                setBenchActivityState('timing');
                                setActiveStepIndex(3);
                              } else if (idx === 3) {
                                setVirtualWatchActive(false);
                                setBenchActivityState('measured');
                                setActiveStepIndex(4);
                              } else if (idx === 4) {
                                const yVal = currentExperiment.calculate ? currentExperiment.calculate(unifiedValue) : unifiedValue;
                                if (!recordedObservations.find(o => o.x === unifiedValue)) {
                                  setRecordedObservations(prev => [...prev, { x: unifiedValue, y: yVal }].sort((a, b) => a.x - b.x));
                                }
                                setBenchActivityState('done');
                                setActiveStepIndex(5);
                              } else if (idx === 5) {
                                setActiveStepIndex(6);
                              }
                            } else if (selectedSubject === 'biology') {
                              if (idx === 0) {
                                setBenchActivityState('specimen_ready');
                                setActiveStepIndex(1);
                              } else if (idx === 1) {
                                setBenchActivityState('parameter_set');
                                setActiveStepIndex(2);
                              } else if (idx === 2) {
                                setVirtualWatchTime(0);
                                setVirtualWatchActive(true);
                                setBenchActivityState('incubating');
                                setActiveStepIndex(3);
                              } else if (idx === 3) {
                                setVirtualWatchActive(false);
                                setBenchActivityState('observed');
                                setActiveStepIndex(4);
                              } else if (idx === 4) {
                                const yVal = currentExperiment.calculate ? currentExperiment.calculate(unifiedValue) : unifiedValue;
                                if (!recordedObservations.find(o => o.x === unifiedValue)) {
                                  setRecordedObservations(prev => [...prev, { x: unifiedValue, y: yVal }].sort((a, b) => a.x - b.x));
                                }
                                setBenchActivityState('done');
                                setActiveStepIndex(5);
                              } else if (idx === 5) {
                                setActiveStepIndex(6);
                              }
                            } else if (selectedSubject === 'computer_science') {
                              if (idx === 0) {
                                setBenchActivityState('compiled');
                                setActiveStepIndex(1);
                              } else if (idx === 1) {
                                setBenchActivityState('parameter_set');
                                setActiveStepIndex(2);
                              } else if (idx === 2) {
                                setVirtualWatchTime(0);
                                setVirtualWatchActive(true);
                                setBenchActivityState('executing');
                                setActiveStepIndex(3);
                              } else if (idx === 3) {
                                setVirtualWatchActive(false);
                                setBenchActivityState('traced');
                                setActiveStepIndex(4);
                              } else if (idx === 4) {
                                const yVal = currentExperiment.calculate ? currentExperiment.calculate(unifiedValue) : unifiedValue;
                                if (!recordedObservations.find(o => o.x === unifiedValue)) {
                                  setRecordedObservations(prev => [...prev, { x: unifiedValue, y: yVal }].sort((a, b) => a.x - b.x));
                                }
                                setBenchActivityState('done');
                                setActiveStepIndex(5);
                              } else if (idx === 5) {
                                setActiveStepIndex(6);
                              }
                            }
                          };

                          return (
                            <div
                              key={sIdx}
                              className={`p-3.5 rounded-2xl border text-left text-xs font-semibold flex flex-col gap-3 transition-all ${cardClass}`}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-all ${isCompleted ? 'bg-emerald-600 border-emerald-600 text-white' : isActive ? 'border-indigo-500 bg-indigo-50 text-indigo-600 animate-pulse' : 'border-slate-300 bg-white'}`}>
                                  {isCompleted ? (
                                    <Check className="w-3.5 h-3.5 stroke-[3.5]" />
                                  ) : isActive ? (
                                    <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
                                  ) : (
                                    <Lock className="w-2.5 h-2.5 text-slate-400" />
                                  )}
                                </div>
                                <div className="space-y-1 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-black uppercase tracking-wider ${isCompleted ? 'text-emerald-700' : isActive ? 'text-indigo-600' : 'text-slate-400'}`}>
                                      Step {sIdx + 1} {isCompleted && '— Completed'} {isActive && '— In Progress'}
                                    </span>
                                  </div>
                                  <span className={isCompleted ? 'line-through opacity-85' : ''}>{step}</span>
                                </div>
                              </div>

                              {/* Interactive Active Practice Action Button */}
                              {isActive && (
                                <motion.div 
                                  initial={{ opacity: 0, y: -5 }} 
                                  animate={{ opacity: 1, y: 0 }}
                                  className="pl-8 pt-1"
                                >
                                  <button
                                    onClick={() => handlePracticeStep(sIdx)}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer transition-all active:scale-95 shadow-sm hover:shadow flex items-center gap-1.5 font-bold"
                                  >
                                    <Play className="w-3.5 h-3.5 text-white" />
                                    <span>{getPracticeBtnText(sIdx)}</span>
                                  </button>
                                </motion.div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Part 3: Live Observations Record Table */}
                    <div className="space-y-3 pt-2">
                      <h4 className="text-xs font-black uppercase tracking-widest text-[#2f47b3] border-b border-indigo-50 pb-2">III. Digital Laboratory Notebook</h4>
                      
                      {recordedObservations.length === 0 ? (
                        <div className="py-6 text-center text-xs text-slate-400 font-semibold border-2 border-dashed border-slate-150 rounded-2xl bg-slate-50/50">
                          Your notebook is empty. Complete the first few steps above and click "Save Results to Lab Notebook" to automatically register measurements.
                        </div>
                      ) : (
                        <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-xs">
                          <table className="w-full text-left text-xs font-mono text-slate-600">
                            <thead>
                              <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                                <th className="p-2.5 font-bold uppercase">{currentExperiment.inputLabel || 'X-Input'}</th>
                                <th className="p-2.5 font-bold uppercase">{currentExperiment.outputLabel || 'Y-Output'}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {recordedObservations.map((obs, oIdx) => (
                                <tr key={oIdx} className="border-b border-slate-150 hover:bg-slate-50 font-bold text-slate-700">
                                  <td className="p-2.5">{obs.x} {currentExperiment.unit || ''}</td>
                                  <td className="p-2.5 text-indigo-600">{obs.y} {currentExperiment.unit || ''}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* Part 4: Post-Lab Calculations Verification */}
                    {currentExperiment.expectedQuestion && (
                      <div className="bg-slate-50 border border-slate-150 p-5 rounded-2xl space-y-4 pt-4">
                        <div className="flex items-center gap-1.5">
                          <FileCheck className="w-4.5 h-4.5 text-indigo-600" />
                          <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">IV. Post-Lab Calculations Validation</h4>
                        </div>
                        
                        <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                          {currentExperiment.expectedQuestion} <strong className="text-slate-800 font-bold">(Currently, {currentExperiment.inputLabel}: {unifiedValue})</strong>
                        </p>

                        <div className="flex items-center gap-2">
                          <input 
                            type="text"
                            placeholder="Enter your calculation result..."
                            value={userCalcAnswer}
                            onChange={(e) => setUserCalcAnswer(e.target.value)}
                            className="flex-1 px-4 py-2.5 bg-white border border-slate-250 rounded-xl text-xs font-bold font-mono outline-none focus:border-indigo-500"
                          />
                          <button
                            onClick={() => {
                              const parsed = parseFloat(userCalcAnswer);
                              if (isNaN(parsed)) {
                                setCalcFeedback('Please enter a valid numeric calculation output.');
                                setCalcSuccess(false);
                                return;
                              }
                              if (currentExperiment.validateAnswer) {
                                const check = currentExperiment.validateAnswer(parsed, unifiedValue);
                                setCalcFeedback(check.feedback);
                                setCalcSuccess(check.success);
                              }
                            }}
                            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer active:scale-95 shrink-0"
                          >
                            Verify
                          </button>
                        </div>

                        {calcFeedback && (
                          <div className={`p-3.5 rounded-xl border text-[11px] font-bold leading-normal ${calcSuccess ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'}`}>
                            {calcFeedback}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Part 5: Viva Voce Questions Section */}
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <HelpCircle className="w-4.5 h-4.5 text-amber-500" />
                        <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">V. Interactive Viva-Voce (Oral Examination)</h4>
                      </div>

                      <div className="space-y-5">
                        {currentExperiment.vivaQuestions.map((q, qIdx) => {
                          const selectedOpt = vivaAnswers[qIdx];
                          const hasAnswered = selectedOpt !== undefined;
                          return (
                            <div key={qIdx} className="space-y-2 border-l-2 border-slate-100 pl-4">
                              <p className="text-xs font-extrabold text-slate-800 leading-normal">{qIdx + 1}. {q.question}</p>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {q.options.map((opt, oIdx) => {
                                  const isCorrect = oIdx === q.answer;
                                  const isSelected = oIdx === selectedOpt;
                                  
                                  let btnClass = 'bg-white border-slate-150 text-slate-700 hover:bg-slate-50';
                                  if (hasAnswered) {
                                    if (isCorrect) {
                                      btnClass = 'bg-emerald-50 border-emerald-300 text-emerald-800';
                                    } else if (isSelected) {
                                      btnClass = 'bg-rose-50 border-rose-300 text-rose-800';
                                    } else {
                                      btnClass = 'bg-white border-slate-100 text-slate-300 cursor-not-allowed';
                                    }
                                  }

                                  return (
                                    <button
                                      key={oIdx}
                                      disabled={hasAnswered}
                                      onClick={() => setVivaAnswers(prev => ({ ...prev, [qIdx]: oIdx }))}
                                      className={`p-2.5 text-left text-xs font-semibold rounded-xl border transition-all ${btnClass}`}
                                    >
                                      <span>{opt}</span>
                                    </button>
                                  );
                                })}
                              </div>

                              {hasAnswered && (
                                <p className="text-[10px] text-slate-500 font-medium leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100 mt-1">
                                  <strong className="text-indigo-600">Explanation:</strong> {q.explanation}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                  </div>

                </div>
              </div>

            </div>
          )}

        </div>
      )}
    </div>
  );
}
