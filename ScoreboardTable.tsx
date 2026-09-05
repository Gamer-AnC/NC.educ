import React, { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  deleteDoc, 
  addDoc, 
  updateDoc, 
  getDoc 
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { 
  Trophy, 
  Medal, 
  Award, 
  UserCheck, 
  Flame, 
  Trash2, 
  ShieldAlert, 
  X, 
  Sparkles, 
  ChevronRight,
  Info
} from 'lucide-react';

interface ScoreRecord {
  id: string;      // userId
  playerId: string; // studentId or tutorCode
  score: number;    // score on 5
  role: 'student' | 'tutor';
  email?: string;
  updatedAt?: any;
}

interface ScoreboardTableProps {
  isAdminView?: boolean;
}

export default function ScoreboardTable({ isAdminView = false }: ScoreboardTableProps) {
  const [scores, setScores] = useState<ScoreRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentUserPoints, setCurrentUserPoints] = useState<number>(0);
  const [currentUserPlayerId, setCurrentUserPlayerId] = useState<string>('');

  // Dual Challenge Creation States
  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);
  const [targetPlayer, setTargetPlayer] = useState<ScoreRecord | null>(null);
  const [guaranteePoints, setGuaranteePoints] = useState<number>(1);
  const [isSubmittingChallenge, setIsSubmittingChallenge] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 1. Identify logged-in administrator "Ngandi Celestin"
  const savedAdminName = localStorage.getItem('nc_admin_name') || '';
  const isAdminNgandi = (savedAdminName || '').trim().toLowerCase() === 'ngandi celestin';

  // 2. Track current authenticated user & their points
  useEffect(() => {
    const unsubAuth = auth.currentUser ? onSnapshot(doc(db, 'users', auth.currentUser.uid), (snap) => {
      if (snap.exists()) {
        const uData = snap.data();
        setCurrentUserPoints(uData.points || 0);
        setCurrentUserPlayerId(uData.studentId || `STU-${auth.currentUser.uid.slice(0, 5)}`);
      }
    }) : null;

    setCurrentUser(auth.currentUser);
    return () => {
      if (unsubAuth) unsubAuth();
    };
  }, [auth.currentUser]);

  // 3. Fallback to check currentUserPoints from scoreboard if users doc doesn't exist
  useEffect(() => {
    if (scores.length > 0 && currentUser && !currentUserPoints) {
      const myRecord = scores.find(s => s.id === currentUser.uid);
      if (myRecord) {
        setCurrentUserPoints(myRecord.score || 0);
        setCurrentUserPlayerId(myRecord.playerId);
      }
    }
  }, [scores, currentUser, currentUserPoints]);

  // 4. Real-time scoreboard snapshot
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'test_scores'), (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ScoreRecord));
      
      // Sort descending by score/points
      list.sort((a, b) => (b.score || 0) - (a.score || 0));
      
      // Filter out people who haven't earned points (score must be > 0)
      const validScores = list.filter(item => (item.score || 0) > 0);
      setScores(validScores);
      setLoading(false);
    }, (error) => {
      console.warn("Permission issue or connection warning in scoreboard snap:", error);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // 5. Admin function to completely remove a participant from the list
  const handleRemoveParticipant = async (record: ScoreRecord) => {
    if (!isAdminView || !isAdminNgandi) return;
    const confirmRemove = window.confirm(
      `CRITICAL ACTION:\nAre you sure you want to COMPLETELY remove participant "${record.playerId}" from the Top Evaluation Rank List?\nThis action is irreversible.`
    );
    if (confirmRemove) {
      try {
        await deleteDoc(doc(db, 'test_scores', record.id));
        alert(`SUCCESS: Participant "${record.playerId}" has been completely removed from the scoreboard.`);
      } catch (err: any) {
        alert(`ERROR: Failed to remove participant. ${err.message}`);
      }
    }
  };

  // helper to identify a player's zone / class based on their current index in real-time scores
  const getPlayerZone = (userId: string) => {
    const index = scores.findIndex(s => s.id === userId);
    if (index === -1) return 'B'; // fallback to yellow (Class B)
    if (index < 3) return 'A';    // Class A (Top 3)
    if (index >= Math.max(3, scores.length - 5)) return 'C'; // Class C (Last 5)
    return 'B';                  // Class B (Middle)
  };

  const getZoneInfo = (index: number, total: number) => {
    if (index < 3) {
      return { name: 'Class A', color: 'green', textColor: 'text-emerald-750', bgColor: 'bg-emerald-50/20', borderColor: 'border-emerald-500' };
    }
    if (index >= Math.max(3, total - 5)) {
      return { name: 'Class C', color: 'red', textColor: 'text-rose-750', bgColor: 'bg-rose-50/20', borderColor: 'border-rose-500' };
    }
    return { name: 'Class B', color: 'yellow', textColor: 'text-amber-700', bgColor: 'bg-amber-50/20', borderColor: 'border-amber-400' };
  };

  const getChallengeGuaranteeRules = (challengerId: string, opponentId: string) => {
    const challengerZone = getPlayerZone(challengerId);
    const opponentZone = getPlayerZone(opponentId);

    // Default fallback: user-specified guaranteePoints (which default to Math.min(currentUserPoints, opponent points))
    let challengerReq = Number(guaranteePoints);
    let opponentReq = Number(guaranteePoints);
    let isSpecialRule = false;
    let ruleDescription = "";

    if (challengerZone === 'C' && opponentZone === 'A') {
      challengerReq = currentUserPoints;
      opponentReq = currentUserPoints / 2;
      isSpecialRule = true;
      ruleDescription = "Class C (Red) challenging Class A (Green) rule: Red must deposit ALL of their points as guarantee, while Green must match half of that amount (Class C Points / 2).";
    } else if (challengerZone === 'B' && opponentZone === 'A') {
      challengerReq = currentUserPoints / 2;
      opponentReq = currentUserPoints;
      isSpecialRule = true;
      ruleDescription = "Class B (Yellow) challenging Class A (Green) rule: Yellow must deposit half of their total points as guarantee, and Green must match Yellow's full actual total points balance.";
    }

    return {
      challengerReq: Number(challengerReq.toFixed(2)),
      opponentReq: Number(opponentReq.toFixed(2)),
      isSpecialRule,
      ruleDescription,
      challengerZone,
      opponentZone
    };
  };

  // 6. Open challenge modal
  const openChallengeModal = (player: ScoreRecord) => {
    setErrorMsg('');
    setSuccessMsg('');
    setTargetPlayer(player);
    
    // Automatically pre-calculate the required amounts
    const indexChallenger = scores.findIndex(s => s.id === currentUser?.uid);
    const indexOpponent = scores.findIndex(s => s.id === player.id);
    
    let cZone = 'B';
    if (indexChallenger !== -1) {
      if (indexChallenger < 3) cZone = 'A';
      else if (indexChallenger >= Math.max(3, scores.length - 5)) cZone = 'C';
    }
    let oZone = 'B';
    if (indexOpponent !== -1) {
      if (indexOpponent < 3) oZone = 'A';
      else if (indexOpponent >= Math.max(3, scores.length - 5)) oZone = 'C';
    }

    if (cZone === 'C' && oZone === 'A') {
      setGuaranteePoints(currentUserPoints); // force all
    } else if (cZone === 'B' && oZone === 'A') {
      setGuaranteePoints(currentUserPoints / 2); // force half
    } else {
      const maxPoss = Math.min(currentUserPoints, player.score || 0);
      setGuaranteePoints(Math.max(0.5, Number(Math.min(1, maxPoss).toFixed(2))));
    }
    setIsChallengeModalOpen(true);
  };

  // 7. Submit Dual Challenge
  const handleCreateChallenge = async () => {
    if (!currentUser || !targetPlayer) return;
    setIsSubmittingChallenge(true);
    setErrorMsg('');

    try {
      // Re-verify challenger points in DB
      const challengerSnap = await getDoc(doc(db, 'users', currentUser.uid));
      let currentPointsInDb = currentUserPoints;
      if (challengerSnap.exists()) {
        currentPointsInDb = challengerSnap.data().points || 0;
      }

      // Re-verify opponent points
      const opponentSnap = await getDoc(doc(db, 'users', targetPlayer.id));
      let opponentPointsInDb = targetPlayer.score;
      if (opponentSnap.exists()) {
        opponentPointsInDb = opponentSnap.data().points || 0;
      }

      const { challengerReq, opponentReq, isSpecialRule } = getChallengeGuaranteeRules(currentUser.uid, targetPlayer.id);

      const challengerDeposit = isSpecialRule ? challengerReq : Number(guaranteePoints);
      const opponentDeposit = isSpecialRule ? opponentReq : Number(guaranteePoints);

      if (isNaN(challengerDeposit) || challengerDeposit <= 0) {
        throw new Error("Guarantee deposit must be a valid positive number.");
      }

      if (currentPointsInDb < challengerDeposit) {
        throw new Error(`Insufficient points! You need ${challengerDeposit.toFixed(2)} points to initiate this challenge under the zone matching contract, but your balance is ${currentPointsInDb.toFixed(2)} points.`);
      }

      if (opponentPointsInDb < opponentDeposit) {
        throw new Error(`Opponent "${targetPlayer.playerId}" only has ${opponentPointsInDb.toFixed(2)} points, but the required zone match guarantee for them is ${opponentDeposit.toFixed(2)} points.`);
      }

      // Proceed to deduct challenger guarantee points
      const finalChallengerPoints = Math.max(0, currentPointsInDb - challengerDeposit);
      await updateDoc(doc(db, 'users', currentUser.uid), {
        points: finalChallengerPoints
      });
      await updateDoc(doc(db, 'test_scores', currentUser.uid), {
        score: finalChallengerPoints
      });

      // Create dual challenge document
      await addDoc(collection(db, 'dual_challenges'), {
        challengerId: currentUser.uid,
        challengerPlayerId: currentUserPlayerId || `STU-${currentUser.uid.slice(0, 5)}`,
        challengerEmail: currentUser.email || '',
        challengedId: targetPlayer.id,
        challengedPlayerId: targetPlayer.playerId,
        challengedEmail: targetPlayer.email || '',
        challengerGuarantee: challengerDeposit,
        challengedGuarantee: opponentDeposit,
        pointsGuarantee: opponentDeposit, // fallback
        status: 'pending',
        challengerDeposited: true,
        challengedDeposited: false,
        challengerSubmitted: false,
        challengedSubmitted: false,
        createdAt: new Date(),
        startedAt: null,
        winnerId: null,
        loserId: null
      });

      setSuccessMsg(`⚡ EXCELLENT! You successfully challenged ${targetPlayer.playerId}! Your deposit of ${challengerDeposit.toFixed(2)} PTS has been escrowed, and they will deposit ${opponentDeposit.toFixed(2)} PTS on acceptance!`);
      setTimeout(() => {
        setIsChallengeModalOpen(false);
        setTargetPlayer(null);
      }, 4000);
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred while launching challenge.");
    } finally {
      setIsSubmittingChallenge(false);
    }
  };

  return (
    <div id="academic-leaderboard-card" className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-blue-900/5 overflow-hidden relative">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-900 p-6 md:p-8 text-white relative">
        <div className="absolute top-0 right-0 p-6 opacity-10">
          <Trophy className="w-24 h-24 text-amber-300" />
        </div>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-950/50 rounded-2xl flex items-center justify-center text-amber-300 shadow-lg border border-purple-500/20">
            <Trophy className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-purple-850 text-[9px] font-black rounded-lg uppercase tracking-wider text-amber-300 border border-purple-700">
                REAL-TIME SCOREBOARD
              </span>
              <span className="px-2.5 py-0.5 bg-rose-500 text-[9px] font-black rounded-lg uppercase tracking-wider text-white flex items-center gap-0.5">
                <Flame className="w-2.5 h-2.5 animate-bounce" /> DUAL ARENA ACTIVE
              </span>
            </div>
            <h3 className="text-xl md:text-2xl font-black font-display mt-0.5">Top Evaluation Rank</h3>
            <p className="text-slate-300 text-xs mt-1">
              Active student and educator cumulative points. Challenge fellow students to an high-stakes science duel!
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 md:p-8">
        {/* Class Legend */}
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-emerald-50/40 border border-emerald-100">
            <div className="w-2.5 h-10 bg-emerald-500 rounded-full shrink-0" />
            <div>
              <p className="text-[11px] font-black uppercase text-emerald-800 tracking-wider">Class A</p>
              <p className="text-[10px] text-slate-500 font-medium">Top 3 on Scoreboard. Elite status.</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-amber-50/40 border border-amber-100">
            <div className="w-2.5 h-10 bg-amber-400 rounded-full shrink-0" />
            <div>
              <p className="text-[11px] font-black uppercase text-amber-800 tracking-wider">Class B</p>
              <p className="text-[10px] text-slate-500 font-medium">Middle contenders. Safe zone.</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-rose-50/40 border border-rose-100">
            <div className="w-2.5 h-10 bg-rose-500 rounded-full shrink-0" />
            <div>
              <p className="text-[11px] font-black uppercase text-rose-800 tracking-wider">Class C</p>
              <p className="text-[10px] text-slate-500 font-medium">Last 5 contenders. High risk.</p>
            </div>
          </div>
        </div>

        {/* Logged in User quick stats */}
        {currentUser && (
          <div className="mb-6 p-4 bg-purple-50/50 border border-purple-100 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚔️</span>
              <div>
                <p className="text-xs text-slate-500 font-bold">
                  Your Identifier ID: <span className="font-mono font-black text-purple-950">{currentUserPlayerId}</span> 
                  <span className={`ml-2 px-1.5 py-0.5 rounded font-bold text-[9px] uppercase ${
                    getPlayerZone(currentUser.uid) === 'A' ? 'bg-emerald-100 text-emerald-800' :
                    getPlayerZone(currentUser.uid) === 'C' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    Class {getPlayerZone(currentUser.uid)}
                  </span>
                </p>
                <p className="text-xs text-slate-400">Available points for challenge guarantees: <span className="font-mono text-emerald-600 font-black">{currentUserPoints.toFixed(2)} PTS</span></p>
              </div>
            </div>
            <div className="px-3 py-1 bg-white border border-purple-200 rounded-lg text-[10px] font-mono text-purple-850 uppercase font-black tracking-wide">
              Duel Arena Eligible
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 space-y-3">
            <div className="w-8 h-8 rounded-full border-4 border-purple-600 border-t-transparent animate-spin" />
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest font-mono">Loading participants...</p>
          </div>
        ) : scores.length === 0 ? (
          <div className="text-center py-12 px-6">
            <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <Award className="w-6 h-6" />
            </div>
            <p className="text-slate-700 font-bold text-sm">No test takers logged yet</p>
            <p className="text-slate-400 text-xs mt-1">
              Be the first user to submit a practice evaluation and secure your point on this leaderboard!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <th className="py-4 px-4 text-center w-16">Rank</th>
                  <th className="py-4 px-4">Player Identifier ID</th>
                  <th className="py-4 px-4 text-center">Class / Zone</th>
                  <th className="py-4 px-4 text-center">Identity Portal</th>
                  <th className="py-4 px-4 text-right">Score</th>
                  <th className="py-4 px-4 text-center w-40">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs text-slate-700 font-bold">
                {scores.map((record, index) => {
                  const isTopOne = index === 0;
                  const isTopTwo = index === 1;
                  const isTopThree = index === 2;
                  const isMe = currentUser && currentUser.uid === record.id;
                  
                  const total = scores.length;
                  const zone = getZoneInfo(index, total);

                  const renderRow = (
                    <tr 
                      key={`row-${record.id || index}-${index}`}
                      className={`hover:bg-slate-50/50 transition-colors border-l-4 ${zone.borderColor} ${zone.bgColor} ${
                        isMe ? 'bg-purple-150/40 border-r-4 border-r-purple-600' : ''
                      }`}
                    >
                      {/* Rank Column */}
                      <td className="py-4 px-4 text-center">
                        <span className="flex items-center justify-center">
                          {isTopOne ? (
                            <Medal className="w-5 h-5 text-amber-400 drop-shadow-sm" />
                          ) : isTopTwo ? (
                            <Medal className="w-5 h-5 text-slate-400 drop-shadow-sm" />
                          ) : isTopThree ? (
                            <Medal className="w-5 h-5 text-amber-700 drop-shadow-sm" />
                          ) : (
                            <span className="font-mono text-slate-400 text-sm font-black">
                              {index + 1}
                            </span>
                          )}
                        </span>
                      </td>

                      {/* Player ID Column */}
                      <td className="py-4 px-4 font-mono font-black text-slate-800 text-sm">
                        <div className="flex items-center gap-2">
                          <span>{record.playerId || 'N/A'}</span>
                          {record.role === 'tutor' && (
                            <span className="px-1.5 py-0.5 bg-indigo-50 border border-indigo-100 text-[9px] rounded font-sans text-indigo-700">
                              Educator
                            </span>
                          )}
                          {isMe && (
                            <span className="px-1.5 py-0.5 bg-purple-600 text-white text-[9px] rounded font-sans uppercase tracking-widest font-black">
                              You
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Class/Zone Column */}
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] uppercase font-black tracking-wide ${
                          zone.color === 'green' ? 'bg-emerald-550 text-white' :
                          zone.color === 'red' ? 'bg-rose-550 text-white' : 'bg-amber-400 text-slate-900'
                        }`}>
                          {zone.name}
                        </span>
                      </td>

                      {/* Role/Portal Column */}
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] uppercase font-black tracking-wider ${
                          record.role === 'tutor' 
                            ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' 
                            : 'bg-purple-100 text-purple-800 border border-purple-200'
                        }`}>
                          <UserCheck className="w-3 h-3" />
                          {record.role === 'tutor' ? 'Tutor Portal' : 'Student Portal'}
                        </span>
                      </td>

                      {/* Score on 5 Column */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex flex-col items-end">
                          <span className={`font-mono text-base font-black ${
                            zone.color === 'green' ? 'text-emerald-600' :
                            zone.color === 'red' ? 'text-rose-600' : 'text-amber-600'
                          }`}>
                            {Number(record.score).toFixed(2)}
                          </span>
                          <span className="text-[9px] text-slate-400 font-normal uppercase tracking-wider block">
                            Points
                          </span>
                        </div>
                      </td>

                      {/* Action buttons (Challenge / Remove) */}
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {/* 1. Challenge option for students */}
                          {!isMe && record.role === 'student' && currentUser && (
                            <button
                              id={`challenge-btn-${record.id}`}
                              onClick={() => openChallengeModal(record)}
                              disabled={currentUserPoints <= 0}
                              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wide border transition-all ${
                                currentUserPoints <= 0 
                                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                                  : 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-600 hover:text-white hover:border-rose-600 active:scale-95'
                              }`}
                            >
                              <Flame className="w-3.5 h-3.5 fill-current" />
                              Challenge
                            </button>
                          )}

                          {/* 2. Admin action for Ngandi Celestin */}
                          {isAdminView && isAdminNgandi && (
                            <button
                              id={`admin-remove-btn-${record.id}`}
                              onClick={() => handleRemoveParticipant(record)}
                              title="Completely remove participant from top evaluation list"
                              className="p-1.5 bg-rose-100 border border-rose-200 hover:bg-rose-600 hover:text-white hover:border-rose-600 text-rose-700 rounded-xl transition-colors active:scale-90"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}

                          {/* Empty state filler */}
                          {!(isAdminView && isAdminNgandi) && (isMe || record.role === 'tutor' || !currentUser) && (
                            <span className="text-[11px] text-slate-400 italic">No actions available</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );

                  // Accumulate rows with visual dividing lines
                  return (
                    <React.Fragment key={`fragment-${record.id || index}-${index}`}>
                      {renderRow}

                      {/* Class A ends separator: Green Line */}
                      {index === 2 && total > 3 && (
                        <tr key={`divider-class-a-${index}`}>
                          <td colSpan={6} className="py-1 px-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[8px] font-black text-emerald-800 uppercase tracking-widest bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-md shrink-0 ml-4">
                                Class A Border
                              </span>
                              <div className="h-[3px] flex-1 bg-emerald-500 rounded-full mr-4 shadow-sm" />
                            </div>
                          </td>
                        </tr>
                      )}

                      {/* Class C starts separator: Red Line */}
                      {index === total - 6 && total > 5 && (
                        <tr key={`divider-class-c-${index}`}>
                          <td colSpan={6} className="py-1 px-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[8px] font-black text-rose-800 uppercase tracking-widest bg-rose-100 border border-rose-200 px-2 py-0.5 rounded-md shrink-0 ml-4">
                                Class C Border
                              </span>
                              <div className="h-[3px] flex-1 bg-rose-500 rounded-full mr-4 shadow-sm" />
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DUAL CHALLENGE CREATION MODAL */}
      {isChallengeModalOpen && targetPlayer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-rose-600 to-amber-500 p-6 text-white relative">
              <button 
                onClick={() => setIsChallengeModalOpen(false)}
                className="absolute top-4 right-4 p-1 rounded-full bg-black/10 hover:bg-black/25 text-white transition-colors animate-pulse"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white text-lg">
                  ⚔️
                </div>
                <div>
                  <h4 className="text-lg font-black tracking-wide">Initiate Dual Challenge</h4>
                  <p className="text-[10px] text-white/85 uppercase tracking-wider font-extrabold">High-stakes scientific combat</p>
                </div>
              </div>
            </div>

            {/* Dynamic Content and Rules */}
            {(() => {
              const { challengerReq, opponentReq, isSpecialRule, ruleDescription, challengerZone, opponentZone } = getChallengeGuaranteeRules(currentUser.uid, targetPlayer.id);

              return (
                <div className="p-6 space-y-4">
                  <div className="bg-rose-50/50 rounded-2xl p-4 border border-rose-100 flex flex-col gap-2">
                    <p className="text-xs text-rose-900 font-bold leading-relaxed">
                      You are initiating an official dual scientific assessment challenging <span className="underline decoration-double font-mono text-purple-950 font-black">{targetPlayer.playerId}</span>.
                    </p>
                    <div className="flex gap-2 items-center mt-1">
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase text-white ${
                        challengerZone === 'A' ? 'bg-emerald-500' : challengerZone === 'C' ? 'bg-rose-500' : 'bg-amber-400 text-slate-950'
                      }`}>
                        Your Status: Class {challengerZone}
                      </span>
                      <span className="text-slate-400 text-[10px]">➜</span>
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase text-white ${
                        opponentZone === 'A' ? 'bg-emerald-500' : opponentZone === 'C' ? 'bg-rose-500' : 'bg-amber-400 text-slate-950'
                      }`}>
                        Opponent: Class {opponentZone}
                      </span>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                      <span className="text-[9px] text-slate-400 uppercase font-black block">Your points balance</span>
                      <span className="font-mono text-sm font-black text-emerald-600">{currentUserPoints.toFixed(2)} PTS</span>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                      <span className="text-[9px] text-slate-400 uppercase font-black block">Opponent balance</span>
                      <span className="font-mono text-sm font-black text-indigo-600">{(targetPlayer.score || 0).toFixed(2)} PTS</span>
                    </div>
                  </div>

                  {isSpecialRule ? (
                    /* SPECIAL ZONE MATCHUP ESCROW VIEW */
                    <div className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-indigo-200 rounded-2xl space-y-3">
                      <h5 className="text-[10px] font-black uppercase text-indigo-800 tracking-wider flex items-center gap-1">
                        <span>⚔️</span> Academic Zone Challenge Active
                      </h5>
                      <p className="text-[11px] text-slate-700 leading-relaxed font-semibold">
                        {ruleDescription}
                      </p>
                      
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-indigo-100">
                        <div className="p-2 bg-white rounded-lg border border-indigo-100">
                          <span className="text-[9px] text-slate-400 uppercase font-black block">Your Escrow Deposit</span>
                          <span className="font-mono text-xs font-black text-rose-600">{challengerReq.toFixed(2)} PTS</span>
                        </div>
                        <div className="p-2 bg-white rounded-lg border border-indigo-100">
                          <span className="text-[9px] text-slate-400 uppercase font-black block">Opponent Match Escrow</span>
                          <span className="font-mono text-xs font-black text-indigo-600">{opponentReq.toFixed(2)} PTS</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* STANDARD EQUAL MATCHUP ESCROW INPUT */
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">
                        Guarantee Deposit Amount (PTS)
                      </label>
                      <div className="relative">
                        <input 
                          type="number" 
                          step="0.5"
                          min="0.5"
                          max={Math.min(currentUserPoints, targetPlayer.score || 0)}
                          value={guaranteePoints}
                          onChange={(e) => setGuaranteePoints(Math.max(0.5, Number(e.target.value)))}
                          className="w-full bg-slate-50 border-2 border-slate-200 focus:border-rose-500 rounded-xl py-3 px-4 text-sm font-mono font-black focus:outline-hidden transition-all text-slate-800"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-rose-500">
                          PTS GUARANTEE
                        </span>
                      </div>
                      <div className="flex items-start gap-1 text-[10px] text-slate-500 mt-1 leading-relaxed">
                        <Info className="w-3 h-3 text-rose-500 shrink-0 mt-0.5" />
                        <p>
                          Maximum deposit allowed for this battle: <span className="font-bold text-slate-700 font-mono">{Math.min(currentUserPoints, targetPlayer.score || 0).toFixed(2)} PTS</span> (limited by the lowest of both balances).
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Information disclaimer */}
                  <div className="bg-amber-50/50 border border-amber-200/60 p-4 rounded-xl flex gap-2.5 text-amber-900">
                    <span className="text-base shrink-0">⏳</span>
                    <div>
                      <h5 className="text-[10px] font-black uppercase tracking-wider">Dual Challenge Contract</h5>
                      <p className="text-[10px] leading-relaxed mt-0.5 font-medium">
                        Upon clicking "Escrow Deposit", your requested points are deducted from your balance immediately and put into dual guarantee escrow. Once they accept, both are locked in the <strong>"Dual Challenge" page for 30 MCQs in 30 minutes</strong>. The winner takes the entire deposit pool!
                      </p>
                    </div>
                  </div>

                  {/* Alert Feedback Messages */}
                  {errorMsg && (
                    <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold leading-relaxed animate-bounce">
                      ⚠️ {errorMsg}
                    </div>
                  )}
                  {successMsg && (
                    <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold leading-relaxed">
                      ✨ {successMsg}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Actions */}
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button 
                onClick={() => setIsChallengeModalOpen(false)}
                className="flex-1 py-3 px-4 border-2 border-slate-200 text-xs font-black uppercase tracking-wider rounded-xl hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateChallenge}
                disabled={isSubmittingChallenge || !guaranteePoints || !!successMsg}
                className={`flex-1 py-3 px-4 text-xs font-black uppercase tracking-wider rounded-xl text-white flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 ${
                  isSubmittingChallenge || !guaranteePoints || !!successMsg
                    ? 'bg-slate-300 shadow-none cursor-not-allowed'
                    : 'bg-gradient-to-r from-rose-600 to-amber-500 hover:opacity-95'
                }`}
              >
                {isSubmittingChallenge ? (
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Escrow Deposit
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
