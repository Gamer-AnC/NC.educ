import { motion, useScroll, useTransform, useSpring, useMotionValue, AnimatePresence } from "motion/react";
import { GraduationCap, BookOpen, MessageSquare, Menu, X, LogOut, LayoutDashboard, Crown, Sparkles, Lock, Globe, ShieldAlert, AlertTriangle } from "lucide-react";
import React, { useState, useEffect } from "react";
import { type User as FirebaseUser } from "firebase/auth";
import { doc, onSnapshot, updateDoc, getDoc, setDoc, serverTimestamp, Timestamp, collection, query, where, getDocs } from "firebase/firestore";
import { auth, db, handleFirestoreError, OperationType, onAuthStateChanged, signOut } from "./lib/firebase";
import AuthModal from "./components/AuthModal";
import LegalModal from "./components/LegalModal";
import TutorApplicationWizard from "./components/TutorApplicationWizard";
import TutorDashboard from "./components/TutorDashboard";
import StudentDashboard from "./components/StudentDashboard";
import StudentDashboardSkeleton from "./components/StudentDashboardSkeleton";
import StudentActionWizard from "./components/StudentActionWizard";
import AdminDashboard from "./components/AdminDashboard";
import CommunityModal from "./components/CommunityModal";
import ContactModal from "./components/ContactModal";
import RoleGateScreen from "./components/RoleGateScreen";
import VideoCallRoom from "./components/VideoCallRoom";
import { TRANSLATIONS, Language } from "./constants/translations";
import GceSlideshow from "./components/GceSlideshow";
import { ThreeDCard } from "./components/ThreeDCard";
import { ScrollTiltCard } from "./components/ScrollTiltCard";
import { InteractiveMeshBackground } from "./components/InteractiveMeshBackground";

// ... existing TypewriterText and FadeIn components ...

const TypewriterText = ({ text }: { text: string }) => {
  const letters = Array.from(text);
  const container = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.04 * i },
    }),
  };

  const child = {
    visible: { opacity: 1, y: 0, transition: { type: "spring" as const, damping: 12, stiffness: 200 } },
    hidden: { opacity: 0, y: 20, transition: { type: "spring" as const, damping: 12, stiffness: 200 } },
  };

  return (
    <motion.h1 className="text-3xl font-bold font-display tracking-tight" variants={container} initial="hidden" animate="visible">
      {letters.map((letter, index) => (
        <motion.span key={index} variants={child}>{letter === " " ? "\u00A0" : letter}</motion.span>
      ))}
    </motion.h1>
  );
};

const FadeIn = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay, ease: "easeOut" }}>
    {children}
  </motion.div>
);

interface UserData {
  email: string;
  studentId: number;
  hasPaid: boolean;
  trialEndsAt: any;
  createdAt: any;
  points?: number;
  completedRecommendedTopics?: string[];
  latestWeakAreas?: string[];
  latestRecommendedTopics?: string[];
  latestSubject?: string;
  latestGrade?: number;
  latestTestDate?: any;
  gapDeductionsApplied?: number;
  subscriptionEndsAt?: any;
  trialStartedAt?: any;
}

interface TutorData {
  userId: string;
  email: string;
  subject: string;
  photoUrl: string;
  localNumber: string;
  bio: string;
  tutorCode: string;
}

export default function App() {
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('appLanguage') as Language) || 'ENGLISH';
    }
    return 'ENGLISH';
  });

  useEffect(() => {
    localStorage.setItem('appLanguage', language);
  }, [language]);

  useEffect(() => {
    const handleOutsideClick = () => {
      setIsLangDropdownOpen(false);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => {
      window.removeEventListener('click', handleOutsideClick);
    };
  }, []);

  const [roleGatePassed, setRoleGatePassed] = useState<boolean>(() => {
    try {
      if (typeof window !== 'undefined') {
        const adminName = localStorage.getItem('nc_admin_name');
        if (adminName) return true;
      }
    } catch (e) {
      console.warn("Storage read", e);
    }
    return false;
  });
  const [adminSession, setAdminSession] = useState<{ name: string; email?: string; contactNumber?: string; photoUrl?: string } | null>(() => {
    try {
      if (typeof window !== 'undefined') {
        const name = localStorage.getItem('nc_admin_name');
        if (name) {
          const email = localStorage.getItem('nc_admin_email') || '';
          const contactNumber = localStorage.getItem('nc_admin_phone') || '';
          const photoUrl = localStorage.getItem('nc_admin_photo') || '';
          return { name, email, contactNumber, photoUrl };
        }
      }
    } catch (e) {
      console.warn("Storage read", e);
    }
    return null;
  });
  const [isCommunityOpen, setIsCommunityOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [isBannedUser, setIsBannedUser] = useState<boolean>(false);
  const [activeVideoCall, setActiveVideoCall] = useState<{ formationTitle: string; priceText: string; registrationId?: string } | null>(null);
  const [incomingCallReg, setIncomingCallReg] = useState<any | null>(null);
  const [activeAdminCall, setActiveAdminCall] = useState<any | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isTutorWizardOpen, setIsTutorWizardOpen] = useState(false);
  const [activeStudentWizard, setActiveStudentWizard] = useState<'find' | 'join' | 'ask' | 'scan' | 'study' | 'upgrade' | 'prep' | null>(null);
  const [activeWizardSubject, setActiveWizardSubject] = useState<string>('');
  const [activeWizardTopic, setActiveWizardTopic] = useState<string>('');
  const [currentView, setCurrentView] = useState<'home' | 'student'>('home');
  const [initialDashboardTab, setInitialDashboardTab] = useState<'home' | 'chat' | 'growth' | 'practicals'>('home');
  const [tutorShowHome, setTutorShowHome] = useState(false);
  const [adminShowHome, setAdminShowHome] = useState(false);
  const [legalModal, setLegalModal] = useState<{ isOpen: boolean; type: 'terms' | 'privacy' }>({
    isOpen: false,
    type: 'terms'
  });
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserDataReal] = useState<UserData | null>(() => {
    try {
      const saved = localStorage.getItem('nc_user_profile_cache');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const setUserData = (data: any) => {
    setUserDataReal((prev: any) => {
      const next = typeof data === 'function' ? data(prev) : data;
      try {
        if (next) {
          localStorage.setItem('nc_user_profile_cache', JSON.stringify(next));
        } else {
          localStorage.removeItem('nc_user_profile_cache');
        }
      } catch (e) {
        console.warn("Storage err", e);
      }
      return next;
    });
  };

  const [tutorData, setTutorDataReal] = useState<TutorData | null>(() => {
    try {
      const saved = localStorage.getItem('nc_tutor_profile_cache');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const setTutorData = (data: any) => {
    setTutorDataReal((prev: any) => {
      const next = typeof data === 'function' ? data(prev) : data;
      try {
        if (next) {
          localStorage.setItem('nc_tutor_profile_cache', JSON.stringify(next));
        } else {
          localStorage.removeItem('nc_tutor_profile_cache');
        }
      } catch (e) {
        console.warn("Storage err", e);
      }
      return next;
    });
  };

  const [isTutorLoading, setIsTutorLoading] = useState(true);
  const [firestoreOffline, setFirestoreOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOfflineEvent = () => {
      setFirestoreOffline(true);
    };
    window.addEventListener('firestore-connection-notice', handleOfflineEvent);
    const handleOnline = () => {
      setFirestoreOffline(false);
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOfflineEvent);
    return () => {
      window.removeEventListener('firestore-connection-notice', handleOfflineEvent);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOfflineEvent);
    };
  }, []);

  // --- DEEP LINKING AUTO ROUTER ENGINE ---
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash.replace('#', '');
    const view = params.get('view') || (hash === 'student' || hash === 'tutor' || hash === 'community' ? hash : null);
    const action = params.get('action');
    const subject = params.get('subject') || '';
    const topic = params.get('topic') || '';

    if (view === 'student') {
      setCurrentView('student');
      if (action) {
        setActiveStudentWizard(action as any);
        if (subject) setActiveWizardSubject(subject);
        if (topic) setActiveWizardTopic(topic);
      }
    } else if (view === 'tutor') {
      setTutorShowHome(true);
    } else if (view === 'community') {
      setIsCommunityOpen(true);
    }
  }, []);
  
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const springX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 50, damping: 20 });

  const bgScale = useTransform(springY, [0, 1], [1.1, 1]);
  const bgTranslateX = useTransform(springX, [0, 1], ["-2%", "2%"]);
  const bgTranslateY = useTransform(springY, [0, 1], ["-2%", "2%"]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX / window.innerWidth);
      mouseY.set(e.clientY / window.innerHeight);
    };

    window.addEventListener("mousemove", handleMouseMove);
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setUserData(null);
        setTutorData(null);
        setIsTutorLoading(false);
      }
    });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      unsubscribeAuth();
    };
  }, [mouseX, mouseY]);

  // Synchronized Caller state machine listener for candidate portal (Students)
  useEffect(() => {
    if (!user) {
      setIncomingCallReg(null);
      return;
    }

    const q = collection(db, "course_registrations");

    const unsub = onSnapshot(q, (snap) => {
      const registrations = snap.docs.map(d => ({ id: d.id, ...d.data() as any }));
      
      // Filter locally for registrations belonging to this user (supports anonymous matching and email variations)
      const myRegistrations = registrations.filter(r => {
        const matchesUid = r.userId === user.uid;
        const matchesEmail = user.email && r.email?.toLowerCase().trim() === user.email.toLowerCase().trim();
        return matchesUid || matchesEmail;
      });
      
      // 1. Identify any active calling state
      const caller = myRegistrations.find(r => r.status === 'calling');
      if (caller) {
        setIncomingCallReg(caller);
      } else {
        setIncomingCallReg(null);
      }

      // 2. Identify any accepted active_call state to automatically open VideoCallRoom
      const activeCall = myRegistrations.find(r => r.status === 'active_call');
      if (activeCall) {
        setActiveVideoCall({
          formationTitle: activeCall.formationTitle,
          priceText: activeCall.priceText,
          registrationId: activeCall.id
        });
      }
    }, (err) => {
      console.warn("Live caller stream tracking failed:", err);
    });

    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) {
      setIsBannedUser(false);
      return;
    }

    // Live monitor ban status
    let unsubscribeBan: (() => void) | null = null;
    if (user.email) {
      unsubscribeBan = onSnapshot(doc(db, "banned_users", user.email.toLowerCase().trim()), (snap) => {
        if (snap.exists()) {
          setIsBannedUser(true);
          // Set user states to null and force sign out to break active write loops
          setUserData(null);
          setTutorData(null);
          signOut(auth).catch(e => console.error("Sign out error", e));
        } else {
          setIsBannedUser(false);
        }
      });
    }

    const unsubscribeDoc = onSnapshot(doc(db, "users", user.uid), async (snap) => {
      if (snap.exists()) {
        const data = snap.data() as UserData;
        setUserData({ ...data, uid: user.uid });

        // --- DYNAMIC GAP DEDUCTION ENGINE ---
        try {
          const latestRecommendedTopics = data?.latestRecommendedTopics || [];
          const completedRecommendedTopics = data?.completedRecommendedTopics || [];
          const latestTestDate = data?.latestTestDate;

          if (latestTestDate && latestRecommendedTopics.length > 0) {
            const hasGaps = !latestRecommendedTopics.every((topic: string) => completedRecommendedTopics.includes(topic));
            let currentDeduction = 0;
            if (hasGaps) {
              let testDate: Date;
              if (latestTestDate && typeof latestTestDate.toDate === 'function') {
                testDate = latestTestDate.toDate();
              } else if (latestTestDate && typeof latestTestDate === 'object' && 'seconds' in latestTestDate) {
                testDate = new Date(latestTestDate.seconds * 1000);
              } else {
                testDate = new Date(latestTestDate);
              }
              const msDiff = Date.now() - testDate.getTime();
              const daysElapsed = Math.floor(msDiff / (1000 * 60 * 60 * 24));
              if (daysElapsed > 5) {
                currentDeduction = (daysElapsed - 5) * 0.5;
              }
            }

            const previousDeductions = data?.gapDeductionsApplied || 0;
            if (currentDeduction > previousDeductions) {
              const diff = currentDeduction - previousDeductions;
              const previousPoints = data?.points || 0;
              const newPoints = Math.max(0, previousPoints - diff);

              // Update user document
              await updateDoc(doc(db, 'users', user.uid), {
                points: newPoints,
                gapDeductionsApplied: currentDeduction
              });

              // Sync to leaderboard (test_scores)
              await setDoc(doc(db, 'test_scores', user.uid), {
                userId: user.uid,
                playerId: data?.studentId ? String(data.studentId) : `STU-${user.uid.slice(0, 5)}`,
                score: newPoints,
                role: 'student',
                email: data?.email || '',
                updatedAt: new Date()
              }, { merge: true });

              console.log(`[GapDeduction] Applied ${diff} points deduction. New points: ${newPoints}.`);
            }
          }
        } catch (e) {
          console.error("Error evaluating gap deduction:", e);
        }
        // ------------------------------------
      } else {
        const email = (user.email || `student_user_${user.uid.slice(0, 5)}@nc.edu`).trim().toLowerCase();
        
        // Double check if the user belongs to banned list before auto-re-creating!
        try {
          const banSnap = await getDoc(doc(db, "banned_users", email));
          if (banSnap.exists()) {
            setIsBannedUser(true);
            setUserData(null);
            setTutorData(null);
            await signOut(auth);
            return;
          }
        } catch (e: any) {
          const isOffline = e?.message?.toLowerCase().includes("offline") || e?.message?.toLowerCase().includes("could not reach") || !navigator.onLine;
          if (isOffline) {
            console.warn("Firestore is operating offline. Skipping real-time ban check, using cached safety.");
          } else {
            console.error("Error checking banned table", e);
          }
        }

        // Auto-provision a user profile document immediately so they are never stuck loading!
        let studentId = 0;
        let existingDocData: any = null;
        try {
          const q = query(collection(db, "users"), where("email", "==", email));
          const querySnap = await getDocs(q);
          if (!querySnap.empty) {
            existingDocData = querySnap.docs[0].data();
            studentId = existingDocData.studentId;
          }
        } catch (e: any) {
          const isOffline = e?.message?.toLowerCase().includes("offline") || e?.message?.toLowerCase().includes("could not reach") || !navigator.onLine;
          if (isOffline) {
            console.warn("Firestore is operating offline. Skipping existing email check, using local state.");
          } else {
            console.error("Error checking existing email: ", e);
          }
        }

        if (!studentId) {
          const match = email.match(/^student_(\d+)@/);
          studentId = match ? parseInt(match[1], 10) : Math.floor(1000 + Math.random() * 9000);
        }
        
        const trialDays = 7;
        const trialEndsAtDate = new Date();
        trialEndsAtDate.setDate(trialEndsAtDate.getDate() + trialDays);
        const trialEndsAtTimestamp = Timestamp.fromDate(trialEndsAtDate);
        
        const defaultDoc = {
          email: email,
          studentId: studentId,
          userSequence: existingDocData?.userSequence || 0,
          hasPaid: true,
          trialEndsAt: existingDocData?.trialEndsAt || trialEndsAtTimestamp,
          createdAt: existingDocData?.createdAt || serverTimestamp(),
          acceptedTerms: true
        };
        
        try {
          // Set state locally first so user gets into the dashboard instantly!
          setUserData(defaultDoc as any);
          // Set doc inside Firestore
          await setDoc(doc(db, "users", user.uid), defaultDoc);
        } catch (err: any) {
          const isOffline = err?.message?.toLowerCase().includes("offline") || err?.message?.toLowerCase().includes("could not reach") || !navigator.onLine;
          if (isOffline) {
            console.warn("Firestore is operating offline. User profile set locally, sync will happen once online.");
          } else {
            console.error("Error auto-provisioning user profile: ", err);
          }
          setUserData(defaultDoc as any);
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
    });

    const unsubscribeTutor = onSnapshot(doc(db, "tutors", user.uid), (snap) => {
      if (snap.exists()) {
        setTutorData(snap.data() as TutorData);
      } else {
        setTutorData(null);
      }
      setIsTutorLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `tutors/${user.uid}`);
      setIsTutorLoading(false);
    });

    return () => {
      unsubscribeDoc();
      unsubscribeTutor();
      if (unsubscribeBan) unsubscribeBan();
    };
  }, [user]);

  const isTrialActive = () => {
    if (userData?.trialStartedAt) {
      const startMs = userData.trialStartedAt.seconds 
        ? userData.trialStartedAt.seconds * 1000 
        : new Date(userData.trialStartedAt).getTime();
      if (Date.now() - startMs < 7 * 24 * 60 * 60 * 1000) return true;
      return false;
    }
    if (!userData?.trialEndsAt) return false;
    const now = new Date();
    let trialEnd: Date;
    if (typeof userData.trialEndsAt.toDate === 'function') {
      trialEnd = userData.trialEndsAt.toDate();
    } else if (userData.trialEndsAt.seconds) {
      trialEnd = new Date(userData.trialEndsAt.seconds * 1000);
    } else {
      trialEnd = new Date(userData.trialEndsAt);
    }
    return now < trialEnd;
  };

  const isUserPremium = () => {
    if (!userData) return false;
    // Check subscription Ends At
    if (userData.subscriptionEndsAt) {
      const endMs = userData.subscriptionEndsAt.seconds 
        ? userData.subscriptionEndsAt.seconds * 1000 
        : new Date(userData.subscriptionEndsAt).getTime();
      if (Date.now() < endMs) return true;
    }
    return false;
  };

  const hasAccess = (feature: string) => {
    if (!user) return false;
    if (isUserPremium()) return true;
    if (isTrialActive()) return true;
    return false;
  };

  const isLoadingData = user && !userData;

  const handleUpgrade = async () => {
    if (!user) return;
    try {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      await updateDoc(doc(db, "users", user.uid), { 
        hasPaid: true,
        premiumUpgradedAt: new Date().toISOString(),
        subscriptionEndsAt: thirtyDaysFromNow.toISOString(),
        expirationMessageSent: false
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleTutorClick = () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    if (tutorData) {
      setTutorShowHome(false);
      return;
    }
    setIsTutorWizardOpen(true);
    setIsMenuOpen(false);
  };

  const handleStudentClick = () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    setCurrentView('student');
    setIsMenuOpen(false);
  };

  const handleFeatureClick = (featureKey: string) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    setCurrentView('student');
    setIsMenuOpen(false);
    if (featureKey === 'liveChat') {
      setActiveStudentWizard('ask');
    } else if (featureKey === 'peerTutoring') {
      setActiveStudentWizard('find');
    } else if (featureKey === 'studyGroups') {
      setActiveStudentWizard('prep');
    }
  };

  if (adminSession && !adminShowHome) {
    if (activeAdminCall) {
      return (
        <VideoCallRoom 
          formationTitle={activeAdminCall.formationTitle}
          priceText={activeAdminCall.priceText}
          studentName={activeAdminCall.name}
          studentEmail={activeAdminCall.email}
          isAdmin={true}
          registrationId={activeAdminCall.id}
          onClose={() => setActiveAdminCall(null)}
        />
      );
    }
    return (
      <AdminDashboard 
        adminName={adminSession.name} 
        adminEmail={adminSession.email || ''}
        adminContact={adminSession.contactNumber || ''}
        adminPhotoUrl={adminSession.photoUrl || ''} 
        onLogout={() => { 
          localStorage.removeItem('nc_admin_name');
          localStorage.removeItem('nc_admin_email');
          localStorage.removeItem('nc_admin_phone');
          localStorage.removeItem('nc_admin_photo');
          setAdminSession(null); 
          setRoleGatePassed(false); 
        }} 
        onStartAdminCall={(callData) => {
          setActiveAdminCall(callData);
        }}
        activeAdminCall={activeAdminCall}
        onBackToHome={() => setAdminShowHome(true)}
      />
    );
  }

  if (!roleGatePassed) {
    return (
      <RoleGateScreen 
        onEnterAdmin={(name, email, contactNumber, photoUrl) => {
          localStorage.setItem('nc_admin_name', name);
          localStorage.setItem('nc_admin_email', email || '');
          localStorage.setItem('nc_admin_phone', contactNumber || '');
          localStorage.setItem('nc_admin_photo', photoUrl || '');
          setAdminSession({ name, email, contactNumber, photoUrl });
          setRoleGatePassed(true);
        }}
        onEnterOthers={() => {
          setRoleGatePassed(true);
        }}
      />
    );
  }

  if (isBannedUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center select-none font-sans">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md bg-slate-950 p-8 rounded-[2rem] border-2 border-red-500/20 shadow-2xl flex flex-col items-center"
        >
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500 flex items-center justify-center gap-1.5 shadow-lg mb-6">
            <ShieldAlert className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-red-550 font-black text-lg tracking-wider uppercase">ACCESS TEMPORARILY SUSPENDED</h2>
          <div className="w-12 h-1 bg-red-500 rounded-full mt-3 mb-6" />
          
          <div className="bg-slate-900 border border-white/5 rounded-2xl p-5 text-sm leading-relaxed text-slate-300 font-medium font-sans">
            "Your email <strong className="text-white font-mono break-all">{user?.email}</strong> has been banned from accessing the NC.edu dynamic operations by an official Administrator."
          </div>

          <p className="text-xs text-slate-500 leading-relaxed max-w-sm mt-4 font-semibold">
            All database handles, tutoring registrations, and dynamic spreadsheets for this email have been restricted by the admin.
          </p>

          <button 
            onClick={() => {
              signOut(auth);
              setIsBannedUser(false);
            }} 
            className="w-full mt-8 py-3.5 bg-gradient-to-r from-red-600 to-rose-700 text-white font-black uppercase text-xs tracking-wider rounded-xl cursor-pointer shadow-lg active:scale-98 transition-colors"
          >
            Acknowledge & Sign Out
          </button>
        </motion.div>
      </div>
    );
  }

  if (activeVideoCall) {
    return (
      <VideoCallRoom 
        formationTitle={activeVideoCall.formationTitle}
        priceText={activeVideoCall.priceText}
        studentName={userData ? ((userData as any).fullName || (userData as any).name || (userData.email ? userData.email.split('@')[0].toUpperCase() : 'STUDENT')) : (user?.email ? user.email.split('@')[0].toUpperCase() : 'STUDENT')}
        studentEmail={userData?.email || user?.email || ''}
        registrationId={activeVideoCall.registrationId}
        onClose={() => setActiveVideoCall(null)}
      />
    );
  }

  if (tutorData && !tutorShowHome) {
    return (
      <>
        <TutorDashboard 
          tutorData={tutorData} 
          userData={userData}
          onLogout={() => signOut(auth)} 
          onBackToHome={() => setTutorShowHome(true)} 
          onTriggerUpgrade={() => {
            setActiveStudentWizard('upgrade');
          }}
        />
        {activeStudentWizard && (
          <StudentActionWizard 
            type={activeStudentWizard as any} 
            userData={userData} 
            onClose={() => {
              setActiveStudentWizard(null);
              setActiveWizardSubject('');
              setActiveWizardTopic('');
            }} 
            language={language}
            initialSubject={activeWizardSubject}
            initialTopic={activeWizardTopic}
          />
        )}
      </>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {currentView === 'student' ? (
        <motion.div
          key="student-view-wrapper"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="min-h-screen"
        >
          {!userData ? (
            <StudentDashboardSkeleton />
          ) : (
            <>
              <StudentDashboard 
                userData={userData} 
                onAction={(type, subj, top) => {
                  setActiveWizardSubject(subj || '');
                  setActiveWizardTopic(top || '');
                  setActiveStudentWizard(type);
                }} 
                language={language}
                setLanguage={setLanguage}
                onInitiateVideoCall={(title, price) => setActiveVideoCall({ formationTitle: title, priceText: price })}
                onBackToHome={() => setCurrentView('home')}
                initialTab={initialDashboardTab}
              />
              {activeStudentWizard && (
                <StudentActionWizard 
                  type={activeStudentWizard as any} 
                  userData={userData} 
                  onClose={() => {
                    setActiveStudentWizard(null);
                    setActiveWizardSubject('');
                    setActiveWizardTopic('');
                  }} 
                  language={language}
                  initialSubject={activeWizardSubject}
                  initialTopic={activeWizardTopic}
                />
              )}
            </>
          )}
        </motion.div>
      ) : (
        <motion.div
          key="home-view-wrapper"
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 15 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="min-h-screen bg-[#f7f4ff] font-sans text-gray-900 selection:bg-blue-100 selection:text-blue-900 transition-colors duration-300"
        >
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onLoginSuccess={() => setCurrentView('student')} />
      <TutorApplicationWizard isOpen={isTutorWizardOpen} onClose={() => setIsTutorWizardOpen(false)} />
      <LegalModal 
        isOpen={legalModal.isOpen} 
        type={legalModal.type} 
        onClose={() => setLegalModal(prev => ({ ...prev, isOpen: false }))} 
      />
      <CommunityModal 
        isOpen={isCommunityOpen} 
        onClose={() => setIsCommunityOpen(false)} 
        language={language} 
        onInitiateVideoCall={(title, price, regId) => {
          setActiveVideoCall({ formationTitle: title, priceText: price, registrationId: regId });
          setIsCommunityOpen(false);
        }}
      />
      <ContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} language={language} />
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#2f47b3]/90 backdrop-blur-md text-white border-b border-white/10">
         <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <TypewriterText text="NC.edu" />
          
          <nav className="hidden md:flex items-center gap-8">
            <a href="#" className="font-semibold hover:text-blue-200 transition-colors">{TRANSLATIONS[language].home}</a>
            <button onClick={handleTutorClick} className="font-semibold hover:text-blue-200 transition-colors">{TRANSLATIONS[language].tutors}</button>
            <button onClick={handleStudentClick} className="font-semibold hover:text-blue-200 transition-colors">{TRANSLATIONS[language].students}</button>
            {adminSession && (
              <button onClick={() => setAdminShowHome(false)} className="font-semibold text-yellow-300 hover:text-yellow-400 transition-colors">Admin Portal</button>
            )}
            <button onClick={() => setIsCommunityOpen(true)} className="font-semibold hover:text-blue-200 transition-colors cursor-pointer">{TRANSLATIONS[language].community}</button>
          </nav>

          <div className="flex items-center gap-4">
            {/* Language Selector Dropdown */}
            <div className="relative">
              <button
                id="language-select-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsLangDropdownOpen(!isLangDropdownOpen);
                }}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-full text-xs transition-all flex items-center gap-2 border border-white/15 cursor-pointer shadow-sm hover:scale-105 active:scale-95"
                title="Change language"
              >
                <Globe className="w-3.5 h-3.5 text-blue-200" />
                <span>{language}</span>
              </button>
              
              {isLangDropdownOpen && (
                <div id="language-dropdown-menu" className="absolute right-0 mt-2 w-36 bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 transition-all duration-200 z-50">
                  {(['ENGLISH', 'FRENCH', 'CHINESE', 'SPANISH'] as Language[]).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => {
                        setLanguage(lang);
                        setIsLangDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-3 text-left text-xs font-bold transition-colors block cursor-pointer ${
                        language === lang 
                          ? 'bg-blue-600 text-white' 
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {lang === 'ENGLISH' && '🇺🇸 ENGLISH'}
                      {lang === 'FRENCH' && '🇫🇷 FRENCH'}
                      {lang === 'CHINESE' && '🇨🇳 CHINESE'}
                      {lang === 'SPANISH' && '🇪🇸 SPANISH'}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {user ? (
              <div className="flex items-center gap-4">
                <div className="hidden lg:flex flex-col items-end mr-2">
                  <span className="text-sm font-bold truncate max-w-[150px]">{user.email}</span>
                  <span className="text-[10px] bg-blue-500/50 px-2 py-0.5 rounded-full flex items-center gap-1">
                    ID: {userData?.studentId || '...'}
                  </span>
                </div>
                <button 
                  onClick={() => signOut(auth)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  title={TRANSLATIONS[language].signOut}
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setIsAuthModalOpen(true)}
                className="px-6 py-2 bg-white text-blue-600 font-bold rounded-full hover:bg-blue-50 transition-colors"
              >
                {TRANSLATIONS[language].signIn}
              </button>
            )}

            <button className="md:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        <motion.div initial={false} animate={isMenuOpen ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }} className="md:hidden bg-[#2f47b3] overflow-hidden px-6">
          <div className="py-6 flex flex-col gap-4 border-t border-white/10 text-left">
            <a href="#" className="font-semibold py-2">{TRANSLATIONS[language].home}</a>
            <button onClick={handleTutorClick} className="font-semibold py-2 text-left">{TRANSLATIONS[language].tutors}</button>
            <button onClick={handleStudentClick} className="font-semibold py-2 text-left">{TRANSLATIONS[language].students}</button>
            {adminSession && (
              <button onClick={() => { setAdminShowHome(false); setIsMenuOpen(false); }} className="font-semibold py-2 text-left text-yellow-400">Admin Portal</button>
            )}
            <button onClick={() => { setIsCommunityOpen(true); setIsMenuOpen(false); }} className="font-semibold py-2 text-left cursor-pointer">{TRANSLATIONS[language].community}</button>
            
            {/* Mobile Language Selector */}
            <div className="py-4 border-t border-white/10 mt-2">
              <span className="text-[10px] text-white/50 block font-bold uppercase tracking-wider mb-2">Select Language / Choisir la Langue</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {(['ENGLISH', 'FRENCH', 'CHINESE', 'SPANISH'] as Language[]).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => {
                      setLanguage(lang);
                      setIsMenuOpen(false);
                    }}
                    className={`px-3 py-2.5 rounded-xl border font-bold text-left flex items-center gap-1.5 transition-all text-[11px] ${
                      language === lang 
                        ? 'border-white bg-white text-[#2f47b3] font-black font-sans' 
                        : 'border-white/10 bg-white/5 text-white hover:bg-white/10'
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
          </div>
        </motion.div>
      </header>

      {/* Hero Section */}
      <section className="relative h-[90vh] flex items-center justify-center overflow-hidden bg-slate-900">
        <div className="absolute inset-0 z-10 bg-gradient-to-br from-slate-950/90 via-slate-900/80 to-indigo-950/90" />
        <motion.div style={{ scale: bgScale, x: bgTranslateX, y: bgTranslateY }} className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1400&q=80')] bg-cover bg-center opacity-25" />
        <div className="absolute inset-0 z-15">
          <InteractiveMeshBackground />
        </div>

        <div className="relative z-20 container mx-auto px-6 text-center text-white max-w-4xl pt-20">
          <FadeIn>
            <h2 className="text-5xl md:text-7xl font-bold font-display leading-[1.1] mb-8 tracking-tight">
              {TRANSLATIONS[language].heroTitle}
            </h2>
          </FadeIn>
          
          <FadeIn delay={0.2}>
            <p className="text-xl md:text-2xl text-blue-50/90 mb-10 max-w-2xl mx-auto font-medium">
              {TRANSLATIONS[language].heroDesc}
            </p>
          </FadeIn>

          <FadeIn delay={0.4}>
            {!user ? (
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setIsAuthModalOpen(true)} className="px-10 py-5 bg-white text-blue-600 font-bold rounded-full text-lg shadow-xl shadow-blue-900/20 hover:bg-blue-50 transition-colors ring-4 ring-white/20">
                {TRANSLATIONS[language].getStarted}
              </motion.button>
            ) : (
              <div className="flex flex-col items-center gap-4">
                {isLoadingData ? (
                  <div className="flex flex-col items-center gap-2 animate-pulse">
                    <div className="h-12 w-64 bg-white/10 rounded-2xl"></div>
                  </div>
                ) : (
                  <>
                    <span className="text-xl font-medium bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20">
                      {TRANSLATIONS[language].welcomeBack} <span className="font-bold underline text-blue-100">{userData?.studentId}</span>
                    </span>
                    {!userData?.hasPaid && (
                      <button onClick={handleUpgrade} className="flex items-center gap-2 text-yellow-300 font-bold hover:text-yellow-200 transition-colors">
                        <Crown className="w-5 h-5" /> {TRANSLATIONS[language].upgradePro}
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </FadeIn>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 px-6 max-w-7xl mx-auto">
        <FadeIn>
          <h2 className="text-4xl md:text-5xl font-bold font-display text-[#215ba7] text-center mb-20 leading-tight">
            {TRANSLATIONS[language].pathwaysHeading}
          </h2>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
               icon: <GraduationCap className="w-8 h-8" />,
              title: TRANSLATIONS[language].peerTutoring,
              desc: TRANSLATIONS[language].peerTutoringDesc,
              color: "bg-blue-100 text-blue-600",
              isFree: true,
              key: 'peerTutoring'
            },
            {
              icon: <BookOpen className="w-8 h-8" />,
              title: TRANSLATIONS[language].studyGroups,
              desc: TRANSLATIONS[language].studyGroupsDesc,
              color: "bg-purple-100 text-purple-600",
              isFree: false,
              key: 'studyGroups'
            },
            {
              icon: <MessageSquare className="w-8 h-8" />,
              title: TRANSLATIONS[language].liveChat,
              desc: TRANSLATIONS[language].liveChatDesc,
              color: "bg-cyan-100 text-cyan-600",
              isFree: false,
              key: 'liveChat'
            }
          ].map((feature, idx) => {
            const accessible = feature.isFree || hasAccess(feature.isFree ? 'Peer Tutoring' : 'Study Groups');
            const showTrial = !feature.isFree && isTrialActive() && !userData?.hasPaid;

            return (
              <ScrollTiltCard
                key={idx}
                idx={idx}
                depth={10}
                glareOpacity={0.18}
                className="w-full bg-white shadow-2xl shadow-indigo-100/40 border border-slate-50 group relative overflow-hidden"
              >
                <div className="p-10 relative h-full flex flex-col justify-between">
                  {!accessible && !isLoadingData && (
                    <div className="absolute inset-0 z-30 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
                      <Lock className="w-10 h-10 text-gray-400 mb-4" />
                      <h4 className="font-bold text-xl mb-2 text-slate-800">{TRANSLATIONS[language].premiumFeature}</h4>
                      <p className="text-sm text-gray-500 mb-6 font-medium">{TRANSLATIONS[language].upgradeDesc}</p>
                      <button onClick={handleUpgrade} className="px-8 py-3 bg-blue-600 text-white font-bold rounded-2xl text-sm shadow-lg shadow-blue-200 hover:bg-blue-700 transition-colors cursor-pointer">{TRANSLATIONS[language].upgradeNow}</button>
                    </div>
                  )}
                  
                  {isLoadingData && !feature.isFree && (
                    <div className="absolute inset-0 z-30 bg-white/50 backdrop-blur-[2px] flex items-center justify-center">
                       <div className="w-10 h-10 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
                    </div>
                  )}
                  
                  {showTrial && (
                    <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                       <Sparkles className="w-3 h-3" /> FREE TRIAL
                    </div>
                  )}

                  <div>
                    <div className={`w-16 h-16 ${feature.color} rounded-2xl flex items-center justify-center mb-8 transform group-hover:rotate-6 transition-transform`}>
                      {feature.icon}
                    </div>
                    <h3 className="text-2xl font-bold mb-4 text-[#7087c9]">{feature.title}</h3>
                    <p className="text-gray-600 leading-relaxed text-lg mb-6">
                      {feature.desc}
                    </p>
                  </div>
                  <button 
                    onClick={() => handleFeatureClick(feature.key)}
                    className="text-blue-600 font-bold flex items-center gap-2 hover:gap-3 transition-all cursor-pointer mt-4"
                  >
                    {TRANSLATIONS[language].getStarted} <Sparkles className="w-4 h-4" />
                  </button>
                </div>
              </ScrollTiltCard>
            );
          })}
        </div>
      </section>

      {/* Interactive GCE 3D Slideshow Section */}
      <section className="bg-slate-50 border-t border-b border-slate-150 py-16">
        <GceSlideshow 
          language={language}
          onAction={(viewType, subjId) => {
            if (!user) {
              setIsAuthModalOpen(true);
              return;
            }
            if (viewType === 'practicals') {
              setInitialDashboardTab('practicals');
              setCurrentView('student');
            } else {
              setCurrentView('student');
              setActiveStudentWizard(viewType);
            }
          }}
        />
      </section>

      {/* Community Section */}
      <section className="relative py-32 px-6 bg-[#28c3d8] text-white text-center overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_2px_2px,white_1px,transparent_0)] bg-[length:40px_40px]" />
        
        <div className="relative z-10 max-w-3xl mx-auto">
          <FadeIn>
            <h2 className="text-4xl md:text-5xl font-bold font-display mb-8">{TRANSLATIONS[language].communityTitle}</h2>
          </FadeIn>
          
          <FadeIn delay={0.2}>
            <p className="text-xl md:text-2xl mb-12 text-white/90 leading-relaxed">
              {TRANSLATIONS[language].communityDesc}
            </p>
          </FadeIn>

          <FadeIn delay={0.4}>
            <motion.button onClick={() => setIsCommunityOpen(true)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="px-10 py-5 bg-white text-[#28c3d8] font-bold rounded-full text-lg shadow-xl shadow-cyan-900/20 hover:bg-slate-50 transition-colors cursor-pointer">
              {TRANSLATIONS[language].joinCommunity}
            </motion.button>
          </FadeIn>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#2b0033] text-white py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-2xl font-bold font-display">NC.edu</div>
          <p className="text-white/40 text-sm">© 2026 NC.edu | Empowering Students Everywhere</p>
          <div className="flex gap-6 text-white/60">
            <button 
              onClick={() => setLegalModal({ isOpen: true, type: 'privacy' })}
              className="hover:text-white transition-colors"
            >
              {TRANSLATIONS[language].privacyText}
            </button>
            <button 
              onClick={() => setLegalModal({ isOpen: true, type: 'terms' })}
              className="hover:text-white transition-colors"
            >
              {TRANSLATIONS[language].termsText}
            </button>
            <button 
              onClick={() => setIsContactOpen(true)} 
              className="hover:text-white transition-colors cursor-pointer text-sm font-medium"
            >
              {TRANSLATIONS[language].contactText}
            </button>
          </div>
        </div>
      </footer>

      {/* 5. INCOMING DECK ADMISSIONS CALL ANNOUNCEMENT OVERLAY */}
      <AnimatePresence>
        {incomingCallReg && (
          <div id="global_incoming_call_overlay" className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-emerald-500/30 p-8 rounded-3xl max-w-md w-full shadow-2xl relative text-white text-center"
            >
              <div className="relative w-24 h-24 mx-auto flex items-center justify-center mb-6">
                <span className="absolute inset-0 bg-emerald-500/20 border border-emerald-500/30 rounded-full animate-ping" />
                <div className="w-16 h-16 rounded-full bg-emerald-600 flex items-center justify-center text-white text-2xl font-black shadow-lg">
                  📞
                </div>
              </div>

              <h3 className="text-lg font-black tracking-wider text-emerald-400 uppercase">Incoming Admissions Call</h3>
              <p className="text-xs text-slate-300 mt-2 font-medium">
                Chief Administrator <strong className="text-white">Ngandi Celestin</strong> is initiating admission review for class:
              </p>
              <div className="mt-3 bg-white/5 border border-white/10 p-4 rounded-2xl">
                <p className="text-sm font-bold text-yellow-300">{incomingCallReg.formationTitle}</p>
                <p className="text-[10px] text-slate-400 font-mono mt-1">EST. FEE: {incomingCallReg.priceText}</p>
              </div>

              <p className="text-[10px] text-slate-500 mt-4 leading-relaxed font-semibold font-sans">
                By accepting, your microphone and camera will dynamically sync to provide secure, end-to-end enrollment approval.
              </p>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-4 mt-6">
                <button
                  id="decline_incoming_call_btn"
                  onClick={async () => {
                    try {
                      await updateDoc(doc(db, 'course_registrations', incomingCallReg.id), {
                        status: 'call_rejected'
                      });
                    } catch (err) {
                      console.error("Error declining call:", err);
                    }
                    setIncomingCallReg(null);
                  }}
                  className="py-3 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/20 font-black text-[10px] tracking-wider uppercase rounded-xl cursor-pointer transition-all active:scale-95"
                >
                  ❌ Decline
                </button>
                <button
                  id="accept_incoming_call_btn"
                  onClick={async () => {
                    try {
                      await updateDoc(doc(db, 'course_registrations', incomingCallReg.id), {
                        status: 'active_call'
                      });
                      setActiveVideoCall({
                        formationTitle: incomingCallReg.formationTitle,
                        priceText: incomingCallReg.priceText,
                        registrationId: incomingCallReg.id
                      });
                    } catch (err) {
                      console.error("Error accepting call:", err);
                    }
                    setIncomingCallReg(null);
                  }}
                  className="py-3 bg-emerald-600 hover:bg-emerald-500 text-slate-955 font-black text-[10px] tracking-wider uppercase rounded-xl cursor-pointer transition-all shadow-lg shadow-emerald-500/10 active:scale-95 text-slate-950"
                >
                  ✅ Accept & Join
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
    )}
  </AnimatePresence>
  );
}


