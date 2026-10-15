import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useWeddingContent } from '@/contexts/WeddingContentContext';
import { useSiteText } from '@/contexts/SiteTextContext';

interface GiftSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  giftName: string;
  onSubmit: (details: { name: string; email: string; message: string }) => Promise<void>;
}

export function GiftSelectionModal({ isOpen, onClose, giftName, onSubmit }: GiftSelectionModalProps) {
  const { content } = useWeddingContent();
  const text = useSiteText();
  const formContent = content.rsvpForm;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await onSubmit({ name, email, message });
      // Reset form
      setName('');
      setEmail('');
      setMessage('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-surface/80 backdrop-blur-sm"
            onClick={onClose}
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="bg-surface relative z-10 w-full max-w-md p-8 rounded-xl border border-accent/30 shadow-2xl"
          >
            <button 
              onClick={onClose}
              aria-label="Close modal"
              className="absolute top-4 right-4 w-11 h-11 flex items-center justify-center text-ink/60 hover:text-accent transition-colors active:scale-95"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>

            <div className="text-center mb-6">
              <span className="text-xs uppercase tracking-[0.3em] text-accent block mb-2">{text.giftModal.eyebrow}</span>
              <h3 className="text-2xl font-heading font-light text-accent-light">
                {giftName}
              </h3>
              <div className="w-12 h-[1px] bg-accent/30 mx-auto mt-3"></div>
            </div>

            <p className="text-sm font-elegant text-ink/80 text-center mb-6">
              {text.giftModal.intro}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-xs uppercase tracking-widest text-accent font-medium mb-1">{text.giftModal.nameLabel}</label>
                <input 
                  type="text" 
                  id="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-surface/50 border border-accent/30 rounded-sm px-4 py-3 text-ink font-body text-sm focus:outline-none focus:border-accent transition-colors placeholder:text-ink/30"
                  placeholder={text.giftModal.namePlaceholder}
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-xs uppercase tracking-widest text-accent font-medium mb-1">{text.giftModal.emailLabel}</label>
                <input 
                  type="email" 
                  id="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface/50 border border-accent/30 rounded-sm px-4 py-3 text-ink font-body text-sm focus:outline-none focus:border-accent transition-colors placeholder:text-ink/30"
                  placeholder={text.giftModal.emailPlaceholder}
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-xs uppercase tracking-widest text-accent font-medium mb-1">{text.giftModal.messageLabel}</label>
                <textarea 
                  id="message"
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-surface/50 border border-accent/30 rounded-sm px-4 py-3 text-ink font-body text-sm focus:outline-none focus:border-accent transition-colors placeholder:text-ink/30 resize-none"
                  placeholder={text.giftModal.messagePlaceholder}
                />
              </div>

              {/* Data Privacy Consent */}
              <div className="pt-2">
                <label className="flex items-start cursor-pointer group">
                  <div className="relative flex items-center justify-center mt-1 mr-3 shrink-0">
                    <input type="checkbox" required className="peer sr-only" />
                    <div className="w-5 h-5 border border-accent/50 rounded-sm bg-transparent peer-checked:bg-accent peer-checked:border-accent peer-checked:[&>svg]:opacity-100 transition-all duration-300 flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-surface opacity-0 transition-opacity duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <span className="text-xs font-body text-ink/70 group-hover:text-ink/90 transition-colors leading-relaxed">
                    {formContent.actions.privacyText}
                  </span>
                </label>
              </div>

              <div className="pt-4">
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full py-4 bg-primary border border-accent/30 text-accent hover:bg-primary/80 hover:border-accent hover:text-accent-light text-xs tracking-[0.2em] font-medium uppercase transition-all duration-300 rounded-sm disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center h-12"
                >
                  {isSubmitting ? (
                    <svg className="animate-spin h-5 w-5 text-ink" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    text.giftModal.submit
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
