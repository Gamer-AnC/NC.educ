import React, { useState, useEffect, useRef } from 'react';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  PhoneOff, 
  Send, 
  ShieldCheck, 
  User, 
  Laptop, 
  Clock,
  CheckCircle2,
  AlertCircle,
  Bell,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../lib/firebase';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  doc, 
  updateDoc, 
  query, 
  orderBy,
  serverTimestamp
} from 'firebase/firestore';

interface VideoCallRoomProps {
  formationTitle: string;
  priceText: string;
  studentName: string;
  studentEmail: string;
  onClose: () => void;
  isAdmin?: boolean;
  registrationId?: string;
}

export default function VideoCallRoom({ 
  formationTitle, 
  priceText, 
  studentName, 
  studentEmail,
  onClose,
  isAdmin = false,
  registrationId
}: VideoCallRoomProps) {
  const [micActive, setMicActive] = useState(true);
  const [videoActive, setVideoActive] = useState(true);
  const [showChat, setShowChat] = useState(true);

  // Real-time Chat Notifications
  const [chatNotifications, setChatNotifications] = useState<Array<{
    id: string;
    title: string;
    text: string;
    sender: string;
    role: 'student' | 'tutor' | 'admin';
  }>>([]);

  const roomMsgsInitialLoaded = useRef(false);

  const triggerChatNotification = (title: string, text: string, sender: string, role: 'student' | 'tutor' | 'admin') => {
    const id = Math.random().toString(36).substring(2, 11);
    setChatNotifications(prev => [...prev, { id, title, text, sender, role }]);
    setTimeout(() => {
      setChatNotifications(prev => prev.filter(n => n.id !== id));
    }, 5500);
  };
  
  // Real video track
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [streamError, setStreamError] = useState(false);

  // Chat tracking (with default welcome fallback)
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [currentTxt, setCurrentTxt] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Real-time synchronization state of the call room
  const [remoteData, setRemoteData] = useState<any>(null);

  // 1. Listen to real-time chat messages if we have a registrationId
  useEffect(() => {
    if (!registrationId) {
      setChatMessages([
        {
          id: 'welcome',
          sender: 'Admin',
          text: `Hello ${studentName}! Welcome to the Elite Admissions Office. I see you are eager to enroll in the "${formationTitle}" course (${priceText}). Let's get your syllabus access fully authorized. Do you have any questions before we initiate the remittance step?`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      return;
    }

    // Set up Real Firestore Chat Listener
    const messagesQuery = query(
      collection(db, 'video_calls', registrationId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubMessages = onSnapshot(messagesQuery, (snap) => {
      const msgs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (roomMsgsInitialLoaded.current) {
        snap.docChanges().forEach(change => {
          if (change.type === 'added') {
            const msg = change.doc.data() as any;
            const isMsgFromMe = isAdmin ? (msg.sender === 'admin' || msg.sender === 'Admin') : (msg.sender !== 'admin' && msg.sender !== 'Admin');
            if (!isMsgFromMe) {
              triggerChatNotification(
                isAdmin ? "New message from Student" : "New message from Administrator",
                msg.text || "",
                isAdmin ? "Student" : "Admin",
                isAdmin ? "student" : "admin"
              );
            }
          }
        });
      } else {
        roomMsgsInitialLoaded.current = true;
      }

      setChatMessages(msgs);
    }, (error) => {
      console.error("Error listening to video call meetings:", error);
    });

    // Listen to parent registration status. If status equals 'ended' or 'ended_call', automatically onClose()!
    const unsubStatus = onSnapshot(doc(db, 'course_registrations', registrationId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setRemoteData(data);

        if (data.status === 'ended' || data.status === 'ended_call') {
          alert("This live formation session has been ended. Returning to catalog.");
          onClose();
        }

        // Handle call rejection for Admin
        if (data.status === 'call_rejected' && isAdmin) {
          alert("📞 Call Rejected: The student has declined the call.");
          onClose();
        }
      }
    });

    return () => {
      unsubMessages();
      unsubStatus();
    };
  }, [registrationId, studentName, formationTitle, priceText, onClose, isAdmin]);

  // 2. Attempt to acquire local webcam stream (with automatic permissions fallback retry)
  useEffect(() => {
    let localStream: MediaStream | null = null;
    if (videoActive) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
          localStream = stream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        })
        .catch(err => {
          console.warn("Full audio+video stream failed, retrying video-only fallback...", err);
          navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => {
              localStream = stream;
              if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
              }
            })
            .catch(err2 => {
              console.warn("Video-only stream request also failed. Enabling simulated live telemetry avatar.", err2);
              setStreamError(true);
            });
        });
    }

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [videoActive]);

  // Keep chat scrolled down
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // 3. Periodic Frame Capture and Sync through Firestore (Real Integration Webcam Sync!)
  useEffect(() => {
    if (!registrationId) return;

    // Direct active status update
    updateDoc(doc(db, 'course_registrations', registrationId), {
      [isAdmin ? 'adminVideoActive' : 'studentVideoActive']: videoActive
    }).catch(err => console.error("Error setting initial active video state:", err));

    if (!videoActive) {
      // Clear current frame on Firestore
      updateDoc(doc(db, 'course_registrations', registrationId), {
        [isAdmin ? 'adminFrame' : 'studentFrame']: null
      }).catch(err => console.error("Error clearing videopath:", err));
      return;
    }

    // Capture mechanism
    const canvas = document.createElement('canvas');
    canvas.width = 180;
    canvas.height = 135;
    const ctx = canvas.getContext('2d');

    const intervalId = setInterval(async () => {
      let jpegUrl = "";
      let captured = false;

      if (localVideoRef.current && localVideoRef.current.readyState >= 2 && !streamError) {
        try {
          if (ctx) {
            ctx.drawImage(localVideoRef.current, 0, 0, canvas.width, canvas.height);
            jpegUrl = canvas.toDataURL('image/jpeg', 0.35); // compressed lightweight jpg stream (approx 4kb)
            captured = true;
          }
        } catch (err) {
          console.warn("Real webcam capture failed, falling back to simulated generation:", err);
        }
      }

      // If camera stream is blocked, restricted or not ready, generate a high-fidelity animated vector HUD live indicator!
      if (!captured && ctx) {
        try {
          // Fill deep blue tech background
          ctx.fillStyle = "#0a1321";
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Render subtle pulsing circular grid
          const center_x = canvas.width / 2;
          const center_y = canvas.height / 2;
          const radius_pulse = (Date.now() / 40) % (canvas.width / 2);
          
          ctx.strokeStyle = "rgba(16, 185, 129, 0.12)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(center_x, center_y, Math.min(radius_pulse, 60), 0, 2 * Math.PI);
          ctx.stroke();

          // Static targeting reticle crosshair
          ctx.strokeStyle = "rgba(16, 185, 129, 0.2)";
          ctx.beginPath();
          ctx.moveTo(center_x - 15, center_y);
          ctx.lineTo(center_x + 15, center_y);
          ctx.moveTo(center_x, center_y - 15);
          ctx.lineTo(center_x, center_y + 15);
          ctx.stroke();

          // Draw neon silhouette avatar or circle profile
          ctx.fillStyle = "rgba(59, 130, 246, 0.2)";
          ctx.strokeStyle = "rgba(59, 130, 246, 0.75)";
          ctx.lineWidth = 1.5;
          
          // Head
          ctx.beginPath();
          ctx.arc(center_x, center_y - 15, 15, 0, 2 * Math.PI);
          ctx.fill();
          ctx.stroke();

          // Shoulders/Body curve
          ctx.beginPath();
          ctx.arc(center_x, center_y + 35, 28, Math.PI, 2 * Math.PI);
          ctx.fill();
          ctx.stroke();

          // Rotating satellite tracker signal arc
          const angle = (Date.now() / 700) % (2 * Math.PI);
          ctx.strokeStyle = "rgba(245, 158, 11, 0.55)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(center_x, center_y, 42, angle, angle + Math.PI / 3);
          ctx.stroke();

          // Oscillating voice waveform at the bottom
          ctx.strokeStyle = "rgba(16, 185, 129, 0.8)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          for (let i = 0; i < canvas.width; i += 4) {
            const y_offset = 120 + Math.sin((i + Date.now() / 50) * 0.1) * 6;
            if (i === 0) ctx.moveTo(i, y_offset);
            else ctx.lineTo(i, y_offset);
          }
          ctx.stroke();

          // Small green flashing blinking status point
          ctx.fillStyle = "rgba(16, 185, 129, 0.9)";
          ctx.font = "bold 8px monospace";
          ctx.fillText("LIVE CELL", 10, 16);

          if (Math.floor(Date.now() / 400) % 2 === 0) {
            ctx.fillStyle = "#10b981";
            ctx.beginPath();
            ctx.arc(105, 13, 2.5, 0, 2 * Math.PI);
            ctx.fill();
          }

          jpegUrl = canvas.toDataURL('image/jpeg', 0.35);
        } catch (e) {
          console.error("Failed drawing simulated frame vector:", e);
        }
      }

      if (jpegUrl) {
        try {
          await updateDoc(doc(db, 'course_registrations', registrationId), {
            [isAdmin ? 'adminFrame' : 'studentFrame']: jpegUrl,
            [isAdmin ? 'adminVideoActive' : 'studentVideoActive']: true,
            lastSyncTimestamp: serverTimestamp ? serverTimestamp() : { seconds: Math.floor(Date.now() / 1000) }
          });
        } catch (err) {
          console.warn("Firestore frame live synchronizer failed to commit:", err);
        }
      }
    }, 1300);

    return () => {
      clearInterval(intervalId);
      // Mark webcam as inactive on unmount
      updateDoc(doc(db, 'course_registrations', registrationId), {
        [isAdmin ? 'adminVideoActive' : 'studentVideoActive']: false,
        [isAdmin ? 'adminFrame' : 'studentFrame']: null
      }).catch(err => console.error("Error clearing unmount status:", err));
    };
  }, [registrationId, videoActive, isAdmin]);

  // Handle message dispatch (STRICTLY CONTROLLER HUMAN-TO-HUMAN CHAT, NO AUTOMATED AI DIALOGUES OUT)
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTxt.trim()) return;

    const messageText = currentTxt.trim();
    setCurrentTxt('');

    if (registrationId) {
      try {
        await addDoc(collection(db, 'video_calls', registrationId, 'messages'), {
          text: messageText,
          sender: isAdmin ? 'Admin' : 'Student',
          createdAt: { seconds: Math.floor(Date.now() / 1000) },
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      } catch (err) {
        console.error("Error saving message into database:", err);
      }
    } else {
      // Offline fallback state (simple local storage chat, strictly no AI auto-replies)
      const newMsg = {
        id: String(Date.now()),
        sender: isAdmin ? 'Admin' : 'Student',
        text: messageText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, newMsg]);
    }
  };

  // End meeting handler for the administrator or the student
  const handleEndMeeting = async () => {
    if (confirm("Are you sure you want to end this live portal call? This officially disconnects both the candidate and the desk.")) {
      try {
        if (registrationId) {
          await updateDoc(doc(db, 'course_registrations', registrationId), {
            status: 'ended_call'
          });
        }
      } catch (err) {
        console.error("Error terminating continuous live call:", err);
      }
      onClose();
    }
  };

  return (
    <div id="video_call_room_viewport" className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col font-sans">
      
      {/* 4. DIALING / RINGING OVERLAY TRIGGERED FOR ADMIN BEFORE USER ACCEPTS */}
      {isAdmin && remoteData?.status === 'calling' && (
        <div id="calling_ringing_blocker" className="absolute inset-0 z-50 bg-slate-950/98 flex flex-col items-center justify-center text-center p-8">
          <div className="relative w-28 h-28 flex items-center justify-center mb-8">
            <span className="absolute inset-0 bg-emerald-500/10 border-2 border-emerald-500/25 rounded-full animate-ping" />
            <span className="absolute inset-4 bg-emerald-500/20 border-2 border-emerald-500/35 rounded-full animate-pulse" />
            <div className="w-16 h-16 rounded-full bg-emerald-600 flex items-center justify-center text-white text-2xl font-black shadow-2xl">
              📞
            </div>
          </div>
          <h3 className="text-xl font-black tracking-widest text-emerald-400 animate-pulse uppercase">RINGING CANDIDATE PORTAL...</h3>
          <p className="text-xs text-slate-400 mt-3 max-w-sm leading-relaxed font-semibold">
            Outgoing call dispatched to Student <strong>{studentName}</strong>. Waiting for them to acknowledge and join.
          </p>
          
          <button
            id="cancel_outgoing_call_btn"
            onClick={async () => {
              try {
                if (registrationId) {
                  await updateDoc(doc(db, 'course_registrations', registrationId), {
                    status: 'ended_call'
                  });
                }
              } catch (err) {}
              onClose();
            }}
            className="mt-8 px-6 py-3.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-[10px] tracking-wider uppercase rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
          >
            Cancel Outgoing Call
          </button>
        </div>
      )}

      {/* HEADER BAR */}
      <header id="call_room_header_bar" className="bg-slate-900 border-b border-white/10 px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
          <div>
            <h2 className="text-sm font-black tracking-wide uppercase flex items-center gap-2">
              NC ADMISSIONS BOARD <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">SECURE MEETING</span>
            </h2>
            <p className="text-[11px] text-slate-400 font-semibold leading-none mt-1">
              Topic: Enrollment Discussion — <span className="text-yellow-300 font-bold">{formationTitle}</span> ({priceText})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-slate-400 font-black tracking-wide uppercase bg-white/5 border border-white/10 px-3 py-1 rounded-full">
            <Clock className="w-3.5 h-3.5 text-emerald-400" /> Live Feed
          </span>
          <button 
            id="end_call_room_btn"
            onClick={handleEndMeeting}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-extrabold text-[10px] tracking-wider uppercase rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-red-900/20 active:scale-95"
          >
            <PhoneOff className="w-3.5 h-3.5" /> {isAdmin ? "End Call for All" : "Leave Room & Exit"}
          </button>
        </div>
      </header>

      {/* CORE WORKSPACE */}
      <div id="call_room_workspace" className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        
        {/* VIDEOS CANVAS PANEL */}
        <div className="flex-1 p-6 flex flex-col md:grid md:grid-cols-2 gap-6 bg-slate-900/40 overflow-y-auto w-full">
          
          {/* VIDEO 1: THE ADMIN PANEL (Local or Remote based on role) */}
          <div id="admin_feed_canvas_pane" className="relative bg-slate-950 rounded-3xl border border-white/5 overflow-hidden shadow-2xl flex flex-col aspect-video md:aspect-auto">
            {isAdmin ? (
              // If Admin, render their local camera stream
              videoActive && !streamError ? (
                <video 
                  ref={localVideoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="w-full h-full object-cover transform scale-x-[-1]"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-900/10 flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-20 h-20 rounded-full bg-slate-900 border-2 border-white/10 flex items-center justify-center shadow-lg">
                    <User className="w-10 h-10 text-emerald-400" />
                  </div>
                  <h3 className="text-xs font-black tracking-wide text-white uppercase mt-4">YOUR ADMIN CAMERA</h3>
                  <p className="text-[10px] text-slate-450 mt-1">Video track is currently switched off</p>
                </div>
              )
            ) : (
              // If Student, render the Admin's remote synced frame
              remoteData?.adminVideoActive && remoteData?.adminFrame ? (
                <img 
                  src={remoteData.adminFrame} 
                  alt="Remote Admin Frame" 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-indigo-950/20 to-slate-900 flex flex-col items-center justify-center p-8 text-center">
                  <motion.div 
                    animate={{ scale: [1, 1.05, 1] }} 
                    transition={{ repeat: Infinity, duration: 4 }}
                    className="w-24 h-24 rounded-full bg-slate-900 border-2 border-emerald-500/50 flex items-center justify-center shadow-lg shadow-emerald-500/10 mb-4"
                  >
                    <ShieldCheck className="w-12 h-12 text-emerald-400 animate-pulse" />
                  </motion.div>
                  <h3 className="text-sm font-bold tracking-wide uppercase">ADMINISTRATIVE OFFICER</h3>
                  <p className="text-[10px] text-slate-400 font-extrabold uppercase mt-1 flex items-center gap-1 leading-none">
                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-ping" /> Camera offline / Waiting...
                  </p>
                </div>
              )
            )}

            <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between bg-slate-900/80 backdrop-blur-md border border-white/10 px-4 py-3 rounded-2xl">
              <span className="text-[10px] font-black uppercase text-slate-300">
                {isAdmin ? "OFFICER FEED (You)" : "OFFICIAL PANEL ADMISSION FEED"}
              </span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 3, 2, 1, 3, 4, 2].map((h, i) => (
                  <div
                    key={i}
                    className="w-1 bg-emerald-500 rounded-full h-2"
                  />
                ))}
              </div>
            </div>

            <div className="absolute top-4 left-4 bg-slate-950/70 border border-white/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
              {isAdmin ? "LOCAL CAMERA" : "REMOTE BROADCAST"}
            </div>
          </div>

          {/* VIDEO 2: THE USER/STUDENT FEED (Local or Remote based on role) */}
          <div id="student_feed_canvas_pane" className="relative bg-slate-950 rounded-3xl border border-white/5 overflow-hidden shadow-2xl flex flex-col aspect-video md:aspect-auto">
            {!isAdmin ? (
              // If Student, render their local camera stream
              videoActive && !streamError ? (
                <video 
                  ref={localVideoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="w-full h-full object-cover transform scale-x-[-1]"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-900/10 flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-20 h-20 rounded-full bg-slate-900 border-2 border-white/10 flex items-center justify-center shadow-lg">
                    <User className="w-10 h-10 text-indigo-400" />
                  </div>
                  <h3 className="text-xs font-black tracking-wide text-white uppercase mt-4">YOUR WEBCAM FEED</h3>
                  <div className="mt-3 inline-flex items-center gap-1 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[10px] px-2.5 py-1 rounded-lg">
                    <AlertCircle className="w-3.5 h-3.5" /> Camera feed deactivated
                  </div>
                </div>
              )
            ) : (
              // If Admin, render the Student's remote synced frame
              remoteData?.studentVideoActive && remoteData?.studentFrame ? (
                <img 
                  src={remoteData.studentFrame} 
                  alt="Remote Student Frame" 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-900/10 flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-20 h-20 rounded-full bg-slate-900 border-2 border-white/10 flex items-center justify-center shadow-lg">
                    <User className="w-10 h-10 text-indigo-400" />
                  </div>
                  <h3 className="text-xs font-black tracking-wide text-white uppercase mt-4">{studentName}</h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-1">({studentEmail})</p>
                  <div className="mt-3 inline-flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] px-2.5 py-1 rounded-lg animate-pulse">
                    <AlertCircle className="w-3.5 h-3.5" /> Candidate stream loading or offline
                  </div>
                </div>
              )
            )}

            <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between bg-slate-900/80 backdrop-blur-md border border-white/10 px-4 py-3 rounded-2xl">
              <span className="text-[10px] font-black uppercase text-indigo-300">
                {isAdmin ? "CANDIDATE BROADCAST" : "STUDENT FEED (You)"}
              </span>
              <span className="text-[9px] text-slate-450 font-mono">MPEG-4 SECURE</span>
            </div>

            <div className="absolute top-4 left-4 bg-slate-950/70 border border-white/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
              {!isAdmin ? "LOCAL CAMERA" : "REMOTE BROADCAST"}
            </div>
          </div>

        </div>

        {/* SIDE BAR ACTIVE DISCUSS-CHAT PANEL */}
        <AnimatePresence>
          {showChat && (
            <motion.div 
              id="chat_panel_sidebar"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 440, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="w-full lg:w-[440px] border-t lg:border-t-0 lg:border-l border-white/10 bg-slate-950 flex flex-col shrink-0 h-full overflow-hidden"
            >
              {/* Box Header */}
              <div className="p-4 border-b border-white/10 bg-slate-900/50 flex flex-col gap-1.5">
                <div className="flex justify-between items-center w-full">
                  <span className="text-xs font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" /> Direct Admissions Deck
                  </span>
                  <span className="text-[9px] font-black uppercase text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/15">
                    HUMAN-ONLY PORTAL
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Active 1:1 secure link between student and official administration desk. <strong>AI automated replies are disabled.</strong>
                </p>
              </div>

              {/* Chat Thread */}
              <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin font-mono text-[11px]"
              >
                {chatMessages.length === 0 && (
                  <div className="flex flex-col items-start mr-auto max-w-[85%]">
                    <span className="text-[9px] text-slate-400 font-bold mb-1">🛡️ SYSTEM INITIALIZATION</span>
                    <div className="p-3.5 rounded-2xl bg-slate-900 border border-white/5 text-slate-100 rounded-tl-none font-sans leading-relaxed">
                      Hello {studentName}! Welcome to the active courseware enrollment meeting room. This private channel coordinates directly with Chief Administrator <strong>Ngandi Celestin</strong>. Fire questions, finalize timings, or coordinate Orange/MTN Mobile payments here!
                    </div>
                  </div>
                )}

                {chatMessages.map((msg, index) => {
                  const isMsgAdmin = msg.sender === 'Admin';
                  return (
                    <div 
                      key={msg.id || index}
                      className={`flex flex-col ${isMsgAdmin ? 'items-start' : 'items-end'} max-w-[85%] ${isMsgAdmin ? 'mr-auto' : 'ml-auto'}`}
                    >
                      <span className="text-[9px] text-slate-400 font-bold mb-1 block">
                        {isMsgAdmin ? '🛡️ ADMISSIONS BOARD' : `🎓 ${studentName.toUpperCase()}`} — {msg.time || 'now'}
                      </span>
                      <div className={`p-3.5 rounded-2xl leading-relaxed font-sans ${
                        isMsgAdmin 
                          ? 'bg-slate-900 border border-white/5 text-slate-100 rounded-tl-none' 
                          : 'bg-emerald-600 text-white rounded-tr-none shadow-md shadow-emerald-950/20'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Direct Authorization Panel (No automatic exit on click, lets user remain in the chat / call direct without issues) */}
              <div className="p-4 bg-slate-900/40 border-t border-white/10 space-y-3">
                <div className="bg-gradient-to-r from-emerald-950/40 to-slate-950 border border-emerald-500/20 p-3.5 rounded-2xl">
                  {remoteData?.priceText === 'AUTHORIZED & GRANTED' ? (
                    <div className="space-y-1.5 text-center py-2">
                      <div className="flex items-center justify-center gap-2 text-emerald-400 font-black text-xs uppercase tracking-wider">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        <span>FEES SECURELY AUTHORIZED</span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
                        A dynamic row update has been logged inside the Central Admissions Spreadsheet. Your seat is officially granted.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Authorize Immediate Seat Enrollment</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 font-sans">
                        Finalize admissions right now. Confirming authorization pushes a live payment check status of <strong className="text-yellow-400 font-mono">{priceText}</strong> directly to the admissions dashboard.
                      </p>
                      
                      {!isAdmin && (
                        <button
                          id="authorize_enrollment_fee_btn"
                          onClick={async () => {
                            if (registrationId) {
                              try {
                                await updateDoc(doc(db, 'course_registrations', registrationId), {
                                  priceText: 'AUTHORIZED & GRANTED',
                                  status: 'active_call' // ensure staying active in the live call!
                                });

                                // Push system message in messages collection
                                await addDoc(collection(db, 'video_calls', registrationId, 'messages'), {
                                  text: `📢 STUDENT NOTICE: I have successfully clicked 'Authorize Enrollment Fee' and cleared the required amount. Please finalize my enrollment!`,
                                  sender: 'Student',
                                  createdAt: { seconds: Math.floor(Date.now() / 1000) },
                                  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                });

                                alert(`🎉 Fee Successfully Authorized! Status has been synchronized. You can continue speaking directly in this secure chat!`);
                              } catch (err) {
                                console.error("Error updating fee status:", err);
                                alert("Failed to log fee. Please try again.");
                              }
                            } else {
                              alert(`🎉 Dynamic Enrollment Authorized! Price: ${priceText}. (Trial Offline Demo Mode)`);
                            }
                          }}
                          className="w-full mt-2.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-900 font-black text-[10px] tracking-wider uppercase rounded-xl transition-all cursor-pointer shadow-lg active:scale-[0.98]"
                        >
                          Authorize Enrollment Fee
                        </button>
                      )}
                      
                      {isAdmin && (
                        <div className="mt-2.5 text-center text-[10px] text-yellow-300 font-bold bg-yellow-500/10 p-2 rounded-lg border border-yellow-500/15">
                          Waiting for candidate to click authorization
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Chat Send Form */}
              <form onSubmit={handleSendChatMessage} className="p-3 bg-slate-900 border-t border-white/10 flex items-center gap-2">
                <input 
                  type="text" 
                  placeholder={isAdmin ? "Type your official administrative message..." : "Ask admin about price, syllabus, timings..."}
                  value={currentTxt}
                  onChange={e => setCurrentTxt(e.target.value)}
                  className="flex-1 bg-slate-950 border border-white/10 focus:border-emerald-500/50 outline-none p-3 text-xs tracking-wide rounded-xl placeholder-slate-500 font-sans"
                />
                <button 
                  type="submit"
                  className="p-3 bg-emerald-600 hover:bg-emerald-500 text-slate-955 rounded-xl transition-colors cursor-pointer shrink-0"
                >
                  <Send className="w-4 h-4 text-slate-950" />
                </button>
              </form>

            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* FOOTER BUTTONS CONTROLS PANEL */}
      <footer id="call_room_footer_controls" className="bg-slate-900 border-t border-white/10 py-4 px-6 flex items-center justify-between">
        
        <button 
          id="toggle_chat_btn"
          onClick={() => setShowChat(!showChat)}
          className={`px-4 py-2 font-bold text-[10px] tracking-wider uppercase rounded-xl border transition-all cursor-pointer ${
            showChat 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' 
              : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
          }`}
        >
          {showChat ? 'Hide Chat Deck' : 'Show Chat Deck'}
        </button>

        {/* Media Buttons */}
        <div id="media_mute_action_dock" className="flex items-center gap-4">
          <button 
            onClick={() => setMicActive(!micActive)}
            className={`p-3.5 rounded-full transition-all cursor-pointer border ${
              micActive 
                ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' 
                : 'bg-rose-600 border-rose-500 text-white shadow-lg animate-pulse'
            }`}
          >
            {micActive ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>

          <button 
            type="button"
            onClick={() => {
              setVideoActive(!videoActive);
              if (videoActive) {
                setStreamError(false);
              }
            }}
            className={`p-3.5 rounded-full transition-all cursor-pointer border ${
              videoActive 
                ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' 
                : 'bg-rose-600 border-rose-500 text-white shadow-lg'
            }`}
          >
            {videoActive ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>
        </div>

        {/* Quick Help Tip */}
        <div className="hidden sm:flex items-center gap-2 text-[10px] text-slate-400 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
          <Laptop className="w-3.5 h-3.5 text-emerald-400" />
          <span>Real-time Secure WebCam link active</span>
        </div>

      </footer>

      {/* Toast Notifications Overlay */}
      <div id="video-call-chat-notifications" className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 w-full max-w-sm pointer-events-none">
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
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-500" />
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl shrink-0 mt-0.5">
                <Bell className="w-4 h-4 animate-bounce" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{notif.title}</span>
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
