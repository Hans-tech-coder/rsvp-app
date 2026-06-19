"use client";

import React from 'react';
import { motion , Variants } from 'framer-motion';
import { EmbeddedFooter } from '@/components/layout/EmbeddedFooter';

interface OurStoryScreenProps {
  onContinue: () => void;
}

export function OurStoryScreen({ onContinue }: OurStoryScreenProps) {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
        delayChildren: 0.2,
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 1, ease: [0.22, 1, 0.36, 1] }
    }
  };

  const timelineItems = [
    {
      date: "September 2020",
      title: "A Serendipitous Encounter",
      image: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&q=80&w=800",
      description: "Our eyes first met across the crowded terrace of Cafe de Flore in Paris. It took just one shared look, an accidental spill of a coffee cup, and an hour of endless laughter to realize our worlds had shifted permanently."
    },
    {
      date: "December 2020",
      title: "An Evening of Whispers",
      image: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&q=80&w=800",
      description: "Our first formal date was under the soft winter haze of London. We strolled along the banks of the Seine, talking about dreams, philosophies, and music. By midnight, we knew this was no ordinary courtship."
    },
    {
      date: "June 2025",
      title: "By the Cliffs of Amalfi",
      image: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&q=80&w=800",
      description: "Under the golden dusk of Positano, perched on a private terrace hanging between the blue heavens and quiet waves, Hans bent his knee and asked the question that would seal our destinies."
    },
    {
      date: "October 2026",
      title: "The Path to Forever",
      image: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&q=80&w=800",
      description: "As we prepare to declare our eternal promises, we are filled with boundless joy to gather those who have walked beside us on our journeys. Our final chapter as two is closing, and a lifetime as one is about to begin."
    }
  ];

  return (
    <section className="py-24 px-4 absolute inset-0 w-full h-full overflow-y-auto overflow-x-hidden flex flex-col justify-between">
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-wedding-dark via-wedding-deepburgundy to-wedding-dark pointer-events-none"></div>
      
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
        className="max-w-5xl mx-auto relative z-10 w-full"
      >
        <motion.div variants={itemVariants} className="text-center mb-20">
          <span className="text-xs uppercase tracking-[0.4em] text-wedding-gold block mb-2">Our Journey</span>
          <h2 className="text-3xl md:text-5xl font-cinzel font-light text-wedding-goldlight tracking-wide">The Chapters of Us</h2>
          <div className="w-16 h-[1px] bg-wedding-gold/30 mx-auto mt-4"></div>
          <p className="text-base font-cormorant italic text-wedding-goldlight/70 mt-3 max-w-md mx-auto">Every love story is beautiful, but ours is our favorite editorial masterpiece.</p>
        </motion.div>

        <div className="relative border-l border-wedding-gold/20 ml-4 md:border-l-0 md:ml-0 md:flex md:flex-col md:items-center">
          <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 h-full w-[1px] bg-wedding-gold/10"></div>

          {timelineItems.map((item, index) => (
            <motion.div 
              key={index}
              variants={itemVariants}
              className={`relative mb-16 md:mb-24 w-full md:w-1/2 pl-8 ${index % 2 === 0 ? 'md:pl-0 md:pr-16 md:mr-auto' : 'md:pl-16 md:ml-auto'}`}
            >
              <div className={`absolute -left-4 ${index % 2 === 0 ? 'md:left-auto md:-right-4' : 'md:-left-4'} top-0 w-8 h-8 rounded-full bg-wedding-dark border border-wedding-gold/40 flex items-center justify-center z-10`}>
                <div className="w-2.5 h-2.5 rounded-full bg-wedding-gold"></div>
              </div>
              <div className="bg-wedding-dark/40 p-6 md:p-8 rounded-lg shadow-sm border border-wedding-gold/10 hover:shadow-lg hover:border-wedding-gold/30 transition-all duration-500">
                <span className="text-xs uppercase tracking-widest text-wedding-gold/70 font-semibold block mb-1">{item.date}</span>
                <h3 className="text-2xl font-cinzel text-wedding-cream font-light mb-3">{item.title}</h3>
                <img src={item.image} alt={item.title} className="w-full h-48 object-cover rounded-md mb-4 brightness-[0.95] hover:brightness-110 transition-all duration-500" />
                <p className="text-sm font-cormorant text-wedding-cream leading-relaxed">{item.description}</p>
              </div>
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
