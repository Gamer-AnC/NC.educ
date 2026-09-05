import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Instagram, MessageCircle, ArrowUpRight } from 'lucide-react';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: string;
}

const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose, language }) => {
  const isFrench = language === 'FRENCH';
  const isChinese = language === 'CHINESE';
  const isSpanish = language === 'SPANISH';

  let title = 'Contact Us';
  let subtitle = 'Get in touch with the NC.edu team instantly through our channels.';
  let closeBtnText = 'Close';

  if (isFrench) {
    title = 'Contactez-nous';
    subtitle = 'Contactez l\'équipe NC.edu instantanément via nos différents canaux.';
    closeBtnText = 'Fermer';
  } else if (isChinese) {
    title = '联系我们';
    subtitle = '通过以下渠道与 NC.edu 团队取得联系。';
    closeBtnText = '关闭';
  } else if (isSpanish) {
    title = 'Contáctenos';
    subtitle = 'Póngase en contacto con el equipo de NC.edu a través de nuestros canales.';
    closeBtnText = 'Cerrar';
  }

  const socialChannels = [
    {
      name: 'Email Address',
      label: 'nc.edu001@gmail.com',
      href: 'mailto:nc.edu001@gmail.com',
      color: 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100/70',
      icon: Mail,
      desc: isFrench ? 'Pour toute assistance' : isSpanish ? 'Soporte oficial' : 'For official support and inquiries'
    },
    {
      name: 'Instagram',
      label: '@nc.educ',
      href: 'https://instagram.com/nc.educ',
      color: 'bg-pink-50 text-pink-600 border-pink-100 hover:bg-pink-100/70',
      icon: Instagram,
      desc: isFrench ? 'Suivez nos actualités' : isSpanish ? 'Interactúa con nosotros' : 'Connect and interact with our stories'
    },
    {
      name: 'TikTok',
      label: '@nc.edu',
      href: 'https://www.tiktok.com/@nc.edu',
      color: 'bg-slate-50 text-slate-900 border-slate-200 hover:bg-slate-100',
      icon: MessageCircle,
      desc: isFrench ? 'Tutoriels et vidéos courtes' : isSpanish ? 'Vídeos educativos cortos' : 'Short tutorials & community clips'
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div id="contact-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
            className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-800">{title}</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-500 leading-relaxed mb-4">
                {subtitle}
              </p>

              <div className="space-y-3">
                {socialChannels.map((channel, idx) => {
                  const Icon = channel.icon;
                  return (
                    <motion.a
                      key={channel.name}
                      href={channel.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${channel.color} group`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100/50">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            {channel.name}
                          </p>
                          <p className="text-sm font-bold mt-0.5">
                            {channel.label}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] text-slate-400 hidden sm:inline">
                          {channel.desc}
                        </span>
                        <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </motion.a>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-shadow shadow-lg shadow-blue-200 text-xs"
              >
                {closeBtnText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ContactModal;
