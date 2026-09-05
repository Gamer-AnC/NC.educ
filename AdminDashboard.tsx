import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  GraduationCap, 
  Calendar, 
  Award, 
  MessageSquare, 
  Plus, 
  Trash2, 
  LogOut, 
  Search, 
  Briefcase, 
  Clock, 
  ArrowRight, 
  CheckCircle, 
  Check, 
  Send,
  FileSpreadsheet,
  BookOpen,
  X,
  ShieldAlert,
  Key,
  Ban,
  UserCheck,
  Bell,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
  Activity,
  User,
  Pencil
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  setDoc,
  deleteDoc, 
  doc, 
  getDoc,
  updateDoc, 
  serverTimestamp,
  getDocs,
  increment
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import PhotoUploader from './PhotoUploader';
import ScoreboardTable from './ScoreboardTable';
import AdminAnalyticsWidget from './AdminAnalyticsWidget';

interface AdminDashboardProps {
  adminName: string;
  adminEmail?: string;
  adminContact?: string;
  adminPhotoUrl?: string;
  onLogout: () => void;
  onStartAdminCall?: (callData: any) => void;
  activeAdminCall?: any;
  onBackToHome?: () => void;
}

export const NGANDI_ARCHIVE_DOCUMENTS = [
  {
    id: 'doc-1',
    fileName: 'raw_gce_al_maths_p2_2026_draft.pdf',
    defaultTitle: 'Cameroon GCE A-Level Pure Mathematics Paper 2 (2026)',
    type: 'GCE A-Level',
    subject: 'Mathematics',
    year: '2026',
    subsystem: 'ANGLOPHONE',
    difficulty: 'Hard',
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    questions: [
      {
        text: "Evaluate the integral of (3x^2 + 2x) dx from 1 to 3.",
        options: ["32", "34", "36", "38"],
        correctAnswer: "B",
        explanation: "The antiderivative is x^3 + x^2. Evaluated from 1 to 3: (27 + 9) - (1 + 1) = 36 - 2 = 34."
      },
      {
        text: "Determine the sum of the infinite geometric progression 10, 5, 2.5, 1.25, ...",
        options: ["15", "18", "20", "25"],
        correctAnswer: "C",
        explanation: "Using S = a / (1 - r) with a = 10 and r = 0.5, S = 10 / 0.5 = 20."
      },
      {
        text: "Find the general solution of the differential equation dy/dx = 3x^2.",
        options: ["y = x^3 + C", "y = 3x^3 + C", "y = x^2 + C", "y = 6x + C"],
        correctAnswer: "A",
        explanation: "Integrating both sides with respect to x gives y = x^3 + C."
      }
    ]
  },
  {
    id: 'doc-2',
    fileName: 'raw_gce_olevel_physics_p2_2025_draft.pdf',
    defaultTitle: 'Cameroon GCE O-Level Physics Paper 2 (2025)',
    type: 'GCE O-Level',
    subject: 'Physics',
    year: '2025',
    subsystem: 'ANGLOPHONE',
    difficulty: 'Medium',
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    questions: [
      {
        text: "An object of mass 5kg is accelerated at 4 m/s^2. Calculate the net force acting on the object.",
        options: ["10 N", "15 N", "20 N", "25 N"],
        correctAnswer: "C",
        explanation: "Using Newton's Second Law: F = m * a = 5 * 4 = 20 N."
      },
      {
        text: "Which of the following is the SI unit of power?",
        options: ["Joule", "Watt", "Newton", "Pascal"],
        correctAnswer: "B",
        explanation: "Power is defined as energy per unit time, and its SI unit is the Watt (W)."
      },
      {
        text: "What type of wave is sound?",
        options: ["Transverse", "Longitudinal", "Electromagnetic", "Torsional"],
        correctAnswer: "B",
        explanation: "Sound is a mechanical longitudinal wave requiring a medium for transmission."
      }
    ]
  },
  {
    id: 'doc-3',
    fileName: 'bac_serie_d_chimie_2025_draft.pdf',
    defaultTitle: 'Baccalauréat Série D Chimie Organique (2025)',
    type: 'Baccalauréat',
    subject: 'Chemistry',
    year: '2025',
    subsystem: 'FRANCOPHONE',
    difficulty: 'Hard',
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    questions: [
      {
        text: "Quel est le nom de l'alcane possédant 5 atomes de carbone ?",
        options: ["Propane", "Butane", "Pentane", "Hexane"],
        correctAnswer: "C",
        explanation: "Un alcane linéaire à 5 carbones s'appelle le pentane."
      },
      {
        text: "Quelle est la formule semi-développée de l'éthanol ?",
        options: ["CH3-CH3", "CH3-CHO", "CH3-CH2-OH", "CH3-COOH"],
        correctAnswer: "C",
        explanation: "L'éthanol est un alcool à deux atomes de carbone, de formule semi-développée CH3-CH2-OH."
      },
      {
        text: "Quel est le pH d'une solution neutre à 25°C ?",
        options: ["5", "7", "9", "14"],
        correctAnswer: "B",
        explanation: "À 25°C, une solution neutre possède un pH égal à 7."
      }
    ]
  },
  {
    id: 'doc-4',
    fileName: 'gce_alevel_chemistry_p2_2026_draft.pdf',
    defaultTitle: 'Cameroon GCE A-Level Chemistry Inorganic Paper 2 (2026)',
    type: 'GCE A-Level',
    subject: 'Chemistry',
    year: '2026',
    subsystem: 'ANGLOPHONE',
    difficulty: 'Hard',
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    questions: [
      {
        text: "What is the oxidation state of sulfur in H2SO4?",
        options: ["+2", "+4", "+6", "-2"],
        correctAnswer: "C",
        explanation: "2(+1) + S + 4(-2) = 0 => 2 + S - 8 = 0 => S = +6."
      },
      {
        text: "Which of the following elements has the highest electronegativity?",
        options: ["Oxygen", "Fluorine", "Chlorine", "Nitrogen"],
        correctAnswer: "B",
        explanation: "Fluorine is the most electronegative element in the periodic table, with a Pauling value of approximately 4.0."
      }
    ]
  },
  {
    id: 'doc-5',
    fileName: 'bac_serie_c_physique_2026_draft.pdf',
    defaultTitle: 'Baccalauréat Série C Physique Mécanique (2026)',
    type: 'Baccalauréat',
    subject: 'Physics',
    year: '2026',
    subsystem: 'FRANCOPHONE',
    difficulty: 'Expert',
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    questions: [
      {
        text: "Un mobile est animé d'un mouvement rectiligne uniforme. Quelle est la nature de son accélération ?",
        options: ["Nulle", "Constante et positive", "Constante et négative", "Variable"],
        correctAnswer: "A",
        explanation: "Dans un mouvement rectiligne uniforme, la vitesse est constante, donc l'accélération (dérivée de la vitesse) est nulle."
      }
    ]
  },
  {
    id: 'doc-6',
    fileName: 'concours_polytech_yaounde_maths_2026.pdf',
    defaultTitle: 'Concours Polytech Yaoundé Épreuve de Mathématiques (2026)',
    type: 'Concours',
    subject: 'Mathematics',
    year: '2026',
    subsystem: 'ANGLOPHONE',
    difficulty: 'Expert',
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    questions: [
      {
        text: "Trouver la limite de (sin x)/x quand x tend vers 0.",
        options: ["0", "1", "L'infini", "N'existe pas"],
        correctAnswer: "B",
        explanation: "C'est une limite remarquable bien connue en mathématiques, lim_{x->0} (sin x)/x = 1."
      }
    ]
  }
];

export default function AdminDashboard({ 
  adminName, 
  adminEmail = '', 
  adminContact = '', 
  adminPhotoUrl = '', 
  onLogout, 
  onStartAdminCall, 
  activeAdminCall, 
  onBackToHome 
}: AdminDashboardProps) {
  const [currentAdminPhoto, setCurrentAdminPhoto] = useState(adminPhotoUrl);
  
  // Real-time Chat Notifications
  const [chatNotifications, setChatNotifications] = useState<Array<{
    id: string;
    title: string;
    text: string;
    sender: string;
    role: 'student' | 'tutor' | 'admin';
  }>>([]);

  const tutorMsgsInitialLoaded = React.useRef(false);
  const studentMsgsInitialLoaded = React.useRef(false);
  const studentsRef = React.useRef<any[]>([]);
  const tutorsRef = React.useRef<any[]>([]);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

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

    if ("Notification" in window && Notification.permission === "granted") {
      try {
        new Notification(`${title} - From: ${sender}`, {
          body: text,
          icon: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(sender)}`
        });
      } catch (e) {
        console.warn("Error triggering native browser notification:", e);
      }
    }

    setTimeout(() => {
      setChatNotifications(prev => prev.filter(n => n.id !== id));
    }, 5500);
  };

  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'STUDENT' | 'TUTOR' | 'COMMUNITY' | 'FJ_SESSION' | 'SECURITY' | 'MENTOR'>('STUDENT');
  
  // Exam papers management states for Ngandi Celestin
  const [examPapers, setExamPapers] = useState<any[]>([]);
  const [paperTitle, setPaperTitle] = useState('');
  const [paperExamType, setPaperExamType] = useState<'GCE A-Level' | 'GCE O-Level' | 'Baccalauréat' | 'Probatoire' | 'Concours'>('GCE A-Level');
  const [paperSubject, setPaperSubject] = useState('Mathematics');
  const [paperYear, setPaperYear] = useState('2026');
  const [paperSubsystem, setPaperSubsystem] = useState<'ANGLOPHONE' | 'FRANCOPHONE'>('ANGLOPHONE');
  const [paperDifficulty, setPaperDifficulty] = useState<'Easy' | 'Medium' | 'Hard' | 'Expert'>('Hard');
  const [paperPdfUrl, setPaperPdfUrl] = useState('');
  const [paperQuestions, setPaperQuestions] = useState<any[]>([
    { text: '', options: ['', '', '', ''], correctAnswer: '', explanation: '' }
  ]);
  const [isSavingPaper, setIsSavingPaper] = useState(false);

  // Admin Search & Filters for Published Question Banks
  const [adminPaperSearchQuery, setAdminPaperSearchQuery] = useState('');
  const [adminPaperTypeFilter, setAdminPaperTypeFilter] = useState('All');
  const [adminPaperSubjectFilter, setAdminPaperSubjectFilter] = useState('All');
  const [adminPaperSubsystemFilter, setAdminPaperSubsystemFilter] = useState('All');

  // New State variables for Paper Upload / Camera Capture
  const [paperUploadMode, setPaperUploadMode] = useState<'camera' | 'file'>('camera');
  const [selectedArchiveDocId, setSelectedArchiveDocId] = useState<string | null>(null);
  const [mustRenameWarning, setMustRenameWarning] = useState<boolean>(false);
  const [paperCameraStream, setPaperCameraStream] = useState<MediaStream | null>(null);
  const [paperCameraError, setPaperCameraError] = useState('');
  const [paperCameraActive, setPaperCameraActive] = useState(false);
  const [paperUploadedFileName, setPaperUploadedFileName] = useState('');
  const paperVideoRef = useRef<HTMLVideoElement>(null);
  const paperFileRef = useRef<HTMLInputElement>(null);

  // Cleanup camera stream on unmount or mode change
  useEffect(() => {
    return () => {
      if (paperCameraStream) {
        paperCameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [paperCameraStream]);
  
  // Security states for Chief Administrator Ngandi Celestin
  const [viewingCertModal, setViewingCertModal] = useState<{ tutorName: string; certUrl: string; subject: string; level: string } | null>(null);
  const [mentorAnswers, setMentorAnswers] = useState<any[]>([]);
  const [commentsList, setCommentsList] = useState<any[]>([]);
  const [isCommentsReduced, setIsCommentsReduced] = useState<boolean>(false);
  const [newCommentInput, setNewCommentInput] = useState('');
  const [commentAuthorName, setCommentAuthorName] = useState('');
  const [commentAuthorLevel, setCommentAuthorLevel] = useState('');
  const [commentAuthorExperience, setCommentAuthorExperience] = useState('');
  const [commentAuthorRole, setCommentAuthorRole] = useState('admin');
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [adminsList, setAdminsList] = useState<any[]>([]);
  const [adminConfig, setAdminConfig] = useState<{ password?: string; lastUpdatedBy?: string; lastUpdatedMonth?: string }>({});
  const [newAdminPasswordInput, setNewAdminPasswordInput] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isPasswordModalShown, setIsPasswordModalShown] = useState(false);
  const [securityLogs, setSecurityLogs] = useState<any[]>([]);
  
  // Dynamic Security Lists
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [adminTimeSpentList, setAdminTimeSpentList] = useState<any[]>([]);
  const [selectedAuditedAdmin, setSelectedAuditedAdmin] = useState<string | null>(null);
  const [selectedAuditedDate, setSelectedAuditedDate] = useState<string | null>(null);
  const [allowedEmails, setAllowedEmails] = useState<any[]>([]);
  const [newAllowedEmailInput, setNewAllowedEmailInput] = useState('');
  const [isAddingEmail, setIsAddingEmail] = useState(false);
  
  // Real Firestore States
  const [students, setStudents] = useState<any[]>([]);
  const [tutors, setTutors] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [tutorMessages, setTutorMessages] = useState<any[]>([]);
  const [courseRegistrations, setCourseRegistrations] = useState<any[]>([]); // Course registration spreadsheets
  const [lastNotifiedCount, setLastNotifiedCount] = useState(0); // For alert notifications
  const [selectedRegId, setSelectedRegId] = useState<string | null>(null);
  const [searchSpreadsheetQuery, setSearchSpreadsheetQuery] = useState('');
  const [isStartingCall, setIsStartingCall] = useState(false);

  // Spreadsheet row inline editing states
  const [isEditingRowId, setIsEditingRowId] = useState<string | null>(null);
  const [editRegName, setEditRegName] = useState('');
  const [editRegContact, setEditRegContact] = useState('');
  const [editRegEmail, setEditRegEmail] = useState('');
  const [editRegClass, setEditRegClass] = useState('');
  const [editRegCallType, setEditRegCallType] = useState<'app' | 'whatsapp'>('app');
  const [editRegPriceText, setEditRegPriceText] = useState('');
  const [editRegStatus, setEditRegStatus] = useState('');
  
  // Formations & Jobs States
  const [formations, setFormations] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  
  // Edit states for Formations, Tournaments, and Jobs
  const [editingFormation, setEditingFormation] = useState<{ id: string; title: string; description: string; price: string | number } | null>(null);
  const [editingTournament, setEditingTournament] = useState<{ id: string; title: string; dates: string; time: string; stages: string; prizes: string; requiredStudents: string | number } | null>(null);
  const [editingJob, setEditingJob] = useState<{ id: string; title: string; description: string; payout: string } | null>(null);
  
  // Form States for Formations & Jobs
  const [newFormTitle, setNewFormTitle] = useState('');
  const [newFormDesc, setNewFormDesc] = useState('');
  const [newFormPrice, setNewFormPrice] = useState('');
  const [isCreatingFormation, setIsCreatingFormation] = useState(false);

  const [newJobTitle, setNewJobTitle] = useState('');
  const [newJobDesc, setNewJobDesc] = useState('');
  const [newJobPayout, setNewJobPayout] = useState('');
  const [isCreatingJob, setIsCreatingJob] = useState(false);

  // Search/Filters
  const [studentSearch, setStudentSearch] = useState('');
  const [tutorSearch, setTutorSearch] = useState('');
  
  // Active Chat/Communication states
  const [selectedTutorChat, setSelectedTutorChat] = useState<any | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  // Admin student chat states
  const [adminStudentMessages, setAdminStudentMessages] = useState<any[]>([]);
  const [selectedStudentChat, setSelectedStudentChat] = useState<any | null>(null);
  const [studentChatInput, setStudentChatInput] = useState('');
  const [sendingStudentMessage, setSendingStudentMessage] = useState(false);

  // Announcement Event Form State
  const [annTitle, setAnnTitle] = useState('');
  const [annDate, setAnnDate] = useState('');
  const [annDesc, setAnnDesc] = useState('');
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);

  // Tournament Form State
  const [tourTitle, setTourTitle] = useState('');
  const [tourDates, setTourDates] = useState('');
  const [tourTime, setTourTime] = useState('');
  const [tourStages, setTourStages] = useState('');
  const [tourPrizes, setTourPrizes] = useState('');
  const [tourRequired, setTourRequired] = useState('');
  const [isCreatingTournament, setIsCreatingTournament] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Custom Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void | Promise<void>;
    actionType: 'delete' | 'cleanup' | 'ban' | 'warning';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    actionType: 'delete'
  });

  const askConfirmation = (
    title: string,
    message: string,
    onConfirm: () => void | Promise<void>,
    actionType: 'delete' | 'cleanup' | 'ban' | 'warning' = 'delete'
  ) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: async () => {
        try {
          await onConfirm();
        } catch (err: any) {
          console.error("Error in confirmed action:", err);
          setNotification({ message: "Action failed: " + err.message, type: "error" });
          setTimeout(() => setNotification(null), 4000);
        } finally {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      },
      actionType
    });
  };

  // Load Real Data with Firestore Listeners
  useEffect(() => {
    // 1. Students
    const unsubStudents = onSnapshot(collection(db, 'users'), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      
      const uniqueMap: { [email: string]: any } = {};
      data.forEach(student => {
        const emailKey = String(student.email || '').toLowerCase().trim();
        const key = emailKey || student.id;
        
        if (!uniqueMap[key]) {
          uniqueMap[key] = student;
        } else {
          // Keep only the first original one or the one with a smaller studentId
          const existing = uniqueMap[key];
          const currId = Number(student.studentId) || 999999;
          const existId = Number(existing.studentId) || 999999;
          
          if (currId < existId) {
            uniqueMap[key] = student;
          } else if (currId === existId && student.createdAt && existing.createdAt) {
            const currTime = student.createdAt?.seconds || 9999999999;
            const existTime = existing.createdAt?.seconds || 9999999999;
            if (currTime < existTime) {
              uniqueMap[key] = student;
            }
          }
        }
      });
      
      const uniqueStudents = Object.values(uniqueMap);
      studentsRef.current = uniqueStudents;
      setStudents(uniqueStudents);
    });

    // 2. Tutors
    const unsubTutors = onSnapshot(collection(db, 'tutors'), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      tutorsRef.current = data;
      setTutors(data);
    });

    // 3. Community General Events
    const unsubEvents = onSnapshot(collection(db, 'community_events'), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setEvents(data);
    });

    // 4. Tournaments
    const unsubTournaments = onSnapshot(collection(db, 'tournaments'), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setTournaments(data);
    });

    // 5. Participants
    const unsubParticipants = onSnapshot(collection(db, 'tournament_participants'), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setParticipants(data);
    });

    // 6. Tutor Communication Messages
    const unsubMsgs = onSnapshot(collection(db, 'tutor_messages'), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Sort messages by creation time
      const sorted = data.sort((a: any, b: any) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeA - timeB;
      });

      if (tutorMsgsInitialLoaded.current) {
        snap.docChanges().forEach(change => {
          if (change.type === 'added') {
            const msg = change.doc.data() as any;
            if (msg.sender === 'tutor') {
              const tutorObj = tutorsRef.current.find((t: any) => t.id === msg.tutorId || t.userId === msg.tutorId);
              const tutorName = msg.tutorName || (tutorObj ? (tutorObj.fullName || tutorObj.name || tutorObj.email?.split('@')[0] || "Tutor") : "Tutor");
              triggerChatNotification(
                "Admin Received a Tutor Message",
                msg.text || "",
                tutorName,
                "tutor"
              );
            }
          }
        });
      } else {
        tutorMsgsInitialLoaded.current = true;
      }

      setTutorMessages(sorted);
    });

    // 6b. Admin Student Communication Messages
    const unsubAdminStudentMsgs = onSnapshot(collection(db, 'admin_student_messages'), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const sorted = data.sort((a: any, b: any) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeA - timeB;
      });

      if (studentMsgsInitialLoaded.current) {
        snap.docChanges().forEach(change => {
          if (change.type === 'added') {
            const msg = change.doc.data() as any;
            if (msg.sender === 'student') {
              const studentObj = studentsRef.current.find((s: any) => s.id === msg.studentId || s.email?.toLowerCase().trim() === msg.studentEmail?.toLowerCase().trim());
              const studentName = msg.studentName || (studentObj ? (studentObj.fullName || studentObj.name || studentObj.email?.split('@')[0] || "Student") : (msg.studentEmail?.split('@')[0] || "Student"));
              triggerChatNotification(
                "Admin Received a Student Message",
                msg.text || "",
                studentName,
                "student"
              );
            }
          }
        });
      } else {
        studentMsgsInitialLoaded.current = true;
      }

      setAdminStudentMessages(sorted);
    });

    // 7. Formations
    const unsubFormations = onSnapshot(collection(db, 'formations'), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setFormations(data);
    });

    // 8. Jobs
    const unsubJobs = onSnapshot(collection(db, 'jobs'), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setJobs(data);
    });

    // 8b. Course Registrations
    const unsubCourseRegs = onSnapshot(collection(db, 'course_registrations'), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const sorted = data.sort((a: any, b: any) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });
      setCourseRegistrations(sorted);
    });

    // 9. Sync Administrators
    const unsubAdmins = onSnapshot(collection(db, 'admins'), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setAdminsList(data);
    });

    // 10. Sync Config doc
    const unsubAdminConfig = onSnapshot(doc(db, 'admins_config', 'password'), (snap) => {
      if (snap.exists()) {
        setAdminConfig(snap.data() as any);
      }
    });

    // 11. Sync Security messages for Chief Administrator Ngandi Celestin
    let unsubSecurity = () => {};
    let unsubAllowedEmails = () => {};
    let unsubActivityLogs = () => {};
    let unsubMentorAnswers = () => {};
    let unsubAdminTimeSpentList = () => {};
    let unsubComments = () => {};
    let unsubExamPapers = () => {};
    if (adminName.trim().toLowerCase() === 'ngandi celestin') {
      unsubSecurity = onSnapshot(collection(db, 'security_messages'), (snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const sorted = data.sort((a: any, b: any) => {
          const timeA = a.createdAt?.seconds || 0;
          const timeB = b.createdAt?.seconds || 0;
          return timeB - timeA; // newest first
        });
        setSecurityLogs(sorted);
      });

      unsubAllowedEmails = onSnapshot(collection(db, 'allowed_admin_emails'), (snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setAllowedEmails(data);
      });

      unsubActivityLogs = onSnapshot(collection(db, 'admin_activity_logs'), (snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const sorted = data.sort((a: any, b: any) => {
          const timeA = a.updatedAt?.seconds || 0;
          const timeB = b.updatedAt?.seconds || 0;
          return timeB - timeA; // newest first
        });
        setActivityLogs(sorted);
      });

      unsubMentorAnswers = onSnapshot(collection(db, 'mentor_subscription_answers'), (snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const sorted = data.sort((a: any, b: any) => {
          const timeA = a.createdAt?.seconds || a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const timeB = b.createdAt?.seconds || b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return timeB - timeA; // newest first
        });
        setMentorAnswers(sorted);
      });

      unsubComments = onSnapshot(collection(db, 'app_comments'), (snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const sorted = data.sort((a: any, b: any) => {
          const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
          const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
          return timeB - timeA; // newest first
        });
        setCommentsList(sorted);
      });

      unsubAdminTimeSpentList = onSnapshot(collection(db, 'admin_time_spent'), (snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setAdminTimeSpentList(data);
      });

      unsubExamPapers = onSnapshot(collection(db, 'exam_papers'), (snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const sorted = data.sort((a: any, b: any) => {
          const timeA = a.createdAt?.seconds || (a.createdAt ? new Date(a.createdAt).getTime() / 1000 : 0);
          const timeB = b.createdAt?.seconds || (b.createdAt ? new Date(b.createdAt).getTime() / 1000 : 0);
          return timeB - timeA; // newest first
        });
        setExamPapers(sorted);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'exam_papers');
      });
    }

    return () => {
      unsubStudents();
      unsubTutors();
      unsubEvents();
      unsubTournaments();
      unsubParticipants();
      unsubMsgs();
      unsubAdminStudentMsgs();
      unsubFormations();
      unsubJobs();
      unsubCourseRegs();
      unsubAdmins();
      unsubAdminConfig();
      unsubSecurity();
      unsubAllowedEmails();
      unsubActivityLogs();
      unsubMentorAnswers();
      unsubComments();
      unsubAdminTimeSpentList();
      unsubExamPapers();
    };
  }, []);

  // Track time spent by current admin in the app daily
  useEffect(() => {
    if (!adminName) return;
    const safeAdminName = adminName.trim();
    const localDateStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD format
    const docId = `time_${safeAdminName.toLowerCase().replace(/\s+/g, '_')}_${localDateStr}`;
    const docRef = doc(db, 'admin_time_spent', docId);

    const initializeTime = async () => {
      try {
        await setDoc(docRef, {
          adminName: safeAdminName,
          date: localDateStr,
          secondsSpent: increment(0),
          lastActive: serverTimestamp()
        }, { merge: true });
      } catch (err: any) {
        const isOffline = err?.message?.toLowerCase().includes("offline") || err?.message?.toLowerCase().includes("could not reach") || !navigator.onLine;
        if (isOffline) {
          console.warn("Firestore is operating offline. Skipped initializing time tracker.");
        } else {
          console.error("Failed to initialize time tracker:", err);
        }
      }
    };
    initializeTime();

    const trackerInterval = setInterval(async () => {
      try {
        await setDoc(docRef, {
          adminName: safeAdminName,
          date: localDateStr,
          secondsSpent: increment(10),
          lastActive: serverTimestamp()
        }, { merge: true });
      } catch (err: any) {
        const isOffline = err?.message?.toLowerCase().includes("offline") || err?.message?.toLowerCase().includes("could not reach") || !navigator.onLine;
        if (isOffline) {
          console.warn("Firestore is operating offline. Skipped updating active admin time spent.");
        } else {
          console.error("Failed to update active admin time spent:", err);
        }
      }
    }, 10000);

    return () => {
      clearInterval(trackerInterval);
    };
  }, [adminName]);

  const formatSecondsSpent = (totalSeconds: number) => {
    if (!totalSeconds || totalSeconds < 0) return '0s';
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) {
      return `${h}h ${m}m ${s}s`;
    }
    if (m > 0) {
      return `${m}m ${s}s`;
    }
    return `${s}s`;
  };

  const uploadAdminActivity = async (action: string) => {
    try {
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-CA'); // "YYYY-MM-DD"
      const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const docId = `admin_log_${adminName.toLowerCase().replace(/\s+/g, '_')}_${dateStr}`;
      
      const logRef = doc(db, 'admin_activity_logs', docId);
      const logSnap = await getDoc(logRef);
      const activityEntry = `[${timeStr}] ${action}`;

      if (logSnap.exists()) {
        const existingData = logSnap.data();
        const existingActivities = existingData.activities || [];
        await updateDoc(logRef, {
          activities: [...existingActivities, activityEntry],
          updatedAt: serverTimestamp()
        });
      } else {
        await setDoc(logRef, {
          adminName,
          email: adminEmail || localStorage.getItem('nc_admin_email') || '',
          contactNumber: adminContact || localStorage.getItem('nc_admin_phone') || '',
          date: dateStr,
          signInHour: `${dateStr} ${timeStr}`,
          signOutHour: '',
          activities: [activityEntry],
          updatedAt: serverTimestamp()
        });
      }
    } catch (err: any) {
      const isOffline = err?.message?.toLowerCase().includes("offline") || err?.message?.toLowerCase().includes("could not reach") || !navigator.onLine;
      if (isOffline) {
        console.warn("Firestore is operating offline. Skipped uploading admin activity log to cloud.");
      } else {
        console.error("Failed to log admin activity:", err);
      }
    }
  };

  const handleAddAllowedEmail = async () => {
    if (!newAllowedEmailInput.trim()) return;
    setIsAddingEmail(true);
    const emailLower = newAllowedEmailInput.trim().toLowerCase();
    try {
      await setDoc(doc(db, 'allowed_admin_emails', emailLower), {
        email: emailLower,
        addedBy: adminName,
        addedAt: serverTimestamp()
      });
      setNewAllowedEmailInput('');
      uploadAdminActivity(`Added email "${emailLower}" to the approved administrator register.`);
    } catch (err: any) {
      console.error("Failed to add allowed admin email:", err);
    } finally {
      setIsAddingEmail(false);
    }
  };

  const handleRemoveAllowedEmail = async (email: string) => {
    try {
      await deleteDoc(doc(db, 'allowed_admin_emails', email.toLowerCase().trim()));
      uploadAdminActivity(`Removed email "${email}" from the approved administrator register.`);
    } catch (err: any) {
      console.error("Failed to remove allowed admin email:", err);
    }
  };

  useEffect(() => {
    uploadAdminActivity("Signed in successfully to administrative portal.");
    setNotification({
      message: `🔔 Administrator ${adminName} signed in successfully!`,
      type: 'success'
    });
    playNotificationSound();
    let notificationTimer = setTimeout(() => setNotification(null), 6000);

    let isLastHidden = false;

    const handleVisibilityAndUnload = async () => {
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-CA');
      const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const docId = `admin_log_${adminName.toLowerCase().replace(/\s+/g, '_')}_${dateStr}`;

      if (document.visibilityState === 'hidden') {
        if (!isLastHidden) {
          isLastHidden = true;
          try {
            await uploadAdminActivity("Signed out automatically (came out of the app/link).");
            const logRef = doc(db, 'admin_activity_logs', docId);
            const logSnap = await getDoc(logRef);
            if (logSnap.exists()) {
              await updateDoc(logRef, {
                signOutHour: `${dateStr} ${timeStr}`,
                updatedAt: serverTimestamp()
              });
            }
          } catch (err: any) {
            const isOffline = err?.message?.toLowerCase().includes("offline") || err?.message?.toLowerCase().includes("could not reach") || !navigator.onLine;
            if (isOffline) {
              console.warn("Firestore is operating offline. Skipped auto logout logging.");
            } else {
              console.error("Failed auto logout logging:", err);
            }
          }
        }
      } else if (document.visibilityState === 'visible') {
        if (isLastHidden) {
          isLastHidden = false;
          try {
            await uploadAdminActivity("Signed back in automatically (returned to the app/link).");
            const logRef = doc(db, 'admin_activity_logs', docId);
            const logSnap = await getDoc(logRef);
            if (logSnap.exists()) {
              await updateDoc(logRef, {
                signInHour: `${dateStr} ${timeStr}`,
                updatedAt: serverTimestamp()
              });
            }
          } catch (err: any) {
            const isOffline = err?.message?.toLowerCase().includes("offline") || err?.message?.toLowerCase().includes("could not reach") || !navigator.onLine;
            if (isOffline) {
              console.warn("Firestore is operating offline. Skipped auto login logging.");
            } else {
              console.error("Failed auto login logging:", err);
            }
          }
          
          setNotification({
            message: `🔔 Administrator ${adminName} signed back in successfully!`,
            type: 'success'
          });
          playNotificationSound();
          clearTimeout(notificationTimer);
          notificationTimer = setTimeout(() => setNotification(null), 6000);
        }
      }
    };

    const handleUnloadOrPagehide = () => {
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-CA');
      const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const docId = `admin_log_${adminName.toLowerCase().replace(/\s+/g, '_')}_${dateStr}`;
      
      try {
        uploadAdminActivity("Signed out automatically (page closed or navigated away).");
        const logRef = doc(db, 'admin_activity_logs', docId);
        updateDoc(logRef, {
          signOutHour: `${dateStr} ${timeStr}`,
          updatedAt: serverTimestamp()
        }).catch(e => console.error("Unload database write error:", e));
      } catch (e) {
        console.error("Unload handler error:", e);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityAndUnload);
    window.addEventListener('pagehide', handleUnloadOrPagehide);
    window.addEventListener('beforeunload', handleUnloadOrPagehide);

    return () => {
      clearTimeout(notificationTimer);
      document.removeEventListener('visibilitychange', handleVisibilityAndUnload);
      window.removeEventListener('pagehide', handleUnloadOrPagehide);
      window.removeEventListener('beforeunload', handleUnloadOrPagehide);
    };
  }, []);

  const handleExitSession = async () => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-CA');
    const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const docId = `admin_log_${adminName.toLowerCase().replace(/\s+/g, '_')}_${dateStr}`;
    
    try {
      await uploadAdminActivity("Signed out from administrative portal.");
      const logRef = doc(db, 'admin_activity_logs', docId);
      const logSnap = await getDoc(logRef);
      if (logSnap.exists()) {
        await updateDoc(logRef, {
          signOutHour: `${dateStr} ${timeStr}`,
          updatedAt: serverTimestamp()
        });
      }
    } catch (err) {
      console.error("Failed to update sign out hour:", err);
    }
    onLogout();
  };

  // Populate form states when an admin selects a different registration row
  useEffect(() => {
    if (!selectedRegId) {
      setIsEditingRowId(null);
      return;
    }
    const reg = courseRegistrations.find(r => r.id === selectedRegId);
    if (reg) {
      setEditRegName(reg.name || '');
      setEditRegContact(reg.contact || '');
      setEditRegEmail(reg.email || '');
      setEditRegClass(reg.formationTitle || '');
      setEditRegCallType(reg.preferredCallType || 'app');
      setEditRegPriceText(reg.priceText || 'FREE ACCESS');
      setEditRegStatus(reg.status || 'pending');
    }
  }, [selectedRegId, courseRegistrations]);

  // Sync alarms on pending course registrations inside the database
  useEffect(() => {
    const pendings = courseRegistrations.filter(r => r.status === 'pending');
    if (pendings.length > lastNotifiedCount) {
      const newest = pendings[0];
      if (newest) {
        // Simple HTML5 non-blocking audio play or elegant visual notify fallback
        alert(`🔔 SPREADSHEET ALERT: Student "${newest.name}" has registered for course "${newest.formationTitle}"!\n\nEmail: ${newest.email}\nWhatsApp: ${newest.contact}\n\nTheir details have been dynamically plotted in your active admissions spreadsheet!`);
      }
    }
    setLastNotifiedCount(pendings.length);
  }, [courseRegistrations, lastNotifiedCount]);

  // Mark student messages as read when the admin opens their chat
  useEffect(() => {
    if (selectedStudentChat) {
      const studentId = selectedStudentChat.id || selectedStudentChat.userId;
      const studentEmail = selectedStudentChat.email?.toLowerCase().trim();
      const unread = adminStudentMessages.filter(
        m => m.sender === 'student' && 
             !m.openedByAdmin &&
             (m.studentId === studentId || 
              m.studentId === selectedStudentChat.id || 
              m.studentId === selectedStudentChat.userId ||
              (studentEmail && m.studentEmail?.toLowerCase().trim() === studentEmail))
      );
      
      unread.forEach(async (msg) => {
        try {
          await updateDoc(doc(db, 'admin_student_messages', msg.id), {
            openedByAdmin: true
          });
        } catch (err) {
          console.error("Error marking student message as read:", err);
        }
      });
    }
  }, [selectedStudentChat, adminStudentMessages]);

  // Mark tutor messages as read when the admin opens their chat
  useEffect(() => {
    if (selectedTutorChat) {
      const tutorId = selectedTutorChat.id || selectedTutorChat.userId;
      const tutorEmail = selectedTutorChat.email?.toLowerCase().trim();
      const unread = tutorMessages.filter(
        m => m.sender === 'tutor' && 
             !m.openedByAdmin &&
             (m.tutorId === tutorId || 
              m.tutorId === selectedTutorChat.id || 
              m.tutorId === selectedTutorChat.userId ||
              (tutorEmail && m.tutorEmail?.toLowerCase().trim() === tutorEmail))
      );
      
      unread.forEach(async (msg) => {
        try {
          await updateDoc(doc(db, 'tutor_messages', msg.id), {
            openedByAdmin: true
          });
        } catch (err) {
          console.error("Error marking tutor message as read:", err);
        }
      });
    }
  }, [selectedTutorChat, tutorMessages]);

  const runDatabaseCleanup = async () => {
    askConfirmation(
      "Run DB Security Cleanup?",
      "This will scan the complete 'users' collection for duplicate email addresses and permanently remove duplicate student accounts that have newer secondary ID numbers, preserving only the original ID. Proceed?",
      async () => {
        setCleaning(true);
        try {
          const rawRes = await getDocs(collection(db, 'users'));
          const allDocs = rawRes.docs.map(doc => ({ docId: doc.id, ...doc.data() as any }));
          
          // Group by lowercase email
          const groups: { [email: string]: any[] } = {};
          allDocs.forEach(item => {
            const email = String(item.email || '').toLowerCase().trim();
            if (email) {
              if (!groups[email]) groups[email] = [];
              groups[email].push(item);
            }
          });
          
          let deletedCount = 0;
          let logBuffer = "";
          
          for (const email of Object.keys(groups)) {
            const list = groups[email];
            if (list.length > 1) {
              // Sort by studentId ascending to find the smallest/oldest student ID is first
              list.sort((a, b) => {
                const idA = Number(a.studentId) || 999999;
                const idB = Number(b.studentId) || 999999;
                return idA - idB;
              });
              
              const canonical = list[0];
              const duplicates = list.slice(1);
              
              for (const dup of duplicates) {
                await deleteDoc(doc(db, 'users', dup.docId));
                deletedCount++;
                logBuffer += `Removed duplicate ID STU-${dup.studentId} for email ${email} (Preserved STU-${canonical.studentId})\n`;
              }
            }
          }
          
          if (deletedCount > 0) {
            setNotification({
              message: `🧹 Database Cleanup Complete! Successfully removed ${deletedCount} duplicate student records. Details: ${logBuffer}`,
              type: 'success'
            });
            setTimeout(() => setNotification(null), 8000);
          } else {
            setNotification({
              message: "✨ Awesome! No duplicate email addresses found in the database. Clean condition validated!",
              type: 'success'
            });
            setTimeout(() => setNotification(null), 4000);
          }
        } catch (err: any) {
          setNotification({ message: "Error cleaning database: " + err.message, type: 'error' });
          setTimeout(() => setNotification(null), 4000);
        } finally {
          setCleaning(false);
        }
      },
      'cleanup'
    );
  };

  // Filter students based on ID, email, name, or tutor search input
  const filteredStudents = students.filter(student => {
    const term = studentSearch.toLowerCase().trim();
    if (!term) return true;
    const idStr = String(student.studentId || '').toLowerCase();
    const emailStr = String(student.email || '').toLowerCase();
    const nameStr = String(student.fullName || student.name || '').toLowerCase();
    const tutorNameStr = String(student.tutorName || '').toLowerCase();
    const tutorEmailStr = String(student.tutorEmail || '').toLowerCase();
    return (
      idStr.includes(term) || 
      emailStr.includes(term) || 
      nameStr.includes(term) || 
      tutorNameStr.includes(term) || 
      tutorEmailStr.includes(term)
    );
  });

  // Filter tutors based on search
  const filteredTutors = tutors.filter(t => {
    const term = tutorSearch.toLowerCase();
    const codeStr = String(t.tutorCode || '').toLowerCase();
    const subStr = String(t.subject || '').toLowerCase();
    const emailStr = String(t.email || '').toLowerCase();
    return codeStr.includes(term) || subStr.includes(term) || emailStr.includes(term);
  });

  const handleDeleteComment = (commentId: string) => {
    askConfirmation(
      "Delete Comment?",
      "Are you sure you want to permanently delete this comment from the community feed? This action is irreversible.",
      async () => {
        try {
          await deleteDoc(doc(db, 'app_comments', commentId));
          setNotification({ message: "Comment deleted successfully!", type: 'success' });
        } catch (err) {
          console.error("Error deleting comment:", err);
          setNotification({ message: "Failed to delete comment.", type: 'error' });
        }
      },
      'delete'
    );
  };

  const handleAdminPostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentInput.trim()) return;
    try {
      setIsPostingComment(true);
      await addDoc(collection(db, 'app_comments'), {
        authorName: commentAuthorName.trim() || "NC Administrator",
        authorRole: commentAuthorRole || "admin",
        authorLevel: commentAuthorLevel.trim() || "",
        authorExperience: commentAuthorExperience.trim() || "",
        authorEmail: "maelngandi@gmail.com",
        content: newCommentInput.trim(),
        createdAt: new Date(),
        likes: 0,
        likedBy: []
      });
      setNewCommentInput('');
      setCommentAuthorName('');
      setCommentAuthorLevel('');
      setCommentAuthorExperience('');
      setCommentAuthorRole('admin');
      setNotification({ message: "Comment posted to community hub successfully!", type: 'success' });
    } catch (err) {
      console.error("Error posting admin comment:", err);
      setNotification({ message: "Failed to post comment.", type: 'error' });
    } finally {
      setIsPostingComment(false);
    }
  };

  // Camera & File Upload helpers for Exam Papers
  const startPaperCamera = async () => {
    setPaperCameraError('');
    setPaperCameraActive(true);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: 'environment' }, // environment facing for paper documents!
        audio: false
      });
      setPaperCameraStream(mediaStream);
      if (paperVideoRef.current) {
        paperVideoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error("Camera access failed:", err);
      setPaperCameraError('Could not access device camera. Please upload file instead.');
      setPaperCameraActive(false);
    }
  };

  const stopPaperCamera = () => {
    if (paperCameraStream) {
      paperCameraStream.getTracks().forEach(track => track.stop());
      setPaperCameraStream(null);
    }
    setPaperCameraActive(false);
  };

  const capturePaperPhoto = () => {
    if (paperVideoRef.current) {
      const video = paperVideoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.80); // compress at 80% jpeg quality
        
        // compress and set
        compressAndSetPaperImage(dataUrl, 'captured_sheet_photo.jpg');
      }
      stopPaperCamera();
    }
  };

  const generateMockQuestionsForSubject = (subject: string, examType: string) => {
    const subNormalized = subject.toLowerCase();
    if (subNormalized.includes('math')) {
      return [
        {
          text: `Evaluate the limit: lim (x -> 2) of (x² - 4) / (x - 2).`,
          options: ['2', '4', '0', 'Undefined'],
          correctAnswer: '4',
          explanation: 'Factor the numerator as (x-2)(x+2). Cancel out the (x-2) term, leaving (x+2). Plugging in x=2 gives 2+2 = 4.'
        },
        {
          text: `Find the derivative of the function f(x) = 3x² + 5x - 7.`,
          options: ['6x + 5', '3x + 5', '6x', '6x² + 5'],
          correctAnswer: '6x + 5',
          explanation: 'Apply the power rule d/dx(x^n) = n*x^(n-1). Thus, d/dx(3x²) = 6x and d/dx(5x) = 5.'
        },
        {
          text: `Solve for x in the equation: ln(x) + ln(2) = ln(10).`,
          options: ['5', '8', '12', '2'],
          correctAnswer: '5',
          explanation: 'Using the logarithmic product rule: ln(2x) = ln(10). Therefore, 2x = 10, which yields x = 5.'
        }
      ];
    } else if (subNormalized.includes('phys')) {
      return [
        {
          text: `What force is required to accelerate a 4 kg object at 3 m/s²?`,
          options: ['12 N', '7 N', '1.33 N', '0.75 N'],
          correctAnswer: '12 N',
          explanation: 'Using Newton\'s Second Law: F = m * a. Therefore, F = 4 kg * 3 m/s² = 12 N.'
        },
        {
          text: `A 2 kg mass is raised to a height of 5 meters. Calculate its Gravitational Potential Energy (take g = 9.8 m/s²).`,
          options: ['98 J', '19.6 J', '49 J', '10 J'],
          correctAnswer: '98 J',
          explanation: 'Potential Energy (PE) = m * g * h = 2 * 9.8 * 5 = 98 Joules.'
        },
        {
          text: `According to Ohm's Law, if a 12V potential difference is applied across a 4 ohm resistor, what is the current?`,
          options: ['3 A', '48 A', '0.33 A', '8 A'],
          correctAnswer: '3 A',
          explanation: 'Ohm\'s Law states V = I * R, so I = V / R = 12V / 4 ohms = 3 Amperes.'
        }
      ];
    } else if (subNormalized.includes('chem')) {
      return [
        {
          text: `What is the pH of a 0.001 M solution of nitric acid (HNO₃), assuming complete dissociation?`,
          options: ['3', '2', '7', '11'],
          correctAnswer: '3',
          explanation: 'Since HNO₃ is a strong acid, [H⁺] = 0.001 M. pH = -log[H⁺] = -log(10⁻³) = 3.'
        },
        {
          text: `Which gas is liberated at the anode during the electrolysis of acidified water?`,
          options: ['Oxygen', 'Hydrogen', 'Chlorine', 'Nitrogen'],
          correctAnswer: 'Oxygen',
          explanation: 'In the electrolysis of water, oxidation occurs at the anode, releasing Oxygen gas, while reduction occurs at the cathode releasing Hydrogen gas.'
        },
        {
          text: `Identify the main organic product when Ethanol is heated with excess concentrated sulfuric acid at 170°C.`,
          options: ['Ethene', 'Ethane', 'Diethyl ether', 'Ethyl hydrogen sulfate'],
          correctAnswer: 'Ethene',
          explanation: 'Concentrated H₂SO₄ at 170°C acts as a dehydrating agent, converting Ethanol (C₂H₅OH) into Ethene (C₂H₄) via elimination.'
        }
      ];
    } else if (subNormalized.includes('bio')) {
      return [
        {
          text: `Which cellular organelle is responsible for aerobic respiration and ATP generation?`,
          options: ['Mitochondria', 'Chloroplast', 'Ribosome', 'Lysosome'],
          correctAnswer: 'Mitochondria',
          explanation: 'Mitochondria contain the enzymes for the Krebs cycle and electron transport chain, making them the primary site of ATP generation (powerhouse).'
        },
        {
          text: `In genetics, what is the phenotypic ratio of a cross between two heterozygous plants (Tt x Tt)?`,
          options: ['3:1', '1:2:1', '9:3:3:1', '1:1'],
          correctAnswer: '3:1',
          explanation: 'The genotypes are TT, Tt, Tt, tt. Since T is dominant, TT and Tt have the dominant phenotype (3), and tt has the recessive phenotype (1).'
        },
        {
          text: `Which of the following blood vessels carries oxygenated blood from the lungs to the left atrium?`,
          options: ['Pulmonary vein', 'Pulmonary artery', 'Aorta', 'Vena cava'],
          correctAnswer: 'Pulmonary vein',
          explanation: 'The pulmonary veins are unique because they carry oxygenated blood from the lungs back to the heart (left atrium).'
        }
      ];
    } else if (subNormalized.includes('computer') || subNormalized.includes('code') || subNormalized.includes('info')) {
      return [
        {
          text: `What is the average time complexity of searching for an element in a balanced Binary Search Tree?`,
          options: ['O(log n)', 'O(n)', 'O(n log n)', 'O(1)'],
          correctAnswer: 'O(log n)',
          explanation: 'Each comparison in a balanced BST discards half of the tree, giving a logarithmic complexity of O(log n).'
        },
        {
          text: `In a relational database, which key uniquely identifies a record in a table?`,
          options: ['Primary Key', 'Foreign Key', 'Composite Key', 'Candidate Key'],
          correctAnswer: 'Primary Key',
          explanation: 'A Primary Key enforces entity integrity by uniquely identifying each row/record in a database table without duplicates.'
        },
        {
          text: `Which of the following layer in the OSI model is responsible for routing packets across networks?`,
          options: ['Network Layer', 'Transport Layer', 'Data Link Layer', 'Physical Layer'],
          correctAnswer: 'Network Layer',
          explanation: 'The Network Layer (Layer 3) handles packet routing, logical addressing (IP), and path determination.'
        }
      ];
    } else {
      return [
        {
          text: `What is the primary benefit of evaluating official past examination papers systematically?`,
          options: ['Mastering the core national curriculum structure', 'Bypassing school attendance completely', 'Memorizing essay word-for-word', 'Avoiding practical experiments'],
          correctAnswer: 'Mastering the core national curriculum structure',
          explanation: 'Past papers align students directly with the official Cameroon national syllabus assessment standards, optimizing revision outcomes.'
        },
        {
          text: `Which active method ensures excellent comprehension when solving competitive multiple choice questions?`,
          options: ['Systematic elimination of options and step-by-step proof validation', 'Reading only the question and guessing', 'Choosing Option A always', 'Skipping explanations entirely'],
          correctAnswer: 'Systematic elimination of options and step-by-step proof validation',
          explanation: 'Comprehensive analysis of incorrect options paired with pedagogical proof leads to 95%+ conceptual mastery.'
        },
        {
          text: `How does the integrated NC.edu AI Academic Coach help students during exam paper preparation?`,
          options: ['Providing real-time interactive mentoring and instant verified answers', 'Writing the official examination in place of the student', 'Discouraging critical thinking', 'Withholding correct solutions'],
          correctAnswer: 'Providing real-time interactive mentoring and instant verified answers',
          explanation: 'Our elite AI Coach walks students through complex concepts step-by-step, building solid analytical confidence for high-stakes examinations.'
        }
      ];
    }
  };

  const autoPopulateFromFileName = (fileName: string) => {
    const cleanFileName = fileName.replace(/\.[^/.]+$/, ""); // remove extension
    let guessedTitle = cleanFileName
      .replace(/[_-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    guessedTitle = guessedTitle.split(' ').map(word => {
      if (['a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'on', 'in', 'at', 'to', 'by', 'of'].includes(word.toLowerCase())) {
        return word.toLowerCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');

    let guessedExamType: 'GCE A-Level' | 'GCE O-Level' | 'Baccalauréat' | 'Probatoire' | 'Concours' = 'GCE A-Level';
    if (/gce\s*a\s*level|advanced\s*level|a-level|alevel/i.test(fileName)) {
      guessedExamType = 'GCE A-Level';
    } else if (/gce\s*o\s*level|ordinary\s*level|o-level|olevel/i.test(fileName)) {
      guessedExamType = 'GCE O-Level';
    } else if (/baccalauréat|baccalaureat|bac/i.test(fileName)) {
      guessedExamType = 'Baccalauréat';
    } else if (/probatoire|prob/i.test(fileName)) {
      guessedExamType = 'Probatoire';
    } else if (/concours|entree|entrée/i.test(fileName)) {
      guessedExamType = 'Concours';
    }

    let guessedSubsystem: 'ANGLOPHONE' | 'FRANCOPHONE' = 'ANGLOPHONE';
    if (guessedExamType === 'Baccalauréat' || guessedExamType === 'Probatoire' || /french|francophone|français|francais/i.test(fileName)) {
      guessedSubsystem = 'FRANCOPHONE';
    }

    let guessedSubject = 'Mathematics';
    const subjects = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'History', 'French', 'English', 'Computer Science', 'Geology', 'Philosophy', 'Economics', 'Geography'];
    for (const sub of subjects) {
      const regex = new RegExp(sub.replace(/\s+/g, '\\s*'), 'i');
      if (regex.test(fileName)) {
        guessedSubject = sub;
        break;
      }
    }
    if (/math/i.test(fileName)) guessedSubject = 'Mathematics';
    else if (/phys/i.test(fileName)) guessedSubject = 'Physics';
    else if (/chem|chim/i.test(fileName)) guessedSubject = 'Chemistry';
    else if (/bio/i.test(fileName)) guessedSubject = 'Biology';
    else if (/hist/i.test(fileName)) guessedSubject = 'History';
    else if (/fren|français|francais/i.test(fileName)) guessedSubject = 'French';
    else if (/angl|engl/i.test(fileName)) guessedSubject = 'English';
    else if (/computer|coding|info|informatique/i.test(fileName)) guessedSubject = 'Computer Science';
    else if (/geol/i.test(fileName)) guessedSubject = 'Geology';
    else if (/philo/i.test(fileName)) guessedSubject = 'Philosophy';
    else if (/eco/i.test(fileName)) guessedSubject = 'Economics';
    else if (/geog/i.test(fileName)) guessedSubject = 'Geography';

    let guessedYear = '2026';
    const yearMatch = fileName.match(/\b(20[12][0-9])\b/);
    if (yearMatch) {
      guessedYear = yearMatch[1];
    }

    setPaperTitle(guessedTitle);
    setPaperExamType(guessedExamType);
    setPaperSubject(guessedSubject);
    setPaperYear(guessedYear);
    setPaperSubsystem(guessedSubsystem);
    setPaperDifficulty('Hard');

    // Generate high-quality mock questions automatically!
    const mockQs = generateMockQuestionsForSubject(guessedSubject, guessedExamType);
    setPaperQuestions(mockQs);

    setNotification({
      message: `Parsed "${fileName}" successfully! Auto-filled details & generated corrections. Ready to publish.`,
      type: 'success'
    });
    setTimeout(() => setNotification(null), 4000);
  };

  const compressAndSetPaperImage = (base64Str: string, fileName: string) => {
    if (base64Str.startsWith('data:application/pdf')) {
      if (base64Str.length > 950000) { // roughly 700KB binary
        setNotification({ 
          message: "PDF is too large for database sync. Please keep PDF files under 700KB, or take a photo of the sheet.", 
          type: 'error' 
        });
        setTimeout(() => setNotification(null), 6000);
        return;
      }
      setPaperPdfUrl(base64Str);
      setPaperUploadedFileName(fileName);
      autoPopulateFromFileName(fileName);
      return;
    }

    // It's an image, let's compress it dynamically to stay well under 1MB Firestore limit
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 1000; // 1000px width is perfect for reading text and keeping document small
      const MAX_HEIGHT = 1000;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        // Compress as JPEG with 0.70 quality to keep it ~80KB-120KB
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.70);
        console.log(`Compressed image from ${base64Str.length} chars to ${compressedBase64.length} chars`);
        setPaperPdfUrl(compressedBase64);
        setPaperUploadedFileName(fileName);
        autoPopulateFromFileName(fileName);
        setNotification({ message: "Exam paper sheet processed & compressed successfully!", type: 'success' });
        setTimeout(() => setNotification(null), 3000);
      }
    };
  };

  const handlePaperFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          compressAndSetPaperImage(reader.result, file.name);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Select document from Ngandi Celestin's Archive Vault
  const handleSelectArchiveDoc = (doc: any) => {
    setSelectedArchiveDocId(doc.id);
    setPaperTitle(doc.defaultTitle);
    setPaperExamType(doc.type);
    setPaperSubject(doc.subject);
    setPaperYear(doc.year);
    setPaperSubsystem(doc.subsystem);
    setPaperDifficulty(doc.difficulty);
    setPaperPdfUrl(doc.pdfUrl);
    setPaperQuestions(doc.questions || [{ text: '', options: ['', '', '', ''], correctAnswer: '', explanation: '' }]);
    setMustRenameWarning(true);
    setNotification({ message: `Sourced '${doc.fileName}' successfully! Please rename the title below so students see your custom title on the portal.`, type: "success" });
    setTimeout(() => setNotification(null), 6000);
  };

  // Exam papers publishing handler for Chief Administrator Ngandi Celestin
  const handleSaveExamPaper = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = paperTitle.trim();
    if (!cleanTitle) {
      setNotification({ message: "Chief Administrator Ngandi Celestin: Please enter or rename the paper title before publishing.", type: "error" });
      setTimeout(() => setNotification(null), 4000);
      return;
    }
    if (!paperPdfUrl.trim()) {
      setNotification({ message: "Please take a photo or browse a file for the exam paper before publishing.", type: "error" });
      setTimeout(() => setNotification(null), 4000);
      return;
    }

    // Auto-detect exam topic/section based on the title given by Ngandi Celestin
    const titleUpper = cleanTitle.toUpperCase();
    let autoCategory: string = paperExamType;

    if (titleUpper.includes("GCE A/L") || titleUpper.includes("GCE A-LEVEL") || titleUpper.includes("GCE A LEVEL") || titleUpper.includes("GCE ADVANCED") || titleUpper.includes("A-LEVEL") || titleUpper.includes("A/L")) {
      autoCategory = "GCE A-Level";
    } else if (titleUpper.includes("GCE O/L") || titleUpper.includes("GCE O-LEVEL") || titleUpper.includes("GCE O LEVEL") || titleUpper.includes("GCE ORDINARY") || titleUpper.includes("O-LEVEL") || titleUpper.includes("O/L")) {
      autoCategory = "GCE O-Level";
    } else if (titleUpper.includes("BACCALAUREAT") || titleUpper.includes("BACCALAURÉAT") || titleUpper.includes("BAC")) {
      autoCategory = "Baccalauréat";
    } else if (titleUpper.includes("PROBATOIRE") || titleUpper.includes("PROB")) {
      autoCategory = "Probatoire";
    } else if (titleUpper.includes("CONCOURS") || titleUpper.includes("POLYTECH") || titleUpper.includes("ENAM") || titleUpper.includes("CUSS")) {
      autoCategory = "Concours";
    } else if (titleUpper.includes("MOCK")) {
      autoCategory = "Mock";
    } else if (cleanTitle.length <= 25) {
      autoCategory = cleanTitle;
    }

    setIsSavingPaper(true);
    try {
      const newPaperPayload = {
        title: cleanTitle,
        type: autoCategory,
        subject: paperSubject,
        year: paperYear,
        subsystem: paperSubsystem,
        difficulty: paperDifficulty,
        pdfUrl: paperPdfUrl.trim(),
        questions: [],
        publisher: "Ngandi Celestin",
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'exam_papers'), newPaperPayload);
      setNotification({ 
        message: `Exam paper "${cleanTitle}" published under section "${autoCategory}" on the student portal!`, 
        type: "success" 
      });
      setTimeout(() => setNotification(null), 5000);

      // Reset form
      setPaperTitle('');
      setPaperPdfUrl('');
      setPaperUploadedFileName('');
      setSelectedArchiveDocId(null);
      setMustRenameWarning(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'exam_papers');
    } finally {
      setIsSavingPaper(false);
    }
  };

  const handleDeleteExamPaper = async (paperId: string) => {
    askConfirmation(
      "Delete Exam Paper?",
      "Are you sure you want to permanently delete this exam paper? Students will no longer be able to access it.",
      async () => {
        try {
          await deleteDoc(doc(db, 'exam_papers', paperId));
          setNotification({ message: "Exam paper deleted successfully.", type: "success" });
          setTimeout(() => setNotification(null), 4000);
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, `exam_papers/${paperId}`);
        }
      },
      "delete"
    );
  };

  const handleQuestionTextChange = (index: number, text: string) => {
    setPaperQuestions(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], text };
      return copy;
    });
  };

  const handleOptionChange = (qIndex: number, optIndex: number, val: string) => {
    setPaperQuestions(prev => {
      const copy = [...prev];
      const opts = [...copy[qIndex].options];
      opts[optIndex] = val;
      copy[qIndex] = { ...copy[qIndex], options: opts };
      return copy;
    });
  };

  const handleCorrectAnswerChange = (qIndex: number, val: string) => {
    setPaperQuestions(prev => {
      const copy = [...prev];
      copy[qIndex] = { ...copy[qIndex], correctAnswer: val };
      return copy;
    });
  };

  const handleExplanationChange = (qIndex: number, val: string) => {
    setPaperQuestions(prev => {
      const copy = [...prev];
      copy[qIndex] = { ...copy[qIndex], explanation: val };
      return copy;
    });
  };

  const addQuestionField = () => {
    setPaperQuestions(prev => [...prev, { text: '', options: ['', '', '', ''], correctAnswer: '', explanation: '' }]);
  };

  const removeQuestionField = (index: number) => {
    if (paperQuestions.length <= 1) return;
    setPaperQuestions(prev => prev.filter((_, idx) => idx !== index));
  };

  // Calculate stats
  const studentsCount = students.length;
  
  // Group tutors count by subject
  const tutorsBySubject = tutors.reduce((acc: any, curr) => {
    const sub = curr.subject || 'General';
    acc[sub] = (acc[sub] || 0) + 1;
    return acc;
  }, {});

  // Handle Event submit
  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annDesc.trim() || !annDate.trim()) {
      setNotification({ message: "Please fill in all general event fields.", type: "error" });
      return;
    }
    setSendingMessage(true);
    try {
      await addDoc(collection(db, 'community_events'), {
        title: annTitle.trim(),
        date: annDate,
        desc: annDesc.trim(),
        createdAt: new Date().toISOString()
      });
      await uploadAdminActivity(`Created announcement/event: "${annTitle.trim()}"`);
      setAnnTitle('');
      setAnnDate('');
      setAnnDesc('');
      setIsCreatingEvent(false);
      setNotification({
        message: '🚨 Community Event post created & broadcasted successfully!',
        type: 'success'
      });
      // Clear after 6 seconds
      setTimeout(() => setNotification(null), 6000);
    } catch (err: any) {
      setNotification({ message: 'Error creating event: ' + err.message, type: 'error' });
    } finally {
      setSendingMessage(false);
    }
  };

  // Delete an event
  const handleDeleteEvent = async (id: string) => {
    askConfirmation(
      "Confirm Announcement/Event Removal?",
      "Are you sure you want to permanently delete this event and remove it live from all student dashboards?",
      async () => {
        try {
          await deleteDoc(doc(db, 'community_events', id));
          await uploadAdminActivity(`Deleted announcement/event with ID: ${id}`);
          setNotification({ message: "⛔ Community Event was deleted successfully.", type: "success" });
          setTimeout(() => setNotification(null), 3000);
        } catch (err: any) {
          setNotification({ message: "Error deleting: " + err.message, type: "error" });
          setTimeout(() => setNotification(null), 3000);
        }
      },
      'delete'
    );
  };

  // Handle Tournament create
  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    const slots = parseInt(tourRequired, 10);
    if (!tourTitle.trim() || !tourDates.trim() || !tourTime.trim() || !tourStages.trim() || !tourPrizes.trim() || isNaN(slots) || slots <= 0) {
      setNotification({ message: "Please fill in all tournament fields with valid values.", type: "error" });
      return;
    }

    setSendingMessage(true);
    try {
      await addDoc(collection(db, 'tournaments'), {
        title: tourTitle.trim(),
        dates: tourDates.trim(),
        time: tourTime.trim(),
        stages: tourStages.trim(),
        prizes: tourPrizes.trim(),
        requiredStudents: slots,
        registeredCount: 0,
        status: 'active',
        createdAt: new Date().toISOString()
      });
      await uploadAdminActivity(`Created tournament: "${tourTitle.trim()}"`);
      
      setTourTitle('');
      setTourDates('');
      setTourTime('');
      setTourStages('');
      setTourPrizes('');
      setTourRequired('');
      setIsCreatingTournament(false);
      setNotification({
        message: '🏆 Tournament created & broadcasted to academic portal successfully!',
        type: 'success'
      });
      setTimeout(() => setNotification(null), 6000);
    } catch (err: any) {
      setNotification({ message: 'Error creating tournament: ' + err.message, type: 'error' });
    } finally {
      setSendingMessage(false);
    }
  };

  // Delete Tournament
  const handleDeleteTournament = async (id: string) => {
    askConfirmation(
      "Confirm Tournament Destruction?",
      "Are you sure you want to delete this tournament? This will wipe associated participant registrations too.",
      async () => {
        try {
          await deleteDoc(doc(db, 'tournaments', id));
          // clean up associated participants
          const targets = participants.filter(p => p.tournamentId === id);
          for (const t of targets) {
            await deleteDoc(doc(db, 'tournament_participants', t.id));
          }
          await uploadAdminActivity(`Deleted tournament with ID: ${id} and all related participants`);
          setNotification({ message: "⛔ Tournament and participants vanished successfully.", type: "success" });
          setTimeout(() => setNotification(null), 3000);
        } catch (err: any) {
          setNotification({ message: 'Error: ' + err.message, type: 'error' });
          setTimeout(() => setNotification(null), 3000);
        }
      },
      'delete'
    );
  };

  // Delete Registered User Doc from db (Admin Privilege) & BAN
  const handleDeleteUser = async (id: string, email: string, isTutor: boolean = false) => {
    askConfirmation(
      `Ban & Purge ${isTutor ? 'Tutor' : 'Student'}?`,
      `Are you sure you want to permanently delete and BAN ${isTutor ? 'tutor' : 'user'} "${email || id}" from this application? They will immediately receive a message stating they have been banned from the app.`,
      async () => {
        try {
          const banEmails: string[] = [];
          
          if (email) {
            banEmails.push(email.toLowerCase().trim());
          }
          
          // Also look up studentId in our current list of students to find credential email
          const studentInfo = students.find(s => s.id === id || (email && s.email?.toLowerCase().trim() === email.toLowerCase().trim()));
          if (studentInfo && studentInfo.studentId) {
            banEmails.push(`student_${studentInfo.studentId}@nc.edu`.toLowerCase().trim());
          }
          
          // Additionally check if id matches a simulated numeric format or extract ID
          if (id && id.startsWith('simulated_student_')) {
            const extractedEmail = id.replace('simulated_', '').replace(/_/g, '.').replace('.nc.edu', '@nc.edu').toLowerCase().trim();
            banEmails.push(extractedEmail);
          }

          // Apply banned entries for each computed email
          for (const banE of banEmails) {
            if (banE) {
              await setDoc(doc(db, 'banned_users', banE), {
                email: banE,
                bannedAt: new Date().toISOString(),
                status: "banned"
              });
            }
          }

          // Perform Firestore deletions
          await deleteDoc(doc(db, 'users', id));
          await deleteDoc(doc(db, 'tutors', id));
          await uploadAdminActivity(`Banned & deleted user ${email || id} (isTutor: ${isTutor})`);
          
          setNotification({ message: `⛔ Account ${email || id} successfully deleted & banned.`, type: "success" });
          setTimeout(() => setNotification(null), 3000);
        } catch (err: any) {
          setNotification({ message: 'Error deleting user: ' + err.message, type: 'error' });
          setTimeout(() => setNotification(null), 3000);
        }
      },
      'ban'
    );
  };

  // --- Formations CRUD ---
  const handleCreateFormation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFormTitle.trim() || !newFormDesc.trim() || !newFormPrice.trim()) {
      alert("Please fill in all formation details including price.");
      return;
    }
    try {
      setIsCreatingFormation(true);
      await addDoc(collection(db, 'formations'), {
        title: newFormTitle.trim(),
        description: newFormDesc.trim(),
        price: parseFloat(newFormPrice) || 0,
        createdAt: new Date().toISOString()
      });
      await uploadAdminActivity(`Created formation/course: "${newFormTitle.trim()}"`);
      setNewFormTitle('');
      setNewFormDesc('');
      setNewFormPrice('');
      setNotification({ message: "🎓 New Professional Formation has been successfully cataloged!", type: "success" });
    } catch (err: any) {
      alert('Error creating formation: ' + err.message);
    } finally {
      setIsCreatingFormation(false);
    }
  };

  const handleDeleteFormation = async (id: string, title: string) => {
    askConfirmation(
      "Confirm Formation Removal?",
      `Are you sure you want to permanently delete formation "${title}"? This will vanish instantly from student views.`,
      async () => {
        try {
          await deleteDoc(doc(db, 'formations', id));
          await uploadAdminActivity(`Deleted formation/course: "${title}" (ID: ${id})`);
          setNotification({ message: "⛔ Formation removed from student catalog.", type: "success" });
          setTimeout(() => setNotification(null), 3000);
        } catch (err: any) {
          setNotification({ message: 'Error: ' + err.message, type: 'error' });
          setTimeout(() => setNotification(null), 3000);
        }
      },
      'delete'
    );
  };

  // --- Jobs CRUD ---
  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJobTitle.trim() || !newJobDesc.trim() || !newJobPayout.trim()) {
      alert("Please fill in all job vacancy details.");
      return;
    }
    try {
      setIsCreatingJob(true);
      await addDoc(collection(db, 'jobs'), {
        title: newJobTitle.trim(),
        description: newJobDesc.trim(),
        payout: newJobPayout.trim(),
        createdAt: new Date().toISOString()
      });
      await uploadAdminActivity(`Created job vacancy advertisement: "${newJobTitle.trim()}"`);
      setNewJobTitle('');
      setNewJobDesc('');
      setNewJobPayout('');
      setNotification({ message: "💼 New Tutor Job Position has been successfully advertised!", type: "success" });
    } catch (err: any) {
      alert('Error creating job: ' + err.message);
    } finally {
      setIsCreatingJob(false);
    }
  };

  const handleDeleteJob = async (id: string, title: string) => {
    askConfirmation(
      "Withdraw Job Opportunity?",
      `Are you sure you want to withdraw job position "${title}"?`,
      async () => {
        try {
          await deleteDoc(doc(db, 'jobs', id));
          await uploadAdminActivity(`Deleted job vacancy: "${title}" (ID: ${id})`);
          setNotification({ message: "⛔ Job vacancy withdrawn successfully.", type: "success" });
          setTimeout(() => setNotification(null), 3000);
        } catch (err: any) {
          setNotification({ message: 'Error: ' + err.message, type: 'error' });
          setTimeout(() => setNotification(null), 3000);
        }
      },
      'delete'
    );
  };

  // --- Update Broadcasted Formations, Tournaments & Jobs ---
  const handleUpdateFormation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFormation) return;
    if (!editingFormation.title.trim() || !editingFormation.description.trim()) {
      alert("Please fill in formation title and description.");
      return;
    }
    try {
      await updateDoc(doc(db, 'formations', editingFormation.id), {
        title: editingFormation.title.trim(),
        description: editingFormation.description.trim(),
        price: parseFloat(String(editingFormation.price)) || 0,
        updatedAt: new Date().toISOString()
      });
      await uploadAdminActivity(`Updated formation/course: "${editingFormation.title.trim()}"`);
      setEditingFormation(null);
      setNotification({ message: "🎓 Formation updated & broadcasted successfully!", type: "success" });
      setTimeout(() => setNotification(null), 3000);
    } catch (err: any) {
      alert('Error updating formation: ' + err.message);
    }
  };

  const handleUpdateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTournament) return;
    const slots = parseInt(String(editingTournament.requiredStudents), 10);
    if (!editingTournament.title.trim() || !editingTournament.dates.trim() || !editingTournament.time.trim() || !editingTournament.stages.trim() || !editingTournament.prizes.trim() || isNaN(slots) || slots <= 0) {
      setNotification({ message: "Please fill in all tournament fields with valid values.", type: "error" });
      return;
    }
    try {
      await updateDoc(doc(db, 'tournaments', editingTournament.id), {
        title: editingTournament.title.trim(),
        dates: editingTournament.dates.trim(),
        time: editingTournament.time.trim(),
        stages: editingTournament.stages.trim(),
        prizes: editingTournament.prizes.trim(),
        requiredStudents: slots,
        updatedAt: new Date().toISOString()
      });
      await uploadAdminActivity(`Updated broadcasted tournament: "${editingTournament.title.trim()}"`);
      setEditingTournament(null);
      setNotification({ message: "🏆 Tournament broadcast updated successfully!", type: "success" });
      setTimeout(() => setNotification(null), 3000);
    } catch (err: any) {
      setNotification({ message: 'Error updating tournament: ' + err.message, type: 'error' });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleUpdateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJob) return;
    if (!editingJob.title.trim() || !editingJob.description.trim() || !editingJob.payout.trim()) {
      alert("Please fill in all job details.");
      return;
    }
    try {
      await updateDoc(doc(db, 'jobs', editingJob.id), {
        title: editingJob.title.trim(),
        description: editingJob.description.trim(),
        payout: editingJob.payout.trim(),
        updatedAt: new Date().toISOString()
      });
      await uploadAdminActivity(`Updated job vacancy advertisement: "${editingJob.title.trim()}"`);
      setEditingJob(null);
      setNotification({ message: "💼 Job position updated & broadcasted successfully!", type: "success" });
      setTimeout(() => setNotification(null), 3000);
    } catch (err: any) {
      alert('Error updating job: ' + err.message);
    }
  };

  // Close tournament registration manually
  const toggleTournamentStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'closed' : 'active';
    try {
      await updateDoc(doc(db, 'tournaments', id), {
        status: nextStatus
      });
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  // Send communication message from Admin to Tutor
  const handleSendTutorMsg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedTutorChat) return;

    const tutorId = selectedTutorChat.userId || selectedTutorChat.id;
    const adminMsgText = chatInput.trim();
    setChatInput('');

    try {
      // Create message from admin
      await addDoc(collection(db, 'tutor_messages'), {
        tutorId: tutorId,
        sender: 'admin',
        text: adminMsgText,
        createdAt: { seconds: Math.floor(Date.now() / 1000) }
      });
      await uploadAdminActivity(`Sent message to tutor "${tutorId}"`);
    } catch (error: any) {
      alert('Error sending message: ' + error.message);
    }
  };

  const handleSendStudentMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const studentId = selectedStudentChat?.userId || selectedStudentChat?.id;
    if (!studentChatInput.trim() || !studentId) return;

    setSendingStudentMessage(true);
    const adminMsgText = studentChatInput.trim();
    setStudentChatInput('');

    try {
      await addDoc(collection(db, 'admin_student_messages'), {
        studentId: studentId,
        studentEmail: selectedStudentChat?.email || '',
        sender: 'admin',
        text: adminMsgText,
        createdAt: { seconds: Math.floor(Date.now() / 1000) }
      });
      await uploadAdminActivity(`Sent message to student "${studentId}"`);
    } catch (error: any) {
      alert('Error sending message: ' + error.message);
    } finally {
      setSendingStudentMessage(false);
    }
  };

  const handleUpdateAdminPhoto = async (newPhotoDataUrl: string) => {
    setCurrentAdminPhoto(newPhotoDataUrl);
    const normalized = adminName.toLowerCase().replace(/\s+/g, '_');
    try {
      await updateDoc(doc(db, 'admins', normalized), {
        photoUrl: newPhotoDataUrl
      });
      await uploadAdminActivity("Updated administration profile photograph.");
    } catch (err) {
      console.error("Error keeping admin photo in sync:", err);
    }
  };

  const getCurrentYearMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

  const currentMonth = getCurrentYearMonth();
  const needsPasswordUpdate = adminName.trim().toLowerCase() === 'ngandi celestin' && adminConfig.lastUpdatedMonth !== currentMonth;

  const handleUpdateAdminPassword = async (newPassword: string) => {
    if (!newPassword.trim()) {
      alert("Password cannot be blank.");
      return;
    }
    setIsUpdatingPassword(true);
    try {
      await setDoc(doc(db, 'admins_config', 'password'), {
        password: newPassword.trim(),
        lastUpdatedBy: adminName.trim(),
        lastUpdatedMonth: currentMonth
      });
      await uploadAdminActivity(`Rotated master security password to: "${newPassword.trim()}" for the month ${currentMonth}`);

      setNotification({
        message: `Administrative security password successfully rotated for ${currentMonth}!`,
        type: 'success'
      });
      setNewAdminPasswordInput('');
      setIsPasswordModalShown(true); // dismiss/completed
    } catch (err: any) {
      console.error("Failed to update password:", err);
      alert("Error rotating administrative password: " + err.message);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleToggleBlockAdmin = async (adminId: string, currentBlocked: boolean) => {
    if (adminName.trim().toLowerCase() !== 'ngandi celestin') {
      setNotification({
        message: "Unauthorized: Only Chief Administrator Ngandi Celestin can manage security blocks.",
        type: 'error'
      });
      setTimeout(() => setNotification(null), 4000);
      return;
    }
    if (adminId === 'ngandi_celestin') {
      setNotification({
        message: "Error: Chief Administrator Ngandi Celestin cannot be blocked.",
        type: 'error'
      });
      setTimeout(() => setNotification(null), 4000);
      return;
    }

    askConfirmation(
      currentBlocked ? "Unblock Admin Access" : "Block Admin Access",
      `Are you sure you want to ${currentBlocked ? 'unblock' : 'block'} administrative access for account '${adminId.replace(/_/g, ' ').toUpperCase()}'?`,
      async () => {
        await updateDoc(doc(db, 'admins', adminId), {
          isBlocked: !currentBlocked
        });
        await uploadAdminActivity(`${!currentBlocked ? 'Blocked' : 'Unblocked'} administrative access for account: "${adminId}"`);
        setNotification({
          message: `Admin account '${adminId.replace(/_/g, ' ').toUpperCase()}' has been ${!currentBlocked ? 'BLOCKED' : 'UNBLOCKED'} successfully.`,
          type: 'success'
        });
        setTimeout(() => setNotification(null), 4000);
      },
      currentBlocked ? 'warning' : 'ban'
    );
  };

  const handleRemoveAdminDefinitely = (adminId: string, name: string, email: string) => {
    if (adminName.trim().toLowerCase() !== 'ngandi celestin') {
      setNotification({
        message: "Unauthorized: Only Chief Administrator Ngandi Celestin can ban administrators.",
        type: 'error'
      });
      setTimeout(() => setNotification(null), 4000);
      return;
    }
    if (adminId === 'ngandi_celestin' || name.trim().toLowerCase() === 'ngandi celestin') {
      setNotification({
        message: "Error: Chief Administrator Ngandi Celestin cannot be banned or removed.",
        type: 'error'
      });
      setTimeout(() => setNotification(null), 4000);
      return;
    }

    askConfirmation(
      "Confirm Definitive Ban",
      `Are you absolutely sure you want to PERMANENTLY remove and BAN administrator "${name.toUpperCase()}"? This will block their name/email and revoke their registration definitely.`,
      async () => {
        // 1. Write the banned record to Firestore
        await setDoc(doc(db, 'banned_admins', adminId), {
          name: name,
          email: email || '',
          bannedAt: serverTimestamp(),
          bannedBy: adminName
        });
        
        // 2. Delete the administrator's account document reference from "admins" collection
        await deleteDoc(doc(db, 'admins', adminId));
        await uploadAdminActivity(`Banned and deleted admin account: "${name}" (${email || 'no email'})`);

        setNotification({
          message: `Admin account '${name.toUpperCase()}' has been permanently REMOVED and banned.`,
          type: 'success'
        });
        setTimeout(() => setNotification(null), 4000);
      },
      'ban'
    );
  };

  // Get chat messages filtered for selected tutor
  const activeChatLogs = tutorMessages.filter(m => m.tutorId === (selectedTutorChat?.userId || selectedTutorChat?.id));

  const totalStudentUnread = adminStudentMessages.filter(
    m => m.sender === 'student' && 
         !m.openedByAdmin &&
         (!selectedStudentChat || (
           m.studentId !== selectedStudentChat.id && 
           m.studentId !== selectedStudentChat.userId && 
           (!selectedStudentChat.email || m.studentEmail?.toLowerCase().trim() !== selectedStudentChat.email?.toLowerCase().trim())
         )) &&
         students.some(s => s.id === m.studentId || s.userId === m.studentId || (s.email && m.studentEmail && s.email.toLowerCase().trim() === m.studentEmail.toLowerCase().trim()))
  ).length;

  const totalTutorUnread = tutorMessages.filter(
    m => m.sender === 'tutor' && 
         !m.openedByAdmin &&
         (!selectedTutorChat || (
           m.tutorId !== selectedTutorChat.id && 
           m.tutorId !== selectedTutorChat.userId && 
           (!selectedTutorChat.email || m.tutorEmail?.toLowerCase().trim() !== selectedTutorChat.email?.toLowerCase().trim())
         )) &&
         tutors.some(t => t.id === m.tutorId || t.userId === m.tutorId || (t.email && m.tutorEmail && t.email.toLowerCase().trim() === m.tutorEmail.toLowerCase().trim()))
  ).length;

  return (
    <div id="admin-root-dashboard" className="min-h-screen bg-[#f7f6f9] font-sans pb-16 flex flex-col text-[#1e1a38]">
      {/* Dynamic Navigation Header */}
      <header className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white py-6 px-8 shadow-xl flex flex-col sm:flex-row items-center justify-between sticky top-0 z-40 gap-4">
        <div className="flex items-center gap-3">
          <div 
            onClick={() => setIsPhotoModalOpen(true)}
            className="w-12 h-12 rounded-xl overflow-hidden border-2 border-indigo-400 group relative cursor-pointer shadow shrink-0"
            title="Configure admin photo"
          >
            <img 
              src={currentAdminPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${adminName}`} 
              alt="Admin Profile" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <span className="text-[8px] text-white font-black uppercase tracking-wide">Edit</span>
            </div>
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">NC.edu <span className="font-light opacity-85 text-sm">Control Tower</span></h1>
            <p className="text-xs text-blue-300 font-semibold tracking-wide uppercase">Officer: {adminName}</p>
          </div>
        </div>

        {/* Synchronized Core Navigation Tabs */}
        <div id="admin-nav-tabs" className="bg-white/10 p-1 rounded-2xl flex border border-white/10 shrink-0 flex-wrap">
          {(
            adminName.trim().toLowerCase() === 'ngandi celestin'
              ? (['STUDENT', 'TUTOR', 'COMMUNITY', 'FJ_SESSION', 'SECURITY', 'MENTOR'] as const)
              : (['STUDENT', 'TUTOR', 'COMMUNITY', 'FJ_SESSION'] as const)
          ).map(tab => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setSelectedTutorChat(null);
              }}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs tracking-wider uppercase transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === tab 
                  ? 'bg-white text-slate-950 shadow-md scale-105' 
                  : 'text-white/80 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab === 'STUDENT' && (
                <div className="relative">
                  <Users className="w-3.5 h-3.5" />
                  {totalStudentUnread > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                    </span>
                  )}
                </div>
              )}
              {tab === 'TUTOR' && (
                <div className="relative">
                  <GraduationCap className="w-3.5 h-3.5" />
                  {totalTutorUnread > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                    </span>
                  )}
                </div>
              )}
              {tab !== 'STUDENT' && tab !== 'TUTOR' && tab === 'COMMUNITY' && <Calendar className="w-3.5 h-3.5" />}
              {tab !== 'STUDENT' && tab !== 'TUTOR' && tab === 'FJ_SESSION' && <Briefcase className="w-3.5 h-3.5" />}
              {tab !== 'STUDENT' && tab !== 'TUTOR' && tab === 'SECURITY' && <ShieldAlert className="w-3.5 h-3.5" />}
              {tab !== 'STUDENT' && tab !== 'TUTOR' && tab === 'MENTOR' && <Award className="w-3.5 h-3.5" />}
              <span>{tab === 'FJ_SESSION' ? 'F&J SESSION' : tab === 'SECURITY' ? 'SECURITY' : tab === 'MENTOR' ? 'MENTOR' : `${tab} SESSION`}</span>

              {tab === 'STUDENT' && totalStudentUnread > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-[9px] bg-rose-500 text-white rounded-full font-black animate-pulse">
                  {totalStudentUnread}
                </span>
              )}
              {tab === 'TUTOR' && totalTutorUnread > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-[9px] bg-rose-500 text-white rounded-full font-black animate-pulse">
                  {totalTutorUnread}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Return to home page button */}
        {onBackToHome && (
          <button
            onClick={onBackToHome}
            className="px-4 py-2 bg-white/5 hover:bg-white/15 text-slate-200 hover:text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-all border border-white/10 cursor-pointer shadow-sm"
          >
            Return to home page
          </button>
        )}

        {/* Exit Admin Portal */}
        <button
          onClick={handleExitSession}
          className="px-4 py-2 bg-rose-600/10 hover:bg-rose-600 text-rose-300 hover:text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-all border border-rose-500/20 cursor-pointer shadow-sm shadow-rose-950/20"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Exit Session</span>
        </button>
      </header>

      {/* Main Admin Wrapper */}
      <main className="max-w-7xl w-full mx-auto px-6 py-10 flex-1 flex flex-col gap-8">
        
        {/* Dynamic Action Notification Toast banner */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -20 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -20 }}
              className={`p-5 rounded-[1.5rem] flex items-center justify-between border shadow-lg ${
                notification.type === 'success' 
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-100 shadow-emerald-900/5' 
                  : 'bg-rose-50 text-rose-900 border-rose-100 shadow-rose-900/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{notification.type === 'success' ? '✨' : '⚠️'}</span>
                <div>
                  <p className="font-extrabold text-[#111] text-sm tracking-tight">{notification.message}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">Broadcasting to live Firestore collections (community_events / tournaments)</p>
                </div>
              </div>
              <button 
                onClick={() => setNotification(null)}
                className={`text-[11px] font-black tracking-wide uppercase px-3 py-1.5 rounded-lg border ${
                  notification.type === 'success' 
                    ? 'border-emerald-200 hover:bg-emerald-100/50 text-emerald-700' 
                    : 'border-rose-250 hover:bg-rose-100/50 text-rose-700'
                } transition-all cursor-pointer`}
              >
                Dismiss
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* TAB 1: STUDENT SESSION */}
        <AnimatePresence mode="wait">
          {activeTab === 'STUDENT' && (
            <motion.div
              key="student-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="flex flex-col gap-6"
            >
              {/* Stats Bar */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5">
                  <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Registered Students</span>
                    <span className="text-3xl font-extrabold text-slate-900">{studentsCount}</span>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5">
                  <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center text-green-600">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Premium Members</span>
                    <span className="text-3xl font-extrabold text-slate-900">
                      {students.filter(student => {
                        if (student.subscriptionEndsAt) {
                          const endMs = student.subscriptionEndsAt.seconds 
                            ? student.subscriptionEndsAt.seconds * 1000 
                            : new Date(student.subscriptionEndsAt).getTime();
                          return Date.now() < endMs;
                        }
                        return false;
                      }).length}
                    </span>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5">
                  <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Comments & Inquiries</span>
                    <span className="text-3xl font-extrabold text-slate-900">
                      {students.filter(s => s.comment && s.comment.trim() !== '').length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Operations Control Tower Analytics */}
              {adminName.trim().toLowerCase() === 'ngandi celestin' && (
                <AdminAnalyticsWidget 
                  students={students}
                  tutors={tutors}
                  courseRegistrations={courseRegistrations}
                />
              )}

              {/* Real-time Academic Leaderboard */}
              <div>
                <ScoreboardTable isAdminView={true} />
              </div>

              {/* Excel Table Area and Chat Portal */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className={`${selectedStudentChat ? 'lg:col-span-8' : 'lg:col-span-12'} flex flex-col gap-6`}>
                  <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                <div className="p-6 md:p-8 bg-slate-55 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                      <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                      STUDENT ACCOUNTS SPREADSHEET (Live Sync)
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">Verify registered names, IDs, email addresses, and real-time student feedback comments.</p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                    <button
                      onClick={runDatabaseCleanup}
                      disabled={cleaning}
                      className="w-full sm:w-auto px-4 py-2.5 bg-indigo-50 hover:bg-slate-900 text-indigo-700 hover:text-white font-extrabold border border-indigo-150 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs uppercase tracking-wider disabled:opacity-50"
                    >
                      {cleaning ? "Deduplicating..." : "🛠️ Deduplicate Database"}
                    </button>

                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search ID, email..."
                        value={studentSearch}
                        onChange={e => setStudentSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl text-xs font-bold transition-all outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-[10px] font-extrabold tracking-wider uppercase border-b border-slate-100">
                        <th className="py-4 px-6 text-center w-24">ACTIONS</th>
                        <th className="py-4 px-6 text-center w-24">ROW #</th>
                        <th className="py-4 px-6">STUDENT ID</th>
                        <th className="py-4 px-6">EMAIL ADDRESS</th>
                        <th className="py-4 px-6">TUTOR / REFERRAL</th>
                        <th className="py-4 px-6">COMMENTS & FEEDBACK REVIEW</th>
                        <th className="py-4 px-6">MEMBERSHIP</th>
                        <th className="py-4 px-6 text-right">DATE REGISTERED</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
                      {filteredStudents.length > 0 ? (
                        filteredStudents.map((student, index) => (
                          <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-4 px-6 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setSelectedStudentChat(student)}
                                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                    selectedStudentChat?.id === student.id
                                      ? 'bg-indigo-600 text-white'
                                      : 'hover:bg-indigo-50 text-indigo-500 hover:text-indigo-700'
                                  }`}
                                  title="Send Message/Chat with Student"
                                >
                                  <MessageSquare className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteUser(student.id, student.email)}
                                  className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-500 hover:text-rose-700 transition-colors cursor-pointer"
                                  title="Delete User Permanently"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                            <td className="py-4 px-6 text-center text-slate-400 font-mono font-bold border-r border-slate-100 bg-slate-50/20">{index + 1}</td>
                            <td className="py-4 px-6 font-mono font-bold text-blue-600 block-inline bg-blue-50/20 rounded-lg px-2 text-center">
                              {student.studentId ? `STU-${student.studentId}` : 'STU-GUEST'}
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-2">
                                <div>
                                  <span className="font-semibold text-slate-900 block">
                                    {student.fullName || student.name || student.email?.split('@')[0]}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-normal font-mono">{student.email}</span>
                                </div>
                                {(() => {
                                  const isSelected = selectedStudentChat && (
                                    selectedStudentChat.id === student.id || 
                                    selectedStudentChat.userId === student.id ||
                                    (student.email && selectedStudentChat.email?.toLowerCase().trim() === student.email.toLowerCase().trim())
                                  );
                                  const unreadCount = adminStudentMessages.filter(
                                    m => m.sender === 'student' && 
                                         !m.openedByAdmin &&
                                         (m.studentId === student.id || 
                                          m.studentId === student.userId || 
                                          (student.email && m.studentEmail?.toLowerCase().trim() === student.email.toLowerCase().trim()))
                                  ).length;
                                  return unreadCount > 0 && !isSelected ? (
                                    <span className="ml-2 bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-bounce shrink-0 shadow-sm" title={`${unreadCount} unread messages`}>
                                      {unreadCount}
                                    </span>
                                  ) : null;
                                })()}
                              </div>
                            </td>
                            <td className="py-4 px-6 min-w-[200px]">
                              {student.tutorName || student.tutorEmail ? (
                                <div className="p-2.5 bg-purple-50/90 border border-purple-200/80 rounded-xl text-xs font-bold text-purple-950 space-y-0.5 shadow-2xs">
                                  <div className="flex items-center gap-1.5 text-purple-900 font-extrabold">
                                    <UserCheck className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                                    <span>{student.tutorName || 'Assigned Tutor'}</span>
                                  </div>
                                  {student.tutorEmail && (
                                    <div className="text-[10px] text-purple-700 font-mono font-semibold truncate block">
                                      📧 {student.tutorEmail}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-bold">
                                  🙋‍♂️ Self / Independent
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-6 max-w-sm">
                              {student.comment && student.comment.trim() !== '' ? (
                                <div className="bg-purple-50/50 border border-purple-100 text-purple-950 px-4 py-2 rounded-xl text-xs leading-relaxed font-bold italic shadow-xs">
                                  "{student.comment}"
                                </div>
                              ) : (
                                <span className="text-slate-400 italic font-light">No comment submitted yet</span>
                              )}
                            </td>
                            <td className="py-4 px-6">
                              {(() => {
                                let isPremiumActive = false;
                                if (student.subscriptionEndsAt) {
                                  const endMs = student.subscriptionEndsAt.seconds 
                                    ? student.subscriptionEndsAt.seconds * 1000 
                                    : new Date(student.subscriptionEndsAt).getTime();
                                  if (Date.now() < endMs) isPremiumActive = true;
                                }

                                return isPremiumActive ? (
                                  <div className="space-y-1">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-wide uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                                      <Check className="w-3 h-3 text-emerald-600" /> Premium Active
                                    </span>
                                    {student.subscriptionType && (
                                      <span className="block text-[10px] font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 border border-indigo-100 rounded-md px-1.5 py-0.5 text-center">
                                        ✨ {student.subscriptionType} Plan
                                      </span>
                                    )}
                                    {student.premiumUpgradedAt && (
                                      <span className="block text-[9px] font-mono font-semibold text-indigo-600">
                                        Started: {
                                          student.premiumUpgradedAt.seconds 
                                            ? new Date(student.premiumUpgradedAt.seconds * 1000).toLocaleDateString() 
                                            : String(student.premiumUpgradedAt).slice(0, 10)
                                        }
                                      </span>
                                    )}
                                    {student.subscriptionEndsAt && (
                                      <span className="block text-[9px] font-mono font-semibold text-slate-500">
                                        Ends: {
                                          student.subscriptionEndsAt.seconds 
                                            ? new Date(student.subscriptionEndsAt.seconds * 1000).toLocaleDateString() 
                                            : String(student.subscriptionEndsAt).slice(0, 10)
                                        }
                                      </span>
                                    )}
                                    {adminName.trim().toLowerCase() === 'ngandi celestin' && (
                                      <button
                                        type="button"
                                        onClick={async (e) => {
                                          e.stopPropagation();
                                          if (window.confirm(`Are you sure you want to remove premium status from student ${student.fullName || student.name || student.email}?`)) {
                                            try {
                                              await updateDoc(doc(db, 'users', student.id), {
                                                subscriptionEndsAt: null,
                                                subscriptionType: null,
                                                hasPaid: false
                                              });
                                              setNotification({ message: `✨ Premium status removed from student ${student.fullName || student.email}`, type: 'success' });
                                            } catch (err) {
                                              console.error('Failed to remove premium:', err);
                                              setNotification({ message: 'Error: Failed to remove premium.', type: 'error' });
                                            }
                                          }
                                        }}
                                        className="block text-[9px] font-extrabold text-rose-600 hover:text-rose-800 underline mt-1.5 cursor-pointer bg-transparent border-none p-0 text-left uppercase tracking-wide"
                                      >
                                        Remove Premium
                                      </button>
                                    )}
                                  </div>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-wide uppercase bg-slate-100 text-slate-600">
                                    Default Trial
                                  </span>
                                );
                              })()}
                            </td>
                            <td className="py-4 px-6 text-right font-mono text-slate-500">
                              {student.createdAt ? (
                                student.createdAt.seconds 
                                  ? new Date(student.createdAt.seconds * 1000).toLocaleDateString() 
                                  : String(student.createdAt).slice(0, 10)
                              ) : '2026-05-29'}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="text-center py-16 text-slate-400 font-bold">
                            No student registration matches found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Private Student Chat Console */}
            {selectedStudentChat && (
              <div id="student-chat-console" className="lg:col-span-4 flex flex-col bg-white border border-slate-100 shadow-sm rounded-[2rem] overflow-hidden min-h-[500px]">
                <div className="flex-1 flex flex-col">
                  {/* Active student head */}
                  <div className="p-6 border-b border-slate-100 bg-[#faf9fc] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img 
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedStudentChat.email || 'student'}`} 
                        alt="Selected Student" 
                        className="w-10 h-10 rounded-full object-cover border-2 border-indigo-500 shadow-sm bg-white" 
                      />
                      <div>
                        <h4 className="text-sm font-black text-slate-900 truncate max-w-[150px]">
                          {selectedStudentChat.email?.split('@')[0].toUpperCase()}
                        </h4>
                        <span className="text-[10px] text-[#800080] font-bold tracking-wider block">
                          {selectedStudentChat.studentId ? `STU-${selectedStudentChat.studentId}` : 'STU-GUEST'}
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSelectedStudentChat(null)}
                      className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Chat Messages Logs */}
                  <div className="flex-1 p-6 overflow-y-auto space-y-4 max-h-[380px] min-h-[300px] bg-slate-50/30 custom-scrollbar">
                    <div className="bg-[#800080]/5 border border-[#800080]/10 rounded-2xl p-4 text-center">
                      <span className="text-[10px] font-black text-[#800080] tracking-wider uppercase block">Private Student-Admin Channel</span>
                      <p className="text-[11px] text-slate-600 font-medium leading-relaxed mt-1">
                        Send message directly to this student.
                      </p>
                    </div>

                    {adminStudentMessages
                      .filter(m => m.studentId === (selectedStudentChat?.userId || selectedStudentChat?.id))
                      .map((msg, mIdx) => {
                        const isAdmin = msg.sender === 'admin';
                        return (
                          <div 
                            key={msg.id || mIdx} 
                            className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-[85%] rounded-2xl p-4 text-xs font-bold leading-relaxed ${
                              isAdmin 
                                ? 'bg-indigo-600 text-white rounded-tr-none shadow-sm' 
                                : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                            }`}>
                              <p>{msg.text}</p>
                              <span className={`text-[8px] mt-1.5 block font-normal text-right ${isAdmin ? 'text-indigo-200' : 'text-slate-400'}`}>
                                {msg.createdAt?.seconds 
                                  ? new Date(msg.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                  : 'Just Now'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  {/* Message compose form */}
                  <form onSubmit={handleSendStudentMessage} className="p-4 border-t border-slate-100 bg-[#faf9fc] flex items-center gap-2">
                    <input 
                      type="text" 
                      placeholder="Type a message to this student..." 
                      className="flex-1 border border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-2 text-xs font-semibold bg-white outline-none"
                      value={studentChatInput}
                      onChange={e => setStudentChatInput(e.target.value)}
                    />
                    <button 
                      type="submit"
                      disabled={sendingStudentMessage || !studentChatInput.trim()}
                      className="p-2 bg-indigo-600 hover:bg-slate-900 disabled:bg-slate-200 text-white rounded-lg transition-all disabled:opacity-50 cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

          {/* TAB 2: TUTOR SESSION */}
          {activeTab === 'TUTOR' && (
            <motion.div
              key="tutor-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Left Column: Stats & Tutor Table */}
              <div className="lg:col-span-8 flex flex-col gap-6">
                
                {/* Subject Statistics Card */}
                <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                  <h4 className="text-xs text-indigo-700 font-black tracking-widest uppercase mb-4 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    Tutors Registered By Subject Domain
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {['Mathematics', 'Physics', 'CS/IT', 'Literature/Humanities', 'Others'].map((subj) => {
                      const count = tutors.filter(t => {
                        const s = String(t.subject).toLowerCase();
                        if (subj === 'CS/IT') return s.includes('cs') || s.includes('it') || s.includes('code') || s.includes('comput');
                        if (subj === 'Literature/Humanities') return s.includes('lit') || s.includes('human') || s.includes('eng') || s.includes('french');
                        if (subj === 'Others') return !s.includes('math') && !s.includes('phys') && !s.includes('cs') && !s.includes('code') && !s.includes('lit') && !s.includes('eng');
                        return s.includes(subj.toLowerCase().slice(0, 4));
                      }).length;

                      return (
                        <div key={subj} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center">
                          <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block truncate">{subj}</span>
                          <span className="text-2xl font-black text-indigo-950 mt-1 block">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Tutor Database Excel style */}
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                  <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div>
                      <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                        <GraduationCap className="w-5 h-5 text-indigo-600" />
                        Tutors Live Directory
                      </h4>
                      <p className="text-xs text-slate-500 font-medium font-sans">See profile sheets. Click any tutor to launch private communication channel.</p>
                    </div>
                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search Tutor, subject..."
                        value={tutorSearch}
                        onChange={e => setTutorSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl text-xs font-bold' outline-none"
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-sans">
                      <thead>
                        <tr className="bg-slate-50 text-slate-400 text-[10px] font-black tracking-wider border-b border-slate-100">
                          <th className="py-4 px-6 w-16 text-center">CODE</th>
                          <th className="py-4 px-6">TUTOR NAME</th>
                          <th className="py-4 px-6">SUBJECT</th>
                          <th className="py-4 px-6">QUALIFICATIONS & CERTIFICATE</th>
                          <th className="py-4 px-6">WEEKLY EXAM MARK</th>
                          <th className="py-4 px-6">MEMBERSHIP</th>
                          <th className="py-4 px-6 text-center">ACTION</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                        {filteredTutors.length > 0 ? (
                          filteredTutors.map((t) => (
                            <tr 
                              key={t.id} 
                              onClick={() => setSelectedTutorChat(t)}
                              className={`hover:bg-indigo-50/20 cursor-pointer transition-colors ${
                                selectedTutorChat?.id === t.id ? 'bg-indigo-50/40' : ''
                              }`}
                            >
                              <td className="py-4 px-6 font-mono font-bold text-center text-indigo-600">{t.tutorCode || 'TTR-X'}</td>
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-2.5">
                                  <img src={t.photoUrl} alt="avatar" className="w-8 h-8 rounded-full border border-slate-200 object-cover" />
                                  <div className="flex items-center gap-2">
                                    <div>
                                      <span className="font-extrabold text-slate-900 block">
                                        {t.fullName || t.name || t.tutorName || t.email?.split('@')[0]}
                                      </span>
                                      <span className="text-[10px] text-slate-400 font-normal font-mono">{t.email}</span>
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-6">
                                <span className="bg-indigo-100/50 text-indigo-800 px-3 py-1 rounded-full text-[10px] font-bold border border-indigo-200">
                                  {t.subject || 'All Subjects'}
                                </span>
                              </td>
                              <td className="py-4 px-6">
                                <div className="space-y-1">
                                  <span className="block text-xs font-bold text-slate-800">
                                    🎓 {t.levelOfStudies || "Bachelor's Degree"}
                                  </span>
                                  <span className="block text-[10px] text-slate-500 font-medium">
                                    💼 {t.experience || "Senior GCE Board Educator"}
                                  </span>
                                  {(() => {
                                    const isRealCert = t.certificateProofUrl && 
                                      t.certificateProofUrl !== t.photoUrl && 
                                      !t.certificateProofUrl.includes('dicebear');

                                    return isRealCert ? (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setViewingCertModal({
                                            tutorName: t.name || t.email?.split('@')[0] || "Faculty Tutor",
                                            certUrl: t.certificateProofUrl,
                                            subject: t.subject || "General",
                                            level: t.levelOfStudies || "Degree"
                                          });
                                        }}
                                        className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-md border border-emerald-200 transition-colors cursor-pointer"
                                      >
                                        📜 Inspect Official Diploma Scan
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          alert(`Tutor ${t.name || t.email} has not uploaded a photo of their degree/diploma yet. The app will prompt them to upload it on their next dashboard visit!`);
                                        }}
                                        className="inline-flex items-center gap-1 text-[10px] font-black text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-md border border-rose-200 transition-colors cursor-pointer"
                                      >
                                        ⚠️ Pending Degree/Diploma Upload
                                      </button>
                                    );
                                  })()}
                                </div>
                              </td>
                              <td className="py-4 px-6">
                                {(() => {
                                  const score = t.lastWeeklyTestScore !== undefined ? t.lastWeeklyTestScore : 80;
                                  const isDisqualified = t.isDisqualified || score < 60;
                                  return isDisqualified ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200">
                                      ❌ {score}/100 DISQUALIFIED (&lt;60)
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                                      ✅ {score}/100 PASSED (&gt;60)
                                    </span>
                                  );
                                })()}
                              </td>
                              <td className="py-4 px-6">
                                {(() => {
                                  let isPremiumActive = false;
                                  if (t.subscriptionEndsAt) {
                                    const endMs = t.subscriptionEndsAt.seconds 
                                      ? t.subscriptionEndsAt.seconds * 1000 
                                      : new Date(t.subscriptionEndsAt).getTime();
                                    if (Date.now() < endMs) isPremiumActive = true;
                                  }

                                  return isPremiumActive ? (
                                    <div className="space-y-1">
                                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-wide uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                                        <Check className="w-3 h-3 text-emerald-600" /> Premium Active
                                      </span>
                                      {t.subscriptionType && (
                                        <span className="block text-[10px] font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 border border-indigo-100 rounded-md px-1.5 py-0.5 text-center">
                                          ✨ {t.subscriptionType} Plan
                                        </span>
                                      )}
                                      {adminName.trim().toLowerCase() === 'ngandi celestin' && (
                                        <button
                                          type="button"
                                          onClick={async (e) => {
                                            e.stopPropagation();
                                            if (window.confirm(`Are you sure you want to remove premium status from tutor ${t.fullName || t.name || t.email}?`)) {
                                              try {
                                                await updateDoc(doc(db, 'tutors', t.id), {
                                                  subscriptionEndsAt: null,
                                                  subscriptionType: null,
                                                  hasPaid: false
                                                });
                                                setNotification({ message: `✨ Premium status removed from tutor ${t.fullName || t.email}`, type: 'success' });
                                              } catch (err) {
                                                console.error('Failed to remove premium:', err);
                                                setNotification({ message: 'Error: Failed to remove premium.', type: 'error' });
                                              }
                                            }
                                          }}
                                          className="block text-[9px] font-extrabold text-rose-600 hover:text-rose-800 underline mt-1.5 cursor-pointer bg-transparent border-none p-0 text-left uppercase tracking-wide"
                                        >
                                          Remove Premium
                                        </button>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-wide uppercase bg-slate-100 text-slate-600">
                                      Default Trial
                                    </span>
                                  );
                                })()}
                              </td>
                              <td className="py-4 px-6 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedTutorChat(t);
                                    }}
                                    className="px-3 py-1.5 bg-indigo-600 hover:bg-slate-900 text-white rounded-lg text-[10px] font-extrabold transition-all cursor-pointer"
                                  >
                                    Chat Portal
                                  </button>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteUser(t.id, t.email, true);
                                    }}
                                    title="Ban & Delete Tutor Account"
                                    className="p-1.5 bg-rose-50 hover:bg-[#800080]/15 text-rose-600 rounded-lg transition-all border border-rose-100 hover:text-rose-700 cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="text-center py-16 text-slate-400 font-bold">No tutors found matching your parameters.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Right Column: Private Communication Console/Chat Drawer */}
              <div className="lg:col-span-4 flex flex-col bg-white border border-slate-100 shadow-sm rounded-[2rem] overflow-hidden min-h-[500px]">
                {selectedTutorChat ? (
                  <div className="flex-1 flex flex-col">
                    {/* Active tutor head */}
                    <div className="p-6 border-b border-slate-100 bg-[#faf9fc] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img 
                          src={selectedTutorChat.photoUrl} 
                          alt="Selected Tutor" 
                          className="w-10 h-10 rounded-full object-cover border-2 border-indigo-500 shadow-sm" 
                        />
                        <div>
                          <h4 className="text-sm font-black text-slate-900 truncate max-w-[150px]">
                            {selectedTutorChat.email?.split('@')[0].toUpperCase()}
                          </h4>
                          <span className="text-[10px] text-indigo-600 font-bold tracking-wider block">
                            {selectedTutorChat.tutorCode} • {selectedTutorChat.subject}
                          </span>
                        </div>
                      </div>
                      <button 
                        onClick={() => setSelectedTutorChat(null)}
                        className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Chat Messages Logs */}
                    <div className="flex-1 p-6 overflow-y-auto space-y-4 max-h-[380px] min-h-[300px] bg-slate-50/30 custom-scrollbar">
                      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 text-center">
                        <span className="text-[10px] font-black text-indigo-900 tracking-wider uppercase block">Private Admin-Tutor Channel</span>
                        <p className="text-[11px] text-indigo-700 font-medium leading-relaxed mt-1">
                          Discuss classroom schedules, student performance issues, or verify registration certificates live.
                        </p>
                      </div>

                      {activeChatLogs.map((msg, mIdx) => {
                        const isAdmin = msg.sender === 'admin';
                        return (
                          <div 
                            key={msg.id || mIdx} 
                            className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-[85%] rounded-2xl p-4 text-xs font-bold leading-relaxed ${
                              isAdmin 
                                ? 'bg-indigo-600 text-white rounded-tr-none shadow-sm' 
                                : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                            }`}>
                              <p>{msg.text}</p>
                              <span className={`text-[8px] mt-1.5 block font-normal text-right ${isAdmin ? 'text-indigo-200' : 'text-slate-400'}`}>
                                {msg.createdAt?.seconds 
                                  ? new Date(msg.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                  : 'Just Now'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Chat Field Input */}
                    <form onSubmit={handleSendTutorMsg} className="p-4 border-t border-slate-100 bg-white flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Type admin memo command to tutor..."
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                        className="flex-1 py-3 px-4 bg-slate-50 border border-slate-200 focus:border-indigo-600 focus:bg-white rounded-xl text-xs outline-none transition-all font-bold"
                      />
                      <button
                        type="submit"
                        disabled={!chatInput.trim()}
                        className="w-10 h-10 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl flex items-center justify-center transition-all shrink-0 cursor-pointer shadow-md active:scale-95"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400 font-sans">
                    <MessageSquare className="w-12 h-12 text-slate-300 mb-4 animate-pulse" />
                    <h5 className="font-extrabold text-[#211d3f] text-sm mb-1">Coordinated Communication Portal</h5>
                    <p className="text-xs text-slate-500 max-w-[200px] leading-relaxed">
                      Select any certified tutor in the directory table to open active conversation cords.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 3: COMMUNITY SESSION */}
          {activeTab === 'COMMUNITY' && (
            <motion.div
              key="community-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="flex flex-col gap-10"
            >

              {/* APP COMMENTS & COMMUNITY FEEDBACK (Now at the top of Community Tab) */}
              <div className="bg-white rounded-[2.2rem] p-6 md:p-8 shadow-sm border border-slate-100 flex flex-col gap-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-6 bg-indigo-600 rounded-full" />
                    <h3 className="text-xl font-black text-slate-800">App Comments & Community Feedback</h3>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setIsCommentsReduced(!isCommentsReduced)}
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-indigo-700 hover:text-indigo-900 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer border border-slate-200 shadow-xs"
                    title={isCommentsReduced ? "Expand comments list" : "Reduce comments list"}
                  >
                    <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isCommentsReduced ? '' : 'rotate-180'}`} />
                    <span className="text-[10px] font-black uppercase tracking-wide">
                      {isCommentsReduced ? 'Show All' : 'Reduce'}
                    </span>
                  </button>
                </div>
                
                <p className="text-xs text-slate-500 font-semibold leading-normal -mt-3">
                  Moderator panel to read and manage all client, tutor and system comments. You can delete improper feedback or post administrative updates directly to student & tutor community sessions.
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                  {/* Form Card: Post administrative comment */}
                  <div className="bg-slate-50 border border-slate-150 p-6 rounded-[2rem] space-y-4">
                    <span className="text-[10px] uppercase font-black tracking-wider text-indigo-700 block">
                      Post to Community Portals
                    </span>

                    <form onSubmit={handleAdminPostComment} className="space-y-4">
                      {/* Name of the person */}
                      <div>
                        <label className="text-[10px] uppercase font-black tracking-wide text-slate-500 block mb-1">
                          Commentator Name
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Dr. Ngandi Celestin"
                          value={commentAuthorName}
                          onChange={(e) => setCommentAuthorName(e.target.value)}
                          className="w-full bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs font-bold outline-none transition-all placeholder:text-slate-400"
                          required
                        />
                      </div>

                      {/* Level of studies */}
                      <div>
                        <label className="text-[10px] uppercase font-black tracking-wide text-slate-500 block mb-1">
                          Level of Studies
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Doctorate in Pure Mathematics"
                          value={commentAuthorLevel}
                          onChange={(e) => setCommentAuthorLevel(e.target.value)}
                          className="w-full bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs font-bold outline-none transition-all placeholder:text-slate-400"
                        />
                      </div>

                      {/* Experience of the person */}
                      <div>
                        <label className="text-[10px] uppercase font-black tracking-wide text-slate-500 block mb-1">
                          Years of Experience / Profession
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 15+ Years National Examiner"
                          value={commentAuthorExperience}
                          onChange={(e) => setCommentAuthorExperience(e.target.value)}
                          className="w-full bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs font-bold outline-none transition-all placeholder:text-slate-400"
                        />
                      </div>

                      {/* Role selection */}
                      <div>
                        <label className="text-[10px] uppercase font-black tracking-wide text-slate-500 block mb-1">
                          Display Badge Type
                        </label>
                        <select
                          value={commentAuthorRole}
                          onChange={(e) => setCommentAuthorRole(e.target.value)}
                          className="w-full bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs font-bold outline-none transition-all"
                        >
                          <option value="admin">NC Administrator</option>
                          <option value="tutor">Expert Academic Tutor</option>
                          <option value="student">Honor Student</option>
                        </select>
                      </div>

                      {/* Comment content */}
                      <div>
                        <label className="text-[10px] uppercase font-black tracking-wide text-slate-500 block mb-1">
                          Comment Content
                        </label>
                        <textarea
                          rows={4}
                          placeholder="Type an announcement, advice, or general feedback here..."
                          value={newCommentInput}
                          onChange={(e) => setNewCommentInput(e.target.value)}
                          className="w-full bg-white border border-slate-200 focus:border-indigo-500 rounded-2xl p-4 text-xs font-bold outline-none transition-all placeholder:text-slate-400 font-sans resize-none"
                          maxLength={500}
                          required
                        />
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold mt-1 px-1">
                          <span>Max 500 characters</span>
                          <span>Posts immediately</span>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isPostingComment || !newCommentInput.trim() || !commentAuthorName.trim()}
                        className="w-full py-3 bg-[#2f47b3] hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        {isPostingComment ? (
                          <>
                            Posting comment...
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" /> Broadcast Comment
                          </>
                        )}
                      </button>
                    </form>
                  </div>

                  {/* List: Real-time Comments Feed */}
                  <div className="lg:col-span-2 space-y-4">
                    <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block mb-2 font-bold flex items-center justify-between">
                      <span>Live App Comments ({commentsList.length})</span>
                      {isCommentsReduced && commentsList.length > 2 && (
                        <span className="text-indigo-600 font-extrabold">Reduced View (Showing 2 of {commentsList.length})</span>
                      )}
                    </span>

                    {commentsList.length === 0 ? (
                      <div className="bg-slate-50 border border-slate-150 border-dashed rounded-[2rem] p-12 text-center flex flex-col items-center justify-center">
                        <span className="text-xs text-slate-400 font-bold block">No comments posted yet.</span>
                        <p className="text-[10px] text-slate-450 mt-1">Comments submitted in student or tutor portals will appear here automatically in real time.</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                        {(isCommentsReduced ? commentsList.slice(0, 2) : commentsList).map((comment) => {
                          const dateText = comment.createdAt?.seconds 
                            ? new Date(comment.createdAt.seconds * 1000).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                            : comment.createdAt ? new Date(comment.createdAt).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A';
                          
                          const badgeClasses: Record<string, string> = {
                            admin: 'bg-rose-100 text-rose-800 border border-rose-200',
                            tutor: 'bg-blue-100 text-blue-800 border border-blue-200',
                            student: 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          };
                          const currentBadgeClass = badgeClasses[comment.authorRole] || 'bg-slate-100 text-slate-800 border border-slate-200';

                          return (
                            <div 
                              key={comment.id}
                              className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex items-start gap-4 hover:border-slate-200 transition-all font-sans relative"
                            >
                              {/* Avatar Circle with Initials */}
                              <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center font-black text-sm shrink-0 border border-slate-200">
                                {comment.authorName?.charAt(0).toUpperCase()}
                              </div>

                              <div className="flex-1 min-w-0 pr-8">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-extrabold text-slate-800 text-xs truncate">
                                    {comment.authorName}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider ${currentBadgeClass}`}>
                                    {comment.authorRole}
                                  </span>
                                  <span className="text-[9px] text-slate-400 font-mono font-bold">
                                    ({comment.authorEmail})
                                  </span>
                                </div>

                                {/* Custom study levels and experience */}
                                {(comment.authorLevel || comment.authorExperience) && (
                                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                    {comment.authorLevel && (
                                      <span className="inline-flex items-center gap-1 bg-slate-100 px-2.5 py-0.5 rounded-lg text-[9px] text-slate-650 font-extrabold tracking-wide">
                                        🎓 {comment.authorLevel}
                                      </span>
                                    )}
                                    {comment.authorExperience && (
                                      <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-lg text-[9px] font-extrabold tracking-wide">
                                        💼 {comment.authorExperience}
                                      </span>
                                    )}
                                  </div>
                                )}

                                <p className="text-slate-650 text-xs font-medium leading-relaxed mt-2.5 whitespace-pre-wrap font-sans">
                                  {comment.content}
                                </p>

                                <div className="flex items-center gap-4 mt-3 pt-2.5 border-t border-slate-50 text-[10px] text-slate-400 font-bold font-sans">
                                  <span>Likes: {comment.likes || 0}</span>
                                  <span>•</span>
                                  <span>Posted: {dateText}</span>
                                </div>
                              </div>

                              {/* Delete Comment Button */}
                              <button
                                type="button"
                                onClick={() => handleDeleteComment(comment.id)}
                                className="absolute top-4 right-4 p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-all hover:scale-105 active:scale-95 cursor-pointer"
                                title="Delete comment permanently"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          );
                        })}

                        {isCommentsReduced && commentsList.length > 2 && (
                          <button
                            type="button"
                            onClick={() => setIsCommentsReduced(false)}
                            className="w-full text-center py-2.5 bg-slate-50 hover:bg-indigo-50 border border-slate-150 hover:border-indigo-150 rounded-2xl text-[11px] font-extrabold uppercase tracking-wide text-indigo-600 hover:text-indigo-800 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            <ChevronDown className="w-4 h-4 animate-bounce" />
                            <span>Show {commentsList.length - 2} More Comments</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Event Creators Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* General Event Creator Card */}
                <div className="bg-white p-6 md:p-8 rounded-[2.2rem] border border-slate-100 shadow-sm">
                  <h4 className="text-base font-black text-slate-900 mb-2 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-cyan-600" />
                    Create General Announcement Event
                  </h4>
                  <p className="text-xs text-slate-500 mb-6 font-medium">Create standard lectures, info seminars, study jams, or code camps to post in the Community section.</p>
                  
                  {isCreatingEvent ? (
                    <form onSubmit={handleCreateAnnouncement} className="space-y-4">
                      <div>
                        <label className="text-[10px] text-slate-500 font-bold block mb-1">EVENT TITLE</label>
                        <input 
                          type="text" 
                          placeholder="e.g., Global Study Jams & Calculus Bootcamps"
                          value={annTitle}
                          onChange={e => setAnnTitle(e.target.value)}
                          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs outline-none focus:border-cyan-500 font-bold"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] text-slate-500 font-bold block mb-1">TARGET DATE</label>
                          <input 
                            type="date" 
                            value={annDate}
                            onChange={e => setAnnDate(e.target.value)}
                            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs outline-none focus:border-cyan-500 font-bold"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 font-bold block mb-1">EVENT LONG DESCRIPTION</label>
                        <textarea 
                          rows={3}
                          placeholder="Provide the comprehensive timing schedule, links, or prerequisites info here..."
                          value={annDesc}
                          onChange={e => setAnnDesc(e.target.value)}
                          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs outline-none focus:border-cyan-500 font-semibold"
                          required
                        />
                      </div>
                      <div className="flex gap-2">
                        <button 
                          type="submit"
                          className="px-5 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          Broadcast Event
                        </button>
                        <button 
                          type="button"
                          onClick={() => setIsCreatingEvent(false)}
                          className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button 
                      onClick={() => setIsCreatingEvent(true)}
                      className="px-5 py-3.5 bg-cyan-100 hover:bg-cyan-200 text-cyan-800 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer border border-cyan-200"
                    >
                      <Plus className="w-4 h-4" /> Open Event Form
                    </button>
                  )}
                </div>

                {/* Tournament Creator Card */}
                <div className="bg-white p-6 md:p-8 rounded-[2.2rem] border border-slate-100 shadow-sm">
                  <h4 className="text-base font-black text-slate-900 mb-2 flex items-center gap-2">
                    <Award className="w-5 h-5 text-purple-600" />
                    Create Elite Cash Tournament (2026 Season)
                  </h4>
                  <p className="text-xs text-slate-500 mb-6 font-medium">Plan tournament fields, dates,stages, prizes, registration limits, and collect 5,000 FCFA payments.</p>

                  {isCreatingTournament ? (
                    <form onSubmit={handleCreateTournament} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] text-slate-500 font-bold block mb-1">TOURNAMENT TITLE</label>
                          <input 
                            type="text" 
                            placeholder="e.g., NC Chemistry Tournament"
                            value={tourTitle}
                            onChange={e => setTourTitle(e.target.value)}
                            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs outline-none focus:border-purple-500 font-bold"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 font-bold block mb-1">LIMIT OF STUDENTS REQUIRED</label>
                          <input 
                            type="number" 
                            placeholder="e.g., 5 or 10"
                            value={tourRequired}
                            onChange={e => setTourRequired(e.target.value)}
                            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs outline-none focus:border-purple-500 font-bold"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] text-slate-500 font-bold block mb-1">TOURNAMENT DATES</label>
                          <input 
                            type="text" 
                            placeholder="e.g., 2026-06-25 to 2026-06-27"
                            value={tourDates}
                            onChange={e => setTourDates(e.target.value)}
                            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs outline-none focus:border-purple-500 font-bold"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 font-bold block mb-1">TIME DETAILS</label>
                          <input 
                            type="text" 
                            placeholder="e.g., 15:00 WAT Daily"
                            value={tourTime}
                            onChange={e => setTourTime(e.target.value)}
                            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs outline-none focus:border-purple-500 font-bold"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] text-slate-500 font-bold block mb-1">STAGES LIST</label>
                          <input 
                            type="text" 
                            placeholder="e.g., Elimination, Semis, Grand Finale"
                            value={tourStages}
                            onChange={e => setTourStages(e.target.value)}
                            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs outline-none focus:border-purple-500 font-semibold"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 font-bold block mb-1">PRIZE POOL AWARD INFO</label>
                          <input 
                            type="text" 
                            placeholder="e.g., 🥇 500k FCFA, 🥈 200k FCFA"
                            value={tourPrizes}
                            onChange={e => setTourPrizes(e.target.value)}
                            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs outline-none focus:border-purple-500 font-bold"
                            required
                          />
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button 
                          type="submit"
                          className="px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          Cast Tournament
                        </button>
                        <button 
                          type="button"
                          onClick={() => setIsCreatingTournament(false)}
                          className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button 
                      onClick={() => setIsCreatingTournament(true)}
                      className="px-5 py-3.5 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer border border-purple-200"
                    >
                      <Plus className="w-4 h-4" /> Open Tournament Form
                    </button>
                  )}
                </div>

              </div>

              {/* General Announcements & Events Manager */}
              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                <div className="p-6 md:p-8 bg-slate-50/50 border-b border-slate-100">
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-indigo-600" />
                    BROADCASTED GENERAL ANNOUNCEMENTS & EVENTS
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">View and manage published lectures, webinars, orientation camps, and general announcements posted live onto the Campus Community Hub.</p>
                </div>

                <div className="overflow-x-auto font-sans">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 text-slate-400 text-[10px] font-black tracking-wider uppercase border-b border-slate-100">
                        <th className="py-4 px-6 text-center w-20">DELETE</th>
                        <th className="py-4 px-6">EVENT/ANNOUNCEMENT TITLE</th>
                        <th className="py-4 px-6">DESCRIPTION</th>
                        <th className="py-4 px-6 font-mono text-[9px]">TARGET DATE</th>
                        <th className="py-4 px-6 text-right">PUBLISHED STATUS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-semibold">
                      {events.length > 0 ? (
                        events.map((ev) => (
                          <tr key={ev.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-4 px-6 text-center">
                              <button 
                                onClick={() => handleDeleteEvent(ev.id)}
                                className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-500 hover:text-rose-700 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                            <td className="py-4 px-6">
                              <span className="font-extrabold text-slate-900 block">{ev.title || 'Untitled'}</span>
                            </td>
                            <td className="py-4 px-6 max-w-sm">
                              <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{ev.description || 'No description provided.'}</p>
                            </td>
                            <td className="py-4 px-6 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                              {ev.date || 'No scheduled date'}
                            </td>
                            <td className="py-4 px-6 text-right">
                              <span className="px-2.5 py-1 bg-cyan-100 border border-cyan-200 text-cyan-800 rounded-full text-[10px] font-black uppercase tracking-wider">
                                Live Broadcast
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="text-center py-16 text-slate-400 font-bold">No general broadcasted events matching parameters.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Spreadsheets lists of broadcasts */}
              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                <div className="p-6 md:p-8 bg-slate-50/50 border-b border-slate-100">
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-purple-600" />
                    BROADCASTED TOURNAMENTS & REGISTRATION SHIELD
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">View the status of exam sessions. If the registered count matches required students or target date arrives, registrations close.</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 text-slate-400 text-[10px] font-black tracking-wider uppercase border-b border-slate-100">
                        <th className="py-4 px-6 text-center w-20">DELETE</th>
                        <th className="py-4 px-6">TOURNAMENT TITLE</th>
                        <th className="py-4 px-6 text-center">LIMIT REQ</th>
                        <th className="py-4 px-6 text-center">PAID REG COUNT</th>
                        <th className="py-4 px-6">DATES & TIMES</th>
                        <th className="py-4 px-6 text-center">SHIELD STATUS</th>
                        <th className="py-4 px-6 text-right">MANUAL SHIELD TOGGLE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-semibold font-sans">
                      {tournaments.length > 0 ? (
                        tournaments.map((tour) => {
                          const paidRegs = participants.filter(p => p.tournamentId === tour.id && p.paymentStatus === 'completed').length;
                          const isReached = paidRegs >= (tour.requiredStudents || 0);
                          const isToggledClosed = tour.status === 'closed';

                          return (
                            <tr key={tour.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-4 px-6 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <button 
                                    onClick={() => setEditingTournament({
                                      id: tour.id,
                                      title: tour.title || '',
                                      dates: tour.dates || '',
                                      time: tour.time || '',
                                      stages: tour.stages || '',
                                      prizes: tour.prizes || '',
                                      requiredStudents: tour.requiredStudents || 10
                                    })}
                                    className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                                    title="Edit Broadcasted Tournament"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteTournament(tour.id)}
                                    className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-500 hover:text-rose-700 transition-colors cursor-pointer"
                                    title="Delete Tournament"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                              <td className="py-4 px-6">
                                <span className="font-extrabold text-slate-900 block">{tour.title}</span>
                                <span className="text-[10px] text-slate-400 block truncate max-w-[200px]">{tour.prizes}</span>
                              </td>
                              <td className="py-4 px-6 text-center font-mono font-bold text-slate-900">{tour.requiredStudents}</td>
                              <td className="py-4 px-6 text-center">
                                <span className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg font-mono font-extrabold">
                                  {paidRegs}
                                </span>
                              </td>
                              <td className="py-4 px-6 font-mono text-slate-500 text-[11px]">
                                <span className="block">{tour.dates}</span>
                                <span className="text-[9px] text-indigo-400 font-bold block">{tour.time}</span>
                              </td>
                              <td className="py-4 px-6 text-center">
                                {isReached ? (
                                  <span className="px-2.5 py-1 bg-red-100/70 border border-red-200 text-red-700 rounded-full text-[10px] font-black uppercase tracking-wider">
                                    Full Capacity (Closed)
                                  </span>
                                ) : isToggledClosed ? (
                                  <span className="px-2.5 py-1 bg-purple-1000 bg-slate-100 border border-slate-200 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-wider">
                                    Closed By Admin
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-1 bg-emerald-100/70 border border-emerald-200 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-wider">
                                    Open & Active
                                  </span>
                                )}
                              </td>
                              <td className="py-4 px-6 text-right">
                                <button 
                                  onClick={() => toggleTournamentStatus(tour.id, tour.status)}
                                  className={`px-3 py-1 bg-white border rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                                    tour.status === 'active' 
                                      ? 'text-amber-600 border-amber-200 hover:bg-amber-50' 
                                      : 'text-indigo-600 border-indigo-200 hover:bg-indigo-50'
                                  }`}
                                >
                                  {tour.status === 'active' ? 'Force Close' : 'Activate'}
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={7} className="text-center py-16 text-slate-400 font-bold">No academic cash tournaments created yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Excel Table: REAL REGISTERED TOURNAMENT PARTICIPANTS INDEX */}
              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                <div className="p-6 md:p-8 bg-[#fafafc] border-b border-slate-100">
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                    PAID PARTICIPANTS SPREADSHEET (Auto Recorded Excel)
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">Real-time recording of students who registered and paid 5,000 FCFA. This is sent automatically to this Excel dashboard.</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 text-slate-400 text-[10px] font-black tracking-wider uppercase border-b border-slate-100">
                        <th className="py-4 px-6 text-center w-20">INDEX</th>
                        <th className="py-4 px-6">PUBLIC CODES</th>
                        <th className="py-4 px-6">PARTICIPANT NAME & SURNAME</th>
                        <th className="py-4 px-6">EMAIL ADDRESS</th>
                        <th className="py-4 px-6">TELEPHONE</th>
                        <th className="py-4 px-6">TARGET TOURNAMENT</th>
                        <th className="py-4 px-6">FEE REMITTED (FCFA)</th>
                        <th className="py-4 px-6 text-right">PAYMENT STATUS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                      {participants.length > 0 ? (
                        participants.map((p, pIdx) => {
                          const tourRef = tournaments.find(t => t.id === p.tournamentId);
                          return (
                            <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-4 px-6 text-center font-mono font-bold text-slate-400">{pIdx + 1}</td>
                              <td className="py-4 px-6 font-mono font-bold text-slate-400">
                                <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded">
                                  {p.participantId || `PRT-${Math.abs(p.phone?.charCodeAt(0) || 123) * 31}`}
                                </span>
                              </td>
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center font-black text-[10px] text-slate-700">
                                    {p.name?.[0]?.toUpperCase() || 'P'}
                                  </div>
                                  <span className="font-extrabold text-slate-900">{p.name || 'Anonymous'} {p.surname || ''}</span>
                                </div>
                              </td>
                              <td className="py-4 px-6 text-slate-600">{p.email || 'N/A'}</td>
                              <td className="py-4 px-6 font-mono font-medium text-slate-500">{p.phone || 'N/A'}</td>
                              <td className="py-4 px-6">
                                <span className="bg-purple-100/50 text-purple-800 px-2 font-bold py-0.5 rounded-lg border border-purple-200">
                                  {tourRef ? tourRef.title : 'Active Tournament'}
                                </span>
                              </td>
                              <td className="py-4 px-6 font-mono font-black text-rose-600">5,000 FCFA</td>
                              <td className="py-4 px-6 text-right">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-wide uppercase bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-xs">
                                  <Check className="w-3.5 h-3.5 text-emerald-600" /> Remitted & Confirmed
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={8} className="text-center py-16 text-slate-400 font-bold">
                            No active participants have fully registered/remitted the entry fee yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </motion.div>
          )}

          {/* TAB 4: F&J (FORMATIONS & JOBS) SESSION */}
          {activeTab === 'FJ_SESSION' && (
            <motion.div
              key="fj-session-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="flex flex-col gap-10"
            >
              
              {/* MICROSOFT EXCEL ONLINE - LIVE CANDIDATE ADMISSIONS SPREADSHEET */}
              <div id="excel-admissions-spreadsheet" className="bg-white rounded-[2.2rem] p-6 md:p-8 shadow-xl border border-slate-100 flex flex-col gap-5 overflow-hidden font-sans">
                
                {/* Excel Heading Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-150 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#107c41] rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-md shadow-emerald-700/10 shrink-0">
                      📊
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                        Classe Admissions Spreadsheet Registry
                        <span className="text-[10px] bg-[#107c41]/10 text-[#107c41] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider">
                          Excel Live-Sync
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                        Live database sync plotter. Select a student row below to initialize discussion, trigger live visual portal calls, or update status.
                      </p>
                    </div>
                  </div>

                  {/* Search Query inside spreadsheet */}
                  <div className="relative shrink-0 w-full sm:w-80">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text"
                      placeholder="Search spreadsheet rows..."
                      value={searchSpreadsheetQuery}
                      onChange={e => setSearchSpreadsheetQuery(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#107c41] outline-none pl-10 pr-4 py-2.5 rounded-xl text-xs font-semibold placeholder-slate-400 transition-colors"
                    />
                  </div>
                </div>

                {/* MS Excel Menu and Toolbar simulator */}
                <div className="bg-slate-50 rounded-2xl p-1.5 border border-slate-150 hidden md:flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 select-none">
                  <span className="px-3 py-1 bg-[#107c41] text-white rounded-lg text-xs font-black">File</span>
                  <span className="px-3 py-1 hover:bg-slate-200 hover:text-slate-800 rounded-lg cursor-pointer">Home</span>
                  <span className="px-3 py-1 hover:bg-slate-200 hover:text-slate-800 rounded-lg cursor-pointer">Insert</span>
                  <span className="px-3 py-1 hover:bg-slate-200 hover:text-slate-800 rounded-lg cursor-pointer">Page Layout</span>
                  <span className="px-3 py-1 hover:bg-slate-200 hover:text-slate-800 rounded-lg cursor-pointer">Formulas</span>
                  <span className="px-3 py-1 hover:bg-slate-200 hover:text-slate-800 rounded-lg cursor-pointer">Data</span>
                  <span className="px-3 py-1 hover:bg-slate-200 hover:text-slate-800 rounded-lg cursor-pointer">Review</span>
                  <div className="w-px h-5 bg-slate-200 mx-1" />
                  <span className="px-2 py-1 bg-yellow-500/10 text-yellow-700 rounded-md border border-yellow-500/20 text-[9px] font-black uppercase">
                    LIVE SPREADSHEET PLOTTING
                  </span>
                </div>

                {/* Formula Bar simulator */}
                <div className="bg-slate-50 border border-slate-150 rounded-2xl p-3 flex items-center gap-3 font-mono text-xs">
                  <span className="text-[#107c41] font-black shrink-0 tracking-wider">fx_formula:</span>
                  <div className="bg-white border border-slate-200 rounded-xl px-4 py-2 flex-1 text-slate-700 font-bold overflow-x-auto min-h-[36px] flex items-center">
                    {(() => {
                      const selectedObject = courseRegistrations.find(r => r.id === selectedRegId);
                      if (selectedObject) {
                        return `=CONCATENATE("${selectedObject.name}", " | ", "${selectedObject.formationTitle}", " | PREFERENCE: ", "${selectedObject.preferredCallType?.toUpperCase()}", " | PHONE: ", "${selectedObject.contact}")`;
                      }
                      return "No row selected. Select a student row above to populate formula cell.";
                    })()}
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 w-full">
                  
                  {/* Excel Spreadsheet Table area - Col span 8 */}
                  <div className="xl:col-span-8 overflow-x-auto border border-slate-200 rounded-2xl bg-slate-50/50 relative custom-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                      <thead>
                        <tr className="bg-slate-100/80 border-b border-slate-200 text-[11px] font-bold text-slate-500">
                          {/* Top-Left Corner cell */}
                          <th className="w-12 bg-slate-200 border-r border-b border-slate-300 text-center select-none font-sans py-2"></th>
                          <th className="px-4 py-2 border-r border-[#dedede] font-mono font-black text-center text-[#107c41] w-14">A</th>
                          <th className="px-4 py-2 border-r border-[#dedede] font-mono font-black text-center text-[#107c41] w-48">B</th>
                          <th className="px-4 py-2 border-r border-[#dedede] font-mono font-black text-center text-[#107c41] w-40">C</th>
                          <th className="px-4 py-2 border-r border-[#dedede] font-mono font-black text-center text-[#107c41] w-48">D</th>
                          <th className="px-4 py-2 border-r border-[#dedede] font-mono font-black text-center text-[#107c41] w-44">E</th>
                          <th className="px-4 py-2 border-r border-[#dedede] font-mono font-black text-center text-[#107c41]">F</th>
                          <th className="px-4 py-2 border-r border-[#dedede] font-mono font-black text-center text-[#107c41] w-36">G</th>
                          <th className="px-4 py-2 font-mono font-black text-center text-[#107c41] w-36">H</th>
                        </tr>
                        <tr className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                          <th className="bg-slate-150 text-center border-r border-slate-250 py-2 select-none font-mono">Row</th>
                          <th className="px-4 py-2 border-r border-[#efefef] text-center">ID</th>
                          <th className="px-4 py-2 border-r border-[#efefef]">STUDENT NAME</th>
                          <th className="px-4 py-2 border-r border-[#efefef]">CLASS / FORMATION</th>
                          <th className="px-4 py-2 border-r border-[#efefef]">EMAIL ADDRESS</th>
                          <th className="px-4 py-2 border-r border-[#efefef]">CONTACT PHONE</th>
                          <th className="px-4 py-2 border-r border-[#efefef]">CALL PREFERENCE</th>
                          <th className="px-4 py-2 border-r border-[#efefef] text-center">FEE STATUS</th>
                          <th className="px-4 py-2 text-center">PORTAL STATUS</th>
                        </tr>
                      </thead>
                      <tbody className="text-xs font-semibold text-slate-700 bg-white">
                        {(() => {
                          const filtered = courseRegistrations.filter(r => {
                            if (!searchSpreadsheetQuery.trim()) return true;
                            const q = searchSpreadsheetQuery.toLowerCase();
                            return (
                              r.name?.toLowerCase().includes(q) ||
                              r.email?.toLowerCase().includes(q) ||
                              r.contact?.toLowerCase().includes(q) ||
                              r.formationTitle?.toLowerCase().includes(q)
                            );
                          });

                          if (filtered.length === 0) {
                            return (
                              <tr>
                                <td colSpan={9} className="py-12 text-center text-slate-400 bg-slate-50/50 font-sans italic">
                                  No student admissions currently synced to spreadsheet.
                                </td>
                              </tr>
                            );
                          }

                          return filtered.map((reg, index) => {
                            const isSelected = selectedRegId === reg.id;
                            const isPending = reg.status === 'pending';
                            const isCalling = reg.status === 'active_call';
                            const isEnded = reg.status === 'ended';
                            const isCancelled = reg.status === 'cancelled';
                            
                            return (
                              <tr 
                                key={reg.id}
                                onClick={() => setSelectedRegId(reg.id)}
                                className={`group border-b border-[#efefef] hover:bg-slate-50 transition-colors cursor-pointer select-none ${
                                  isSelected ? 'bg-emerald-50/50 border-2 border-[#107c41] shadow-sm' : ''
                                }`}
                              >
                                {/* Excel row counter column */}
                                <td className="bg-slate-100/90 border-r border-[#d4d4d4] text-[9px] font-black text-slate-500 text-center font-mono py-3.5 select-none w-12 shrink-0">
                                  {index + 1}
                                </td>
                                
                                {/* Cell A: Mini Registration Hash Code */}
                                <td className="px-4 py-3.5 border-r border-[#f1f1f1] font-mono text-[9px] text-slate-400 text-center shrink-0">
                                  #{reg.id.substring(0, 5).toUpperCase()}
                                </td>

                                {/* Cell B: Student Full Name */}
                                <td className="px-4 py-3.5 border-r border-[#f1f1f1] font-bold text-[#211d3f]">
                                  {reg.name}
                                </td>

                                {/* Cell C: Targeted Class */}
                                <td className="px-4 py-3.5 border-r border-[#f1f1f1] font-sans text-xs text-indigo-900 font-extrabold max-w-[150px] truncate">
                                  {reg.formationTitle}
                                </td>

                                {/* Cell D: Student Email */}
                                <td className="px-4 py-3.5 border-r border-[#f1f1f1] text-[11px] text-slate-500 font-medium">
                                  {reg.email}
                                </td>

                                {/* Cell E: Student Contact Phone */}
                                <td className="px-4 py-3.5 border-r border-[#f1f1f1] text-[11px] text-slate-750 font-bold">
                                  {reg.contact}
                                </td>

                                {/* Cell F: Call Method */}
                                <td className="px-4 py-3.5 border-r border-[#f1f1f1] text-xs text-center font-sans">
                                  {reg.preferredCallType === 'app' ? (
                                    <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded text-[9px] font-extrabold uppercase inline-flex items-center gap-1 font-sans">
                                      📱 On-App Call
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded text-[9px] font-extrabold uppercase inline-flex items-center gap-1 font-sans">
                                      💬 WhatsApp
                                    </span>
                                  )}
                                </td>

                                {/* Cell G: Price / Fee payment status */}
                                <td className="px-4 py-3.5 border-r border-[#f1f1f1] text-center">
                                  <span className="text-[9px] font-black px-2 py-0.5 rounded uppercase font-sans tracking-tight bg-amber-500/10 text-amber-700 border border-amber-500/15">
                                    {reg.priceText || 'FREE ACCESS'}
                                  </span>
                                </td>

                                {/* Cell H: Active Portal Sync status */}
                                <td className="px-4 py-3.5 text-center font-sans">
                                  {isPending && (
                                    <span className="px-2.5 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-[9px] font-black uppercase tracking-wider">
                                      PENDING
                                    </span>
                                  )}
                                  {isCalling && (
                                    <span className="px-2.5 py-0.5 bg-rose-500 text-white rounded-full text-[9px] font-black uppercase tracking-wider animate-pulse inline-flex items-center gap-1">
                                      📞 LIVE IN-CALL
                                    </span>
                                  )}
                                  {isEnded && (
                                    <span className="px-2.5 py-0.5 bg-slate-100 text-slate-500 rounded-full text-[9px] font-black uppercase tracking-wider">
                                      COMPLETED
                                    </span>
                                  )}
                                  {isCancelled && (
                                    <span className="px-2.5 py-0.5 bg-red-100 text-red-600 rounded-full text-[9px] font-black uppercase tracking-wide">
                                      CANCELLED
                                    </span>
                                  )}
                                  {!['pending', 'active_call', 'ended', 'cancelled'].includes(reg.status) && (
                                    <span className="px-2.5 py-0.5 bg-[#107c41]/10 text-[#107c41] rounded-full text-[9px] font-black uppercase tracking-wider">
                                      {reg.status?.toUpperCase() || 'SYNCED'}
                                    </span>
                                  )}
                                </td>

                              </tr>
                            );
                          });
                        })()}
                      </tbody>
                    </table>
                  </div>

                  {/* Inspector and Action Panel sidebar inside spreadsheet col-span-4 */}
                  <div className="xl:col-span-4 bg-slate-50 border border-slate-150 rounded-3xl p-5 flex flex-col justify-between">
                    {(() => {
                      const selectedReg = courseRegistrations.find(r => r.id === selectedRegId);
                      if (!selectedReg) {
                        return (
                          <div className="text-center py-16 flex flex-col items-center justify-center h-full text-slate-400 font-sans">
                            <span className="text-2xl mb-2">📋</span>
                            <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Excel Row Inspector</span>
                            <p className="text-[10px] mt-1 text-slate-400 max-w-[200px] leading-relaxed">
                              Click any student spreadsheet row to open the active communication control deck.
                            </p>
                          </div>
                        );
                      }

                      const isPending = selectedReg.status === 'pending';
                      const isCallActive = selectedReg.status === 'active_call';
                      const isEnded = selectedReg.status === 'ended';
                      const isEditingThisRow = isEditingRowId === selectedReg.id;

                      return (
                        <div className="space-y-5 h-full flex flex-col justify-between">
                          <div className="space-y-4">
                            
                            {/* Panel Header */}
                            <div className="border-b border-slate-200 pb-3 flex justify-between items-center">
                              <div>
                                <span className="text-[9px] bg-[#107c41]/10 text-[#107c41] border border-[#107c41]/20 px-2.5 py-0.5 rounded-md font-black tracking-wider uppercase block w-max">
                                  {isEditingThisRow ? "✏️ Spreadsheet Editor" : `Spreadsheet Row #${selectedReg.id.substring(0, 5).toUpperCase()}`}
                                </span>
                                <h4 className="text-sm font-black text-slate-800 mt-1">
                                  {isEditingThisRow ? "Edit Row Metadata" : selectedReg.name}
                                </h4>
                              </div>
                              <button 
                                onClick={() => {
                                  setSelectedRegId(null);
                                  setIsEditingRowId(null);
                                }}
                                className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-full transition-colors cursor-pointer"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>

                            {isEditingThisRow ? (
                              /* EDITING ROW ACTIVE FIELDS FORM */
                              <div className="space-y-3.5 text-xs">
                                {/* Field 1: Name */}
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold uppercase text-slate-400">Student Name / Nom de l'étudiant</label>
                                  <input 
                                    type="text"
                                    value={editRegName}
                                    onChange={e => setEditRegName(e.target.value)}
                                    className="w-full bg-white border border-slate-200 focus:border-[#107c41] outline-none px-3 py-2 rounded-xl text-xs font-bold text-slate-800 transition-colors"
                                  />
                                </div>

                                {/* Field 2: Contact Phone */}
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold uppercase text-slate-400">Contact Telephone Number</label>
                                  <input 
                                    type="text"
                                    value={editRegContact}
                                    onChange={e => setEditRegContact(e.target.value)}
                                    className="w-full bg-white border border-slate-200 focus:border-[#107c41] outline-none px-3 py-2 rounded-xl text-xs font-bold text-slate-800 transition-colors"
                                  />
                                </div>

                                {/* Field 3: Email Address */}
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold uppercase text-slate-400">Email Address</label>
                                  <input 
                                    type="email"
                                    value={editRegEmail}
                                    onChange={e => setEditRegEmail(e.target.value)}
                                    className="w-full bg-white border border-slate-200 focus:border-[#107c41] outline-none px-3 py-2 rounded-xl text-xs font-bold text-slate-800 transition-colors"
                                  />
                                </div>

                                {/* Field 4: Target Class / Formation Choice */}
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold uppercase text-slate-400">Target Class / courseware</label>
                                  <select 
                                    value={editRegClass}
                                    onChange={e => setEditRegClass(e.target.value)}
                                    className="w-full bg-white border border-slate-200 focus:border-[#107c41] outline-none px-3 py-2 rounded-xl text-xs font-bold text-slate-800 transition-colors"
                                  >
                                    <option value="">-- Generic Registration --</option>
                                    {formations.map((f: any) => (
                                      <option key={f.id} value={f.title}>{f.title}</option>
                                    ))}
                                  </select>
                                </div>

                                {/* Field 5: Call Preference */}
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold uppercase text-slate-400">Interaction Preference</label>
                                  <select 
                                    value={editRegCallType}
                                    onChange={e => setEditRegCallType(e.target.value as 'app' | 'whatsapp')}
                                    className="w-full bg-white border border-slate-200 focus:border-[#107c41] outline-none px-3 py-2 rounded-xl text-xs font-bold text-slate-800 transition-colors"
                                  >
                                    <option value="app">📱 Online In-App Video Call</option>
                                    <option value="whatsapp">💬 WhatsApp Direct Call</option>
                                  </select>
                                </div>

                                {/* Field 6: Fee status priceText */}
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold uppercase text-slate-400">Admissions Fee / Pricing Status</label>
                                  <select 
                                    value={editRegPriceText}
                                    onChange={e => setEditRegPriceText(e.target.value)}
                                    className="w-full bg-white border border-slate-200 focus:border-[#107c41] outline-none px-3 py-2 rounded-xl text-xs font-bold text-slate-800 transition-colors"
                                  >
                                    <option value="PENDING AUTHORIZATION">PENDING AUTHORIZATION</option>
                                    <option value="TUITION UNPAID">TUITION UNPAID (0%)</option>
                                    <option value="TUITION HALF-PAID">TUITION HAS DEPOSIT (50%)</option>
                                    <option value="FULLY PAID - ENROLLED">FULLY PAID - DIRECT ENROLLMENT</option>
                                    <option value="SCHOLARSHIP - WAIVED">SCHOLARSHIP - FEE WAIVED</option>
                                  </select>
                                </div>

                                {/* Field 7: Portal Status */}
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold uppercase text-slate-400">Database Portal Status</label>
                                  <select 
                                    value={editRegStatus}
                                    onChange={e => setEditRegStatus(e.target.value)}
                                    className="w-full bg-white border border-slate-200 focus:border-[#107c41] outline-none px-3 py-2 rounded-xl text-xs font-bold text-slate-800 transition-colors"
                                  >
                                    <option value="pending">PENDING ADMISSION</option>
                                    <option value="active_call">CALL IN PROGRESS</option>
                                    <option value="admitted">ADMITTED COHORT STUDENT</option>
                                    <option value="cancelled">CANCELLED APPLICATION</option>
                                  </select>
                                </div>

                                {/* Save Button */}
                                <div className="flex gap-2 pt-2">
                                  <button
                                    onClick={async () => {
                                      try {
                                        await updateDoc(doc(db, 'course_registrations', selectedReg.id), {
                                          name: editRegName.trim(),
                                          contact: editRegContact.trim(),
                                          email: editRegEmail.trim(),
                                          formationTitle: editRegClass.trim(),
                                          preferredCallType: editRegCallType,
                                          priceText: editRegPriceText,
                                          status: editRegStatus,
                                          needsAcknowledgement: true, // Forces student user to acknowledge changes
                                          lastChangedAt: { seconds: Math.floor(Date.now() / 1000) }
                                        });
                                        setIsEditingRowId(null);
                                        setNotification({ message: "Row metadata updated & live synchronized!", type: "success" });
                                        setTimeout(() => setNotification(null), 3000);
                                      } catch (err: any) {
                                        alert("Failed sync: " + err.message);
                                      }
                                    }}
                                    className="flex-1 py-2.5 bg-[#107c41] hover:bg-[#0b5c30] text-white font-extrabold text-[10px] tracking-wider uppercase rounded-xl cursor-pointer text-center"
                                  >
                                    💾 Save & Sync
                                  </button>
                                  <button
                                    onClick={() => setIsEditingRowId(null)}
                                    className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-extrabold text-[10px] tracking-wider uppercase rounded-xl cursor-pointer text-center"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              /* NORMAL VIEW MODE */
                              <>
                                {/* Core Details Row */}
                                <div className="space-y-2.5 text-xs text-slate-600 font-semibold font-mono">
                                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                                    <span className="text-slate-400 font-sans font-bold">COURSE:</span>
                                    <span className="text-[#211d3f] font-sans font-black max-w-[160px] truncate text-[11px]">{selectedReg.formationTitle}</span>
                                  </div>
                                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                                    <span className="text-slate-400 font-sans font-bold">TELEPHONE:</span>
                                    <span className="text-slate-800 font-bold">{selectedReg.contact}</span>
                                  </div>
                                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                                    <span className="text-slate-400 font-sans font-bold">EMAIL:</span>
                                    <span className="text-slate-800 truncate max-w-[170px]">{selectedReg.email}</span>
                                  </div>
                                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                                    <span className="text-slate-400 font-sans font-bold">CALL CHOICE:</span>
                                    <span className={`font-sans text-[10px] font-black px-2 py-0.5 rounded inline-flex items-center gap-1 ${
                                      selectedReg.preferredCallType === 'app'
                                        ? 'bg-indigo-50 border border-indigo-100 text-indigo-700'
                                        : 'bg-emerald-50 border border-emerald-100 text-emerald-700'
                                    }`}>
                                      {selectedReg.preferredCallType === 'app' ? '📱 IN-APP CALL' : '💬 WHATSAPP CALL'}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-400 font-sans font-bold">FEE STATUS:</span>
                                    <span className="text-[#107c41] font-sans font-black bg-emerald-50/50 px-2 py-0.5 rounded text-[10px] border border-emerald-100">{selectedReg.priceText}</span>
                                  </div>
                                </div>

                                {/* Info Box */}
                                <div className="p-3 bg-white border border-slate-150/80 rounded-2xl text-[10px] leading-relaxed text-slate-500 font-sans space-y-1.5">
                                  {selectedReg.preferredCallType === 'app' ? (
                                    <p>
                                      🌟 This student requested a <strong>Live On-App Call</strong>. 
                                      Starting the call automatically switches their active view into the live video feed.
                                    </p>
                                  ) : (
                                    <p>
                                      💬 This student requested a <strong>WhatsApp Call</strong>.
                                      Please run the WhatsApp caller button to open direct messaging thread. 
                                    </p>
                                  )}
                                  <p className="text-[9px] text-[#107c41] bg-emerald-50/40 p-1.5 rounded font-medium">
                                    🔐 <strong>NO AI INTERACTION:</strong> This live caller room runs strictly as a secure end-to-end communication portal. No AI bots can message or interfere.
                                  </p>
                                </div>

                                <button
                                  onClick={() => setIsEditingRowId(selectedReg.id)}
                                  className="w-full py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-[10px] tracking-wide uppercase rounded-xl cursor-pointer border border-indigo-100 transition-colors text-center"
                                >
                                  ✏️ Edit Excel Spreadsheet Cells
                                </button>
                              </>
                            )}
                          </div>

                          {/* Trigger Buttons */}
                          <div className="space-y-2 mt-4 pt-2 border-t border-slate-200 font-sans">
                            {selectedReg.preferredCallType === 'app' ? (
                              <button
                                onClick={async () => {
                                  setIsStartingCall(true);
                                  try {
                                    // 1. Mark registration status as 'calling' (dispatches a synchronous ping to student portal)
                                    await updateDoc(doc(db, 'course_registrations', selectedReg.id), {
                                      status: 'calling'
                                    });

                                    // 2. Open call on Admin side (starts with caller ringing interface state)
                                    if (onStartAdminCall) {
                                      onStartAdminCall({
                                        id: selectedReg.id,
                                        name: selectedReg.name,
                                        email: selectedReg.email,
                                        formationTitle: selectedReg.formationTitle,
                                        priceText: selectedReg.priceText
                                      });
                                    }
                                  } catch (err) {
                                    console.error("Failed starting live admin call:", err);
                                    alert("Could not start call. Check internet connection.");
                                  } finally {
                                    setIsStartingCall(false);
                                  }
                                }}
                                className="w-full py-3.5 bg-[#107c41] hover:bg-[#0b5c30] text-white font-extrabold text-[10px] tracking-wider uppercase rounded-xl cursor-pointer transition-all shadow-md active:scale-98 flex items-center justify-center gap-2"
                              >
                                <span>📱 START PORTAL ONLINE CALL</span>
                              </button>
                            ) : (
                              <a
                                href={`https://api.whatsapp.com/send?phone=${selectedReg.contact.replace(/[\s+]/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                onClick={async () => {
                                  try {
                                    await updateDoc(doc(db, 'course_registrations', selectedReg.id), {
                                      status: 'contacted'
                                    });
                                  } catch (e) {}
                                }}
                                className="w-full py-3.5 bg-[#107c41] hover:bg-[#0b5c30] text-white font-extrabold text-[10px] tracking-wider uppercase rounded-xl cursor-pointer transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 text-center"
                              >
                                <span>💬 START WHATSAPP CHAT Link</span>
                              </a>
                            )}

                            {/* Additional supportive actions */}
                            <div className="grid grid-cols-2 gap-2 text-center">
                              <button
                                onClick={async () => {
                                  if (confirm("Confirm candidate full admission? This marks their row index inside the spreadsheet.")) {
                                    try {
                                      await updateDoc(doc(db, 'course_registrations', selectedReg.id), {
                                        status: 'admitted'
                                      });
                                    } catch (e) {}
                                  }
                                }}
                                className="py-2.5 bg-slate-100 hover:bg-emerald-100 hover:text-emerald-800 text-slate-700 font-bold text-[9px] tracking-wide uppercase transition-colors rounded-xl cursor-pointer"
                              >
                                Mark Admitted
                              </button>
                              
                              <button
                                onClick={async () => {
                                  if (confirm("Permanently erase student row from the Class Admissions Excel Spreadsheet?")) {
                                    try {
                                      await deleteDoc(doc(db, 'course_registrations', selectedReg.id));
                                      setSelectedRegId(null);
                                    } catch (e) {}
                                  }
                                }}
                                className="py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-[9px] tracking-wide uppercase transition-colors rounded-xl cursor-pointer"
                              >
                                Delete Row
                              </button>
                            </div>
                          </div>

                        </div>
                      );
                    })()}
                  </div>

                </div>

              </div>

              {/* SECTION A & B: FORMATIONS & PRICE MANAGER + JOB RECRUITMENTS */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* SECTION A: FORMATIONS CATALOG MANAGER */}
              <div className="bg-white rounded-[2.2rem] p-6 md:p-8 shadow-xl border border-slate-100 flex flex-col gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2.5 h-6 bg-emerald-500 rounded-full" />
                    <h3 className="text-xl font-black text-slate-800">Formations & Prices Manager</h3>
                  </div>
                  <p className="text-xs text-slate-500 font-semibold leading-normal">
                    Advertise premium qualifications, technical bootcamps, or educational certifications with custom enrollment prices of your choice.
                  </p>
                </div>

                {/* Create Formation Form */}
                <form onSubmit={handleCreateFormation} className="bg-slate-50/50 p-5 rounded-3xl border border-slate-150 space-y-4">
                  <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider">Publish New Formation</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] text-slate-550 font-bold block mb-1">FORMATION TITLE</label>
                      <input 
                        type="text" 
                        placeholder="e.g. AI Prompt Engineering" 
                        value={newFormTitle}
                        onChange={e => setNewFormTitle(e.target.value)}
                        className="w-full border border-slate-200 focus:border-emerald-500 bg-white rounded-xl p-3 text-xs font-bold outline-none font-sans"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-550 font-bold block mb-1">TUITION PRICE (FCFA)</label>
                      <input 
                        type="number" 
                        placeholder="e.g. 10000" 
                        value={newFormPrice}
                        onChange={e => setNewFormPrice(e.target.value)}
                        className="w-full border border-slate-200 focus:border-emerald-500 bg-white rounded-xl p-3 text-xs font-mono font-bold outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-550 font-bold block mb-1">FORMATION OUTLINE & CURRICULUM</label>
                    <textarea 
                      placeholder="List details of course lengths, syllabus highlights, and certification outcomes..."
                      value={newFormDesc}
                      rows={3}
                      onChange={e => setNewFormDesc(e.target.value)}
                      className="w-full border border-slate-200 focus:border-emerald-500 bg-white rounded-xl p-3 text-xs font-medium outline-none resize-none font-sans"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isCreatingFormation}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs tracking-wider uppercase rounded-xl transition-all cursor-pointer shadow-sm shadow-emerald-700/10 flex items-center justify-center gap-2"
                  >
                    {isCreatingFormation ? 'Publishing...' : 'Catalog Formation'}
                  </button>
                </form>

                {/* Active Formations List */}
                <div className="space-y-4 flex-1">
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-2">Live Published Courseware ({formations.length})</h4>
                  
                  {formations.length > 0 ? (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                      {formations.map((form) => (
                        <div key={form.id} className="bg-white p-4.5 rounded-2xl border border-slate-100 flex justify-between items-center gap-4 hover:border-emerald-250 transition-colors">
                          <div className="space-y-1">
                            <h5 className="font-extrabold text-slate-800 text-sm leading-snug">{form.title}</h5>
                            <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">{form.description}</p>
                            <span className="inline-block bg-emerald-50 text-emerald-800 font-mono font-black text-[10px] px-2.5 py-0.5 rounded-md border border-emerald-100 mt-1">
                              Price: {form.price > 0 ? `${form.price.toLocaleString()} FCFA` : 'FREE ACCESS'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => setEditingFormation({
                                id: form.id,
                                title: form.title || '',
                                description: form.description || '',
                                price: form.price ?? 0
                              })}
                              className="p-2 sm:p-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl transition-colors cursor-pointer"
                              title="Edit Formation"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteFormation(form.id, form.title)}
                              className="p-2 sm:p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors cursor-pointer"
                              title="Withdraw Formation"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-slate-150 border-dashed rounded-3xl p-8 text-center flex flex-col items-center justify-center">
                      <span className="text-xs text-slate-400 font-bold">No custom formations currently saved.</span>
                      <p className="text-[10px] text-slate-400 mt-0.5 max-w-xs">Use the tool above to add active items. Students will dynamically see them in real-time!</p>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION B: JOBS RECRUITMENT MANAGER */}
              <div className="bg-white rounded-[2.2rem] p-6 md:p-8 shadow-xl border border-slate-100 flex flex-col gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2.5 h-6 bg-purple-500 rounded-full" />
                    <h3 className="text-xl font-black text-slate-800">Tutor Job Opportunities</h3>
                  </div>
                  <p className="text-xs text-slate-500 font-semibold leading-normal">
                    Post recruitment positions, grading reviewer vacancies, or secondary syllabus designer needs for eligible tutors or students.
                  </p>
                </div>

                {/* Create Job Form */}
                <form onSubmit={handleCreateJob} className="bg-slate-50/50 p-5 rounded-3xl border border-slate-150 space-y-4">
                  <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider">Publish New Job Vacancy</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] text-slate-550 font-bold block mb-1">VACANCY TITLE</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Part-time Physics Tutor" 
                        value={newJobTitle}
                        onChange={e => setNewJobTitle(e.target.value)}
                        className="w-full border border-slate-200 focus:border-purple-500 bg-white rounded-xl p-3 text-xs font-bold outline-none font-sans"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-550 font-bold block mb-1">PROPOSED PAYOUT BLOCK</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 5,000 FCFA / hour" 
                        value={newJobPayout}
                        onChange={e => setNewJobPayout(e.target.value)}
                        className="w-full border border-slate-200 focus:border-purple-500 bg-white rounded-xl p-3 text-xs font-bold outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-550 font-bold block mb-1">VACANCY OVERVIEW & TERMS</label>
                    <textarea 
                      placeholder="Outline student age brackets, timetables, and key responsibilities..."
                      value={newJobDesc}
                      rows={3}
                      onChange={e => setNewJobDesc(e.target.value)}
                      className="w-full border border-slate-200 focus:border-purple-500 bg-white rounded-xl p-3 text-xs font-medium outline-none resize-none font-sans"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isCreatingJob}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs tracking-wider uppercase rounded-xl transition-all cursor-pointer shadow-sm shadow-purple-700/10 flex items-center justify-center gap-2"
                  >
                    {isCreatingJob ? 'Advertising...' : 'Advertise Job'}
                  </button>
                </form>

                {/* Active Jobs List */}
                <div className="space-y-4 flex-1">
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-2">Live Advertised Positions ({jobs.length})</h4>
                  
                  {jobs.length > 0 ? (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                      {jobs.map((jb) => (
                        <div key={jb.id} className="bg-white p-4.5 rounded-2xl border border-slate-100 flex justify-between items-center gap-4 hover:border-purple-250 transition-colors">
                          <div className="space-y-1">
                            <h5 className="font-extrabold text-slate-800 text-sm leading-snug">{jb.title}</h5>
                            <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">{jb.description}</p>
                            <span className="inline-block bg-purple-50 text-purple-800 font-semibold text-[10px] px-2.5 py-0.5 rounded-md border border-purple-100 mt-1">
                              Compensation: <strong>{jb.payout}</strong>
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => setEditingJob({
                                id: jb.id,
                                title: jb.title || '',
                                description: jb.description || '',
                                payout: jb.payout || ''
                              })}
                              className="p-2 sm:p-2.5 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-xl transition-colors cursor-pointer"
                              title="Edit Job Opportunity"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteJob(jb.id, jb.title)}
                              className="p-2 sm:p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors cursor-pointer"
                              title="Withdraw Job Position"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-slate-150 border-dashed rounded-3xl p-8 text-center flex flex-col items-center justify-center">
                      <span className="text-xs text-slate-400 font-bold">No tutor openings advertised.</span>
                      <p className="text-[10px] text-slate-400 mt-0.5 max-w-xs">Use the tool above to add active job listings. Tutors can view and apply from the community area.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            </motion.div>
          )}

          {/* TAB 5: SECURITY HUB (Only for Ngandi Celestin) */}
          {activeTab === 'SECURITY' && adminName.trim().toLowerCase() === 'ngandi celestin' && (
            <motion.div
              key="security-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Left Column: Password Rotation */}
              <div className="lg:col-span-5 bg-white rounded-[2.2rem] p-6 md:p-8 shadow-sm border border-slate-100 flex flex-col gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2.5 h-6 bg-amber-500 rounded-full" />
                    <h3 className="text-xl font-black text-slate-800">Password Rotation</h3>
                  </div>
                  <p className="text-xs text-slate-500 font-semibold leading-normal">
                    Rotate the administration portal password. Any other logins with old coordinates are immediately invalidated.
                  </p>
                </div>

                <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-amber-850 font-bold text-xs uppercase">
                    <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                    MONTHLY SECURITY ROTATION STATUS
                  </div>
                  <div className="text-xs text-slate-600 mt-1 space-y-1">
                    <p>
                      <strong>Active Password:</strong>{" "}
                      <span className="font-mono bg-white px-2 py-0.5 rounded border border-amber-100 text-slate-800 tracking-wider">
                        ••••••••
                      </span>
                    </p>
                    <p>
                      <strong>Rotated For Month:</strong>{" "}
                      <span className="font-bold text-amber-900">
                        {adminConfig.lastUpdatedMonth || "Never Rotated"}
                      </span>
                    </p>
                    <p>
                      <strong>Last Updated By:</strong>{" "}
                      <span className="font-bold">
                        {adminConfig.lastUpdatedBy === adminName ? "You" : adminConfig.lastUpdatedBy || "System Init"}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider">Configure New Master Password</h4>
                  
                  <div>
                    <label className="text-[10px] text-slate-550 font-bold block mb-1">NEW MASTER PASSWORD</label>
                    <input 
                      type="text" 
                      placeholder="Enter new admin code..." 
                      value={newAdminPasswordInput}
                      onChange={e => setNewAdminPasswordInput(e.target.value)}
                      className="w-full border border-slate-200 focus:border-amber-500 bg-slate-50/50 rounded-xl p-3.5 text-xs font-bold font-sans outline-none"
                    />
                  </div>

                  <button
                    onClick={() => handleUpdateAdminPassword(newAdminPasswordInput)}
                    disabled={isUpdatingPassword || !newAdminPasswordInput.trim()}
                    className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-md uppercase tracking-wide flex items-center justify-center gap-2"
                  >
                    <Key className="w-4 h-4" />
                    {isUpdatingPassword ? "Updating & Deploying..." : "Apply & Sync Master Password"}
                  </button>
                </div>
              </div>

              {/* Right Column: Active Admin Directory / Blocking Panel */}
              <div className="lg:col-span-7 bg-white rounded-[2.2rem] p-6 md:p-8 shadow-sm border border-slate-100 flex flex-col gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2.5 h-6 bg-red-500 rounded-full" />
                    <h3 className="text-xl font-black text-slate-800">Admin Directory & Security Blocks</h3>
                  </div>
                  <p className="text-xs text-slate-500 font-semibold leading-normal">
                    Block, restrict, or restore logins for peer administration staff to prevent unauthorized edits.
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] font-black tracking-widest text-slate-400 uppercase bg-slate-50/50">
                        <th className="py-3 px-4">ADMINISTRATOR</th>
                        <th className="py-3 px-4">REGISTRATION STATUS</th>
                        <th className="py-3 px-4 text-right">SECURITY ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {adminsList.map((admin) => {
                        const isSelf = admin.name?.toLowerCase().trim() === adminName?.toLowerCase().trim();
                        const isBlocked = !!admin.isBlocked;
                        const normId = admin.id;
                        
                        return (
                          <tr key={admin.id || admin.name} className="hover:bg-slate-50 transition-colors">
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <img
                                  src={admin.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${admin.name}`}
                                  alt={admin.name}
                                  className="w-8 h-8 rounded-full border border-slate-200"
                                />
                                <div>
                                  <span className="font-extrabold text-xs text-slate-900 block font-sans">
                                    {admin.name} {isSelf && <span className="text-amber-600 font-normal text-[10px]">(You)</span>}
                                  </span>
                                  {admin.email ? (
                                    <span className="text-[10px] text-indigo-600 font-bold block leading-none my-1 font-sans">
                                      Email: {admin.email}
                                    </span>
                                  ) : (
                                    admin.name?.toLowerCase().trim() !== 'ngandi celestin' && (
                                      <span className="text-[10px] text-slate-400 block tracking-wide mt-0.5">
                                        No Email Registered
                                      </span>
                                    )
                                  )}
                                  <span className="text-[10px] text-slate-400">
                                    ID: /{admin.id}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              {isBlocked ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 text-rose-700 text-[9px] font-bold rounded-lg border border-rose-100 uppercase animate-pulse">
                                  <Ban className="w-3 h-3" /> Blocked
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[9px] font-bold rounded-lg border border-emerald-100 uppercase">
                                  <UserCheck className="w-3 h-3" /> Active
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-4 text-right">
                              {isSelf ? (
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                                  Super Admin Immutable
                                </span>
                              ) : (
                                <div className="flex flex-col sm:flex-row items-end sm:items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => handleToggleBlockAdmin(normId, isBlocked)}
                                    className={`px-3 py-1.5 rounded-lg border font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer ${
                                      isBlocked
                                        ? "bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border-emerald-200"
                                        : "bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border-rose-200"
                                    }`}
                                  >
                                    {isBlocked ? "Unblock" : "Block"}
                                  </button>
                                  
                                  <button
                                    onClick={() => handleRemoveAdminDefinitely(normId, admin.name, admin.email)}
                                    className="px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-600 text-red-700 hover:text-white font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer"
                                    title="Permanently remove and ban this admin"
                                  >
                                    Remove Definitely & Ban
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {adminsList.length === 0 && (
                        <tr>
                          <td colSpan={3} className="text-center py-6 text-xs font-semibold text-slate-400">
                            No other administrator accounts synchronized yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Approved Admin Emails Register (Only for Celestin) */}
              <div id="approved-admin-emails-register" className="lg:col-span-5 bg-white rounded-[2.2rem] p-6 md:p-8 shadow-sm border border-slate-100 flex flex-col gap-6 mt-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2.5 h-6 bg-indigo-500 rounded-full" />
                    <h3 className="text-xl font-black text-slate-800 font-sans">Approved Admin Register</h3>
                  </div>
                  <p className="text-xs text-slate-500 font-semibold leading-normal">
                    List of pre-approved email addresses authorized to register or log in as administrators.
                  </p>
                </div>

                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="e.g. staff@nc.edu"
                    value={newAllowedEmailInput}
                    onChange={e => setNewAllowedEmailInput(e.target.value)}
                    className="flex-1 border border-slate-200 focus:border-indigo-500 bg-slate-50/50 rounded-xl p-3 text-xs font-bold font-sans outline-none text-slate-800"
                  />
                  <button
                    onClick={handleAddAllowedEmail}
                    disabled={isAddingEmail || !newAllowedEmailInput.trim()}
                    className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" /> Add
                  </button>
                </div>

                <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 border border-slate-100 rounded-2xl">
                  {allowedEmails.map((item) => (
                    <div key={item.id} className="p-3.5 flex items-center justify-between gap-3 bg-slate-50/30 hover:bg-slate-50 transition-colors">
                      <div className="font-mono text-xs font-bold text-slate-800 break-all">
                        {item.email}
                      </div>
                      <button
                        onClick={() => handleRemoveAllowedEmail(item.email)}
                        className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-100 transition-all cursor-pointer"
                        title="Revoke admin validation"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {allowedEmails.length === 0 && (
                    <div className="p-6 text-center text-xs font-semibold text-slate-400">
                      No external emails approved yet. Only Celestin is active.
                    </div>
                  )}
                </div>
              </div>

              {/* Administrative Activity Logs (Only for Celestin) */}
              <div id="admin-activity-audit-logs" className="lg:col-span-7 bg-white rounded-[2.2rem] p-6 md:p-8 shadow-sm border border-slate-100 flex flex-col gap-6 mt-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-2.5 h-6 bg-emerald-500 rounded-full" />
                      <h3 className="text-xl font-black text-slate-800 font-sans">Admin Activity Audit</h3>
                    </div>
                    <p className="text-xs text-slate-500 font-semibold leading-normal">
                      Track active session hours and audit administrative portal actions in real-time.
                    </p>
                  </div>

                  {/* Return to Admin's Dashboard button */}
                  {(selectedAuditedAdmin !== null || selectedAuditedDate !== null) && (
                    <button
                      onClick={() => {
                        setSelectedAuditedAdmin(null);
                        setSelectedAuditedDate(null);
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-950 font-extrabold text-[11px] rounded-xl transition-all flex items-center gap-1 cursor-pointer border border-slate-200"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Return to Dashboard
                    </button>
                  )}
                </div>

                {/* Main drill-down UI logic */}
                <div className="space-y-4 max-h-[26rem] overflow-y-auto pr-1">
                  {/* LEVEL 1: List of Audited Admin Names */}
                  {selectedAuditedAdmin === null && (
                    <div className="space-y-3">
                      <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">
                        Select an Admin to view activity
                      </span>
                      {(() => {
                        const loggedAdminNames = Array.from(new Set([
                          ...activityLogs.map(log => log.adminName),
                          ...adminTimeSpentList.map(item => item.adminName)
                        ].filter(Boolean)));

                        if (loggedAdminNames.length === 0) {
                          return (
                            <div className="p-8 text-center text-xs font-semibold text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                              No administrative activity or active sessions recorded yet.
                            </div>
                          );
                        }

                        return (
                          <div className="grid grid-cols-1 gap-2.5">
                            {loggedAdminNames.map((name) => {
                              // Find total activities count
                              const totalActionsCount = activityLogs
                                .filter(log => log.adminName === name)
                                .reduce((acc, curr) => acc + (curr.activities?.length || 0), 0);

                              // Find total seconds spent
                              const adminTimeRecords = adminTimeSpentList.filter(item => item.adminName === name);
                              const totalSecondsSpent = adminTimeRecords.reduce((acc, curr) => acc + (curr.secondsSpent || 0), 0);
                              
                              // Find email/contact info from any of their logs
                              const adminLogInfo = activityLogs.find(log => log.adminName === name);
                              const email = adminLogInfo?.email || 'System Account';

                              return (
                                <button
                                  key={name}
                                  onClick={() => setSelectedAuditedAdmin(name)}
                                  className="w-full text-left p-4 rounded-2xl border border-slate-150 bg-slate-50/50 hover:bg-indigo-50/25 hover:border-indigo-200 hover:shadow-sm transition-all flex items-center justify-between gap-4 cursor-pointer group"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0 group-hover:bg-indigo-100 transition-colors">
                                      <User className="w-5 h-5" />
                                    </div>
                                    <div>
                                      <h4 className="text-xs font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                        {name}
                                      </h4>
                                      <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                                        {email}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-4 shrink-0">
                                    <div className="text-right">
                                      <span className="text-[10px] font-black text-indigo-600 block">
                                        {formatSecondsSpent(totalSecondsSpent)} spent
                                      </span>
                                      <span className="text-[9px] text-slate-400 font-bold block mt-0.5">
                                        {totalActionsCount} logged actions
                                      </span>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* LEVEL 2: List of Days for a Selected Admin */}
                  {selectedAuditedAdmin !== null && selectedAuditedDate === null && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                        <div>
                          <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">
                            Viewing Admin Days
                          </span>
                          <h4 className="text-sm font-extrabold text-indigo-600">{selectedAuditedAdmin}</h4>
                        </div>
                        <button
                          onClick={() => setSelectedAuditedAdmin(null)}
                          className="px-2.5 py-1 text-[10px] font-extrabold text-slate-500 hover:text-slate-800 bg-slate-100 rounded-lg hover:bg-slate-200 transition-all"
                        >
                          Change Admin
                        </button>
                      </div>

                      {(() => {
                        const adminDays = Array.from(new Set([
                          ...adminTimeSpentList.filter(item => item.adminName === selectedAuditedAdmin).map(item => item.date),
                          ...activityLogs.filter(log => log.adminName === selectedAuditedAdmin).map(log => log.date)
                        ].filter(Boolean))).sort((a, b) => b.localeCompare(a));

                        if (adminDays.length === 0) {
                          return (
                            <div className="p-8 text-center text-xs font-semibold text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                              No recorded active days found for this administrator.
                            </div>
                          );
                        }

                        return (
                          <div className="grid grid-cols-1 gap-2">
                            {adminDays.map((date) => {
                              // Time spent on this specific day
                              const daySpentRecord = adminTimeSpentList.find(
                                item => item.adminName === selectedAuditedAdmin && item.date === date
                              );
                              const daySeconds = daySpentRecord?.secondsSpent || 0;

                              // Recorded activities on this specific day
                              const dayLog = activityLogs.find(
                                log => log.adminName === selectedAuditedAdmin && log.date === date
                              );
                              const dayActionsCount = dayLog?.activities?.length || 0;

                              return (
                                <button
                                  key={date}
                                  onClick={() => setSelectedAuditedDate(date)}
                                  className="w-full text-left p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-indigo-50/20 hover:border-indigo-150 hover:shadow-sm transition-all flex items-center justify-between gap-4 cursor-pointer group"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                                      <Calendar className="w-4 h-4" />
                                    </div>
                                    <div>
                                      <span className="text-xs font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                                        {date}
                                      </span>
                                      <span className="text-[10px] text-slate-400 font-bold block mt-0.5">
                                        In: {dayLog?.signInHour ? (dayLog.signInHour.includes(' ') ? dayLog.signInHour.split(' ')[1] : dayLog.signInHour) : 'N/A'}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-3 shrink-0">
                                    <div className="text-right">
                                      <span className="text-xs font-extrabold text-emerald-600 block">
                                        {formatSecondsSpent(daySeconds)} Active
                                      </span>
                                      <span className="text-[9px] text-indigo-500 font-bold block mt-0.5">
                                        {dayActionsCount} actions logged
                                      </span>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* LEVEL 3: Detailed Activities List for Selected Day */}
                  {selectedAuditedAdmin !== null && selectedAuditedDate !== null && (
                    <div className="space-y-4">
                      {/* Sub-Header */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                        <div>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">
                              Detailed Activity Logs
                            </span>
                          </div>
                          <h4 className="text-sm font-extrabold text-slate-900">
                            {selectedAuditedAdmin} • <span className="text-indigo-600">{selectedAuditedDate}</span>
                          </h4>
                        </div>
                        <button
                          onClick={() => setSelectedAuditedDate(null)}
                          className="px-2.5 py-1.5 text-[10px] font-extrabold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-all flex items-center gap-1"
                        >
                          <ArrowLeft className="w-3 h-3" /> Back to Days
                        </button>
                      </div>

                      {/* Day Stats Block */}
                      {(() => {
                        const daySpentRecord = adminTimeSpentList.find(
                          item => item.adminName === selectedAuditedAdmin && item.date === selectedAuditedDate
                        );
                        const daySeconds = daySpentRecord?.secondsSpent || 0;

                        const dayLog = activityLogs.find(
                          log => log.adminName === selectedAuditedAdmin && log.date === selectedAuditedDate
                        );

                        return (
                          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-indigo-50/30 border border-indigo-100/50">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
                              <div>
                                <span className="text-[9px] text-indigo-500 font-black uppercase tracking-wide block">
                                  App Duration
                                </span>
                                <span className="text-xs font-black text-indigo-950">
                                  {formatSecondsSpent(daySeconds)}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Activity className="w-4 h-4 text-emerald-600 shrink-0" />
                              <div>
                                <span className="text-[9px] text-emerald-600 font-black uppercase tracking-wide block">
                                  Actions Recorded
                                </span>
                                <span className="text-xs font-black text-slate-900">
                                  {dayLog?.activities?.length || 0} items
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Actual Activities List */}
                      <div className="space-y-2">
                        <span className="text-[9px] text-slate-400 font-black uppercase tracking-wide block">
                          Recorded Audit Logs
                        </span>
                        {(() => {
                          const dayLog = activityLogs.find(
                            log => log.adminName === selectedAuditedAdmin && log.date === selectedAuditedDate
                          );
                          const activitiesList = dayLog?.activities || [];

                          if (activitiesList.length === 0) {
                            return (
                              <div className="p-6 text-center text-xs font-semibold text-slate-400 bg-slate-50 border border-slate-150 rounded-2xl">
                                No active portal actions logged on this date.
                              </div>
                            );
                          }

                          return (
                            <ul className="space-y-1.5">
                              {activitiesList.map((act: string, idx: number) => (
                                <li
                                  key={idx}
                                  className="font-sans text-xs text-slate-700 leading-relaxed pl-3 border-l-2 border-indigo-500/50 py-1 bg-slate-50/50 rounded-r-xl"
                                >
                                  {act}
                                </li>
                              ))}
                            </ul>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Lower Section: Security Alerts & Intrusion Log */}
              <div id="security-alerts-logs" className="lg:col-span-12 bg-white rounded-[2.2rem] p-6 md:p-8 shadow-sm border border-slate-100 flex flex-col gap-6 mt-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldAlert className="w-5 h-5 text-red-600 animate-pulse" />
                    <h3 className="text-xl font-black text-slate-800">Security Access Alerts ({securityLogs.length})</h3>
                  </div>
                  <p className="text-xs text-slate-500 font-semibold leading-normal">
                    Realtime security notifications of unauthorized sign-up attempts as Chief Administrator <strong className="text-slate-900">Ngandi Celestin</strong>.
                  </p>
                </div>

                <div className="space-y-4">
                  {securityLogs.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {securityLogs.map((log) => (
                        <div key={log.id} className="p-5 rounded-2xl bg-rose-50/50 border border-rose-100 flex flex-col justify-between gap-3 hover:border-rose-250 transition-colors">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-3">
                              <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] uppercase font-extrabold tracking-wider leading-none">
                                Rejected Registry
                              </span>
                              <span className="text-[10px] text-slate-400 font-bold font-mono shrink-0">
                                {log.date} @ {log.hour}
                              </span>
                            </div>
                            
                            <p className="text-xs text-slate-700 font-bold leading-relaxed">
                              {log.message}
                            </p>
                          </div>

                          <div className="pt-2.5 border-t border-rose-100/50 flex flex-col gap-1">
                            <span className="text-[9px] text-slate-400 font-black uppercase tracking-wide">
                              Attempted Email Address
                            </span>
                            <span className="text-xs text-rose-900 font-mono font-bold break-all">
                              {log.email || 'No email provided'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-slate-50 border border-slate-150 border-dashed rounded-[2rem] flex flex-col items-center justify-center">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 border border-emerald-100 shadow-sm">
                        <Check className="w-5 h-5" />
                      </div>
                      <span className="text-xs text-slate-700 font-black">All Systems Secure</span>
                      <p className="text-[10px] text-slate-400 font-semibold mt-1">No sign-up or registry intrusions detected for Celestin's profile.</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 6: MENTOR REFERRALS HUB (Only for Ngandi Celestin) */}
          {activeTab === 'MENTOR' && adminName.trim().toLowerCase() === 'ngandi celestin' && (
            <motion.div
              key="mentor-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="bg-white rounded-[2.2rem] p-6 md:p-8 shadow-sm border border-slate-100 flex flex-col gap-8"
            >
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2.5 h-6 bg-purple-600 rounded-full" />
                  <h3 className="text-xl font-black text-slate-800">Tutor Referrals & Student Registration Management</h3>
                </div>
                <p className="text-xs text-slate-500 font-semibold leading-normal">
                  Chief Administrator Ngandi Celestin: View real-time tutor names, tutor emails, and referral responses from students registering under a tutor or completing subscription surveys.
                </p>
              </div>

              {/* Section 1: Direct Tutor Registered Students */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-purple-600" />
                    Students Registered Under a Tutor ({students.filter(s => s.tutorName || s.tutorEmail || s.registeredUnderTutor).length})
                  </h4>
                </div>

                {students.filter(s => s.tutorName || s.tutorEmail || s.registeredUnderTutor).length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 border border-slate-150 border-dashed rounded-[1.8rem]">
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest font-mono">No direct tutor registrations recorded yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-purple-100 rounded-2xl">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-purple-50/60 border-b border-purple-100 text-[10px] font-black uppercase tracking-wider text-purple-900">
                          <th className="py-3 px-4">Student ID</th>
                          <th className="py-3 px-4">Student Name</th>
                          <th className="py-3 px-4">Student Email</th>
                          <th className="py-3 px-4">Assigned Tutor Name</th>
                          <th className="py-3 px-4">Tutor Email Address</th>
                          <th className="py-3 px-4">Date Registered</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-bold">
                        {students
                          .filter(s => s.tutorName || s.tutorEmail || s.registeredUnderTutor)
                          .map((st) => (
                            <tr key={st.id} className="hover:bg-purple-50/20 transition-colors">
                              <td className="py-3 px-4 font-mono font-black text-purple-950">
                                {st.studentId ? `STU-${st.studentId}` : 'STU-GUEST'}
                              </td>
                              <td className="py-3 px-4">{st.fullName || st.name || st.email?.split('@')[0]}</td>
                              <td className="py-3 px-4 font-mono text-slate-500 text-[11px] font-normal">{st.email}</td>
                              <td className="py-3 px-4 font-extrabold text-purple-900 bg-purple-50/50 rounded-lg px-2 py-1">
                                👨‍🏫 {st.tutorName || 'Unspecified Name'}
                              </td>
                              <td className="py-3 px-4 font-mono text-purple-800 text-[11px]">
                                📧 {st.tutorEmail || 'Unspecified Email'}
                              </td>
                              <td className="py-3 px-4 text-slate-400 font-mono text-[10px]">
                                {st.createdAt?.seconds 
                                  ? new Date(st.createdAt.seconds * 1000).toLocaleDateString()
                                  : 'N/A'}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Section 2: Subscription Survey Referral Responses */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                  Subscription Survey Referral History ({mentorAnswers.length})
                </h4>

                {/* Counters / Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-150/40">
                    <p className="text-[10px] text-purple-700 font-extrabold uppercase tracking-wider">Total Responses</p>
                    <p className="text-2xl font-black text-purple-950 mt-1 font-mono">{mentorAnswers.length}</p>
                  </div>
                  <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-150/40">
                    <p className="text-[10px] text-emerald-700 font-extrabold uppercase tracking-wider">Independent (No Tutor)</p>
                    <p className="text-2xl font-black text-emerald-950 mt-1 font-mono">
                      {mentorAnswers.filter(a => a.referralType === 'alone' || a.referralType === 'no_tutor').length}
                    </p>
                  </div>
                  <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-150/40">
                    <p className="text-[10px] text-blue-700 font-extrabold uppercase tracking-wider">Under a Tutor</p>
                    <p className="text-2xl font-black text-blue-950 mt-1 font-mono">
                      {mentorAnswers.filter(a => a.referralType === 'accompanied' || a.referralType === 'under_tutor').length}
                    </p>
                  </div>
                </div>

                {/* Table list */}
                {mentorAnswers.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 border border-slate-150 border-dashed rounded-[1.8rem]">
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest font-mono">No responses submitted yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-400">
                          <th className="py-3 px-4">Date</th>
                          <th className="py-3 px-4">Student ID</th>
                          <th className="py-3 px-4">Student Name</th>
                          <th className="py-3 px-4">Student Email</th>
                          <th className="py-3 px-4">Chosen Plan</th>
                          <th className="py-3 px-4">Answer Status</th>
                          <th className="py-3 px-4">Tutor Name & Email</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 text-xs text-slate-700 font-bold">
                        {mentorAnswers.map((ans) => {
                          const dateText = ans.createdAt?.seconds 
                            ? new Date(ans.createdAt.seconds * 1000).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                            : ans.createdAt ? new Date(ans.createdAt).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A';
                          return (
                            <tr key={ans.id} className="hover:bg-slate-50/40 transition-colors">
                              <td className="py-4 px-4 font-mono font-black text-slate-500">{dateText}</td>
                              <td className="py-4 px-4 font-mono font-black text-purple-950">{ans.studentId || 'N/A'}</td>
                              <td className="py-4 px-4">{ans.studentName || 'Student'}</td>
                              <td className="py-4 px-4 font-normal text-slate-500 font-sans">{ans.studentEmail}</td>
                              <td className="py-4 px-4">
                                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-[9px] uppercase font-black">
                                  {ans.plan || 'N/A'}
                                </span>
                              </td>
                              <td className="py-4 px-4">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] uppercase font-black tracking-wide ${
                                  ans.referralType === 'alone' || ans.referralType === 'no_tutor'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                                    : 'bg-blue-100 text-blue-800 border border-blue-200'
                                }`}>
                                  {ans.referralType === 'alone' || ans.referralType === 'no_tutor' ? '🙋‍♂️ No Tutor' : '👨‍🏫 Under a Tutor'}
                                </span>
                              </td>
                              <td className="py-4 px-4">
                                {ans.tutorName || ans.tutorEmail ? (
                                  <div className="text-[11px] font-bold text-purple-900 bg-purple-50 p-2 rounded-xl">
                                    <div>{ans.tutorName || 'N/A'}</div>
                                    <div className="text-[10px] font-mono text-purple-700 font-normal">{ans.tutorEmail || 'N/A'}</div>
                                  </div>
                                ) : (
                                  <span className="text-slate-400 font-normal text-[10px] italic">None</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </motion.div>
          )}




        </AnimatePresence>
      </main>

      {/* Forced monthly rotation trigger popup for Ngandi Celestin */}
      <AnimatePresence>
        {needsPasswordUpdate && !isPasswordModalShown && (
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-[2.5rem] shadow-3xl p-8 md:p-10 w-full max-w-sm border border-slate-100 flex flex-col gap-6 relative"
            >
              <div className="flex gap-4 items-start">
                <div className="p-3 bg-amber-100 text-amber-700 rounded-2xl animate-bounce">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-xl leading-tight font-sans">Password Rotation</h3>
                  <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider font-sans mt-0.5">Required Action: Ngandi Celestin</p>
                </div>
              </div>

              <div className="text-xs text-slate-550 leading-relaxed font-semibold bg-amber-55/40 p-5 border border-amber-100 rounded-2xl font-sans space-y-2">
                <p>
                  As Chief Administrator <strong>Ngandi Celestin</strong>, you are required to rotate the administrative password for the new month <span className="text-amber-805 font-extrabold">{currentMonth}</span>.
                </p>
                <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                  This secure practice preserves operation safety on NC.edu. Any older passwords will be automatically invalidated.
                </p>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] text-slate-500 font-bold block mb-1">ENTER THE NEW PASSWORD PASSWORD</label>
                <input
                  type="text"
                  placeholder="Set new master password..."
                  value={newAdminPasswordInput}
                  onChange={e => setNewAdminPasswordInput(e.target.value)}
                  className="w-full border border-slate-200 focus:border-amber-500 bg-slate-50/50 rounded-xl p-3.5 text-xs font-bold outline-none"
                />
                
                <button
                  type="button"
                  onClick={() => handleUpdateAdminPassword(newAdminPasswordInput)}
                  disabled={isUpdatingPassword || !newAdminPasswordInput.trim()}
                  className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-amber-500/15 transition-all flex items-center justify-center gap-2 uppercase tracking-wide cursor-pointer text-center"
                >
                  <Key className="w-4 h-4 text-white" />
                  {isUpdatingPassword ? "Rotated & Syncing..." : "Rotate & Apply Password"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Dynamic Profile Photograph Modal Change Utility */}
      <AnimatePresence>
        {isPhotoModalOpen && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2rem] shadow-2xl p-6 w-full max-w-sm border border-slate-100 flex flex-col gap-4 relative"
            >
              <button
                type="button"
                onClick={() => setIsPhotoModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="text-center">
                <h3 className="font-extrabold text-slate-950 text-base leading-tight font-display mb-1">Update Officer Photograph</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Dynamic admin workspace settings</p>
              </div>

              <PhotoUploader 
                currentPhotoUrl={currentAdminPhoto} 
                onPhotoCaptured={handleUpdateAdminPhoto}
                onClear={() => handleUpdateAdminPhoto('')}
              />

              <button
                type="button"
                onClick={() => setIsPhotoModalOpen(false)}
                className="w-full py-3 bg-slate-900 hover:bg-slate-950 text-white font-extrabold text-xs tracking-wider uppercase rounded-xl transition-all cursor-pointer shadow-sm mt-2"
              >
                Done
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Formation Modal */}
      <AnimatePresence>
        {editingFormation && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2rem] shadow-2xl p-6 md:p-8 w-full max-w-lg border border-slate-100 flex flex-col gap-6 relative font-sans"
            >
              <button
                type="button"
                onClick={() => setEditingFormation(null)}
                className="absolute top-5 right-5 p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex gap-4 items-center">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
                  <Pencil className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg leading-snug">Edit Professional Formation</h3>
                  <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Update Broadcasted Courseware Details</p>
                </div>
              </div>

              <form onSubmit={handleUpdateFormation} className="space-y-4">
                <div>
                  <label className="text-[10px] text-slate-500 font-bold block mb-1 uppercase tracking-wider">Formation Title</label>
                  <input
                    type="text"
                    required
                    value={editingFormation.title}
                    onChange={e => setEditingFormation({ ...editingFormation, title: e.target.value })}
                    className="w-full border border-slate-200 focus:border-emerald-500 bg-white rounded-xl p-3 text-xs font-bold outline-none font-sans"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 font-bold block mb-1 uppercase tracking-wider">Price (FCFA)</label>
                  <input
                    type="number"
                    required
                    value={editingFormation.price}
                    onChange={e => setEditingFormation({ ...editingFormation, price: e.target.value })}
                    className="w-full border border-slate-200 focus:border-emerald-500 bg-white rounded-xl p-3 text-xs font-bold outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 font-bold block mb-1 uppercase tracking-wider">Overview & Modules</label>
                  <textarea
                    required
                    rows={4}
                    value={editingFormation.description}
                    onChange={e => setEditingFormation({ ...editingFormation, description: e.target.value })}
                    className="w-full border border-slate-200 focus:border-emerald-500 bg-white rounded-xl p-3 text-xs font-medium outline-none resize-none font-sans"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingFormation(null)}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer font-sans"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md shadow-emerald-700/10 font-sans"
                  >
                    Save & Update
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Tournament Modal */}
      <AnimatePresence>
        {editingTournament && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2rem] shadow-2xl p-6 md:p-8 w-full max-w-lg border border-slate-100 flex flex-col gap-6 relative font-sans max-h-[90vh] overflow-y-auto"
            >
              <button
                type="button"
                onClick={() => setEditingTournament(null)}
                className="absolute top-5 right-5 p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex gap-4 items-center">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
                  <Pencil className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg leading-snug">Edit Academic Tournament</h3>
                  <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Update Broadcasted Cash Tournament</p>
                </div>
              </div>

              <form onSubmit={handleUpdateTournament} className="space-y-4">
                <div>
                  <label className="text-[10px] text-slate-500 font-bold block mb-1 uppercase tracking-wider">Tournament Title</label>
                  <input
                    type="text"
                    required
                    value={editingTournament.title}
                    onChange={e => setEditingTournament({ ...editingTournament, title: e.target.value })}
                    className="w-full border border-slate-200 focus:border-indigo-500 bg-white rounded-xl p-3 text-xs font-bold outline-none font-sans"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block mb-1 uppercase tracking-wider">Target Dates</label>
                    <input
                      type="text"
                      required
                      value={editingTournament.dates}
                      onChange={e => setEditingTournament({ ...editingTournament, dates: e.target.value })}
                      className="w-full border border-slate-200 focus:border-indigo-500 bg-white rounded-xl p-3 text-xs font-bold outline-none font-sans"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block mb-1 uppercase tracking-wider">Event Time Window</label>
                    <input
                      type="text"
                      required
                      value={editingTournament.time}
                      onChange={e => setEditingTournament({ ...editingTournament, time: e.target.value })}
                      className="w-full border border-slate-200 focus:border-indigo-500 bg-white rounded-xl p-3 text-xs font-bold outline-none font-sans"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block mb-1 uppercase tracking-wider">Rounds/Stages</label>
                    <input
                      type="text"
                      required
                      value={editingTournament.stages}
                      onChange={e => setEditingTournament({ ...editingTournament, stages: e.target.value })}
                      className="w-full border border-slate-200 focus:border-indigo-500 bg-white rounded-xl p-3 text-xs font-bold outline-none font-sans"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block mb-1 uppercase tracking-wider">Required Student Count</label>
                    <input
                      type="number"
                      required
                      value={editingTournament.requiredStudents}
                      onChange={e => setEditingTournament({ ...editingTournament, requiredStudents: e.target.value })}
                      className="w-full border border-slate-200 focus:border-indigo-500 bg-white rounded-xl p-3 text-xs font-bold outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 font-bold block mb-1 uppercase tracking-wider">Cash Prizes & Awards</label>
                  <input
                    type="text"
                    required
                    value={editingTournament.prizes}
                    onChange={e => setEditingTournament({ ...editingTournament, prizes: e.target.value })}
                    className="w-full border border-slate-200 focus:border-indigo-500 bg-white rounded-xl p-3 text-xs font-bold outline-none font-sans"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingTournament(null)}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer font-sans"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md shadow-indigo-700/10 font-sans"
                  >
                    Save & Update
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Job Opportunity Modal */}
      <AnimatePresence>
        {editingJob && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2rem] shadow-2xl p-6 md:p-8 w-full max-w-lg border border-slate-100 flex flex-col gap-6 relative font-sans"
            >
              <button
                type="button"
                onClick={() => setEditingJob(null)}
                className="absolute top-5 right-5 p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex gap-4 items-center">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl border border-purple-100">
                  <Pencil className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg leading-snug">Edit Job Opportunity</h3>
                  <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Update Live Advertised Vacancy</p>
                </div>
              </div>

              <form onSubmit={handleUpdateJob} className="space-y-4">
                <div>
                  <label className="text-[10px] text-slate-500 font-bold block mb-1 uppercase tracking-wider">Vacancy Title</label>
                  <input
                    type="text"
                    required
                    value={editingJob.title}
                    onChange={e => setEditingJob({ ...editingJob, title: e.target.value })}
                    className="w-full border border-slate-200 focus:border-purple-500 bg-white rounded-xl p-3 text-xs font-bold outline-none font-sans"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 font-bold block mb-1 uppercase tracking-wider">Proposed Payout Block</label>
                  <input
                    type="text"
                    required
                    value={editingJob.payout}
                    onChange={e => setEditingJob({ ...editingJob, payout: e.target.value })}
                    className="w-full border border-slate-200 focus:border-purple-500 bg-white rounded-xl p-3 text-xs font-bold outline-none font-sans"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 font-bold block mb-1 uppercase tracking-wider">Vacancy Overview & Terms</label>
                  <textarea
                    required
                    rows={4}
                    value={editingJob.description}
                    onChange={e => setEditingJob({ ...editingJob, description: e.target.value })}
                    className="w-full border border-slate-200 focus:border-purple-500 bg-white rounded-xl p-3 text-xs font-medium outline-none resize-none font-sans"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingJob(null)}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer font-sans"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md shadow-purple-700/10 font-sans"
                  >
                    Save & Update
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Official Degree / Diploma Inspection Modal for Chief Admin Ngandi Celestin */}
      <AnimatePresence>
        {viewingCertModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6 font-sans">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[2.5rem] shadow-2xl p-6 sm:p-8 w-full max-w-2xl border border-slate-100 flex flex-col gap-5 relative max-h-[90vh] overflow-y-auto"
            >
              <button
                type="button"
                onClick={() => setViewingCertModal(null)}
                className="absolute top-6 right-6 p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl shrink-0">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Official Faculty Credentials</span>
                  <h3 className="text-xl font-black text-slate-900 font-display">{viewingCertModal.tutorName}</h3>
                  <p className="text-xs text-slate-500 font-medium">{viewingCertModal.subject} • {viewingCertModal.level}</p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-700">Official Degree / Diploma Photo Scan Document (Inspected by Chief Admin Ngandi Celestin):</p>
                <div className="bg-slate-900 rounded-2xl p-2 border border-slate-200 flex items-center justify-center min-h-[300px] max-h-[500px] overflow-hidden">
                  <img
                    src={viewingCertModal.certUrl}
                    alt={`Degree diploma scan for ${viewingCertModal.tutorName}`}
                    className="max-h-[460px] w-auto object-contain rounded-lg shadow-md"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <a
                  href={viewingCertModal.certUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md text-center inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  🔍 Open Full High-Res Document
                </a>
                <button
                  type="button"
                  onClick={() => setViewingCertModal(null)}
                  className="py-3 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  Close Inspection
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Premium Confirmation Dialog */}
      <AnimatePresence>
        {confirmModal.isOpen && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2rem] shadow-2xl p-6 md:p-8 w-full max-w-md border border-slate-100 flex flex-col gap-6 relative"
            >
              <button
                type="button"
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="absolute top-5 right-5 p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex gap-4 items-start">
                <div className={`p-3.5 rounded-2xl shrink-0 ${
                  confirmModal.actionType === 'delete' || confirmModal.actionType === 'ban'
                    ? 'bg-rose-50 text-rose-500 border border-rose-100'
                    : confirmModal.actionType === 'cleanup'
                    ? 'bg-amber-50 text-amber-600 border border-amber-100'
                    : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                }`}>
                  <Trash2 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-extrabold text-slate-900 text-lg leading-snug font-sans">{confirmModal.title}</h3>
                  <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider font-sans">Security Confirmation Required</p>
                </div>
              </div>

              <div className="text-xs text-slate-500 leading-relaxed font-semibold bg-slate-50/50 p-4 border border-slate-100 rounded-2xl font-sans">
                {confirmModal.message}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                  className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold text-xs tracking-wider uppercase rounded-xl transition-all cursor-pointer font-sans"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmModal.onConfirm}
                  className={`flex-1 py-3.5 text-white font-extrabold text-xs tracking-wider uppercase rounded-xl transition-all cursor-pointer shadow-md shadow-slate-900/5 font-sans ${
                    confirmModal.actionType === 'delete' || confirmModal.actionType === 'ban'
                      ? 'bg-rose-500 hover:bg-rose-600'
                      : confirmModal.actionType === 'cleanup'
                      ? 'bg-amber-500 hover:bg-amber-600'
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  Confirm & Action
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notifications Overlay */}
      <div id="admin-chat-notifications" className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 w-full max-w-sm pointer-events-none">
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
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500" />
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl shrink-0 mt-0.5">
                <Bell className="w-4 h-4 animate-bounce" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{notif.title}</span>
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
