import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Check, Flame, Star, AlertTriangle, ShieldCheck, X } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

interface PremiumOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  userData: any;
  language: string;
  onSubscribeClick: () => void;
}

const PREMIUM_ITEMS = {
  ENGLISH: [
    'Unlimited AI Photo Document Scans to solve academic exercises',
    '24/7 Unlimited AI Homework & Exam Assistant conversations',
    'Advanced study challenges and customized academic path models',
    'Early access to elite Cameroon, US, and regional tutors'
  ],
  FRENCH: [
    'Scans de documents photo IA illimités pour résoudre vos exercices',
    'Discussions illimitées 24/7 avec le tuteur académique IA',
    'Défis d\'apprentissage avancés et plans d\'études personnalisés',
    'Accès exclusif aux meilleurs tuteurs régionaux et internationaux'
  ],
  SPANISH: [
    'Escaneos de documentos fotográficos con IA ilimitados para resolver tareas',
    'Conversaciones ilimitadas 24/7 con el tutor académico de IA',
    'Desafíos de estudio avanzados y modelos de rutas de estudio a medida',
    'Acceso prioritario a tutores de élite nacionales e internacionales'
  ],
  CHINESE: [
    '无限次 AI 学术文档照片扫描，助你轻松解题',
    '24小时不限流 AI 作业与考研提问聊天系统',
    '高级定制化学术进阶挑战和个性化学习规划',
    '独家直通非洲、欧美等地区最顶尖的精英导师'
  ]
};

export default function PremiumOnboardingModal({ 
  isOpen, 
  onClose, 
  userData, 
  language,
  onSubscribeClick 
}: PremiumOnboardingModalProps) {
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const lang = (language === 'FRENCH' || language === 'CHINESE' || language === 'SPANISH') ? language : 'ENGLISH';
  const premiumList = PREMIUM_ITEMS[lang];

  // Localized texts
  const t = {
    ENGLISH: {
      alertTitle: "Premium Academic Features",
      alertSubtitle: "Unlock elite tools and elevate your learning boundaries on NC.edu.",
      benefitHeader: "Active Premium Benefits",
      trialBtn: "Activate 7-Day Free Trial",
      subsBtn: "Subscribe Now",
      trialSuccess: "🎉 7-Day Trial Activated! Enjoy full premium workspace powers.",
      subText: "Start learning with unlimited scans & tutor support.",
      noThanks: "Continue with basic free version",
      loading: "Activating Trial...",
      trialDisclaimer: "After 7 days, your free trial will expire and premium features will revert back to paid status automatically."
    },
    FRENCH: {
      alertTitle: "Fonctionnalités Académiques Premium",
      alertSubtitle: "Débloquez des outils d'élite et repoussez vos limites d'apprentissage sur NC.edu.",
      benefitHeader: "Avantages Premium Actifs",
      trialBtn: "Activer l'essai gratuit de 7 jours",
      subsBtn: "S'abonner maintenant",
      trialSuccess: "🎉 Essai de 7 jours activé ! Profitez de la puissance premium.",
      subText: "Commencez à apprendre avec des numérisations et un support tuteur illimités.",
      noThanks: "Continuer avec la version gratuite de base",
      loading: "Activation...",
      trialDisclaimer: "Après 7 jours, votre essai gratuit expirera et les fonctionnalités premium redeviendront payantes automatiquement."
    },
    SPANISH: {
      alertTitle: "Funciones Académicas Premium",
      alertSubtitle: "Desbloquea herramientas de élite y eleva tus límites de aprendizaje en NC.edu.",
      benefitHeader: "Beneficios de la suscripción Premium",
      trialBtn: "Activar prueba gratuita de 7 días",
      subsBtn: "Suscribirse ahora",
      trialSuccess: "🎉 ¡Prueba de 7 días activada! Disfrute de los poderes premium del área de trabajo.",
      noThanks: "Continuar con la versión gratuita básica",
      loading: "Activando prueba...",
      subText: "Comience a aprender con escaneos ilimitados y soporte del tutor de IA.",
      trialDisclaimer: "Después de 7 días, sus beneficios de prueba vencerán y todas las funciones volverán a requerir un pago."
    },
    CHINESE: {
      alertTitle: "NC.edu 高级学术特权",
      alertSubtitle: "解锁顶尖人工智能学习辅助，助你在学业挑战中傲视群雄。",
      benefitHeader: "尊享特权内容一览",
      trialBtn: "立享 7 天免费尊享试用",
      subsBtn: "即刻开通尊享会员",
      trialSuccess: "🎉 7 天尊享试用开通成功！尽享终极全功能特权版空间。",
      noThanks: "继续使用基础免费功能",
      loading: "正在激活...",
      subText: "无上限扫描与AI解答已为你解锁。",
      trialDisclaimer: "7天免费试用期过后，系统将自动恢复您的普通卡限制，无法继续免费使用尊享特权功能。"
    }
  }[lang];

  const handleStartTrial = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const uid = auth.currentUser?.uid;
      if (uid) {
        const userRef = doc(db, 'users', uid);
        const newTrialEnds = new Date();
        newTrialEnds.setDate(newTrialEnds.getDate() + 7);

        await updateDoc(userRef, {
          trialStartedAt: new Date().toISOString(),
          trialEndsAt: Timestamp.fromDate(newTrialEnds),
          hasUsedTrial: true
        });
        setSuccessMsg(t.trialSuccess);
        setTimeout(() => {
          onClose();
        }, 2200);
      } else {
        alert("Unable to identify signed-in student credentials. Please log in again.");
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to start 7-day trial. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div id="premium-onboarding-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 30 }}
            className="relative bg-[#ffffff] w-full max-w-lg rounded-[32px] shadow-3xl overflow-hidden border border-slate-100 flex flex-col"
          >
            {/* Ambient gold glow background decoration */}
            <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-[#ffeed3]/50 via-white/0 to-white/0 pointer-events-none" />

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 bg-slate-50 hover:bg-slate-100/80 rounded-full transition-colors text-slate-400 hover:text-slate-600 z-10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-8 sm:p-10 flex-1 overflow-y-auto max-h-[85vh] relative">
              {/* Header Visual */}
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-amber-100 text-amber-700 rounded-2xl animate-pulse">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                    {t.alertTitle}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {t.alertSubtitle}
                  </p>
                </div>
              </div>

              {/* Status Message or Success Message */}
              {successMsg ? (
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 text-center my-6"
                >
                  <p className="text-sm font-bold text-emerald-800 leading-relaxed">
                    {successMsg}
                  </p>
                </motion.div>
              ) : (
                <>
                  {/* Premium Perks Grid */}
                  <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-4 mb-6">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      {t.benefitHeader}
                    </h4>
                    <ul className="space-y-3">
                      {premiumList.map((perk, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <div className="bg-amber-100 text-amber-800 rounded-full p-1 mt-0.5 shrink-0">
                            <Check className="w-3 h-3" />
                          </div>
                          <span className="text-xs font-semibold text-slate-700 leading-normal">
                            {perk}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Actions Area */}
                  <div className="space-y-3">
                    {userData?.trialStartedAt || userData?.hasUsedTrial || userData?.trialEndsAt ? (
                      <button
                        disabled
                        className="w-full py-4 bg-slate-150 border border-slate-200 text-slate-400 font-extrabold text-xs rounded-2xl flex items-center justify-center gap-2 cursor-not-allowed"
                      >
                        <Flame className="w-5 h-5 text-slate-300 fill-slate-300" />
                        {language === 'FRENCH' ? "Essai déjà activé / expiré" : 
                         language === 'SPANISH' ? "Prueba ya activada / vencida" :
                         language === 'CHINESE' ? "试用已激活 / 已过期" : "7-Day Free Trial Already Used"}
                      </button>
                    ) : (
                      <button
                        onClick={handleStartTrial}
                        disabled={loading}
                        className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-amber-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Flame className="w-5 h-5 text-white fill-white" />
                        {loading ? t.loading : t.trialBtn}
                      </button>
                    )}

                    <button
                      onClick={() => {
                        onSubscribeClick();
                        onClose();
                      }}
                      className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-2xl shadow-lg hover:shadow-blue-200 transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <ShieldCheck className="w-5 h-5" />
                      {t.subsBtn}
                    </button>
                    
                    <p className="text-[10px] text-slate-400 font-semibold leading-relaxed py-1 flex items-start gap-1">
                      <AlertTriangle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      {t.trialDisclaimer}
                    </p>

                    <div className="pt-4 border-t border-slate-100 flex justify-center">
                      <button
                        onClick={onClose}
                        className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest cursor-pointer"
                      >
                        {t.noThanks}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
