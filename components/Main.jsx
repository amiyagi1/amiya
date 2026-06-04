'use client';
import React, { memo } from 'react';
import { motion } from 'framer-motion';

const GreetingText = memo(() => (
  <p className="font-omiofont3 whitespace-nowrap text-[11px] lg:tracking-[1.8em] sm:text-[12px] sm:tracking-[0.5em] lg:text-[13px] text-[#7c9ca3] uppercase">
    DESIGNER | DEVELOPER | CREATOR
  </p>
));
GreetingText.displayName = 'GreetingText';

const NameText = memo(() => (
  <h1 className="font-omiofont3 uppercase whitespace-nowrap text-[10vw] tracking-[0.18em] sm:text-[11vw] lg:text-[5rem] lg:tracking-[0.2em] text-[#89aab0]/70">
    AMIYA RANJAN 
  </h1>
));
NameText.displayName = 'NameText';




const ContentWrapper = memo(() => (
  <motion.div
    className="flex flex-col justify-center items-center absolute inset-0 z-10 pointer-events-none"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: -20 }}
    transition={{ delay: 0.6, duration: 2.4, ease: [0.22, 1, 0.36, 1] }}
  >
      <NameText />
    <GreetingText />
    
  
   
  </motion.div>
));
ContentWrapper.displayName = 'ContentWrapper';

const Main = () => (
  <section className="relative w-screen h-screen overflow-hidden">
    <ContentWrapper />
  </section>
);

Main.displayName = 'Main';
export default memo(Main);