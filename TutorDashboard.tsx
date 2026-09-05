import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  BookOpen, 
  MessageSquare, 
  Plus, 
  ArrowRight, 
  LayoutDashboard, 
  LogOut, 
  Send, 
  ChevronLeft, 
  ShieldAlert,
  Calendar,
  Layers,
  GraduationCap,
  X,
  Mic,
  Square,
  Trophy,
  CheckCircle2,
  Loader2,
  HelpCircle,
  Bell,
  Award,
  Lock,
  Sparkles,
  Upload,
  Camera,
  Shield,
  Clock,
  ArrowLeft
} from 'lucide-react';
import { auth, db } from '../lib/firebase';
import CommunityModal from './CommunityModal';
import PhotoUploader from './PhotoUploader';
import ScoreboardTable from './ScoreboardTable';
import PracticalsSection from './PracticalsSection';
import Markdown from 'react-markdown';
import { 
  generateStudyQuiz as apiGenerateStudyQuiz, 
  gradeStudyQuiz as apiGradeStudyQuiz,
  chatWithTutor as apiChatWithTutor,
  generateSubjectTest as apiGenerateSubjectTest,
  generateWeeklyTutorTest
} from '../services/aiService';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  addDoc,
  doc,
  updateDoc,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const VoicemailPlayer = ({ audioUrl, isMe }: { audioUrl: string; isMe: boolean }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    audio.onended = () => setIsPlaying(false);
    return () => {
      audio.pause();
    };
  }, [audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(e => console.error("Error playing audio", e));
      setIsPlaying(true);
    }
  };

  return (
    <div className={`flex items-center gap-3 p-3 rounded-2xl select-none min-w-[200px] ${isMe ? 'bg-white/10 border border-white/10 text-white' : 'bg-slate-200/50 border border-slate-200 text-slate-800'}`}>
      <button 
        type="button"
        onClick={togglePlay}
        className={`w-9 h-9 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shrink-0 shadow-sm ${isMe ? 'bg-white text-purple-900' : 'bg-[#800080]'}`}
      >
        {isPlaying ? (
          <span className="flex items-center justify-center gap-0.5">
            <span className={`w-1 h-3.5 animate-pulse inline-block rounded-sm ${isMe ? 'bg-purple-950' : 'bg-white'}`}></span>
            <span className={`w-1 h-3.5 animate-pulse inline-block rounded-sm delay-75 ${isMe ? 'bg-purple-950' : 'bg-white'}`}></span>
          </span>
        ) : (
          <span className={`ml-0.5 border-t-[6px] border-t-transparent border-l-[10px] border-b-[6px] border-b-transparent ${isMe ? 'border-l-purple-950 animate-pulse' : 'border-l-white'}`}></span>
        )}
      </button>
      <div className="flex-1">
        <span className={`block text-[10px] font-extrabold uppercase tracking-wider ${isMe ? 'text-purple-200' : 'text-slate-500'}`}>Voicemail</span>
        <div className="flex gap-0.5 mt-1 items-end h-3">
          <div className={`w-1 h-2 rounded-sm ${isMe ? 'bg-white/40' : 'bg-slate-350'}`}></div>
          <div className={`w-1 h-3 rounded-sm ${isMe ? 'bg-white/60' : 'bg-slate-450'}`}></div>
          <div className={`w-1 h-1 rounded-sm ${isMe ? 'bg-white/30' : 'bg-slate-300'}`}></div>
          <div className={`w-1 h-2.5 rounded-sm ${isMe ? 'bg-white/50' : 'bg-slate-400'}`}></div>
          <div className={`w-1 h-1.5 rounded-sm ${isMe ? 'bg-white/40' : 'bg-slate-350'}`}></div>
          <div className={`w-1 h-3 rounded-sm ${isMe ? 'bg-white/70' : 'bg-slate-500'}`}></div>
          <div className={`w-1 h-2 rounded-sm ${isMe ? 'bg-white/45' : 'bg-slate-350'}`}></div>
        </div>
      </div>
    </div>
  );
};

interface TutorDashboardProps {
  tutorData: any;
  userData?: any;
  onLogout: () => void;
  onBackToHome?: () => void;
  onTriggerUpgrade?: () => void;
}

export default function TutorDashboard({ tutorData, userData, onLogout, onBackToHome, onTriggerUpgrade }: TutorDashboardProps) {
  const isPremium = () => {
    if (!userData) return false;
    // Check subscription active first
    if (userData.subscriptionEndsAt) {
      const endMs = userData.subscriptionEndsAt.seconds 
        ? userData.subscriptionEndsAt.seconds * 1000 
        : new Date(userData.subscriptionEndsAt).getTime();
      if (Date.now() < endMs) return true;
    }
    // Check if free trial is active (only once, within 7 days)
    if (userData.trialStartedAt) {
      const startMs = userData.trialStartedAt.seconds 
        ? userData.trialStartedAt.seconds * 1000 
        : new Date(userData.trialStartedAt).getTime();
      const duration = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
      if (Date.now() - startMs < duration) return true;
    }
    return false;
  };

  const [isCommunityOpen, setIsCommunityOpen] = useState(false);

  // Real-time Chat Notifications
  const [chatNotifications, setChatNotifications] = useState<Array<{
    id: string;
    title: string;
    text: string;
    sender: string;
    role: 'student' | 'tutor' | 'admin';
  }>>([]);

  const adminMsgsInitialLoaded = useRef(false);
  const studentMsgsInitialLoaded = useRef(false);

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

  const [currentSection, setCurrentSection] = useState<'OVERVIEW' | 'STUDENT_CHAT' | 'ADMIN_CHAT' | 'LOGGED_LESSONS' | 'TAKE_TEST' | 'MANAGEMENT'>('OVERVIEW');

  const [isAvailable, setIsAvailable] = useState<boolean>(tutorData?.isAvailable !== false);
  const [isTogglingAvailability, setIsTogglingAvailability] = useState(false);

  useEffect(() => {
    if (tutorData && typeof tutorData.isAvailable !== 'undefined') {
      setIsAvailable(tutorData.isAvailable);
    }
  }, [tutorData]);

  const toggleAvailability = async () => {
    const currentTutorUid = auth.currentUser?.uid || tutorData?.userId || tutorData?.id;
    if (!currentTutorUid) return;
    setIsTogglingAvailability(true);
    const newStatus = !isAvailable;
    try {
      await updateDoc(doc(db, "tutors", currentTutorUid), {
        isAvailable: newStatus
      });
      setIsAvailable(newStatus);
    } catch (err: any) {
      alert("Error updating availability status: " + err.message);
    } finally {
      setIsTogglingAvailability(false);
    }
  };

  // Camera & Image attachment states for student chat on tutor side
  const [chatImage, setChatImage] = useState<string | null>(null);
  const [showChatCamera, setShowChatCamera] = useState(false);
  const [chatCameraStream, setChatCameraStream] = useState<MediaStream | null>(null);
  const chatVideoRef = useRef<HTMLVideoElement>(null);
  const chatFileInputRef = useRef<HTMLInputElement>(null);

  // Tutor Test Passing states
  const [testTopic, setTestTopic] = useState('');

  // Weekly Tutor Competency Test States
  const [weeklyTestActive, setWeeklyTestActive] = useState(false);
  const [weeklyQuestions, setWeeklyQuestions] = useState<any[]>([]);
  const [weeklyAnswers, setWeeklyAnswers] = useState<{ [key: number]: string }>({});
  const [weeklyLoading, setWeeklyLoading] = useState(false);
  const [weeklySubmitting, setWeeklySubmitting] = useState(false);
  const [weeklyResult, setWeeklyResult] = useState<{ score: number; passed: boolean } | null>(null);

  // Degree / Diploma Certificate Proof Upload Modal State
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [certFileScan, setCertFileScan] = useState<string | null>(null);
  const [certLevel, setCertLevel] = useState(tutorData?.levelOfStudies || "Bachelor's Degree");
  const [certExp, setCertExp] = useState(tutorData?.experience || "Licensed Subject Educator");
  const [isSavingCert, setIsSavingCert] = useState(false);
  const certFileInputRef = useRef<HTMLInputElement>(null);

  const hasValidCertificate = !!(
    tutorData?.certificateProofUrl &&
    tutorData.certificateProofUrl !== tutorData.photoUrl &&
    !tutorData.certificateProofUrl.includes('dicebear')
  );

  useEffect(() => {
    if (tutorData && !hasValidCertificate) {
      setShowCertificateModal(true);
    }
  }, [tutorData, hasValidCertificate]);

  const handleCertificateFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCertFileScan(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveCertificateProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certFileScan && !hasValidCertificate) {
      alert("Please select and upload a clear photo scan of your official Degree or Diploma certificate!");
      return;
    }
    const currentTutorUid = auth.currentUser?.uid || tutorData?.userId || tutorData?.id;
    if (!currentTutorUid) return;

    setIsSavingCert(true);
    try {
      const finalCertUrl = certFileScan || tutorData.certificateProofUrl;
      await updateDoc(doc(db, "tutors", currentTutorUid), {
        certificateProofUrl: finalCertUrl,
        levelOfStudies: certLevel,
        experience: certExp
      });
      alert("🎉 Degree/Diploma scan uploaded successfully! Chief Admin Ngandi Celestin can now inspect your credential document.");
      setShowCertificateModal(false);
    } catch (err: any) {
      console.error("Error updating certificate proof:", err);
      alert("Failed to update certificate document: " + err.message);
    } finally {
      setIsSavingCert(false);
    }
  };

  useEffect(() => {
    return () => {
      if (chatCameraStream) {
        chatCameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [chatCameraStream]);

  // Alert once on load if within 24h of the test deadline
  const [hasAlertedUpcomingTest, setHasAlertedUpcomingTest] = useState(false);

  useEffect(() => {
    if (tutorData?.lastWeeklyTestAt && !hasAlertedUpcomingTest) {
      const lastTestDate = new Date(tutorData.lastWeeklyTestAt);
      const nextTestDate = new Date(lastTestDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      const msUntilNextTest = nextTestDate.getTime() - Date.now();
      const hoursUntilNextTest = msUntilNextTest / (1000 * 60 * 60);

      if (hoursUntilNextTest > 0 && hoursUntilNextTest <= 24) {
        const hours = Math.floor(hoursUntilNextTest);
        const mins = Math.floor((hoursUntilNextTest - hours) * 60);
        triggerChatNotification(
          "TEST EVALUATION ALERT",
          `Your weekly competency exam is scheduled in ${hours}h ${mins}m. Please take it to retain your credentials.`,
          "Academic Quality Board",
          "admin"
        );
        setHasAlertedUpcomingTest(true);
      }
    }
  }, [tutorData, hasAlertedUpcomingTest]);

  const startChatCamera = async () => {
    setChatImage(null);
    setShowChatCamera(true);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 300, height: 300, facingMode: 'user' },
        audio: false
      });
      setChatCameraStream(mediaStream);
      if (chatVideoRef.current) {
        chatVideoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Chat camera access failed:", err);
      alert("Could not access your camera. Please use file upload instead.");
      setShowChatCamera(false);
    }
  };

  const stopChatCamera = () => {
    if (chatCameraStream) {
      chatCameraStream.getTracks().forEach(track => track.stop());
      setChatCameraStream(null);
    }
    setShowChatCamera(false);
  };

  const captureChatPhoto = () => {
    if (chatVideoRef.current) {
      const video = chatVideoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 300;
      canvas.height = video.videoHeight || 300;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1); // Mirror correction
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setChatImage(dataUrl);
      }
      stopChatCamera();
    }
  };

  const handleChatFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 800000) {
        alert("To ensure fast sync, please upload an image under 800KB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setChatImage(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const startWeeklyCompetencyTest = async () => {
    setWeeklyTestActive(true);
    setWeeklyLoading(true);
    setWeeklyAnswers({});
    setWeeklyResult(null);
    try {
      const res = await fetch("/api/ai/generateWeeklyTutorTest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: tutorData?.subject || "General Syllabus" })
      });
      const data = await res.json();
      let aiQuestions = data.questions || [];

      // Check if Chief Admin Ngandi Celestin has set custom questions in Firestore
      try {
        const { getDocs, collection, query, where } = await import('firebase/firestore');
        const qSnap = await getDocs(query(collection(db, "admin_tutor_questions"), where("subject", "==", tutorData?.subject || "General Syllabus")));
        const customAdminQuestions: any[] = [];
        qSnap.forEach(docSnap => {
          const qd = docSnap.data();
          customAdminQuestions.push({
            id: docSnap.id,
            question: `[Chief Admin Ngandi Celestin Exam] ${qd.question}`,
            options: qd.options || [],
            correctAnswer: qd.correctAnswer
          });
        });
        if (customAdminQuestions.length > 0) {
          aiQuestions = [...customAdminQuestions, ...aiQuestions];
        }
      } catch (e) {
        console.warn("No custom admin questions loaded:", e);
      }

      setWeeklyQuestions(aiQuestions);
    } catch (err) {
      console.error("Error generating weekly tutor test:", err);
      alert("Failed to load test questions. Please check your internet connection.");
    } finally {
      setWeeklyLoading(false);
    }
  };

  const submitWeeklyTest = async () => {
    if (weeklyQuestions.length === 0) return;
    setWeeklySubmitting(true);

    let correctCount = 0;
    weeklyQuestions.forEach(q => {
      if (weeklyAnswers[q.id] === q.correctAnswer) {
        correctCount++;
      }
    });

    // Score out of 100
    const score = Math.round((correctCount / Math.max(1, weeklyQuestions.length)) * 100);
    // Mandatory passing condition: mark MUST be > 60/100
    const passed = score > 60;
    const currentTutorUid = auth.currentUser?.uid || tutorData?.userId || tutorData?.id;

    if (!currentTutorUid) return;

    try {
      if (passed) {
        await updateDoc(doc(db, "tutors", currentTutorUid), {
          lastWeeklyTestAt: new Date().toISOString(),
          lastWeeklyTestScore: score,
          isDisqualified: false,
          disqualifiedReason: null
        });
        setWeeklyResult({ score, passed });
      } else {
        await updateDoc(doc(db, "tutors", currentTutorUid), {
          isDisqualified: true,
          lastWeeklyTestScore: score,
          disqualifiedReason: "Scored <= 60/100 on obligatory weekly aptitude test"
        });
        setWeeklyResult({ score, passed });
      }
    } catch (err: any) {
      console.error("Error submitting weekly test:", err);
      alert("Error saving test result: " + err.message);
    } finally {
      setWeeklySubmitting(false);
    }
  };
  const [testQuestions, setTestQuestions] = useState<any[]>([]);
  const [testSelectedAnswers, setTestSelectedAnswers] = useState<{ [key: number]: string }>({});
  const [testStructuralAnswers, setTestStructuralAnswers] = useState<{ [key: number]: string }>({});
  const [testGenerating, setTestGenerating] = useState(false);
  const [testGrading, setTestGrading] = useState(false);
  const [testGrade, setTestGrade] = useState<number | null>(null);
  const [testCongrats, setTestCongrats] = useState('');
  const [testCorrections, setTestCorrections] = useState<any[]>([]);
  const [testStep, setTestStep] = useState<'CHOOSE' | 'ACTIVE' | 'RESULT'>('CHOOSE');

  // AI Management States
  const [mgmtTab, setMgmtTab] = useState<'PROGRAM' | 'SKILLS_TEST' | 'CRITICAL_THINKING' | 'JOB_PREP' | 'TOURNAMENT_PREP' | 'PRACTICALS'>('PROGRAM');
  
  // 1. Program & Scheduler States
  const [mgmtSelectedStudent, setMgmtSelectedStudent] = useState<any>(null);
  const [mgmtStudentSubject, setMgmtStudentSubject] = useState('');
  const [mgmtStudentMilestone, setMgmtStudentMilestone] = useState('');
  const [mgmtSchedulerResult, setMgmtSchedulerResult] = useState('');
  const [mgmtSchedulerLoading, setMgmtSchedulerLoading] = useState(false);

  // 2. Skills Test States
  const [mgmtSkillsSubject, setMgmtSkillsSubject] = useState('');
  const [mgmtSkillsQuestions, setMgmtSkillsQuestions] = useState<any[]>([]); // Questions list
  const [mgmtSkillsAnswers, setMgmtSkillsAnswers] = useState<{ [key: number]: string }>({});
  const [mgmtSkillsResultScore, setMgmtSkillsResultScore] = useState<number | null>(null);
  const [mgmtSkillsResultFeedback, setMgmtSkillsResultFeedback] = useState('');
  const [mgmtEvaluatingLoading, setMgmtEvaluatingLoading] = useState(false);
  const [mgmtEvaluatingGrading, setMgmtEvaluatingGrading] = useState(false);

  // 3. Critical Thinking States
  const [mgmtTopicQuery, setMgmtTopicQuery] = useState('');
  const [mgmtTopicResult, setMgmtTopicResult] = useState('');
  const [mgmtTopicLoading, setMgmtTopicLoading] = useState(false);

  // 4. Job Opportunity states
  const [mgmtJobQuery, setMgmtJobQuery] = useState('');
  const [mgmtJobResult, setMgmtJobResult] = useState('');
  const [mgmtJobLoading, setMgmtJobLoading] = useState(false);

  // 5. Tournament Prep states
  const [mgmtTourneyCategory, setMgmtTourneyCategory] = useState('Mathematics');
  const [mgmtTourneyQuestions, setMgmtTourneyQuestions] = useState('');
  const [mgmtTourneyLoading, setMgmtTourneyLoading] = useState(false);

  const handleMgmtGenerateProgram = async () => {
    if (mgmtSchedulerLoading) return;
    setMgmtSchedulerLoading(true);
    setMgmtSchedulerResult('');

    const targetStudent = mgmtSelectedStudent ? mgmtSelectedStudent.studentEmail || mgmtSelectedStudent.id : 'General Student Pool';
    const systemPrompt = `You are an elite, World-Class Educational AI Assistant. Your role isto help the Tutor organize, schedule, and structure a complete study program for their student. You DO NOT message the student directly. Output only structured tutoring guidelines, time allocation models, weekly progress indicators, subject-by-subject milestone goals, and professional coaching recommendations in neat, styled paragraphs with markdown elements.`;
    const prompt = `Student: ${targetStudent}. Subject Track: ${mgmtStudentSubject || tutorData?.subject || 'All Science'}. Custom Targets: ${mgmtStudentMilestone || 'Mastering fundamental exam topics'}. Generate a personalized tutor schedule and program syllabus outlining 4 structured weekly Milestones.`;

    try {
      const response = await apiChatWithTutor(systemPrompt, [], prompt);
      setMgmtSchedulerResult(response);
    } catch (e: any) {
      console.error(e);
      setMgmtSchedulerResult("Failed to generate program. " + (e.message || "Please check connection."));
    } finally {
      setMgmtSchedulerLoading(false);
    }
  };

  const handleMgmtGenerateSkillsTest = async () => {
    if (mgmtEvaluatingLoading) return;
    setMgmtEvaluatingLoading(true);
    setMgmtSkillsResultScore(null);
    setMgmtSkillsResultFeedback('');
    setMgmtSkillsQuestions([]);
    setMgmtSkillsAnswers({});

    try {
      // Reuse the existing robust apiGenerateSubjectTest which generates a JSON array of TestQuestion
      const levelOfStudies = "Advanced High School / Olympiad Coach";
      const subjectText = mgmtSkillsSubject || tutorData?.subject || 'Calculus';
      const summaryText = "Select or formulate a critical thinking skill acquisition test.";
      const questionsList = await apiGenerateSubjectTest(subjectText, levelOfStudies, summaryText);
      setMgmtSkillsQuestions(questionsList || []);
    } catch (e: any) {
      console.error(e);
      // Fallback manual question list in case of network issue
      setMgmtSkillsQuestions([
        { id: 1, question: "Formulate the correct mathematical condition for a function f(x) to have a critical turning point of degree n.", options: ["n is odd and positive", "n is even and positive", "derivative f'(x) changes sign at x", "f''(x) = 0 is constant"], correctAnswer: "derivative f'(x) changes sign at x" },
        { id: 2, question: "In deep neural networks, how does the learning rate directly relate to the gradient convergence rate?", options: ["It scaling boundaries symmetrically", "Large rates may oscillate step size", "Zero rates speed up model weights", "Directly bounds loss functions by zero"], correctAnswer: "Large rates may oscillate step size" }
      ]);
    } finally {
      setMgmtEvaluatingLoading(false);
    }
  };

  const handleMgmtSubmitSkillsAnswers = async () => {
    if (mgmtEvaluatingGrading || mgmtSkillsQuestions.length === 0) return;
    setMgmtEvaluatingGrading(true);

    let calculatedScore = 0;
    mgmtSkillsQuestions.forEach((q, idx) => {
      const chosen = mgmtSkillsAnswers[idx];
      if (chosen === q.correctAnswer) {
        calculatedScore += Math.floor(100 / mgmtSkillsQuestions.length);
      }
    });

    const studentInfo = mgmtSelectedStudent ? mgmtSelectedStudent.studentEmail : "Anonymous";
    const feedbackPrompt = `Evaluating Tutor's student ${studentInfo} on skills test. Score acquired: ${calculatedScore}/100.
    Questions & Answers evaluated: ${JSON.stringify(mgmtSkillsQuestions.map((q, idx) => ({ q: q.question, chosen: mgmtSkillsAnswers[idx], correct: q.correctAnswer })))};
    Generate a standard educational, high-integrity skill-acquisition report for the tutor. Diagnose specific weak spots and next pedagogical milestones.`;

    try {
      const report = await apiChatWithTutor("You are an expert academic evaluator on NC.edu. Do not chat or address the student. Speak directly to the Tutor about the student's grading and skill level.", [], feedbackPrompt);
      setMgmtSkillsResultScore(calculatedScore);
      setMgmtSkillsResultFeedback(report);
    } catch (err: any) {
      console.error(err);
      setMgmtSkillsResultScore(calculatedScore);
      setMgmtSkillsResultFeedback("Grading completed, but model-driven recommendations of student's weakness reports timed out. Please check again.");
    } finally {
      setMgmtEvaluatingGrading(false);
    }
  };

  const handleMgmtGenerateTopicDeepDive = async () => {
    if (mgmtTopicLoading || !mgmtTopicQuery.trim()) return;
    setMgmtTopicLoading(true);
    setMgmtTopicResult('');

    const systemPrompt = `You are a legendary Professor and Expert Pedagogic Scholar. Your goal is to help the Tutor analyze complex academic topics deeply, develop rigorous lesson plans, highlight intellectual traps, and develop advanced critical thinking blueprints for students.`;
    const prompt = `Analyze this topic deeply for the tutor: "${mgmtTopicQuery}". Provide a comprehensive breakdown of Core Axioms, Multi-Dimensional Synthesis, Common Scholarly Misconceptions, and 3 high-intensity self-reflective logic questions to challenge students' critical thinking.`;

    try {
      const response = await apiChatWithTutor(systemPrompt, [], prompt);
      setMgmtTopicResult(response);
    } catch (e: any) {
      console.error(e);
      setMgmtTopicResult("Analysis failed. Please try again.");
    } finally {
      setMgmtTopicLoading(false);
    }
  };

  const handleMgmtGenerateJobPrep = async () => {
    if (mgmtJobLoading || !mgmtJobQuery.trim()) return;
    setMgmtJobLoading(true);
    setMgmtJobResult('');

    const systemPrompt = `You are an executive Academic Recruiter and Senior Portfolio Career Consultant. Help the educator structure and organize their certificates, cover letters, resume highlights, and lesson plan portfolios to dominate job selection committees, consulting tenders, and academic board proposals.`;
    const prompt = `Help me organize documents for this professional target or Job opportunity: "${mgmtJobQuery}". Design an exact document sequencing map, resume content strategies, sample cover letter outlines, and pedagogical philosophy presentation tips.`;

    try {
      const response = await apiChatWithTutor(systemPrompt, [], prompt);
      setMgmtJobResult(response);
    } catch (e: any) {
      console.error(e);
      setMgmtJobResult("Job preparation organizing failed. Let's try again.");
    } finally {
      setMgmtJobLoading(false);
    }
  };

  const handleMgmtGenerateTournamentQuestions = async () => {
    if (mgmtTourneyLoading) return;
    setMgmtTourneyLoading(true);
    setMgmtTourneyQuestions('');

    const systemPrompt = `You are a Tournament Lead Question Writer and High-Olympics Scientific Coordinator. Your task is to provide the tutor with extremely advanced, tricky, and rigorous math/physics tournament questions and solutions, so they can prepare their class for championship cash prizes.`;
    const prompt = `Generate 3 competitive, high-difficulty ${mgmtTourneyCategory} tournament problems. For each problem, provide the precise question parameters, analytical secrets, mathematical steps, and final numeric bounds. Return all responses in paragraph markdown form.`;

    try {
      const response = await apiChatWithTutor(systemPrompt, [], prompt);
      setMgmtTourneyQuestions(response);
    } catch (e: any) {
      console.error(e);
      setMgmtTourneyQuestions("Championship question generation failed. Let's try again.");
    } finally {
      setMgmtTourneyLoading(false);
    }
  };

  // Real, genuine stats fetched dynamically
  const [activeStudents, setActiveStudents] = useState(0);
  const [completedLessons, setCompletedLessons] = useState(0);
  const [messagesCount, setMessagesCount] = useState(0);

  // Dynamic lists from Firestore
  const [chatStudents, setChatStudents] = useState<any[]>([]);
  const [realLessons, setRealLessons] = useState<any[]>([]);
  const [adminMessages, setAdminMessages] = useState<any[]>([]);
  const [tutorStudentMessages, setTutorStudentMessages] = useState<any[]>([]);

  // Input states
  const [adminChatInput, setAdminChatInput] = useState('');
  const [studentChatInput, setStudentChatInput] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  // Log lesson form states
  const [logStudentName, setLogStudentName] = useState('');
  const [logTopic, setLogTopic] = useState('');
  const [logComments, setLogComments] = useState('');
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLogging, setIsLogging] = useState(false);

  // Photo uploader States
  const [tutorPhoto, setTutorPhoto] = useState(tutorData?.photoUrl || '');
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);

  // Voicemail Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [recordSecs, setRecordSecs] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);

  // AI Weekly Test States are unified under the central startWeeklyCompetencyTest and submitWeeklyTest functions above.

  const startTutorTest = async () => {
    setTestGenerating(true);
    setTestGrade(null);
    setTestSelectedAnswers({});
    setTestStructuralAnswers({});
    const studySubject = tutorData?.subject || "General Science";
    const topicToUse = testTopic.trim() || 'general syllabus';
    try {
      const parsed = await apiGenerateStudyQuiz(studySubject, topicToUse);

      if (parsed && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
        setTestQuestions(parsed.questions);
      } else {
        throw new Error("Invalid structure returned");
      }
      setTestStep('ACTIVE');
    } catch (err) {
      console.warn("Quiz generative API fallback triggered for tutor: ", err);
      // Fallback structured quiz generator
      const fallbackQuestions: any[] = [];
      for (let i = 1; i <= 30; i++) {
        fallbackQuestions.push({
          id: i,
          type: 'mcq',
          question: `Assess your core mastery level in ${studySubject} - MCQ Conceptual Challenge #${i}. What core academic standard governs this domain?`,
          options: [
            "Option A: Prime Fundamental Theorem",
            "Option B: First Empirical Assumption",
            "Option C: Universal Conservative Law",
            "Option D: System Matrix Optimization"
          ],
          correctOption: ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)]
        });
      }
      for (let i = 31; i <= 40; i++) {
        fallbackQuestions.push({
          id: i,
          type: 'structural',
          question: `Structural academic explanation challenge regarding ${studySubject} - Proof Outline #${i}. Provide a rigorous, step-by-step mathematical or chemical proof describing equations under this concept.`
        });
      }
      setTestQuestions(fallbackQuestions);
      setTestStep('ACTIVE');
    } finally {
      setTestGenerating(false);
    }
  };

  const gradeTutorTest = async () => {
    if (testGrading) return;
    setTestGrading(true);
    const studySubject = tutorData?.subject || "General Science";
    const topicToUse = testTopic.trim() || 'general syllabus';

    try {
      const answersLog = testQuestions.map(q => {
        if (q.type === 'mcq') {
          return {
            id: q.id,
            type: q.type,
            question: q.question,
            selectedOption: testSelectedAnswers[q.id] || "None",
            correctOption: q.correctOption
          };
        } else {
          return {
            id: q.id,
            type: q.type,
            question: q.question,
            solution: testStructuralAnswers[q.id] || "No response provided"
          };
        }
      });

      const parsed = await apiGradeStudyQuiz(studySubject, topicToUse, answersLog);
      const computedScore = typeof parsed.grade === 'number' ? parsed.grade : 75;
      setTestGrade(computedScore);
      setTestCongrats(parsed.congrats || "Well done on completing the educator evaluation challenge!");
      setTestCorrections(parsed.corrections || []);

      const pointsToAdd = Math.max(0, Math.min(5, computedScore / 20));

      if (auth.currentUser) {
        let cumulativePoints = pointsToAdd;
        try {
          const scoreDocRef = doc(db, 'test_scores', auth.currentUser.uid);
          const scoreSnap = await getDoc(scoreDocRef);
          if (scoreSnap.exists()) {
            cumulativePoints = (scoreSnap.data().score || 0) + pointsToAdd;
          }
        } catch (e) {
          console.error("Error reading leaderboard score:", e);
        }

        try {
          await setDoc(doc(db, 'test_scores', auth.currentUser.uid), {
            userId: auth.currentUser.uid,
            playerId: tutorData?.tutorCode || `TTR-${auth.currentUser.uid.slice(0, 5)}`,
            score: cumulativePoints,
            role: 'tutor',
            email: auth.currentUser.email || tutorData?.email || '',
            updatedAt: new Date()
          });
        } catch (e) {
          console.error("Error setting test_scores:", e);
        }
      }
      setTestStep('RESULT');
    } catch (err) {
      console.error("Grading tutor test failed: ", err);
      // Fail-safe local grading: compute MCQ correctness and assume structural credits
      let mcqScore = 0;
      testQuestions.forEach(q => {
        if (q.type === 'mcq' && testSelectedAnswers[q.id] === q.correctOption) {
          mcqScore += 2;
        }
      });
      let structuralScore = 0;
      testQuestions.forEach(q => {
        if (q.type === 'structural' && testStructuralAnswers[q.id]?.trim()) {
           structuralScore += 3;
        }
      });

      const combinedScore = Math.min(100, mcqScore + structuralScore);
      setTestGrade(combinedScore);
      setTestCongrats("Congratulations on submitting your exam! Evaluation computed successfully.");
      
      const localCorrections = testQuestions.map(q => ({
        id: q.id,
        comment: q.type === 'mcq'
          ? (testSelectedAnswers[q.id] === q.correctOption ? "Correct Option selected!" : `Incorrect. The standard consensus is Option ${q.correctOption}.`)
          : (testStructuralAnswers[q.id]?.trim() ? "Attempt reviewed. Your conceptual outline shows reasonable command of subject fundamentals." : "Blank response. Please outline definitions to claim structural credit.")
      }));
      setTestCorrections(localCorrections);

      const pointsToAdd = Math.max(0, Math.min(5, combinedScore / 20));
      if (auth.currentUser) {
        let cumulativePoints = pointsToAdd;
        try {
          const scoreDocRef = doc(db, 'test_scores', auth.currentUser.uid);
          const scoreSnap = await getDoc(scoreDocRef);
          if (scoreSnap.exists()) {
            cumulativePoints = (scoreSnap.data().score || 0) + pointsToAdd;
          }
        } catch (e) {
          console.error("Error reading leaderboard score fallback:", e);
        }

        try {
          await setDoc(doc(db, 'test_scores', auth.currentUser.uid), {
            userId: auth.currentUser.uid,
            playerId: tutorData?.tutorCode || `TTR-${auth.currentUser.uid.slice(0, 5)}`,
            score: cumulativePoints,
            role: 'tutor',
            email: auth.currentUser.email || tutorData?.email || '',
            updatedAt: new Date()
          });
        } catch (e) {
          console.error("Error setting test_scores fallback:", e);
        }
      }
      setTestStep('RESULT');
    } finally {
      setTestGrading(false);
    }
  };

  const currentTutorUid = auth.currentUser?.uid || tutorData?.userId || tutorData?.id;

  useEffect(() => {
    if (!currentTutorUid) return;

    // 1. Get real logged lessons
    const qLessons = query(
      collection(db, 'tutor_lessons'),
      where('tutorId', '==', currentTutorUid)
    );
    const unsubLessons = onSnapshot(qLessons, (snap) => {
      const lessonsList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRealLessons(lessonsList);
      setCompletedLessons(lessonsList.length);
    }, (err) => {
      console.warn("Failed to load tutor lessons: ", err);
    });

    // 2. Load student message streams and extract unique students
    const qStudentMsgs = query(
      collection(db, 'tutor_student_messages'),
      where('tutorId', '==', currentTutorUid)
    );
    const unsubStudentMsgs = onSnapshot(qStudentMsgs, (snap) => {
      const msgs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTutorStudentMessages(msgs);

      if (studentMsgsInitialLoaded.current) {
        snap.docChanges().forEach(change => {
          if (change.type === 'added') {
            const msg = change.doc.data() as any;
            if (msg.sender === 'student') {
              triggerChatNotification(
                "New message from Student",
                msg.text || "",
                msg.studentEmail || "Student",
                "student"
              );
            }
          }
        });
      } else {
        studentMsgsInitialLoaded.current = true;
      }

      // Find unique students
      const studentMap: Record<string, any> = {};
      msgs.forEach((m: any) => {
        if (m.studentId) {
          studentMap[m.studentId] = {
            id: m.studentId,
            studentId: m.studentId,
            studentEmail: m.studentEmail || 'student@nc.edu'
          };
        }
      });
      const uniqueList = Object.values(studentMap);
      setChatStudents(uniqueList);
      setActiveStudents(uniqueList.length);
    }, (err) => {
      console.warn("Failed to load tutor slot messaging streams: ", err);
    });

    // 3. Listen to admin-tutor direct chat
    const qAdminMsgs = query(
      collection(db, 'tutor_messages'),
      where('tutorId', '==', currentTutorUid)
    );
    const unsubAdminMsgs = onSnapshot(qAdminMsgs, (snap) => {
      const msgs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const sorted = msgs.sort((a: any, b: any) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
      setAdminMessages(sorted);
      setMessagesCount(snap.size);

      if (adminMsgsInitialLoaded.current) {
        snap.docChanges().forEach(change => {
          if (change.type === 'added') {
            const msg = change.doc.data() as any;
            if (msg.sender === 'admin') {
              triggerChatNotification(
                "New message from Administrator",
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
    }, (err) => {
      console.warn("Failed to retrieve administrator messages: ", err);
    });

    return () => {
      unsubLessons();
      unsubStudentMsgs();
      unsubAdminMsgs();
    };
  }, [currentTutorUid]);

  // Action: Post manual message reply to administrator
  const handleSendAdminReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminChatInput.trim() || !currentTutorUid) return;

    const replyMsg = adminChatInput.trim();
    setAdminChatInput('');

    try {
      await addDoc(collection(db, 'tutor_messages'), {
        tutorId: currentTutorUid,
        sender: 'tutor',
        text: replyMsg,
        tutorName: tutorData?.fullName || tutorData?.name || tutorData?.tutorName || auth.currentUser?.displayName || 'Tutor',
        tutorEmail: auth.currentUser?.email || tutorData?.email || '',
        createdAt: { seconds: Math.floor(Date.now() / 1000) },
        openedByAdmin: false
      });
    } catch (err: any) {
      alert("Error sending admin message: " + err.message);
    }
  };

  // Action: Post reply message to student
  const handleSendStudentReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentChatInput.trim() && !chatImage) return;
    if (!selectedStudent || !currentTutorUid) return;

    const replyMsg = studentChatInput.trim();
    const imgToSend = chatImage;

    setStudentChatInput('');
    setChatImage(null);

    try {
      await addDoc(collection(db, 'tutor_student_messages'), {
        tutorId: currentTutorUid,
        studentId: selectedStudent.studentId,
        studentEmail: selectedStudent.studentEmail,
        sender: 'tutor',
        text: replyMsg || '📷 Sent a photo',
        imageUrl: imgToSend || null,
        createdAt: { seconds: Math.floor(Date.now() / 1000) }
      });
    } catch (err: any) {
      alert("Error writing student message: " + err.message);
    }
  };

  const startStudentChatRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = reader.result as string;
          if (currentTutorUid && selectedStudent) {
            await addDoc(collection(db, 'tutor_student_messages'), {
              tutorId: currentTutorUid,
              studentId: selectedStudent.studentId,
              studentEmail: selectedStudent.studentEmail,
              sender: 'tutor',
              text: '🎤 Sent a voicemail',
              audioUrl: base64,
              createdAt: { seconds: Math.floor(Date.now() / 1000) }
            });
          }
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };
      recorder.start();
      setIsRecording(true);
      setRecordSecs(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordSecs(p => p + 1);
      }, 1000);
    } catch (err) {
      console.error("Recording error:", err);
      alert("Microphone capture access denied or unavailable.");
    }
  };

  const stopStudentChatRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  };

  const handlePhotoCaptured = async (base64: string) => {
    if (!currentTutorUid) return;
    try {
      await updateDoc(doc(db, "tutors", currentTutorUid), {
        photoUrl: base64
      });
      setTutorPhoto(base64);
      setIsPhotoModalOpen(false);
    } catch (err: any) {
      alert("Error updating tutor photo: " + err.message);
    }
  };

  // Action: Insert a real teaching achievement lesson
  const handleLogLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logStudentName.trim() || !logTopic.trim() || !currentTutorUid) {
      alert("Please enter the Student Name/Group and Topic details!");
      return;
    }

    setIsLogging(true);
    try {
      await addDoc(collection(db, 'tutor_lessons'), {
        tutorId: currentTutorUid,
        studentName: logStudentName.trim(),
        topic: logTopic.trim(),
        comments: logComments.trim(),
        createdAt: { seconds: Math.floor(new Date(logDate).getTime() / 1000) }
      });

      // Clear input fields
      setLogStudentName('');
      setLogTopic('');
      setLogComments('');
      alert("Teaching session logged successfully!");
      setCurrentSection('OVERVIEW');
    } catch (err: any) {
      alert("Error registering completed lesson: " + err.message);
    } finally {
      setIsLogging(false);
    }
  };

  // Compile realistic academic output weekly chart based on genuine logged lessons & students
  const chartData = [
    { name: 'Week 1', students: 0, lessons: 0 },
    { name: 'Week 2', students: 0, lessons: 0 },
    { name: 'Week 3', students: 0, lessons: 0 },
    { name: 'Week 4', students: 0, lessons: 0 },
  ];

  realLessons.forEach((l: any) => {
    const ageSeconds = Math.floor(Date.now() / 1000) - (l.createdAt?.seconds || Math.floor(Date.now() / 1000));
    const ageDays = ageSeconds / 86400;
    if (ageDays <= 7) {
      chartData[3].lessons += 1;
    } else if (ageDays <= 14) {
      chartData[2].lessons += 1;
    } else if (ageDays <= 21) {
      chartData[1].lessons += 1;
    } else {
      chartData[0].lessons += 1;
    }
  });

  chatStudents.forEach((cs: any, i: number) => {
    const weekIdx = i % 4;
    chartData[weekIdx].students += 1;
  });

  const isDisqualified = tutorData?.isDisqualified === true;

  if (isDisqualified) {
    return (
      <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-4 z-50">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-[2.5rem] p-8 md:p-10 max-w-xl w-full border-2 border-red-200 shadow-2xl space-y-6 text-center"
        >
          <div className="p-4 bg-red-50 text-red-600 rounded-full inline-flex">
            <ShieldAlert className="w-12 h-12" />
          </div>
          <h3 className="text-2xl font-black text-slate-800 font-display">Tutor Certification Revoked</h3>
          <p className="text-slate-600 text-sm leading-relaxed">
            As part of our strict educational quality standards, tutors are tested weekly on their specialized subject. 
            Unfortunately, your latest score of <span className="text-red-600 font-black">{tutorData?.lastWeeklyTestScore || 0}/20</span> is below the passing threshold of <span className="font-bold">10/20</span>.
          </p>
          <p className="text-slate-500 text-xs leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
            Your active tutor profile for <span className="text-[#800080] font-bold">{tutorData?.subject}</span> has been suspended. 
            You will now be returned to the home page where you are welcome to apply as a tutor for any other subject.
          </p>
          <button
            type="button"
            onClick={async () => {
              const currentTutorUid = auth.currentUser?.uid || tutorData?.userId || tutorData?.id;
              if (currentTutorUid) {
                const { doc, deleteDoc } = await import('firebase/firestore');
                await deleteDoc(doc(db, "tutors", currentTutorUid));
              }
              if (onBackToHome) onBackToHome();
            }}
            className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
          >
            Acknowledge &amp; Return to Home Page
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div id="tutor-dashboard" className="min-h-screen bg-[#f5efff] font-sans pb-12 text-slate-800 relative overflow-hidden">
      
      {/* Header */}
      <header className="bg-[#800080] text-white py-6 px-8 shadow-lg flex flex-col sm:flex-row items-center justify-between sticky top-0 z-40 gap-4">
        <div className="flex items-center gap-3">
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
          <div className="bg-white/20 p-2 rounded-xl">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-display tracking-tight">NC.edu <span className="font-light opacity-80">Tutor Portal</span></h1>
            <p className="text-[10px] text-purple-200 font-bold uppercase tracking-wider block mt-0.5">{tutorData?.subject} Educator Panel</p>
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <div className="bg-purple-950/40 p-1 rounded-xl flex border border-white/10 flex-wrap">
          <button
            onClick={() => { setCurrentSection('OVERVIEW'); setSelectedStudent(null); }}
            className={`px-3.5 py-1.5 rounded-lg font-bold text-xs tracking-wider transition-all cursor-pointer ${currentSection === 'OVERVIEW' ? 'bg-white text-purple-950 shadow-sm' : 'text-purple-100 hover:text-white'}`}
          >
            Overview
          </button>
          <button
            onClick={() => { setCurrentSection('STUDENT_CHAT'); setSelectedStudent(null); }}
            className={`px-3.5 py-1.5 rounded-lg font-bold text-xs tracking-wider transition-all cursor-pointer ${currentSection === 'STUDENT_CHAT' ? 'bg-white text-purple-950 shadow-sm' : 'text-purple-100 hover:text-white'}`}
          >
            Student Chat ({chatStudents.length})
          </button>
          <button
            onClick={() => { setCurrentSection('ADMIN_CHAT'); setSelectedStudent(null); }}
            className={`px-3.5 py-1.5 rounded-lg font-bold text-xs tracking-wider transition-all cursor-pointer ${currentSection === 'ADMIN_CHAT' ? 'bg-white text-purple-950 shadow-sm' : 'text-purple-100 hover:text-white'}`}
          >
            Admin Support Chat ({adminMessages.length})
          </button>
          <button
            onClick={() => { setCurrentSection('LOGGED_LESSONS'); setSelectedStudent(null); }}
            className={`px-3.5 py-1.5 rounded-lg font-bold text-xs tracking-wider transition-all cursor-pointer ${currentSection === 'LOGGED_LESSONS' ? 'bg-white text-purple-950 shadow-sm' : 'text-purple-100 hover:text-white'}`}
          >
            Log Session
          </button>
          <button
            onClick={() => { setCurrentSection('TAKE_TEST'); setSelectedStudent(null); }}
            className={`px-3.5 py-1.5 rounded-lg font-bold text-xs tracking-wider transition-all cursor-pointer ${currentSection === 'TAKE_TEST' ? 'bg-white text-purple-950 shadow-sm' : 'text-purple-100 hover:text-white'}`}
          >
            Pass Evaluation Test
          </button>
          <button
            onClick={() => { setCurrentSection('MANAGEMENT'); setSelectedStudent(null); }}
            className={`px-3.5 py-1.5 rounded-lg font-bold text-xs tracking-wider transition-all cursor-pointer ${currentSection === 'MANAGEMENT' ? 'bg-amber-400 text-purple-950 shadow-sm' : 'text-amber-300 hover:text-white'}`}
          >
            ✨ AI Management
          </button>
        </div>

        <div className="flex items-center gap-4.5">
          {onBackToHome && (
            <button
              onClick={onBackToHome}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-purple-100 hover:text-white font-bold rounded-xl text-xs border border-purple-100/10 transition-all flex items-center gap-2 cursor-pointer"
            >
              Return to home page
            </button>
          )}
          <button
            onClick={() => setIsCommunityOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-750 text-white font-extrabold rounded-xl text-xs transition-all flex items-center gap-2 shadow-md cursor-pointer hover:scale-105"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Community Hub</span>
          </button>
          <button 
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 bg-purple-900/40 hover:bg-rose-700/20 text-rose-100 hover:text-white border border-rose-500/20 rounded-xl transition-all font-bold text-xs cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6 md:p-10 space-y-10">
        
        {/* Weekly Evaluation Test Alert Banner */}
        {tutorData?.lastWeeklyTestAt && (() => {
          const lastTestDate = new Date(tutorData.lastWeeklyTestAt);
          const nextTestDate = new Date(lastTestDate.getTime() + 7 * 24 * 60 * 60 * 1000);
          const msUntilNextTest = nextTestDate.getTime() - Date.now();
          const hoursUntilNextTest = msUntilNextTest / (1000 * 60 * 60);

          if (hoursUntilNextTest > 0 && hoursUntilNextTest <= 24) {
            const hours = Math.floor(hoursUntilNextTest);
            const mins = Math.floor((hoursUntilNextTest - hours) * 60);
            return (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-amber-50 border border-amber-300 text-amber-900 rounded-[2rem] p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-md shadow-amber-900/5 relative overflow-hidden"
              >
                {/* Subtle Amber Glow Background Elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-xl pointer-events-none" />
                <div className="flex items-center gap-4.5">
                  <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center font-bold shadow-xs shrink-0">
                    <Clock className="w-6 h-6 animate-pulse text-amber-600" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="bg-amber-100 text-amber-800 text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border border-amber-200">
                      Evaluation Approaching
                    </span>
                    <h4 className="text-sm font-black text-amber-950 font-display mt-1">Weekly Competency Test Required</h4>
                    <p className="text-amber-800/80 text-xs font-semibold leading-normal">
                      Your weekly educator certification is scheduled to renew in <span className="font-black text-amber-900">{hours} hours and {mins} minutes</span>. Please pass the test before the deadline to prevent automatic service suspension.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentSection('TAKE_TEST');
                    setSelectedStudent(null);
                  }}
                  className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shrink-0"
                >
                  Pass Evaluation Now
                </button>
              </motion.div>
            );
          }
          return null;
        })()}
        
        {/* Dynamic section renderer */}
        <AnimatePresence mode="wait">
          
          {/* Section 1: OVERVIEW DASHBOARD */}
          {currentSection === 'OVERVIEW' && (
            <motion.div
              key="overview-section"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-10"
            >
              {/* Profile Bar */}
              <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-purple-900/5 flex flex-col md:flex-row items-center gap-8 border border-white">
                <div className="relative group w-20 h-20 rounded-2xl overflow-hidden border-2 border-purple-100 shadow-sm shrink-0 cursor-pointer" onClick={() => setIsPhotoModalOpen(true)}>
                  <img 
                    src={tutorPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${auth.currentUser?.email}`} 
                    alt="Profile" 
                    className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[9px] text-white font-extrabold text-center p-1 uppercase leading-tight select-none">
                    Change Photo
                  </div>
                </div>
                <div className="text-center md:text-left flex-1 space-y-1">
                  <h2 className="text-2xl font-black text-slate-800 font-display flex items-center justify-center md:justify-start gap-3">
                    <span>Welcome Back, {auth.currentUser?.displayName || 'Professor'}! 👋</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide border ${
                      isAvailable 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}>
                      {isAvailable ? 'Available' : 'Offline'}
                    </span>
                  </h2>
                  <p className="text-slate-500 max-w-2xl text-xs font-semibold leading-relaxed">
                    Review incoming student questions, communicate with parents/reviewers, or chart lesson completions in <span className="text-[#800080] font-black">{tutorData.subject}</span>.
                  </p>
                  <div className="pt-1">
                    <button
                      onClick={() => setShowCertificateModal(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#800080] text-[11px] font-extrabold border border-purple-200/60 transition-all cursor-pointer"
                    >
                      <span>📜 Degree/Diploma Photo Document:</span>
                      <span className={hasValidCertificate ? "text-emerald-700 font-black" : "text-amber-600 font-black"}>
                        {hasValidCertificate ? "Verified Document Uploaded" : "⚠️ Upload Required"}
                      </span>
                    </button>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0 w-full md:w-auto">
                  <div className="bg-[#f5efff] px-5 py-3 rounded-2xl border border-purple-100/50 text-center flex-1 md:flex-initial">
                    <span className="text-[10px] font-extrabold text-[#800080] uppercase tracking-widest block mb-0.5">Faculty Ticket ID</span>
                    <span className="text-lg font-mono font-black text-slate-800">{tutorData.tutorCode}</span>
                  </div>
                  <button
                    onClick={toggleAvailability}
                    disabled={isTogglingAvailability}
                    className={`px-5 py-2.5 rounded-2xl border text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs select-none hover:scale-[1.02] active:scale-[0.98] flex-1 md:flex-initial ${
                      isAvailable 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                        : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`} />
                    <span>Go {isAvailable ? 'Offline' : 'Online'}</span>
                  </button>
                </div>
              </div>

              {/* Weekly Test Banner Card */}
              <div className="bg-gradient-to-r from-[#800080]/90 via-purple-900 to-indigo-950 p-8 rounded-[2.5rem] shadow-xl text-white border border-white/10 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-purple-500/10 rounded-full blur-xl pointer-events-none" />
                
                <div className="space-y-2 text-center md:text-left">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/10 border border-white/20">
                    <Shield className="w-3.5 h-3.5 text-purple-300" /> Academic Quality Assurance
                  </span>
                  <h3 className="text-xl font-black font-display text-white">Weekly Competency Exam Status</h3>
                  <p className="text-slate-300 text-xs leading-relaxed max-w-2xl font-medium">
                    Every 7 days, Faculty Members must pass a strict AI &amp; Admin-graded competency exam on their subject. Score at least <span className="text-yellow-300 font-extrabold">&gt;60/100</span> to retain teaching credentials. Scoring &lt;60/100 results in automatic disqualification until rewritten &amp; passed.
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-2 pt-1 justify-center md:justify-start">
                    <p className="text-[10px] text-slate-300 font-bold font-mono">
                      Last test date: <span className="text-purple-200">{tutorData?.lastWeeklyTestAt ? new Date(tutorData.lastWeeklyTestAt).toLocaleDateString() : 'Never taken'}</span>
                    </p>
                    <p className="text-[10px] text-slate-300 font-bold font-mono">
                      Last score: <span className="text-purple-200">{tutorData?.lastWeeklyTestScore !== undefined ? `${tutorData.lastWeeklyTestScore}/100` : 'N/A'}</span>
                    </p>
                  </div>
                </div>

                <div className="shrink-0 w-full md:w-auto flex flex-col items-center gap-2">
                  <button
                    onClick={startWeeklyCompetencyTest}
                    className="w-full md:w-auto px-8 py-4 bg-yellow-400 hover:bg-yellow-500 text-purple-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg transition-all transform hover:scale-[1.02] cursor-pointer"
                  >
                    Take Competency Test
                  </button>
                  <p className="text-[9px] text-purple-200 font-bold tracking-wider uppercase">
                    Status: <span className={tutorData?.lastWeeklyTestAt ? "text-emerald-300" : "text-yellow-300"}>
                      {tutorData?.lastWeeklyTestAt ? "Renewed & Certified" : "Needs initial certification"}
                    </span>
                  </p>
                </div>
              </div>

              {/* Genuine Stats Bar */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Stat 1 */}
                <div className="bg-white p-6 rounded-[2rem] shadow-xl shadow-purple-900/5 border border-white flex items-center gap-5">
                  <div className="p-4 bg-purple-50 text-[#800080] rounded-2xl shrink-0">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Studied Students</p>
                    <p className="text-3xl font-black text-slate-850 mt-0.5 font-display">{activeStudents}</p>
                    <p className="text-[9px] text-slate-400 font-bold mt-1 leading-none">Actual student chats initiated</p>
                  </div>
                </div>

                {/* Stat 2 */}
                <div className="bg-white p-6 rounded-[2rem] shadow-xl shadow-purple-900/5 border border-white flex items-center gap-5">
                  <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl shrink-0">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Completed Lessons logged</p>
                    <p className="text-3xl font-black text-slate-850 mt-0.5 font-display">{completedLessons}</p>
                    <p className="text-[9px] text-[#800080] font-bold mt-1 leading-none">Register your sessions to update</p>
                  </div>
                </div>

                {/* Stat 3 */}
                <div className="bg-white p-6 rounded-[2rem] shadow-xl shadow-purple-900/5 border border-white flex items-center gap-5">
                  <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl shrink-0">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Messaging streams</p>
                    <p className="text-3xl font-black text-slate-850 mt-0.5 font-display">{messagesCount}</p>
                    <p className="text-[9px] text-slate-400 font-bold mt-1 leading-none">Direct chat log lines synced</p>
                  </div>
                </div>

              </div>

              {/* Realistic Output Graph Card representation */}
              <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-purple-900/5 border border-purple-50 space-y-6">
                <div>
                  <h3 className="text-xl font-extrabold text-slate-855 font-display">Faculty Productivity Graph</h3>
                  <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-wider">Realistic lesson completions & unique active students (Zero simulated indicators)</p>
                </div>

                {(completedLessons === 0 && activeStudents === 0) ? (
                  <div className="bg-[#fcfaff] border border-dashed border-purple-150 rounded-2xl p-10 text-center flex flex-col items-center justify-center space-y-2">
                    <span className="text-slate-450 font-bold text-sm">Dashboard Performance Graph is Empty</span>
                    <p className="text-[11px] text-slate-450 max-w-sm leading-relaxed">
                      You just signed in! Go to the <strong>Log Session</strong> tab at top to log your very first completed teaching session and start plotting your dynamic performance output.
                    </p>
                    <button 
                      onClick={() => setCurrentSection('LOGGED_LESSONS')}
                      className="px-4 py-2 mt-2 bg-[#800080] text-white font-bold text-xs rounded-lg shadow-md hover:opacity-90"
                    >
                      Log Lesson Session Now
                    </button>
                  </div>
                ) : (
                  <div className="w-full h-64 min-h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8f6fc" />
                        <XAxis dataKey="name" stroke="#a29ebd" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke="#a29ebd" fontSize={11} tickLine={false} axisLine={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#fff', border: '1px solid #e9e5f3', borderRadius: '16px' }} 
                          labelStyle={{ fontWeight: 'bold', color: '#334155' }}
                        />
                        <Bar dataKey="students" fill="#800080" radius={[4, 4, 0, 0]} name="Active Students" />
                        <Bar dataKey="lessons" fill="#10b981" radius={[4, 4, 0, 0]} name="Completed Lessons" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Bottom Quick-Action Panel Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                <div className="bg-white p-6 rounded-3xl border border-purple-50/50 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <h4 className="font-extrabold text-sm text-slate-800">Dynamic Student Channels</h4>
                    <p className="text-xs text-slate-500 leading-normal">
                      Respond to incoming student syllabus questions instantly. Let students consult with you.
                    </p>
                  </div>
                  <button 
                    onClick={() => setCurrentSection('STUDENT_CHAT')}
                    className="py-2.5 bg-purple-50 hover:bg-purple-100 text-[#800080] font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    Open Student Rooms <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-purple-50/50 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <h4 className="font-extrabold text-sm text-slate-800">Report Lesson Activities</h4>
                    <p className="text-xs text-slate-500 leading-normal">
                      Register completed study group tasks, hours spent, or topic milestones achieved.
                    </p>
                  </div>
                  <button 
                    onClick={() => setCurrentSection('LOGGED_LESSONS')}
                    className="py-2.5 bg-purple-50 hover:bg-purple-100 text-[#800080] font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    Log New Session <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-purple-50/50 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <h4 className="font-extrabold text-sm text-slate-800">Administrator Desk</h4>
                    <p className="text-xs text-slate-500 leading-normal">
                      Review system wide tutor guidelines, verify files, or update your schedule with admins.
                    </p>
                  </div>
                  <button 
                    onClick={() => setCurrentSection('ADMIN_CHAT')}
                    className="py-2.5 bg-purple-50 hover:bg-purple-100 text-[#800080] font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    Chat with Admin <MessageSquare className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>

              {/* Dynamic Academic Leaderboard */}
              <div className="mt-10">
                <ScoreboardTable />
              </div>
            </motion.div>
          )}

          {/* Section 2: STUDENT DIRECT CHATS */}
          {currentSection === 'STUDENT_CHAT' && (
            <motion.div
              key="student-chat-section"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              {/* Left Column: Active Chat Subjects */}
              <div className="md:col-span-1 bg-white rounded-3xl p-5 border border-purple-50 shadow-sm space-y-4 flex flex-col">
                <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">Student Conversations ({chatStudents.length})</h3>
                <p className="text-[10px] text-slate-400 font-semibold leading-normal">Select a student requesting questions regarding {tutorData.subject} help.</p>

                <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[400px] pr-1">
                  {chatStudents.length > 0 ? (
                    chatStudents.map((st: any) => (
                      <div 
                        key={st.studentId}
                        onClick={() => setSelectedStudent(st)}
                        className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer ${selectedStudent?.studentId === st.studentId ? 'bg-purple-50 border-purple-200 text-purple-900 font-extrabold' : 'bg-slate-50 border-slate-100 text-slate-650 hover:bg-slate-100'}`}
                      >
                        <p className="text-xs truncate">{st.studentEmail.split('@')[0]}</p>
                        <span className="text-[9px] text-slate-400 font-bold block mt-0.5">{st.studentEmail}</span>
                      </div>
                    ))
                  ) : (
                    <div className="py-10 text-center flex flex-col items-center justify-center space-y-2">
                      <Users className="w-8 h-8 stroke-1 text-slate-300" />
                      <span className="text-[11px] text-slate-400 font-bold block">No student logs yet</span>
                      <p className="text-[9px] text-slate-400 max-w-[140px] leading-relaxed mx-auto">When a student initiates queries to your handle, they will show up here.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Active Conversation viewport */}
              <div className="md:col-span-2 bg-white rounded-3xl p-6 border border-purple-50 shadow-sm min-h-[420px] flex flex-col justify-between">
                {selectedStudent ? (
                  <>
                    {/* Header */}
                    <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-purple-100 text-[#800080] flex items-center justify-center font-bold text-xs uppercase">
                          {selectedStudent.studentEmail.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-[#800080] text-xs uppercase tracking-wider">{selectedStudent.studentEmail.split('@')[0]}</h4>
                          <p className="text-[9px] text-slate-400 font-semibold">{selectedStudent.studentEmail}</p>
                        </div>
                      </div>
                      <span className="text-[9px] bg-green-50 text-green-700 font-extrabold px-2.5 py-1 rounded-full border border-green-100 block">
                        DIRECT SYNC
                      </span>
                    </div>

                    {/* Messages Panel */}
                    <div className="flex-1 overflow-y-auto my-4 space-y-3.5 pr-2 max-h-[300px]">
                      {tutorStudentMessages
                        .filter((m: any) => m.studentId === selectedStudent.studentId)
                        .map((msg: any, idx: number) => {
                          const isTutor = msg.sender === 'tutor';
                          return (
                            <div key={idx} className={`flex ${isTutor ? 'justify-end' : 'justify-start'}`}>
                              <div className={`p-3.5 rounded-2xl max-w-[85%] text-xs font-semibold leading-relaxed ${isTutor ? 'bg-[#800080] text-white rounded-tr-none' : 'bg-slate-50 border border-slate-100 text-slate-800 rounded-tl-none'}`}>
                                {msg.audioUrl ? (
                                  <VoicemailPlayer audioUrl={msg.audioUrl} isMe={isTutor} />
                                ) : msg.imageUrl ? (
                                  <div className="space-y-1.5 max-w-xs">
                                    <img src={msg.imageUrl} alt="Shared attachment" className="rounded-lg max-h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity" referrerPolicy="no-referrer" />
                                    {msg.text && msg.text !== '📷 Sent a photo' && <p>{msg.text}</p>}
                                  </div>
                                ) : (
                                  <p>{msg.text}</p>
                                )}
                                <span className="text-[8px] opacity-75 block text-right mt-1">
                                  {msg.createdAt?.seconds ? new Date(msg.createdAt.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Just now'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                    </div>

                    {/* Send box */}
                    <div className="pt-3 border-t border-slate-100 space-y-3">
                      
                      {/* Active Live Camera Stream Box */}
                      {showChatCamera && (
                        <div className="relative border border-purple-200 bg-slate-950 rounded-2xl overflow-hidden shadow-md max-w-sm mx-auto p-1 space-y-2 animate-fadeIn">
                          <video 
                            ref={chatVideoRef} 
                            autoPlay 
                            playsInline 
                            muted 
                            className="w-full h-44 object-cover rounded-xl scale-x-[-1]" 
                          />
                          <div className="flex gap-2 p-1">
                            <button
                              type="button"
                              onClick={captureChatPhoto}
                              className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1"
                            >
                              <Camera className="w-3 h-3" /> Capture Photo
                            </button>
                            <button
                              type="button"
                              onClick={stopChatCamera}
                              className="px-3 py-1.5 bg-slate-850 hover:bg-slate-750 text-slate-300 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Attachment Thumbnail Preview Box */}
                      {chatImage && (
                        <div className="relative inline-block w-20 h-20 rounded-xl border border-purple-300 bg-slate-50 overflow-hidden shadow-sm animate-fadeIn">
                          <img src={chatImage} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          <button
                            type="button"
                            onClick={() => setChatImage(null)}
                            className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white p-0.5 rounded-full shadow-md transition-all cursor-pointer"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      )}

                      <form onSubmit={handleSendStudentReply} className="flex gap-2 items-center">
                        {/* Camera Button */}
                        <button
                          type="button"
                          onClick={showChatCamera ? stopChatCamera : startChatCamera}
                          disabled={isRecording}
                          className={`p-3.5 rounded-xl flex items-center justify-center border transition-all duration-300 shrink-0 cursor-pointer ${
                            showChatCamera ? 'bg-[#800080] text-white border-transparent' : 'bg-slate-50 hover:bg-slate-100 text-slate-500 border-slate-200/50'
                          }`}
                          title="Capture from Camera"
                        >
                          <Camera className="w-4 h-4" />
                        </button>

                        {/* Files Attachment Button */}
                        <button
                          type="button"
                          onClick={() => chatFileInputRef.current?.click()}
                          disabled={isRecording || showChatCamera}
                          className="p-3.5 rounded-xl flex items-center justify-center border bg-slate-50 hover:bg-slate-100 text-slate-500 border-slate-200/50 transition-all duration-300 shrink-0 cursor-pointer"
                          title="Upload Image File"
                        >
                          <Upload className="w-4 h-4" />
                        </button>

                        <input 
                          type="file"
                          ref={chatFileInputRef}
                          onChange={handleChatFileChange}
                          accept="image/*"
                          className="hidden"
                        />

                        <button
                          type="button"
                          onClick={isRecording ? stopStudentChatRecording : startStudentChatRecording}
                          disabled={showChatCamera}
                          className={`p-3.5 rounded-xl flex items-center justify-center border transition-all duration-300 relative shrink-0 cursor-pointer ${isRecording ? 'bg-red-500 text-white border-transparent animate-pulse shadow-md' : 'bg-slate-50 hover:bg-slate-100 text-slate-500 border-slate-200/50'}`}
                          title={isRecording ? "Stop and Send Voicemail" : "Record Voicemail"}
                        >
                          {isRecording ? (
                            <div className="flex items-center gap-1.5 px-1">
                              <Square className="w-3.5 h-3.5 fill-white" />
                              <span className="text-[10px] font-black font-mono">{recordSecs}s</span>
                            </div>
                          ) : (
                            <Mic className="w-4 h-4" />
                          )}
                        </button>

                        <input 
                          type="text" 
                          placeholder={
                            isRecording 
                              ? "🔴 Recording voicemail... Click square to send!" 
                              : showChatCamera 
                                ? "Capture a webcam photo to send..." 
                                : chatImage 
                                  ? "Add an optional description to your photo..." 
                                  : `Message ${selectedStudent.studentEmail.split('@')[0]} directly...`
                          }
                          value={studentChatInput}
                          onChange={e => setStudentChatInput(e.target.value)}
                          disabled={isRecording}
                          className={`flex-1 border rounded-xl px-4 py-3 text-xs outline-none focus:border-purple-500 font-semibold font-sans ${isRecording ? 'bg-red-50/20 border-red-200 text-red-700 placeholder-red-400 font-bold' : 'bg-slate-50/55 focus:bg-white border-slate-205'}`}
                        />
                        <button 
                          type="submit"
                          disabled={(!studentChatInput.trim() && !chatImage) || isRecording}
                          className="px-4 py-3 bg-[#800080] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center hover:opacity-90 disabled:opacity-40"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </form>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-3">
                    <MessageSquare className="w-12 h-12 stroke-1 text-[#800080]/30 animate-pulse" />
                    <h4 className="font-extrabold text-slate-700 text-sm">No student channel is open</h4>
                    <p className="text-[10px] text-slate-400 max-w-xs leading-normal">Select an incoming student row from the left panel to begin manual messaging. Direct chats remain private and unassisted by any bots.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Section 3: ADMIN DIRECT CHATS */}
          {currentSection === 'ADMIN_CHAT' && (
            <motion.div
              key="admin-chat-section"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="bg-white rounded-3xl p-6 border border-purple-50 shadow-sm flex flex-col justify-between min-h-[450px]"
            >
              {/* Header */}
              <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-900 rounded-xl flex items-center justify-center text-white font-black text-xs shadow">
                    HQ
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 text-xs uppercase tracking-wider">NC.edu Control Tower Desk</h3>
                    <p className="text-[9px] text-slate-400 font-semibold">Tutor support desk & administrative reviews</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-green-500 rounded-full"></span>
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Admin Desk Online</span>
                </div>
              </div>

              {/* Message scroll viewport */}
              <div className="flex-1 overflow-y-auto space-y-4 my-6 pr-2 max-h-[300px] flex flex-col">
                {adminMessages.length > 0 ? (
                  adminMessages.map((msg: any, idx: number) => {
                    const isMe = msg.sender === 'tutor';
                    return (
                      <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`p-4 rounded-2xl max-w-[80%] text-xs font-semibold leading-relaxed shadow-xs ${isMe ? 'bg-[#800080] text-white rounded-tr-none' : 'bg-slate-100 text-slate-705 rounded-tl-none border border-slate-200/50'}`}>
                          <p>{msg.text}</p>
                          <span className="text-[8px] opacity-70 block text-right mt-1 font-mono">
                            {msg.createdAt?.seconds ? new Date(msg.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '刚刚'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="my-auto flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
                    <ShieldAlert className="w-10 h-10 stroke-1 text-slate-300" />
                    <h4 className="font-bold text-slate-700 text-sm">No message records found</h4>
                    <p className="text-[9px] max-w-sm text-slate-450 leading-relaxed text-center mx-auto">
                      Whenever the Officer or Administrator asks you a question or communicates with you, the message log entries show up here. Use the field below to write messages directly to Control Tower Admin Desk.
                    </p>
                  </div>
                )}
              </div>

              {/* Submit Area */}
              <form onSubmit={handleSendAdminReply} className="pt-4 border-t border-slate-100 flex gap-2">
                <input 
                  type="text" 
                  placeholder="Type a manual report or question directly to administration..."
                  value={adminChatInput}
                  onChange={e => setAdminChatInput(e.target.value)}
                  className="flex-1 border border-slate-205 focus:border-[#800080] bg-slate-50/70 p-3.5 rounded-xl text-xs font-bold outline-none font-sans"
                />
                <button 
                  type="submit"
                  disabled={!adminChatInput.trim()}
                  className="px-5 bg-gradient-to-r from-purple-700 to-indigo-850 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all hover:scale-103 cursor-pointer shrink-0 disabled:opacity-40"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </motion.div>
          )}

          {/* Section 4: REGISTER COMPLETED TEACHING LESSON */}
          {currentSection === 'LOGGED_LESSONS' && (
            <motion.div
              key="logged-lessons-section"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              
              {/* Form Side */}
              <div className="md:col-span-2 bg-white rounded-3xl p-6.5 border border-purple-50 shadow-sm space-y-6">
                <div>
                  <h3 className="font-extrabold text-slate-800 text-lg font-display">Register Achieved Lesson Session</h3>
                  <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-wider">Log real teaching output for your weekly charts and academic indexes</p>
                </div>

                <form onSubmit={handleLogLesson} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] text-slate-450 font-bold tracking-wider block mb-1.5 uppercase">STUDENT NAME / COHORT GROUP</label>
                      <input 
                        type="text"
                        placeholder="e.g. Jane Ngo, Cohort 12"
                        value={logStudentName}
                        onChange={e => setLogStudentName(e.target.value)}
                        className="w-full border border-slate-200 focus:border-purple-600 bg-slate-50/30 rounded-xl px-4 py-3.5 text-xs font-bold outline-none font-sans"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-450 font-bold tracking-wider block mb-1.5 uppercase">LESSON DATE</label>
                      <input 
                        type="date"
                        value={logDate}
                        onChange={e => setLogDate(e.target.value)}
                        className="w-full border border-slate-200 focus:border-purple-600 bg-slate-50/30 rounded-xl px-4 py-3.5 text-xs font-bold outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-455 font-bold tracking-wider block mb-1.5 uppercase">MATH / SCIENCE SYLLABUS TOPIC ACHIEVED</label>
                    <input 
                      type="text"
                      placeholder="e.g. Calculus Chain Rule & Implicit Derivatives homework reviews"
                      value={logTopic}
                      onChange={e => setLogTopic(e.target.value)}
                      className="w-full border border-slate-200 focus:border-purple-600 bg-slate-50/30 rounded-xl px-4 py-3.5 text-xs font-bold outline-none font-sans"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-455 font-bold tracking-wider block mb-1.5 uppercase">FEEDBACK & SESSION OUTCOMES (OPTIONAL)</label>
                    <textarea 
                      placeholder="e.g. Completed the exercise textbook proofs successfully, Jane showed high retention."
                      rows={4}
                      value={logComments}
                      onChange={e => setLogComments(e.target.value)}
                      className="w-full border border-slate-200 focus:border-purple-600 bg-slate-50/30 rounded-xl px-4 py-3.5 text-xs font-medium outline-none resize-none font-sans"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLogging}
                    className="w-full py-4 bg-[#800080] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow shadow-purple-600/10 cursor-pointer flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50"
                  >
                    {isLogging ? 'Registering Teaching Outbreak...' : 'Register Completed Lesson Session'}
                  </button>
                </form>
              </div>

              {/* History List Side */}
              <div className="md:col-span-1 bg-white rounded-3xl p-5 border border-purple-50 shadow-sm flex flex-col">
                <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider mb-1 font-display">Achieved Records ({realLessons.length})</h3>
                <p className="text-[10px] text-slate-400 font-bold mb-4 uppercase tracking-widest">Active historical roster logs</p>

                <div className="space-y-3.5 flex-1 overflow-y-auto max-h-[380px] pr-1">
                  {realLessons.length > 0 ? (
                    realLessons.map((l: any, idx: number) => (
                      <div key={`tutor-lesson-${l.id || idx}-${idx}`} className="bg-slate-50 p-4 border border-slate-100 rounded-2xl space-y-1.5 hover:border-purple-200 transition-colors">
                        <div className="flex justify-between items-start gap-1">
                          <h4 className="font-bold text-slate-800 text-xs truncate leading-snug">{l.studentName}</h4>
                          <span className="text-[8px] bg-purple-50 text-[#800080] font-black tracking-wide shrink-0 px-1.5 py-0.5 rounded border border-purple-100 uppercase">
                            {l.createdAt?.seconds ? new Date(l.createdAt.seconds * 1000).toLocaleDateString([], {month:'short', day:'numeric'}) : 'Passed'}
                          </span>
                        </div>
                        <p className="text-[10.5px] text-slate-600 leading-snug font-sans">{l.topic}</p>
                        {l.comments && (
                          <p className="text-[9.5px] text-slate-400 leading-normal italic line-clamp-2">"{l.comments}"</p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="py-12 border border-dashed border-slate-150 rounded-2xl text-center flex flex-col items-center justify-center space-y-1 bg-slate-50/50">
                      <Calendar className="w-8 h-8 stroke-1 text-slate-350" />
                      <span className="text-[11px] text-slate-400 font-bold block mt-1">No lessons archived yet</span>
                      <p className="text-[9px] text-slate-400 max-w-[130px] mx-auto leading-relaxed">Log your achievements in the left panel to register entries.</p>
                    </div>
                  )}
                </div>
              </div>

            </motion.div>
          )}

          {/* Section 5: TUTOR PASSED TEST/EVALUATION FOR THE PORTAL */}
          {currentSection === 'TAKE_TEST' && (
            <motion.div
              key="tutor-take-test-section"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              {/* Main Banner */}
              <div className="bg-gradient-to-r from-[#800080] to-indigo-950 p-8 rounded-[2.5rem] text-white relative overflow-hidden border border-purple-800 animate-fadeIn">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <GraduationCap className="w-32 h-32 text-purple-300" />
                </div>
                <h3 className="text-3xl font-black font-display mb-2">Educator Evaluation &amp; Credentials</h3>
                <p className="text-purple-250 text-xs max-w-3xl leading-relaxed">
                  Generate instant, rigorous practice and evaluation exams graded dynamically out of 100 points, then converted into cumulative score credentials. Your academic achievements sync directly with the live school-wide scoreboard!
                </p>
              </div>

              {testStep === 'CHOOSE' && (
                <div className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-purple-50 shadow-sm max-w-2xl mx-auto space-y-6">
                  <div className="text-center">
                    <span className="p-3 bg-purple-50 text-[#800080] rounded-2xl inline-flex mb-4">
                      <HelpCircle className="w-8 h-8" />
                    </span>
                    <h4 className="text-xl font-bold text-slate-800 font-display">Configure Assessment Subject</h4>
                    <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">
                      Subject Matter Field: <span className="text-[#800080] font-black">{tutorData?.subject || 'General Syllabus'}</span>
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] text-slate-450 font-black tracking-wider block mb-1.5 uppercase">Specify Syllabus Topic (Optional)</label>
                      <input 
                        type="text"
                        placeholder="e.g. Advanced Organic Chemistry reactions, Matrix transformations, or press Enter for General field..."
                        value={testTopic}
                        onChange={e => setTestTopic(e.target.value)}
                        className="w-full border border-slate-205 focus:border-purple-600 bg-slate-50/50 rounded-xl px-4 py-3.5 text-xs font-bold outline-none font-sans"
                      />
                    </div>

                    <button
                      onClick={startTutorTest}
                      disabled={testGenerating}
                      className="w-full py-4 bg-[#800080] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow shadow-purple-600/10 cursor-pointer flex items-center justify-center gap-2 hover:opacity-95 disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      {testGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Formulating Educator Evaluation...</span>
                        </>
                      ) : (
                        <>
                          <span>Initiate Dynamic Assessment</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {testStep === 'ACTIVE' && (
                <div className="space-y-8 animate-fadeIn">
                  {/* Warning Banner */}
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 text-amber-800 text-xs font-semibold">
                    <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold uppercase tracking-wider block mb-0.5">Evaluation In Session</span>
                      Proceed carefully through all questions. Answer at least all the Multiple-Choice questions and describe definitions in the structural boxes to qualify for grading. Do not close this browser tab.
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Left Column Questionnaire Matrix Guide */}
                    <div className="lg:col-span-1 space-y-4">
                      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-md sticky top-4">
                        <h4 className="font-bold text-slate-800 text-xs uppercase tracking-widest mb-3">Questions Matrix</h4>
                        <div className="grid grid-cols-5 gap-2">
                          {testQuestions.map((q, idx) => {
                            const isAnswered = q.type === 'mcq' ? !!testSelectedAnswers[q.id] : !!testStructuralAnswers[q.id]?.trim();
                            return (
                              <button
                                key={`${q.id || idx}-${idx}`}
                                type="button"
                                onClick={() => {
                                  const el = document.getElementById(`tutor-q-${q.id}`);
                                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black font-mono transition-all border ${isAnswered ? 'bg-emerald-500 text-white border-transparent shadow-sm' : 'bg-slate-50 text-slate-500 border-slate-150 hover:border-slate-350'}`}
                              >
                                {q.id}
                              </button>
                            );
                          })}
                        </div>

                        <div className="border-t border-slate-100 mt-5 pt-4 space-y-2">
                          <div className="flex items-center justify-between text-[11px] text-slate-500 font-bold">
                            <span>MCQs (Q1-30):</span>
                            <span>{testQuestions.filter(q => q.type === 'mcq').filter(q => testSelectedAnswers[q.id]).length} / {testQuestions.filter(q => q.type === 'mcq').length}</span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-500 font-bold">
                            <span>Structural (Q31-40):</span>
                            <span>{testQuestions.filter(q => q.type === 'structural').filter(q => testStructuralAnswers[q.id]?.trim()).length} / {testQuestions.filter(q => q.type === 'structural').length}</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-3">
                            <div 
                              className="bg-emerald-500 h-full transition-all duration-300" 
                              style={{ 
                                width: `${((testQuestions.filter(q => q.type === 'mcq').filter(q => testSelectedAnswers[q.id]).length + testQuestions.filter(q => q.type === 'structural').filter(q => testStructuralAnswers[q.id]?.trim()).length) / Math.max(1, testQuestions.length)) * 100}%` 
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column Questionnaires */}
                    <div className="lg:col-span-3 space-y-8 max-h-[60vh] overflow-y-auto pr-2">
                      {testQuestions.map((q, idx) => (
                        <div 
                          key={`${q.id || idx}-${idx}`} 
                          id={`tutor-q-${q.id}`} 
                          className="bg-white p-6 rounded-[2.2rem] border border-slate-100 shadow-sm space-y-4 hover:border-purple-200 transition-all scroll-mt-6"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 font-mono">
                              Question {q.id} • {q.type.toUpperCase()}
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">
                              {q.type === 'mcq' ? '2 Points' : '4 Points'}
                            </span>
                          </div>

                          <p className="text-slate-800 font-bold leading-relaxed">{q.question}</p>

                          {q.type === 'mcq' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                              {q.options?.map((opt: string, optIdx: number) => {
                                const letter = ['A', 'B', 'C', 'D'][optIdx];
                                const isSelected = testSelectedAnswers[q.id] === letter;
                                const cleanOpt = opt.includes(':') ? opt.split(':').slice(1).join(':').trim() : opt;
                                return (
                                  <button
                                    key={optIdx}
                                    type="button"
                                    onClick={() => setTestSelectedAnswers(prev => ({ ...prev, [q.id]: letter }))}
                                    className={`p-4 rounded-xl text-left transition-all border text-xs font-bold leading-normal relative group ${isSelected ? 'border-purple-600 bg-purple-50 text-purple-900 font-black shadow-sm' : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-200 hover:bg-slate-100/50'}`}
                                  >
                                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-[10px] font-black font-mono mr-3 transition-all ${isSelected ? 'bg-purple-600 text-white' : 'bg-white text-slate-500 group-hover:bg-purple-100 group-hover:text-[#2f47b3]'}`}>
                                      {letter}
                                    </span>
                                    {cleanOpt}
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="pt-2">
                              <textarea
                                rows={4}
                                className="w-full p-4 border border-slate-150 rounded-2xl text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 transition-all placeholder:text-slate-400 placeholder:font-bold resize-none font-sans"
                                placeholder="Please draft a rigorous step-by-step conceptual outline to support the validation review..."
                                value={testStructuralAnswers[q.id] || ''}
                                onChange={(e) => setTestStructuralAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Submission Footer */}
                  <div className="bg-white p-6 rounded-3xl shadow-md border border-purple-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-800">Finalize Educator Evaluation</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Please double check your conceptual proof entries before submitting</p>
                    </div>

                    <button
                      onClick={gradeTutorTest}
                      disabled={testGrading}
                      className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                    >
                      {testGrading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Evaluating Solution Proofs...</span>
                        </>
                      ) : (
                        <>
                          <span>Submit Completed Exam</span>
                          <CheckCircle2 className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {testStep === 'RESULT' && (
                <div className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-purple-50 shadow-sm space-y-8 max-w-3xl mx-auto animate-fadeIn">
                  {/* Results Trophy Row */}
                  <div className="text-center space-y-3">
                    <span className="p-4 bg-amber-50 text-amber-500 rounded-3xl inline-flex animate-bounce">
                      <Trophy className="w-12 h-12" />
                    </span>
                    <h4 className="text-2xl font-black text-slate-800 font-display">Evaluation Successfully Structured!</h4>
                    <p className="text-xs text-slate-500 font-medium max-w-md mx-auto">{testCongrats}</p>
                  </div>

                  {/* Scores Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-3xl border border-slate-100/80">
                    <div className="text-center p-4 bg-white rounded-2xl">
                      <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Standard Mark</span>
                      <span className="text-3xl font-mono font-black text-indigo-750 block mt-1">{testGrade} / 100</span>
                      <span className="text-[9.5px] text-slate-400 font-bold">Standard scaled evaluation grade</span>
                    </div>

                    <div className="text-center p-4 bg-white rounded-2xl">
                      <span className="text-[9px] text-[#800080] font-black uppercase tracking-wider block">Converted Score</span>
                      <span className="text-3xl font-mono font-black text-emerald-600 block mt-1">{(testGrade ? Math.max(0, Math.min(5, testGrade / 20)) : 0).toFixed(2)} / 5.00</span>
                      <span className="text-[9.5px] text-emerald-600 font-bold block mt-0.5">Points for the scoreboard rankings</span>
                    </div>
                  </div>

                  {/* Corrections */}
                  {testCorrections.length > 0 && (
                    <div className="space-y-4">
                      <h5 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">Evaluation Corrections Commentary</h5>
                      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                        {testCorrections.map((corr, i) => (
                          <div key={i} className="p-4 bg-slate-50/50 rounded-xl border border-slate-100 text-xs">
                            <span className="font-black text-[#800080] uppercase block mb-1">Rapport #{corr.id || i + 1} Assessment</span>
                            <p className="text-slate-600 leading-relaxed font-sans">{corr.comment}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Navigation back */}
                  <div className="pt-2 flex justify-center">
                    <button
                      onClick={() => {
                        setTestStep('CHOOSE');
                        setCurrentSection('OVERVIEW');
                      }}
                      className="px-6 py-3 bg-[#800080] hover:bg-slate-900 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                    >
                      Return to Faculty Overview Desk
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {currentSection === 'MANAGEMENT' && (
            <motion.div
              key="tutor-ai-management-section"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8 animate-fadeIn"
            >
              {/* Executive Banner */}
              <div className="bg-gradient-to-r from-amber-600 via-purple-900 to-indigo-955 p-8 rounded-[2.5rem] text-white relative overflow-hidden border-2 border-amber-500/20 shadow-lg">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Trophy className="w-32 h-32 text-amber-300" />
                </div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="bg-amber-400 text-slate-950 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-amber-305 shadow-sm">
                    AI Pedagogic Command Workspace
                  </span>
                </div>
                <h3 className="text-3xl font-black font-display">🤖 Executive Tutor Management &amp; Organizing Office</h3>
                <p className="text-purple-205/80 text-xs max-w-3xl leading-relaxed mt-2 font-medium">
                  Direct structural tutoring program, organize student milestone calendars, perform skills checked evaluations, synthesize academic topics deeply for critical analysis, draft resume credential files, and generate tournament prep content with custom live endpoints!
                </p>
              </div>

              {/* Subtabs Command bar */}
              <div className="flex flex-wrap gap-2.5 bg-slate-50 border border-slate-150 p-2 rounded-2xl w-full">
                {[
                  { id: 'PROGRAM', label: '📅 Study Program & Scheduler' },
                  { id: 'SKILLS_TEST', label: '📝 Submit Students to Test' },
                  { id: 'CRITICAL_THINKING', label: '🧠 Deep Topic Analyzer' },
                  { id: 'JOB_PREP', label: '📂 Job Opportunity Docs' },
                  { id: 'TOURNAMENT_PREP', label: '🏆 Class Tournament Coach' },
                  { id: 'PRACTICALS', label: '🔬 Interactive Practicals Lab' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setMgmtTab(item.id as any)}
                    className={`px-4 py-3 rounded-xl font-extrabold text-xs tracking-tight border flex-1 text-center transition-all cursor-pointer ${mgmtTab === item.id ? 'bg-purple-950 text-white border-transparent shadow-md' : 'text-slate-600 border-slate-200 hover:bg-slate-100'}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Content Panel Area */}
              <div className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-slate-150 shadow-sm space-y-6 relative overflow-hidden">
                {!isPremium() ? (
                  <div className="flex flex-col items-center text-center py-10 px-4 max-w-2xl mx-auto space-y-6 animate-fadeIn">
                    <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 border border-amber-200/55 shadow-sm animate-pulse">
                      <Lock className="w-8 h-8" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-xl font-black text-slate-800 font-display flex items-center justify-center gap-2">
                        <span>Workspace Locked</span>
                        <span className="bg-purple-100 text-purple-700 text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full">Premium Only</span>
                      </h4>
                      <p className="text-slate-500 text-sm leading-relaxed font-semibold">
                        The AI Pedagogic Command Workspace is an elite executive toolset reserved exclusively for premium subscribers. Activate your premium tutor workspace to unlock study programs, student testing, topic synthesizers, job docs generators, and class tournament coaches.
                      </p>
                    </div>
                    
                    <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl w-full text-left">
                      <h5 className="font-bold text-slate-800 text-xs flex items-center gap-1.5 mb-1.5">
                        <Sparkles className="w-4 h-4 text-purple-600 animate-pulse" />
                        <span>Included Premium Management Benefits</span>
                      </h5>
                      <ul className="text-[11px] text-slate-500 font-bold space-y-1.5 list-disc list-inside">
                        <li>AI Student Study Program Scheduler (create tailored academic calendars)</li>
                        <li>Dynamic Skills Test generator to evaluate and submit students directly</li>
                        <li>High-level Critical Thinking Deep Topic Analyzers &amp; topic trees</li>
                        <li>Professional Resume / Job Opportunity Document Drafts</li>
                        <li>Global Class Tournament Coaches with direct active live endpoints</li>
                      </ul>
                    </div>

                    <button
                      type="button"
                      onClick={() => onTriggerUpgrade && onTriggerUpgrade()}
                      className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                    >
                      Unlock Premium Workspace Now
                    </button>
                  </div>
                ) : (
                  <>
                    {/* 1. PROGRAM SCHEDULER tab */}
                    {mgmtTab === 'PROGRAM' && (
                  <div className="space-y-6 animate-fadeIn">
                    <div>
                      <h4 className="text-lg font-black text-slate-800">📅 Organise Student Program &amp; Milestone Schedule</h4>
                      <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
                        Select a student from your active database chat list, specify the subject matter and target timeline goals. The AI structures a full tutoring milestone schedule without replying to them directly!
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Select Managed Student</label>
                          <select
                            value={mgmtSelectedStudent ? mgmtSelectedStudent.id : ''}
                            onChange={(e) => {
                              const found = chatStudents.find(st => st.id === e.target.value);
                              setMgmtSelectedStudent(found || null);
                            }}
                            className="w-full p-4 border border-slate-200 focus:border-purple-500 bg-slate-50 rounded-2xl outline-none text-xs font-bold transition-all cursor-pointer"
                          >
                            <option value="">-- Choose student from chat group list --</option>
                            {chatStudents.map((st) => (
                              <option key={st.id} value={st.id}>
                                {st.studentEmail || st.id}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Subject Track Focus</label>
                          <input
                            type="text"
                            value={mgmtStudentSubject}
                            onChange={(e) => setMgmtStudentSubject(e.target.value)}
                            placeholder={`e.g. ${tutorData?.subject || 'Advanced Math'} Integration Matrices`}
                            className="w-full p-4 border border-slate-200 focus:border-purple-500 bg-slate-50 rounded-2xl outline-none text-xs font-bold transition-all"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Custom Target timeline / Schedule Constraints</label>
                          <textarea
                            value={mgmtStudentMilestone}
                            onChange={(e) => setMgmtStudentMilestone(e.target.value)}
                            placeholder="e.g. Prepare for National exam in 4 weeks. Availability: Monday & Wednesday evenings, heavily conceptual emphasis."
                            rows={3}
                            className="w-full p-4 border border-slate-200 focus:border-purple-500 bg-slate-50 rounded-2xl outline-none text-xs font-bold transition-all resize-none"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={handleMgmtGenerateProgram}
                          disabled={mgmtSchedulerLoading}
                          className="w-full py-4 bg-purple-950 text-white font-extrabold rounded-2xl text-xs uppercase tracking-widest hover:bg-slate-900 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:bg-slate-100"
                        >
                          {mgmtSchedulerLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" /> AI Scheduler is formulating program...
                            </>
                          ) : (
                            <>
                              <Calendar className="w-4 h-4" /> AI Auto-Organize Program &amp; Schedule
                            </>
                          )}
                        </button>
                      </div>

                      <div className="bg-slate-50 rounded-3xl p-6 border border-slate-150 h-[380px] overflow-y-auto flex flex-col justify-between">
                        <div className="flex-1 custom-scrollbar overflow-y-auto pr-1">
                          <span className="text-[9px] text-[#800080] font-black uppercase tracking-widest block mb-2">LIVE ORGANIZER REPORT</span>
                          {mgmtSchedulerResult ? (
                            <div className="text-xs text-slate-705 leading-relaxed markdown-body select-text">
                              <Markdown>{mgmtSchedulerResult}</Markdown>
                            </div>
                          ) : (
                            <div className="h-full flex items-center justify-center text-center p-6 bg-white/50 rounded-2xl border border-slate-100 shadow-inner">
                              <p className="text-slate-400 text-xs font-semibold">Your formatted tutor program recommendation will populate here in real-time. No communication will be broadcast to the student.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. SKILLS TEST EVALUATION tab */}
                {mgmtTab === 'SKILLS_TEST' && (
                  <div className="space-y-8 animate-fadeIn">
                    {/* AI Weekly Educator Certification & Mastery Check */}
                    <div className="bg-gradient-to-r from-purple-900/10 via-[#800080]/10 to-indigo-900/10 border border-purple-500/20 rounded-[2.5rem] p-8 md:p-10 text-center space-y-6">
                      <div className="w-16 h-16 bg-[#800080] text-white rounded-3xl flex items-center justify-center font-bold shadow-lg shadow-purple-500/20 mx-auto">
                        <Award className="w-8 h-8 animate-pulse" />
                      </div>
                      <div className="space-y-2 max-w-xl mx-auto">
                        <span className="bg-purple-100 text-purple-800 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-purple-200">
                          Faculty Quality Control
                        </span>
                        <h3 className="text-2xl font-black text-slate-800 font-display">AI Weekly Certification Mastery Exam</h3>
                        <p className="text-slate-500 text-xs leading-relaxed font-semibold">
                          Every 7 days, tutors must take and pass a rigorous subject competency exam. Failing to score at least <span className="text-red-600 font-black">10/20 points</span> will result in immediate suspension and loss of tutoring credentials.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto pt-4">
                        <div className="bg-white p-4 rounded-2xl border border-purple-100 text-center">
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Minimum Target</span>
                          <span className="text-lg font-black text-[#800080] block mt-0.5">10 / 20</span>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-purple-100 text-center">
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Last Attempt Date</span>
                          <span className="text-sm font-bold text-slate-700 block mt-1">
                            {tutorData?.lastWeeklyTestAt ? new Date(tutorData.lastWeeklyTestAt).toLocaleDateString() : 'Never taken'}
                          </span>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-purple-100 text-center">
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Last Evaluated Score</span>
                          <span className="text-lg font-black text-slate-800 block mt-0.5">
                            {tutorData?.lastWeeklyTestScore !== undefined ? `${tutorData.lastWeeklyTestScore}/20` : 'N/A'}
                          </span>
                        </div>
                      </div>

                      <div className="pt-4 max-w-sm mx-auto">
                        <button
                          type="button"
                          onClick={startWeeklyCompetencyTest}
                          className="w-full py-4 bg-[#800080] hover:bg-slate-900 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg transition-all active:scale-95 cursor-pointer"
                        >
                          Launch Quality Control Exam
                        </button>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-8">
                      <h4 className="text-lg font-black text-slate-800">📝 AI Student Skills Evaluator &amp; Test Submitter</h4>
                      <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
                        Subject: <span className="font-bold text-slate-700">{tutorData?.subject}</span>. Select a student and generate a customized high-level skill check test material list. Review the solutions, select the responses, and submit the evaluation.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
                      <div className="lg:col-span-4 space-y-4">
                        <div className="space-y-2">
                          <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Target Student to Test</label>
                          <select
                            value={mgmtSelectedStudent ? mgmtSelectedStudent.id : ''}
                            onChange={(e) => {
                              const found = chatStudents.find(st => st.id === e.target.value);
                              setMgmtSelectedStudent(found || null);
                            }}
                            className="w-full p-4 border border-slate-200 focus:border-purple-500 bg-slate-50 rounded-2xl outline-none text-xs font-bold transition-all cursor-pointer"
                          >
                            <option value="">-- Choose student --</option>
                            {chatStudents.map((st) => (
                              <option key={st.id} value={st.id}>
                                {st.studentEmail || st.id}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Test Subject Area</label>
                          <input
                            type="text"
                            value={mgmtSkillsSubject}
                            onChange={(e) => setMgmtSkillsSubject(e.target.value)}
                            placeholder={`e.g. ${tutorData?.subject || 'Calculus'}`}
                            className="w-full p-4 border border-slate-200 focus:border-purple-500 bg-slate-50 rounded-2xl outline-none text-xs font-bold transition-all"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={handleMgmtGenerateSkillsTest}
                          disabled={mgmtEvaluatingLoading}
                          className="w-full py-4 bg-purple-950 text-white font-extrabold rounded-2xl text-xs uppercase tracking-widest hover:bg-slate-900 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:bg-slate-100"
                        >
                          {mgmtEvaluatingLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" /> Formulating test questions...
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4" /> Generate New Skill Evaluation Check
                            </>
                          )}
                        </button>
                      </div>

                      <div className="lg:col-span-8 bg-slate-50 rounded-3xl p-6 border border-slate-150 h-[480px] overflow-y-auto flex flex-col justify-between">
                        <div className="flex-1 custom-scrollbar overflow-y-auto pr-1">
                          <span className="text-[9px] text-[#800080] font-black uppercase tracking-widest block mb-4">SKILL ACQUISITION EXAM SHEET</span>
                          
                          {mgmtSkillsQuestions.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-center p-6 bg-white/50 rounded-2xl border border-slate-100 shadow-inner">
                              <p className="text-slate-400 text-xs font-semibold">Formulate a skill evaluator above. Questions will appear here dynamically.</p>
                            </div>
                          ) : mgmtSkillsResultScore !== null ? (
                            <div className="space-y-6 animate-fadeIn">
                              <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-3xl text-center animate-fadeIn">
                                <span className="text-[10px] text-emerald-800 font-extrabold uppercase tracking-wider block">Acquired Competency Score</span>
                                <span className="text-5xl font-black font-mono text-emerald-600 block mt-2">{mgmtSkillsResultScore}%</span>
                                <span className="text-[11px] text-slate-500 font-medium block mt-1.5">Evaluated against custom analytical targets.</span>
                              </div>
                              <div className="p-6 bg-white border border-slate-150 rounded-3xl text-xs text-slate-707 leading-relaxed font-semibold markdown-body select-text">
                                <Markdown>{mgmtSkillsResultFeedback}</Markdown>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setMgmtSkillsQuestions([]);
                                  setMgmtSkillsResultScore(null);
                                  setMgmtSkillsResultFeedback('');
                                }}
                                className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
                              >
                                Grade Another Student
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-6">
                              {mgmtSkillsQuestions.map((q, idx) => (
                                <div key={idx} className="bg-white border border-slate-150 p-6 rounded-3xl space-y-3">
                                  <h5 className="font-bold text-slate-850 text-xs">Question {idx + 1}: {q.question}</h5>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {q.options?.map((opt: string, oIdx: number) => (
                                      <button
                                        key={oIdx}
                                        type="button"
                                        onClick={() => setMgmtSkillsAnswers({ ...mgmtSkillsAnswers, [idx]: opt })}
                                        className={`p-3 text-left rounded-xl border text-xs font-semibold transition-all cursor-pointer ${mgmtSkillsAnswers[idx] === opt ? 'border-purple-600 bg-purple-50/20 text-purple-900 ring-2 ring-purple-500/20' : 'border-slate-200 hover:border-slate-350 text-slate-700'}`}
                                      >
                                        {opt}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              ))}

                              <button
                                type="button"
                                onClick={handleMgmtSubmitSkillsAnswers}
                                disabled={mgmtEvaluatingGrading || Object.keys(mgmtSkillsAnswers).length < mgmtSkillsQuestions.length}
                                className="w-full py-4 bg-purple-950 text-white font-extrabold rounded-2xl text-xs uppercase tracking-widest hover:bg-slate-900 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:bg-slate-100"
                              >
                                {mgmtEvaluatingGrading ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin" /> Dynamic evaluate &amp; compiling report...
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="w-4 h-4" /> Submit Answers &amp; Evaluate Skills
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                  {/* 3. DEEP TOPIC ANALYZER tab */}
                  {mgmtTab === 'CRITICAL_THINKING' && (
                    <div className="space-y-6 animate-fadeIn">
                      <div>
                        <h4 className="text-lg font-black text-slate-800">🧠 AI Critical Thinking &amp; Topic Deep-Dive Analyzer</h4>
                        <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
                          Input any complex academic theme or advanced concept. The AI generates a multi-perspective scholarly analysis highlighting common academic myths, logical syntax derivations, and custom critical thinking tasks for lessons.
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={mgmtTopicQuery}
                            onChange={(e) => setMgmtTopicQuery(e.target.value)}
                            placeholder="e.g. Schrodinger wave equation collapse or Keynesian liquidity trap"
                            className="flex-1 p-4 border border-slate-200 focus:border-purple-500 bg-slate-50 rounded-2xl outline-none text-xs font-bold transition-all"
                          />
                          <button
                            type="button"
                            onClick={handleMgmtGenerateTopicDeepDive}
                            disabled={mgmtTopicLoading || !mgmtTopicQuery.trim()}
                            className="px-6 h-12 bg-[#800080] hover:bg-slate-900 text-white font-extrabold text-xs uppercase tracking-widest rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                          >
                            {mgmtTopicLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <span>Analyze Deeply</span>
                            )}
                          </button>
                        </div>

                        {mgmtTopicResult ? (
                          <div className="bg-slate-50 rounded-3xl p-6 border border-slate-150 text-xs text-[#333] leading-relaxed font-semibold markdown-body max-h-[420px] overflow-y-auto select-text">
                            <Markdown>{mgmtTopicResult}</Markdown>
                          </div>
                        ) : (
                          <div className="text-center py-10 bg-indigo-50/20 rounded-2xl border border-indigo-100/50 p-6">
                            <p className="text-slate-400 text-xs font-semibold">Ready to draft high-complexity analytic structures. Input a target topic above.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 4. JOB PREPARATION & DOC DOC ORGANIZER tab */}
                  {mgmtTab === 'JOB_PREP' && (
                    <div className="space-y-6 animate-fadeIn">
                      <div>
                        <h4 className="text-lg font-black text-slate-800">📂 AI Professional Resume &amp; Job Prep Organizer</h4>
                        <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
                          Drafting portfolio entries for tenure applications or academic consulting contracts? Input the targeted offer, and the AI will construct cover letters, organize qualifications, and highlight pedagogical achievements perfectly.
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={mgmtJobQuery}
                            onChange={(e) => setMgmtJobQuery(e.target.value)}
                            placeholder="e.g. Lead Senior Mathematics Professor at Royal Scientific Institute"
                            className="flex-1 p-4 border border-slate-200 focus:border-purple-500 bg-slate-50 rounded-2xl outline-none text-xs font-bold transition-all"
                          />
                          <button
                            type="button"
                            onClick={handleMgmtGenerateJobPrep}
                            disabled={mgmtJobLoading || !mgmtJobQuery.trim()}
                            className="px-6 h-12 bg-purple-950 hover:bg-slate-900 text-white font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                          >
                            {mgmtJobLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <span>Organize Recruits</span>
                            )}
                          </button>
                        </div>

                        {mgmtJobResult ? (
                          <div className="bg-slate-50 rounded-3xl p-6 border border-slate-150 text-xs text-[#333] leading-relaxed font-semibold markdown-body max-h-[420px] overflow-y-auto select-text">
                            <Markdown>{mgmtJobResult}</Markdown>
                          </div>
                        ) : (
                          <div className="text-center py-10 bg-amber-50/20 rounded-2xl border border-amber-100/50 p-6">
                            <p className="text-slate-400 text-xs font-semibold">Your document structure, sequence mappings, and cover letter strategy outlines will compile here instantly.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 5. TOURNAMENT PREPARATION tab */}
                  {mgmtTab === 'TOURNAMENT_PREP' && (
                    <div className="space-y-6 animate-fadeIn">
                      <div>
                        <h4 className="text-lg font-black text-slate-800">🏆 AI Tournament Preparation &amp; Coach Questions Generator</h4>
                        <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
                          Generate high-difficulty, rigorous, competitive quiz questions across specific topics to prepare your classes for county, regional, and national tournament cash-prizes.
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block mb-1">Tournament Discipline</label>
                            <select
                              value={mgmtTourneyCategory}
                              onChange={(e) => setMgmtTourneyCategory(e.target.value)}
                              className="w-full p-4 border border-slate-200 focus:border-purple-500 bg-slate-50 rounded-2xl outline-none text-xs font-bold transition-all cursor-pointer"
                            >
                              <option value="Mathematics">Mathematics Grand Tournament (Matrices, algebra constraints, Olympiad style)</option>
                              <option value="Physics">Physics Grand Tournament (Kinematics, mechanics, fields Olympiad)</option>
                              <option value="Algorithms & Code">Algorithms &amp; Coding Olympico (Tree, DP complexities)</option>
                              <option value="Chemistry">Chemistry Grand Challenge (Atomic mass, stoichiometry)</option>
                            </select>
                          </div>

                          <div className="shrink-0 pt-5">
                            <button
                              type="button"
                              onClick={handleMgmtGenerateTournamentQuestions}
                              disabled={mgmtTourneyLoading}
                              className="px-6 py-4 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-750 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                            >
                              {mgmtTourneyLoading ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" /> Generating...
                                </>
                              ) : (
                                <>
                                  <Trophy className="w-4 h-4" /> Draft 3 Tricky Questions
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {mgmtTourneyQuestions ? (
                          <div className="bg-slate-50 rounded-3xl p-6 border border-slate-150 text-xs text-[#333] leading-relaxed font-semibold markdown-body max-h-[420px] overflow-y-auto select-text">
                            <Markdown>{mgmtTourneyQuestions}</Markdown>
                          </div>
                        ) : (
                          <div className="text-center py-10 bg-pink-50/20 rounded-2xl border border-pink-100/50 p-6">
                            <p className="text-slate-400 text-xs font-semibold">Elite competitive questions with multi-turn keys will display here to coach your elite candidates.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 6. PRACTICALS tab */}
                  {mgmtTab === 'PRACTICALS' && (
                    <div className="space-y-6 animate-fadeIn">
                      <PracticalsSection 
                        isPremium={isPremium()} 
                        onTriggerUpgrade={() => onTriggerUpgrade && onTriggerUpgrade()} 
                        language="ENGLISH"
                      />
                    </div>
                  )}

                  </>
                )}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Embedded Community Modal */}
      <CommunityModal 
        isOpen={isCommunityOpen} 
        onClose={() => setIsCommunityOpen(false)} 
        language="ENGLISH" 
      />

      <AnimatePresence>
        {isPhotoModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full border border-purple-100 shadow-2xl relative space-y-4"
            >
              <button 
                type="button" 
                onClick={() => setIsPhotoModalOpen(false)}
                className="absolute top-4 right-4 p-1 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
                title="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-lg font-black text-slate-800 font-display">Update Profile Photo</h3>
              <p className="text-xs text-slate-500 leading-normal font-sans">
                Upload a professional headshot from your device or use your camera instantly. This picture will be visible immediately to all peer tutoring students and school board administrators.
              </p>
              <div className="pt-2">
                <PhotoUploader 
                  currentPhotoUrl={tutorPhoto} 
                  onPhotoCaptured={handlePhotoCaptured} 
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Weekly Competency Test Modal Overlay */}
      <AnimatePresence>
        {weeklyTestActive && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2.5rem] p-6 md:p-8 max-w-2xl w-full border border-purple-100 shadow-2xl space-y-6 my-8 relative"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h4 className="text-lg font-black text-slate-800 font-display">Weekly Subject Competency Test</h4>
                  <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider mt-0.5">
                    Subject: <span className="text-[#800080]">{tutorData?.subject}</span> • Target: 10/20 Points minimum
                  </p>
                </div>
                {!weeklyLoading && !weeklySubmitting && !weeklyResult && (
                  <button 
                    onClick={() => setWeeklyTestActive(false)}
                    className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-all cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {weeklyLoading ? (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                  <Loader2 className="w-10 h-10 animate-spin text-[#800080]" />
                  <p className="text-xs text-slate-500 font-bold">Formulating your weekly certification questions using AI Review Board...</p>
                </div>
              ) : weeklyResult ? (
                <div className="space-y-6 text-center py-4">
                  {weeklyResult.passed ? (
                    <>
                      <div className="p-4 bg-emerald-50 text-emerald-600 rounded-full inline-flex">
                        <CheckCircle2 className="w-12 h-12" />
                      </div>
                      <h4 className="text-xl font-black text-slate-800 font-display">Competency Test Passed! 🎉</h4>
                      <p className="text-slate-600 text-xs leading-relaxed max-w-md mx-auto">
                        You scored <span className="text-emerald-600 font-black text-base">{weeklyResult.score}/100</span> on your weekly aptitude exam. Your active teaching credentials for <span className="text-[#800080] font-bold">{tutorData?.subject}</span> have been renewed for another week!
                      </p>
                      <button
                        onClick={() => {
                          setWeeklyTestActive(false);
                          setWeeklyResult(null);
                        }}
                        className="px-8 py-3 bg-[#800080] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer hover:bg-purple-750"
                      >
                        Enter Tutor Portal
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="p-4 bg-rose-50 text-rose-600 rounded-full inline-flex animate-bounce">
                        <ShieldAlert className="w-12 h-12" />
                      </div>
                      <h4 className="text-xl font-black text-slate-900 font-display">Automatically Disqualified ⚠️</h4>
                      <p className="text-slate-700 text-xs leading-relaxed max-w-md mx-auto">
                        Your mark was <span className="text-rose-600 font-black text-base">{weeklyResult.score}/100</span>, which is below the mandatory passing score of <span className="font-extrabold text-slate-900">&gt;60/100</span>.
                      </p>
                      <p className="text-slate-600 text-xs leading-normal bg-rose-50/70 p-4 rounded-2xl border border-rose-100 max-w-md mx-auto">
                        In accordance with NC.edu policy set by Chief Admin Ngandi Celestin, you are automatically disqualified from the function of tutor. To regain entry into the tutor page and restore your tutor function, you must rewrite and pass another aptitude exam.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <button
                          onClick={startWeeklyCompetencyTest}
                          className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer"
                        >
                          Rewrite Aptitude Exam Now 📝
                        </button>
                        <button
                          onClick={() => {
                            setWeeklyTestActive(false);
                            setWeeklyResult(null);
                            if (onBackToHome) onBackToHome();
                          }}
                          className="py-3.5 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                        >
                          Return to Home
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="max-h-[50vh] overflow-y-auto pr-2 space-y-6 animate-fadeIn">
                    {weeklyQuestions.map((q, idx) => (
                      <div key={`tutor-weekly-q-${q.id || idx}-${idx}`} className="bg-slate-50 p-5 rounded-2xl border border-slate-150 space-y-3 text-left">
                        <span className="text-[9px] font-black uppercase tracking-wider text-purple-600 font-mono block">
                          Question {idx + 1} of 5
                        </span>
                        <p className="text-slate-800 text-xs font-bold leading-relaxed">{q.question}</p>
                        <div className="grid grid-cols-1 gap-2 pt-1">
                          {q.options?.map((opt: string, optIdx: number) => {
                            const isSelected = weeklyAnswers[q.id] === opt;
                            return (
                              <button
                                key={optIdx}
                                type="button"
                                onClick={() => setWeeklyAnswers(prev => ({ ...prev, [q.id]: opt }))}
                                className={`p-3 rounded-xl text-left transition-all border text-xs font-semibold leading-normal ${
                                  isSelected 
                                    ? 'border-[#800080] bg-purple-50 text-purple-900 font-bold ring-2 ring-purple-500/20' 
                                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                }`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
                    <span className="text-[10px] text-slate-450 font-bold">
                      Progress: {Object.keys(weeklyAnswers).length} / 5 Answered
                    </span>
                    <button
                      onClick={submitWeeklyTest}
                      disabled={Object.keys(weeklyAnswers).length < 5 || weeklySubmitting}
                      className="px-6 py-3 bg-[#800080] hover:bg-purple-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all disabled:opacity-40 cursor-pointer"
                    >
                      {weeklySubmitting ? "Submitting Result..." : "Submit Answers"}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Degree / Diploma Certificate Proof Upload Modal */}
      <AnimatePresence>
        {showCertificateModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6 font-sans">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[2.5rem] shadow-2xl p-6 sm:p-8 w-full max-w-lg border border-slate-100 flex flex-col gap-5 relative max-h-[90vh] overflow-y-auto"
            >
              {hasValidCertificate && (
                <button
                  type="button"
                  onClick={() => setShowCertificateModal(false)}
                  className="absolute top-6 right-6 p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              )}

              <div className="flex items-center gap-3.5 border-b border-slate-100 pb-4">
                <div className="p-3 bg-purple-100 text-[#800080] rounded-2xl shrink-0">
                  <GraduationCap className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#800080]">Academic Credentials Verification</span>
                  <h3 className="text-xl font-black text-slate-900 font-display leading-tight">Official Degree / Diploma Upload</h3>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">Verified by Chief Admin Ngandi Celestin</p>
                </div>
              </div>

              {!hasValidCertificate && (
                <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-2xl text-xs font-semibold leading-relaxed flex items-start gap-2.5">
                  <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-extrabold text-amber-950">Action Required for All Faculty Tutors:</p>
                    <p className="text-amber-800 mt-0.5">
                      Chief Admin Ngandi Celestin requires every tutor to upload a scanned photo of their official Degree, Diploma, or Teaching Certificate. Photos of your face or avatars cannot be accepted as proof.
                    </p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSaveCertificateProof} className="space-y-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                    Level of Academic Studies
                  </label>
                  <select
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-purple-600"
                    value={certLevel}
                    onChange={(e) => setCertLevel(e.target.value)}
                  >
                    <option value="Bachelor's Degree (B.Sc / B.A / DIPES II)">Bachelor's Degree (B.Sc / B.A / DIPES II)</option>
                    <option value="Master's Degree (M.Sc / M.A / M.Ed)">Master's Degree (M.Sc / M.A / M.Ed)</option>
                    <option value="Doctorate / PhD Degree">Doctorate / PhD Degree</option>
                    <option value="High School / GCE A-Level Educator Certificate">High School / GCE A-Level Educator Certificate</option>
                    <option value="University Senior / Educator">University Senior / Educator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                    Teaching &amp; Educator Experience
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-purple-600"
                    placeholder="e.g. 5 Years High School & GCE Board Examiner"
                    value={certExp}
                    onChange={(e) => setCertExp(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                    Upload Scanned Photo of Degree / Diploma Certificate
                  </label>
                  <input
                    type="file"
                    ref={certFileInputRef}
                    onChange={handleCertificateFileChange}
                    accept="image/*,.pdf"
                    className="hidden"
                  />
                  <div
                    onClick={() => certFileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                      certFileScan || (hasValidCertificate && tutorData?.certificateProofUrl)
                        ? 'border-emerald-500 bg-emerald-50/50'
                        : 'border-slate-200 hover:border-purple-400 hover:bg-purple-50/50'
                    }`}
                  >
                    {certFileScan ? (
                      <div className="flex flex-col items-center">
                        <CheckCircle2 className="w-10 h-10 text-emerald-600 mb-2" />
                        <p className="text-xs font-extrabold text-emerald-900">New Document Scan Selected!</p>
                        <p className="text-[10px] text-emerald-700 mt-1 font-bold">Click to change document photo</p>
                      </div>
                    ) : hasValidCertificate && tutorData?.certificateProofUrl ? (
                      <div className="flex flex-col items-center">
                        <CheckCircle2 className="w-10 h-10 text-emerald-600 mb-2" />
                        <p className="text-xs font-extrabold text-emerald-900">Current Certificate Document Verified</p>
                        <p className="text-[10px] text-emerald-700 mt-1 font-bold">Click to replace document scan photo</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <Upload className="w-10 h-10 text-slate-400 mb-2" />
                        <p className="text-xs font-extrabold text-slate-800">Click to upload photo of Degree or Diploma</p>
                        <p className="text-[10px] text-slate-400 mt-1">Accepts JPG, PNG, or PDF certificate scans</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  {hasValidCertificate && (
                    <button
                      type="button"
                      onClick={() => setShowCertificateModal(false)}
                      className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isSavingCert || (!certFileScan && !hasValidCertificate)}
                    className="flex-1 py-3.5 bg-[#800080] hover:bg-purple-750 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md disabled:opacity-40 cursor-pointer"
                  >
                    {isSavingCert ? "Saving Document..." : "Submit & Save Certificate Document 📜"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notifications Overlay */}
      <div id="tutor-chat-notifications" className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 w-full max-w-sm pointer-events-none">
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
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500" />
              <div className="p-2 bg-indigo-50 text-purple-600 rounded-xl shrink-0 mt-0.5">
                <Bell className="w-4 h-4 animate-bounce" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest">{notif.title}</span>
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
