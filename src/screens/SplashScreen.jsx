import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import Logo from '../components/Logo';

const SplashScreen = ({ setScreen }) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const handleAnimationComplete = () => {
    if (isAnimating) {
      setScreen('main');
    }
  };

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center"
      style={{ backgroundColor: 'var(--surface-primary)' }}
    >
      <motion.div
        initial={{ y: 0 }}
        animate={isAnimating ? { y: -120 } : { y: 0 }}
        transition={{ 
          duration: 0.4, 
          ease: [0.4, 0, 0.2, 1] 
        }}
        onAnimationComplete={handleAnimationComplete}
      >
        <Logo width={180} />
      </motion.div>
    </div>
  );
};

export default SplashScreen;
