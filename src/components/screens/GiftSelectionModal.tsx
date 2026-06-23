import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface GiftSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  giftName: string;
  onSubmit: (details: { name: string; email: string; message: string }) => Promise<void>;
}

export function GiftSelectionModal({ isOpen, onClose, giftName, onSubmit }: GiftSelectionModalProps) {
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
            className="absolute inset-0 bg-wedding-dark/80 backdrop-blur-sm"
            onClick={onClose}
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-wedding-dark relative z-10 w-full max-w-md p-8 rounded-xl border border-wedding-gold/30 shadow-2xl"
          >
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 text-wedding-cream/60 hover:text-wedding-gold transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>

            <div className="text-center mb-6">
              <span className="text-xs uppercase tracking-[0.3em] text-wedding-gold block mb-2">Gift Selection</span>
              <h3 className="text-2xl font-cinzel font-light text-wedding-goldlight">
                {giftName}
              </h3>
              <div className="w-12 h-[1px] bg-wedding-gold/30 mx-auto mt-3"></div>
            </div>

            <p className="text-sm font-cormorant text-wedding-cream/80 text-center mb-6">
              Please provide your details below to confirm you are gifting this item to the couple.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-xs uppercase tracking-widest text-wedding-gold font-medium mb-1">Full Name</label>
                <input 
                  type="text" 
                  id="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-wedding-dark/50 border border-wedding-gold/30 rounded-sm px-4 py-3 text-wedding-cream font-inter text-sm focus:outline-none focus:border-wedding-gold transition-colors placeholder:text-wedding-cream/30"
                  placeholder="John & Jane Doe"
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-xs uppercase tracking-widest text-wedding-gold font-medium mb-1">Email Address</label>
                <input 
                  type="email" 
                  id="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-wedding-dark/50 border border-wedding-gold/30 rounded-sm px-4 py-3 text-wedding-cream font-inter text-sm focus:outline-none focus:border-wedding-gold transition-colors placeholder:text-wedding-cream/30"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-xs uppercase tracking-widest text-wedding-gold font-medium mb-1">Short Message (Optional)</label>
                <textarea 
                  id="message"
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-wedding-dark/50 border border-wedding-gold/30 rounded-sm px-4 py-3 text-wedding-cream font-inter text-sm focus:outline-none focus:border-wedding-gold transition-colors placeholder:text-wedding-cream/30 resize-none"
                  placeholder="Wishing you a lifetime of love and happiness..."
                />
              </div>

              <div className="pt-4">
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full py-4 bg-wedding-burgundy border border-wedding-gold/30 text-wedding-gold hover:bg-wedding-burgundy/80 hover:border-wedding-gold hover:text-wedding-goldlight text-xs tracking-[0.2em] font-medium uppercase transition-all duration-300 rounded-sm disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center h-12"
                >
                  {isSubmitting ? (
                    <svg className="animate-spin h-5 w-5 text-wedding-cream" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    "Confirm Selection"
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
