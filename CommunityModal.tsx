import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  Award, 
  Users, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  Smartphone, 
  CreditCard,
  Check,
  FileSpreadsheet,
  AlertTriangle,
  Lock,
  Loader2,
  ExternalLink,
  Heart,
  MessageSquare,
  ChevronDown
} from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  doc, 
  updateDoc, 
  increment,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { Language, TRANSLATIONS } from '../constants/translations';

interface CommunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onInitiateVideoCall?: (formationTitle: string, priceText: string, registrationId?: string) => void;
}

export default function CommunityModal({ isOpen, onClose, language, onInitiateVideoCall }: CommunityModalProps) {
  const [events, setEvents] = useState<any[]>([]);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [formations, setFormations] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [courseRegs, setCourseRegs] = useState<any[]>([]);
  
  // Comments state
  const [comments, setComments] = useState<any[]>([]);
  const [isCommentsReduced, setIsCommentsReduced] = useState<boolean>(false);
  
  // Registration flow state
  const [selectedTournament, setSelectedTournament] = useState<any | null>(null);
  const [regStep, setRegStep] = useState<'IDLE' | 'FORM' | 'PAYMENT' | 'PROCESSING' | 'SUCCESS' | 'CHECKOUT_REDIRECT'>('IDLE');
  const [activeInterval, setActiveInterval] = useState<any>(null);
  const [checkoutUrl, setCheckoutUrl] = useState('');

  // Clean up interval on close/unmount
  useEffect(() => {
    return () => {
      if (activeInterval) {
        clearInterval(activeInterval);
      }
    };
  }, [activeInterval]);
  
  // Form fields
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  
  // Payment simulations
  const [paymentMethod, setPaymentMethod] = useState<'mtn' | 'orange' | 'card'>('mtn');
  const [paymentPhone, setPaymentPhone] = useState('');
  const [paymentErr, setPaymentErr] = useState('');

  // Course / Formation Registration states
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);
  const [courseFormName, setCourseFormName] = useState('');
  const [courseFormContact, setCourseFormContact] = useState('');
  const [courseFormEmail, setCourseFormEmail] = useState('');
  const [courseSubmitting, setCourseSubmitting] = useState(false);
  const [courseRegSubmittedId, setCourseRegSubmittedId] = useState('');
  const [preferredCallType, setPreferredCallType] = useState<'app' | 'whatsapp'>('app');
  const [submittedRegData, setSubmittedRegData] = useState<any>(null);

  const [userData, setUserData] = useState<any>(null);

  // Auto pre-populate course form
  useEffect(() => {
    if (selectedCourse) {
      setCourseFormEmail(auth.currentUser?.email || '');
      setCourseFormName(userData?.name || auth.currentUser?.email?.split('@')[0]?.toUpperCase() || '');
    }
  }, [selectedCourse, userData]);

  // Live status listener on submitted Course Registration
  useEffect(() => {
    if (!courseRegSubmittedId) {
      setSubmittedRegData(null);
      return;
    }

    const unsubReg = onSnapshot(doc(db, 'course_registrations', courseRegSubmittedId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setSubmittedRegData({ id: snap.id, ...data });
        if (data.status === 'active_call') {
          // Send user automatically to VideoCallRoom with the persistent registrationId
          if (onInitiateVideoCall) {
            onInitiateVideoCall(
              data.formationTitle,
              data.priceText,
              courseRegSubmittedId
            );
          }
          // Reset states
          setSelectedCourse(null);
          setCourseRegSubmittedId('');
          setSubmittedRegData(null);
          onClose();
        }
      }
    });

    return () => unsubReg();
  }, [courseRegSubmittedId, onInitiateVideoCall, onClose]);

  // Load Firestore live data
  useEffect(() => {
    if (!isOpen) return;

    let unsubUser = () => {};
    const u = auth.currentUser;
    if (u) {
      unsubUser = onSnapshot(doc(db, 'users', u.uid), (snap) => {
        if (snap.exists()) {
          setUserData(snap.data());
        }
      });
    }

    const unsubEvents = onSnapshot(collection(db, 'community_events'), (snap) => {
      setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubTournaments = onSnapshot(collection(db, 'tournaments'), (snap) => {
      setTournaments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubParticipants = onSnapshot(collection(db, 'tournament_participants'), (snap) => {
      setParticipants(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubFormations = onSnapshot(collection(db, 'formations'), (snap) => {
      setFormations(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubJobs = onSnapshot(collection(db, 'jobs'), (snap) => {
      setJobs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubCourseRegs = onSnapshot(collection(db, 'course_registrations'), (snap) => {
      setCourseRegs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubComments = onSnapshot(collection(db, 'app_comments'), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a: any, b: any) => {
        const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        return timeB - timeA; // Newest first
      });
      setComments(list);
    });

    return () => {
      unsubUser();
      unsubEvents();
      unsubTournaments();
      unsubParticipants();
      unsubFormations();
      unsubJobs();
      unsubCourseRegs();
      unsubComments();
    };
  }, [isOpen]);


  const handleToggleLikeComment = async (comment: any) => {
    const user = auth.currentUser;
    if (!user) {
      alert("Please log in to like comments!");
      return;
    }

    const email = user.email || '';
    const likedBy = comment.likedBy || [];
    const hasLiked = likedBy.includes(email);

    let newLikedBy = [...likedBy];
    let newLikesCount = comment.likes || 0;

    if (hasLiked) {
      newLikedBy = newLikedBy.filter(e => e !== email);
      newLikesCount = Math.max(0, newLikesCount - 1);
    } else {
      newLikedBy.push(email);
      newLikesCount = newLikesCount + 1;
    }

    try {
      await updateDoc(doc(db, 'app_comments', comment.id), {
        likes: newLikesCount,
        likedBy: newLikedBy
      });
    } catch (err) {
      console.error("Error liking comment: ", err);
    }
  };

  const getTournamentDiscountAndPrice = () => {
    const basePrice = 5000;
    if (!auth.currentUser || !userData) return { discountPercent: 0, finalPrice: basePrice };

    // Check if subscription has not expired
    let isActivePremium = false;
    if (userData.subscriptionEndsAt) {
      const endMs = userData.subscriptionEndsAt.seconds 
        ? userData.subscriptionEndsAt.seconds * 1000 
        : new Date(userData.subscriptionEndsAt).getTime();
      if (Date.now() < endMs) {
        isActivePremium = true;
      }
    }

    if (!isActivePremium) {
      return { discountPercent: 0, finalPrice: basePrice };
    }

    const subType = userData.subscriptionType; // 'weekly', 'monthly', 'yearly'
    
    // Find how many tournaments this user has already registered for
    const completedRegsCount = participants.filter(
      p => p.email?.toLowerCase().trim() === (auth.currentUser?.email || '').toLowerCase().trim() && p.paymentStatus === 'completed'
    ).length;

    if (subType === 'monthly') {
      // monthly subscription: 40% reduction for the first tournament registered
      if (completedRegsCount === 0) {
        return { discountPercent: 40, finalPrice: basePrice * 0.6 };
      }
    } else if (subType === 'yearly') {
      // yearly subscription: 80% reduction for the first 3 tournaments registered
      if (completedRegsCount < 3) {
        return { discountPercent: 80, finalPrice: basePrice * 0.2 };
      }
    }

    return { discountPercent: 0, finalPrice: basePrice };
  };

  const { discountPercent, finalPrice } = getTournamentDiscountAndPrice();

  if (!isOpen) return null;

  // Handle Register click
  const handleOpenRegistration = (tour: any) => {
    // Check if current user is already registered based on UID or email
    const currentUid = auth.currentUser?.uid;
    const uEmail = auth.currentUser?.email?.toLowerCase();
    const isAlreadyReg = participants.some(
      p => p.tournamentId === tour.id && p.paymentStatus === 'completed' && (
        (currentUid && p.userId === currentUid) ||
        (uEmail && p.email?.toLowerCase() === uEmail)
      )
    );

    if (isAlreadyReg) {
      alert(language === 'FRENCH' 
        ? "Vous êtes déjà inscrit à ce tournoi ! Vous ne pouvez pas vous inscrire à nouveau." 
        : "You are already registered for this tournament! You cannot register again.");
      return;
    }

    // Double check status constraints before initiating
    const paidCount = participants.filter(p => p.tournamentId === tour.id && p.paymentStatus === 'completed').length;
    const isFull = paidCount >= (tour.requiredStudents || 0);
    const isClosed = tour.status === 'closed';

    if (isFull || isClosed) {
      alert("Registration has closed for this session: Required students reached or registration timeline expired.");
      return;
    }

    setSelectedTournament(tour);
    setRegStep('FORM');
    // Clear forms
    setName('');
    setSurname('');
    setEmail(auth.currentUser?.email || '');
    setPhone('');
    setPaymentPhone('');
    setPaymentErr('');
  };

  // Submit registration form -> proceed to payment step
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !surname.trim() || !email.trim() || !phone.trim()) {
      alert("Please fill in all participant detail fields.");
      return;
    }

    // Duplicate check on form inputs
    const formEmail = email.trim().toLowerCase();
    const formPhone = phone.trim();
    const isDuplicate = participants.some(
      p => p.tournamentId === selectedTournament.id && (
        p.email?.toLowerCase() === formEmail || p.phone?.trim() === formPhone
      )
    );

    if (isDuplicate) {
      alert(language === 'FRENCH' 
        ? "Cet e-mail ou ce numéro de téléphone est déjà inscrit à ce tournoi ! L'inscription multiple est désactivée." 
        : "This email or phone number is already registered for this tournament! Duplicate entries are disabled.");
      return;
    }

    setPaymentPhone(phone); // prefill payment phone
    setRegStep('PAYMENT');
  };

  // Process 5,000 FCFA payment with Notch Pay integration
  const handleAuthorizePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentPhone.trim() && paymentMethod !== 'card') {
      setPaymentErr("Enter your payment target details.");
      return;
    }
    
    setRegStep('PROCESSING');
    setPaymentErr('');

    const runSimulation = async () => {
      try {
        const participantId = `PRT-${selectedTournament.title.slice(0, 3).toUpperCase()}${Math.floor(100 + Math.random() * 900)}`;
        
        // Write verified participant to database
        await addDoc(collection(db, 'tournament_participants'), {
          tournamentId: selectedTournament.id,
          name: name.trim(),
          surname: surname.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          paymentStatus: 'completed',
          amountPaid: finalPrice,
          participantId: participantId,
          createdAt: new Date().toISOString()
        });

        // Increment tournament counter atomically
        const tourRef = doc(db, 'tournaments', selectedTournament.id);
        const tourSnap = await getDoc(tourRef);
        if (tourSnap.exists()) {
          const currentCount = tourSnap.data().registeredCount || 0;
          await updateDoc(tourRef, {
            registeredCount: increment(1)
          });
          
          // If count reaches maximum required count, automatically set status to closed
          const reqCount = tourSnap.data().requiredStudents || 0;
          if (currentCount + 1 >= reqCount) {
            await updateDoc(tourRef, {
              status: 'closed'
            });
          }
        }

        setRegStep('SUCCESS');
      } catch (err: any) {
        setPaymentErr(err.message || 'Payment simulation error. Please try again.');
        setRegStep('PAYMENT');
      }
    };

    try {
      const response = await fetch('/api/payment/collect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: finalPrice,
          phone: paymentPhone,
          email: email.trim().toLowerCase(),
          description: `Tournament: ${selectedTournament.title}`,
          external_reference: `NC-TOUR-${selectedTournament.id}-${Date.now()}`
        })
      });

      const data = await response.json();

      if (!response.ok) {
        console.warn("Monetbill collect not OK, running offline simulation fallback", data);
        await runSimulation();
        return;
      }

      const reference = data.reference;

      if (reference.startsWith("NOTCH-SIM-") || reference.startsWith("MONETBIL-SIM-")) {
        console.log("Simulated reference returned, proceeding to sandbox success directly");
        await runSimulation();
        return;
      }

      if (data.authorization_url) {
        setCheckoutUrl(data.authorization_url);
        setRegStep('CHECKOUT_REDIRECT');
      }

      const interval = setInterval(async () => {
        try {
          const statusRes = await fetch(`/api/payment/status/${reference}`);
          if (!statusRes.ok) return;
          const statusData = await statusRes.json();
          if (statusData.status === 'SUCCESSFUL') {
            clearInterval(interval);
            setActiveInterval(null);
            await runSimulation();
          } else if (statusData.status === 'FAILED') {
            clearInterval(interval);
            setActiveInterval(null);
            setPaymentErr("Transaction was declined or failed on Monetbill.");
            setRegStep('PAYMENT');
          }
        } catch (pollErr) {
          console.error("Error polling tournament payment:", pollErr);
        }
      }, 4000);

      setActiveInterval(interval);

    } catch (err: any) {
      console.warn("Monetbill network error, falling back to offline simulation", err);
      await runSimulation();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white w-full max-w-5xl rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="bg-[#2f47b3] text-white py-6 px-8 flex items-center justify-between shadow-md shrink-0 border-b border-indigo-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-400 flex items-center justify-center font-black text-indigo-950 text-base shadow-inner">
              👥
            </div>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight">
                {language === 'FRENCH' ? 'Espace Communautaire' : language === 'CHINESE' ? 'NC.edu 学习社区' : language === 'SPANISH' ? 'Portal de la Comunidad' : 'Community Hub & Tournaments'}
              </h2>
              <p className="text-xs text-blue-200 font-semibold tracking-wide">
                {language === 'FRENCH' ? 'Événementiels pédagogiques et Tournois académiques' : language === 'CHINESE' ? '查看学术讲座公告，参与丰厚奖励的知识竞赛' : language === 'SPANISH' ? 'Anuncios, talleres y prestigiosos torneos académicos' : 'Academic Announcements, Seminars & Prestigious Tournaments'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors font-bold text-white/85 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Scroll container */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar bg-[#f8f7fa] flex flex-col gap-10 relative">
          
          {selectedCourse && (
            <div className="absolute inset-0 bg-[#f8f7fa] z-40 p-6 md:p-8 flex flex-col font-sans overflow-y-auto">
              
              {/* Wizard Header */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
                <div>
                  <span className="px-2.5 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-md text-[9px] font-black tracking-wider block uppercase w-max mb-1 font-sans">
                    Step 1 of 2: Admissions Form
                  </span>
                  <h3 className="text-base font-black text-slate-800">
                    Registration: {selectedCourse.title}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-semibold">
                    Register with your contact details so the Admin can sync your record in the Excel Spreadsheet.
                  </p>
                </div>
                <button 
                  onClick={() => {
                    setSelectedCourse(null);
                    setCourseRegSubmittedId('');
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-[10px] tracking-wider uppercase rounded-xl transition-all cursor-pointer"
                >
                  Back to List
                </button>
              </div>

              {!courseRegSubmittedId ? (
                /* 1. FILL FORM STATE */
                <form 
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!courseFormName.trim() || !courseFormContact.trim() || !courseFormEmail.trim()) {
                      alert("Please carefully fill in your Name, Contact, and Email before continuing.");
                      return;
                    }
                    setCourseSubmitting(true);

                    // Ensure duplicate registration is strictly forbidden
                    const alreadyExists = courseRegs.find(r => {
                      const u = auth.currentUser;
                      if (!u) return false;
                      const belongsToUser = r.userId === u.uid || (u.email && r.email?.toLowerCase().trim() === u.email.toLowerCase().trim());
                      return belongsToUser && r.formationTitle === selectedCourse?.title && r.status !== 'cancelled';
                    });
                    if (alreadyExists) {
                      alert(`You are already registered for this formation ("${selectedCourse?.title}"). You cannot register again.`);
                      setCourseSubmitting(false);
                      return;
                    }

                    try {
                      const u = auth.currentUser;
                      const refDoc = await addDoc(collection(db, 'course_registrations'), {
                        userId: u ? u.uid : 'anonymous',
                        name: courseFormName.trim(),
                        contact: courseFormContact.trim(),
                        email: courseFormEmail.trim(),
                        formationTitle: selectedCourse.title,
                        priceText: selectedCourse.price > 0 ? `${selectedCourse.price.toLocaleString()} FCFA` : 'FREE ACCESS',
                        preferredCallType: preferredCallType,
                        status: 'pending',
                        createdAt: { seconds: Math.floor(Date.now() / 1000) }
                      });
                      setCourseRegSubmittedId(refDoc.id);
                    } catch (err) {
                      console.error("Error creating course enrollment record:", err);
                      alert("Database sync failed. Please try again.");
                    } finally {
                      setCourseSubmitting(false);
                    }
                  }}
                  className="space-y-5 max-w-lg mx-auto bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-sm font-sans"
                >
                  <div className="flex items-center gap-3 bg-indigo-50/50 border border-indigo-100/30 p-4 rounded-2xl mb-2">
                    <div className="text-xl">🎓</div>
                    <div className="text-[11px] text-indigo-950 font-semibold leading-relaxed">
                      This information builds your student credential sheet automatically inside our <strong>dynamic spreadsheet database</strong>.
                    </div>
                  </div>

                  {/* Student Full Name Input */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-550 block">Student Name</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. EBENE JEAN-PIERRE"
                      value={courseFormName}
                      onChange={e => setCourseFormName(e.target.value.toUpperCase())}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500/50 focus:bg-white outline-none p-3.5 text-xs text-slate-800 font-semibold rounded-2xl placeholder-slate-400"
                    />
                  </div>

                  {/* Student Contact Phone Input */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-550 block">Contact Phone / WhatsApp</label>
                    <input 
                      type="tel"
                      required
                      placeholder="e.g. +237 6XX XX XX XX"
                      value={courseFormContact}
                      onChange={e => setCourseFormContact(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500/50 focus:bg-white outline-none p-3.5 text-xs text-slate-800 font-semibold rounded-2xl placeholder-slate-400"
                    />
                  </div>

                  {/* Student Email Read-Only/Input */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-550 block">Email Address</label>
                    <input 
                      type="email"
                      required
                      placeholder="e.g. ebene@gmail.com"
                      value={courseFormEmail}
                      onChange={e => setCourseFormEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500/50 focus:bg-white outline-none p-3.5 text-xs text-slate-800 font-semibold rounded-2xl placeholder-slate-400"
                    />
                  </div>

                  {/* Preferred Call Type Selection */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-550 block">Preferred Call Method / Méthode d'appel préférée</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setPreferredCallType('app')}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                          preferredCallType === 'app'
                            ? 'bg-indigo-50 border-indigo-500 text-indigo-950 shadow-sm'
                            : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:border-slate-300'
                        }`}
                      >
                        <div className="text-xs mb-1 font-sans font-bold flex items-center gap-1.5">
                          📱 In-App Call
                        </div>
                        <div className="text-[9px] font-semibold leading-relaxed opacity-80">
                          Direct video call inside this app.
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPreferredCallType('whatsapp')}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                          preferredCallType === 'whatsapp'
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-950 shadow-sm'
                            : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:border-slate-300'
                        }`}
                      >
                        <div className="text-xs mb-1 font-sans font-bold flex items-center gap-1.5">
                          💬 WhatsApp Call
                        </div>
                        <div className="text-[9px] font-semibold leading-relaxed opacity-80">
                          Officer will call you on WhatsApp.
                        </div>
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={courseSubmitting}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-extrabold text-[11px] tracking-wider uppercase rounded-2xl transition-all cursor-pointer shadow-md inline-flex items-center justify-center gap-2"
                  >
                    {courseSubmitting ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>SYCHRONIZING SPREADSHEET...</span>
                      </>
                    ) : (
                      <span>SUBMIT ADMISSIONS SHEET 🚀</span>
                    )}
                  </button>
                </form>
              ) : (
                /* 2. WAITING STATE */
                <div className="text-center max-w-xl mx-auto space-y-6 py-8">
                  {/* Radar pinging */}
                  <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                    <span className="absolute inset-0 bg-emerald-500/10 border border-emerald-500/30 rounded-full animate-ping" />
                    <span className="absolute inset-4 bg-emerald-500/20 border border-emerald-500/40 rounded-full animate-pulse" />
                    <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white text-lg font-black shadow-lg">
                      📡
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-emerald-700 font-black text-sm tracking-wider uppercase">
                      Sync Completed Successfully!
                    </h4>
                    <p className="text-xs text-slate-550 leading-relaxed max-w-md mx-auto font-semibold">
                      Your details are officially recorded inside the <strong>Class Admissions Spreadsheet</strong>. 
                      A loud notification alert has been sent to Chief Administrator <strong>Ngandi Celestin</strong>.
                    </p>
                  </div>

                  {/* Synced Data Box */}
                  <div className="bg-white border border-slate-150/60 rounded-3xl p-5 text-left text-xs space-y-2.5 font-mono">
                    <div className="text-[10px] font-black uppercase text-slate-300 border-b border-slate-100 pb-1.5 mb-1 text-center font-sans tracking-widest">
                      Live Database Sync File
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">CLASS:</span>
                      <span className="font-sans font-bold text-slate-800">{submittedRegData?.formationTitle || selectedCourse.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">STUDENT:</span>
                      <span className="font-sans font-bold text-slate-800">{submittedRegData?.name || courseFormName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">CONTACT:</span>
                      <span className="text-slate-800 font-bold">{submittedRegData?.contact || courseFormContact}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">PREFERRED CALL:</span>
                      <span className="font-sans font-bold text-slate-800 uppercase flex items-center gap-1">
                        {(submittedRegData?.preferredCallType || preferredCallType) === 'app' ? '📱 In-App Call' : '💬 WhatsApp Call'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">FEE STATUS:</span>
                      <span className="font-sans text-[10px] bg-yellow-500/10 text-yellow-700 px-2.5 py-0.5 rounded border border-yellow-500/20 font-black uppercase">
                        {submittedRegData?.priceText || 'PENDING AUTHORIZATION'}
                      </span>
                    </div>
                  </div>

                  {/* Dynamic Administrative Acknowledgement Alert */}
                  {submittedRegData?.needsAcknowledgement && (
                    <div className="bg-amber-50 border-2 border-amber-400 rounded-3xl p-4 text-left space-y-3 shadow-md animate-pulse">
                      <div className="flex items-start gap-2.5">
                        <span className="text-xl">📢</span>
                        <div className="space-y-1">
                          <h5 className="font-sans font-black text-amber-800 text-[11px] uppercase tracking-wide">
                            ADMINISTRATIVE CHANGE DETECTED
                          </h5>
                          <p className="font-sans text-[10px] text-amber-700 leading-relaxed font-bold">
                            Administrative edits have been processed for your Class Admission Registry file! Please review the updated details in your Live Database Sync File above and click below to acknowledge.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={async () => {
                          try {
                            await updateDoc(doc(db, 'course_registrations', courseRegSubmittedId), {
                              needsAcknowledgement: false
                            });
                          } catch (err: any) {
                            alert("Failed to sync acknowledgement: " + err.message);
                          }
                        }}
                        className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold text-[10px] tracking-wider uppercase rounded-xl transition-all shadow-sm cursor-pointer"
                      >
                        ✅ Acknowledge & Agree to Changes
                      </button>
                    </div>
                  )}

                  {(submittedRegData?.preferredCallType || preferredCallType) === 'app' ? (
                    <p className="text-[10px] text-indigo-600 bg-indigo-50/50 border border-indigo-100 p-3 rounded-2xl leading-relaxed max-w-sm mx-auto font-bold">
                      Your request for a live In-App Call has been recorded and soon you shall be contacted! Please remain online; once the Admin accepts and starts the call, your view will automatically connect.
                    </p>
                  ) : (
                    <p className="text-[10px] text-emerald-700 bg-emerald-50/50 border border-emerald-100 p-3 rounded-2xl leading-relaxed max-w-sm mx-auto font-bold">
                      Your request for a WhatsApp Call has been recorded and soon you shall be contacted! The administration board has locked in your row; they will initiate a call on your provided number shortly. You can safely close this window now.
                    </p>
                  )}

                  <div className="pt-2">
                    <button
                      onClick={async () => {
                        if (confirm("Cancel registration request? This removes your row from the admissions sheet.")) {
                          try {
                            // Deletion, or updating status to 'cancelled'
                            await updateDoc(doc(db, 'course_registrations', courseRegSubmittedId), {
                              status: 'cancelled'
                            });
                          } catch (err) {}
                          setCourseRegSubmittedId('');
                          setSelectedCourse(null);
                        }
                      }}
                      className="px-4 py-2 hover:bg-rose-50 text-rose-500 border border-slate-200 hover:border-rose-200 font-bold text-[10px] tracking-wider uppercase rounded-xl transition-all cursor-pointer"
                    >
                      Cancel & Return
                    </button>
                  </div>

                </div>
              )}

            </div>
          )}
          
          {/* COMMUNITY COMMENTS & FEEDBACK SESSION (Now at the top of Community Hub) */}
          <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-100 flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-slate-150 pb-4">
              <div className="flex items-center gap-2.5">
                <MessageSquare className="w-5 h-5 text-indigo-650" />
                <h3 className="text-lg font-black text-slate-900">
                  {language === 'FRENCH' ? 'Session de Commentaires' : language === 'CHINESE' ? '学习交流与意见反馈' : language === 'SPANISH' ? 'Sesión de Comentarios' : 'Community Comments & App Feedback'}
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => setIsCommentsReduced(!isCommentsReduced)}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-indigo-700 hover:text-indigo-900 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer border border-slate-200 shadow-xs"
                title={isCommentsReduced ? "Expand comments list" : "Reduce comments list"}
              >
                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isCommentsReduced ? '' : 'rotate-180'}`} />
                <span className="text-[10px] font-black uppercase tracking-wide">
                  {isCommentsReduced 
                    ? (language === 'FRENCH' ? 'Afficher tout' : 'Show All') 
                    : (language === 'FRENCH' ? 'Réduire' : 'Reduce')}
                </span>
              </button>
            </div>
            
            <p className="text-xs text-slate-500 leading-relaxed max-w-3xl">
              Good or bad, all constructive feedback belongs here. NC.edu administrators broadcast verified expert insights, advice, and key exam updates directly into this feed. Students can react and like published comments to highlight the most beneficial inputs.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start mt-2">
              {/* Left Column: Information Card */}
              <div className="bg-slate-50 border border-slate-150 p-6 rounded-[2rem] space-y-4">
                <span className="text-[10px] uppercase font-black tracking-wider text-indigo-600 block">
                  Verified Insights Board
                </span>
                
                <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                  To preserve the absolute quality of guidance, only NC administrators can post advisory columns and exam reviews in this space.
                </p>

                <div className="pt-2 border-t border-slate-200/60 space-y-3">
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 font-bold">
                    <span className="text-sm">🎓</span>
                    <span>Level of Studies specified per author</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 font-bold">
                    <span className="text-sm">💼</span>
                    <span>Years of Experience displayed</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 font-bold">
                    <span className="text-sm">❤️</span>
                    <span>React and Like entries to highlight value</span>
                  </div>
                </div>

                <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl">
                  <p className="text-[10px] text-indigo-850 font-bold leading-normal">
                    💡 <strong>Tip for Students:</strong> Scroll through the feed to read validated academic endorsements, teacher experiences, and system bulletins!
                  </p>
                </div>
              </div>

              {/* Right Column: List of comments (Spans 2) */}
              <div className="lg:col-span-2 space-y-4">
                <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block mb-2">
                  Live Feed ({comments.length} comments) {isCommentsReduced && comments.length > 2 && `• Reduced View (Showing 2 of ${comments.length})`}
                </span>

                {comments.length === 0 ? (
                  <div className="bg-slate-50 border border-slate-150 border-dashed rounded-[2rem] p-12 text-center flex flex-col items-center justify-center">
                    <span className="text-xs text-slate-400 font-bold block">No comments posted yet.</span>
                    <p className="text-[10px] text-slate-450 mt-1">Please keep checking. Administrators will publish reviews and advisory columns soon!</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                    {(isCommentsReduced ? comments.slice(0, 2) : comments).map((comment) => {
                      const user = auth.currentUser;
                      const hasLiked = comment.likedBy?.includes(user?.email || '');
                      const dateText = comment.createdAt?.seconds 
                        ? new Date(comment.createdAt.seconds * 1000).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                        : comment.createdAt ? new Date(comment.createdAt).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A';
                      
                      const roleColors: Record<string, string> = {
                        admin: 'from-rose-500 to-purple-600 text-white',
                        tutor: 'from-blue-500 to-indigo-600 text-white',
                        student: 'from-emerald-500 to-teal-600 text-white'
                      };

                      const badgeClasses: Record<string, string> = {
                        admin: 'bg-rose-100 text-rose-800 border border-rose-200',
                        tutor: 'bg-blue-100 text-blue-800 border border-blue-200',
                        student: 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      };

                      const currentRoleColor = roleColors[comment.authorRole] || 'from-slate-400 to-slate-500 text-white';
                      const currentBadgeClass = badgeClasses[comment.authorRole] || 'bg-slate-100 text-slate-800 border border-slate-200';

                      return (
                        <div 
                          key={comment.id}
                          className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex items-start gap-4 hover:border-slate-200 transition-all font-sans"
                        >
                          {/* Avatar Circle with role colors */}
                          <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${currentRoleColor} flex items-center justify-center font-black text-sm shrink-0 shadow-sm`}>
                            {comment.authorName?.charAt(0).toUpperCase()}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-extrabold text-slate-800 text-xs truncate">
                                {comment.authorName}
                              </span>
                              <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider ${currentBadgeClass}`}>
                                {comment.authorRole}
                              </span>
                              <span className="text-[9px] text-slate-400 font-mono font-bold ml-auto shrink-0">
                                {dateText}
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

                            <div className="flex items-center gap-4 mt-3 pt-2.5 border-t border-slate-50">
                              <button
                                type="button"
                                onClick={() => handleToggleLikeComment(comment)}
                                className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                                  hasLiked ? 'text-rose-600 scale-105' : 'text-slate-400 hover:text-rose-500'
                                }`}
                              >
                                <Heart className={`w-4 h-4 ${hasLiked ? 'fill-rose-500 text-rose-600' : ''}`} />
                                <span>{comment.likes || 0} {comment.likes === 1 ? 'Like' : 'Likes'}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    
                    {isCommentsReduced && comments.length > 2 && (
                      <button
                        type="button"
                        onClick={() => setIsCommentsReduced(false)}
                        className="w-full text-center py-2.5 bg-slate-50 hover:bg-indigo-50 border border-slate-150 hover:border-indigo-150 rounded-2xl text-[11px] font-extrabold uppercase tracking-wide text-indigo-600 hover:text-indigo-800 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <ChevronDown className="w-4 h-4 animate-bounce" />
                        <span>Show {comments.length - 2} More Comments</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* GENERAL NOTIFICATIONS EVENTS AREA */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2.5 h-6 bg-cyan-500 rounded-full" />
              <h3 className="text-lg font-black text-slate-900">
                {language === 'FRENCH' ? 'Annonces & Conférences' : language === 'CHINESE' ? '学术沙龙与公告' : language === 'SPANISH' ? 'Anuncios y Charlas' : 'Announcements & Jams'}
              </h3>
            </div>
            
            {events.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {events.map((ev) => (
                  <motion.div 
                    key={ev.id}
                    whileHover={{ scale: 1.01 }}
                    className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden flex flex-col justify-between"
                  >
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-cyan-400" />
                    <div>
                      <div className="flex items-center gap-2 text-[10px] text-cyan-600 font-black tracking-wider uppercase mb-2">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Date: {ev.date || 'To be determined'}</span>
                      </div>
                      <h4 className="text-base font-black text-slate-800 mb-2 leading-snug">{ev.title}</h4>
                      <p className="text-slate-500 text-xs leading-relaxed font-semibold mb-4">{ev.desc}</p>
                    </div>
                    <div className="text-[9px] text-slate-400 font-bold uppercase self-end">
                      Posted recently
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-100/50 rounded-2xl p-6 text-center border-2 border-dashed border-slate-200">
                <span className="text-xs text-slate-400 font-extrabold block">
                  {language === 'FRENCH' ? 'Aucun événement général pour le moment.' : language === 'CHINESE' ? '暂无普通讲座活动公告。' : language === 'SPANISH' ? 'No hay eventos anunciados en este momento.' : 'No general announcement lectures are scheduled currently.'}
                </span>
              </div>
            )}
          </div>

          {/* ACADEMICS TOURNAMENTS SECTION */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2.5 h-6 bg-purple-600 rounded-full" />
              <h3 className="text-lg font-black text-slate-900">
                {language === 'FRENCH' ? 'Tournois Académiques (5,000 FCFA)' : language === 'CHINESE' ? '学术竞赛 (5,000 FCFA)' : language === 'SPANISH' ? 'Torneos Académicos (5,050 FCFA)' : 'Academic Cash Tournaments (5,000 FCFA)'}
              </h3>
            </div>

            {tournaments.length > 0 ? (
              <div className="flex flex-col gap-8">
                {tournaments.map((tour) => {
                  const paidRegs = participants.filter(p => p.tournamentId === tour.id && p.paymentStatus === 'completed');
                  const isFull = paidRegs.length >= (tour.requiredStudents || 0);
                  const isToggledClosed = tour.status === 'closed';
                  const isClosed = isFull || isToggledClosed;

                  // Dual check if current user uid or email match any records in the participants collection
                  const currentUid = auth.currentUser?.uid;
                  const uEmail = auth.currentUser?.email?.toLowerCase();
                  const isAlreadyReg = paidRegs.some(p => 
                    (currentUid && p.userId === currentUid) || (uEmail && p.email?.toLowerCase() === uEmail)
                  );

                  return (
                    <div 
                      key={tour.id}
                      className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 md:p-8 flex flex-col gap-6"
                    >
                      {/* Tournament card header */}
                      <div className="flex flex-col md:flex-row justify-between md:items-start gap-4 pb-6 border-b border-slate-100">
                        <div>
                          <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-[10px] font-black uppercase tracking-wider mb-2 inline-block">
                            🥇 {tour.prizes || 'Cash Prizes'}
                          </span>
                          <h4 className="text-xl font-bold font-display text-slate-900 leading-snug">{tour.title}</h4>
                        </div>
                        
                        {/* Capacity indicators */}
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block font-bold uppercase">REGISTERED CAPACITY</span>
                            <span className="text-lg font-mono font-black text-purple-700 block">
                              {paidRegs.length} / {tour.requiredStudents || 10} students
                            </span>
                          </div>
                          <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                            <Users className="w-5 h-5" />
                          </div>
                        </div>
                      </div>

                      {/* Tournament Info Grid details */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs text-slate-600 font-bold font-sans">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                            <Calendar className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 block uppercase">EXAM TOURNAMENT DATES</span>
                            <span className="text-slate-800 font-mono text-[11px] block">{tour.dates}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center shrink-0">
                            <Clock className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 block uppercase">TIME SLOTS</span>
                            <span className="text-slate-800 font-mono text-[11px] block">{tour.time}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0">
                            <Award className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 block uppercase">COMPETITION STAGES</span>
                            <span className="text-slate-800 block">{tour.stages || 'Eliminations, Grand Finale'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Excel Participant Registration Spreadsheet for the Tournament requested */}
                      <div>
                        <h5 className="text-xs font-black text-slate-400 tracking-wider uppercase mb-3 flex items-center gap-1.5 font-sans">
                          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                          REGISTERED STUDENTS INDEX (SPREADSHEET SYNC)
                        </h5>
                        
                        <div className="border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/20 max-h-[180px] overflow-y-auto custom-scrollbar">
                          <table className="w-full text-left font-sans text-[11px]">
                            <thead>
                              <tr className="bg-slate-55 border-b border-indigo-50 text-slate-400 text-[9px] font-black tracking-wider uppercase">
                                <th className="py-2.5 px-4 w-12 text-center">INDEX</th>
                                <th className="py-2.5 px-4">PARTICIPANT ID</th>
                                <th className="py-2.5 px-4">REGISTRATION NAME AND SURNAME</th>
                                <th className="py-2.5 px-4 text-right">FEE REMITTED (FCFA)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                              {paidRegs.length > 0 ? (
                                paidRegs.map((reg, rIdx) => (
                                  <tr key={reg.id} className="hover:bg-indigo-50/15">
                                    <td className="py-2.5 px-4 text-center text-slate-400 font-mono">{rIdx + 1}</td>
                                    <td className="py-2.5 px-4 font-mono font-bold text-slate-400">{reg.participantId}</td>
                                    <td className="py-2.5 px-4 font-extrabold text-slate-900">{reg.name} {reg.surname}</td>
                                    <td className="py-2.5 px-4 text-right font-mono text-emerald-600 font-bold">5,000 FCFA</td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={4} className="text-center py-6 text-slate-400 italic">No registered students yet for this tournament. Be the first to join!</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Action Register Form Triggers */}
                      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-50">
                        {isAlreadyReg ? (
                          <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-150 text-emerald-800 rounded-2xl w-full text-xs font-semibold leading-relaxed shadow-sm">
                            <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                            <span className="font-extrabold text-[11px]">
                              {language === 'FRENCH' 
                                ? "VOUS ÊTES INSCRIT : Vous participez officiellement à ce tournoi académique ! Préparez-vous pour le championnat." 
                                : "CONFIRMED ENTRY: You are already registered for this academic tournament! Prepare to compete."}
                            </span>
                          </div>
                        ) : isClosed ? (
                          <div className="flex items-center gap-2 px-4 py-3 bg-rose-50 border border-rose-100 text-rose-800 rounded-2xl w-full text-xs font-black leading-relaxed shadow-inner">
                            <AlertTriangle className="w-4.5 h-4.5 shrink-0" />
                            <span>
                              {isFull 
                                ? "REGISTRATIONS ARE CLOSED: The maximum required students limit (reached!) has been satisfied." 
                                : "REGISTRATIONS ARE CLOSED: The exam session registration date cutoff has passed."}
                            </span>
                          </div>
                        ) : (
                          <>
                            <p className="text-xs text-slate-500 font-medium leading-relaxed">
                              Registration fee is <strong>5,000 FCFA</strong>. This is remitted digitally. Your details will align on the Excel Spreadsheet dynamically.
                            </p>
                            <button
                              onClick={() => handleOpenRegistration(tour)}
                              className="px-8 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-700 text-white font-black text-xs rounded-xl tracking-wider uppercase shadow-md shadow-purple-900/10 cursor-pointer shrink-0"
                            >
                              Register Now
                            </button>
                          </>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-slate-100/50 rounded-[2rem] p-12 text-center border-2 border-dashed border-slate-250 flex flex-col items-center justify-center">
                <span className="text-sm text-slate-400 font-black block">No Academic Tournaments broadcasted by Administrators.</span>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">Please keep checking. The NC administration will create competitive stages with cash rewards soon!</p>
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2.5 h-6 bg-emerald-500 rounded-full" />
              <h3 className="text-lg font-black text-slate-900">
                {language === 'FRENCH' ? 'Formations & Carrières' : language === 'CHINESE' ? '专业技能培训与工作职位' : language === 'SPANISH' ? 'Formaciones y Empleos' : 'Formations & Jobs Panel'}
              </h3>
            </div>
            
            <p className="text-xs text-slate-550 leading-relaxed max-w-3xl mb-6 font-semibold">
              Ready to claim authority in your discipline? NC.edu provides professional certifications, educational skill workshops, and active part-time tutor recruitment listings to secure your success.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Formations list block (Col spans 2) */}
              <div className="lg:col-span-2 space-y-4">
                <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block mb-2">Available Certifications & Formations</span>
                
                {formations.length > 0 ? (
                  formations.map((form) => {
                    const isAlreadyRegisteredObj = courseRegs.find(r => {
                      const u = auth.currentUser;
                      if (!u) return false;
                      const belongsToUser = r.userId === u.uid || (u.email && r.email?.toLowerCase().trim() === u.email.toLowerCase().trim());
                      return belongsToUser && r.formationTitle === form.title && r.status !== 'cancelled';
                    });

                    return (
                      <div key={form.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-emerald-200 transition-all font-sans">
                        <div>
                          <span className="px-2.5 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-md text-[9px] font-black tracking-wider block uppercase w-max mb-1.5">Active Cert</span>
                          <h5 className="font-extrabold text-slate-800 text-sm">{form.title}</h5>
                          <p className="text-[11px] text-slate-450 mt-1 max-w-md leading-relaxed">{form.description}</p>
                        </div>
                        <div className="text-right shrink-0 flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3">
                          <span className="text-sm font-mono font-black text-slate-800">
                            {form.price > 0 ? `${form.price.toLocaleString()} FCFA` : 'FREE ACCESS'}
                          </span>
                          {isAlreadyRegisteredObj ? (
                            <div className="flex flex-col items-end gap-1 bg-indigo-50/50 border border-indigo-100/60 p-2 px-3 rounded-2xl w-full sm:w-auto">
                              <span className="text-[10px] font-black text-indigo-700 tracking-wider uppercase block text-right">
                                ✓ REGISTERED
                              </span>
                              <span className="text-[8px] text-indigo-900/70 font-mono font-bold uppercase tracking-wider block text-right">
                                STATUS: {isAlreadyRegisteredObj.status || 'PENDING'}
                              </span>
                            </div>
                          ) : (
                            <button 
                              onClick={() => {
                                setSelectedCourse(form);
                              }}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] tracking-wider uppercase rounded-xl transition-all cursor-pointer shadow-sm shadow-emerald-55"
                            >
                              Enroll Course
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="bg-slate-50 border border-slate-150 border-dashed rounded-3xl p-8 text-center flex flex-col items-center justify-center">
                    <span className="text-xs text-slate-400 font-bold block">No active formations have been published by the administration yet.</span>
                    <p className="text-[10px] text-slate-450 mt-1">Please wait for the administrator to send formation catalogs and different prizes!</p>
                  </div>
                )}
              </div>

              {/* Recruitment jobs board (Col spans 1) */}
              <div className="space-y-4">
                <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block mb-2">NC.edu Hiring Opportunities</span>
                
                {jobs.length > 0 ? (
                  jobs.map((jb) => (
                    <div key={jb.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-4 hover:border-emerald-200 transition-all font-sans">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
                          <span className="text-[9px] uppercase font-extrabold text-green-700 block tracking-wider">Hiring Now</span>
                        </div>
                        <h5 className="font-extrabold text-slate-800 text-sm mt-1.5">{jb.title}</h5>
                        <p className="text-[11px] text-slate-450 leading-relaxed mt-1">{jb.description}</p>
                      </div>
                      <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                        <span className="text-[10px] text-slate-500 font-semibold">Comp: <strong className="text-slate-800">{jb.payout}</strong></span>
                        <button 
                          onClick={() => {
                            const enrolled = userData?.enrolledFormations || [];
                            if (enrolled.length === 0) {
                              alert(`⚠️ Application Denied: You have not attended any courses required for this job yet. You need to have some courses on your curriculum first of all. Please enroll and attend active certifications at the left panel!`);
                              return;
                            }
                            alert(`🎉 Recruitment Application Lodged for "${jb.title}"! The Admin Committee will review your attended courses (${enrolled.join(', ')}) and reach out to you.`);
                          }}
                          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-750 text-white font-black text-[9px] tracking-wider uppercase rounded-lg transition-all cursor-pointer shadow-sm"
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-slate-50 border border-slate-150 border-dashed rounded-3xl p-6 text-center flex flex-col items-center justify-center">
                    <span className="text-[11px] text-slate-400 font-bold">No active job listings.</span>
                    <p className="text-[9px] text-slate-450 mt-1">The NC administration has not requested part-time recrutiments at this hour.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* REGISTRATION DETAILED STEP-BY-STEP DRAWER/PANEL OVERLAY */}
        <AnimatePresence>
          {regStep !== 'IDLE' && selectedTournament && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-slate-900/90 flex items-center justify-center p-4"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 30 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 30 }}
                className="bg-white w-full max-w-lg rounded-[2.2rem] shadow-2xl p-6 md:p-8 flex flex-col relative max-h-[90vh] overflow-y-auto"
              >
                {/* Close overlay */}
                <button 
                  onClick={() => setRegStep('IDLE')}
                  className="absolute top-5 right-5 p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* STEP 1: PARTICIPANT FORM */}
                {regStep === 'FORM' && (
                  <form onSubmit={handleFormSubmit} className="space-y-5">
                    <div className="text-center pb-2 border-b border-slate-100">
                      <span className="text-[10px] text-purple-600 font-black uppercase tracking-widest block">STEP 1 OF 2</span>
                      <h3 className="text-lg font-black text-slate-800">Tournament Competitor Record</h3>
                      <p className="text-xs text-slate-500 leading-normal mt-1">Please insert your real name and contact details safely to associate your results.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] text-slate-500 font-bold block mb-1">FIRST NAME</label>
                        <input 
                          type="text" 
                          placeholder="Name" 
                          value={name}
                          onChange={e => setName(e.target.value)}
                          className="w-full border border-slate-200 focus:border-purple-500 bg-slate-50/50 rounded-xl p-3 text-xs font-bold outline-none font-sans"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 font-bold block mb-1">SURNAME</label>
                        <input 
                          type="text" 
                          placeholder="Surname" 
                          value={surname}
                          onChange={e => setSurname(e.target.value)}
                          className="w-full border border-slate-200 focus:border-purple-500 bg-slate-50/50 rounded-xl p-3 text-xs font-bold outline-none font-sans"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-500 font-bold block mb-1">EMAIL ADDRESS</label>
                      <input 
                        type="email" 
                        placeholder="yourname@gmail.com" 
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full border border-slate-200 focus:border-purple-500 bg-slate-50/50 rounded-xl p-3 text-xs font-bold outline-none font-sans"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-500 font-bold block mb-1">PHONE NUMBER</label>
                      <input 
                        type="tel" 
                        placeholder="e.g. +237 677 22 41 12" 
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        className="w-full border border-slate-200 focus:border-purple-500 bg-slate-50/50 rounded-xl p-3 text-xs font-bold outline-none font-sans"
                        required
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-xl text-xs uppercase tracking-wide transition-all shadow-md mt-2 cursor-pointer"
                      >
                        Proceed to Payment ({finalPrice.toLocaleString()} FCFA)
                      </button>
                    </div>
                  </form>
                )}

                {/* STEP 2: PAYMENT OVERLAY SIMULATOR */}
                {regStep === 'PAYMENT' && (
                  <form onSubmit={handleAuthorizePayment} className="space-y-6">
                    <div className="text-center pb-2 border-b border-slate-100">
                      <span className="text-[10px] text-purple-600 font-black uppercase tracking-widest block">STEP 2 OF 2</span>
                      <h3 className="text-lg font-black text-slate-800">Secure Payment Gateway</h3>
                      <p className="text-xs text-slate-500 leading-normal mt-1">
                        Pay exactly {finalPrice.toLocaleString()} FCFA registration fee. Simulating Central African Mobile Networks.
                        {discountPercent > 0 && (
                          <span className="block text-emerald-600 font-black mt-1">🎉 {discountPercent}% Premium Subscriber reduction applied!</span>
                        )}
                      </p>
                    </div>

                    {/* Cost Badge */}
                    <div className="bg-[#e0e7ff]/30 border border-[#c7d2fe] p-4 rounded-xl flex items-center justify-between">
                      <span className="text-xs font-extrabold text-[#110e25] font-sans">AMOUNT TO REMIT:</span>
                      <div className="text-right">
                        {discountPercent > 0 && (
                          <span className="text-xs line-through text-slate-400 font-mono mr-2 block">5,000 FCFA</span>
                        )}
                        <span className="text-lg font-mono font-black text-rose-600">{finalPrice.toLocaleString()} FCFA</span>
                      </div>
                    </div>

                    {/* Method Choose */}
                    <div>
                      <label className="text-[10px] text-slate-500 font-bold block mb-2">CHOOSE MOBILE OPERATOR</label>
                      <div className="grid grid-cols-3 gap-3">
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('mtn')}
                          className={`p-3 rounded-xl border font-bold text-xs flex flex-col items-center gap-1 transition-all cursor-pointer ${
                            paymentMethod === 'mtn' 
                              ? 'border-amber-400 bg-amber-50 text-amber-955 shadow-xs' 
                              : 'border-slate-200 hover:border-slate-350 opacity-80'
                          }`}
                        >
                          <Smartphone className="w-4 h-4 text-amber-550 text-amber-600" />
                          <span>MTN MoMo</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('orange')}
                          className={`p-3 rounded-xl border font-bold text-xs flex flex-col items-center gap-1 transition-all cursor-pointer ${
                            paymentMethod === 'orange' 
                              ? 'border-orange-400 bg-orange-50 text-orange-955 shadow-xs' 
                              : 'border-slate-200 hover:border-slate-350 opacity-80'
                          }`}
                        >
                          <Smartphone className="w-4 h-4 text-orange-600" />
                          <span>Orange</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('card')}
                          className={`p-3 rounded-xl border font-bold text-xs flex flex-col items-center gap-1 transition-all cursor-pointer ${
                            paymentMethod === 'card' 
                              ? 'border-indigo-400 bg-indigo-50 text-indigo-955 shadow-xs' 
                              : 'border-slate-200 hover:border-slate-350 opacity-80'
                          }`}
                        >
                          <CreditCard className="w-4 h-4 text-indigo-600" />
                          <span>Credit Card</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-500 font-bold block mb-1">
                        {paymentMethod === 'card' ? 'CARD NUMBER / HOLDER NAME' : 'PAYMENT PHONE CODE / MOBILE WALLET'}
                      </label>
                      <input 
                        type="text" 
                        value={paymentPhone}
                        onChange={e => {
                          setPaymentPhone(e.target.value);
                          setPaymentErr('');
                        }}
                        placeholder={paymentMethod === 'card' ? '4000 1234 5678 9010' : 'e.g. 677224112 / +237...'}
                        className="w-full border border-slate-200 focus:border-indigo-500 rounded-xl p-3 text-xs font-bold font-mono outline-none"
                        required
                      />
                    </div>

                    {paymentErr && (
                      <div className="text-rose-750 font-black text-xs bg-rose-50 border border-rose-100 rounded-xl p-3">{paymentErr}</div>
                    )}

                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="flex-1 py-4 bg-purple-650 bg-indigo-600 hover:bg-slate-900 text-white font-black rounded-xl text-xs uppercase tracking-wide cursor-pointer transition-all flex items-center justify-center gap-2 shadow-md"
                      >
                        <Lock className="w-4 h-4" /> Authorize Transact
                      </button>
                      <button
                        type="button"
                        onClick={() => setRegStep('FORM')}
                        className="px-4 py-4 bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold rounded-xl text-xs cursor-pointer"
                      >
                        Back
                      </button>
                    </div>
                  </form>
                )}

                {/* STEP 3.5: CHECKOUT REDIRECT */}
                {regStep === 'CHECKOUT_REDIRECT' && (
                  <div className="py-12 flex flex-col items-center justify-center text-center gap-6">
                    <div className="w-14 h-14 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center animate-bounce">
                      <ExternalLink className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-800">Payment Session Created !</h4>
                      <p className="text-xs text-slate-400 max-w-sm mt-1.5 leading-relaxed font-semibold">
                        Please click the button below to complete your secure checkout on Notch Pay. Once verified, registration will complete automatically.
                      </p>
                    </div>
                    <a
                      href={checkoutUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full max-w-xs py-3.5 bg-gradient-to-r from-indigo-600 to-purple-700 text-white font-black rounded-xl text-xs uppercase tracking-widest cursor-pointer shadow-lg hover:shadow-indigo-300 transform transition-all flex items-center justify-center gap-2"
                    >
                      <span>PROCEED TO NOTCH PAY</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 font-semibold">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                      <span>Waiting for payment verification...</span>
                    </div>
                  </div>
                )}

                {/* STEP 3: LOADING SPINNER */}
                {regStep === 'PROCESSING' && (
                  <div className="py-12 flex flex-col items-center justify-center text-center gap-6">
                    <div className="relative">
                      <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                      <Smartphone className="w-6 h-6 text-indigo-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-bounce" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-800">Sending MoMo Push Notification Request...</h4>
                      <p className="text-xs text-slate-400 max-w-sm mt-1.5 leading-relaxed font-semibold">
                        A USSD security PIN popup challenge has been sent to raw sequence `{phone}`. Please enter your mobile money passcode on your telephone key to finish.
                      </p>
                    </div>
                  </div>
                )}

                {/* STEP 4: SUCCESS REEL */}
                {regStep === 'SUCCESS' && (
                  <div className="py-8 flex flex-col items-center justify-center text-center gap-6 max-w-xl mx-auto">
                    <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-200 scale-110">
                      <Check className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold font-display text-slate-800">
                        {language === 'FRENCH' ? 'Paiement de 5 000 FCFA Reçu !' : language === 'CHINESE' ? '5,000 FCFA 缴费成功！' : language === 'SPANISH' ? '¡5,000 FCFA Remitidos con Éxito!' : '5,000 FCFA Remitted Successfully!'}
                      </h4>
                      <p className="text-xs text-slate-400 mt-2 font-semibold">
                        {language === 'FRENCH'
                          ? 'Merci pour votre inscription. Vos informations sont synchronisées et affichées dans le panneau administratif.'
                          : language === 'CHINESE'
                          ? '感谢您的报名。您的个人信息已同步并登录到管理面板上。'
                          : language === 'SPANISH'
                          ? 'Gracias por registrarse. Sus datos están sincronizados y publicados en el panel administrativo.'
                          : 'Thank you for registering. Your details are now synchronized and posted on the administrative panel!'}
                      </p>
                    </div>

                    {/* WhatsApp Redirection Alert Banner */}
                    <div className="w-full bg-[#e8f5e9]/70 border-2 border-[#81c784]/40 rounded-3xl p-5 text-left flex gap-4 shadow-sm relative overflow-hidden transition-all duration-300">
                      <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-10 select-none text-9xl">💬</div>
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md">
                        <Smartphone className="w-6 h-6" />
                      </div>
                      <div className="space-y-1.5 z-10">
                        <h5 className="text-[12px] font-black text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                          <span>📲</span>
                          {language === 'FRENCH' 
                            ? 'GROUPE WHATSAPP & INFOS TOURNOi' 
                            : language === 'CHINESE'
                            ? 'WHATSAPP 竞赛官方群组提示'
                            : language === 'SPANISH'
                            ? 'GRUPO DE WHATSAPP E INFORMACIÓN'
                            : 'WHATSAPP REDIRECTION & TOURNAMENT INFO'}
                        </h5>
                        <p className="text-[11.5px] leading-relaxed text-emerald-900 font-extrabold">
                          {language === 'FRENCH'
                            ? "Vous allez être redirigé vers un groupe WhatsApp officiel sous peu et recevrez de plus amples informations d'ici là. Remarque importante : c'est précisément dans ce groupe que se déroulera l'intégralité du tournoi !"
                            : language === 'CHINESE'
                            ? "您很快将被自动重定向到官方 WhatsApp 群组，以便接收更多详细指示与安排。重要提醒：本次学术竞赛的所有环节及比拼均将在此专属 WhatsApp 群组内举行！"
                            : language === 'SPANISH'
                            ? "Será redirigido a un grupo oficial de WhatsApp muy pronto y recibirá más instrucciones. Nota importante: ¡es precisamente dentro de este grupo donde se llevará a cabo todo el torneo!"
                            : "You will be redirected to our official WhatsApp group soon, where you will receive further guidelines. Important notice: the entire academic tournament shall take place inside this dedicated WhatsApp group!"}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setRegStep('IDLE')}
                      className="w-full py-4 bg-slate-900 hover:bg-emerald-600 text-white font-black rounded-xl text-xs uppercase transition-all shadow-md mt-2 cursor-pointer"
                    >
                      {language === 'FRENCH' ? 'Retour au Portail' : language === 'CHINESE' ? '返回社区面板' : language === 'SPANISH' ? 'Volver al Portal' : 'Return to Community Panel'}
                    </button>
                  </div>
                )}

              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </motion.div>
    </div>
  );
}
