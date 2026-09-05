import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Shield, FileText } from 'lucide-react';
import { TERMS_AND_CONDITIONS, PRIVACY_POLICY } from '../constants/legal';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'terms' | 'privacy';
}

const LegalModal: React.FC<LegalModalProps> = ({ isOpen, onClose, type }) => {
  const content = type === 'terms' ? TERMS_AND_CONDITIONS : PRIVACY_POLICY;
  const title = type === 'terms' ? 'Terms of Service' : 'Privacy Policy';
  const Icon = type === 'terms' ? FileText : Shield;

  return (
    <AnimatePresence>
      {isOpen && (
        <div id="legal-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <motion.div 
                  initial={{ rotate: -20, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  className="p-2 bg-blue-100 rounded-xl text-blue-600"
                >
                  <Icon className="w-5 h-5" />
                </motion.div>
                <motion.h2 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-xl font-bold text-slate-800"
                >
                  {title}
                </motion.h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 prose prose-slate">
              <motion.div
                initial="hidden"
                animate="visible"
                variants={{
                  visible: { 
                    transition: { 
                      staggerChildren: 0.05,
                      delayChildren: 0.2
                    } 
                  }
                }}
                className="text-slate-600 leading-relaxed text-sm"
              >
                {content.split('\n').filter(p => p.trim() !== '').map((paragraph, index) => (
                  <motion.p
                    key={index}
                    variants={{
                      hidden: { opacity: 0, y: 10 },
                      visible: { opacity: 1, y: 0 }
                    }}
                    className={paragraph.match(/^\d+\./) ? "font-bold text-slate-800 mt-6 mb-2" : "mb-3"}
                  >
                    {paragraph}
                  </motion.p>
                ))}
              </motion.div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button
                onClick={onClose}
                className="px-8 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-shadow shadow-lg shadow-blue-200"
              >
                I Understand
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default LegalModal;
