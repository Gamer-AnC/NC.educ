import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  MessageSquare, 
  Plus, 
  Search, 
  Send, 
  Hash, 
  Crown, 
  BookOpen, 
  Sparkles, 
  UserCheck, 
  User,
  ArrowRight,
  ArrowLeft,
  Menu,
  ChevronRight,
  Loader2,
  CheckCircle,
  X,
  MessageCircle,
  Calendar,
  AlertCircle,
  Camera,
  Video,
  Paperclip,
  Trash2
} from 'lucide-react';
import { db, auth, onAuthStateChanged } from '../lib/firebase';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  addDoc, 
  getDoc,
  getDocs,
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { Language } from '../constants/translations';

interface StudentChatHubProps {
  userData: any;
  language: Language;
}

export default function StudentChatHub({ userData, language }: StudentChatHubProps) {
  const [currentUid, setCurrentUid] = useState<string | null>(auth.currentUser?.uid || userData?.uid || userData?.id || null);
  const [currentEmail, setCurrentEmail] = useState<string>(auth.currentUser?.email || userData?.email || '');
  const [currentName, setCurrentName] = useState<string>(userData?.name || (auth.currentUser?.email || userData?.email || '').split('@')[0]?.toUpperCase() || 'Student');

  const isPeerPremium = (peer: any) => {
    if (!peer) return false;
    if (peer.subscriptionEndsAt) {
      const endMs = peer.subscriptionEndsAt.seconds 
        ? peer.subscriptionEndsAt.seconds * 1000 
        : new Date(peer.subscriptionEndsAt).getTime();
      if (Date.now() < endMs) return true;
      return false;
    }
    if (peer.trialStartedAt) {
      const startMs = peer.trialStartedAt.seconds 
        ? peer.trialStartedAt.seconds * 1000 
        : new Date(peer.trialStartedAt).getTime();
      if (Date.now() - startMs < 7 * 24 * 60 * 60 * 1000) return true;
      return false;
    }
    if (peer.trialEndsAt) {
      const endMs = peer.trialEndsAt.seconds 
        ? peer.trialEndsAt.seconds * 1000 
        : new Date(peer.trialEndsAt).getTime();
      if (Date.now() < endMs) return true;
      return false;
    }
    return false;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: any) => {
      if (user) {
        setCurrentUid(user.uid);
        setCurrentEmail(user.email || '');
        setCurrentName(userData?.name || user.displayName || user.email?.split('@')?.[0]?.toUpperCase() || 'Student');
      } else if (userData?.uid || userData?.id) {
        setCurrentUid(userData.uid || userData.id);
        setCurrentEmail(userData.email || '');
        setCurrentName(userData.name || userData.email?.split('@')?.[0]?.toUpperCase() || 'Student');
      }
    });
    return () => unsubscribe();
  }, [userData]);

  // Tab: 'private' | 'groups'
  const [hubTab, setHubTab] = useState<'private' | 'groups'>('private');

  // Firebase listings states
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [myPrivateChats, setMyPrivateChats] = useState<any[]>([]);
  const [studyGroups, setStudyGroups] = useState<any[]>([]);
  
  // Search inputs
  const [studentSearch, setStudentSearch] = useState('');
  const [groupSearch, setGroupSearch] = useState('');

  // Active chat state
  const [activeChat, setActiveChat] = useState<{
    id: string;
    type: 'private' | 'group';
    name: string;
    peerEmail?: string;
    description?: string;
    subject?: string;
    creatorId?: string;
    members?: string[];
  } | null>(null);

  // Message flow state
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Modals state
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupSubject, setNewGroupSubject] = useState('Mathematics');
  const [mobileView, setMobileView] = useState<'sidebar' | 'chat'>('sidebar');

  // Group details slide pane
  const [isGroupPanelOpen, setIsGroupPanelOpen] = useState(false);

  // Reset side-panel when changing chats
  useEffect(() => {
    setIsGroupPanelOpen(false);
  }, [activeChat]);

  // Media Capture and Attachment States
  const [isMediaWidgetOpen, setIsMediaWidgetOpen] = useState(false);
  const [mediaCaptureMode, setMediaCaptureMode] = useState<'IDLE' | 'CAMERA_PHOTO' | 'CAMERA_VIDEO'>('IDLE');
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [cameraError, setCameraError] = useState('');

  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<any>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const fileAttachmentInputRef = useRef<HTMLInputElement>(null);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Listen to all students (users collection)
  useEffect(() => {
    const unsubStudents = onSnapshot(collection(db, 'users'), (snap) => {
      try {
        const studentsList = snap.docs.map(doc => {
          try {
            return {
              uid: doc.id,
              ...doc.data()
            };
          } catch (err) {
            console.error("Error parsing user document:", doc.id, err);
            return null;
          }
        })
        .filter((student): student is any => student !== null)
        .filter(student => student.uid !== currentUid);
        
        setAllStudents(studentsList);
      } catch (err) {
        console.error("Error processing students snap:", err);
      }
    }, (error) => {
      console.error("onSnapshot users error:", error);
    });

    return () => unsubStudents();
  }, [currentUid]);

  // 2. Listen to active private chats that involve the current user
  useEffect(() => {
    if (!currentUid) return;
    const qPrivate = query(
      collection(db, 'student_chats'),
      where('participants', 'array-contains', currentUid)
    );

    const unsubPrivateChats = onSnapshot(qPrivate, (snap) => {
      try {
        const chats = snap.docs.map(doc => {
          try {
            const data = doc.data();
            const participants = data.participants || [];
            if (!participants.includes(currentUid)) {
              return null;
            }
            // Determine peer info
            const peerIndex = participants.indexOf(currentUid) === 0 ? 1 : 0;
            const peerUid = participants[peerIndex] || '';
            const peerName = data.participantNames?.[peerIndex] || data.participantEmails?.[peerIndex]?.split('@')?.[0]?.toUpperCase() || 'Student';
            const peerEmail = data.participantEmails?.[peerIndex] || '';
            
            return {
              id: doc.id,
              peerUid,
              peerName,
              peerEmail,
              ...data
            };
          } catch (err) {
            console.error("Error parsing private chat document:", doc.id, err);
            return null;
          }
        })
        .filter((chat): chat is any => chat !== null)
        .sort((a: any, b: any) => {
          const timeA = a.lastMessageAt?.seconds || 0;
          const timeB = b.lastMessageAt?.seconds || 0;
          return timeB - timeA;
        });

        setMyPrivateChats(chats);
      } catch (err) {
        console.error("Error processing private chats snap:", err);
      }
    }, (error) => {
      console.error("onSnapshot private chats error:", error);
    });

    return () => unsubPrivateChats();
  }, [currentUid]);

  // 3. Listen to all study groups
  useEffect(() => {
    const unsubGroups = onSnapshot(collection(db, 'study_groups'), (snap) => {
      try {
        const groups = snap.docs.map(doc => {
          try {
            return {
              id: doc.id,
              ...doc.data()
            };
          } catch (err) {
            console.error("Error parsing study group document:", doc.id, err);
            return null;
          }
        })
        .filter((group): group is any => group !== null)
        .sort((a: any, b: any) => {
          const timeA = a.lastMessageAt?.seconds || 0;
          const timeB = b.lastMessageAt?.seconds || 0;
          return timeB - timeA;
        });
        setStudyGroups(groups);
      } catch (err) {
        console.error("Error processing study groups snap:", err);
      }
    }, (error) => {
      console.error("onSnapshot study groups error:", error);
    });

    return () => unsubGroups();
  }, []);

  // 4. Listen to messages for the active private chat or study group
  useEffect(() => {
    if (!activeChat) {
      setMessages([]);
      return;
    }

    const messagesColPath = activeChat.type === 'private' 
      ? `student_chats/${activeChat.id}/messages`
      : `study_groups/${activeChat.id}/messages`;

    const qMessages = query(
      collection(db, messagesColPath)
    );

    const unsubMessages = onSnapshot(qMessages, (snap) => {
      const msgs = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Sort client-side safely, handling null or missing createdAt timestamps
      msgs.sort((a: any, b: any) => {
        const getMs = (item: any) => {
          if (!item || !item.createdAt) return Date.now();
          if (typeof item.createdAt.toMillis === 'function') return item.createdAt.toMillis();
          if (typeof item.createdAt.seconds === 'number') return item.createdAt.seconds * 1000;
          if (typeof item.createdAt === 'number') return item.createdAt;
          if (typeof item.createdAt === 'string') {
            const parsed = new Date(item.createdAt).getTime();
            if (!isNaN(parsed)) return parsed;
          }
          return Date.now();
        };
        return getMs(a) - getMs(b);
      });

      setMessages(msgs);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }, (err) => {
      console.error("Failed to fetch messages:", err);
    });

    return () => unsubMessages();
  }, [activeChat]);

  // Handle opening a private chat deterministically
  const handleStartPrivateChat = async (peer: any) => {
    if (!currentUid || !peer.uid) return;
    
    // Deterministic Chat ID to prevent duplicates
    const sortedUids = [currentUid, peer.uid].sort();
    const chatId = `chat_${sortedUids[0]}_${sortedUids[1]}`;
    
    const chatDocRef = doc(db, 'student_chats', chatId);
    const chatSnap = await getDoc(chatDocRef);

    const peerName = peer.name || peer.email?.split('@')[0]?.toUpperCase() || 'Student';
    const peerEmail = peer.email || '';

    if (!chatSnap.exists()) {
      // Create new private chat document
      await setDoc(chatDocRef, {
        participants: sortedUids,
        participantNames: [
          sortedUids[0] === currentUid ? currentName : peerName,
          sortedUids[1] === currentUid ? currentName : peerName
        ],
        participantEmails: [
          sortedUids[0] === currentUid ? currentEmail : peerEmail,
          sortedUids[1] === currentUid ? currentEmail : peerEmail
        ],
        lastMessage: 'Chat started',
        lastMessageAt: serverTimestamp(),
        createdAt: serverTimestamp()
      });
    }

    setActiveChat({
      id: chatId,
      type: 'private',
      name: peerName,
      peerEmail: peerEmail
    });
    setHubTab('private');
    setMobileView('chat');
  };

  // Handle joining a study group
  const handleJoinGroup = async (groupId: string) => {
    if (!currentUid) return;
    try {
      const groupRef = doc(db, 'study_groups', groupId);
      await updateDoc(groupRef, {
        members: arrayUnion(currentUid)
      });
      
      // Select the group active chat after joining
      const groupSnap = await getDoc(groupRef);
      if (groupSnap.exists()) {
        const data = groupSnap.data();
        setActiveChat({
          id: groupId,
          type: 'group',
          name: data.name,
          description: data.description,
          subject: data.subject,
          creatorId: data.creatorId,
          members: data.members || []
        });
        setMobileView('chat');
      }
    } catch (err) {
      console.error("Failed to join study group:", err);
    }
  };

  // Handle leaving a study group
  const handleLeaveGroup = async (groupId: string) => {
    if (!currentUid) return;
    try {
      const groupRef = doc(db, 'study_groups', groupId);
      await updateDoc(groupRef, {
        members: arrayRemove(currentUid)
      });
      if (activeChat?.id === groupId) {
        setActiveChat(null);
      }
    } catch (err) {
      console.error("Failed to leave group:", err);
    }
  };

  // Helper to check if current user created a study group or has admin rights
  const isGroupCreator = (group: any) => {
    if (!group) return false;
    const uidMatches = group.creatorId && (
      group.creatorId === currentUid ||
      group.creatorId === auth.currentUser?.uid ||
      group.creatorId === userData?.uid ||
      group.creatorId === userData?.id ||
      group.creatorId === userData?.studentId
    );
    const emailMatches = group.creatorEmail && (
      (currentEmail && group.creatorEmail.toLowerCase() === currentEmail.toLowerCase()) ||
      (auth.currentUser?.email && group.creatorEmail.toLowerCase() === auth.currentUser.email.toLowerCase()) ||
      (userData?.email && group.creatorEmail.toLowerCase() === userData.email.toLowerCase())
    );
    const nameMatches = group.creatorName && currentName && group.creatorName === currentName;
    const isAdmin = userData?.role === 'admin' || userData?.isAdmin || userData?.role === 'ADMIN';
    return Boolean(uidMatches || emailMatches || nameMatches || isAdmin);
  };

  // Handle creating a new study group
  const handleCreateGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim() || !currentUid) return;

    try {
      const newGroupData = {
        name: newGroupName.trim(),
        description: newGroupDesc.trim(),
        subject: newGroupSubject,
        creatorId: currentUid || auth.currentUser?.uid || userData?.uid || userData?.id || userData?.studentId || 'student-creator',
        creatorEmail: currentEmail || auth.currentUser?.email || userData?.email || '',
        creatorName: currentName || userData?.name || 'Student',
        members: [currentUid || auth.currentUser?.uid || userData?.uid || userData?.id || userData?.studentId],
        lastMessage: 'Study Group created!',
        lastMessageAt: serverTimestamp(),
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'study_groups'), newGroupData);

      // Reset form states
      setNewGroupName('');
      setNewGroupDesc('');
      setIsCreateGroupOpen(false);

      // Set newly created group as the active chat
      setActiveChat({
        id: docRef.id,
        type: 'group',
        name: newGroupData.name,
        description: newGroupData.description,
        subject: newGroupData.subject,
        creatorId: newGroupData.creatorId,
        members: newGroupData.members
      });
      setMobileView('chat');
    } catch (err) {
      console.error("Failed to create study group:", err);
    }
  };

  // Delete the study group
  const handleDeleteGroup = async (groupId: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this study group? All messages will be lost.")) return;
    try {
      await deleteDoc(doc(db, 'study_groups', groupId));
      setActiveChat(null);
      setIsGroupPanelOpen(false);
    } catch (err) {
      console.error("Failed to delete study group:", err);
    }
  };

  // Remove a member from group
  const handleRemoveMember = async (groupId: string, memberId: string) => {
    try {
      const groupRef = doc(db, 'study_groups', groupId);
      await updateDoc(groupRef, {
        members: arrayRemove(memberId)
      });
    } catch (err) {
      console.error("Failed to remove member:", err);
    }
  };

  // Add a member to group
  const handleAddMember = async (groupId: string, memberId: string) => {
    try {
      const groupRef = doc(db, 'study_groups', groupId);
      await updateDoc(groupRef, {
        members: arrayUnion(memberId)
      });
    } catch (err) {
      console.error("Failed to add member:", err);
    }
  };

  // Camera and recording handlers
  const startLiveCamera = async (mode: 'photo' | 'video') => {
    setCameraError('');
    setMediaCaptureMode(mode === 'photo' ? 'CAMERA_PHOTO' : 'CAMERA_VIDEO');
    setMediaPreview(null);
    setMediaType(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 320, height: 240 },
        audio: mode === 'video'
      });
      setCameraStream(stream);
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera capture failed:", err);
      setCameraError("Camera access denied or unavailable.");
      setMediaCaptureMode('IDLE');
    }
  };

  const stopLiveCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setMediaCaptureMode('IDLE');
    setIsRecording(false);
  };

  const capturePhotoFrame = () => {
    if (videoPreviewRef.current) {
      const video = videoPreviewRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 320;
      canvas.height = video.videoHeight || 240;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1); // Mirror correction
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setMediaPreview(dataUrl);
        setMediaType('image');
      }
      stopLiveCamera();
    }
  };

  const startRecordingVideo = () => {
    if (!cameraStream) return;
    recordedChunksRef.current = [];
    let recorder;
    try {
      recorder = new MediaRecorder(cameraStream);
    } catch (e) {
      try {
        recorder = new MediaRecorder(cameraStream, { mimeType: 'video/webm' });
      } catch (e2) {
        recorder = new MediaRecorder(cameraStream);
      }
    }

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      const reader = new FileReader();
      reader.onloadend = () => {
         if (typeof reader.result === 'string') {
           setMediaPreview(reader.result);
           setMediaType('video');
         }
      };
      reader.readAsDataURL(blob);
    };

    mediaRecorderRef.current = recorder;
    recorder.start();
    setIsRecording(true);
  };

  const stopRecordingVideo = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      stopLiveCamera();
    }
  };

  const handleAttachFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1500000) {
        alert("For seamless database speed, please share media under 1.5MB.");
        return;
      }
      const isVideo = file.type.startsWith('video/');
      const isImage = file.type.startsWith('image/');
      
      if (!isImage && !isVideo) {
        alert("Please select a valid image or video file.");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setMediaPreview(reader.result);
          setMediaType(isVideo ? 'video' : 'image');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle sending a message (including photos and videos)
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChat || !currentUid) return;
    if (!newMessageText.trim() && !mediaPreview) return;

    setIsSending(true);
    const textToSend = newMessageText.trim();
    setNewMessageText('');

    try {
      const messagesColPath = activeChat.type === 'private'
        ? `student_chats/${activeChat.id}/messages`
        : `study_groups/${activeChat.id}/messages`;

      const chatDocPath = activeChat.type === 'private'
        ? `student_chats/${activeChat.id}`
        : `study_groups/${activeChat.id}`;

      const messageDoc: any = {
        senderId: currentUid || auth.currentUser?.uid || userData?.uid || userData?.id || userData?.studentId || 'unknown-student',
        senderEmail: currentEmail || auth.currentUser?.email || userData?.email || '',
        senderName: currentName || userData?.name || 'Student',
        text: textToSend || (mediaType === 'image' ? '📷 Photo attachment shared' : '🎥 Video attachment shared'),
        createdAt: serverTimestamp()
      };

      if (mediaPreview) {
        messageDoc.mediaUrl = mediaPreview;
        messageDoc.mediaType = mediaType;
      }

      // 1. Add message sub-document
      await addDoc(collection(db, messagesColPath), messageDoc);

      // 2. Update parent chat preview state
      await updateDoc(doc(db, chatDocPath), {
        lastMessage: textToSend || (mediaType === 'image' ? '📷 Photo attachment shared' : '🎥 Video attachment shared'),
        lastMessageAt: serverTimestamp()
      });

      // Reset media preview states
      setMediaPreview(null);
      setMediaType(null);
      setIsMediaWidgetOpen(false);
      setIsSending(false);
    } catch (err) {
      console.error("Failed to send message:", err);
      setIsSending(false);
    }
  };

  // Format timestamp helper
  const formatMsgTime = (ts: any) => {
    if (!ts) return 'Just now';
    try {
      let date: Date;
      if (typeof ts.toDate === 'function') {
        date = ts.toDate();
      } else if (ts && typeof ts === 'object' && 'seconds' in ts) {
        date = new Date(ts.seconds * 1000);
      } else {
        date = new Date(ts);
      }
      if (isNaN(date.getTime())) {
        return 'Just now';
      }
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (err) {
      console.error("Error formatting timestamp:", err);
      return 'Just now';
    }
  };

  // Filter lists based on search inputs
  const filteredStudents = allStudents.filter(student => {
    const queryStr = studentSearch.toLowerCase();
    const nameStr = (student.name || '').toLowerCase();
    const emailStr = (student.email || '').toLowerCase();
    const idStr = String(student.studentId || '').toLowerCase();
    return nameStr.includes(queryStr) || emailStr.includes(queryStr) || idStr.includes(queryStr);
  });

  const filteredGroups = studyGroups.filter(group => {
    const queryStr = groupSearch.toLowerCase();
    const nameStr = (group.name || '').toLowerCase();
    const descStr = (group.description || '').toLowerCase();
    const subjStr = (group.subject || '').toLowerCase();
    return nameStr.includes(queryStr) || descStr.includes(queryStr) || subjStr.includes(queryStr);
  });

  return (
    <div id="student-chat-collaboration-hub" className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-blue-900/5 overflow-hidden flex flex-col h-[700px] md:h-[650px] font-sans">
      
      {/* Top Banner & Hub Controls */}
      <div className="p-6 md:p-8 bg-gradient-to-r from-blue-600 via-indigo-600 to-[#800080] text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-white/20 text-[9px] font-black rounded-lg uppercase tracking-wider text-white border border-white/25">
              Live Collaboration
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-blue-100 font-bold">Peer Exchange Active</span>
          </div>
          <h2 className="text-2xl font-black font-display mt-1">Student Social & Study Groups Hub</h2>
          <p className="text-blue-100/80 text-xs mt-0.5 font-medium">
            Connect instantly with available peer students, launch study groups, and collaborate in real-time.
          </p>
        </div>

        {/* Action Button to launch study group creation */}
        <button
          onClick={() => setIsCreateGroupOpen(true)}
          className="px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" /> Create Study Group
        </button>
      </div>

      {/* Main Core View Area */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        
        {/* Left Sidebar Pane: Directories and chats */}
        <div className={`w-full md:w-80 border-r border-slate-100 flex flex-col shrink-0 bg-slate-50/50 ${mobileView === 'sidebar' ? 'flex' : 'hidden md:flex'}`}>
          
          {/* Sub Tab Controls */}
          <div className="p-3 bg-white border-b border-slate-100 flex gap-2">
            <button
              onClick={() => setHubTab('private')}
              className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                hubTab === 'private'
                  ? 'bg-indigo-50 text-indigo-700 shadow-xs'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" /> Private Chats
            </button>
            <button
              onClick={() => setHubTab('groups')}
              className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                hubTab === 'groups'
                  ? 'bg-[#800080]/10 text-[#800080] shadow-xs'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              <Users className="w-3.5 h-3.5" /> Study Groups
            </button>
          </div>

          {/* Directory Listings inside Sidebar */}
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            
            {/* Tab 1: Private Chats Directory */}
            {hubTab === 'private' && (
              <div className="space-y-3">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search available students..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-bold outline-none focus:border-indigo-500 transition-all placeholder:text-slate-400"
                  />
                </div>

                {/* Active ongoing private chats list */}
                {myPrivateChats.length > 0 && !studentSearch && (
                  <div>
                    <span className="text-[9px] text-indigo-600 font-black uppercase tracking-wider block mb-2 px-1">
                      Active Conversations
                    </span>
                    <div className="space-y-1">
                      {myPrivateChats.map((chat) => {
                        const isActive = activeChat?.id === chat.id;
                        return (
                          <button
                            key={chat.id}
                            onClick={() => {
                              setActiveChat({
                                id: chat.id,
                                type: 'private',
                                name: chat.peerName,
                                peerEmail: chat.peerEmail
                              });
                              setMobileView('chat');
                            }}
                            className={`w-full text-left p-3 rounded-xl transition-all border flex items-center justify-between gap-3 cursor-pointer ${
                              isActive 
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' 
                                : 'bg-white border-slate-100 hover:bg-slate-50 text-slate-800'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black uppercase ${
                                isActive ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-700'
                              }`}>
                                {(chat.peerName || 'Student').charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-xs font-black truncate">{chat.peerName}</h4>
                                <p className={`text-[10px] truncate ${isActive ? 'text-indigo-200' : 'text-slate-500 font-medium'}`}>
                                  {chat.lastMessage || 'Open chat'}
                                </p>
                              </div>
                            </div>
                            <ChevronRight className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-350'}`} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Available Students to chat with */}
                <div>
                  <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block mb-2 px-1">
                    {studentSearch ? 'Search Results' : 'Available Peer Students'}
                  </span>
                  
                  {filteredStudents.length === 0 ? (
                    <div className="p-4 text-center text-xs font-semibold text-slate-400 bg-white rounded-xl border border-slate-100">
                      No other peer students found.
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {filteredStudents.map((peer) => {
                        const peerName = peer.name || peer.email?.split('@')[0]?.toUpperCase() || 'Student';
                        return (
                          <button
                            key={peer.uid}
                            onClick={() => handleStartPrivateChat(peer)}
                            className="w-full text-left p-3 rounded-xl bg-white hover:bg-indigo-50/50 border border-slate-100 hover:border-indigo-150 transition-all flex items-center justify-between gap-3 cursor-pointer group"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[11px] font-black uppercase shrink-0 group-hover:bg-indigo-100 group-hover:text-indigo-700 transition-colors">
                                {peer.photoUrl ? (
                                  <img src={peer.photoUrl} alt={peerName} className="w-full h-full rounded-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                  peerName.charAt(0)
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <h4 className="text-xs font-extrabold text-slate-800 group-hover:text-indigo-700 truncate transition-colors">
                                    {peerName}
                                  </h4>
                                  {isPeerPremium(peer) && (
                                    <Crown className="w-3 h-3 text-amber-500 fill-amber-400" />
                                  )}
                                </div>
                                <p className="text-[9px] text-slate-500 font-bold truncate">
                                  ID: STU-{peer.studentId || '9403'} • {peer.points || 0} PTS
                                </p>
                              </div>
                            </div>
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[8px] font-black rounded-md tracking-wider uppercase group-hover:scale-105 transition-transform">
                              Chat
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* Tab 2: Study Groups Directory */}
            {hubTab === 'groups' && (
              <div className="space-y-3">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search study groups..."
                    value={groupSearch}
                    onChange={(e) => setGroupSearch(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-bold outline-none focus:border-[#800080] transition-all placeholder:text-slate-400"
                  />
                </div>

                {/* List of Joined and Available Study Groups */}
                <div className="space-y-3">
                  <span className="text-[9px] text-[#800080] font-black uppercase tracking-wider block px-1">
                    Active Study Groups
                  </span>

                  {filteredGroups.length === 0 ? (
                    <div className="p-4 text-center text-xs font-semibold text-slate-400 bg-white rounded-xl border border-slate-100">
                      No study groups available. Launch one!
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {filteredGroups.map((group) => {
                        const isMember = group.members?.includes(currentUid);
                        const isActive = activeChat?.id === group.id;
                        return (
                          <div 
                            key={group.id}
                            className={`p-3 rounded-xl border transition-all ${
                              isActive 
                                ? 'bg-gradient-to-br from-indigo-550 to-[#800080] text-white border-[#800080] shadow-sm' 
                                : 'bg-white border-slate-100 text-slate-800'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className={`text-[8px] px-1.5 py-0.5 rounded font-black uppercase ${
                                    isActive ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-700'
                                  }`}>
                                    {group.subject}
                                  </span>
                                  <span className={`text-[8px] font-bold ${isActive ? 'text-indigo-200' : 'text-slate-400'}`}>
                                    {group.members?.length || 1} members
                                  </span>
                                </div>
                                <h4 className="text-xs font-black mt-1 truncate">{group.name}</h4>
                                <p className={`text-[10px] mt-0.5 leading-normal ${isActive ? 'text-indigo-100' : 'text-slate-500 font-medium'}`}>
                                  {group.description || 'No description provided.'}
                                </p>
                              </div>
                            </div>

                            {/* Join / Leave / Delete / Enter chat control row */}
                            <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-slate-100/50">
                              <span className={`text-[8px] font-bold ${isActive ? 'text-purple-200' : 'text-slate-400'}`}>
                                Creator: {group.creatorName}
                              </span>

                              <div className="flex items-center gap-1.5 shrink-0">
                                {isGroupCreator(group) && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteGroup(group.id);
                                    }}
                                    className="p-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-md border border-rose-200 transition-all cursor-pointer"
                                    title="Delete group permanently"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}

                                {isMember ? (
                                  <div className="flex gap-1.5 shrink-0">
                                    {isActive ? (
                                      <button
                                        onClick={() => handleLeaveGroup(group.id)}
                                        className="px-2 py-1 bg-white/10 hover:bg-white/20 text-white text-[9px] font-black uppercase rounded-lg transition-all cursor-pointer"
                                      >
                                        Leave
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => {
                                          setActiveChat({
                                            id: group.id,
                                            type: 'group',
                                            name: group.name,
                                            description: group.description,
                                            subject: group.subject,
                                            creatorId: group.creatorId,
                                            members: group.members
                                          });
                                          setMobileView('chat');
                                        }}
                                        className="px-2.5 py-1 bg-[#800080] text-white hover:bg-slate-900 text-[9px] font-black uppercase rounded-lg transition-all cursor-pointer"
                                      >
                                        Open Chat
                                      </button>
                                    )}
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => handleJoinGroup(group.id)}
                                    className="px-3 py-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-[9px] font-black uppercase rounded-lg shadow-sm transition-all active:scale-95 cursor-pointer"
                                  >
                                    Join Group
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            )}

          </div>

        </div>

        {/* Right Active Conversation Pane */}
        <div className={`flex-1 flex flex-col min-w-0 bg-white ${mobileView === 'chat' ? 'flex' : 'hidden md:flex'}`}>
          
          {activeChat ? (
            /* ACTIVE CHAT MAIN WRAPPER */
            <div className="flex-1 flex flex-col min-h-0 relative">
              
              {/* Chat Panel Header */}
              <div className="p-4 bg-slate-50 border-b border-slate-150/70 flex items-center justify-between gap-4 shrink-0">
                <div className="min-w-0 flex items-center gap-2">
                  <button
                    onClick={() => {
                      setMobileView('sidebar');
                      setActiveChat(null);
                    }}
                    className="md:hidden p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg shrink-0 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${activeChat.type === 'private' ? 'bg-emerald-500' : 'bg-[#800080]'}`} />
                      <h4 className="text-sm font-black text-slate-800 truncate">
                        {activeChat.name}
                      </h4>
                    </div>
                  {activeChat.type === 'group' ? (
                    <p className="text-[10px] text-slate-500 font-semibold truncate mt-0.5">
                      Subject: <strong>{activeChat.subject}</strong> • {activeChat.description}
                    </p>
                  ) : (
                    <p className="text-[10px] text-indigo-600 font-semibold truncate mt-0.5">
                      Direct Student Chat • {activeChat.peerEmail}
                    </p>
                  )}
                </div>
              </div>

                {/* Additional Chat metadata action controls */}
                <div className="flex items-center gap-2 shrink-0">
                  {activeChat.type === 'group' && (
                    <button
                      type="button"
                      onClick={() => setIsGroupPanelOpen(!isGroupPanelOpen)}
                      className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border flex items-center gap-1.5 cursor-pointer ${
                        isGroupPanelOpen 
                          ? 'bg-purple-100 text-[#800080] border-[#800080]/30' 
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Group Workspace</span>
                    </button>
                  )}
                  {activeChat.type === 'group' && isGroupCreator(activeChat) && (
                    <button
                      onClick={() => handleDeleteGroup(activeChat.id)}
                      className="px-2.5 py-1.5 border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete Group</span>
                    </button>
                  )}
                  {activeChat.type === 'group' && !isGroupCreator(activeChat) && activeChat.members?.includes(currentUid || '') && (
                    <button
                      onClick={() => handleLeaveGroup(activeChat.id)}
                      className="px-2.5 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                    >
                      Leave Group
                    </button>
                  )}
                  <button
                    onClick={() => setActiveChat(null)}
                    className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
                    title="Close Chat"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Chat view body with optional sidebar */}
              <div className="flex-1 flex flex-row min-h-0 overflow-hidden relative">
                
                {/* Left Column: Chat stream & input */}
                <div className="flex-1 flex flex-col min-h-0 min-w-0 bg-white">
                  
                  {/* Message Streams List */}
                  <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/20 custom-scrollbar flex flex-col">
                    {messages.length === 0 ? (
                      <div className="m-auto text-center py-10 max-w-sm px-4">
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                          <MessageCircle className="w-6 h-6 animate-pulse" />
                        </div>
                        <span className="text-[9px] font-black text-indigo-900 uppercase bg-indigo-50 px-2.5 py-1 rounded-md">
                          Encrypted Channel Live
                        </span>
                        <p className="text-[11px] text-slate-500 font-bold leading-relaxed mt-3">
                          This is the beginning of your live collaboration message stream. Send suggestions, questions, equations or share live camera memories below.
                        </p>
                      </div>
                    ) : (
                      messages.map((msg, index) => {
                        const isMe = Boolean(
                          (msg.senderId && (
                            msg.senderId === currentUid ||
                            msg.senderId === auth.currentUser?.uid ||
                            msg.senderId === userData?.uid ||
                            msg.senderId === userData?.id ||
                            msg.senderId === userData?.studentId
                          )) ||
                          (msg.senderEmail && currentEmail && msg.senderEmail.toLowerCase() === currentEmail.toLowerCase()) ||
                          (msg.senderEmail && auth.currentUser?.email && msg.senderEmail.toLowerCase() === auth.currentUser.email.toLowerCase()) ||
                          (msg.senderName && currentName && msg.senderName === currentName)
                        );
                        return (
                          <div 
                            key={`chat-msg-${msg.id || index}-${index}`}
                            className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                          >
                            <div className={`max-w-[80%] rounded-2xl p-3 px-4 text-xs font-bold leading-relaxed shadow-xs ${
                              isMe
                                ? 'bg-gradient-to-r from-blue-650 to-indigo-650 text-white rounded-tr-none'
                                : 'bg-white border border-slate-150 text-slate-800 rounded-tl-none'
                            }`}>
                              
                              {/* Sender identity banner (only for group chats and other people) */}
                              {!isMe && (
                                <span className="text-[9px] text-[#800080] font-black uppercase tracking-wider block mb-1">
                                  {msg.senderName}
                                </span>
                              )}

                              {/* Media attachments rendering */}
                              {msg.mediaUrl && (
                                <div className="mb-2 max-w-xs overflow-hidden rounded-xl border border-slate-100/50 shadow-sm bg-black/5">
                                  {msg.mediaType === 'video' ? (
                                    <video 
                                      src={msg.mediaUrl} 
                                      controls 
                                      className="w-full max-h-48 object-contain rounded-xl"
                                      playsInline
                                    />
                                  ) : (
                                    <img 
                                      src={msg.mediaUrl} 
                                      alt="Attachment" 
                                      className="w-full max-h-48 object-cover rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                                      onClick={() => window.open(msg.mediaUrl, '_blank')}
                                      referrerPolicy="no-referrer"
                                    />
                                  )}
                                </div>
                              )}

                              <p className="whitespace-pre-wrap">{msg.text}</p>
                              
                              <span className={`text-[8px] mt-1 text-right block font-normal opacity-70 ${
                                isMe ? 'text-blue-100' : 'text-slate-400'
                              }`}>
                                {formatMsgTime(msg.createdAt)}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Media Widget panel inside chat input area */}
                  {isMediaWidgetOpen && (
                    <div className="p-3 bg-slate-50 border-t border-slate-150 space-y-3 shrink-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => startLiveCamera('photo')}
                            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-extrabold uppercase tracking-wide flex items-center gap-1 cursor-pointer"
                          >
                            <Camera className="w-3.5 h-3.5" /> Take Photo
                          </button>
                          <button
                            type="button"
                            onClick={() => startLiveCamera('video')}
                            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-extrabold uppercase tracking-wide flex items-center gap-1 cursor-pointer"
                          >
                            <Video className="w-3.5 h-3.5" /> Record Video
                          </button>
                          <button
                            type="button"
                            onClick={() => fileAttachmentInputRef.current?.click()}
                            className="px-3 py-1.5 bg-slate-150 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-extrabold uppercase tracking-wide flex items-center gap-1 cursor-pointer"
                          >
                            <Paperclip className="w-3.5 h-3.5" /> Upload File
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            stopLiveCamera();
                            setMediaPreview(null);
                            setMediaType(null);
                            setIsMediaWidgetOpen(false);
                          }}
                          className="text-[10px] text-slate-400 hover:text-slate-655 font-black uppercase tracking-wide cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>

                      {/* Hidden file selector input */}
                      <input
                        type="file"
                        ref={fileAttachmentInputRef}
                        onChange={handleAttachFileChange}
                        accept="image/*,video/*"
                        className="hidden"
                      />

                      {/* Video capture / live camera stream screen */}
                      {mediaCaptureMode !== 'IDLE' && (
                        <div className="p-2.5 bg-slate-900 rounded-2xl flex flex-col items-center justify-center gap-3 relative max-w-sm mx-auto shadow-md">
                          <video
                            ref={videoPreviewRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full max-h-48 rounded-xl object-cover bg-black"
                          />
                          {cameraError && <p className="text-[10px] text-rose-400 font-bold">{cameraError}</p>}
                          
                          <div className="flex gap-2 z-10">
                            {mediaCaptureMode === 'CAMERA_PHOTO' ? (
                              <button
                                type="button"
                                onClick={capturePhotoFrame}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer"
                              >
                                Capture Photo
                              </button>
                            ) : (
                              <>
                                {!isRecording ? (
                                  <button
                                    type="button"
                                    onClick={startRecordingVideo}
                                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1 animate-pulse cursor-pointer"
                                  >
                                    ● Start Video
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={stopRecordingVideo}
                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-rose-700 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer"
                                  >
                                    ■ Finish Recording
                                  </button>
                                )}
                              </>
                            )}
                            <button
                              type="button"
                              onClick={stopLiveCamera}
                              className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer"
                            >
                              Close Camera
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Captured / Selected Attachment Thumbnail */}
                      {mediaPreview && (
                        <div className="p-2 bg-white rounded-xl border border-slate-200 max-w-xs relative group flex flex-col gap-1.5 shadow-sm">
                          <div className="text-[9px] font-extrabold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-wider w-max">
                            Selected {mediaType} Attachment
                          </div>
                          {mediaType === 'video' ? (
                            <video
                              src={mediaPreview}
                              controls
                              className="w-full max-h-36 object-contain rounded-lg"
                            />
                          ) : (
                            <img
                              src={mediaPreview}
                              alt="Attachment preview"
                              className="w-full max-h-36 object-cover rounded-lg"
                              referrerPolicy="no-referrer"
                            />
                          )}
                          <div className="absolute top-1.5 right-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setMediaPreview(null);
                                setMediaType(null);
                              }}
                              className="p-1 bg-rose-600 hover:bg-rose-700 text-white rounded-full shadow-md transition-all cursor-pointer"
                              title="Delete Attachment"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Chat Input form */}
                  <form 
                    onSubmit={handleSendMessage}
                    className="p-3 bg-slate-50 border-t border-slate-150 flex items-center gap-2 shrink-0"
                  >
                    <button
                      type="button"
                      onClick={() => setIsMediaWidgetOpen(!isMediaWidgetOpen)}
                      className={`p-2.5 rounded-xl transition-all shrink-0 cursor-pointer border ${
                        isMediaWidgetOpen 
                          ? 'bg-purple-150 text-[#800080] border-[#800080]/30' 
                          : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-500 hover:text-slate-700'
                      }`}
                      title="Attach Photo or Video"
                    >
                      <Camera className="w-4 h-4" />
                    </button>

                    <input
                      type="text"
                      placeholder={activeChat.type === 'private' ? `Type a direct message to ${activeChat.name}...` : `Type a group message inside ${activeChat.name}...`}
                      value={newMessageText}
                      onChange={(e) => setNewMessageText(e.target.value)}
                      className="flex-1 bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs font-bold outline-none transition-all placeholder:text-slate-400"
                    />
                    <button
                      type="submit"
                      disabled={isSending || (!newMessageText.trim() && !mediaPreview)}
                      className="p-2.5 bg-indigo-600 hover:bg-slate-900 text-white rounded-xl transition-all disabled:opacity-50 disabled:bg-slate-100 disabled:text-slate-400 cursor-pointer shadow-md active:scale-95 shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>

                {/* Sidebar Column: Group Workspace Panel */}
                {isGroupPanelOpen && activeChat.type === 'group' && (() => {
                  const currentGroupData = studyGroups.find(g => g.id === activeChat.id);
                  if (!currentGroupData) {
                    return (
                      <div className="w-80 border-l border-slate-150 bg-white h-full flex flex-col items-center justify-center p-4 shrink-0">
                        <Loader2 className="w-5 h-5 animate-spin text-indigo-600 mb-2" />
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Loading Group Info...</span>
                      </div>
                    );
                  }
                  
                  // Construct unified members details list
                  const getGroupMembers = () => {
                    const membersList: any[] = [];
                    
                    // Add ourselves first if we are in the group
                    if (currentGroupData.members?.includes(currentUid)) {
                      membersList.push({
                        uid: currentUid,
                        name: currentName,
                        email: currentEmail,
                        photoUrl: userData?.photoUrl || '',
                        studentId: userData?.studentId || 'ME'
                      });
                    }

                    // Add other members
                    allStudents.forEach(s => {
                      if (currentGroupData.members?.includes(s.uid) && s.uid !== currentUid) {
                        membersList.push(s);
                      }
                    });

                    // Make sure creator is included even if they aren't in members array for some reason
                    if (currentGroupData.creatorId && !membersList.some(m => m.uid === currentGroupData.creatorId)) {
                      const creatorInfo = allStudents.find(s => s.uid === currentGroupData.creatorId);
                      if (creatorInfo) {
                        membersList.push(creatorInfo);
                      } else if (currentGroupData.creatorId === currentUid) {
                        membersList.push({
                          uid: currentUid,
                          name: currentName,
                          email: currentEmail,
                          photoUrl: userData?.photoUrl || '',
                          studentId: userData?.studentId || 'ME'
                        });
                      }
                    }

                    return membersList;
                  };

                  const groupMembers = getGroupMembers();

                  return (
                    <div className="w-80 border-l border-slate-150 bg-white h-full flex flex-col shrink-0 z-10 shadow-lg absolute right-0 top-0 md:relative md:shadow-none animate-slide-in">
                      {/* Panel Header */}
                      <div className="p-4 border-b border-slate-150 bg-slate-50 flex items-center justify-between shrink-0">
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-[#800080]" /> Group Workspace
                        </h3>
                        <button onClick={() => setIsGroupPanelOpen(false)} className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer">
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Content (Scrollable) */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar">
                        {/* Info */}
                        <div>
                          <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Details</h4>
                          <div className="p-3 bg-purple-50/40 rounded-xl border border-purple-100">
                            <h5 className="text-xs font-extrabold text-purple-950 mb-0.5">{currentGroupData?.name}</h5>
                            <span className="inline-block text-[8px] bg-[#800080] text-white px-1.5 py-0.5 rounded font-black uppercase mb-2">
                              {currentGroupData?.subject}
                            </span>
                            <p className="text-[10px] text-slate-600 font-bold leading-normal">
                              {currentGroupData?.description || "No description provided."}
                            </p>
                          </div>
                        </div>

                        {/* Admin controls: Delete Group */}
                        {isGroupCreator(currentGroupData) && (
                          <div>
                            <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Admin Actions</h4>
                            <button
                              onClick={() => handleDeleteGroup(currentGroupData.id)}
                              className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
                            >
                              Delete This Group Permanently
                            </button>
                          </div>
                        )}

                        {/* Members list */}
                        <div>
                          <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">
                            Members ({groupMembers.length})
                          </h4>
                          <div className="space-y-1.5">
                            {groupMembers.map(member => {
                              const isCreator = member.uid === currentGroupData?.creatorId;
                              const isMe = member.uid === currentUid;
                              const memberName = isMe ? "You" : (member.name || member.email?.split('@')[0]?.toUpperCase() || "Student");
                              return (
                                <div key={member.uid} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 gap-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[9px] font-black uppercase shrink-0">
                                      {member.photoUrl ? (
                                        <img src={member.photoUrl} alt="" className="w-full h-full rounded-full object-cover" />
                                      ) : memberName.charAt(0)}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-1">
                                        <span className="text-[11px] font-extrabold text-slate-800 truncate block">{memberName}</span>
                                        {isCreator && <span title="Group Creator/Admin"><Crown className="w-3 h-3 text-amber-500 shrink-0 fill-amber-400" /></span>}
                                      </div>
                                      <span className="text-[8px] text-slate-400 font-mono font-bold block">ID: {member.studentId || "STU-0000"}</span>
                                    </div>
                                  </div>

                                  {/* Kick button: only visible to creator (admin) and can't kick oneself or the creator */}
                                  {currentGroupData?.creatorId === currentUid && !isMe && !isCreator && (
                                    <button
                                      onClick={() => handleRemoveMember(currentGroupData.id, member.uid)}
                                      className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-[9px] font-black uppercase transition-all cursor-pointer"
                                    >
                                      Kick
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Invite/Add new members (Only for Group Creator/Admin) */}
                        {currentGroupData?.creatorId === currentUid && (
                          <div>
                            <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Add Peer Students</h4>
                            <div className="space-y-1.5 max-h-[200px] overflow-y-auto custom-scrollbar pr-1">
                              {allStudents.filter(s => !currentGroupData?.members?.includes(s.uid)).length === 0 ? (
                                <p className="text-[10px] text-slate-400 italic">All peer students are already members.</p>
                              ) : (
                                allStudents.filter(s => !currentGroupData?.members?.includes(s.uid)).map(student => {
                                  const studentName = student.name || student.email?.split('@')[0]?.toUpperCase() || "Student";
                                  return (
                                    <div key={student.uid} className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-100 gap-2">
                                      <div className="flex items-center gap-2 min-w-0">
                                        <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[9px] font-black uppercase shrink-0">
                                          {student.photoUrl ? (
                                            <img src={student.photoUrl} alt="" className="w-full h-full rounded-full object-cover" />
                                          ) : studentName.charAt(0)}
                                        </div>
                                        <div className="min-w-0">
                                          <span className="text-[10px] font-extrabold text-slate-800 truncate block">{studentName}</span>
                                          <span className="text-[8px] text-slate-400 font-mono font-bold block">ID: STU-{student.studentId || "0000"}</span>
                                        </div>
                                      </div>
                                      <button
                                        onClick={() => handleAddMember(currentGroupData.id, student.uid)}
                                        className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-[9px] font-black uppercase transition-all cursor-pointer flex items-center gap-0.5"
                                      >
                                        <Plus className="w-3 h-3" /> Add
                                      </button>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

              </div>
            </div>
          ) : (
            /* DEFAULT HUB ONBOARDING VIEW */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/30">
              <div className="w-16 h-16 bg-gradient-to-tr from-indigo-100 to-purple-100 text-indigo-600 rounded-3xl flex items-center justify-center shadow-md mb-4">
                <MessageCircle className="w-8 h-8 stroke-[1.5]" />
              </div>
              
              <h3 className="text-lg font-black text-slate-800 font-display">No Active Channel Selected</h3>
              <p className="text-slate-500 text-xs mt-1.5 max-w-sm leading-relaxed font-semibold">
                Open a direct private discussion with any active peer student, or join/create a designated Study Group from the directory on the left.
              </p>

              <div className="grid grid-cols-2 gap-3 mt-8 w-full max-w-md">
                <button
                  onClick={() => setHubTab('private')}
                  className="p-4 rounded-2xl bg-white hover:bg-indigo-50/30 border border-slate-150 hover:border-indigo-200 transition-all text-left flex flex-col justify-between h-32 cursor-pointer shadow-sm group"
                >
                  <Users className="w-5 h-5 text-indigo-600 group-hover:scale-110 transition-transform" />
                  <div>
                    <h4 className="text-xs font-black text-slate-900">Direct Messages</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">Start 1-on-1 conversations with available peers.</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setHubTab('groups');
                    setIsCreateGroupOpen(true);
                  }}
                  className="p-4 rounded-2xl bg-white hover:bg-[#800080]/5 border border-slate-150 hover:border-[#800080]/30 transition-all text-left flex flex-col justify-between h-32 cursor-pointer shadow-sm group"
                >
                  <Plus className="w-5 h-5 text-[#800080] group-hover:scale-110 transition-transform" />
                  <div>
                    <h4 className="text-xs font-black text-slate-900">Launch a Group</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">Form study networks focused on target subjects.</p>
                  </div>
                </button>
              </div>

              {/* Little stats footer */}
              <div className="mt-12 text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Collaborative learning scales performance by 2.4x
              </div>
            </div>
          )}

        </div>

      </div>

      {/* CREATE NEW STUDY GROUP DIALOG MODAL */}
      <AnimatePresence>
        {isCreateGroupOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-[2rem] w-full max-w-md p-6 md:p-8 shadow-2xl border border-slate-100"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-[#800080] flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">Form New Study Group</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Academic network design</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCreateGroupOpen(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-755 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateGroupSubmit} className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-indigo-950 tracking-wider block mb-1.5">
                    Study Group Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Baccalauréat Mathematics Prep Group"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl p-3 text-xs font-bold outline-none transition-all placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-indigo-950 tracking-wider block mb-1.5">
                    Topic Focus or Subject Area
                  </label>
                  <select
                    value={newGroupSubject}
                    onChange={(e) => setNewGroupSubject(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl p-3 text-xs font-bold outline-none transition-all"
                  >
                    <option value="Mathematics">Mathematics 📐</option>
                    <option value="Physics">Physics ⚡</option>
                    <option value="Chemistry">Chemistry 🧪</option>
                    <option value="Biology">Biology 🧬</option>
                    <option value="Literature">Literature 📚</option>
                    <option value="History/Geography">History / Geography 🌍</option>
                    <option value="Computer Science">Computer Science 💻</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-indigo-950 tracking-wider block mb-1.5">
                    Brief Description & Rules
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe the target exercises, schedules, and collaboration rules..."
                    value={newGroupDesc}
                    onChange={(e) => setNewGroupDesc(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl p-3 text-xs font-bold outline-none transition-all placeholder:text-slate-400"
                  />
                </div>

                <div className="pt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateGroupOpen(false)}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newGroupName.trim()}
                    className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-[#800080] hover:from-indigo-700 hover:to-purple-900 text-white font-extrabold text-xs rounded-xl transition-all shadow-md active:scale-[0.98] cursor-pointer"
                  >
                    Create & Join
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
