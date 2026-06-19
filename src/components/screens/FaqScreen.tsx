"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence , Variants } from 'framer-motion';
import { EmbeddedFooter } from '@/components/layout/EmbeddedFooter';

interface FaqScreenProps {
  onContinue: () => void;
}

export function FaqScreen({ onContinue }: FaqScreenProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const faqs = [
    {
      q: "Can I bring a plus one?",
      a: "Due to the intimate nature of our chosen venue in Tarlac, our guest list is strictly personalized. Your digital invitation card indicates the specific number of reserved places in your honor. We kindly ask that only those specified on the envelope attend."
    },
    {
      q: "Can I bring my children?",
      a: "To allow all our guests—including parents—a night of relaxation and uninhibited celebration, we have chosen for our wedding weekend to be an adults-only affair. We thank you in advance for your understanding and hope you can join us to raise a glass in comfort."
    },
    {
      q: "What time should I arrive?",
      a: "The ceremony will commence promptly at 3:00 PM. We recommend arriving 30 to 60 minutes prior (between 2:00 PM and 2:30 PM) to comfortably enjoy a welcome refreshment and find your seats."
    },
    {
      q: "Is there a dress code?",
      a: "Yes, the style guidelines are Formal Black Tie Optional. Gentlemen are encouraged to wear classic dinner suits (tuxedos) or tailored coordinates. Ladies are invited to wear floor-length or refined midi dresses matching our neutral palette."
    },
    {
      q: "Can I take photos or videos?",
      a: "We respectfully request an \"unplugged\" ceremony where all phones and cameras remain off so that you can be fully present with us. You are more than welcome to capture memories during the cocktail hour and reception dinner!"
    },
    {
      q: "Where is the venue and is parking available?",
      a: "All celebrations take place within our designated venues in Paniqui, Tarlac. Secure valet and open parking spaces are fully accommodated at the entrance of both properties for all driving guests."
    },
    {
      q: "Will there be food restrictions or meal options?",
      a: "A curated multi-course fine dining buffet of classical and modern gourmet fare will be served. We collect all dietary requirements directly within the interactive RSVP form. Please submit your specifications when confirming."
    },
    {
      q: "Can I give gifts or cash?",
      a: "Your love, laughter, and presence on our special day are the greatest gifts we could receive. Should you wish to honor us with a contribution towards our new life together, details can be found in the registry section."
    },
    {
      q: "What if I cannot attend?",
      a: "You will be deeply missed! If you are unable to make it, please let us know by selecting \"Regretfully Declines\" in our RSVP section as early as possible so we can organize our final seating numbers."
    },
    {
      q: "Who can I contact for questions?",
      a: "For any additional logistics or questions, please reach out directly to our Maid of Honor, Sofia, at +63 917 123 4567."
    }
  ];

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
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
        <motion.div variants={itemVariants} className="text-center mb-16">
          <span className="text-xs uppercase tracking-[0.4em] text-wedding-gold block mb-2">Guest Information</span>
          <h2 className="text-3xl md:text-5xl font-cinzel font-light text-wedding-goldlight tracking-wide">Things You Might Want to Know</h2>
          <div className="w-16 h-[1px] bg-wedding-gold/30 mx-auto mt-4"></div>
          <p className="text-base font-cormorant italic text-wedding-goldlight/70 mt-3 max-w-md mx-auto">Quick answers for our beloved guests</p>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div 
              key={index} 
              variants={itemVariants}
              className="bg-wedding-dark/40 border border-wedding-gold/20 rounded-lg overflow-hidden transition-all duration-300 hover:border-wedding-gold/40"
            >
              <button 
                onClick={() => toggleFaq(index)} 
                className="w-full flex justify-between items-center p-6 text-left focus:outline-none group"
              >
                <span className="font-cinzel text-sm md:text-base tracking-wider text-wedding-cream font-medium group-hover:text-wedding-gold transition-colors">{faq.q}</span>
                <span className={`text-wedding-gold font-light text-2xl transition-transform duration-300 ${openIndex === index ? 'rotate-45' : ''}`}>+</span>
              </button>
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-wedding-gold/20"></div>
                    <p className="p-6 text-sm md:text-base font-cormorant text-wedding-cream leading-relaxed">
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1, delay: 0.5 }}
        className="w-full flex justify-center pb-8 md:pb-24 pt-8 relative z-20"
      >
        <button onClick={onContinue} className="group flex flex-col items-center justify-center space-y-3 cursor-pointer focus:outline-none animate-bounce mt-4">
          <span className="text-[10px] uppercase tracking-[0.3em] text-wedding-cream/70 font-medium group-hover:text-wedding-gold transition-colors duration-300">Continue</span>
          <div className="w-10 h-10 rounded-full border border-wedding-cream/30 flex items-center justify-center transition-all duration-300 group-hover:bg-wedding-gold/10 group-hover:border-wedding-gold">
            <svg className="w-4 h-4 text-wedding-cream/70 transition-transform duration-300 group-hover:translate-y-1 group-hover:text-wedding-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>
          </div>
        </button>
      </motion.div>

      <EmbeddedFooter />
    </section>
  );
}
