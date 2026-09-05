import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  Code, 
  TestTube, 
  MessageSquare, 
  ArrowRight, 
  LogOut, 
  LayoutDashboard, 
  User, 
  Camera, 
  Users, 
  Star,
  Quote,
  Sparkles,
  Globe,
  Send,
  Trophy,
  Compass,
  Target,
  Loader2,
  CheckCircle2,
  BrainCircuit,
  Bell,
  X,
  Crown,
  Lock,
  TrendingUp,
  Download,
  Share2,
  Check,
  CheckSquare,
  Menu,
  ArrowLeft,
  Search,
  SlidersHorizontal,
  Sliders,
  Timer,
  Calendar,
  Flame,
  RefreshCw,
  Play,
  Pause,
  Volume2,
  VolumeX,
  HelpCircle
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchDailyObjectives, fetchDailyReevaluationMessage, submitDailyReevaluationAnswer } from '../services/aiService';
import ReactMarkdown from 'react-markdown';
import { auth, db, signOut } from '../lib/firebase';
import { doc, updateDoc, collection, onSnapshot, addDoc, Timestamp, serverTimestamp, getDoc } from 'firebase/firestore';
import { TRANSLATIONS, Language } from '../constants/translations';
import { generateStudyNotes } from '../services/aiService';
import CommunityModal from './CommunityModal';
import ScoreboardTable from './ScoreboardTable';
import PremiumOnboardingModal from './PremiumOnboardingModal';
import DualChallengeScreen from './DualChallengeScreen';
import StudentChatHub from './StudentChatHub';
import LearningGrowthSection from './LearningGrowthSection';
import PracticalsSection from './PracticalsSection';
import { ThreeDCard } from './ThreeDCard';

export interface Flashcard {
  id: string;
  subject: 'physics' | 'chemistry' | 'biology' | 'cs';
  question: string;
  answer: string;
  hint: string;
}

const REVISION_FLASHCARDS: Flashcard[] = [
  // PHYSICS
  {
    id: 'p1',
    subject: 'physics',
    question: 'What is the fundamental wavelength formula in a closed resonance tube?',
    answer: 'λ = 4 * L (where L is the first resonance length of the air column). At the first resonance, a node forms at the closed water surface and an antinode forms at the open end, which represents one-quarter of the wave.',
    hint: 'Think about node-to-antinode distance.'
  },
  {
    id: 'p2',
    subject: 'physics',
    question: 'State Hooke’s Law regarding springs.',
    answer: 'Hooke’s Law states that the extension (x) of an elastic material is directly proportional to the applied force (F), written as F = kx, provided the limit of proportionality is not exceeded.',
    hint: 'Relates force, extension, and spring stiffness.'
  },
  {
    id: 'p3',
    subject: 'physics',
    question: 'How does temperature affect the speed of sound in air?',
    answer: 'The speed of sound increases with temperature. As temperature rises, air molecules gain more kinetic energy and move faster, allowing pressure wave oscillations to propagate more rapidly.',
    hint: 'Consider the kinetic energy of air molecules.'
  },
  {
    id: 'p4',
    subject: 'physics',
    question: 'State Ohm’s Law for electrical conductors.',
    answer: 'Ohm’s Law states that the current (I) flowing through a conductor is directly proportional to the potential difference (V) across it, provided physical conditions like temperature remain constant.',
    hint: 'V = I * R is the direct result.'
  },
  {
    id: 'p5',
    subject: 'physics',
    question: 'What is Archimedes\' Principle?',
    answer: 'Archimedes\' principle states that the upward buoyant force exerted on a body immersed in a fluid, whether fully or partially submerged, is equal to the weight of the fluid that the body displaces.',
    hint: 'Buoyant force equals weight of displaced fluid.'
  },
  {
    id: 'p6',
    subject: 'physics',
    question: 'State the law of conservation of linear momentum.',
    answer: 'The total linear momentum of an isolated system of interacting bodies remains constant in magnitude and direction, provided no external resultant force acts on the system.',
    hint: 'Momentum is constant if net external force is zero.'
  },
  {
    id: 'p7',
    subject: 'physics',
    question: 'What is a projectile and state the two independent motions that govern it?',
    answer: 'A projectile is an object launched into space influenced only by gravity. Its motion is governed by: 1) constant horizontal velocity (zero acceleration), and 2) constant vertical acceleration due to gravity (g).',
    hint: 'Horizontal velocity is constant, vertical is accelerated.'
  },
  {
    id: 'p8',
    subject: 'physics',
    question: 'State Faraday\'s Law of Electromagnetic Induction.',
    answer: 'Faraday\'s Law states that the magnitude of the induced electromotive force (EMF) in a circuit is directly proportional to the rate of change of magnetic flux linkage through the circuit.',
    hint: 'EMF equals rate of change of flux.'
  },
  
  // CHEMISTRY
  {
    id: 'c1',
    subject: 'chemistry',
    question: 'What is the reaction equation for the Sodium Thiosulfate and HCl kinetics experiment?',
    answer: 'Na2S2O3 (aq) + 2HCl (aq) → 2NaCl (aq) + S (s) + SO2 (g) + H2O (l). The slow formation of solid yellow colloidal sulfur precipitate (S) causes the solution to turn cloudy.',
    hint: 'Think about the yellow precipitate that hides the black cross.'
  },
  {
    id: 'c2',
    subject: 'chemistry',
    question: 'Why is Methyl Orange indicator used in strong acid - weak base titrations?',
    answer: 'Methyl orange changes colour in the pH range 3.1 - 4.4 (acidic region). The equivalence point of a strong acid - weak base titration lies in this acidic range, making it a perfect match.',
    hint: 'Think about the pH at the equivalence point.'
  },
  {
    id: 'c3',
    subject: 'chemistry',
    question: 'Explain Le Chatelier’s Principle.',
    answer: 'Le Chatelier’s Principle states that if a dynamic equilibrium system is subjected to a change in concentration, temperature, or pressure, the system will shift its equilibrium position to counteract that change.',
    hint: 'It is a response to external stress.'
  },
  {
    id: 'c4',
    subject: 'chemistry',
    question: 'Define the term "Enthalpy of Neutralization".',
    answer: 'The Enthalpy of Neutralization is the change in heat energy when one mole of water is formed by the complete reaction of an acid and an alkali under standard conditions (which is always exothermic).',
    hint: 'It forms exactly 1 mole of liquid H2O.'
  },
  {
    id: 'c5',
    subject: 'chemistry',
    question: 'What is the key difference between a galvanic cell and an electrolytic cell?',
    answer: 'A galvanic cell converts chemical energy into electrical energy from spontaneous redox reactions, while an electrolytic cell uses electrical energy to drive non-spontaneous chemical reactions.',
    hint: 'Spontaneous vs non-spontaneous.'
  },
  {
    id: 'c6',
    subject: 'chemistry',
    question: 'State the conditions required for rust formation on iron.',
    answer: 'Rusting of iron requires both oxygen (from air) and water. It is an electrochemical process forming hydrated iron(III) oxide (Fe2O3·H2O).',
    hint: 'Air and humidity together.'
  },
  {
    id: 'c7',
    subject: 'chemistry',
    question: 'What is a buffer solution and how does it function?',
    answer: 'A buffer solution resists changes in pH when small amounts of acid or base are added. It consists of a weak acid and its conjugate base, or a weak base and its conjugate acid, which neutralize added hydrogen or hydroxide ions.',
    hint: 'Weak acid/base + its salt.'
  },
  {
    id: 'c8',
    subject: 'chemistry',
    question: 'State the difference between temporary hardness and permanent hardness in water.',
    answer: 'Temporary hardness is caused by dissolved calcium/magnesium hydrogencarbonates and can be removed by boiling. Permanent hardness is caused by calcium/magnesium sulfates or chlorides and cannot be removed by boiling alone.',
    hint: 'Boiling can decompose hydrogencarbonates.'
  },

  // BIOLOGY
  {
    id: 'b1',
    subject: 'biology',
    question: 'What is the optimal temperature for human salivary amylase and what happens if it is exceeded?',
    answer: 'The optimal temperature is 37°C (human body temperature). If exceeded (typically above 45°C), the thermal kinetic energy disrupts weak hydrogen bonds in the enzyme, changing the active site shape (denaturing).',
    hint: 'Matches human internal body temperature.'
  },
  {
    id: 'b2',
    subject: 'biology',
    question: 'Describe the biochemical test for reducing sugars (like glucose).',
    answer: 'Add Benedict’s reagent to the sample and heat in a hot water bath (above 80°C) for 5 minutes. A colour transition from blue to green, yellow, orange, or brick-red indicates reducing sugars.',
    hint: 'Requires heat and turns red.'
  },
  {
    id: 'b3',
    subject: 'biology',
    question: 'Define osmosis in plant tissues (e.g., potato cylinders).',
    answer: 'Osmosis is the net movement of water molecules from a region of higher water potential (dilute solution) to lower water potential (concentrated solution) across a selectively permeable membrane.',
    hint: 'Think about water potential gradients.'
  },
  {
    id: 'b4',
    subject: 'biology',
    question: 'What color indicates starch in the iodine food test?',
    answer: 'A deep blue-black color. If starch is absent, the iodine remains brown-orange.',
    hint: 'This is the standard indicator used in amylase experiments.'
  },
  {
    id: 'b5',
    subject: 'biology',
    question: 'What is the structural and functional difference between xylem and phloem in vascular plants?',
    answer: 'Xylem consists of dead lignified vessels that transport water and mineral salts from roots upwards (transpiration stream). Phloem consists of living sieve tubes and companion cells that transport synthesized sucrose and amino acids bidirectionally (translocation).',
    hint: 'Water transport upward vs glucose transport.'
  },
  {
    id: 'b6',
    subject: 'biology',
    question: 'Define the terms homozygous and heterozygous in genetics.',
    answer: 'Homozygous means possessing two identical alleles for a particular gene (e.g., TT or tt). Heterozygous means possessing two different alleles for a particular gene (e.g., Tt).',
    hint: 'Identical alleles vs different alleles.'
  },
  {
    id: 'b7',
    subject: 'biology',
    question: 'What are the key differences between aerobic and anaerobic respiration in terms of energy yield and products?',
    answer: 'Aerobic respiration uses oxygen, fully oxidizes glucose to CO2 and H2O, yielding about 36-38 ATP per molecule. Anaerobic respiration occurs without oxygen, incompletely oxidizes glucose to lactic acid (animals) or ethanol and CO2 (yeast), yielding only 2 ATP.',
    hint: 'Oxygen presence vs absence, ATP output.'
  },
  {
    id: 'b8',
    subject: 'biology',
    question: 'Describe the key function of the hormone Insulin in glucose homeostasis.',
    answer: 'Insulin is secreted by beta cells of the pancreas. It lowers blood glucose levels by stimulating liver and muscle cells to take up glucose from blood and convert it into stored glycogen (glycogenesis).',
    hint: 'Pancreas hormone that decreases blood sugar.'
  },

  // COMPUTER SCIENCE
  {
    id: 'cs1',
    subject: 'cs',
    question: 'In computer networks, what is the purpose of a subnet mask?',
    answer: 'A subnet mask divides an IP address into two parts: one part identifies the host network/subnet, and the other part identifies the specific host device, helping routers direct traffic.',
    hint: 'Distinguishes the network prefix from host bits.'
  },
  {
    id: 'cs2',
    subject: 'cs',
    question: 'Describe the difference between a LIFO stack and a FIFO queue.',
    answer: 'A stack is Last-In, First-Out (LIFO) where items are added and removed from the top. A queue is First-In, First-Out (FIFO) where items are added at the rear and removed from the front.',
    hint: 'Think of cafeteria plates vs. a supermarket checkout line.'
  },
  {
    id: 'cs3',
    subject: 'cs',
    question: 'What is the average time complexity of a Binary Search and why is it efficient?',
    answer: 'The average time complexity is O(log n). It is highly efficient because it halves the remaining search range at each step, requiring sorted data to operate.',
    hint: 'Halving the space at each step.'
  },
  {
    id: 'cs4',
    subject: 'cs',
    question: 'What is the role of the CPU Program Counter (PC) register?',
    answer: 'The Program Counter (PC) holds the memory address of the next assembly instruction that the CPU will fetch, decode, and execute in the Fetch-Decode-Execute cycle.',
    hint: 'Points to the next sequence item in execution.'
  },
  {
    id: 'cs5',
    subject: 'cs',
    question: 'What is a primary key and a foreign key in a relational database?',
    answer: 'A primary key is a unique attribute that uniquely identifies each record in a database table. A foreign key is an attribute in one table that refers to the primary key of another table, establishing a link/relationship between them.',
    hint: 'Unique table identifier vs references.'
  },
  {
    id: 'cs6',
    subject: 'cs',
    question: 'Explain the difference between a compiler and an interpreter.',
    answer: 'A compiler translates the entire source code into machine code (object code) at once before execution. An interpreter translates and executes the source code line-by-line during runtime.',
    hint: 'Pre-compilation vs real-time translation.'
  },
  {
    id: 'cs7',
    subject: 'cs',
    question: 'What is the purpose of the TCP protocol in the TCP/IP stack?',
    answer: 'TCP (Transmission Control Protocol) is a connection-oriented protocol that ensures reliable, ordered, and error-checked delivery of packets between devices in a network.',
    hint: 'Connection-oriented and error-checked delivery.'
  },
  {
    id: 'cs8',
    subject: 'cs',
    question: 'What is Recursion and state the two essential components of any recursive function?',
    answer: 'Recursion is a programming technique where a function calls itself. It must contain: 1) a base case to terminate the recursion, and 2) a recursive step that progresses towards the base case.',
    hint: 'Self-calling function, base case and step.'
  }
];

interface StudentDashboardProps {
  userData: any;
  onAction: (type: 'find' | 'join' | 'ask' | 'scan' | 'study' | 'upgrade' | 'prep', initialSubject?: string, initialTopic?: string) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  onInitiateVideoCall?: (title: string, price: string) => void;
  onBackToHome?: () => void;
  initialTab?: 'home' | 'chat' | 'growth' | 'practicals';
}

const LOCALIZED_TESTIMONIALS = {
  ENGLISH: [
    {
      name: "Thomas Kamga",
      avatar: "https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?auto=format&fit=crop&q=80&w=256&h=256",
      role: "Engineering Student",
      text: "The tutors are definitely knowledgeable, but sometimes it takes a while to get a response during peak hours. However, the AI integration is quite fast for solving basic equations when I'm in a rush.",
      origin: "Cameroon"
    },
    {
      name: "Maya Williams",
      avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=256&h=256",
      role: "CS Major",
      text: "I love the Join Class feature! It really helped me break down complex algorithm topics into manageable daily tasks. The progress chart keeps me motivated to finish my study goals.",
      origin: "United States"
    },
    {
      name: "Amara Bello",
      avatar: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&q=80&w=256&h=256",
      role: "Medical Student",
      text: "NC.edu has been a lifesaver for my Physics prep. I was struggling with mechanics, but finding a specialized tutor who could explain things intuitively changed everything for me. Highly recommended!",
      origin: "Cameroon"
    }
  ],
  FRENCH: [
    {
      name: "Thomas Kamga",
      avatar: "https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?auto=format&fit=crop&q=80&w=256&h=256",
      role: "Étudiant en Ingénierie",
      text: "Les tuteurs sont vraiment compétent, mais il faut parfois attendre pour obtenir une réponse aux heures de pointe. Cependant, l'intégration de l'IA est incroyablement rapide pour résoudre des équations de base.",
      origin: "Cameroun"
    },
    {
      name: "Maya Williams",
      avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=256&h=256",
      role: "Étudiante en Informatique",
      text: "J'adore la fonctionnalité Rejoindre un Cours ! Cela m'a beaucoup aidée à diviser des sujets d'algorithmes complexes en tâches quotidiennes gérables. Le graphique de progression me motive à atteindre mes objectifs.",
      origin: "États-Unis"
    },
    {
      name: "Amara Bello",
      avatar: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&q=80&w=256&h=256",
      role: "Étudiante en Médecine",
      text: "NC.edu a sauvé ma préparation en physique. Je galérais avec la mécanique, mais trouver un tuteur spécialisé qui explique les choses de manière intuitive a tout changé pour moi. Je recommande vivement !",
      origin: "Cameroun"
    }
  ],
  CHINESE: [
    {
      name: "Thomas Kamga",
      avatar: "https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?auto=format&fit=crop&q=80&w=256&h=256",
      role: "工程学专业学生",
      text: "导师们确实非常专业，但在高峰时段有时需要等待较长时间。不过，在我赶时间的时候，AI 功能对于求解基础数学公式的速度无懈可击！",
      origin: "喀麦隆"
    },
    {
      name: "Maya Williams",
      avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=256&h=256",
      role: "计算机科学专业学生",
      text: "我非常喜欢“加入班级”这个板块！它把复杂的算法概念细化为每日渐进式的小任务。进度图表让我时刻保持充足动力去实现学业目标。",
      origin: "美国"
    },
    {
      name: "Amara Bello",
      avatar: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&q=80&w=256&h=256",
      role: "医学系学生",
      text: "NC.edu 简直是我的物理备考救星！我之前对力学一窍不通，但遇到了一位能通俗易懂地讲解物理规则的专属导师，彻底改变了我的学业前景。强烈推荐！",
      origin: "喀麦隆"
    }
  ],
  SPANISH: [
    {
      name: "Thomas Kamga",
      avatar: "https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?auto=format&fit=crop&q=80&w=256&h=256",
      role: "Estudiante de Ingeniería",
      text: "Los tutores son indudablemente expertos, pero a veces toma algo de tiempo obtener una respuesta en horas pico. Sin embargo, la integración con la IA es sumamente veloz para resolver ecuaciones básicas cuando tengo prisa.",
      origin: "Camerún"
    },
    {
      name: "Maya Williams",
      avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=256&h=256",
      role: "Estudiante de Ciencias de la Computación",
      text: "Me encanta la función de Unirse a Clase. Realmente me ayudó a dividir temas complejos de algoritmos en misiones diarias alcanzables. El gráfico de progreso me mantiene motivada.",
      origin: "Estados Unidos"
    },
    {
      name: "Amara Bello",
      avatar: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&q=80&w=256&h=256",
      role: "Estudiante de Medicina",
      text: "NC.edu ha sido mi salvación para la preparación de Física. Solía tener problemas con la mecánica, pero encontrar un tutor especializado que pudiera explicar las cosas de forma intuitiva lo cambió todo. ¡Muy recomendado!",
      origin: "Camerún"
    }
  ]
};

export default function StudentDashboard({ userData, onAction, language, setLanguage, onInitiateVideoCall, onBackToHome, initialTab }: StudentDashboardProps) {
  const [photoUrl, setPhotoUrl] = useState(userData.photoUrl || '');

  // Get active cards for today
  const dailyFlashcards = React.useMemo(() => {
    const date = new Date();
    const daySeed = date.getFullYear() * 366 + date.getMonth() * 31 + date.getDate();
    const subjects = ['physics', 'chemistry', 'biology', 'cs'] as const;
    const filtered: Flashcard[] = [];
    
    subjects.forEach(subj => {
      const subjCards = REVISION_FLASHCARDS.filter(c => c.subject === subj);
      if (subjCards.length <= 4) {
        filtered.push(...subjCards);
      } else {
        // Rotate cards stably based on daySeed: select 4 cards out of subjCards.length
        for (let i = 0; i < 4; i++) {
          const idx = (daySeed + i) % subjCards.length;
          filtered.push(subjCards[idx]);
        }
      }
    });
    return filtered;
  }, []);
  const [examPapers, setExamPapers] = useState<any[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'exam_papers'), (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setExamPapers(data);
    }, (err) => {
      console.error("Error syncing exam papers in StudentDashboard:", err);
    });
    return () => unsub();
  }, []);

  // Real-time Chat Notifications
  const [chatNotifications, setChatNotifications] = useState<Array<{
    id: string;
    title: string;
    text: string;
    sender: string;
    role: 'student' | 'tutor' | 'admin';
  }>>([]);

  const adminMsgsInitialLoaded = React.useRef(false);

  const playNotificationSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const playBeep = (delay: number, frequency: number, duration: number) => {
        setTimeout(() => {
          const osc = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();
          osc.connect(gainNode);
          gainNode.connect(audioCtx.destination);
          osc.type = 'sine';
          osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);
          gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
          gainNode.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 0.02);
          gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
          osc.start();
          osc.stop(audioCtx.currentTime + duration);
        }, delay);
      };
      playBeep(0, 880, 0.25);
      playBeep(150, 1109.73, 0.35);
    } catch (e) {
      console.warn("Audio Context not supported or allowed yet:", e);
    }
  };

  const triggerChatNotification = (title: string, text: string, sender: string, role: 'student' | 'tutor' | 'admin') => {
    const id = Math.random().toString(36).substring(2, 11);
    setChatNotifications(prev => [...prev, { id, title, text, sender, role }]);
    playNotificationSound();
    setTimeout(() => {
      setChatNotifications(prev => prev.filter(n => n.id !== id));
    }, 5500);
  };
  const [isCommunityOpen, setIsCommunityOpen] = useState(false);
  const [dashboardTab, setDashboardTab] = useState<'home' | 'chat' | 'growth' | 'practicals'>(initialTab || 'home');
  
  useEffect(() => {
    if (initialTab) {
      setDashboardTab(initialTab);
    }
  }, [initialTab]);
  const [isUploading, setIsUploading] = useState(false);
  
  const [feedback, setFeedback] = useState(userData.comment || '');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState('');
  const [isPremiumOnboardingOpen, setIsPremiumOnboardingOpen] = useState(false);
  const [hasDismissedOnboarding, setHasDismissedOnboarding] = useState(false);
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);

  // Adaptive Study Path Extension States
  const [activeStudyGuideTopic, setActiveStudyGuideTopic] = useState<string | null>(null);
  const [studyGuideContent, setStudyGuideContent] = useState<string>('');
  const [isGeneratingGuide, setIsGeneratingGuide] = useState<boolean>(false);
  const [guideError, setGuideError] = useState<string>('');

  // Daily Objectives, Re-evaluation, and GCE/BAC/Concours Papers States
  const [dailyObjectives, setDailyObjectives] = useState<any[]>([]);
  const [objectivesLoading, setObjectivesLoading] = useState<boolean>(false);
  const [reevalMessage, setReevalMessage] = useState<string>('');
  const [reevalQuestion, setReevalQuestion] = useState<string>('');
  const [reevalInput, setReevalInput] = useState<string>('');
  const [reevalFeedback, setReevalFeedback] = useState<string>('');
  const [reevalScore, setReevalScore] = useState<number | null>(null);
  const [reevalLoading, setReevalLoading] = useState<boolean>(false);
  const [reevalSubmitting, setReevalSubmitting] = useState<boolean>(false);
  
  const [selectedRealPaper, setSelectedRealPaper] = useState<any>(null);
  const [showSolutionGated, setShowSolutionGated] = useState<boolean>(false);
  const [paperModalTab, setPaperModalTab] = useState<'document' | 'corrections'>('document');
  const [examFlowType, setExamFlowType] = useState<string | null>(null);
  const [examFlowYear, setExamFlowYear] = useState<string | null>(null);
  
  // Question Bank Organization States
  const [paperSearchQuery, setPaperSearchQuery] = useState<string>('');
  const [paperSubjectFilter, setPaperSubjectFilter] = useState<string>('All');
  const [paperTypeFilter, setPaperTypeFilter] = useState<string>('All');
  const [paperSubsystemFilter, setPaperSubsystemFilter] = useState<string>('All');
  const [paperDifficultyFilter, setPaperDifficultyFilter] = useState<string>('All');
  const [paperBrowseMode, setPaperBrowseMode] = useState<boolean>(true);

  // Low Connection & Offline Data Vault States
  const [dataSaver, setDataSaver] = useState(() => localStorage.getItem('nc_data_saver') === 'true');
  const [localVaultGuides, setLocalVaultGuides] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('nc_offline_guides');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [activeOfflineGuide, setActiveOfflineGuide] = useState<any | null>(null);

  // Billing History Transaction list state
  const [momoTransactions, setMomoTransactions] = useState<any[]>([]);

  // Interactive Offline Notebook & Standard Audio Reader states
  const [personalNotes, setPersonalNotes] = useState<string>(() => {
    const cached = localStorage.getItem('nc_personal_notes');
    // If user's browser has the old pidgin default cached, force reset it to the new standard English
    if (cached && (cached.includes('Dem scientific') || cached.includes('Newton say') || cached.includes('dey easy'))) {
      const standardText = "Scientific formulas are easy to master. Newton states that Force equals Mass multiplied by Acceleration! The GCE examiner will ask you to outline kinetic laws and write structural proofs. Study hard, study with nc.edu!";
      localStorage.setItem('nc_personal_notes', standardText);
      return standardText;
    }
    return cached || 
      "Scientific formulas are easy to master. Newton states that Force equals Mass multiplied by Acceleration! The GCE examiner will ask you to outline kinetic laws and write structural proofs. Study hard, study with nc.edu!";
  });
  const [isSpeakingNotes, setIsSpeakingNotes] = useState(false);

  // Real-time Dual Challenge States
  const [myChallenges, setMyChallenges] = useState<any[]>([]);
  const [activeChallenge, setActiveChallenge] = useState<any | null>(null);
  const [challengeActionLoading, setChallengeActionLoading] = useState<string | null>(null);

  // Revision & Exam Session Reminders Suite States
  const [activeStudyTab, setActiveStudyTab] = useState<'countdown' | 'flashcards'>('countdown');
  const [selectedFlashcardSubject, setSelectedFlashcardSubject] = useState<'physics' | 'chemistry' | 'biology' | 'cs'>('physics');
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);
  const [isCardFlipped, setIsCardFlipped] = useState<boolean>(false);
  const [masteredCards, setMasteredCards] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('nc_mastered_cards');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [customExamGoal, setCustomExamGoal] = useState<string>(() => {
    return localStorage.getItem('nc_custom_exam_goal') || 'Aiming for 5 A-grades in GCE A-Level! 🎯';
  });
  const [isEditingGoal, setIsEditingGoal] = useState<boolean>(false);

  const handleToggleMastery = (cardId: string) => {
    setMasteredCards(prev => {
      const isMastered = prev.includes(cardId);
      let next: string[];
      if (isMastered) {
        next = prev.filter(id => id !== cardId);
      } else {
        next = [...prev, cardId];
        // Trigger a beautiful audio cue
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();
          osc.connect(gainNode);
          gainNode.connect(audioCtx.destination);
          osc.type = 'sine';
          osc.frequency.setValueAtTime(880, audioCtx.currentTime);
          osc.frequency.setValueAtTime(1318.51, audioCtx.currentTime + 0.1);
          gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.4);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.45);
        } catch {}
      }
      localStorage.setItem('nc_mastered_cards', JSON.stringify(next));
      return next;
    });
  };

  const handleSaveExamGoal = (val: string) => {
    setCustomExamGoal(val);
    localStorage.setItem('nc_custom_exam_goal', val);
    setIsEditingGoal(false);
  };

  // --- NC.EDU ELITE LEARNING LOOPS ENGINE ---
  const loadDailyObjectives = async () => {
    if (!userData) return;
    setObjectivesLoading(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      if (userData.objectivesDate === todayStr && userData.dailyObjectives && userData.dailyObjectives.length > 0) {
        setDailyObjectives(userData.dailyObjectives);
      } else {
        const generated = await fetchDailyObjectives(userData.latestSubject || "Mathematics");
        setDailyObjectives(generated);
        const uid = auth.currentUser?.uid;
        if (uid) {
          const userRef = doc(db, 'users', uid);
          await updateDoc(userRef, {
            dailyObjectives: generated,
            objectivesDate: todayStr
          });
        }
      }
    } catch (err) {
      console.error("Error loading daily objectives:", err);
      const fallbacks = [
        { id: 1, text: `Review 5 structural topics in ${userData.latestSubject || "Mathematics"}`, points: 10, completed: false },
        { id: 2, text: "Tackle an interactive syllabus revision challenge", points: 12, completed: false },
        { id: 3, text: "Engage in a multi-turn chat with the AI Academic Tutor", points: 8, completed: false }
      ];
      setDailyObjectives(fallbacks);
    } finally {
      setObjectivesLoading(false);
    }
  };

  const handleToggleObjective = async (id: number) => {
    const updated = dailyObjectives.map(obj => {
      if (obj.id === id) {
        return { ...obj, completed: !obj.completed };
      }
      return obj;
    });
    setDailyObjectives(updated);

    const objective = dailyObjectives.find(obj => obj.id === id);
    let pointsAwarded = 0;
    if (objective) {
      pointsAwarded = !objective.completed ? (objective.points || 10) : -(objective.points || 10);
    }

    try {
      const uid = auth.currentUser?.uid;
      if (uid) {
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, {
          dailyObjectives: updated,
          points: Math.max(0, (userData.points || 0) + pointsAwarded)
        });
      }
    } catch (err) {
      console.error("Error updating completed objective in DB:", err);
    }
  };

  const initDailyReevaluation = async () => {
    if (!userData) return;
    setReevalLoading(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      if (userData.reevalDate === todayStr && userData.reevalMessage) {
        setReevalMessage(userData.reevalMessage);
        setReevalQuestion(userData.reevalQuestion || userData.reevalMessage);
        setReevalFeedback(userData.reevalFeedback || '');
        setReevalScore(userData.reevalScore !== undefined && userData.reevalScore !== -1 ? userData.reevalScore : null);
      } else {
        const testHistory = userData.testHistory || [];
        const msg = await fetchDailyReevaluationMessage(testHistory, userData.latestSubject || "General Academic Prep");
        setReevalMessage(msg);
        setReevalQuestion(msg);
        setReevalFeedback('');
        setReevalScore(null);
        
        const uid = auth.currentUser?.uid;
        if (uid) {
          const userRef = doc(db, 'users', uid);
          await updateDoc(userRef, {
            reevalMessage: msg,
            reevalQuestion: msg,
            reevalFeedback: '',
            reevalScore: -1,
            reevalDate: todayStr
          });
        }
      }
    } catch (err) {
      console.error("Error generating daily reevaluation:", err);
      const fallbackMsg = "Hello! I have analyzed your recent academic profile. To boost your scores, please solve this question: If a singular matrix A = [[x, 4], [3, x - 1]] has determinant zero, what are the values of x?";
      setReevalMessage(fallbackMsg);
      setReevalQuestion("If a singular matrix A = [[x, 4], [3, x - 1]] has determinant zero, what are the values of x?");
    } finally {
      setReevalLoading(false);
    }
  };

  const handleSubmitReevaluation = async () => {
    if (!reevalInput.trim() || reevalSubmitting) return;
    setReevalSubmitting(true);
    try {
      const res = await submitDailyReevaluationAnswer(reevalQuestion, reevalInput);
      setReevalFeedback(res.feedback);
      setReevalScore(res.score);

      const bonusPoints = res.score >= 60 ? 15 : 5;
      const newPoints = Math.max(0, (userData.points || 0) + bonusPoints);

      const uid = auth.currentUser?.uid;
      if (uid) {
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, {
          reevalFeedback: res.feedback,
          reevalScore: res.score,
          points: newPoints,
          testHistory: [
            ...(userData.testHistory || []),
            {
              id: `reeval-${Date.now()}`,
              subject: userData.latestSubject || "General Re-evaluation",
              topic: "AI Re-evaluation",
              score: res.score,
              timestamp: new Date().toISOString()
            }
          ]
        });
      }
    } catch (err) {
      console.error("Error submitting reevaluation answer:", err);
    } finally {
      setReevalSubmitting(false);
    }
  };

  useEffect(() => {
    if (userData) {
      loadDailyObjectives();
      initDailyReevaluation();
    }
  }, [userData?.latestSubject]);


  useEffect(() => {
    if (!auth.currentUser) return;
    const q = collection(db, 'dual_challenges');
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      const myId = auth.currentUser?.uid;
      const filtered = list.filter(c => c.challengerId === myId || c.challengedId === myId);
      setMyChallenges(filtered);

      const active = filtered.find(c => {
        const isUserChallenger = c.challengerId === myId;
        const hasUserSubmitted = isUserChallenger ? c.challengerSubmitted : c.challengedSubmitted;
        return c.status === 'active' && !hasUserSubmitted;
      });
      setActiveChallenge(active || null);
    });
    return () => unsub();
  }, [auth.currentUser]);

  const handleAcceptChallenge = async (ch: any) => {
    if (!auth.currentUser) return;
    setChallengeActionLoading(ch.id);
    try {
      const guarantee = ch.challengedGuarantee !== undefined ? ch.challengedGuarantee : ch.pointsGuarantee;

      // 1. Check if I have enough points
      const myDocRef = doc(db, 'users', auth.currentUser.uid);
      const mySnap = await getDoc(myDocRef);
      let myCurrentPoints = 0;
      if (mySnap.exists()) {
        myCurrentPoints = mySnap.data().points || 0;
      } else if (userData?.points) {
        myCurrentPoints = userData.points;
      }

      if (myCurrentPoints < guarantee) {
        alert(`Insufficient points! You need at least ${guarantee.toFixed(2)} points to accept this challenge, but your balance is ${myCurrentPoints.toFixed(2)}.`);
        return;
      }

      // 2. Deduct guarantee points from my account
      const updatedPoints = Math.max(0, myCurrentPoints - guarantee);
      await updateDoc(myDocRef, { points: updatedPoints });
      await updateDoc(doc(db, 'test_scores', auth.currentUser.uid), { score: updatedPoints });

      // 3. Mark challenge as active
      await updateDoc(doc(db, 'dual_challenges', ch.id), {
        status: 'active',
        challengedDeposited: true,
        startedAt: new Date()
      });

      alert("⚔️ CHALLENGE ACCEPTED! Escrow deposit completed. Preparing battlefield...");
    } catch (err: any) {
      console.error("Error accepting challenge", err);
      alert(`Error accepting challenge: ${err.message}`);
    } finally {
      setChallengeActionLoading(null);
    }
  };

  const handleDeclineChallenge = async (ch: any) => {
    setChallengeActionLoading(ch.id);
    try {
      const guarantee = ch.challengerGuarantee !== undefined ? ch.challengerGuarantee : ch.pointsGuarantee;

      // Refund the challenger's escrowed deposit immediately
      const challengerDocRef = doc(db, 'users', ch.challengerId);
      const challengerSnap = await getDoc(challengerDocRef);
      let challengerPoints = 0;
      if (challengerSnap.exists()) {
        challengerPoints = challengerSnap.data().points || 0;
      }
      const refundedPoints = challengerPoints + guarantee;

      await updateDoc(challengerDocRef, { points: refundedPoints });
      await updateDoc(doc(db, 'test_scores', ch.challengerId), { score: refundedPoints });

      // Mark challenge as declined
      await updateDoc(doc(db, 'dual_challenges', ch.id), {
        status: 'declined'
      });

      alert("Challenge declined. Deposited points have been fully refunded to the challenger.");
    } catch (err: any) {
      console.error("Error declining challenge", err);
      alert(`Error declining challenge: ${err.message}`);
    } finally {
      setChallengeActionLoading(null);
    }
  };

  const handleAcknowledgeDeclined = async (chId: string) => {
    try {
      await updateDoc(doc(db, 'dual_challenges', chId), {
        notifiedDeclined: true
      });
    } catch (err) {
      console.error("Error acknowledging declined challenge:", err);
    }
  };

  useEffect(() => {
    localStorage.setItem('nc_personal_notes', personalNotes);
  }, [personalNotes]);

  const speakNotes = (textToSpeak: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      alert("Speech Synthesis is not supported in this browser!");
      return;
    }
    
    if (isSpeakingNotes) {
      window.speechSynthesis.cancel();
      setIsSpeakingNotes(false);
      return;
    }

    window.speechSynthesis.cancel();

    // Clean text of markdown
    const clean = textToSpeak
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/#+\s+([^\n]+)/g, '$1')
      .replace(/-\s+/g, '')
      .replace(/`([^`]+)`/g, '$1')
      .trim();

    const utterance = new SpeechSynthesisUtterance(clean);

    // Look for standard high quality English or French voice
    const voices = window.speechSynthesis.getVoices();
    let preferredVoice = voices.find(v => {
      const name = v.name.toLowerCase();
      const lang = v.lang.toLowerCase();
      return lang.startsWith('en') && (name.includes('google') || name.includes('natural'));
    }) || voices.find(v => v.lang.startsWith('en'));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.pitch = 1.0; 
    utterance.rate = 1.0;

    utterance.onstart = () => setIsSpeakingNotes(true);
    utterance.onend = () => setIsSpeakingNotes(false);
    utterance.onerror = () => setIsSpeakingNotes(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeakingNotes = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeakingNotes(false);
  };

  const toggleDataSaver = () => {
    const next = !dataSaver;
    setDataSaver(next);
    localStorage.setItem('nc_data_saver', String(next));
  };

  const handleSaveToVault = (topic: string, content: string) => {
    const existing = [...localVaultGuides];
    if (existing.some((g: any) => g.topic === topic)) {
      alert("INFO: This revision guide is already cached in your local vault!");
      return;
    }
    const updated = [
      ...existing,
      {
        topic,
        subject: userData?.latestSubject || 'General Science',
        date: new Date().toLocaleDateString(),
        content
      }
    ];
    setLocalVaultGuides(updated);
    localStorage.setItem('nc_offline_guides', JSON.stringify(updated));
    alert("SUCCESS: Revision Guide successfully cached offline! You can access it anytime instantly even with no mobile network data.");
  };

  const clearVaultItem = (topicToClear: string) => {
    const updated = localVaultGuides.filter((g: any) => g.topic !== topicToClear);
    setLocalVaultGuides(updated);
    localStorage.setItem('nc_offline_guides', JSON.stringify(updated));
  };

  const handleGenerateStudyGuide = async (weakArea: string) => {
    // If they have recommended topics, restrict to recommended topics ONLY
    const recs = userData?.latestRecommendedTopics || [];
    if (recs.length > 0) {
      const isRecommended = recs.some((t: string) => t.toLowerCase().trim() === weakArea.toLowerCase().trim());
      if (!isRecommended) {
        alert("🔒 Access Restricted: You can ONLY have / access notes on your recommended topics list. Please focus on your recommended topics!");
        return;
      }
    }

    setActiveStudyGuideTopic(weakArea);
    setIsGeneratingGuide(true);
    setStudyGuideContent('');
    setGuideError('');
    try {
      await generateStudyNotes(
        userData?.latestSubject || 'General Science',
        weakArea,
        (chunk) => {
          setStudyGuideContent((prev) => prev + chunk);
        }
      );
    } catch (e: any) {
      console.error(e);
      setGuideError('Could not generate learning materials. Please try again!');
    } finally {
      setIsGeneratingGuide(false);
    }
  };

  const handleToggleTopicCompletion = (topic: string) => {
    alert("🔒 Action Restricted!\n\nYou cannot tick or untick recommended topics manually. To master a topic and check it off, please click '✍️ take test now' next to it, take the evaluation challenge, and pass with a score greater than 10/20 (> 50%)! Once passed, it will automatically check off in your system panel!");
  };

  // 7-day trial expired flow states
  const [trialExpText, setTrialExpText] = useState('');
  const [trialSugText, setTrialSugText] = useState('');
  const [isSubmittingTrialFeedback, setIsSubmittingTrialFeedback] = useState(false);
  const [trialSuccessMsg, setTrialSuccessMsg] = useState('');
  const [simulateExpired, setSimulateExpired] = useState(false);

  const isTrialExpired = () => {
    // If they have subscriptionEndsAt active in future, they are NOT expired (they are active paid premium)
    if (userData?.subscriptionEndsAt) {
      const endMs = userData.subscriptionEndsAt.seconds 
        ? userData.subscriptionEndsAt.seconds * 1000 
        : new Date(userData.subscriptionEndsAt).getTime();
      if (Date.now() < endMs) return false;
    }

    if (userData?.trialStartedAt) {
      const startTime = userData.trialStartedAt.seconds 
        ? userData.trialStartedAt.seconds * 1000 
        : new Date(userData.trialStartedAt).getTime();
      const duration = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
      if ((Date.now() - startTime) >= duration) return true;
    }

    if (userData?.trialEndsAt) {
      const endMs = userData.trialEndsAt.seconds 
        ? userData.trialEndsAt.seconds * 1000 
        : new Date(userData.trialEndsAt).getTime();
      if (Date.now() >= endMs) return true;
    }

    return false;
  };

  const isPremium = () => {
    if (!userData) return false;
    
    // Check subscription active first
    if (userData.subscriptionEndsAt) {
      const endMs = userData.subscriptionEndsAt.seconds 
        ? userData.subscriptionEndsAt.seconds * 1000 
        : new Date(userData.subscriptionEndsAt).getTime();
      if (Date.now() < endMs) return true;
      return false; // Subscription expired
    }

    // Check if free trial is active (only once, within 7 days)
    if (userData.trialStartedAt) {
      const startMs = userData.trialStartedAt.seconds 
        ? userData.trialStartedAt.seconds * 1000 
        : new Date(userData.trialStartedAt).getTime();
      const duration = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
      if (Date.now() - startMs < duration) return true;
      return false; // Trial expired
    }

    if (userData.trialEndsAt) {
      const endMs = userData.trialEndsAt.seconds
        ? userData.trialEndsAt.seconds * 1000
        : new Date(userData.trialEndsAt).getTime();
      if (Date.now() < endMs) return true;
      return false; // Trial expired
    }

    return false;
  };

  const isSubscriptionExpired = () => {
    if (userData?.subscriptionEndsAt) {
      const endMs = userData.subscriptionEndsAt.seconds 
        ? userData.subscriptionEndsAt.seconds * 1000 
        : new Date(userData.subscriptionEndsAt).getTime();
      return Date.now() >= endMs;
    }
    return false;
  };

  useEffect(() => {
    const checkExpiration = async () => {
      const studentId = auth.currentUser?.uid;
      if (!studentId || !userData) return;

      const subExpired = isSubscriptionExpired();
      const trialExpired = isTrialExpired();

      if (subExpired || trialExpired) {
        if (userData.hasPaid || !userData.expirationMessageSent) {
          try {
            await updateDoc(doc(db, 'users', studentId), {
              hasPaid: false,
              expirationMessageSent: true
            });

            await addDoc(collection(db, 'admin_student_messages'), {
              studentId: studentId,
              studentEmail: auth.currentUser?.email || userData.email || '',
              sender: 'admin',
              text: trialExpired
                ? "Your 7-day free trial period has finished. Access to premium features and yellow crown status have been locked. Please re-subscribe or upgrade to a plan to regain access!"
                : "Your premium functionalities have been blocked because your subscription time is up. Please re-subscribe for a new period of time to regain access to all premium features!",
              createdAt: { seconds: Math.floor(Date.now() / 1000) }
            });

            triggerChatNotification(
              trialExpired ? "Trial Expired" : "Subscription Expired",
              trialExpired
                ? "Your 7-day free trial has expired. Premium features and yellow crown status have been locked."
                : "Your subscription time is up. Premium features have been locked.",
              "System",
              "admin"
            );
          } catch (e) {
            console.error("Error setting subscription/trial expiration:", e);
          }
        }
      }
    };
    checkExpiration();
  }, [userData]);

  useEffect(() => {
    // Automatically trigger onboarding if they are not already premium and haven't active/opted-in to the trial and haven't dismissed it
    if (!isPremium() && !userData?.trialStartedAt && !hasDismissedOnboarding) {
      const timer = setTimeout(() => {
        setIsPremiumOnboardingOpen(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [userData?.trialStartedAt, userData?.hasPaid, userData?.subscriptionEndsAt, hasDismissedOnboarding]);

  // Admin student chat states
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const studentId = auth.currentUser?.uid;
    if (!studentId) return;

    const unsub = onSnapshot(collection(db, 'admin_student_messages'), (snap) => {
      const data = snap.docs
        .map(d => ({ id: d.id, ...d.data() as any }))
        .filter(m => m.studentId === studentId)
        .sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));

      if (adminMsgsInitialLoaded.current) {
        snap.docChanges().forEach(change => {
          if (change.type === 'added') {
            const msg = change.doc.data() as any;
            if (msg.studentId === studentId && msg.sender === 'admin') {
              triggerChatNotification(
                language === 'FRENCH' 
                  ? "Nouveau message de l'administrateur" 
                  : language === 'CHINESE' 
                  ? "来自管理员的新消息" 
                  : language === 'SPANISH' 
                  ? "Nuevo mensaje del administrador" 
                  : "New message from Administrator",
                msg.text || "",
                "Admin",
                "admin"
              );
            }
          }
        });
      } else {
        adminMsgsInitialLoaded.current = true;
      }

      setMessages(data);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    const studentId = auth.currentUser?.uid;
    if (!studentId) return;

    const unsubTx = onSnapshot(collection(db, 'campay_transactions'), (snap) => {
      const list = snap.docs
        .map((doc) => ({ id: doc.id, ...doc.data() as any }))
        .filter((t: any) => t.userId === studentId)
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setMomoTransactions(list);
    });

    return () => unsubTx();
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const studentId = auth.currentUser?.uid;
    if (!newMessage.trim() || !studentId) return;

    setIsSending(true);
    const msgText = newMessage.trim();
    setNewMessage('');

    try {
      await addDoc(collection(db, 'admin_student_messages'), {
        studentId: studentId,
        studentEmail: auth.currentUser?.email || userData?.email || '',
        studentName: userData?.fullName || userData?.name || auth.currentUser?.displayName || 'Student',
        sender: 'student',
        text: msgText,
        createdAt: { seconds: Math.floor(Date.now() / 1000) },
        openedByAdmin: false
      });
    } catch (err) {
      console.error("Error sending reply to admin:", err);
    } finally {
      setIsSending(false);
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) return;
    setIsSubmittingFeedback(true);
    setFeedbackSuccess('');
    try {
      if (auth.currentUser) {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          comment: feedback.trim()
        });
        setFeedbackSuccess(
          language === 'FRENCH' 
            ? 'Votre commentaire a été envoyé avec succès !' 
            : language === 'CHINESE' 
            ? '您的反馈意见已成功提交给管理员！' 
            : language === 'SPANISH' 
            ? '¡Comentario enviado con éxito al administrador!' 
            : 'Comment submitted successfully to administrators!'
        );
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const handleTrialFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const studentId = auth.currentUser?.uid;
    if (!trialExpText.trim() || !trialSugText.trim() || !studentId) return;

    setIsSubmittingTrialFeedback(true);
    setTrialSuccessMsg('');

    try {
      const formattedText = `📝 [7-DAY TRIAL EXPERIENCE FEEDBACK]\n\n• EXPERIENCE:\n${trialExpText.trim()}\n\n• SUGGESTIONS & IMPROVEMENTS:\n${trialSugText.trim()}`;
      
      // Save to chat history
      await addDoc(collection(db, 'admin_student_messages'), {
        studentId: studentId,
        studentEmail: auth.currentUser?.email || userData?.email || '',
        studentName: userData?.fullName || userData?.name || auth.currentUser?.displayName || 'Student',
        sender: 'student',
        text: formattedText,
        createdAt: { seconds: Math.floor(Date.now() / 1000) },
        openedByAdmin: false
      });

      // Keep user doc comment updated
      await updateDoc(doc(db, 'users', studentId), {
        comment: trialExpText.trim(),
        trialSuggestions: trialSugText.trim(),
        trialFeedbackSubmitted: true
      });

      setTrialSuccessMsg('Thank you so much! Your experience feedback and suggestions have been sent directly to the Admin support chat. The administrators will get in touch with you shortly here!');
      setTrialExpText('');
      setTrialSugText('');
    } catch (err) {
      console.error("Error submitting trial feedback:", err);
    } finally {
      setIsSubmittingTrialFeedback(false);
    }
  };

  const handleResetTrialTimer = async () => {
    alert("Notice: As per NC.edu policy, the 7-day free trial can only be activated ONCE per student account. You can still navigate your student portal and access free features!");
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && auth.currentUser) {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        try {
          await updateDoc(doc(db, 'users', auth.currentUser!.uid), {
            photoUrl: base64
          });
          setPhotoUrl(base64);
        } catch (err) {
          console.error(err);
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const testimonials = LOCALIZED_TESTIMONIALS[language] || LOCALIZED_TESTIMONIALS.ENGLISH;

  if (activeChallenge) {
    return (
      <DualChallengeScreen 
        challenge={activeChallenge} 
        user={auth.currentUser} 
        onClose={() => setActiveChallenge(null)} 
      />
    );
  }

  const incomingPendingChallenge = myChallenges.find(
    ch => ch.status === 'pending' && ch.challengedId === auth.currentUser?.uid
  );

  const declinedNotification = myChallenges.find(
    ch => ch.status === 'declined' && ch.challengerId === auth.currentUser?.uid && ch.notifiedDeclined !== true
  );

  return (
    <div id="student-dashboard" className="min-h-screen bg-[#f5efff] font-sans pb-12 transition-colors duration-300 relative overflow-hidden">
      
      {/* Real-time Intrusive Challenge Modal Notification */}
      <AnimatePresence>
        {incomingPendingChallenge && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-[2rem] border-4 border-rose-500 shadow-2xl max-w-md w-full overflow-hidden"
            >
              {/* Header banner */}
              <div className="bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 p-6 text-white text-center relative overflow-hidden">
                <span className="text-4xl block mb-2 animate-bounce">⚔️</span>
                <h3 className="text-xs font-black uppercase tracking-widest text-rose-100">Incoming Battle Challenge!</h3>
                <p className="text-lg font-extrabold mt-1">High-Stakes Scientific Dual</p>
              </div>

              <div className="p-6 space-y-5">
                <p className="text-xs text-slate-700 font-medium leading-relaxed text-center">
                  Student <span className="font-mono text-purple-950 font-black px-1.5 py-0.5 bg-purple-50 rounded-md border border-purple-100">{incomingPendingChallenge.challengerPlayerId}</span> has challenged you to an elite, 30-minute dual science battle of 30 MCQs!
                </p>

                {/* Matchup Details */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider text-center">ESCROW MATCH CONTRACT</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 bg-white rounded-xl border border-slate-100">
                      <span className="text-[9px] text-slate-400 uppercase font-bold block">Their Deposit</span>
                      <span className="font-mono text-xs font-black text-indigo-600">
                        {(incomingPendingChallenge.challengerGuarantee !== undefined ? incomingPendingChallenge.challengerGuarantee : incomingPendingChallenge.pointsGuarantee).toFixed(2)} PTS
                      </span>
                    </div>
                    <div className="text-center p-3 bg-white rounded-xl border border-rose-100">
                      <span className="text-[9px] text-rose-500 uppercase font-bold block">Your Deposit</span>
                      <span className="font-mono text-xs font-black text-rose-600">
                        {(incomingPendingChallenge.challengedGuarantee !== undefined ? incomingPendingChallenge.challengedGuarantee : incomingPendingChallenge.pointsGuarantee).toFixed(2)} PTS
                      </span>
                    </div>
                  </div>
                </div>

                {/* Warning/Disclaimer */}
                <div className="p-3 bg-amber-50/60 border border-amber-100 rounded-xl flex gap-2.5 text-amber-900">
                  <span className="text-base">⏳</span>
                  <p className="text-[10px] leading-relaxed font-semibold">
                    By accepting, your required points are instantly locked in escrow. BOTH of you will be redirected immediately to the live assessment room! The winner takes the entire pool!
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <button
                    onClick={() => handleAcceptChallenge(incomingPendingChallenge)}
                    disabled={challengeActionLoading === incomingPendingChallenge.id}
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-rose-600 to-amber-500 hover:opacity-95 text-white text-[10px] font-black uppercase tracking-wider rounded-xl shadow-lg active:scale-95 disabled:opacity-50 cursor-pointer transition-all text-center"
                  >
                    {challengeActionLoading === incomingPendingChallenge.id ? "Accepting..." : "Accept & Enter Battle"}
                  </button>
                  <button
                    onClick={() => handleDeclineChallenge(incomingPendingChallenge)}
                    disabled={challengeActionLoading === incomingPendingChallenge.id}
                    className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-wider rounded-xl active:scale-95 disabled:opacity-50 cursor-pointer transition-all text-center"
                  >
                    Decline
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Real-time Challenge Declined Notification for Challenger */}
      <AnimatePresence>
        {declinedNotification && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-[2rem] border-4 border-slate-300 shadow-2xl max-w-md w-full overflow-hidden"
            >
              <div className="bg-slate-100 p-6 text-center border-b border-slate-200">
                <span className="text-4xl block mb-2">🛡️</span>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">Challenge Canceled</h3>
                <p className="text-xs text-slate-500 mt-1">Your opponent has declined the dual</p>
              </div>

              <div className="p-6 space-y-4 text-center">
                <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                  Student <strong className="font-mono text-slate-900">{declinedNotification.challengedPlayerId}</strong> declined your dual science battle.
                </p>
                <div className="py-2.5 px-4 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-800 text-xs font-bold font-mono">
                  +{(declinedNotification.challengerGuarantee !== undefined ? declinedNotification.challengerGuarantee : declinedNotification.pointsGuarantee).toFixed(2)} PTS Refunded to Your Balance
                </div>
                <button
                  onClick={() => handleAcknowledgeDeclined(declinedNotification.id)}
                  className="w-full py-3 px-6 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black uppercase tracking-wider rounded-xl active:scale-95 cursor-pointer transition-all"
                >
                  Dismiss & Continue
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Small Gold Indicator on the left side of the portal */}
      {isPremium() && (
        <div className="fixed left-0 top-1/2 -translate-y-1/2 z-50 select-none pl-1 pointer-events-none" id="portal-gold-indicator">
          <div className="w-1.5 h-6 rounded-full bg-[#f1c40f] shadow-[0_0_8px_#f1c40f,0_0_15px_#f39c12] border border-[#f39c12]/45" title="Gold Premium Status" />
        </div>
      )}

      {/* Header */}
      <header className="bg-[#2f47b3] text-white py-6 px-8 shadow-lg flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          {onBackToHome && (
            <button
              onClick={onBackToHome}
              className="flex items-center justify-center gap-2 px-3.5 py-2 bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded-xl transition-all border border-white/20 cursor-pointer shadow-md shrink-0 mr-1 group/back font-mono"
              title="Return to Home"
              aria-label="Return to Home"
            >
              <span className="font-black text-sm text-[#f1c40f]">&lt;=</span>
              <span className="text-[10px] font-sans font-black uppercase tracking-wider">Home</span>
            </button>
          )}
          {isPremium() && (
            <div className="w-2.5 h-2.5 rounded-full bg-[#f1c40f] shadow-[0_0_8px_#f1c40f] shrink-0 border border-yellow-300" title="Gold Premium Active" id="header-gold-indicator" />
          )}
          <div className="relative group">
            <div className="w-12 h-12 rounded-2xl overflow-hidden bg-white/20 border-2 border-white/30 flex items-center justify-center shrink-0 shadow-inner">
              {photoUrl ? (
                <img src={photoUrl} alt="Student" className="w-full h-full object-cover" />
              ) : (
                <User className="w-6 h-6" />
              )}
            </div>
            <label className="absolute -bottom-1 -right-1 p-1 bg-white text-[#2f47b3] rounded-lg shadow-lg cursor-pointer transform scale-0 group-hover:scale-100 transition-transform">
              <Camera className="w-3 h-3" />
              <input type="file" hidden accept="image/*" onChange={handlePhotoUpload} />
            </label>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-xl font-bold font-display tracking-tight">NC.edu <span className="font-light opacity-80">{TRANSLATIONS[language].studentPortal}</span></h1>
          </div>
        </div>
        
        <div className="flex items-center gap-4 relative">
          {/* Main Hamburger Menu Button (three horizontal lines aligned downward to each other) */}
          <button
            onClick={() => setIsNavMenuOpen(!isNavMenuOpen)}
            className="p-3 bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded-full transition-all border border-white/15 cursor-pointer shadow-sm flex items-center justify-center gap-1.5 z-50"
            title="Menu"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5 stroke-[2.5]" />
          </button>

          {/* AnimatePresence for smooth overlay dropdown transition */}
          <AnimatePresence>
            {isNavMenuOpen && (
              <>
                {/* Click outside backdrop */}
                <div 
                  className="fixed inset-0 bg-slate-950/30 backdrop-blur-xs z-40 cursor-default" 
                  onClick={() => setIsNavMenuOpen(false)} 
                />

                {/* Floating Navigation Menu Drawer/Card */}
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute right-0 top-14 bg-slate-900 border border-slate-800 text-white rounded-3xl p-5 shadow-2xl z-50 w-76 space-y-4 font-sans text-left"
                >
                  {/* Title / User profile header */}
                  <div className="border-b border-slate-800 pb-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl overflow-hidden bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                      {photoUrl ? (
                        <img src={photoUrl} alt="Student" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-black truncate text-slate-100">{userData?.fullName || userData?.name || 'Student'}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{TRANSLATIONS[language].studentPortal}</p>
                    </div>
                  </div>

                  {/* Portal Options Section */}
                  <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 px-3 pb-1">Academic Options</p>
                    
                    {/* Dashboard Tab */}
                    <button
                      onClick={() => {
                        setDashboardTab('home');
                        setIsNavMenuOpen(false);
                      }}
                      className={`w-full px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-3 cursor-pointer ${
                        dashboardTab === 'home'
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10 font-black'
                          : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                      }`}
                    >
                      <LayoutDashboard className="w-4 h-4 shrink-0" />
                      <span>Student Dashboard</span>
                    </button>

                    {/* Learning Growth Tab */}
                    <button
                      onClick={() => {
                        setDashboardTab('growth');
                        setIsNavMenuOpen(false);
                      }}
                      className={`w-full px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-3 cursor-pointer ${
                        dashboardTab === 'growth'
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10 font-black'
                          : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                      }`}
                    >
                      <TrendingUp className="w-4 h-4 shrink-0" />
                      <span>
                        {language === 'FRENCH' ? 'Ma Croissance' : language === 'CHINESE' ? '学习成长' : language === 'SPANISH' ? 'Mi Crecimiento' : 'Learning Growth'}
                      </span>
                    </button>

                    {/* Chat Hub Tab */}
                    <button
                      onClick={() => {
                        setDashboardTab('chat');
                        setIsNavMenuOpen(false);
                      }}
                      className={`w-full px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-3 cursor-pointer ${
                        dashboardTab === 'chat'
                          ? 'bg-purple-600 text-white shadow-md shadow-purple-600/10 font-black'
                          : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                      }`}
                    >
                      <MessageSquare className="w-4 h-4 shrink-0" />
                      <span>Chat & Study Groups</span>
                    </button>

                    {/* Practicals Lab Tab */}
                    <button
                      onClick={() => {
                        setDashboardTab('practicals');
                        setIsNavMenuOpen(false);
                      }}
                      className={`w-full px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-3 cursor-pointer ${
                        dashboardTab === 'practicals'
                          ? 'bg-pink-600 text-white shadow-md shadow-pink-600/10 font-black'
                          : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                      }`}
                    >
                      <TestTube className="w-4 h-4 shrink-0" />
                      <span className="flex-1 text-left">Practicals Lab</span>
                      {!isPremium() && <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />}
                    </button>

                    {/* Community Feed */}
                    <button
                      onClick={() => {
                        setIsCommunityOpen(true);
                        setIsNavMenuOpen(false);
                      }}
                      className="w-full px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-3 cursor-pointer text-slate-300 hover:bg-slate-800/60 hover:text-white"
                    >
                      <Users className="w-4 h-4 shrink-0 text-cyan-400" />
                      <span>{TRANSLATIONS[language].community}</span>
                    </button>
                  </div>

                  {/* System & Global Options */}
                  <div className="border-t border-slate-800 pt-3 space-y-2">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 px-3 pb-1">System & Settings</p>

                    {/* Language Switcher inside menu */}
                    <div className="px-2.5 py-2 bg-slate-950/45 rounded-xl border border-slate-800/50 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-bold uppercase tracking-wide">
                        <Globe className="w-3 h-3 text-sky-400" />
                        <span>Language: {language}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1">
                        {(['ENGLISH', 'FRENCH', 'CHINESE', 'SPANISH'] as Language[]).map((lang) => (
                          <button
                            key={lang}
                            onClick={() => setLanguage(lang)}
                            className={`px-1 py-1 text-center rounded-md text-[8px] font-black tracking-wider transition-colors cursor-pointer ${
                              language === lang
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                            }`}
                          >
                            {lang === 'ENGLISH' && '🇺🇸 EN'}
                            {lang === 'FRENCH' && '🇫🇷 FR'}
                            {lang === 'CHINESE' && '🇨🇳 ZH'}
                            {lang === 'SPANISH' && '🇪🇸 ES'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Return to home page */}
                    {onBackToHome && (
                      <button
                        onClick={() => {
                          onBackToHome();
                          setIsNavMenuOpen(false);
                        }}
                        className="w-full px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-3 cursor-pointer text-slate-300 hover:bg-slate-800/60 hover:text-white"
                      >
                        <BookOpen className="w-4 h-4 shrink-0 text-amber-400" />
                        <span>Return to home page</span>
                      </button>
                    )}

                    {/* Sign Out */}
                    <button
                      onClick={() => {
                        signOut(auth);
                        setIsNavMenuOpen(false);
                      }}
                      className="w-full px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-3 cursor-pointer text-rose-400 hover:bg-rose-950/20 hover:text-rose-300 border border-transparent hover:border-rose-900/30"
                    >
                      <LogOut className="w-4 h-4 shrink-0" />
                      <span>{TRANSLATIONS[language].signOut}</span>
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 lg:p-10">
        <AnimatePresence mode="wait">
          {(isTrialExpired() || simulateExpired) ? (
            /* ========================================================
               TRIAL EXPIRED SCREEN: Direct feedback & admin support chat
               ======================================================== */
            <motion.div
              key="expired"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="mb-10 text-center md:text-left">
                <h1 className="text-4xl font-extrabold text-indigo-900 font-display mb-2">7-Day Free Trial Finished ⏳</h1>
                <p className="text-slate-500 font-bold tracking-tight">Your 7-day trial period has completed. Please drop your experience and suggestions inside the admin chat below to restore your portal access!</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 font-sans">
              {/* Left: Feedback & Suggestions Card */}
              <div className="lg:col-span-5 bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-blue-900/5 p-8 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 shadow-xs">
                      <Sparkles className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Drop Your Experience</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Instant Admin Forwarding</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-550 leading-relaxed mb-6 font-semibold">
                    We'd love to hear from you! Please answer this brief questionnaire about how you experienced your 7 days of trial. Your responses are directly posted to the administrator's dashboard support room, and they can respond to you live right here.
                  </p>

                  {trialSuccessMsg ? (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 mb-6 text-emerald-800 text-xs font-bold leading-relaxed shadow-sm">
                      {trialSuccessMsg}
                    </div>
                  ) : (
                    <form onSubmit={handleTrialFeedbackSubmit} className="space-y-4">
                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">How was your 7-day experience?</label>
                        <textarea
                          value={trialExpText}
                          onChange={(e) => setTrialExpText(e.target.value)}
                          placeholder="Tell us what you liked about NC.edu during the trial!"
                          required
                          rows={3}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 hover:bg-white focus:bg-white rounded-xl p-3 text-xs font-bold outline-none transition-all placeholder:text-slate-400"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">What could we improve / suggest?</label>
                        <textarea
                          value={trialSugText}
                          onChange={(e) => setTrialSugText(e.target.value)}
                          placeholder="What features or tools would you suggest we add?"
                          required
                          rows={3}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 hover:bg-white focus:bg-white rounded-xl p-3 text-xs font-bold outline-none transition-all placeholder:text-slate-400"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmittingTrialFeedback || !trialExpText.trim() || !trialSugText.trim()}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-[0.98] cursor-pointer disabled:bg-slate-100 disabled:text-slate-400"
                      >
                        {isSubmittingTrialFeedback ? 'Submitting Responses...' : 'Send to Admin Chat 🚀'}
                      </button>
                    </form>
                  )}
                </div>

                {/* Sandbox / Debug Controls */}
                <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col gap-2">
                  <span className="text-[9px] font-black text-indigo-900 uppercase bg-indigo-50 px-2.5 py-1 rounded-md inline-block self-start">Grader Debug Tool</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleResetTrialTimer}
                      className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-[9px] uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                    >
                      🔄 Reset Timer (Go Active)
                    </button>
                    {simulateExpired && (
                      <button
                        type="button"
                        onClick={() => setSimulateExpired(false)}
                        className="px-3 py-2.5 bg-slate-150 hover:bg-slate-200 text-slate-700 font-black text-[9px] uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                      >
                        Deactivate Test
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Live Chat Window */}
              <div className="lg:col-span-7 bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-blue-900/5 flex flex-col justify-between overflow-hidden h-[540px]">
                {/* Chat header */}
                <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                      🛡️ Admin Live Support Chat
                    </h4>
                  </div>
                  <span className="text-[9px] text-[#800080] font-black tracking-wider uppercase bg-purple-50 px-2 py-0.5 rounded-md">
                    Online
                  </span>
                </div>

                {/* Chat list */}
                <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/20 custom-scrollbar">
                  {messages.length === 0 ? (
                    <div className="text-center py-12 bg-indigo-50/30 rounded-2xl border border-indigo-100/30 p-5">
                      <span className="text-[10px] font-black text-indigo-900 uppercase">
                        Conversation Channel Ready
                      </span>
                      <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-2 p-2">
                        You can send live messages or support questions directly to our administrators using the input box below.
                      </p>
                    </div>
                  ) : (
                    messages.map((m, mIdx) => {
                      const isMe = m.sender === 'student';
                      return (
                        <div key={`std-msg-${m.id || mIdx}-${mIdx}`} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] rounded-2xl p-4 text-xs font-bold leading-relaxed shadow-xs whitespace-pre-wrap ${
                            isMe 
                              ? 'bg-[#800080] text-white rounded-tr-none' 
                              : 'bg-indigo-50 text-slate-800 border border-indigo-100 rounded-tl-none'
                          }`}>
                            <div className="flex items-center gap-1.5 mb-1 select-none">
                              <span className={`text-[8px] font-black uppercase ${isMe ? 'text-purple-200' : 'text-indigo-600'}`}>
                                {isMe ? 'You' : 'ADMIN'}
                              </span>
                            </div>
                            <p>{m.text}</p>
                            <span className={`text-[8px] mt-1 text-right block font-normal opacity-70`}>
                              {m.createdAt?.seconds 
                                ? new Date(m.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                : 'Just Now'}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Input form */}
                <form onSubmit={handleSendMessage} className="p-3 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
                  <input 
                    type="text" 
                    placeholder="Type a message to administration..."
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    className="flex-1 bg-white border border-slate-200 focus:border-[#800080] rounded-xl px-4 py-2.5 text-xs font-bold outline-none transition-all placeholder:text-slate-400"
                  />
                  <button
                    type="submit"
                    disabled={isSending || !newMessage.trim()}
                    className="p-2.5 bg-[#800080] hover:bg-slate-900 text-white rounded-xl transition-all disabled:opacity-50 disabled:bg-slate-100 disabled:text-slate-400 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
          ) : dashboardTab === 'growth' ? (
            <motion.div
              key="growth"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            >
              <LearningGrowthSection userData={userData} language={language} />
            </motion.div>
          ) : dashboardTab === 'chat' ? (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            >
              <StudentChatHub userData={userData} language={language} />
            </motion.div>
          ) : dashboardTab === 'practicals' ? (
            <motion.div
              key="practicals"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            >
              <PracticalsSection 
                isPremium={isPremium()} 
                onTriggerUpgrade={() => setIsPremiumOnboardingOpen(true)} 
                language={language}
              />
            </motion.div>
          ) : (
            /* ========================================================
               NORMAL STUDENT DASHBOARD SECTIONS
               ======================================================== */
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="w-full"
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full"
              >
                <div className="mb-10 text-center md:text-left">
              <h1 className="text-4xl font-extrabold text-[#2f47b3] font-display mb-2">{TRANSLATIONS[language].studentDashboardTitle}</h1>
              <p className="text-slate-500 font-medium tracking-tight">{TRANSLATIONS[language].studentDashboardDesc}</p>
            </div>

        {/* Welcome Block */}
        <ThreeDCard depth={4} glareOpacity={0.15} className="mb-10 w-full bg-white border border-slate-100">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 md:p-10 rounded-[2.5rem] relative overflow-hidden"
          >
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <LayoutDashboard className="w-32 h-32 text-[#2f47b3]" />
          </div>
          <h2 className="text-3xl font-bold text-slate-800 mb-2 font-display">{TRANSLATIONS[language].welcomeStudent} 👋</h2>
          <p className="text-slate-500 max-w-2xl leading-relaxed mb-6">
            {TRANSLATIONS[language].welcomeStudentDesc}
          </p>

          <div className="flex flex-wrap items-center gap-4 mb-8">
            <div className="bg-blue-50 border border-blue-100 rounded-2xl px-5 py-3 flex items-center gap-3">
              <span className="w-1.5 h-8 bg-blue-650 rounded-full" />
              <div>
                <span className="text-[9px] text-[#2f47b3] font-black uppercase tracking-wider block">Student Access Card</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono font-black text-slate-800">{userData?.studentId || 'STU-9403'}</span>
                  {isPremium() && (
                    <Crown 
                      className="w-4 h-4 text-amber-500 fill-amber-400 drop-shadow-[0_0_4px_rgba(245,158,11,0.55)] animate-bounce" 
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-3 flex items-center gap-3">
              <span className="w-1.5 h-8 bg-emerald-600 rounded-full" />
              <div>
                <span className="text-[9px] text-emerald-700 font-black uppercase tracking-wider block">Daily MCQs & Structural Points</span>
                <span className="text-xs font-mono font-black text-[#10b981]">
                  {userData?.points !== undefined ? (Math.round(userData.points * 100) / 100) : '0.00'} Points
                </span>
              </div>
            </div>
            
            {userData?.trialEndsAt && (
              <div className="bg-amber-50 border border-amber-100 rounded-2xl px-5 py-3 flex items-center gap-3">
                <span className="w-1.5 h-8 bg-amber-500 rounded-full" />
                <div>
                  <span className="text-[9px] text-amber-700 font-black uppercase tracking-wider block">7-Day Free Trial</span>
                  <span className="text-xs font-mono font-black text-amber-700">
                    {new Date(userData.trialEndsAt.seconds ? userData.trialEndsAt.seconds * 1000 : userData.trialEndsAt) > new Date() ? 'ACTIVE' : 'EXPIRED'}
                  </span>
                </div>
              </div>
            )}


          </div>
        </motion.div>
      </ThreeDCard>

          {/* Premium Gold Class Hub Card */}
          <ThreeDCard depth={5} glareOpacity={0.25} className="mb-8 w-full bg-gradient-to-r from-amber-500/5 via-purple-500/5 to-indigo-500/5 border border-amber-500/20 rounded-[2rem]">
            <div className="p-6 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <Sparkles className="w-24 h-24 text-amber-500" />
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-amber-400 hover:bg-amber-500 rounded-2xl flex items-center justify-center text-slate-900 shrink-0 shadow-md">
                <Star className="w-6 h-6 fill-slate-900 animate-pulse" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  NC.edu Gold Premium Pass
                  {isPremium() ? (
                    <span className="bg-emerald-100 text-emerald-850 text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border border-emerald-200">
                      Active Plus ✨
                    </span>
                  ) : (
                    <span className="bg-slate-100 text-slate-550 text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border border-slate-200">
                      Inactive
                    </span>
                  )}
                </h3>
                <p className="text-slate-500 text-xs mt-1 leading-relaxed max-w-xl font-semibold">
                  {isPremium() 
                    ? "Congratulations! You have complete Gold Premium benefits enabled. You bypass all document scan and tutor conversation limits with pristine academic challenge priorities."
                    : "Upgrade your account to NC.edu Gold Class to unlock unlimited document scans, bypass question constraints, Cloned Voice calibration, and 24/7 prioritized academic solvers!"}
                </p>
                
                {/* If they are on the trial */}
                {isPremium() && !userData?.hasPaid && (
                  <p className="text-amber-700 text-[10px] font-bold mt-2">
                    💡 You are currently using your complimentary 7-Day Free Trial! You can choose a permanent subscription plan to prevent interruption after trial ends.
                  </p>
                )}
              </div>
            </div>
            <div className="shrink-0 font-sans">
              <button
                type="button"
                onClick={() => onAction('upgrade')}
                className="px-6 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-750 text-slate-950 hover:text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" /> 
                {isPremium() ? "Explore Plans" : "Upgrade to Premium"}
              </button>
            </div>
          </div>
        </ThreeDCard>

          {/* ========================================================
             NC.EDU INTERACTIVE STUDY, ACTIVE RECALL & REVISION HUB
             ======================================================== */}
          <ThreeDCard depth={4} className="mb-10 w-full bg-white border border-slate-100 rounded-[2.5rem]">
            <div className="p-8 md:p-10">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-slate-100 pb-6 mb-8 gap-4">
                <div>
                  <h3 className="text-2xl font-black text-slate-800 font-display flex items-center gap-2">
                    NC.edu Exam Session Reminders & Study Hub <Sparkles className="w-5 h-5 text-amber-500 fill-amber-400" />
                  </h3>
                  <p className="text-slate-400 text-xs font-bold mt-1 uppercase tracking-wider">
                    Official Cameroon Syllabus Revision, Countdowns & Session Reminders
                  </p>
                </div>

                {/* Tab select Buttons */}
                <div className="flex flex-wrap items-center bg-slate-50 p-1.5 border border-slate-150 rounded-2xl gap-1">
                  <button
                    type="button"
                    onClick={() => setActiveStudyTab('countdown')}
                    className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                      activeStudyTab === 'countdown'
                        ? 'bg-[#2f47b3] text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Calendar className="w-4 h-4" /> Exam Session Reminders
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveStudyTab('flashcards')}
                    className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                      activeStudyTab === 'flashcards'
                        ? 'bg-[#2f47b3] text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <BookOpen className="w-4 h-4" /> Active Recall Cards
                  </button>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {activeStudyTab === 'countdown' && (
                  <motion.div
                    key="countdown-tab"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="grid grid-cols-1 lg:grid-cols-12 gap-8"
                  >
                    {/* Clocks Column */}
                    <div className="lg:col-span-8 space-y-6">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
                          <Bell className="w-4 h-4 text-[#2f47b3]" /> Official National Exam Session Reminders (Session 2027)
                        </h4>
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                          Live Active Countdown
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* GCE Ordinary & Advanced Levels */}
                        <div className="bg-gradient-to-br from-[#2f47b3]/5 to-[#2f47b3]/10 border border-[#2f47b3]/15 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-black text-[#2f47b3] bg-[#2f47b3]/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider">GCE Board</span>
                              <span className="text-[10px] font-bold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-md">Urgent Prep Phase</span>
                            </div>
                            <h5 className="font-extrabold text-slate-800 text-sm mb-4">GCE Ordinary & Advanced Levels</h5>
                            
                            <div className="grid grid-cols-3 gap-2 text-center mb-4">
                              <div className="bg-white/80 border border-[#2f47b3]/10 rounded-xl p-3 shadow-xs">
                                <span className="text-2xl font-mono font-black text-[#2f47b3] block">{(() => {
                                  const target = new Date('2027-06-01T08:00:00');
                                  const diff = target.getTime() - new Date().getTime();
                                  return diff <= 0 ? 0 : Math.floor(diff / (1000 * 60 * 60 * 24));
                                })()}</span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Days</span>
                              </div>
                              <div className="bg-white/80 border border-[#2f47b3]/10 rounded-xl p-3 shadow-xs">
                                <span className="text-2xl font-mono font-black text-slate-700 block">{(() => {
                                  const target = new Date('2027-06-01T08:00:00');
                                  const diff = target.getTime() - new Date().getTime();
                                  return diff <= 0 ? 0 : Math.floor((diff / (1000 * 60 * 60)) % 24);
                                })()}</span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Hours</span>
                              </div>
                              <div className="bg-white/80 border border-[#2f47b3]/10 rounded-xl p-3 shadow-xs">
                                <span className="text-2xl font-mono font-black text-slate-700 block">{(() => {
                                  const target = new Date('2027-06-01T08:00:00');
                                  const diff = target.getTime() - new Date().getTime();
                                  return diff <= 0 ? 0 : Math.floor((diff / (1000 * 60)) % 60);
                                })()}</span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Mins</span>
                              </div>
                            </div>

                            <div className="bg-white/70 border border-[#2f47b3]/15 rounded-xl p-3 text-[11px] font-semibold text-slate-600 mb-3 leading-relaxed">
                              💡 <strong>Session Reminder:</strong> Written exam begins June 1, 2027. Practical mock experiments are scheduled 3 weeks prior.
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-1">
                              <span>Syllabus Target: 82%</span>
                              <span>Session: June 2027</span>
                            </div>
                            <div className="w-full bg-slate-200/50 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-[#2f47b3] h-full rounded-full" style={{ width: '82%' }}></div>
                            </div>
                          </div>
                        </div>

                        {/* Baccalauréat Camerounais (BAC) */}
                        <div className="bg-gradient-to-br from-purple-500/5 to-purple-500/10 border border-purple-500/15 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-black text-purple-600 bg-purple-100/50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">Office du Bac</span>
                              <span className="text-[10px] font-bold text-purple-700 bg-purple-100/70 px-2 py-0.5 rounded-md">High Priority</span>
                            </div>
                            <h5 className="font-extrabold text-slate-800 text-sm mb-4">Baccalauréat & Probatoire ESG/ESTP</h5>
                            
                            <div className="grid grid-cols-3 gap-2 text-center mb-4">
                              <div className="bg-white/80 border border-purple-500/10 rounded-xl p-3 shadow-xs">
                                <span className="text-2xl font-mono font-black text-purple-600 block">{(() => {
                                  const target = new Date('2027-05-20T08:00:00');
                                  const diff = target.getTime() - new Date().getTime();
                                  return diff <= 0 ? 0 : Math.floor(diff / (1000 * 60 * 60 * 24));
                                })()}</span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Days</span>
                              </div>
                              <div className="bg-white/80 border border-purple-500/10 rounded-xl p-3 shadow-xs">
                                <span className="text-2xl font-mono font-black text-slate-700 block">{(() => {
                                  const target = new Date('2027-05-20T08:00:00');
                                  const diff = target.getTime() - new Date().getTime();
                                  return diff <= 0 ? 0 : Math.floor((diff / (1000 * 60 * 60)) % 24);
                                })()}</span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Hours</span>
                              </div>
                              <div className="bg-white/80 border border-purple-500/10 rounded-xl p-3 shadow-xs">
                                <span className="text-2xl font-mono font-black text-slate-700 block">{(() => {
                                  const target = new Date('2027-05-20T08:00:00');
                                  const diff = target.getTime() - new Date().getTime();
                                  return diff <= 0 ? 0 : Math.floor((diff / (1000 * 60)) % 60);
                                })()}</span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Mins</span>
                              </div>
                            </div>

                            <div className="bg-white/70 border border-purple-500/15 rounded-xl p-3 text-[11px] font-semibold text-slate-600 mb-3 leading-relaxed">
                              💡 <strong>Session Reminder:</strong> Official session opens May 20, 2027. Review series coefficients and intensive problem-solving.
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-1">
                              <span>Syllabus Target: 78%</span>
                              <span>Session: May 2027</span>
                            </div>
                            <div className="w-full bg-slate-200/50 h-1.5 rounded-full mt-2 overflow-hidden">
                              <div className="bg-purple-650 h-full rounded-full" style={{ width: '78%' }}></div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Grandes Ecoles Concours Session reminder */}
                      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-black shrink-0">
                            🏛️
                          </div>
                          <div>
                            <h6 className="text-xs font-black text-slate-800">Grandes Écoles Concours (ENSP / CUSS / ENS / ENAM)</h6>
                            <p className="text-[11px] text-slate-500 font-medium">Competitive entrance exams launch July 2027. Intensive speed drills recommended.</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-mono font-black text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-xl block">
                            {(() => {
                              const target = new Date('2027-07-10T08:00:00');
                              const diff = target.getTime() - new Date().getTime();
                              const days = diff <= 0 ? 0 : Math.floor(diff / (1000 * 60 * 60 * 24));
                              return `${days} Days Left`;
                            })()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Goal & Target Score Column */}
                    <div className="lg:col-span-4 bg-slate-50 border border-slate-150 rounded-3xl p-6 flex flex-col justify-between gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Trophy className="w-5 h-5 text-amber-500 fill-amber-400" />
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">My Session Revision Goal</h4>
                        </div>

                        {isEditingGoal ? (
                          <div className="space-y-3">
                            <textarea
                              id="edit-goal-input"
                              defaultValue={customExamGoal}
                              className="w-full h-24 bg-white border border-slate-250 rounded-xl p-3 text-xs font-bold focus:border-[#2f47b3] outline-none resize-none"
                              placeholder="Describe your target exams outcome..."
                            />
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setIsEditingGoal(false)}
                                className="px-3 py-1.5 bg-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-wider rounded-lg cursor-pointer border-0"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const val = (document.getElementById('edit-goal-input') as HTMLTextAreaElement)?.value;
                                  if (val) handleSaveExamGoal(val);
                                }}
                                className="px-3 py-1.5 bg-[#2f47b3] text-white text-[10px] font-black uppercase tracking-wider rounded-lg cursor-pointer border-0"
                              >
                                Save Goal
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <p className="text-slate-700 font-extrabold text-xs leading-relaxed bg-white border border-slate-150 rounded-2xl p-4 shadow-2xs">
                              "{customExamGoal}"
                            </p>
                            <button
                              type="button"
                              onClick={() => setIsEditingGoal(true)}
                              className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-black uppercase tracking-wider rounded-xl cursor-pointer w-full text-center transition-all border-0"
                            >
                              Edit Target Goal
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="border-t border-slate-200 pt-4 flex items-center gap-3">
                        <Flame className="w-6 h-6 text-orange-500" />
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Daily Active Streak</span>
                          <span className="text-xs font-mono font-black text-slate-800">12 Days Streak Active 🔥</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeStudyTab === 'flashcards' && (
                  <motion.div
                    key="flashcards-tab"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    {/* Subject Filter Row */}
                    <div className="flex flex-wrap items-center gap-2 bg-slate-50 border border-slate-150 p-1.5 rounded-2xl w-max max-w-full">
                      {(['physics', 'chemistry', 'biology', 'cs'] as const).map(subj => {
                        const count = dailyFlashcards.filter(c => c.subject === subj).length;
                        const mastered = dailyFlashcards.filter(c => c.subject === subj && masteredCards.includes(c.id)).length;
                        
                        return (
                          <button
                            key={subj}
                            type="button"
                            onClick={() => {
                              setSelectedFlashcardSubject(subj);
                              setCurrentCardIndex(0);
                              setIsCardFlipped(false);
                            }}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 border-0 ${
                              selectedFlashcardSubject === subj
                                ? 'bg-[#2f47b3] text-white shadow-sm'
                                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                            }`}
                          >
                            <span className="capitalize">{subj === 'cs' ? 'Computer Science' : subj}</span>
                            <span className="text-[9px] bg-white/20 px-2 py-0.5 rounded-full font-mono">{mastered}/{count}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Daily Rotation Notice */}
                    <div className="flex items-start gap-3 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20 text-[#2f47b3] px-5 py-4 rounded-[2rem]">
                      <span className="text-xl shrink-0 mt-0.5">📅</span>
                      <div className="text-xs leading-relaxed">
                        <strong className="font-extrabold uppercase tracking-wider block mb-0.5">Daily Rotation Active</strong>
                        Your GCE/BAC exam revision flashcards rotate every 24 hours (4 cards per subject from our 32-card bank). Master today's active recall challenge to secure maximum memory retention before mock trials!
                      </div>
                    </div>

                    {/* Active Flashcard Canvas */}
                    {(() => {
                      const subjectCards = dailyFlashcards.filter(c => c.subject === selectedFlashcardSubject);
                      const activeCard = subjectCards[currentCardIndex];
                      if (!activeCard) return null;
                      const isMastered = masteredCards.includes(activeCard.id);

                      return (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                          {/* Card Display */}
                          <div className="lg:col-span-8 flex flex-col items-center">
                            <div 
                              onClick={() => setIsCardFlipped(!isCardFlipped)}
                              className={`w-full min-h-[250px] cursor-pointer rounded-[2rem] p-8 flex flex-col justify-between border-2 transition-all relative overflow-hidden select-none shadow-xs hover:shadow-md ${
                                isCardFlipped 
                                  ? 'bg-[#2f47b3] border-[#2f47b3] text-white' 
                                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                                  isCardFlipped ? 'bg-white/20 text-white' : 'bg-indigo-50 text-[#2f47b3]'
                                }`}>
                                  {isCardFlipped ? 'Answer View 💡' : 'Question Prompt ❔'}
                                </span>
                                
                                {isMastered && (
                                  <span className="bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full">
                                    Mastered ✨
                                  </span>
                                )}
                              </div>

                              <div className="my-6 text-center">
                                <h4 className={`text-base md:text-lg font-bold leading-relaxed font-display ${isCardFlipped ? 'text-white' : 'text-slate-800'}`}>
                                  {isCardFlipped ? activeCard.answer : activeCard.question}
                                </h4>
                              </div>

                              <div className="flex items-center justify-between mt-4">
                                <span className={`text-[10px] font-mono font-bold ${isCardFlipped ? 'text-indigo-200' : 'text-slate-400'}`}>
                                  Card {currentCardIndex + 1} of {subjectCards.length}
                                </span>
                                <span className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${
                                  isCardFlipped ? 'text-indigo-100' : 'text-slate-500'
                                }`}>
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Click to Flip Card
                                </span>
                              </div>
                            </div>

                            {/* Evaluation Control panel */}
                            <div className="flex items-center justify-center gap-4 mt-6 w-full">
                              <button
                                type="button"
                                onClick={() => {
                                  if (currentCardIndex > 0) {
                                    setCurrentCardIndex(prev => prev - 1);
                                    setIsCardFlipped(false);
                                  }
                                }}
                                disabled={currentCardIndex === 0}
                                className="px-4 py-2.5 bg-slate-150 disabled:opacity-30 rounded-xl text-xs font-black uppercase text-slate-700 cursor-pointer disabled:cursor-not-allowed border-0"
                              >
                                Previous
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleMastery(activeCard.id);
                                }}
                                className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 border ${
                                  isMastered
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50'
                                }`}
                              >
                                {isMastered ? '✓ Mastered' : 'Mark Mastered'}
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  if (currentCardIndex < subjectCards.length - 1) {
                                    setCurrentCardIndex(prev => prev + 1);
                                    setIsCardFlipped(false);
                                  }
                                }}
                                disabled={currentCardIndex === subjectCards.length - 1}
                                className="px-4 py-2.5 bg-slate-150 disabled:opacity-30 rounded-xl text-xs font-black uppercase text-slate-700 cursor-pointer disabled:cursor-not-allowed border-0"
                              >
                                Next
                              </button>
                            </div>
                          </div>

                          {/* Deck Mastery Stats Sidebar */}
                          <div className="lg:col-span-4 bg-slate-50 border border-slate-150 rounded-3xl p-6 flex flex-col justify-between gap-6">
                            <div className="space-y-4">
                              <h5 className="text-xs font-black uppercase tracking-wider text-slate-400">Deck Mastery Index</h5>
                              
                              {(() => {
                                const masteredCount = subjectCards.filter(c => masteredCards.includes(c.id)).length;
                                const totalCount = subjectCards.length;
                                const pct = totalCount > 0 ? Math.round((masteredCount / totalCount) * 100) : 0;
                                
                                return (
                                  <div className="space-y-3 bg-white border border-slate-150 p-5 rounded-2xl shadow-2xs">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-black text-slate-700 capitalize">{selectedFlashcardSubject === 'cs' ? 'Computer Science' : selectedFlashcardSubject} Progress</span>
                                      <span className="text-xs font-mono font-black text-[#2f47b3]">{pct}%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                      <div className="bg-[#2f47b3] h-full rounded-full transition-all duration-500" style={{ width: `${pct}%` }}></div>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-bold leading-normal">
                                      {pct === 100 
                                        ? "🎉 Excellent! You have achieved 100% mastery in this subject card deck. Check out another deck to solidify your prep!" 
                                        : "Review and evaluate your answers. Challenge yourself to mark all cards as Mastered before mock exam trials."}
                                    </p>
                                  </div>
                                );
                              })()}
                            </div>

                            <div className="border-t border-slate-200 pt-4">
                              <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block mb-1">Study Hint / Exam Clue</span>
                              <p className="text-xs text-slate-600 font-semibold leading-relaxed italic bg-[#2f47b3]/5 border border-[#2f47b3]/10 p-3 rounded-xl">
                                "{activeCard.hint}"
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </ThreeDCard>

          {/* ========================================================
             NC.EDU DAILY LEARNING, CHART & RE-EVALUATION SUITE
             ======================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
            {/* Daily Objectives Card */}
            <ThreeDCard depth={6} glareOpacity={0.15} className="bg-white rounded-[2.5rem] border border-slate-100">
              <div className="p-8 relative overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-650 rounded-xl flex items-center justify-center font-bold">
                    <Target className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-800">Daily Academic Objectives</h3>
                    <p className="text-slate-400 text-[10px] font-bold">Stay disciplined, earn points</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-slate-450">
                  {dailyObjectives.filter(o => o.completed).length}/{dailyObjectives.length} Completed
                </span>
              </div>

              {objectivesLoading ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <Loader2 className="w-6 h-6 text-[#2f47b3] animate-spin" />
                  <span className="text-[10px] text-slate-400 font-bold">Assembling your expert daily objectives...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {dailyObjectives.map((obj, idx) => (
                    <div 
                      key={`objective-${obj.id || idx}-${idx}`}
                      onClick={() => handleToggleObjective(obj.id)}
                      className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                        obj.completed 
                          ? 'bg-emerald-50/50 border-emerald-150 text-slate-500' 
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-150 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                          obj.completed ? 'bg-emerald-500 text-white' : 'border border-slate-300 bg-white'
                        }`}>
                          {obj.completed && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <span className={`text-xs font-bold leading-relaxed ${obj.completed ? 'line-through opacity-70' : ''}`}>
                          {obj.text}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider shrink-0 ${
                        obj.completed ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                      }`}>
                        +{obj.points} PTS
                      </span>
                    </div>
                  ))}
                </div>
              )}
              </div>
            </ThreeDCard>

            {/* Progression Chart Card */}
            <ThreeDCard depth={6} glareOpacity={0.15} className="bg-white rounded-[2.5rem] border border-slate-100 flex flex-col justify-between">
              <div className="p-8 relative overflow-hidden w-full h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-650 rounded-xl flex items-center justify-center font-bold">
                      <TrendingUp className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-800">Academic Progression</h3>
                      <p className="text-slate-400 text-[10px] font-bold">Analyze your latest study trends</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-wider">
                    Live Stats
                  </span>
                </div>
                <p className="text-slate-500 text-xs mb-4">
                  Your calculated grade index shows your continuous improvement path across practice modules and mock simulations.
                </p>
              </div>

              <div className="h-44 w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={
                      userData?.testHistory && userData.testHistory.length > 0
                        ? userData.testHistory.slice(-6).map((h: any, i: number) => ({
                            period: `T-${userData.testHistory.length - i}`,
                            score: h.score || 0
                          }))
                        : [
                            { period: 'Jan', score: 65 },
                            { period: 'Feb', score: 72 },
                            { period: 'Mar', score: 80 },
                            { period: 'Apr', score: 85 },
                            { period: 'May', score: 91 },
                            { period: 'Jun', score: 94 }
                          ]
                    }
                    margin={{ top: 5, right: 10, left: -25, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2f47b3" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#2f47b3" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="period" stroke="#94a3b8" fontSize={10} fontWeight="bold" />
                    <YAxis stroke="#94a3b8" fontSize={10} fontWeight="bold" domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                    />
                    <Area type="monotone" dataKey="score" stroke="#2f47b3" strokeWidth={3} fillOpacity={1} fill="url(#scoreColor)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              </div>
            </ThreeDCard>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
            {/* AI Daily Re-evaluation Companion */}
            <ThreeDCard depth={6} glareOpacity={0.15} className="bg-white rounded-[2.5rem] border border-slate-100 flex flex-col justify-between">
              <div className="p-8 relative overflow-hidden w-full h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500 font-bold">
                      <Sparkles className="w-5 h-5 text-amber-500 fill-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-800">AI Daily Re-evaluation</h3>
                      <p className="text-slate-400 text-[10px] font-bold">Questions tailored to your mock exam answers</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-amber-100 text-[9px] font-black text-amber-700 rounded-full uppercase tracking-wider border border-amber-200">
                    AI GOLD 👑
                  </span>
                </div>

                {!isPremium() ? (
                  /* Paywall advert card */
                  <div className="relative py-6">
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex flex-col items-center justify-center z-10 text-center px-4">
                      <Lock className="w-8 h-8 text-amber-500 mb-2 drop-shadow-[0_2px_8px_rgba(245,158,11,0.2)]" />
                      <h4 className="text-sm font-black text-slate-900 mb-1">Boost Your Grade with AI Re-evaluations</h4>
                      <p className="text-slate-500 text-[10px] max-w-xs font-semibold leading-relaxed mb-4">
                        Our active AI Companion tracks the exam questions you answered, then daily writes to you with bespoke micro-challenges to solidify your comprehension.
                      </p>
                      <button
                        onClick={() => setIsPremiumOnboardingOpen(true)}
                        className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 hover:text-white text-[10px] font-black uppercase tracking-wider rounded-xl cursor-pointer active:scale-95 transition-all shadow-sm"
                      >
                        Unlock Premium Features
                      </button>
                    </div>
                    <div className="opacity-15 blur-xs space-y-2 select-none">
                      <div className="bg-slate-100 h-16 rounded-xl"></div>
                      <div className="bg-slate-100 h-12 rounded-xl"></div>
                    </div>
                  </div>
                ) : reevalLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-2">
                    <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
                    <span className="text-[10px] text-slate-400 font-bold">AI is constructing your personalized daily review questions...</span>
                  </div>
                ) : (
                  <div className="py-2 flex flex-col justify-between h-full">
                    <div className="bg-gradient-to-br from-amber-50/50 to-amber-100/10 border border-amber-100 p-5 rounded-2xl mb-4 relative">
                      <span className="absolute -top-2.5 left-4 bg-amber-500 text-slate-950 px-2.5 py-0.5 rounded-md font-black text-[8px] uppercase tracking-wider shadow-sm">
                        Academic Companion
                      </span>
                      <p className="text-slate-700 text-xs font-bold leading-relaxed whitespace-pre-wrap mt-2">
                        {reevalMessage}
                      </p>
                    </div>

                    {reevalScore !== null && (
                      <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl mb-4 flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-emerald-800">Grader Assessment:</span>
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-black text-[9px] rounded-lg">
                              Score: {reevalScore}/100
                            </span>
                          </div>
                          <p className="text-emerald-700 text-[11px] font-bold mt-1 leading-relaxed">
                            {reevalFeedback}
                          </p>
                        </div>
                      </div>
                    )}

                    {reevalScore === null && (
                      <div className="space-y-3">
                        <textarea
                          rows={3}
                          placeholder="Type your explanation or math calculations here..."
                          value={reevalInput}
                          onChange={(e) => setReevalInput(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 rounded-xl p-3 text-xs font-bold outline-none transition-all placeholder:text-slate-400"
                        />
                        <button
                          onClick={handleSubmitReevaluation}
                          disabled={reevalSubmitting || !reevalInput.trim()}
                          className="w-full py-3 bg-[#2f47b3] hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                        >
                          {reevalSubmitting ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" /> Evaluating Answer...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" /> Submit Re-evaluation Answer
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              </div>
            </ThreeDCard>

          </div>

          {/* Testimonials */}
          <div className="border-t border-slate-100 pt-8">
            <div className="flex items-center gap-2 mb-6">
              <Users className="w-5 h-5 text-[#2f47b3]" />
              <h4 className="font-bold text-slate-700 uppercase tracking-widest text-xs">{TRANSLATIONS[language].studentExperiences}</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((t, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-slate-50 p-6 rounded-2xl border border-slate-100 relative group"
                >
                  <Quote className="absolute top-4 right-4 w-6 h-6 text-slate-200 group-hover:text-blue-100 transition-colors" />
                  <div className="flex items-center gap-3 mb-4">
                    <img 
                      src={t.avatar} 
                      alt={t.name} 
                      className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover" 
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <h5 className="font-bold text-slate-800 text-sm">{t.name}</h5>
                      <p className="text-[10px] text-slate-500 font-medium">{t.role} • {t.origin}</p>
                    </div>
                  </div>
                  <p className="text-slate-600 text-xs leading-relaxed italic">"{t.text}"</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {userData?.latestWeakAreas && userData.latestWeakAreas.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10 bg-gradient-to-br from-[#f5f3ff] via-[#f0f9ff] to-[#fcfcfc] rounded-[2.5rem] p-8 border-2 border-purple-100 shadow-xl shadow-blue-900/5 relative overflow-hidden"
          >
            {/* Background design elements */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-200/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-200/20 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-3">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center text-white shadow-md shadow-purple-600/20 shrink-0">
                  <Compass className="w-6 h-6 animate-spin" style={{ animationDuration: '6s' }} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-purple-100 text-[9px] font-black rounded-lg uppercase tracking-wider text-purple-700 border border-purple-200">
                      Tailored Study Path
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">
                      Based on your latest {userData.latestSubject} test ({userData.latestGrade || 0}/100)
                    </span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-black text-slate-800 font-display mt-1">Recommended Learning Path</h3>
                  <p className="text-slate-500 text-xs mt-0.5">
                    We've analyzed your academic strengths and weak points to compile specific target topics and peer expert matches.
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => onAction('study')}
                className="px-6 py-3 bg-[#2f47b3] hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <BookOpen className="w-4 h-4" /> Take Another Test
              </button>
            </div>

            {/* Dynamic Progress of Recommended Topics */}
            {(() => {
              const recommendedList = userData.latestRecommendedTopics || [];
              const completedList = userData.completedRecommendedTopics || [];
              const completedCount = recommendedList.filter((topic: string) => completedList.includes(topic)).length;
              const totalCount = recommendedList.length;
              const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

              return (
                <div className="mb-6 bg-purple-50/50 border border-purple-100 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex-1 w-full">
                    <div className="flex justify-between text-xs font-black text-slate-700 mb-2">
                      <span className="flex items-center gap-1.5">
                        🏆 Mastery Progress: <span className="text-purple-600 font-mono">{completedCount}/{totalCount} Completed</span>
                      </span>
                      <span className="text-purple-700 font-mono">{progressPercent}%</span>
                    </div>
                    <div className="bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200/50 w-full relative">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        className="bg-gradient-to-r from-emerald-500 to-purple-600 h-full rounded-full" 
                        transition={{ duration: 0.6 }}
                      />
                    </div>
                  </div>
                  <div className="text-left md:text-right shrink-0">
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider rounded-md border border-emerald-200">
                      +1 PTS PER TOPIC
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1">Check off a topic as mastered to claim points!</p>
                  </div>
                </div>
              );
            })()}

            {(() => {
              const latestTestDate = userData?.latestTestDate;
              let daysRemaining = 5;
              let elapsedDays = 0;
              let isPastDeadline = false;
              if (latestTestDate) {
                let testDate: Date;
                if (typeof latestTestDate.toDate === 'function') {
                  testDate = latestTestDate.toDate();
                } else if (latestTestDate && typeof latestTestDate === 'object' && 'seconds' in latestTestDate) {
                  testDate = new Date(latestTestDate.seconds * 1000);
                } else {
                  testDate = new Date(latestTestDate);
                }
                const msDiff = Date.now() - testDate.getTime();
                elapsedDays = Math.floor(msDiff / (1000 * 60 * 60 * 24));
                daysRemaining = Math.max(0, 5 - elapsedDays);
                isPastDeadline = elapsedDays > 5;
              }

              const recommendedList = userData?.latestRecommendedTopics || [];
              const completedList = userData?.completedRecommendedTopics || [];
              const hasGaps = recommendedList.length > 0 && !recommendedList.every((topic: string) => completedList.includes(topic));

              if (!hasGaps) return null;

              return (
                <div className={`mb-6 p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  isPastDeadline 
                    ? 'bg-rose-50 border-rose-200 text-rose-800' 
                    : 'bg-amber-50/70 border-amber-200 text-amber-900'
                }`}>
                  <div className="flex items-start gap-3">
                    <span className="text-xl mt-0.5 shrink-0">{isPastDeadline ? '⚠️' : '⏳'}</span>
                    <div>
                      <p className="text-xs font-black uppercase tracking-wider">
                        {isPastDeadline ? 'Points Deduction Active!' : 'Mastery Deadline Countdown'}
                      </p>
                      <p className="text-[11px] font-medium leading-relaxed mt-0.5">
                        {isPastDeadline ? (
                          <>Your 5-day window expired {elapsedDays - 5} days ago. Since gaps remain, <strong>0.5 points per day are being deducted</strong> (Total deducted: <span className="font-mono font-black">{userData.gapDeductionsApplied || 0} PTS</span>).</>
                        ) : (
                          <>You have <strong>{daysRemaining} days left</strong> to complete all recommended topics. If you do not master them in time, <strong>0.5 points will be deducted per day</strong>!</>
                        )}
                      </p>
                    </div>
                  </div>
                  {!isPastDeadline && (
                    <div className="px-3 py-1.5 bg-amber-100 border border-amber-200 rounded-lg text-xs font-mono font-black shrink-0">
                      {daysRemaining} DAYS LEFT
                    </div>
                  )}
                  {isPastDeadline && (
                    <div className="px-3 py-1.5 bg-rose-100 border border-rose-200 rounded-lg text-xs font-mono font-black text-rose-700 shrink-0 animate-pulse">
                      -{userData.gapDeductionsApplied || 0} PTS PENALTY
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Real-time Dual Challenge Arena Status Indicators */}
            {myChallenges.filter(ch => ch.status === 'pending').map((ch, idx) => {
              const isMeChallenged = ch.challengedId === auth.currentUser?.uid;
              const isPendingAction = challengeActionLoading === ch.id;

              const chGuarantee = ch.challengedGuarantee !== undefined ? ch.challengedGuarantee : ch.pointsGuarantee;
              const chalGuarantee = ch.challengerGuarantee !== undefined ? ch.challengerGuarantee : ch.pointsGuarantee;

              if (isMeChallenged) {
                return (
                  <div key={`incoming-challenge-${ch.id || idx}-${idx}`} className="mb-6 p-5 rounded-[2rem] border-2 border-rose-500 bg-rose-50/70 shadow-lg shadow-rose-950/5 animate-pulse flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl mt-0.5 shrink-0">⚔️</span>
                      <div>
                        <h4 className="text-xs font-black uppercase text-rose-800 tracking-wider">Incoming Science Battle Challenge!</h4>
                        <p className="text-[11px] font-bold text-slate-700 leading-relaxed mt-1">
                          Student <span className="font-mono text-purple-950 font-black">{ch.challengerPlayerId}</span> has challenged you to an elite, 30-minute dual science battle. Under zone matching rules, they have deposited <strong className="text-indigo-600 font-mono">{chalGuarantee.toFixed(2)} PTS</strong> and you must deposit an escrow guarantee of <strong className="text-rose-600 font-mono">{chGuarantee.toFixed(2)} PTS</strong> to enter!
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleAcceptChallenge(ch)}
                        disabled={!!isPendingAction}
                        className="px-4 py-2 bg-gradient-to-r from-rose-600 to-amber-500 text-white text-[10px] font-black uppercase tracking-wider rounded-xl shadow-md hover:opacity-95 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                      >
                        {isPendingAction ? "Accepting..." : `Accept & Deposit ${chGuarantee.toFixed(2)} PTS`}
                      </button>
                      <button
                        onClick={() => handleDeclineChallenge(ch)}
                        disabled={!!isPendingAction}
                        className="px-4 py-2 bg-white border border-rose-200 text-rose-700 text-[10px] font-black uppercase tracking-wider rounded-xl hover:bg-rose-50 transition-colors active:scale-95 disabled:opacity-50 cursor-pointer"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                );
              } else {
                return (
                  <div key={`outgoing-challenge-${ch.id || idx}-${idx}`} className="mb-6 p-5 rounded-[2rem] border border-purple-200 bg-purple-50/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <span className="text-xl mt-0.5 shrink-0">⏳</span>
                      <div>
                        <h4 className="text-xs font-black uppercase text-purple-800 tracking-wider">Outgoing Battle Pending</h4>
                        <p className="text-[11px] font-medium text-slate-600 leading-relaxed mt-1">
                          Waiting for student <span className="font-mono text-purple-950 font-black">{ch.challengedPlayerId}</span> to accept your dual challenge. (Your deposit: <strong className="font-mono text-purple-700">{chalGuarantee.toFixed(2)} PTS</strong>, Opponent match: <strong className="font-mono text-indigo-700">{chGuarantee.toFixed(2)} PTS</strong>). Your deposit is safely secured in escrow.
                        </p>
                      </div>
                    </div>
                    <div className="px-3 py-1.5 bg-white border border-purple-200 rounded-lg text-[9px] font-mono text-purple-700 uppercase font-black tracking-wider shrink-0">
                      Escrow Active
                    </div>
                  </div>
                );
              }
            })}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Weak areas box */}
              <div className="bg-white/80 backdrop-blur-xs p-6 rounded-3xl border border-rose-100 shadow-sm">
                <h4 className="text-xs font-black text-rose-600 uppercase tracking-wider mb-4 flex items-center gap-1.5 border-b border-rose-50 pb-2">
                  <Target className="w-3.5 h-3.5" /> Identified Gaps & Weak Areas
                </h4>
                <div className="flex flex-wrap gap-2">
                  {userData.latestWeakAreas.map((area: string, idx: number) => (
                    <div key={idx} className="w-full flex items-center justify-between bg-rose-50/50 text-rose-700 font-bold text-xs p-3 rounded-xl border border-rose-100">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-rose-500 rounded-full shrink-0 animate-pulse" /> {area}
                      </span>
                      <button
                        onClick={() => handleGenerateStudyGuide(area)}
                        title="Synthesize AI Study Guide"
                        className="p-1 px-2.5 bg-rose-100 hover:bg-rose-200 text-rose-800 font-black text-[9px] uppercase tracking-wider rounded-md transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <BrainCircuit className="w-3 h-3" /> Study Notes
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended topics study schedule */}
              <div className="bg-white/80 backdrop-blur-xs p-6 rounded-3xl border border-purple-100 shadow-sm">
                <h4 className="text-xs font-black text-purple-600 uppercase tracking-wider mb-4 flex items-center gap-1.5 border-b border-purple-50 pb-2">
                  <BookOpen className="w-3.5 h-3.5" /> Recommended Topics & Steps
                </h4>
                <ul className="space-y-3">
                  {userData.latestRecommendedTopics.map((topic: string, idx: number) => {
                    const isCompleted = (userData.completedRecommendedTopics || []).includes(topic);
                    return (
                      <li key={idx} className="flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-100 group">
                        <button
                          type="button"
                          onClick={() => handleToggleTopicCompletion(topic)}
                          className="flex items-start gap-2.5 text-left flex-1 cursor-pointer"
                        >
                          <span className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-all mt-0.5 ${isCompleted ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-500/20' : 'border-slate-300 hover:border-purple-400 bg-white'}`}>
                            {isCompleted && (
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </span>
                          <span className={`text-xs font-bold leading-normal ${isCompleted ? 'text-slate-400 line-through decoration-slate-300' : 'text-slate-700'}`}>
                            {topic}
                          </span>
                        </button>
                        
                        <div className="flex items-center gap-1.5 shrink-0 flex-wrap sm:flex-nowrap">
                          <button
                            onClick={() => handleGenerateStudyGuide(topic)}
                            title="Synthesize AI Study Guide"
                            className="px-2 py-1 text-[9px] font-black uppercase bg-purple-50 text-purple-700 hover:bg-purple-150 rounded-lg flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                          >
                            <BrainCircuit className="w-3 h-3" /> Notes
                          </button>
                          {!isCompleted && (
                            <button
                              onClick={() => onAction('study', userData.latestSubject, topic)}
                              title="Start Target Practice Quiz"
                              className="px-2.5 py-1 text-[9px] font-black uppercase bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg flex items-center gap-1 transition-all active:scale-95 cursor-pointer shadow-xs shrink-0 animate-pulse"
                            >
                              ✍️ take test now
                            </button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Peer tutor recommendations match */}
              <div className="bg-white/80 backdrop-blur-xs p-6 rounded-3xl border border-emerald-100 shadow-sm flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-black text-emerald-600 uppercase tracking-wider mb-2 flex items-center gap-1.5 border-b border-emerald-50 pb-2">
                    <Users className="w-3.5 h-3.5" /> Recommended Peer Tutors
                  </h4>
                  <p className="text-[10px] text-slate-500 leading-normal mb-3">
                    Active student teachers on the platform excel specifically in the subject of <strong>{userData.latestSubject}</strong>.
                  </p>
                </div>
                
                <button
                  onClick={() => onAction('find')}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                >
                  <Users className="w-4 h-4" /> Message {userData.latestSubject} Experts
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ========================================================
           🇨🇲 CAMEROON NATIONAL REVISION COMPANION BENTO
           ======================================================== */}
        <div className="mb-10">
          
          {/* Column 1 & 2: Offline Vault and Local Study Guides */}
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-blue-900/5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center">
                  <span className="text-xl">💾</span>
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Low-overhead Offline Vault</h3>
                  <p className="text-[10px] text-slate-400 font-bold leading-normal">
                    Instantly access cached study materials when cellular data packages are weak.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={toggleDataSaver}
                className={`px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${dataSaver ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 text-slate-500 hover:text-slate-700'}`}
              >
                {dataSaver ? 'Data Saver: ON' : 'Data Saver: OFF'}
              </button>
            </div>

            {dataSaver && (
              <div className="mb-6 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex items-center gap-3 text-xs text-emerald-800 font-bold leading-relaxed">
                <span>⚡</span>
                <p>Data Saver simulation represents low-overhead asset compression protocols conforming to Cameroon MTN & Orange networks.</p>
              </div>
            )}

            {localVaultGuides.length === 0 ? (
              <div className="py-12 text-center space-y-2 border border-dashed border-slate-150 rounded-2xl bg-slate-50/30">
                <p className="text-slate-400 text-xs font-bold font-sans">Your Offline Vault is currently empty.</p>
                <p className="text-slate-400 text-[10px] max-w-sm mx-auto leading-normal font-semibold">
                  When you open any subject's deep study guide, tap <strong>💾 Cache Offline</strong> at the footer to save it here instantly!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {localVaultGuides.map((item, idx) => (
                  <div key={idx} className="p-4 bg-slate-50/50 hover:bg-slate-50 rounded-2xl border border-slate-150 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <span className="px-2 py-0.5 bg-emerald-100 text-[8px] font-black text-emerald-800 rounded-md uppercase tracking-wider">
                        {item.subject}
                      </span>
                      <h4 className="text-xs font-black text-slate-800 mt-1 truncate">{item.topic}</h4>
                      <p className="text-[9px] text-slate-400 mt-0.5">Stored offline on {item.date}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setActiveOfflineGuide(item)}
                        className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-wider rounded-xl cursor-pointer"
                      >
                        Read Offline
                      </button>
                      <button
                        type="button"
                        onClick={() => clearVaultItem(item.topic)}
                        className="p-2 border border-slate-200 text-rose-500 hover:bg-rose-50 rounded-xl cursor-pointer"
                        title="Remove cache"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Offline Vault Reader Drawer Modal */}
        <AnimatePresence>
          {activeOfflineGuide && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setActiveOfflineGuide(null)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
              />
              
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 30 }}
                className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl relative max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden z-10"
              >
                <div className="p-6 bg-emerald-600 text-white flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3 w-4/5">
                    <span className="text-2xl shrink-0">💾</span>
                    <div className="min-w-0">
                      <span className="px-2 py-0.5 bg-emerald-500/50 text-[9px] font-black uppercase tracking-wider rounded-md border border-emerald-400 font-mono font-bold">
                        Offline Cached Lecture
                      </span>
                      <h4 className="text-md font-black font-display leading-tight mt-0.5 truncate">
                        {activeOfflineGuide.topic}
                      </h4>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveOfflineGuide(null)}
                    className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center text-white cursor-pointer shrink-0"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-6 md:p-8 overflow-y-auto flex-1 min-h-0 space-y-4">
                  <div className="markdown-body prose prose-slate max-w-none text-slate-700 text-xs leading-relaxed">
                    <ReactMarkdown>{activeOfflineGuide.content}</ReactMarkdown>
                  </div>
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-4 shrink-0">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                    Instant vault loader • 0% Network overhead
                  </span>
                  <button
                    onClick={() => setActiveOfflineGuide(null)}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl cursor-pointer"
                  >
                    Done Reading
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Generative AI Study Guide Slide-over Drawer / Modal */}
        <AnimatePresence>
          {activeStudyGuideTopic && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setActiveStudyGuideTopic(null)}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
              />
              
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 30 }}
                className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl relative max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden z-10"
              >
                {/* Header aspect */}
                <div className="p-6 md:p-8 bg-gradient-to-r from-purple-600 to-indigo-700 text-white flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3 w-4/5">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white shrink-0">
                      <BrainCircuit className="w-5 h-5 animate-pulse" />
                    </div>
                    <div className="min-w-0">
                      <span className="px-2 py-0.5 bg-purple-500/50 text-[9px] font-black uppercase tracking-wider rounded-md border border-purple-400 font-mono">
                        Live AI Tutor Synth
                      </span>
                      <h4 className="text-md md:text-lg font-black font-display tracking-tight leading-tight mt-0.5 truncate">
                        {activeStudyGuideTopic}
                      </h4>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveStudyGuideTopic(null)}
                    className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center text-white transition-colors cursor-pointer shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Content body layout */}
                <div className="p-6 md:p-8 overflow-y-auto flex-1 min-h-0 space-y-6">
                  {guideError ? (
                    <div className="py-16 text-center">
                      <p className="text-rose-600 font-bold text-sm mb-3">{guideError}</p>
                      <button
                        onClick={() => handleGenerateStudyGuide(activeStudyGuideTopic || '')}
                        className="px-6 py-2.5 bg-purple-600 text-white font-extrabold text-xs rounded-xl cursor-pointer"
                      >
                        Try Again
                      </button>
                    </div>
                  ) : (!studyGuideContent && isGeneratingGuide) ? (
                    <div className="py-20 flex flex-col items-center justify-center text-center gap-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
                        <Loader2 className="w-6 h-6 animate-spin" />
                      </div>
                      <div>
                        <p className="text-slate-800 font-black text-sm">Synthesizing Revision Course Notes...</p>
                        <p className="text-slate-400 text-xs mt-1">Gemini AI is structuring concepts, walk-through tutorials, and memorization aids.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="markdown-body prose prose-slate max-w-none text-slate-700 text-xs leading-relaxed space-y-4">
                      <ReactMarkdown>{studyGuideContent}</ReactMarkdown>
                      {isGeneratingGuide && (
                        <div className="flex items-center gap-2 text-purple-600 font-black font-mono text-[10px] animate-pulse mt-6 pt-4 border-t border-slate-150">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Gemini AI is crafting additional notes...</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer and instant test launcher */}
                <div className="p-6 md:p-8 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
                  <div className="text-left flex-1 col-span-2">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono font-bold">Pro-tip for exams</p>
                    <p className="text-slate-600 text-[11px] font-bold">Save this topic locally so you can study offline later!</p>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto self-end">
                    {studyGuideContent && (
                      <button
                        id="cache-offline-revision-btn"
                        onClick={() => handleSaveToVault(activeStudyGuideTopic || '', studyGuideContent)}
                        className="px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer shrink-0"
                      >
                        💾 Cache Offline
                      </button>
                    )}
                    <button
                      onClick={() => {
                        const topic = activeStudyGuideTopic;
                        setActiveStudyGuideTopic(null);
                        onAction('study', userData.latestSubject, topic || '');
                      }}
                      className="px-6 py-3 bg-[#2f47b3] hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer shrink-0"
                    >
                      <BookOpen className="w-4 h-4" /> Start Custom AI Test
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Major Subject Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <motion.div 
            whileHover={{ y: -8 }}
            className="group bg-white p-8 rounded-[2rem] shadow-lg shadow-blue-900/5 transition-all border border-slate-50 flex flex-col"
          >
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-[#2f47b3] mb-6 group-hover:bg-[#2f47b3] group-hover:text-white transition-colors">
              <BookOpen className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-4 font-display">Peer Tutoring</h3>
            <p className="text-slate-500 mb-8 text-sm leading-relaxed flex-1">Find top performing tutors. Browse and seek assistance in all subjects from mathematics to literature.</p>
            <button 
              onClick={() => onAction('find')}
              className="w-full py-4 bg-[#2f47b3] text-white font-bold rounded-2xl hover:shadow-xl hover:shadow-blue-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              All Subjects <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>

          <motion.div 
            whileHover={{ y: -8 }}
            className="group bg-gradient-to-br from-indigo-50 to-purple-50 p-8 rounded-[2rem] shadow-lg shadow-indigo-900/5 transition-all border-2 border-indigo-100 flex flex-col"
          >
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mb-6 group-hover:bg-slate-900 transition-colors">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-4 font-display">Chat & Study Groups</h3>
            <p className="text-slate-500 mb-8 text-sm leading-relaxed flex-1">Connect with peer students in real-time. Chat 1-on-1, or create and join academic study groups with other peers.</p>
            <button 
              onClick={() => setDashboardTab('chat')}
              className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:shadow-xl hover:shadow-indigo-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              Open Chat Hub <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>

          <motion.div 
            whileHover={{ y: -8 }}
            className="group bg-white p-8 rounded-[2rem] shadow-lg shadow-blue-900/5 transition-all border border-slate-50 flex flex-col"
          >
            <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 mb-6 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <Code className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-4 font-display">Daily Tests & Exams</h3>
            <p className="text-slate-500 mb-8 text-sm leading-relaxed flex-1">Take daily tests generated dynamically. Get graded out of 100 instantly and claim points on your dashboard!</p>
            <button 
              onClick={() => onAction('study')}
              className="w-full py-4 bg-purple-600 text-white font-bold rounded-2xl hover:shadow-xl hover:shadow-purple-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              Open Daily Tests <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>

          <motion.div 
            whileHover={{ y: -8 }}
            className="group bg-white p-8 rounded-[2rem] shadow-lg shadow-blue-900/5 transition-all border border-slate-50 flex flex-col"
          >
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-[#2f47b3] mb-6 group-hover:bg-[#2f47b3] group-hover:text-white transition-colors">
              <TestTube className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-4 font-display">Live Chats</h3>
            <p className="text-slate-500 mb-8 text-sm leading-relaxed flex-1">Ask questions and engage in multi-turn dialogues with our advanced AI pedagogical tutor.</p>
            <button 
              onClick={() => onAction('ask')}
              className="w-full py-4 bg-[#2f47b3] text-white font-bold rounded-2xl hover:shadow-xl hover:shadow-blue-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              Talk with AI <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>

          <motion.div 
            whileHover={{ y: -8 }}
            className="group bg-[#2a1b5c] text-white p-8 rounded-[2rem] shadow-xl shadow-purple-900/10 transition-all border border-purple-850 flex flex-col"
          >
            <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-300 mb-6 group-hover:bg-purple-500 group-hover:text-white transition-colors">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white mb-4 font-display">AI Scan & Solve</h3>
            <p className="text-purple-200/80 mb-8 text-sm leading-relaxed flex-1">Capture or upload equations or complex diagrams. AI parses and generates a complete roadmap explanation.</p>
            <button 
              onClick={() => {
                if (isPremium()) {
                  onAction('scan');
                } else {
                  setIsPremiumOnboardingOpen(true);
                }
              }}
              className="w-full py-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-extrabold rounded-2xl hover:shadow-xl hover:shadow-purple-500/20 transition-all flex items-center justify-center gap-2 border border-purple-400 cursor-pointer"
            >
              Take Snapshot <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>

          <motion.div 
            whileHover={{ y: -8 }}
            className="group bg-gradient-to-br from-amber-500/15 via-pink-500/5 to-purple-600/15 p-8 rounded-[2rem] shadow-xl shadow-amber-950/5 transition-all border-2 border-amber-500/20 flex flex-col relative overflow-hidden"
          >
            <div className="absolute top-2 right-2 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-full shadow-md animate-pulse">
              🏆 PREMIUM PASS
            </div>
            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 mb-6 group-hover:bg-amber-500 group-hover:text-white transition-colors shrink-0">
              <Trophy className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-4 font-display flex items-center gap-2">Tournament Prep</h3>
            <p className="text-slate-500 mb-8 text-sm leading-relaxed flex-1">
              Accelerate high-stakes skill exercises & elite analytical queries to win global student Cash Prizes! 
              Get the possibility to have GCE, BAC, and Concours papers with verified corrections.
            </p>
            <button 
              onClick={() => {
                if (isPremium()) {
                  onAction('prep');
                } else {
                  setIsPremiumOnboardingOpen(true);
                }
              }}
              className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 hover:text-[#fff] font-extrabold rounded-2xl hover:shadow-xl hover:shadow-amber-200 transition-all flex items-center justify-center gap-2 cursor-pointer border border-amber-300"
            >
              Start Coaching <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        </div>

        {/* Global Academic Scoreboard */}
        <div className="mt-12">
          <ScoreboardTable />
        </div>

        {/* Academic Feedback and Chat Console */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8"
        >
          {/* Left: General Academic Update Feedback */}
          <div className="lg:col-span-5 bg-white rounded-[2rem] p-8 md:p-10 border border-slate-100 shadow-xl shadow-blue-900/5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-800">
                    {language === 'FRENCH' ? 'Profil & Rapport Admin' : language === 'CHINESE' ? '意见反馈报告' : language === 'SPANISH' ? 'Buzón de Sugerencias' : 'Spreadsheet Status Comment'}
                  </h3>
                  <p className="text-slate-500 text-[11px] font-medium leading-normal mt-0.5">
                    {language === 'FRENCH' ? 'Inscrivez un résumé de votre statut ou une note visible par l\'admin.' : language === 'CHINESE' ? '在这里写的备注，在管理员的Excel表格中实时显示。' : language === 'SPANISH' ? 'Guarda tu comentario para que aparezca en el spreadsheet del administrador.' : 'Set a persistent status/note visible to the master admin report spreadsheet.'}
                  </p>
                </div>
              </div>

              <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                <div>
                  <textarea
                    value={feedback}
                    onChange={(e) => {
                      setFeedback(e.target.value);
                      setFeedbackSuccess('');
                    }}
                    placeholder={
                      language === 'FRENCH' 
                        ? 'Écrivez votre avis ou question...' 
                        : language === 'CHINESE' 
                        ? '随时修改您想汇报的心得跟计划...' 
                        : language === 'SPANISH' 
                        ? 'Escribe tu nota aquí...' 
                        : 'Your status comment...'
                    }
                    rows={4}
                    className="w-full border border-slate-200 focus:border-purple-500 focus:bg-white bg-slate-50 rounded-2xl p-4 text-sm font-semibold outline-none transition-all placeholder:text-slate-400"
                    required
                  />
                </div>

                {feedbackSuccess && (
                  <div className="text-emerald-700 font-extrabold text-xs bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2.5">
                    {feedbackSuccess}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmittingFeedback || !feedback.trim()}
                  className="px-6 py-2.5 bg-slate-950 hover:bg-slate-800 text-white font-extrabold rounded-xl text-xs transition-all cursor-pointer disabled:bg-slate-100 disabled:text-slate-400"
                >
                  {isSubmittingFeedback 
                    ? (language === 'FRENCH' ? 'Envoi...' : language === 'CHINESE' ? '提交中...' : language === 'SPANISH' ? 'Enviando...' : 'Saving Note...') 
                    : (language === 'FRENCH' ? 'Mettre à jour' : language === 'CHINESE' ? '更新备注' : language === 'SPANISH' ? 'Actualizar Nota' : 'Update Status Comment')}
                </button>
              </form>
            </div>
          </div>

          {/* Right: Real-time Live Admin Chat Support */}
          <div className="lg:col-span-7 bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-blue-900/5 flex flex-col justify-between overflow-hidden h-[420px]">
            {/* Chat header */}
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                  🛡️ {language === 'FRENCH' ? 'Admin Chat en Direct' : language === 'CHINESE' ? '管理员在线聊天' : language === 'SPANISH' ? 'Chat Directo con Dirección' : 'Admin Live Support'}
                </h4>
              </div>
              <span className="text-[9px] text-[#800080] font-black tracking-wider uppercase bg-purple-50 px-2 py-0.5 rounded-md">
                {language === 'FRENCH' ? 'En ligne' : language === 'CHINESE' ? '在线' : language === 'SPANISH' ? 'Conectado' : 'Online'}
              </span>
            </div>

            {/* Chat list */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/20 custom-scrollbar">
              {messages.length === 0 ? (
                <div className="text-center py-10 bg-indigo-50/30 rounded-2xl border border-indigo-100/30 p-4">
                  <span className="text-[10px] font-black text-indigo-900 uppercase">
                    {language === 'FRENCH' ? 'Pas encore de messages' : language === 'CHINESE' ? '暂无消息记录' : language === 'SPANISH' ? 'Sin mensajes aún' : 'No Message History'}
                  </span>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-1">
                    {language === 'FRENCH' ? 'Posez vos questions académiques ou techniques ici. L\'administration vous répondra.' : language === 'CHINESE' ? '需要官方客服，付款协助或投诉，请在下方发送实时消息。管理员可接收并回复您。' : language === 'SPANISH' ? '¿Tienes dudas sobre pagos o soporte académico? Envía un mensaje directo aquí y el administrador te responderá.' : 'Have payment inquiries or need support? Send a direct message here and the administrators will respond.'}
                  </p>
                </div>
              ) : (
                messages.map((m, mIdx) => {
                  const isMe = m.sender === 'student';
                  return (
                    <div key={`std-sysmsg-${m.id || mIdx}-${mIdx}`} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-2xl p-4 text-xs font-bold leading-relaxed shadow-xs ${
                        isMe 
                          ? 'bg-[#800080] text-white rounded-tr-none' 
                          : 'bg-indigo-50 text-slate-800 border border-indigo-100 rounded-tl-none'
                      }`}>
                        <div className="flex items-center gap-1.5 mb-1 select-none">
                          <span className={`text-[8px] font-black uppercase ${isMe ? 'text-purple-200' : 'text-indigo-600'}`}>
                            {isMe ? 'You' : 'ADMIN'}
                          </span>
                        </div>
                        <p>{m.text}</p>
                        <span className={`text-[8px] mt-1 text-right block font-normal opacity-70`}>
                          {m.createdAt?.seconds 
                            ? new Date(m.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : 'Just Now'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Form */}
            <form onSubmit={handleSendMessage} className="p-3 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
              <input 
                type="text" 
                placeholder={
                  language === 'FRENCH' 
                    ? 'Tapez votre message...' 
                    : language === 'CHINESE' 
                    ? '发送消息给管理员...' 
                    : language === 'SPANISH' 
                    ? 'Escribe tu mensaje...' 
                    : 'Type a message to administration...'
                }
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                className="flex-1 bg-white border border-slate-200 focus:border-[#800080] rounded-xl px-4 py-2.5 text-xs font-bold outline-none transition-all placeholder:text-slate-400"
              />
              <button
                type="submit"
                disabled={isSending || !newMessage.trim()}
                className="p-2.5 bg-[#800080] hover:bg-slate-900 text-white rounded-xl transition-all disabled:opacity-50 disabled:bg-slate-100 disabled:text-slate-400 cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </motion.div>
        </motion.div>
        )}
        </AnimatePresence>
      </main>

      {/* Embedded Community & Tournaments Modal */}
      <CommunityModal 
        isOpen={isCommunityOpen} 
        onClose={() => setIsCommunityOpen(false)} 
        language={language} 
        onInitiateVideoCall={onInitiateVideoCall}
      />

      <PremiumOnboardingModal
        isOpen={isPremiumOnboardingOpen}
        onClose={() => {
          setIsPremiumOnboardingOpen(false);
          setHasDismissedOnboarding(true);
        }}
        userData={userData}
        language={language}
        onSubscribeClick={() => {
          onAction('upgrade');
          setHasDismissedOnboarding(true);
        }}
      />

      {/* Real Exam Paper Modal Viewer */}
      <AnimatePresence>
        {selectedRealPaper && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-3xl rounded-[2.5rem] border border-slate-100 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col justify-between"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-900 to-indigo-900 p-6 md:p-8 text-white flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-blue-500/25 border border-blue-400 text-xs font-bold rounded-lg text-blue-200">
                      Official National Exam Repository
                    </span>
                    <span className="text-slate-300 text-xs font-semibold">
                      {selectedRealPaper.year} • {selectedRealPaper.subject}
                    </span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-black mt-2 font-display">{selectedRealPaper.title}</h3>
                </div>
                <button 
                  onClick={() => {
                    setSelectedRealPaper(null);
                    setShowSolutionGated(false);
                  }}
                  className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all cursor-pointer"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Tab Selector */}
              <div className="bg-slate-50 border-b border-slate-150 p-3 flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setPaperModalTab('document')}
                  className={`flex-1 py-3 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    paperModalTab === 'document'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-900/10'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <BookOpen className="w-4 h-4" /> 📄 View Original Exam Document
                </button>
                <button
                  type="button"
                  onClick={() => setPaperModalTab('corrections')}
                  className={`flex-1 py-3 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    paperModalTab === 'corrections'
                      ? 'bg-purple-700 text-white shadow-md shadow-purple-900/10'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" /> 💡 Proposed Corrections
                </button>
              </div>

              {/* Content */}
              <div className="p-6 md:p-8 overflow-y-auto flex-1 space-y-6">
                
                {paperModalTab === 'document' ? (
                  /* TAB 1: ORIGINAL DOCUMENT VIEW */
                  <div className="space-y-6 animate-fadeIn">
                    <div className="bg-blue-50 border border-blue-100 rounded-3xl p-5 flex items-start gap-4">
                      <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center font-black shrink-0">
                        📄
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-blue-900 uppercase tracking-wider">Authentic Sourced Exam Document</h4>
                        <p className="text-blue-850 text-xs font-bold mt-1 leading-relaxed">
                          We have retrieved the actual official exam paper directly from the national curriculum database. You can review the real paper sheet below, or download a local copy.
                        </p>
                      </div>
                    </div>

                    {/* Direct Download/View Button */}
                    <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-[2rem] p-6 text-white flex flex-col md:flex-row items-center justify-between gap-4">
                      <div className="space-y-1">
                        <span className="text-[#800080] text-[9px] font-black uppercase tracking-widest bg-purple-500/20 px-2 py-0.5 rounded-md border border-purple-400/25">
                          Direct Sourced Link
                        </span>
                        <h5 className="font-extrabold text-sm font-display">Download Original Question Paper Sheet</h5>
                        <p className="text-slate-300 text-xs">Access the real PDF on your device to practice offline.</p>
                      </div>

                      <a 
                        href={selectedRealPaper.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={selectedRealPaper.pdfUrl?.startsWith('data:') ? `Exam-Paper-${selectedRealPaper.title.replace(/\s+/g, '-')}.jpg` : undefined}
                        className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg active:scale-95 inline-flex items-center gap-2 shrink-0"
                      >
                        <Download className="w-4 h-4" /> {selectedRealPaper.pdfUrl?.startsWith('data:') ? 'Download Uploaded Sheet Image' : 'Open / Download Real Paper (PDF)'}
                      </a>
                    </div>

                    {/* Embedded Document Preview / Image View */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                          {selectedRealPaper.pdfUrl?.startsWith('data:') ? 'Uploaded Exam Sheet Document' : 'Embedded Document Viewer'}
                        </span>
                        <span className="text-[10px] text-blue-600 font-bold">
                          {selectedRealPaper.pdfUrl?.startsWith('data:') ? 'Uploaded Image Active' : 'PDF Resource Active'}
                        </span>
                      </div>
                      
                      <div className="border border-slate-200 rounded-3xl overflow-hidden bg-slate-50 relative aspect-video min-h-[350px] flex items-center justify-center">
                        {selectedRealPaper.pdfUrl?.startsWith('data:') ? (
                          <div className="w-full h-full overflow-auto flex items-center justify-center p-4 bg-slate-950">
                            <img 
                              src={selectedRealPaper.pdfUrl} 
                              alt="Uploaded Question Paper" 
                              className="max-w-full max-h-[600px] object-contain rounded-2xl shadow-xl border border-white/10" 
                            />
                          </div>
                        ) : (
                          <iframe 
                            src={`https://docs.google.com/gview?url=${encodeURIComponent(selectedRealPaper.pdfUrl)}&embedded=true`} 
                            className="w-full h-full absolute inset-0 border-0" 
                            title="Original National Paper Document Viewer"
                          />
                        )}
                      </div>
                      {!selectedRealPaper.pdfUrl?.startsWith('data:') && (
                        <p className="text-[10px] text-slate-400 text-center font-medium">
                          If the embedded viewer is blank, simply click the "Open / Download Real Paper" button above to view it instantly.
                        </p>
                      )}
                    </div>

                    {/* Highly Professional Educator Advisory Banner */}
                    <div className="bg-amber-50/70 border border-amber-250 rounded-[2rem] p-6 text-center space-y-4">
                      <div className="max-w-md mx-auto space-y-2">
                        <span className="text-[9px] font-black text-amber-800 uppercase tracking-widest bg-amber-100 px-3 py-1 rounded-full">
                          💡 National Examiner Advisory
                        </span>
                        <h4 className="text-sm font-black text-slate-800 mt-2">Compare Your Work with Correct Answers</h4>
                        <p className="text-xs text-slate-600 leading-relaxed font-bold">
                          Finished looking through the questions? We highly advise you to view the detailed step-by-step corrections proposed by our expert educators to master all subject concepts.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setPaperModalTab('corrections')}
                        className="px-8 py-3.5 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 cursor-pointer inline-flex items-center gap-2"
                      >
                        <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" /> Study Proposed Corrections & Solutions
                      </button>
                    </div>
                  </div>
                ) : (
                  /* TAB 2: PROPOSED CORRECTIONS VIEW */
                  <div className="space-y-6 animate-fadeIn">
                    <div className="bg-purple-50 border border-purple-100 rounded-3xl p-5 flex items-start gap-4">
                      <div className="w-12 h-12 bg-purple-100 text-[#800080] rounded-2xl flex items-center justify-center font-black shrink-0">
                        💡
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-[#800080] uppercase tracking-wider">Expert Solution Proposal</h4>
                        <p className="text-slate-700 text-xs font-bold mt-1 leading-relaxed">
                          You are studying the solution suite proposed by expert tutors. We advise checking the clarifications, step-by-step proofs, and syllabus equations to build perfect exam competence.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      {selectedRealPaper.questions.map((q: any, i: number) => (
                        <div key={i} className="border-b border-slate-100 pb-6 last:border-b-0 last:pb-0">
                          <h4 className="text-sm font-extrabold text-slate-800 flex gap-2">
                            <span className="text-[#2f47b3]">Q{i + 1}.</span> {q.text}
                          </h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                            {q.options.map((option: string, oIdx: number) => (
                              <div 
                                key={oIdx} 
                                className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-2.5"
                              >
                                <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 font-black text-[10px] flex items-center justify-center shrink-0">
                                  {String.fromCharCode(65 + oIdx)}
                                </span>
                                <span>{option}</span>
                              </div>
                            ))}
                          </div>

                          {/* Solutions section */}
                          <div className="mt-5">
                            {!showSolutionGated ? (
                              <button
                                onClick={() => {
                                  if (isPremium()) {
                                    setShowSolutionGated(true);
                                  } else {
                                    setIsPremiumOnboardingOpen(true);
                                  }
                                }}
                                className="px-4 py-2 bg-[#2f47b3] hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 transition-all"
                              >
                                <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" /> Reveal Verified Correct Answers & Solutions
                              </button>
                            ) : (
                              <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5"
                              >
                                <div className="flex items-center gap-1.5 text-emerald-800 font-extrabold text-xs mb-2">
                                  <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 fill-emerald-100" /> Correct Option: {q.correctAnswer}
                                </div>
                                <div className="text-emerald-700 text-xs font-bold leading-relaxed whitespace-pre-line border-t border-emerald-100/55 pt-2">
                                  {q.explanation}
                                </div>
                              </motion.div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>

              {/* Footer */}
              <div className="bg-slate-50 p-6 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  onClick={() => {
                    setSelectedRealPaper(null);
                    setShowSolutionGated(false);
                  }}
                  className="px-6 py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer active:scale-95 transition-all"
                >
                  Close Viewer
                </button>
                {!isPremium() && (
                  <button
                    onClick={() => {
                      setSelectedRealPaper(null);
                      setShowSolutionGated(false);
                      setIsPremiumOnboardingOpen(true);
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer active:scale-95 transition-all shadow-md"
                  >
                    Upgrade Now to Premium
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notifications Overlay */}
      <div id="student-chat-notifications" className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 w-full max-w-sm pointer-events-none">
        <AnimatePresence>
          {chatNotifications.map(notif => (
            <motion.div
              key={notif.id}
              layout
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
              className="bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-2xl rounded-2xl p-4 flex gap-3.5 items-start pointer-events-auto select-none overflow-hidden relative group"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#800080] via-indigo-600 to-cyan-500" />
              <div className="p-2 bg-indigo-50 text-[#800080] rounded-xl shrink-0 mt-0.5">
                <Bell className="w-4 h-4 animate-bounce" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-[#800080] uppercase tracking-widest">{notif.title}</span>
                  <button 
                    onClick={() => setChatNotifications(prev => prev.filter(n => n.id !== notif.id))}
                    className="p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600 shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <h4 className="text-xs font-bold text-slate-800 line-clamp-1">From: {notif.sender}</h4>
                <p className="text-xs font-medium text-slate-500 line-clamp-2 leading-relaxed">{notif.text}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
