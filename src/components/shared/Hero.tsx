'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import LightRays from './LightRays';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

export default function Hero() {
  const headingText = "Essence of Royalty";
  const letters = Array.from(headingText);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { 
        staggerChildren: 0.08, 
        delayChildren: 0.6 
      },
    },
  };

  const childVariants = {
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: { type: "spring", damping: 12, stiffness: 100 },
    },
    hidden: {
      opacity: 0,
      y: 20,
      filter: 'blur(4px)',
      transition: { type: "spring", damping: 12, stiffness: 100 },
    },
  };

  return (
    <section className="relative h-[85vh] md:h-screen min-h-[550px] md:min-h-[600px] w-full flex items-center justify-center overflow-hidden bg-black">
      {/* Light Rays Background */}
      <div className="absolute inset-0 z-[1] pointer-events-none">
        <LightRays
          raysOrigin="top-center"
          raysColor="#ffffffff"
          raysSpeed={1}
          lightSpread={1}
          rayLength={4}
          followMouse={true}
          mouseInfluence={0.1}
          noiseAmount={0}
          distortion={0}
          className="custom-rays"
          pulsating={false}
          fadeDistance={1}
          saturation={1}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-full text-center w-full px-4 gap-1 pb-16 md:pb-40 mt-0">
        {/* Logo Image */}
        <div className="relative w-56 sm:w-72 md:w-[26rem] lg:w-[30rem] mb-0 animate-in fade-in duration-1000 pointer-events-none">
          <Image
            src="/images/hero1.PNG"
            alt="Royal Perfumes Logo"
            width={400}
            height={400}
            className="w-full h-auto object-contain drop-shadow-2xl"
            priority
            fetchPriority="high"
          />
        </div>

        {/* Text Content */}
        <div className="flex flex-col items-center gap-4 max-w-3xl">
          <motion.h1 
            className="text-4xl md:text-6xl lg:text-7xl font-heading text-white font-medium tracking-tight drop-shadow-2xl flex"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {letters.map((letter, index) => (
              <motion.span variants={childVariants} key={index}>
                {letter === " " ? "\u00A0" : letter}
              </motion.span>
            ))}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2, duration: 1 }}
            className="text-sm md:text-lg text-gray-300 font-body font-light tracking-wide"
          >
            Timeless elegance captured in every drop.
          </motion.p>
        </div>
        
        {/* Buttons */}
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.3, duration: 1 }}
            className="flex flex-col sm:flex-row items-center gap-4 mt-4 relative z-20"
        >
          <Link href="/shop">
            <Button 
                size="lg" 
                className="bg-white text-black hover:bg-gray-200 text-lg px-10 py-6 rounded-none font-body tracking-wider transition-all duration-300 transform hover:scale-105"
            >
              Shop Collection
            </Button>
          </Link>
          <Link href="/about">
            <Button 
                variant="outline" 
                size="lg" 
                className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-black text-lg px-10 py-6 rounded-none font-body tracking-wider transition-all duration-300"
            >
              Our Story
            </Button>
          </Link>
        </motion.div>
      </div>

      {/* Bouncing Scroll Indicator */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3, duration: 1 }}
        className="absolute bottom-10 md:bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center z-20 text-gray-400"
      >
        <div className="animate-bounce flex flex-col items-center">
            <span className="text-[10px] uppercase tracking-[0.3em] mb-2 font-body font-light opacity-80">Scroll</span>
            <ChevronDown className="h-5 w-5 opacity-80" />
        </div>
      </motion.div>
    </section>
  );
}
