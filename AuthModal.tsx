import React, { useState, useEffect } from 'react';
import { 
  doc, 
  getDoc,
  setDoc, 
  runTransaction,
  serverTimestamp,
  Timestamp,
  collection,
  query,
  where,
  getDocs,
  addDoc
} from 'firebase/firestore';
import { 
  auth, 
  db,
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  signInWithPopup,
  GoogleAuthProvider
} from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { X, Lock, UserPlus, LogIn, GraduationCap, CheckCircle2, ArrowRight, Mail } from 'lucide-react';
import LegalModal from './LegalModal';

export default function AuthModal({ isOpen, onClose, onLoginSuccess }: { isOpen: boolean, onClose: () => void, onLoginSuccess?: () => void }) {
  const [isLogin, setIsLogin] = useState(true); // Default to login tab
  const [studentIdInput, setStudentIdInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [registeredId, setRegisteredId] = useState<number | null>(null);
  const [legalView, setLegalView] = useState<{ isOpen: boolean; type: 'terms' | 'privacy' }>({
    isOpen: false,
    type: 'terms'
  });
  const [showManual, setShowManual] = useState(false);
  const [manualEmail, setManualEmail] = useState('');
  const [signInStep, setSignInStep] = useState<'email' | 'id'>('email');
  const [signInEmail, setSignInEmail] = useState('');
  const [foundStudentId, setFoundStudentId] = useState<number | null>(null);
  const [isTrialTest, setIsTrialTest] = useState(true);
  const [isExistingUserSignIn, setIsExistingUserSignIn] = useState(false);
  const [hasTutor, setHasTutor] = useState(false);
  const [regTutorName, setRegTutorName] = useState('');
  const [regTutorEmail, setRegTutorEmail] = useState('');

  useEffect(() => {
    if (isOpen) {
      setIsLogin(true);
      setSignInStep('email');
      setSignInEmail('');
      setStudentIdInput('');
      setFoundStudentId(null);
      setError('');
      setManualEmail('');
      setShowManual(false);
      setRegisteredId(null);
      setIsTrialTest(true);
      setIsExistingUserSignIn(false);
      setHasTutor(false);
      setRegTutorName('');
      setRegTutorEmail('');
    }
  }, [isOpen]);

  const calculateId = (x: number) => {
    // Formula: x^2 + 3x + 1
    return Math.pow(x, 2) + (3 * x) + 1;
  };

  const handleGoogleSignUp = async () => {
    if (!acceptedTerms) {
      setError('Please accept the Terms and Conditions first.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      // Prompt user for Google OAuth identity confirmation
      const result = await signInWithPopup(auth, provider);
      const googleUser = result.user;
      if (!googleUser.email) {
        throw new Error('Google Account must have an email address associated.');
      }
      
      const targetEmail = googleUser.email.trim().toLowerCase();
      
      // Query to check if Google email is already registered in users DB
      const q = query(collection(db, 'users'), where('email', '==', targetEmail));
      const querySnap = await getDocs(q);
      
      if (!querySnap.empty) {
        // User already has an account! Let's sign out of Google session and log in under their Student ID account.
        const list = querySnap.docs.map(doc => doc.data());
        list.sort((a, b) => (Number(a.studentId) || 999999) - (Number(b.studentId) || 999999));
        const canonical = list[0];
        const sid = canonical.studentId;
        await signOut(auth);
        await signInWithEmailAndPassword(auth, `student_${sid}@nc.edu`, `secure_student_pass_${sid}_x`);
        onClose();
        return;
      }
      
      // User is completely new! Reserve the next sequence number & studentId atomically
      let nextX = 1;
      let studentId = 0;
      
      await runTransaction(db, async (transaction) => {
        const counterRef = doc(db, 'counters', 'users');
        const counterSnap = await transaction.get(counterRef);
        
        if (counterSnap.exists()) {
          nextX = counterSnap.data().count + 1;
        }
        if (nextX === -1 || nextX === -2) {
          nextX += 1;
        }
        studentId = calculateId(nextX);
        transaction.set(counterRef, { count: nextX });
      });
      
      // Clean up Google Auth session to prevent cross-account auth mixing
      await signOut(auth);
      
      // Create student credentials credential account
      const studentEmail = `student_${studentId}@nc.edu`;
      const studentPassword = `secure_student_pass_${studentId}_x`;
      
      const studentCred = await createUserWithEmailAndPassword(auth, studentEmail, studentPassword);
      
      // Write profile to standard Users collection with student account UID
      const trialDays = 7;
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + trialDays);
      
      const userPayload: any = {
        email: targetEmail,
        studentId: studentId,
        userSequence: nextX,
        hasPaid: false,
        isTrialTest: isTrialTest,
        tutorName: hasTutor ? regTutorName.trim() : '',
        tutorEmail: hasTutor ? regTutorEmail.trim().toLowerCase() : '',
        registeredUnderTutor: hasTutor && !!(regTutorName.trim() || regTutorEmail.trim()),
        createdAt: serverTimestamp(),
        acceptedTerms: true
      };

      if (isTrialTest) {
        userPayload.trialStartedAt = serverTimestamp();
        userPayload.trialEndsAt = Timestamp.fromDate(trialEndsAt);
      }

      await setDoc(doc(db, 'users', studentCred.user.uid), userPayload);

      if (hasTutor && (regTutorName.trim() || regTutorEmail.trim())) {
        try {
          await addDoc(collection(db, 'mentor_subscription_answers'), {
            studentId: `STU-${studentId}`,
            studentEmail: targetEmail,
            studentName: targetEmail.split('@')[0],
            referralType: 'under_tutor',
            tutorName: regTutorName.trim(),
            tutorEmail: regTutorEmail.trim().toLowerCase(),
            plan: 'Direct Registration Referral',
            createdAt: serverTimestamp()
          });
        } catch (e) {
          console.error('Error logging mentor answer during Google registration:', e);
        }
      }
      
      // Save and display assigned Student ID
      setRegisteredId(studentId);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Google Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedTerms) {
      setError('Please accept the Terms and Conditions first.');
      return;
    }
    if (!manualEmail.trim() || !manualEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const targetEmail = manualEmail.trim().toLowerCase();
      
      // Query to check if Google/manual email is already registered in users DB
      const q = query(collection(db, 'users'), where('email', '==', targetEmail));
      const querySnap = await getDocs(q);
      
      if (!querySnap.empty) {
        // User already has an account! Log in under their Student ID account.
        const list = querySnap.docs.map(doc => doc.data());
        list.sort((a, b) => (Number(a.studentId) || 999999) - (Number(b.studentId) || 999999));
        const canonical = list[0];
        const sid = canonical.studentId;
        await signOut(auth);
        await signInWithEmailAndPassword(auth, `student_${sid}@nc.edu`, `secure_student_pass_${sid}_x`);
        onClose();
        return;
      }
      
      // User is completely new! Reserve the next sequence number & studentId atomically
      let nextX = 1;
      let studentId = 0;
      
      await runTransaction(db, async (transaction) => {
        const counterRef = doc(db, 'counters', 'users');
        const counterSnap = await transaction.get(counterRef);
        
        if (counterSnap.exists()) {
          nextX = counterSnap.data().count + 1;
        }
        if (nextX === -1 || nextX === -2) {
          nextX += 1;
        }
        studentId = calculateId(nextX);
        transaction.set(counterRef, { count: nextX });
      });
      
      // Create student credentials credential account
      const studentEmail = `student_${studentId}@nc.edu`;
      const studentPassword = `secure_student_pass_${studentId}_x`;
      
      const studentCred = await createUserWithEmailAndPassword(auth, studentEmail, studentPassword);
      
      // Write profile to standard Users collection with student account UID
      const trialDays = 7;
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + trialDays);
      
      const userPayload: any = {
        email: targetEmail,
        studentId: studentId,
        userSequence: nextX,
        hasPaid: false,
        isTrialTest: isTrialTest,
        tutorName: hasTutor ? regTutorName.trim() : '',
        tutorEmail: hasTutor ? regTutorEmail.trim().toLowerCase() : '',
        registeredUnderTutor: hasTutor && !!(regTutorName.trim() || regTutorEmail.trim()),
        createdAt: serverTimestamp(),
        acceptedTerms: true
      };

      if (isTrialTest) {
        userPayload.trialStartedAt = serverTimestamp();
        userPayload.trialEndsAt = Timestamp.fromDate(trialEndsAt);
      }

      await setDoc(doc(db, 'users', studentCred.user.uid), userPayload);

      if (hasTutor && (regTutorName.trim() || regTutorEmail.trim())) {
        try {
          await addDoc(collection(db, 'mentor_subscription_answers'), {
            studentId: `STU-${studentId}`,
            studentEmail: targetEmail,
            studentName: targetEmail.split('@')[0],
            referralType: 'under_tutor',
            tutorName: regTutorName.trim(),
            tutorEmail: regTutorEmail.trim().toLowerCase(),
            plan: 'Direct Registration Referral',
            createdAt: serverTimestamp()
          });
        } catch (e) {
          console.error('Error logging mentor answer during manual registration:', e);
        }
      }
      
      // Save and display assigned Student ID
      setRegisteredId(studentId);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignInEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const targetEmail = signInEmail.trim().toLowerCase();
    if (!targetEmail || !targetEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const q = query(collection(db, 'users'), where('email', '==', targetEmail));
      const querySnap = await getDocs(q);
      
      if (!querySnap.empty) {
        // User exists! Auto-login
        const list = querySnap.docs.map(doc => doc.data());
        list.sort((a, b) => (Number(a.studentId) || 999999) - (Number(b.studentId) || 999999));
        const canonical = list[0];
        const sid = Number(canonical.studentId);
        
        const studentEmail = `student_${sid}@nc.edu`;
        const studentPassword = `secure_student_pass_${sid}_x`;
        
        await signInWithEmailAndPassword(auth, studentEmail, studentPassword);
        setIsExistingUserSignIn(true);
        setRegisteredId(sid);
      } else {
        // User does not exist! Auto-register on the fly to prevent blank page or stuck states
        let nextX = 1;
        let studentId = 0;
        
        await runTransaction(db, async (transaction) => {
          const counterRef = doc(db, 'counters', 'users');
          const counterSnap = await transaction.get(counterRef);
          
          if (counterSnap.exists()) {
            nextX = counterSnap.data().count + 1;
          }
          if (nextX === -1 || nextX === -2) {
            nextX += 1;
          }
          studentId = calculateId(nextX);
          transaction.set(counterRef, { count: nextX });
        });
        
        const studentEmail = `student_${studentId}@nc.edu`;
        const studentPassword = `secure_student_pass_${studentId}_x`;
        
        const studentCred = await createUserWithEmailAndPassword(auth, studentEmail, studentPassword);
        
        const trialDays = 7;
        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + trialDays);
        
        const userPayload: any = {
          email: targetEmail,
          studentId: studentId,
          userSequence: nextX,
          hasPaid: false,
          isTrialTest: isTrialTest,
          createdAt: serverTimestamp(),
          acceptedTerms: true
        };

        if (isTrialTest) {
          userPayload.trialStartedAt = serverTimestamp();
          userPayload.trialEndsAt = Timestamp.fromDate(trialEndsAt);
        }

        await setDoc(doc(db, 'users', studentCred.user.uid), userPayload);
        
        setIsExistingUserSignIn(false);
        setRegisteredId(studentId);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error occurred during authentication. Please contact NC.edu support.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignInIdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsedId = parseInt(studentIdInput.trim(), 10);
    if (isNaN(parsedId)) {
      setError('Please enter a valid numeric Student ID.');
      return;
    }

    if (parsedId !== foundStudentId) {
      setError('The Student ID number you entered is incorrect. Please contact the admins of NC.EDU to solve your problem.');
      return;
    }

    setLoading(true);
    try {
      const studentEmail = `student_${parsedId}@nc.edu`;
      const studentPassword = `secure_student_pass_${parsedId}_x`;
      
      await signInWithEmailAndPassword(auth, studentEmail, studentPassword);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError('Unable to authenticate at this time. Please contact the admins of NC.EDU to solve your problem.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <LegalModal 
        isOpen={legalView.isOpen} 
        type={legalView.type} 
        onClose={() => setLegalView(prev => ({ ...prev, isOpen: false }))} 
      />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative max-h-[95vh] overflow-y-auto border border-slate-100"
      >
        <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition-colors">
          <X className="w-6 h-6 text-slate-400" />
        </button>

        {registeredId !== null ? (
          /* Registration or Sign In Success Screen showing Student ID */
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-600 animate-bounce" />
            </div>
            <h2 className="text-3xl font-bold font-display text-slate-800 mb-2">
              {isExistingUserSignIn ? 'Signed In Successfully!' : 'Registration Completed!'}
            </h2>
            <p className="text-slate-500 mb-6 text-sm">
              {isExistingUserSignIn 
                ? 'Welcome back to NC.edu. Your personal student learning ID has been retrieved.'
                : 'Welcome to NC.edu. Your personal student learning ID has been generated.'}
            </p>
            
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 mb-8">
              <span className="text-xs uppercase text-slate-400 font-bold tracking-wider block mb-1">Your Unique Student ID</span>
              <span className="text-4xl font-extrabold text-blue-600 font-mono tracking-wider">{registeredId}</span>
            </div>
            
            <div className="text-xs text-slate-500 bg-amber-50 border border-amber-100/50 rounded-xl p-4 mb-8 text-left leading-relaxed">
              <strong>CRITICAL INSTRUCTION:</strong> Save and write down this number! From now on, you can log in to your student dashboard by simply entering this ID on the sign-in panel.
            </div>
            
            <button 
              onClick={() => {
                setRegisteredId(null);
                onClose();
                if (onLoginSuccess) {
                  onLoginSuccess();
                }
              }} 
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2"
            >
              Let's Start Learning <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        ) : (
          /* Regular Form Screen */
          <>
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center">
                <GraduationCap className="w-10 h-10 text-blue-600" />
              </div>
            </div>

            <h2 className="text-3xl font-bold text-center mb-2 font-display text-slate-800">
              {isLogin ? (signInStep === 'email' ? 'Sign In' : 'Verify ID') : 'Register'}
            </h2>
            <p className="text-gray-500 text-center mb-8 text-sm">
              {isLogin 
                ? (signInStep === 'email' 
                    ? 'Enter your registered email address to find your ID' 
                    : `Now enter your Student ID number for ${signInEmail}`)
                : 'Registration is Google-only for verified students'}
            </p>

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm border border-red-100 whitespace-pre-line leading-relaxed">
                {error}
              </div>
            )}

            {isLogin ? (
              signInStep === 'email' ? (
                /* Sign In Form - Step 1: Email Address */
                <form onSubmit={handleSignInEmailSubmit} className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input 
                      type="email" 
                      placeholder="Enter your email address"
                      required
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm text-slate-800 placeholder-slate-400"
                      value={signInEmail}
                      onChange={(e) => setSignInEmail(e.target.value)}
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-500/10 cursor-pointer"
                  >
                    {loading ? 'Searching your ID...' : <><ArrowRight className="w-5 h-5" /> Let\'s Find my ID</>}
                  </button>
                </form>
              ) : (
                /* Sign In Form - Step 2: Student ID Verification */
                <form onSubmit={handleSignInIdSubmit} className="space-y-4">
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input 
                      type="text" 
                      pattern="[0-9]*"
                      inputMode="numeric"
                      placeholder="Enter your Student ID number"
                      required
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm text-slate-800 placeholder-slate-400"
                      value={studentIdInput}
                      onChange={(e) => setStudentIdInput(e.target.value.replace(/\D/g, ''))}
                    />
                  </div>

                  <div className="flex gap-3">
                    <button 
                      type="button"
                      onClick={() => {
                        setSignInStep('email');
                        setStudentIdInput('');
                        setError('');
                      }}
                      className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-colors text-center text-sm cursor-pointer"
                    >
                      Back
                    </button>
                    <button 
                      type="submit" 
                      disabled={loading}
                      className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-500/10 cursor-pointer"
                    >
                      {loading ? 'Verifying...' : <><LogIn className="w-5 h-5" /> Sign In</>}
                    </button>
                  </div>
                </form>
              )
            ) : (
              /* Google Signup/Manual Fallback Form */
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 animate-fadeIn">
                  <button 
                    type="button"
                    onClick={() => setAcceptedTerms(!acceptedTerms)}
                    className={`mt-1 flex-shrink-0 w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${acceptedTerms ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}
                  >
                    {acceptedTerms && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </button>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    I agree to the{' '}
                    <button type="button" onClick={() => setLegalView({ isOpen: true, type: 'terms' })} className="text-blue-600 font-bold hover:underline bg-transparent">Terms of Service</button>
                    {' '}and{' '}
                    <button type="button" onClick={() => setLegalView({ isOpen: true, type: 'privacy' })} className="text-blue-600 font-bold hover:underline bg-transparent">Privacy Policy</button>.
                  </p>
                </div>

                <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/60 flex items-start gap-3 animate-fadeIn font-sans">
                  <button 
                    type="button"
                    onClick={() => setIsTrialTest(!isTrialTest)}
                    className={`mt-1 flex-shrink-0 w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${isTrialTest ? 'bg-indigo-600 border-indigo-600 shadow-xs shadow-indigo-100' : 'border-slate-300'}`}
                  >
                    {isTrialTest && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </button>
                  <div>
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Join for a 7-day Trial Test?</h4>
                    <p className="text-[10px] text-slate-500 font-bold leading-normal mt-1">
                      Are you here for a 7-day trial? At the end of the 7 days, you will be redirected to drop your experience and suggest what we could improve inside the admin support chat.
                    </p>
                  </div>
                </div>

                {/* Tutor Referral Box */}
                <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-100 flex flex-col gap-3 font-sans">
                  <div className="flex items-start gap-3">
                    <button 
                      type="button"
                      onClick={() => setHasTutor(!hasTutor)}
                      className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center shrink-0 ${hasTutor ? 'bg-purple-600 border-purple-600 shadow-xs' : 'border-slate-300 bg-white'}`}
                    >
                      {hasTutor && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </button>
                    <div>
                      <h4 className="text-xs font-black text-purple-950 uppercase tracking-wider">Registering under a Tutor / Teacher?</h4>
                      <p className="text-[10px] text-purple-700 font-bold leading-normal mt-0.5">
                        Check this box if a tutor, mentor, or teacher referred you to NC.edu so your registration is assigned to them.
                      </p>
                    </div>
                  </div>

                  {hasTutor && (
                    <div className="space-y-3 pt-2 border-t border-purple-100/80 animate-fadeIn">
                      <div>
                        <label className="block text-[10px] font-black uppercase text-purple-900 mb-1 tracking-wider">
                          Tutor Full Name <span className="text-rose-500">*</span>
                        </label>
                        <input 
                          type="text" 
                          placeholder="e.g. Mr. Alain Fonkou"
                          required={hasTutor}
                          className="w-full px-3.5 py-2.5 bg-white border border-purple-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                          value={regTutorName}
                          onChange={(e) => setRegTutorName(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase text-purple-900 mb-1 tracking-wider">
                          Tutor Email Address <span className="text-rose-500">*</span>
                        </label>
                        <input 
                          type="email" 
                          placeholder="e.g. tutor.alain@gmail.com"
                          required={hasTutor}
                          className="w-full px-3.5 py-2.5 bg-white border border-purple-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                          value={regTutorEmail}
                          onChange={(e) => setRegTutorEmail(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {!showManual ? (
                  <div className="space-y-4">
                    <button
                      type="button"
                      onClick={handleGoogleSignUp}
                      disabled={loading}
                      className="w-full py-4 bg-white border border-slate-100 text-gray-700 font-bold rounded-2xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-3 text-sm shadow-sm cursor-pointer"
                    >
                      <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" referrerPolicy="no-referrer" />
                      {loading ? 'Processing...' : <><UserPlus className="w-5 h-5" /> Register with Google</>}
                    </button>

                    <div className="text-center pt-2">
                      <button
                        type="button"
                        onClick={() => setShowManual(true)}
                        className="text-xs text-blue-600 hover:text-blue-700 font-semibold hover:underline bg-transparent border-none cursor-pointer"
                      >
                        Having issues with Google popup? Try Email Fallback
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleManualSignUp} className="space-y-4 animate-fadeIn">
                    <div className="relative">
                      <input 
                        type="email" 
                        placeholder="Enter your email address"
                        required
                        className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm text-slate-800 placeholder-slate-400"
                        value={manualEmail}
                        onChange={(e) => setManualEmail(e.target.value)}
                      />
                    </div>

                    <button 
                      type="submit" 
                      disabled={loading}
                      className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-500/10 cursor-pointer"
                    >
                      {loading ? 'Processing...' : <><UserPlus className="w-5 h-5" /> Register & Generate ID</>}
                    </button>

                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => setShowManual(false)}
                        className="text-xs text-gray-500 hover:text-gray-700 font-semibold hover:underline bg-transparent border-none cursor-pointer"
                      >
                        ← Back to Google Registration
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            <div className="mt-8 text-center text-sm text-gray-500">
              {isLogin ? "Need an account?" : "Already have an account?"}{' '}
              <button 
                onClick={() => {
                  const nextIsLogin = !isLogin;
                  setIsLogin(nextIsLogin);
                  setError('');
                  setSignInStep('email');
                  setSignInEmail('');
                  setStudentIdInput('');
                  setFoundStudentId(null);
                }} 
                className="text-blue-600 font-bold hover:underline"
              >
                {isLogin ? 'Register Now' : 'Sign In'}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
