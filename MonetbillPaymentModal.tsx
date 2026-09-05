import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Smartphone, CreditCard, ShieldCheck, Loader2, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import { Language } from '../constants/translations';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, updateDoc, collection, addDoc } from 'firebase/firestore';

interface MonetbillPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  amount: number;
  purpose: 'weekly_sub' | 'monthly_sub' | 'yearly_sub' | 'tournament' | 'formation';
  purposeLabel: string;
  onSuccess: (data: { paymentMethod: string; phone: string; transactionId: string }) => void;
}

export default function MonetbillPaymentModal({
  isOpen,
  onClose,
  language,
  amount,
  purpose,
  purposeLabel,
  onSuccess
}: MonetbillPaymentModalProps) {
  const [phone, setPhone] = useState('');
  const [payerName, setPayerName] = useState('');
  const [email, setEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'mtn' | 'orange' | 'card'>('mtn');
  const [step, setStep] = useState<'details' | 'push_simulation' | 'checkout_redirect' | 'processing' | 'success'>('details');
  const [simulatedBalance, setSimulatedBalance] = useState<'sufficient' | 'insufficient'>('sufficient');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loadingMessage, setLoadingMessage] = useState('');
  const [activeInterval, setActiveInterval] = useState<any>(null);
  const [checkoutUrl, setCheckoutUrl] = useState('');
  const MERCHANT_ACCOUNT = "Monetbill-Merchant";

  // Cleanup polling interval on close or unmount
  useEffect(() => {
    return () => {
      if (activeInterval) {
        clearInterval(activeInterval);
      }
    };
  }, [activeInterval]);

  if (!isOpen) return null;

  const handleClose = () => {
    if (activeInterval) {
      clearInterval(activeInterval);
      setActiveInterval(null);
    }
    setError('');
    setStep('details');
    onClose();
  };

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (paymentMethod !== 'card' && !phone.trim()) {
      setError(language === 'FRENCH' ? 'Veuillez entrer votre numéro de téléphone' : 'Please enter your phone number');
      return;
    }
    if (!payerName.trim()) {
      setError(language === 'FRENCH' ? 'Veuillez entrer votre nom complet' : 'Please enter your full name');
      return;
    }

    setStep('processing');
    setLoadingMessage(language === 'FRENCH'
      ? `Initialisation de la transaction Monetbill...`
      : `Initializing secure Monetbill transaction...`);
    
    try {
      const payloadEmail = email.trim() || `${phone.replace(/\D/g, '') || Date.now()}@student.nc.edu`;
      const response = await fetch('/api/payment/collect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          phone: phone.trim(),
          email: payloadEmail,
          description: `Upgrade: ${purposeLabel}`,
          external_reference: `NC-${purpose}-${Date.now()}`,
          paymentMethod
        })
      });

      const rawResponseText = await response.text();
      let data: any = {};
      try {
        data = JSON.parse(rawResponseText);
      } catch (jsonErr) {
        console.error("Monetbill response was not JSON:", rawResponseText);
        setError(language === 'FRENCH'
          ? `Erreur de la plateforme Monetbill. Détails: ${rawResponseText.slice(0, 150)}`
          : `Monetbill platform responded with an unexpected status: ${rawResponseText.slice(0, 150)}`);
        setStep('details');
        return;
      }

      if (!response.ok) {
        console.error("Monetbill collection initiation failed:", data);
        
        if (response.status === 401 || data.error?.includes("Authentication") || data.message?.includes("key")) {
          setError(language === 'FRENCH'
            ? `Le mode de paiement en direct n'est pas encore configuré (clés d'API Monetbill manquantes).`
            : `Live Monetbill payments are currently unconfigured on the server. Please define MONETBIL_SERVICE_KEY.`);
          setStep('details');
        } else {
          setError(data.message || data.error || (language === 'FRENCH' ? 'Impossible d\'initier la demande de paiement.' : 'Failed to initiate payment request.'));
          setStep('details');
        }
        return;
      }

      // Initiation succeeded! We get a transaction reference and optional authorization checkout URL
      const reference = data.reference;
      console.log("Monetbill payment initialized. Reference:", reference);

      // Check if we received a secure hosted checkout URL from Monetbill
      if (data.authorization_url) {
        setCheckoutUrl(data.authorization_url);
        setStep('checkout_redirect');
        
        // Start background status polling so the user's upgrade automatically fires upon completion
        const interval = startPolling(reference);
        setActiveInterval(interval);
      } else {
        // If no checkout URL but successful, poll status directly
        const interval = startPolling(reference);
        setActiveInterval(interval);
      }

    } catch (err: any) {
      console.error("Failed to connect to Monetbill API:", err);
      setError(language === 'FRENCH' 
        ? 'Erreur de connexion. Impossible d\'initier le paiement de manière sécurisée.' 
        : 'Connection error. Unable to securely initiate payment.');
      setStep('details');
    }
  };

  const startPolling = (reference: string) => {
    let attempts = 0;
    const maxAttempts = 45; // 45 * 4s = 180s (3 minutes maximum timeout)
    
    const interval = setInterval(async () => {
      attempts++;
      if (attempts > maxAttempts) {
        clearInterval(interval);
        setError(language === 'FRENCH' 
          ? 'La transaction a expiré. Veuillez réessayer.' 
          : 'The transaction timed out. Please try again.');
        setStep('details');
        return;
      }

      try {
        const response = await fetch(`/api/payment/status/${reference}`);
        if (!response.ok) {
          console.warn("Polling status response not OK, continuing polling...");
          return;
        }

        const data = await response.json();
        console.log("Monetbill status check response:", data);

        if (data.status === 'SUCCESSFUL') {
          clearInterval(interval);
          handlePaymentSuccess(reference, data.phone || phone);
        } else if (data.status === 'FAILED') {
          clearInterval(interval);
          setError(language === 'FRENCH' 
            ? 'La transaction a échoué ou a été rejetée par l\'opérateur.' 
            : 'The transaction failed or was rejected by the operator.');
          setStep('details');
        } else {
          // Still PENDING
          console.log(`Polling Monetbill reference ${reference}: status is ${data.status}`);
        }
      } catch (err) {
        console.error("Error polling Monetbill status:", err);
      }
    }, 4000); // Poll every 4 seconds

    return interval;
  };

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!pin.trim() || pin.length < 4) {
      setError(language === 'FRENCH' ? 'Code PIN invalide (4 chiffres requis)' : 'Invalid PIN code (4 digits required)');
      return;
    }

    if (simulatedBalance === 'insufficient') {
      setError(language === 'FRENCH' 
        ? `Échec de la transaction: Le solde de votre compte est insuffisant sur +237 ${phone} pour transférer ${amount.toLocaleString()} FCFA.` 
        : `Transaction Failed: Insufficient mobile money balance on +237 ${phone} to complete ${amount.toLocaleString()} FCFA.`);
      return;
    }

    setStep('processing');
    setLoadingMessage(language === 'FRENCH' ? 'Traitement de la simulation...' : 'Processing Sandbox Payment...');
    simulatePayment();
  };

  const handlePaymentSuccess = async (transactionId: string, verifiedPhone: string) => {
    const currentUser = auth.currentUser;
    try {
      await addDoc(collection(db, 'campay_transactions'), {
        merchantAccount: MERCHANT_ACCOUNT,
        payerName,
        payerPhone: verifiedPhone || phone || 'MONETBIL-CMM',
        amount,
        paymentMethod,
        purpose,
        purposeLabel,
        transactionId,
        timestamp: new Date().toISOString(),
        status: "SUCCESS",
        userId: currentUser ? currentUser.uid : 'anonymous',
        gateway: "monetbill"
      });
    } catch (dbErr) {
      console.error("Failed to log transaction in Firestore: ", dbErr);
    }

    setStep('success');
    setTimeout(() => {
      onSuccess({
        paymentMethod,
        phone: verifiedPhone || phone || 'MONETBIL-CMM',
        transactionId
      });
      setStep('details');
      setPhone('');
      setPayerName('');
      setEmail('');
      setPin('');
    }, 4000);
  };

  const simulatePayment = async () => {
    const transactionId = `MONETBIL-SIM-${Math.floor(100000 + Math.random() * 900000)}`;
    const currentUser = auth.currentUser;
    try {
      await addDoc(collection(db, 'campay_transactions'), {
        merchantAccount: MERCHANT_ACCOUNT,
        payerName,
        payerPhone: phone || 'MONETBIL-CARD',
        amount,
        paymentMethod,
        purpose,
        purposeLabel,
        transactionId,
        timestamp: new Date().toISOString(),
        status: "SUCCESS",
        userId: currentUser ? currentUser.uid : 'anonymous',
        gateway: "monetbill_simulated"
      });
    } catch (dbErr) {
      console.error("Failed to log simulated transaction: ", dbErr);
    }

    setTimeout(() => {
      setStep('success');
      setTimeout(() => {
        onSuccess({
          paymentMethod,
          phone: phone || 'MONETBIL-CARD',
          transactionId
        });
        setStep('details');
        setPhone('');
        setPayerName('');
        setEmail('');
        setPin('');
      }, 4000);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center bg-slate-900/90 backdrop-blur-md p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white w-full max-w-md rounded-[2.2rem] shadow-2xl overflow-hidden border border-slate-100 flex flex-col relative font-sans"
      >
        {/* Header - Brand color updated to warm Monetbill Orange-Yellow */}
        <div className="bg-gradient-to-r from-orange-600 to-amber-600 text-white p-6 flex justify-between items-center border-b border-orange-700">
          <div className="flex items-center gap-2.5">
            <div className="bg-white text-orange-600 px-2.5 py-1.5 rounded-xl font-black text-sm shadow-md">
              MB
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight flex items-center gap-1">
                <span>Monetbill Checkout</span>
                <span className="text-[9px] bg-emerald-500 text-white px-1.5 py-0.5 rounded-full font-bold">SECURED</span>
              </h3>
              <p className="text-[10px] text-orange-100 font-semibold">{language === 'FRENCH' ? 'Paiement Multicanal Sécurisé' : 'Multichannel Secure Payments'}</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-1.5 hover:bg-white/15 rounded-full text-white cursor-pointer transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Ribbon */}
        <div className="bg-slate-50 border-b border-slate-100 px-6 py-3 flex justify-between items-center text-xs font-bold text-slate-700">
          <span className="text-slate-400 capitalize">{purposeLabel}</span>
          <span className="text-orange-600 font-mono text-sm">{amount.toLocaleString()} FCFA</span>
        </div>

        {/* Content Wrapper */}
        <div className="p-6 md:p-8 flex flex-col">
          {error && (
            <div className="mb-4 bg-rose-50 border border-rose-100 text-rose-700 p-4 rounded-2xl text-xs font-bold flex flex-col gap-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                <span>{error}</span>
              </div>
              {(error.includes("unconfigured") || error.includes("configuré") || error.includes("API Key Not Set") || error.includes("API key") || error.includes("Key Not Set") || error.includes("unconfigured")) && (
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setStep('push_simulation');
                  }}
                  className="mt-1 w-full py-2.5 px-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-black text-center rounded-xl text-[10px] tracking-wider uppercase transition-all shadow-xs shrink-0 cursor-pointer"
                >
                  {language === 'FRENCH' ? "⚡ Utiliser le Simulateur de Test Sandbox" : "⚡ Switch to Sandbox Test Simulator"}
                </button>
              )}
            </div>
          )}

          {step === 'details' && (
            <form onSubmit={handleNext} className="space-y-4">
              <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl flex items-center justify-between shadow-xs mb-2">
                <div>
                  <span className="block text-[9px] font-bold text-orange-600 uppercase tracking-widest leading-none mb-1 font-sans">Merchant Account</span>
                  <span className="text-xs font-black text-orange-950">
                    NC.edu (National Companion)
                  </span>
                </div>
                <div className="text-right">
                  <span className="block text-[9px] font-bold text-orange-600 uppercase tracking-widest leading-none mb-1 font-sans">Total Payable</span>
                  <span className="text-xs font-black text-slate-900 font-mono">
                    {amount.toLocaleString()} FCFA
                  </span>
                </div>
              </div>

              <div className="text-center mb-2">
                <p className="text-xs text-slate-500 font-semibold leading-normal font-sans">
                  {language === 'FRENCH' 
                    ? 'Choisissez votre méthode de paiement (MoMo, Orange Money ou Carte Bancaire). Vos fonds seront transférés en toute sécurité.'
                    : 'Choose your preferred payment method (MoMo, Orange Money, or Credit Card). Payments are processed securely via Monetbill.'}
                </p>
              </div>

              {/* Selector */}
              <div className="grid grid-cols-3 gap-2 font-sans">
                <button
                  type="button"
                  onClick={() => { setPaymentMethod('mtn'); setError(''); }}
                  className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                    paymentMethod === 'mtn' 
                      ? 'border-yellow-400 bg-yellow-50/50 text-[#fca311]' 
                      : 'border-slate-100 hover:border-slate-200 text-slate-400'
                  }`}
                >
                  <Smartphone className="w-5 h-5" />
                  <span className="text-[9px] font-black tracking-widest block">MTN MOMO</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setPaymentMethod('orange'); setError(''); }}
                  className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                    paymentMethod === 'orange' 
                      ? 'border-orange-500 bg-orange-50/50 text-orange-600' 
                      : 'border-slate-100 hover:border-slate-200 text-slate-400'
                  }`}
                >
                  <Smartphone className="w-5 h-5" />
                  <span className="text-[9px] font-black tracking-widest block">ORANGE</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setPaymentMethod('card'); setError(''); }}
                  className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                    paymentMethod === 'card' 
                      ? 'border-orange-600 bg-orange-50/50 text-orange-600' 
                      : 'border-slate-100 hover:border-slate-200 text-slate-400'
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                  <span className="text-[9px] font-black tracking-widest block">BANK CARD</span>
                </button>
              </div>

              {/* Form Input fields */}
              <div className="space-y-3 font-sans mt-4">
                <div>
                  <label className="text-[9px] text-orange-950 font-black tracking-widest uppercase block mb-1">PAYER FULL NAME</label>
                  <input
                    type="text"
                    placeholder="e.g. Jean Dupont"
                    value={payerName}
                    onChange={e => setPayerName(e.target.value)}
                    required
                    className="w-full border border-slate-200 focus:border-orange-500 bg-slate-50/50 rounded-xl p-3 text-xs font-bold outline-none shadow-inner"
                  />
                </div>

                <div>
                  <label className="text-[9px] text-orange-950 font-black tracking-widest uppercase block mb-1">PAYER EMAIL ADDRESS (OPTIONAL)</label>
                  <input
                    type="email"
                    placeholder="e.g. jean.dupont@gmail.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full border border-slate-200 focus:border-orange-500 bg-slate-50/50 rounded-xl p-3 text-xs font-bold outline-none shadow-inner"
                  />
                </div>

                {paymentMethod !== 'card' && (
                  <div>
                    <label className="text-[9px] text-orange-950 font-black tracking-widest uppercase block mb-1">
                      {paymentMethod === 'mtn' ? 'MTN MOBILE MONEY PHONE' : 'ORANGE MONEY PHONE'}
                    </label>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs font-mono">
                        +237
                      </div>
                      <input
                        type="tel"
                        maxLength={9}
                        placeholder="677224112"
                        value={phone}
                        onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                        required
                        className="w-full border border-slate-200 focus:border-orange-500 bg-slate-50/50 rounded-xl py-3 pl-14 pr-4 text-xs font-mono font-bold outline-none shadow-inner"
                      />
                    </div>
                  </div>
                )}

                {paymentMethod === 'card' && (
                  <div className="bg-orange-50/50 border border-orange-150 p-4 rounded-xl">
                    <p className="text-[11px] text-orange-950 font-semibold leading-relaxed">
                      {language === 'FRENCH'
                        ? 'Pour les cartes bancaires, Monetbill ouvrira une passerelle sécurisée cryptée pour saisir votre numéro de carte.'
                        : 'For card payments, Monetbill will open a secure encrypted checkout screen to enter your card details.'}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-4">
                <button
                  type="submit"
                  className="w-full py-4 text-white font-black rounded-2xl text-xs uppercase tracking-widest cursor-pointer shadow-lg transform transition-all active:scale-95 bg-gradient-to-r from-orange-600 to-amber-600 hover:shadow-orange-300"
                >
                  {language === 'FRENCH' 
                    ? `PAYER AVEC MONETBILL (${amount.toLocaleString()} FCFA)`
                    : `PAY WITH MONETBILL (${amount.toLocaleString()} FCFA)`}
                </button>
              </div>

              <div className="flex flex-col items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setStep('push_simulation');
                  }}
                  className="text-[10px] text-orange-600 hover:text-orange-700 font-black tracking-wider uppercase underline transition-colors cursor-pointer"
                >
                  {language === 'FRENCH' ? "🔬 Basculer en mode test Sandbox" : "🔬 Switch to Sandbox Test Simulator"}
                </button>
                <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Secured and Automated by Monetbill</span>
                </div>
              </div>
            </form>
          )}

          {step === 'push_simulation' && (
            <div className="space-y-4">
              <div className="bg-orange-50 border border-orange-150 rounded-2xl p-3.5 flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                <div className="text-[11.5px] leading-relaxed text-orange-950 font-extrabold font-sans">
                  {language === 'FRENCH' 
                    ? `SÉCURISÉ : Simulateur USSD de Monetbill pour les tests d'intégration locale.`
                    : `SECURED TRANSFER: Mocking Monetbill Mobile Money validation for sandbox testing.`}
                </div>
              </div>

              <div className="space-y-1.5 p-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-sans">
                <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">
                  Simulate Account Balance
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => { setSimulatedBalance('sufficient'); setError(''); }}
                    className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 font-bold transition-all cursor-pointer ${
                      simulatedBalance === 'sufficient' 
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800' 
                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Sufficient
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSimulatedBalance('insufficient'); setError(''); }}
                    className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 font-bold transition-all cursor-pointer ${
                      simulatedBalance === 'insufficient' 
                        ? 'bg-rose-50 border-rose-500 text-rose-800' 
                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    Insufficient
                  </button>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-[1.8rem] border-[6px] border-slate-800 shadow-xl max-w-[290px] mx-auto overflow-hidden text-white font-sans">
                <div className="flex justify-center mb-3">
                  <div className="w-16 h-3 bg-slate-800 rounded-full flex items-center justify-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                    <div className="w-4 h-1 bg-slate-900 rounded-full" />
                  </div>
                </div>

                <div className="flex justify-between items-center text-[8px] font-bold text-slate-400 px-1 mb-3">
                  <span>9:41 AM</span>
                  <div className="flex items-center gap-1">
                    <span>{paymentMethod === 'mtn' ? 'MTN CMR' : 'Orange CM'}</span>
                    <span>📶 4G</span>
                    <span>🔋 88%</span>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-3 shadow-inner">
                  <div className="flex items-center gap-1.5 text-[9px] font-extrabold text-orange-400 mb-1.5">
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Monetbill MoMo Simulation</span>
                  </div>

                  <p className="text-[10px] font-semibold text-slate-100 leading-normal mb-3">
                    {language === 'FRENCH'
                      ? `Monetbill demande de retirer ${amount.toLocaleString()} FCFA de votre compte pour crédit direct vers NC.edu. Entrez votre PIN de validation :`
                      : `Monetbill requests to retrieve ${amount.toLocaleString()} FCFA from your mobile wallet, routed to NC.edu. Enter PIN to authorize:`}
                  </p>

                  <form onSubmit={handleVerifyPin} className="space-y-3">
                    <input
                      type="password"
                      maxLength={4}
                      placeholder="PIN"
                      value={pin}
                      onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                      required
                      className="w-full bg-slate-900 border border-white/10 focus:border-orange-400 rounded-xl py-2 px-3 text-center text-sm font-mono font-black outline-none tracking-widest text-orange-400"
                    />

                    <div className="grid grid-cols-2 gap-2 text-[9px] font-black uppercase tracking-wider text-center pt-1">
                      <button
                        type="button"
                        onClick={() => { setStep('details'); setPin(''); setError(''); }}
                        className="py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-slate-300"
                      >
                        CANCEL
                      </button>
                      <button
                        type="submit"
                        className="py-1.5 bg-gradient-to-r from-orange-500 to-amber-600 rounded-lg text-white font-black shadow-md"
                      >
                        APPROVE
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {step === 'checkout_redirect' && (
            <div className="py-6 flex flex-col items-center justify-center space-y-4 text-center font-sans">
              <div className="w-12 h-12 rounded-full flex items-center justify-center animate-bounce bg-orange-50 text-orange-650">
                <ExternalLink className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h4 className="font-black text-slate-800 text-sm">
                  {language === 'FRENCH' ? 'Session de Paiement Prête !' : 'Payment Session Created !'}
                </h4>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed max-w-xs">
                  {language === 'FRENCH'
                    ? "Veuillez cliquer sur le bouton ci-dessous pour effectuer votre paiement en toute sécurité. Une fois le paiement validé, cette fenêtre se mettra à jour automatiquement."
                    : "Please click the button below to complete your payment on Monetbill's secure payment screen. This modal will update automatically upon success."}
                </p>
              </div>

              <a
                href={checkoutUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 text-white font-black rounded-2xl text-xs uppercase tracking-widest cursor-pointer shadow-lg transform transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:shadow-orange-300"
              >
                <span>
                  {language === 'FRENCH' ? 'OUVRIR MONETBILL' : 'PROCEED TO MONETBILL'}
                </span>
                <ExternalLink className="w-4 h-4" />
              </a>

              <div className="flex items-center gap-2 text-[11px] text-slate-400 font-semibold">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-600" />
                <span>Waiting for transaction authorization...</span>
              </div>
            </div>
          )}

          {step === 'processing' && (
            <div className="py-12 flex flex-col items-center justify-center space-y-4 text-center font-sans">
              <Loader2 className="w-12 h-12 text-orange-600 animate-spin" />
              <div>
                <h4 className="font-black text-slate-800 text-sm">
                  {loadingMessage || (language === 'FRENCH' ? 'Traitement en cours...' : 'Processing transaction...')}
                </h4>
                {paymentMethod !== 'card' && (
                  <div className="mt-4 p-3.5 bg-orange-50 border border-orange-100 rounded-2xl text-left max-w-xs mx-auto shadow-sm">
                    <p className="text-[11px] text-orange-950 font-extrabold leading-normal">
                      {language === 'FRENCH'
                        ? `👉 Un message pop-up de confirmation de transaction a été envoyé au numéro ${phone}. Veuillez entrer votre code PIN Mobile Money sur votre téléphone pour valider le paiement.`
                        : `👉 A transaction confirmation prompt has been sent to ${phone}. Please enter your Mobile Money PIN on your phone to validate the payment.`}
                    </p>
                  </div>
                )}
                <p className="text-[11px] text-slate-400 font-semibold max-w-xs leading-normal mt-4">
                  {language === 'FRENCH'
                    ? "Veuillez ne pas fermer cette fenêtre. Nous vérifions le statut de la transaction automatiquement..."
                    : "Do not close this window. We are checking the transaction status automatically..."}
                </p>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="py-4 flex flex-col items-center justify-center space-y-4 font-sans">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center p-2 shadow-lg shadow-emerald-100">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              
              <div className="text-center space-y-1">
                <h4 className="font-black text-emerald-800 text-sm">
                  {language === 'FRENCH' ? 'Paiement Confirmé !' : 'Secure Payment Confirmed !'}
                </h4>
                <p className="text-[10px] text-slate-400 font-extrabold tracking-widest uppercase">
                  Verified by Monetbill Gateway
                </p>
              </div>

              {/* SMS inbox mock */}
              <div className="w-full max-w-[290px] bg-[#f8fafc] border border-slate-200/60 rounded-2xl p-3 shadow-sm relative text-left">
                <div className="absolute right-3.5 top-3.5 text-[8.5px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                  SMS INBOX
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-6 h-6 rounded-lg text-white font-black text-[10px] flex items-center justify-center ${paymentMethod === 'mtn' ? 'bg-[#ffcc00] text-slate-900' : 'bg-orange-550'}`}>
                    {paymentMethod === 'mtn' ? 'M' : 'O'}
                  </div>
                  <div>
                    <h5 className="text-[9px] font-black text-slate-700 uppercase tracking-wider">{paymentMethod === 'mtn' ? 'MobileMoney' : 'OrangeMoney'}</h5>
                    <p className="text-[7.5px] text-slate-400 leading-none">Just now</p>
                  </div>
                </div>

                <p className="text-[10px] font-semibold text-slate-600 leading-normal font-mono bg-white p-2.5 rounded-xl border border-slate-100">
                  {paymentMethod === 'mtn' ? (
                    `Y'ello, successful payment of ${amount.toLocaleString()} FCFA from your wallet to NC.edu. Powered by Monetbill.`
                  ) : (
                    `Success: ${amount.toLocaleString()} FCFA paid to NC.edu. Powered by Monetbill.`
                  )}
                </p>
              </div>

              <div className="flex items-center justify-center gap-1 text-[9px] text-slate-400 font-extrabold max-w-xs text-center border-t border-slate-150 pt-2.5 w-full">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>UPGRADE ACTIVATED - SECURE SYNC COMPLETE</span>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
