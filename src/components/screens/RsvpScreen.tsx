"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence , Variants } from 'framer-motion';
import { EmbeddedFooter } from '@/components/layout/EmbeddedFooter';

interface RsvpScreenProps {
  onContinue: () => void;
}

export function RsvpScreen({ onContinue }: RsvpScreenProps) {
  const [showGifts, setShowGifts] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [attendance, setAttendance] = useState('accept');

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowModal(true);
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Full Name */}
              <div className="relative col-span-2 md:col-span-1">
                <label htmlFor="fullname" className="block text-xs uppercase tracking-widest text-wedding-gold font-semibold mb-2">Full Name</label>
                <input type="text" id="fullname" required className="w-full bg-transparent border-b border-wedding-gold/30 focus:border-wedding-gold py-2 text-sm text-wedding-cream focus:outline-none transition-all duration-300" />
              </div>

              {/* Email Address */}
              <div className="relative col-span-2 md:col-span-1">
                <label htmlFor="email" className="block text-xs uppercase tracking-widest text-wedding-gold font-semibold mb-2">Email Address</label>
                <input type="email" id="email" required className="w-full bg-transparent border-b border-wedding-gold/30 focus:border-wedding-gold py-2 text-sm text-wedding-cream focus:outline-none transition-all duration-300" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Phone */}
              <div className="relative">
                <label htmlFor="phone" className="block text-xs uppercase tracking-widest text-wedding-gold font-semibold mb-2">Phone Number</label>
                <input type="tel" id="phone" required className="w-full bg-transparent border-b border-wedding-gold/30 focus:border-wedding-gold py-2 text-sm text-wedding-cream focus:outline-none transition-all duration-300" />
              </div>

              {/* Attendance Choice */}
              <div>
                <span className="block text-xs uppercase tracking-widest text-wedding-gold font-semibold mb-3">Will you attend?</span>
                <div className="flex space-x-8 mt-1">
                  <label className="flex items-center cursor-pointer group">
                    <input type="radio" name="attendance" value="accept" checked={attendance === 'accept'} onChange={() => setAttendance('accept')} className="sr-only peer" />
                    <div className="w-5 h-5 rounded-full border border-wedding-gold flex items-center justify-center mr-3 peer-checked:bg-wedding-gold transition-all duration-300">
                      <div className="w-2 h-2 rounded-full bg-white opacity-0 peer-checked:opacity-100"></div>
                    </div>
                    <span className="text-sm font-cormorant italic text-wedding-cream group-hover:text-wedding-goldlight transition-colors">Joyfully Accepts</span>
                  </label>
                  <label className="flex items-center cursor-pointer group">
                    <input type="radio" name="attendance" value="decline" checked={attendance === 'decline'} onChange={() => setAttendance('decline')} className="sr-only peer" />
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
              {attendance === 'decline' && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  className="overflow-hidden"
                >
                  <div className="relative pt-2">
                    <label htmlFor="proxy" className="block text-xs uppercase tracking-widest text-wedding-gold font-semibold mb-2">Proxy Name (If Any)</label>
                    <input type="text" id="proxy" placeholder="Enter proxy name or N/A" required={attendance === 'decline'} className="w-full bg-transparent border-b border-wedding-gold/30 focus:border-wedding-gold py-2 text-sm text-wedding-cream focus:outline-none placeholder:text-wedding-cream/40 transition-all duration-300" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Special Message */}
            <div>
              <label htmlFor="message" className="block text-xs uppercase tracking-widest text-wedding-gold font-semibold mb-2">Message for Hans & Czay</label>
              <textarea id="message" rows={4} placeholder="Share your warm thoughts..." className="w-full bg-transparent border-b border-wedding-gold/30 focus:border-wedding-gold py-2 text-sm text-wedding-cream focus:outline-none placeholder:text-wedding-cream/40 transition-all duration-300 resize-none"></textarea>
            </div>

            <div className="text-center pt-6">
              <button type="submit" className="px-8 py-4 bg-wedding-burgundy border border-wedding-gold/30 text-wedding-gold hover:bg-wedding-burgundy/80 hover:border-wedding-gold hover:text-wedding-goldlight text-xs tracking-[0.25em] font-medium uppercase transition-all duration-300 rounded-sm shadow-lg w-full md:w-auto">
                Confirm Attendance
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
