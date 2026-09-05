import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, updateDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { SCIENCE_QUESTIONS, ScienceQuestion } from '../data/scienceQuestions';
import { 
  Flame, 
  Timer, 
  CheckCircle2, 
  XCircle, 
  Award, 
  Info, 
  TrendingUp, 
  TrendingDown, 
  RefreshCcw,
  BookOpen
} from 'lucide-react';

interface DualChallengeScreenProps {
  challenge: any;
  user: any;
  onClose: () => void;
}

export default function DualChallengeScreen({ challenge, user, onClose }: DualChallengeScreenProps) {
  const isChallenger = challenge.challengerId === user?.uid;
  
  // Answers state: array of 30 answers, -1 means unanswered
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>(() => {
    const saved = isChallenger ? challenge.challengerAnswers : challenge.challengedAnswers;
    return saved && Array.isArray(saved) ? saved : Array(30).fill(-1);
  });

  const [secondsLeft, setSecondsLeft] = useState(1800); // 30 minutes default
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [myScore, setMyScore] = useState<number | null>(null);
  const [opponentScore, setOpponentScore] = useState<number | null>(null);
  const [winnerPlayerId, setWinnerPlayerId] = useState<string | null>(null);
  const [finalStatusMsg, setFinalStatusMsg] = useState('');
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);

  // 1. Timer Logic
  useEffect(() => {
    if (!challenge.startedAt || hasSubmitted) return;

    const startTime = challenge.startedAt.toDate ? challenge.startedAt.toDate().getTime() : new Date(challenge.startedAt).getTime();
    const endTime = startTime + 30 * 60 * 1000; // 30 minutes

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((endTime - now) / 1000));
      setSecondsLeft(diff);

      if (diff === 0) {
        clearInterval(interval);
        // Auto-submit script on timer expiration
        handleAutoSubmit();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [challenge.startedAt, hasSubmitted]);

  // Check if I have already submitted this challenge previously (e.g. on page reload)
  useEffect(() => {
    const alreadySub = isChallenger ? challenge.challengerSubmitted : challenge.challengedSubmitted;
    if (alreadySub) {
      setHasSubmitted(true);
      setMyScore(isChallenger ? challenge.challengerScore : challenge.challengedScore);
    }
  }, [challenge, isChallenger]);

  // 2. Select Option
  const handleSelectOption = (questionIdx: number, optionIdx: number) => {
    if (hasSubmitted) return;
    const nextAnswers = [...selectedAnswers];
    nextAnswers[questionIdx] = optionIdx;
    setSelectedAnswers(nextAnswers);

    // Sync answers in real-time to prevent loss if tab is closed!
    const challengeRef = doc(db, 'dual_challenges', challenge.id);
    const updatePayload = isChallenger 
      ? { challengerAnswers: nextAnswers } 
      : { challengedAnswers: nextAnswers };
    updateDoc(challengeRef, updatePayload).catch(e => console.warn("Realtime answer backup failed", e));
  };

  // 3. Mark Answers & Resolve Challenge
  const submitAnswers = async (answersToSubmit: number[]) => {
    setIsSubmitting(true);
    try {
      // 1. Calculate Score
      let score = 0;
      SCIENCE_QUESTIONS.forEach((q, idx) => {
        if (answersToSubmit[idx] === q.correctOptionIndex) {
          score++;
        }
      });

      // 2. Update Firestore challenge record
      const challengeRef = doc(db, 'dual_challenges', challenge.id);
      const isNowChallengerSubmitted = isChallenger ? true : challenge.challengerSubmitted;
      const isNowChallengedSubmitted = !isChallenger ? true : challenge.challengedSubmitted;
      const challengerS = isChallenger ? score : (challenge.challengerScore || 0);
      const challengedS = !isChallenger ? score : (challenge.challengedScore || 0);

      const payload: any = isChallenger ? {
        challengerAnswers: answersToSubmit,
        challengerScore: score,
        challengerSubmitted: true,
        challengerSubmittedAt: new Date()
      } : {
        challengedAnswers: answersToSubmit,
        challengedScore: score,
        challengedSubmitted: true,
        challengedSubmittedAt: new Date()
      };

      await updateDoc(challengeRef, payload);
      setHasSubmitted(true);
      setMyScore(score);

      // 3. If both are now submitted, resolve the winner and award points
      if (isNowChallengerSubmitted && isNowChallengedSubmitted) {
        let winnerId = '';
        let loserId = '';
        let isDraw = false;

        if (challengerS > challengedS) {
          winnerId = challenge.challengerId;
          loserId = challenge.challengedId;
        } else if (challengedS > challengerS) {
          winnerId = challenge.challengedId;
          loserId = challenge.challengerId;
        } else {
          // Tie score! Secondary metric is submission time
          const challengerTime = isChallenger ? Date.now() : (challenge.challengerSubmittedAt?.toDate ? challenge.challengerSubmittedAt.toDate().getTime() : new Date(challenge.challengerSubmittedAt || 0).getTime());
          const challengedTime = !isChallenger ? Date.now() : (challenge.challengedSubmittedAt?.toDate ? challenge.challengedSubmittedAt.toDate().getTime() : new Date(challenge.challengedSubmittedAt || 0).getTime());
          
          if (challengerTime < challengedTime) {
            winnerId = challenge.challengerId;
            loserId = challenge.challengedId;
          } else if (challengedTime < challengerTime) {
            winnerId = challenge.challengedId;
            loserId = challenge.challengerId;
          } else {
            isDraw = true;
          }
        }

        const challengerGuarantee = challenge.challengerGuarantee !== undefined ? challenge.challengerGuarantee : challenge.pointsGuarantee;
        const challengedGuarantee = challenge.challengedGuarantee !== undefined ? challenge.challengedGuarantee : challenge.pointsGuarantee;

        if (!isDraw) {
          // Add challengerGuarantee + challengedGuarantee points back to the winner (since points were debited already)
          const winnerDocRef = doc(db, 'users', winnerId);
          const winnerSnap = await getDoc(winnerDocRef);
          const currentWinnerPoints = winnerSnap.exists() ? (winnerSnap.data().points || 0) : 0;
          const newWinnerPoints = currentWinnerPoints + challengerGuarantee + challengedGuarantee;

          await updateDoc(winnerDocRef, { points: newWinnerPoints });
          await updateDoc(doc(db, 'test_scores', winnerId), { score: newWinnerPoints });

          // Update challenge with terminal states
          await updateDoc(challengeRef, {
            status: 'completed',
            winnerId,
            loserId,
            isDraw: false,
            resolvedAt: new Date()
          });
        } else {
          // Refund both their respective guarantee deposits!
          const cRef = doc(db, 'users', challenge.challengerId);
          const cSnap = await getDoc(cRef);
          const cPoints = cSnap.exists() ? (cSnap.data().points || 0) : 0;
          await updateDoc(cRef, { points: cPoints + challengerGuarantee });
          await updateDoc(doc(db, 'test_scores', challenge.challengerId), { score: cPoints + challengerGuarantee });

          const dRef = doc(db, 'users', challenge.challengedId);
          const dSnap = await getDoc(dRef);
          const dPoints = dSnap.exists() ? (dSnap.data().points || 0) : 0;
          await updateDoc(dRef, { points: dPoints + challengedGuarantee });
          await updateDoc(doc(db, 'test_scores', challenge.challengedId), { score: dPoints + challengedGuarantee });

          await updateDoc(challengeRef, {
            status: 'completed',
            winnerId: 'draw',
            loserId: 'draw',
            isDraw: true,
            resolvedAt: new Date()
          });
        }
      }
    } catch (e) {
      console.error("Error submitting script", e);
      alert("Error submitting results, please check your network connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualSubmit = () => {
    const unanswered = selectedAnswers.filter(a => a === -1).length;
    let msg = "Are you sure you want to submit your final answers for this Dual Science Challenge?";
    if (unanswered > 0) {
      msg = `WARNING: You have ${unanswered} unanswered questions remaining. ${msg}`;
    }

    if (window.confirm(msg)) {
      submitAnswers(selectedAnswers);
    }
  };

  const handleAutoSubmit = () => {
    // Fill remaining unanswered with -1 (incorrect) and submit
    submitAnswers(selectedAnswers);
  };

  // Listen for challenge completion to show final results screen
  useEffect(() => {
    const challengeRef = doc(db, 'dual_challenges', challenge.id);
    const unsub = onSnapshot(challengeRef, (snap) => {
      if (snap.exists()) {
        const cData = snap.data();
        if (cData.status === 'completed') {
          setShowResults(true);
          setMyScore(isChallenger ? cData.challengerScore : cData.challengedScore);
          setOpponentScore(isChallenger ? cData.challengedScore : cData.challengerScore);
          
          if (cData.isDraw) {
            setWinnerPlayerId('Draw (Tie)');
            setFinalStatusMsg("Tie Game! Both participants answered correctly at equal times. All escrowed points are refunded.");
          } else {
            const isMeWinner = cData.winnerId === user?.uid;
            setWinnerPlayerId(isMeWinner ? "YOU" : (isChallenger ? cData.challengedPlayerId : cData.challengerPlayerId));
            setFinalStatusMsg(
              isMeWinner 
                ? `VICTORY! You won the challenge and gained +${cData.pointsGuarantee.toFixed(2)} PTS directly added to your top rank scoreboard profile!`
                : `DEFEAT! Your opponent won. -${cData.pointsGuarantee.toFixed(2)} PTS has been debited.`
            );
          }
        }
      }
    });

    return () => unsub();
  }, [challenge.id, isChallenger, user?.uid]);

  const progressCount = selectedAnswers.filter(a => a !== -1).length;
  const progressPercent = Math.floor((progressCount / 30) * 100);

  // Time conversion
  const minStr = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const secStr = String(secondsLeft % 60).padStart(2, '0');

  return (
    <div id="dual-challenge-battlefield-root" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative overflow-hidden">
      {/* Background grids and glowing embers */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e1b4b_1px,transparent_1px),linear-gradient(to_bottom,#1e1b4b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-35" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* FIXED TOP NAVIGATION BAR */}
      <div className="border-b border-purple-900/40 bg-slate-900/60 backdrop-blur-md px-6 py-4 sticky top-0 z-30 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-500 border border-rose-500/30 flex items-center justify-center font-bold">
            ⚔️
          </div>
          <div>
            <h1 className="text-sm font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-amber-400 to-purple-400">
              DUAL CHALLENGE ARENA
            </h1>
            <p className="text-[10px] text-slate-400 font-mono">
              {isChallenger ? challenge.challengerPlayerId : challenge.challengedPlayerId} (You) VS {isChallenger ? challenge.challengedPlayerId : challenge.challengerPlayerId}
            </p>
          </div>
        </div>

        {/* Real-time Ticking Timer */}
        {!hasSubmitted && !showResults && (
          <div className="flex items-center gap-4 bg-slate-950/80 px-5 py-2.5 rounded-2xl border-2 border-rose-500/30 shadow-lg shadow-rose-950/10">
            <Timer className="w-5 h-5 text-rose-500 animate-pulse shrink-0" />
            <div className="text-right">
              <span className="text-rose-500 font-mono text-xl font-black block tracking-widest leading-none">
                {minStr}:{secStr}
              </span>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mt-1">
                MINUTES REMAINING
              </span>
            </div>
          </div>
        )}

        {/* Guarantee pool statistics */}
        <div className="px-4 py-2 bg-gradient-to-r from-purple-900 to-slate-900 border border-purple-500/30 rounded-2xl text-center shrink-0">
          <p className="text-[9px] text-purple-300 uppercase font-black tracking-wider">Guarantee Escrow Pool</p>
          <p className="font-mono text-sm font-black text-amber-300">{((challenge.challengerGuarantee !== undefined ? challenge.challengerGuarantee : challenge.pointsGuarantee) + (challenge.challengedGuarantee !== undefined ? challenge.challengedGuarantee : challenge.pointsGuarantee)).toFixed(2)} PTS</p>
        </div>
      </div>

      {/* MAIN LAYOUT */}
      <div className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 z-10">
        
        {/* LEFT COLUMN: ACTIVE BATTLE TRADING / SCREENPLAY */}
        <div className="lg:col-span-8 flex flex-col space-y-6">
          <AnimatePresence mode="wait">
            {!showResults ? (
              /* ACTIVE GAMEPLAY SCREEN */
              <motion.div 
                key="gameplay"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                {/* Warning header */}
                <div className="bg-slate-900/80 border border-purple-500/10 rounded-3xl p-5 flex gap-3 text-slate-300 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-rose-500/5 rounded-bl-full pointer-events-none" />
                  <span className="text-xl">🌋</span>
                  <div>
                    <h3 className="text-xs font-black uppercase text-amber-400 tracking-wide">30 EXTREMELY DIFFICULT SCIENCE MCQs</h3>
                    <p className="text-xs text-slate-400 leading-relaxed mt-1">
                      These questions are drawn from advanced physics, chemical dynamics, molecular biology, and differential calculus. Complete them with precision. If the 30-minute timer runs out, your script is marked instantly based on your selected choices.
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="bg-slate-900/60 p-4 rounded-2xl border border-purple-900/20">
                  <div className="flex justify-between text-xs font-bold text-slate-400 mb-2">
                    <span>Assessed Questions: {progressCount} of 30</span>
                    <span className="font-mono text-purple-400">{progressPercent}% Completed</span>
                  </div>
                  <div className="bg-slate-950 rounded-full h-2 w-full overflow-hidden border border-purple-900/30">
                    <div 
                      className="bg-gradient-to-r from-rose-500 to-purple-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Active Question Box */}
                {(() => {
                  const q = SCIENCE_QUESTIONS[activeQuestionIdx];
                  if (!q) return null;
                  const mySel = selectedAnswers[activeQuestionIdx];

                  return (
                    <div className="bg-slate-900/90 rounded-[2.5rem] border border-purple-500/20 p-6 md:p-8 shadow-2xl relative">
                      {/* Subject tag */}
                      <span className={`inline-flex px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider mb-4 border ${
                        q.subject === 'Physics' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                        q.subject === 'Chemistry' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        q.subject === 'Mathematics' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                        'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}>
                        {q.subject} Section
                      </span>

                      <h2 className="text-base md:text-lg font-black text-white leading-relaxed mb-6 font-display">
                        <span className="font-mono text-purple-400 mr-2">Q{activeQuestionIdx + 1}.</span> 
                        {q.question}
                      </h2>

                      {/* Options */}
                      <div className="space-y-3.5">
                        {q.options.map((opt, oIdx) => {
                          const isSelected = mySel === oIdx;
                          return (
                            <button
                              key={oIdx}
                              disabled={hasSubmitted}
                              onClick={() => handleSelectOption(activeQuestionIdx, oIdx)}
                              className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center justify-between gap-3 ${
                                isSelected 
                                  ? 'bg-purple-900/30 border-purple-500 text-white shadow-lg shadow-purple-500/10' 
                                  : 'bg-slate-950/60 border-purple-900/15 hover:border-purple-800/40 text-slate-300 hover:bg-slate-900/50'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black border ${
                                  isSelected 
                                    ? 'bg-purple-600 border-purple-400 text-white' 
                                    : 'bg-slate-900 border-purple-900/30 text-slate-400'
                                }`}>
                                  {String.fromCharCode(65 + oIdx)}
                                </span>
                                <span className="text-xs font-bold leading-relaxed">{opt}</span>
                              </div>
                              {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* Navigation and Submission Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  {/* Prev/Next buttons */}
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                      disabled={activeQuestionIdx === 0}
                      onClick={() => setActiveQuestionIdx(prev => prev - 1)}
                      className="flex-1 sm:flex-initial px-5 py-3 border border-purple-900/30 rounded-xl hover:bg-purple-950/20 text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                      Previous
                    </button>
                    <button
                      disabled={activeQuestionIdx === 29}
                      onClick={() => setActiveQuestionIdx(prev => prev + 1)}
                      className="flex-1 sm:flex-initial px-5 py-3 bg-purple-900/40 hover:bg-purple-900/60 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                      Next Question
                    </button>
                  </div>

                  {/* Submit Trigger */}
                  {!hasSubmitted ? (
                    <button
                      onClick={handleManualSubmit}
                      disabled={isSubmitting}
                      className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 text-white font-extrabold text-xs uppercase tracking-widest rounded-2xl shadow-lg hover:opacity-95 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      ) : (
                        "Submit Science Duel"
                      )}
                    </button>
                  ) : (
                    <div className="p-3 bg-emerald-950/40 border border-emerald-500/20 rounded-2xl text-emerald-400 text-xs font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      Script Submitted Successfully! Waiting for your opponent to finish...
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              /* COMPLETED RESULTS SCREENPLAY */
              <motion.div 
                key="results"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-slate-900/90 rounded-[2.5rem] border border-purple-500/20 p-6 md:p-10 shadow-2xl space-y-8 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-amber-500/5 to-purple-500/5 rounded-bl-[200px] pointer-events-none" />

                <div className="text-center max-w-xl mx-auto space-y-3">
                  <div className="w-16 h-16 bg-amber-500/10 border-2 border-amber-500/30 text-amber-500 rounded-full flex items-center justify-center text-3xl mx-auto shadow-lg animate-bounce">
                    🏆
                  </div>
                  <h2 className="text-2xl font-black uppercase tracking-wide font-display text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-rose-500 to-purple-400">
                    Challenge Resolved
                  </h2>
                  <p className="text-slate-300 font-bold text-xs">{finalStatusMsg}</p>
                </div>

                {/* Score breakdown board */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* My results */}
                  <div className="p-5 rounded-2xl bg-slate-950/80 border border-purple-500/10 flex flex-col items-center text-center space-y-2">
                    <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Your Score</span>
                    <span className="font-mono text-4xl font-black text-emerald-400">{(myScore || 0)} / 30</span>
                    <span className="text-[10px] text-slate-500 font-bold">Points guarantee risk returned</span>
                    <div className="flex items-center gap-1">
                      {winnerPlayerId === 'YOU' ? (
                        <span className="text-emerald-500 flex items-center gap-0.5 text-xs font-bold"><TrendingUp className="w-4.5 h-4.5" /> +{challenge.pointsGuarantee.toFixed(2)} PTS</span>
                      ) : winnerPlayerId === 'Draw (Tie)' ? (
                        <span className="text-amber-500 text-xs font-bold"><RefreshCcw className="w-4 h-4" /> Refunded</span>
                      ) : (
                        <span className="text-rose-500 flex items-center gap-0.5 text-xs font-bold"><TrendingDown className="w-4.5 h-4.5" /> -{challenge.pointsGuarantee.toFixed(2)} PTS</span>
                      )}
                    </div>
                  </div>

                  {/* Opponent results */}
                  <div className="p-5 rounded-2xl bg-slate-950/80 border border-purple-500/10 flex flex-col items-center text-center space-y-2">
                    <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Opponent Score</span>
                    <span className="font-mono text-4xl font-black text-indigo-400">{(opponentScore || 0)} / 30</span>
                    <span className="text-[10px] text-slate-500 font-bold">Opponent result flow</span>
                    <div className="flex items-center gap-1">
                      {winnerPlayerId === 'YOU' ? (
                        <span className="text-rose-500 flex items-center gap-0.5 text-xs font-bold"><TrendingDown className="w-4.5 h-4.5" /> -{challenge.pointsGuarantee.toFixed(2)} PTS</span>
                      ) : winnerPlayerId === 'Draw (Tie)' ? (
                        <span className="text-amber-500 text-xs font-bold"><RefreshCcw className="w-4 h-4" /> Refunded</span>
                      ) : (
                        <span className="text-emerald-500 flex items-center gap-0.5 text-xs font-bold"><TrendingUp className="w-4.5 h-4.5" /> +{challenge.pointsGuarantee.toFixed(2)} PTS</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Explanations of correct answers */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5 border-b border-purple-900/20 pb-2">
                    <BookOpen className="w-4 h-4 text-purple-400" /> Academic Proof Solutions (Review key scientific concepts)
                  </h3>
                  <div className="space-y-3.5 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                    {SCIENCE_QUESTIONS.map((q, idx) => {
                      const myAnsIdx = selectedAnswers[idx];
                      const isCorrect = myAnsIdx === q.correctOptionIndex;

                      return (
                        <div key={idx} className="p-4 rounded-xl bg-slate-950/50 border border-purple-900/10 space-y-2 text-left">
                          <p className="text-xs font-extrabold text-white">
                            <span className="font-mono text-purple-400">Q{idx + 1}.</span> {q.question}
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-bold">
                            <p className="text-slate-400">Your choice: <span className={isCorrect ? 'text-emerald-400' : 'text-rose-400'}>{myAnsIdx === -1 ? 'None' : q.options[myAnsIdx]}</span></p>
                            <p className="text-emerald-400">Correct choice: <span>{q.options[q.correctOptionIndex]}</span></p>
                          </div>
                          <p className="text-[10px] text-slate-500 leading-relaxed pt-1 border-t border-purple-900/5">
                            <strong>Explanation:</strong> {q.explanation}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Back button */}
                <div className="text-center pt-4">
                  <button
                    onClick={onClose}
                    className="px-8 py-3.5 bg-purple-900 hover:bg-purple-800 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-colors active:scale-95 cursor-pointer"
                  >
                    Return to Student Dashboard
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT COLUMN: MINI INTERACTIVE MAP PANEL */}
        <div className="lg:col-span-4 space-y-6">
          {/* Question Grid Map */}
          <div className="bg-slate-900/90 rounded-[2rem] border border-purple-500/20 p-5 md:p-6 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Question Combat Map</h3>
            <p className="text-[10px] text-slate-500 leading-normal">
              Click any node below to load that question instantly. Green indicates selected answer, purple outlines your active view.
            </p>

            <div className="grid grid-cols-5 gap-2.5">
              {SCIENCE_QUESTIONS.map((_, idx) => {
                const isSelected = selectedAnswers[idx] !== -1;
                const isActive = activeQuestionIdx === idx;

                return (
                  <button
                    key={idx}
                    onClick={() => setActiveQuestionIdx(idx)}
                    className={`w-full py-2.5 rounded-xl font-mono text-xs font-black border transition-all text-center ${
                      isActive 
                        ? 'bg-purple-600 border-purple-400 text-white shadow-md shadow-purple-500/20 ring-2 ring-purple-500/40 scale-105'
                        : isSelected
                          ? 'bg-purple-900/20 border-purple-500/40 text-purple-300'
                          : 'bg-slate-950 border-purple-900/20 text-slate-500 hover:border-purple-800/40'
                    }`}
                  >
                    Q{idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-4 pt-2 text-[9px] text-slate-400 font-black uppercase tracking-wider border-t border-purple-900/20">
              <div className="flex items-center gap-1">
                <span className="w-3.5 h-3.5 rounded bg-purple-900/30 border border-purple-500/40 block" /> Answered
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3.5 h-3.5 rounded bg-slate-950 border border-purple-900/20 block" /> Unanswered
              </div>
            </div>
          </div>

          {/* Guidelines Box */}
          <div className="bg-slate-900/90 rounded-[2rem] border border-purple-500/20 p-5 md:p-6 text-slate-400 text-[11px] leading-relaxed space-y-3.5">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-300">Assessment Protocol</h4>
            <ul className="list-disc pl-4 space-y-2 font-medium">
              <li>You have 30 minutes total synced with server start coordinates.</li>
              <li>Leaving or refreshing the page WILL NOT halt the timer; the clock remains active.</li>
              <li>Auto-saving keeps your progress continuously backed up online.</li>
              <li>The first submission or timer expiry resolves and distributes the guarantee pool securely.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
