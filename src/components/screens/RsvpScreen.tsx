"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence , Variants } from 'framer-motion';
import { EmbeddedFooter } from '@/components/layout/EmbeddedFooter';

interface RsvpScreenProps {
  inviteCode: string;
  onContinue: () => void;
  onSubmitSuccess?: () => void;
}

import { submitRsvp } from '@/app/actions/rsvp';
import { Loader2 } from 'lucide-react';

export function RsvpScreen({ inviteCode, onContinue, onSubmitSuccess }: RsvpScreenProps) {
  const [showGifts, setShowGifts] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [attendance, setAttendance] = useState<'Yes' | 'No'>('Yes');
  
  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [proxyName, setProxyName] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('IBAN Details Copied!');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = {
      fullName,
      email,
      phoneNumber: phone,
      willAttend: attendance,
      proxyName: attendance === 'No' ? proxyName : undefined,
      message,
    };

    const result = await submitRsvp(inviteCode, formData);

    setIsSubmitting(false);

    if (result.success) {
      setShowModal(true);
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
    } else {
      setError(result.error || 'Something went wrong. Please try again.');
    }
  };

  return (
    <section className="py-24 px-4 absolute inset-0 w-full h-full overflow-y-auto overflow-x-hidden flex flex-col justify-between">
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-wedding-dark via-wedding-deepburgundy to-wedding-dark pointer-events-none"></div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-50px" }}
        className="max-w-4xl mx-auto w-full relative z-10"
      >
        <motion.div variants={itemVariants} className="bg-wedding-dark/40 p-8 md:p-12 rounded-xl border border-wedding-burgundylight/30 shadow-lg">
          <div className="text-center mb-12">
            <span className="text-xs uppercase tracking-[0.3em] text-wedding-gold block mb-1">R.S.V.P</span>
            <h2 className="text-3xl font-cinzel font-light text-wedding-goldlight tracking-wide">The Response</h2>
            <div className="w-12 h-[1px] bg-wedding-gold/30 mx-auto mt-3"></div>
            <p className="text-sm font-cormorant italic text-wedding-goldlight/90 mt-6 leading-relaxed max-w-2xl mx-auto">
              "We would be deeply honored by your presence as we pledge our lives, hearts, and dreams under the beautiful Tarlac skies. Please secure your response before November 1, 2026."
            </p>
          </div>

          {/* Interactive RSVP Form */}
          <form onSubmit={handleSubmit} className="space-y-8 font-inter">
            
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-center">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Full Name */}
              <div className="relative col-span-2 md:col-span-1">
                <label htmlFor="fullname" className="block text-xs uppercase tracking-widest text-wedding-gold font-semibold mb-2">Full Name <span className="text-red-400">*</span></label>
                <input type="text" id="fullname" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="w-full bg-transparent border-b border-wedding-gold/30 focus:border-wedding-gold py-2 text-sm text-wedding-cream focus:outline-none transition-all duration-300" />
              </div>

              {/* Email Address */}
              <div className="relative col-span-2 md:col-span-1">
                <label htmlFor="email" className="block text-xs uppercase tracking-widest text-wedding-gold font-semibold mb-2">Email Address <span className="text-red-400">*</span></label>
                <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-transparent border-b border-wedding-gold/30 focus:border-wedding-gold py-2 text-sm text-wedding-cream focus:outline-none transition-all duration-300" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Phone */}
              <div className="relative">
                <label htmlFor="phone" className="block text-xs uppercase tracking-widest text-wedding-gold font-semibold mb-2">Phone Number <span className="text-red-400">*</span></label>
                <input type="tel" id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} required className="w-full bg-transparent border-b border-wedding-gold/30 focus:border-wedding-gold py-2 text-sm text-wedding-cream focus:outline-none transition-all duration-300" />
              </div>

              {/* Attendance Choice */}
              <div>
                <span className="block text-xs uppercase tracking-widest text-wedding-gold font-semibold mb-3">Will you attend?</span>
                <div className="flex space-x-8 mt-1">
                  <label className="flex items-center cursor-pointer group">
                    <input type="radio" name="attendance" value="Yes" checked={attendance === 'Yes'} onChange={() => setAttendance('Yes')} className="sr-only peer" />
                    <div className="w-5 h-5 rounded-full border border-wedding-gold flex items-center justify-center mr-3 peer-checked:bg-wedding-gold transition-all duration-300">
                      <div className="w-2 h-2 rounded-full bg-white opacity-0 peer-checked:opacity-100"></div>
                    </div>
                    <span className="text-sm font-cormorant italic text-wedding-cream group-hover:text-wedding-goldlight transition-colors">Joyfully Accepts</span>
                  </label>
                  <label className="flex items-center cursor-pointer group">
                    <input type="radio" name="attendance" value="No" checked={attendance === 'No'} onChange={() => setAttendance('No')} className="sr-only peer" />
                    <div className="w-5 h-5 rounded-full border border-wedding-gold flex items-center justify-center mr-3 peer-checked:bg-wedding-gold transition-all duration-300">
                      <div className="w-2 h-2 rounded-full bg-white opacity-0 peer-checked:opacity-100"></div>
                    </div>
                    <span className="text-sm font-cormorant italic text-wedding-cream group-hover:text-wedding-goldlight transition-colors">Regretfully Declines</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Conditional Proxy Field */}
            <AnimatePresence>
              {attendance === 'No' && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  className="overflow-hidden"
                >
                  <div className="relative pt-2">
                    <label htmlFor="proxy" className="block text-xs uppercase tracking-widest text-wedding-gold font-semibold mb-2">Proxy Name (If Any)</label>
                    <input type="text" id="proxy" value={proxyName} onChange={(e) => setProxyName(e.target.value)} placeholder="Enter proxy name or N/A" required={attendance === 'No'} className="w-full bg-transparent border-b border-wedding-gold/30 focus:border-wedding-gold py-2 text-sm text-wedding-cream focus:outline-none placeholder:text-wedding-cream/40 transition-all duration-300" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Special Message */}
            <div>
              <label htmlFor="message" className="block text-xs uppercase tracking-widest text-wedding-gold font-semibold mb-2">Message for Hans & Czay</label>
              <textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder="Share your warm thoughts..." className="w-full bg-transparent border-b border-wedding-gold/30 focus:border-wedding-gold py-2 text-sm text-wedding-cream focus:outline-none placeholder:text-wedding-cream/40 transition-all duration-300 resize-none"></textarea>
            </div>

            {/* Data Privacy Consent */}
            <div className="pt-2">
              <label className="flex items-start cursor-pointer group">
                <div className="relative flex items-center justify-center mt-1 mr-3 shrink-0">
                  <input type="checkbox" required className="peer sr-only" />
                  <div className="w-5 h-5 border border-wedding-gold/50 rounded-sm bg-transparent peer-checked:bg-wedding-gold peer-checked:border-wedding-gold peer-checked:[&>svg]:opacity-100 transition-all duration-300 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-wedding-dark opacity-0 transition-opacity duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <span className="text-xs font-inter text-wedding-cream/70 group-hover:text-wedding-cream/90 transition-colors leading-relaxed">
                  I agree to the collection and processing of the personal information provided in this form for the sole purpose of organizing and managing this wedding event, in accordance with the Data Privacy Act.
                </span>
              </label>
            </div>

            <div className="text-center pt-6">
              <button disabled={isSubmitting} type="submit" className="px-8 py-4 bg-wedding-burgundy border border-wedding-gold/30 text-wedding-gold hover:bg-wedding-burgundy/80 hover:border-wedding-gold hover:text-wedding-goldlight text-xs tracking-[0.25em] font-medium uppercase transition-all duration-300 rounded-sm shadow-lg w-full md:w-auto flex items-center justify-center gap-2 mx-auto disabled:opacity-70 disabled:cursor-not-allowed">
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {isSubmitting ? 'Confirming...' : 'Confirm Attendance'}
              </button>
            </div>
          </form>


        </motion.div>
      </motion.div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-wedding-dark/95 border border-wedding-gold/30 p-8 md:p-12 rounded-xl shadow-2xl max-w-md w-full text-center relative overflow-hidden"
            >
              {/* Decorative elements */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-wedding-gold/50 to-transparent"></div>
              
              <h3 className="text-3xl font-cinzel text-wedding-goldlight mb-4 tracking-wide">Thank You!</h3>
              <div className="w-16 h-[1px] bg-wedding-gold/30 mx-auto mb-6"></div>
              
              <p className="text-lg font-cormorant italic text-wedding-cream/90 mb-8 leading-relaxed">
                Your response has been gracefully recorded. We are thrilled and cannot wait to celebrate this special day with you.
                <br /><br />
                Your presence is our greatest gift. Should you wish to honor us with a token of love, please view our Wedding Registry.
              </p>
              
              <button
                onClick={onContinue}
                className="px-8 py-3 bg-wedding-burgundy/80 border border-wedding-gold/40 text-wedding-gold hover:bg-wedding-burgundy hover:border-wedding-gold hover:text-wedding-goldlight text-xs tracking-[0.25em] font-medium uppercase transition-all duration-300 rounded-sm w-full"
              >
                View Wedding Registry
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <EmbeddedFooter />
    </section>
  );
}
