import React from 'react';
import { motion } from 'framer-motion';

interface CinematicHeroProps {
  className?: string;
}

export default function CinematicHero({ className = '' }: CinematicHeroProps) {
  return (
    <motion.section 
      className={`relative min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-yellow-400 font-sans overflow-hidden ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/50 to-transparent" />
      
      <motion.div
        className="absolute inset-0 opacity-20"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(30, 64, 175, 0.3) 0%, transparent 70%)',
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          repeatType: 'reverse',
        }}
      />

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-8">
        <motion.div
          className="text-center mb-12"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          <motion.h1 
            className="text-7xl font-bold mb-6 bg-gradient-to-r from-yellow-400 to-yellow-200 bg-clip-text text-transparent"
            animate={{
              textShadow: [
                '0 0 20px rgba(212, 175, 55, 0.5)',
                '0 0 40px rgba(212, 175, 55, 0.8)',
                '0 0 20px rgba(212, 175, 55, 0.5)',
              ],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
          >
            CinematicHero
          </motion.h1>
          
          <motion.p 
            className="text-xl opacity-80 max-w-2xl mx-auto leading-relaxed"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 0.8 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            Welcome to the CinematicHero chamber of the BeeHive Studio.
            Experience the next evolution of creative interfaces.
          </motion.p>
        </motion.div>

        {/* Feature Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.8 }}
        >
          {[1, 2, 3].map((index) => (
            <motion.div
              key={index}
              className="group relative p-8 rounded-2xl bg-gradient-to-br from-slate-900/80 to-slate-800/60 backdrop-blur-sm border border-yellow-400/20 hover:border-yellow-400/60 transition-all duration-500"
              whileHover={{ 
                scale: 1.05,
                boxShadow: '0 20px 40px rgba(212, 175, 55, 0.2)',
              }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="relative z-10">
                <div className="w-16 h-16 mb-6 mx-auto bg-gradient-to-br from-yellow-400 to-yellow-200 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🐝</span>
                </div>
                
                <h3 className="text-xl font-semibold mb-4 text-yellow-400">
                  Feature {index}
                </h3>
                
                <p className="text-yellow-400/70 text-sm leading-relaxed">
                  Customize this cinematic experience with your creative vision.
                  The hive awaits your mythic touch.
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Action Button */}
        <motion.button
          className="mt-16 px-12 py-4 bg-gradient-to-r from-yellow-400 to-yellow-200 text-slate-900 font-semibold rounded-full hover:shadow-2xl hover:shadow-yellow-400/50 transition-all duration-500"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
        >
          Enter the CinematicHero Chamber
        </motion.button>
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(12)].map((_, index) => (
          <motion.div
            key={index}
            className="absolute w-2 h-2 bg-yellow-400/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [-20, 20, -20],
              opacity: [0.3, 0.7, 0.3],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 4 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>
    </motion.section>
  );
}

export const pageMetadata = {
  name: 'CinematicHero',
  path: '/CinematicHero_LOWER',
  type: 'cinematic',
  generated: '2025-11-02 03:10:49',
  description: 'cinematic page for BeeHive Studio creative interface',
};
