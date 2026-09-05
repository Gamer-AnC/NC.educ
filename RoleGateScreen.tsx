import React, { useState } from 'react';
import { Lock, Users, ArrowRight, ShieldCheck, UserPlus, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import PhotoUploader from './PhotoUploader';

interface RoleGateScreenProps {
  onEnterAdmin: (name: string, email: string, contactNumber: string, photoUrl?: string) => void;
  onEnterOthers: () => void;
}

export default function RoleGateScreen({ onEnterAdmin, onEnterOthers }: RoleGateScreenProps) {
  const [mode, setMode] = useState<'CHOICE' | 'ADMIN_FORM' | 'ADMIN_REGISTER'>('CHOICE');
  const [adminName, setAdminName] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [adminPhoto, setAdminPhoto] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminContact, setAdminContact] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginSecurityChallenge, setShowLoginSecurityChallenge] = useState(false);

  const checkIfEmailAllowed = async (email: string): Promise<boolean> => {
    const emailLower = email.trim().toLowerCase();
    // Only Chief Administrator Ngandi Celestin is exempt from the register check
    if (adminName.trim().toLowerCase() === 'ngandi celestin') {
      return true;
    }
    try {
      const allowedSnap = await getDoc(doc(db, 'allowed_admin_emails', emailLower));
      return allowedSnap.exists();
    } catch (err) {
      console.error("Error checking allowed emails, defaulting to false:", err);
      return false;
    }
  };

  const handleUnauthorizedAdminAttempt = async (email: string, actionName: string) => {
    // Increment count in localStorage
    const currentCountStr = localStorage.getItem('nc_failed_admin_email_attempts') || '0';
    const currentCount = parseInt(currentCountStr, 10) + 1;
    localStorage.setItem('nc_failed_admin_email_attempts', currentCount.toString());

    // Log the intrusion in security_messages
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const hourStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    try {
      await addDoc(collection(db, 'security_messages'), {
        message: `Unauthorized admin ${actionName} attempt by email: ${email}. Attempt count: ${currentCount}`,
        date: dateStr,
        hour: hourStr,
        email: email,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Failed to log unauthorized attempt:", err);
    }

    if (currentCount > 1) {
      setErrorMsg("NC.edu is an app that has legal backgrounds so if you try to enter as an admin again be certain that we shall take that as a threat and we shall act in consequence. So for your own good, kindly never try to enter as an admin.");
    } else {
      setErrorMsg(`Error: Your email address (${email}) is not in the approved register of administrative staff on NC.edu. Unauthorized entry is forbidden.`);
    }
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (!adminName.trim()) {
      setErrorMsg('Kindly enter your name before logging in.');
      return;
    }

    // Checking correct password from Firestore configuration or fallback to default
    setIsLoading(true);
    let activePassword = 'SOUNDS OF THE SPIRIT';
    try {
      const configSnap = await getDoc(doc(db, 'admins_config', 'password'));
      if (configSnap.exists()) {
        activePassword = configSnap.data().password || 'SOUNDS OF THE SPIRIT';
      } else {
        // Create the initial configuration securely
        await setDoc(doc(db, 'admins_config', 'password'), {
          password: 'SOUNDS OF THE SPIRIT',
          lastUpdatedBy: 'System Init',
          lastUpdatedMonth: '2026-01'
        });
      }
    } catch (err) {
      console.error("Firestore configs read failed, utilizing hardcoded fallback credential:", err);
    }

    if (password.trim().toUpperCase() === activePassword.trim().toUpperCase()) {
      const normalized = adminName.trim().toLowerCase().replace(/\s+/g, '_');
      const isNgandi = adminName.trim().toLowerCase() === 'ngandi celestin';

      if (isNgandi && !showLoginSecurityChallenge) {
        setShowLoginSecurityChallenge(true);
        setAdminEmail('');
        setSecurityAnswer('');
        setIsLoading(false);
        return;
      }

      try {
        // 1. Pre-emptive ban check by normalized username
        const bannedSnap = await getDoc(doc(db, 'banned_admins', normalized));
        if (bannedSnap.exists()) {
          setErrorMsg('This account has been banned.');
          setIsLoading(false);
          return;
        }

        const snap = await getDoc(doc(db, 'admins', normalized));
        if (snap.exists()) {
          const data = snap.data();
          if (data.isBlocked) {
            setErrorMsg('This administrator account has been blocked by Chief Administrator Ngandi Celestin.');
            setIsLoading(false);
            return;
          }
          
          // Double check email ban if the document has email
          if (data.email) {
            const emailBanQuery = query(collection(db, 'banned_admins'), where('email', '==', data.email.trim().toLowerCase()));
            const emailBanSnap = await getDocs(emailBanQuery);
            if (!emailBanSnap.empty) {
              setErrorMsg('This account has been banned.');
              setIsLoading(false);
              return;
            }

            // Check if their email is in the allowed register
            const isAllowed = await checkIfEmailAllowed(data.email);
            if (!isAllowed) {
              await handleUnauthorizedAdminAttempt(data.email, "Login");
              setIsLoading(false);
              return;
            }
          }

          onEnterAdmin(adminName.trim(), data.email || '', data.contactNumber || '', data.photoUrl || '');
        } else {
          // No profile yet, so let's prompt them to create their profile with a photo!
          setAdminPhoto('');
          setAdminEmail('');
          setAdminContact('');
          setMode('ADMIN_REGISTER');
        }
      } catch (err: any) {
        console.error("Firestore admin fetch failed, falling back", err);
        // Fallback to bypass in case of network variance
        onEnterAdmin(adminName.trim(), '', '', '');
      } finally {
        setIsLoading(false);
      }
    } else {
      setErrorMsg('You cannot enter as an admin; better enter as a student / tutor. (Password incorrect)');
      setIsLoading(false);
    }
  };

  const handleSecurityChallengeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    const isNgandi = adminName.trim().toLowerCase() === 'ngandi celestin';
    const normalized = adminName.trim().toLowerCase().replace(/\s+/g, '_');

    // Requirement: Must ask "Is top gun the best?", answer is "Abanda"
    if (securityAnswer.trim().toLowerCase() !== 'abanda') {
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const hourStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

      // Send log message alert to "Ngandi Celestin" collection
      try {
        await addDoc(collection(db, 'security_messages'), {
          message: `Attempted login as "Ngandi Celestin" rejected due to incorrect security answer.`,
          date: dateStr,
          hour: hourStr,
          email: adminEmail.trim() || 'No email provided',
          createdAt: serverTimestamp()
        });
      } catch (err) {
        console.error("Failed to log security warning:", err);
      }

      setErrorMsg("You cannot register/login as Ngandi Celestin. Unauthorized login attempts are logged and flagged.");
      setIsLoading(false);
      return;
    }

    try {
      // Security Answer correct! Let's check if the admin profile already exists
      const snap = await getDoc(doc(db, 'admins', normalized));
      if (snap.exists()) {
        const data = snap.data();
        if (data.isBlocked) {
          setErrorMsg('This administrator account has been blocked by Chief Administrator Ngandi Celestin.');
          setIsLoading(false);
          return;
        }
        
        // Log in Celestin successfully
        onEnterAdmin(adminName.trim(), data.email || 'ngandi109@gmail.com', data.contactNumber || '', data.photoUrl || '');
      } else {
        // Doesn't exist yet, proceed to REGISTER mode but set the email and photo
        setMode('ADMIN_REGISTER');
        setShowLoginSecurityChallenge(false);
      }
    } catch (err: any) {
      console.error("Failed security challenge verification:", err);
      onEnterAdmin(adminName.trim(), 'ngandi109@gmail.com', '', '');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAccount = async () => {
    setIsLoading(true);
    const normalized = adminName.trim().toLowerCase().replace(/\s+/g, '_');
    const isNgandi = adminName.trim().toLowerCase() === 'ngandi celestin';

    try {
      // Pre-emptive ban check by username
      const bannedSnap = await getDoc(doc(db, 'banned_admins', normalized));
      if (bannedSnap.exists()) {
        setErrorMsg('This account has been banned.');
        setIsLoading(false);
        return;
      }

      // Email registration requirement check
      if (!isNgandi) {
        if (!adminEmail.trim()) {
          setErrorMsg('An email address is required to register as an administrator.');
          setIsLoading(false);
          return;
        }

        // Email ban check
        const emailBanQuery = query(collection(db, 'banned_admins'), where('email', '==', adminEmail.trim().toLowerCase()));
        const emailBanSnap = await getDocs(emailBanQuery);
        if (!emailBanSnap.empty) {
          setErrorMsg('This account has been banned.');
          setIsLoading(false);
          return;
        }

        // Check if their email is in the allowed register
        const isAllowed = await checkIfEmailAllowed(adminEmail);
        if (!isAllowed) {
          await handleUnauthorizedAdminAttempt(adminEmail, "Registration");
          setIsLoading(false);
          return;
        }
      }

      // Security check specifically for Ngandi Celestin registration
      if (isNgandi) {
        if (!adminEmail.trim()) {
          setErrorMsg('An email address is required to register as Chief Administrator.');
          setIsLoading(false);
          return;
        }

        if (securityAnswer.trim().toLowerCase() !== 'abanda') {
          const now = new Date();
          const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
          const hourStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

          // Send message alert to "Ngandi Celestin" by storing in security_messages
          await addDoc(collection(db, 'security_messages'), {
            message: `Attempted registration as "Ngandi Celestin" rejected due to incorrect security answer.`,
            date: dateStr,
            hour: hourStr,
            email: adminEmail.trim() || 'No email provided',
            createdAt: serverTimestamp()
          });

          setErrorMsg("You cannot register as Ngandi Celestin. Unauthorized signup attempts are logged and flagged.");
          setIsLoading(false);
          return;
        }
      }

      // Pre-emptive block check
      const checkSnap = await getDoc(doc(db, 'admins', normalized));
      if (checkSnap.exists() && checkSnap.data()?.isBlocked) {
        setErrorMsg('This administrator name has been blocked by Chief Administrator Ngandi Celestin.');
        setIsLoading(false);
        return;
      }

      const adminData = {
        name: adminName.trim(),
        photoUrl: adminPhoto,
        email: adminEmail.trim().toLowerCase(),
        contactNumber: adminContact.trim(),
        createdAt: serverTimestamp(),
      };
      await setDoc(doc(db, 'admins', normalized), adminData);
      onEnterAdmin(adminName.trim(), adminEmail.trim().toLowerCase(), adminContact.trim(), adminPhoto);
    } catch (err: any) {
      console.error("Failed to provision admin:", err);
      // Fallback
      onEnterAdmin(adminName.trim(), adminEmail.trim().toLowerCase(), adminContact.trim(), adminPhoto);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="entrance-gate-parent" className="min-h-screen bg-gradient-to-tr from-[#ede9fe] to-[#e0e7ff] flex items-center justify-center p-6 font-sans">
      <AnimatePresence mode="wait">
        {mode === 'CHOICE' ? (
          <motion.div 
            key="choice"
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -15 }}
            className="w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl p-8 md:p-12 text-center border border-slate-150/10 flex flex-col items-center"
          >
            <div className="w-16 h-16 rounded-[1.25rem] bg-[#2f47b3] text-white flex items-center justify-center font-black text-2xl shadow-xl shadow-blue-900/10 mb-6">
              NC
            </div>
            
            <h2 className="text-3xl font-bold text-slate-900 font-display mb-3 tracking-tight">WELCOME TO NC.edu PORTAL</h2>
            <p className="text-slate-500 text-xs font-semibold leading-relaxed max-w-md mb-10">
              Welcome back! Please select your category block below to sign into courses, coordinate tutoring sessions, or configure community tournaments.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full">
              <button
                onClick={() => setMode('ADMIN_FORM')}
                className="py-6 px-6 rounded-2xl border border-slate-200 hover:border-[#2f47b3] hover:bg-slate-50 text-slate-800 transition-all flex flex-col items-center text-center gap-3.5 cursor-pointer group hover:scale-[1.02] active:scale-98 shadow-sm"
              >
                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-[#2f47b3] flex items-center justify-center group-hover:bg-[#2f47b3] group-hover:text-white transition-colors shadow-inner">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-extrabold text-sm text-slate-900 block">Member of Administration</span>
                  <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">Approve tutors & cast cash rewards tournaments</span>
                </div>
              </button>

              <button
                onClick={onEnterOthers}
                className="py-6 px-6 rounded-2xl border border-slate-200 hover:border-[#2f47b3] hover:bg-slate-50 text-slate-800 transition-all flex flex-col items-center text-center gap-3.5 cursor-pointer group hover:scale-[1.02] active:scale-98 shadow-sm"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-inner">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-extrabold text-sm text-slate-900 block">Others (Student / Tutor)</span>
                  <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">Explore lectures, query AI math solver, join studies</span>
                </div>
              </button>
            </div>
          </motion.div>
        ) : mode === 'ADMIN_FORM' ? (
          <motion.div
            key="login-form"
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -15 }}
            className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-8 md:p-10 border border-slate-100 flex flex-col"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-[#2f47b3] flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 leading-none">Security Gate</h3>
                <p className="text-[11px] text-slate-400 font-bold mt-1.5 uppercase tracking-wider">Administration Entry Validation</p>
              </div>
            </div>

            {showLoginSecurityChallenge ? (
              <form onSubmit={handleSecurityChallengeSubmit} className="space-y-4">
                <div className="p-4 bg-amber-55/70 border border-amber-200 rounded-2xl">
                  <span className="text-xl mr-2">🔒</span>
                  <span className="text-[11px] uppercase tracking-wider font-extrabold text-amber-800">Two-Factor Identity Check</span>
                  <p className="text-[11px] text-slate-500 font-semibold leading-relaxed mt-2">
                    Password verified. To log into as <strong className="text-slate-905">Ngandi Celestin</strong>, please verify your official email address and answer the security question.
                  </p>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 font-bold block mb-1">YOUR EMAIL ADDRESS</label>
                  <input
                    type="email"
                    placeholder="e.g. celestin@domain.com"
                    value={adminEmail}
                    onChange={e => setAdminEmail(e.target.value)}
                    className="w-full border border-slate-200 focus:border-[#2f47b3] focus:bg-white bg-slate-50/50 rounded-xl p-3.5 text-xs font-bold font-sans outline-none"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="text-xs text-amber-900 font-extrabold block mb-2 uppercase tracking-wide">
                    Is top gun the best?
                  </label>
                  <input
                    type="text"
                    placeholder="Enter security answer..."
                    value={securityAnswer}
                    onChange={e => setSecurityAnswer(e.target.value)}
                    className="w-full border border-amber-200 focus:border-[#2f47b3] bg-white rounded-xl p-3 text-xs font-bold font-sans outline-none"
                    required
                    disabled={isLoading}
                  />
                </div>

                {errorMsg && (
                  <div className="text-rose-700 font-black text-xs bg-rose-50 border border-rose-100 rounded-xl p-4 leading-relaxed font-sans shadow-sm">
                    {errorMsg}
                  </div>
                )}

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 py-3.5 bg-amber-600 hover:bg-slate-900 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-md uppercase tracking-wider flex items-center justify-center gap-1.5"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Verifying...
                      </>
                    ) : 'Confirm Access'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMsg('');
                      setShowLoginSecurityChallenge(false);
                    }}
                    disabled={isLoading}
                    className="px-4 py-3.5 bg-slate-100 hover:bg-slate-250 text-slate-500 font-extrabold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Back
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleAdminSubmit} className="space-y-4">
                <div>
                  <label className="text-[10px] text-slate-500 font-bold block mb-1">ADMINISTRATOR FULL NAME</label>
                  <input
                    type="text"
                    placeholder="e.g. Director General Admin"
                    value={adminName}
                    onChange={e => setAdminName(e.target.value)}
                    className="w-full border border-slate-200 focus:border-[#2f47b3] focus:bg-white bg-slate-50/50 rounded-xl p-3.5 text-xs font-bold font-sans outline-none"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 font-bold block mb-1">PROTECTED PASSWORD</label>
                  <input
                    type="password"
                    placeholder="••••••••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full border border-slate-200 focus:border-[#2f47b3] focus:bg-white bg-slate-50/50 rounded-xl p-3.5 text-xs font-bold font-mono outline-none"
                    required
                    disabled={isLoading}
                  />
                </div>

                {errorMsg && (
                  <div className="text-rose-700 font-black text-xs bg-rose-50 border border-rose-100 rounded-xl p-4 leading-relaxed font-sans shadow-sm">
                    {errorMsg}
                  </div>
                )}

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 py-3.5 bg-[#2f47b3] hover:bg-slate-900 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-md uppercase tracking-wider flex items-center justify-center gap-1.5"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Veryfying...
                      </>
                    ) : 'Verify credentials'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMsg('');
                      setMode('CHOICE');
                    }}
                    disabled={isLoading}
                    className="px-4 py-3.5 bg-slate-100 hover:bg-slate-250 text-slate-500 font-extrabold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Back
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="register-form"
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -15 }}
            className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-8 border border-slate-100 flex flex-col"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 leading-none">Register Admin Profile</h3>
                <p className="text-[11px] text-slate-405 font-bold mt-1.5 uppercase tracking-wider">Configure Admin Display Details</p>
              </div>
            </div>

            <div className="text-slate-550 text-xs font-semibold leading-relaxed mb-5 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
              Welcome, <strong className="text-[#2f47b3]">{adminName}</strong>! {adminName.trim().toLowerCase() !== 'ngandi celestin' ? 'As a new administrator, you must register with your email address.' : 'Since this is your first administrative session, please fill out your verification email and answer the security challenge.'}
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] text-slate-500 font-bold block mb-1 uppercase tracking-wide">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. celestin@domain.com"
                  value={adminEmail}
                  onChange={e => setAdminEmail(e.target.value)}
                  className="w-full border border-slate-200 focus:border-[#2f47b3] focus:bg-white bg-slate-50/50 rounded-xl p-3.5 text-xs font-bold font-sans outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 font-bold block mb-1 uppercase tracking-wide">Contact Number / Phone</label>
                <input
                  type="tel"
                  placeholder="e.g. +237 677 88 99 00"
                  value={adminContact}
                  onChange={e => setAdminContact(e.target.value)}
                  className="w-full border border-slate-200 focus:border-[#2f47b3] focus:bg-white bg-slate-50/50 rounded-xl p-3.5 text-xs font-bold font-sans outline-none"
                  required
                />
              </div>

              {adminName.trim().toLowerCase() === 'ngandi celestin' && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                  <label className="text-xs text-amber-900 font-extrabold block mb-2 uppercase tracking-wide">
                    Is top gun the best?
                  </label>
                  <input
                    type="text"
                    placeholder="Enter security answer..."
                    value={securityAnswer}
                    onChange={e => setSecurityAnswer(e.target.value)}
                    className="w-full border border-amber-200 focus:border-[#2f47b3] bg-white rounded-xl p-3 text-xs font-bold font-sans outline-none"
                    required
                  />
                </div>
              )}

              <div>
                <label className="text-[10px] text-slate-500 font-bold block mb-2 uppercase tracking-wide">Select or Capture Account Photo (Optional)</label>
                <PhotoUploader 
                  currentPhotoUrl={adminPhoto} 
                  onPhotoCaptured={(base64) => setAdminPhoto(base64)}
                  onClear={() => setAdminPhoto('')}
                />
              </div>

              {errorMsg && (
                <div className="text-rose-700 font-black text-xs bg-rose-50 border border-rose-100 rounded-xl p-4 leading-relaxed font-sans shadow-sm">
                  {errorMsg}
                </div>
              )}

              <div className="flex gap-2.5 pt-4">
                <button
                  type="button"
                  onClick={handleCreateAccount}
                  disabled={isLoading}
                  className="flex-1 py-3.5 bg-[#2f47b3] hover:bg-slate-900 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-md uppercase tracking-wider flex items-center justify-center gap-1.5"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : "Create Account & Enter"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg('');
                    setMode('ADMIN_FORM');
                  }}
                  disabled={isLoading}
                  className="px-4 py-3.5 bg-slate-100 hover:bg-slate-250 text-slate-500 font-extrabold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Back
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
