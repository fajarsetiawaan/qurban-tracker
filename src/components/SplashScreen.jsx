import React from 'react';
import { motion } from 'framer-motion';

const SplashScreen = () => {
    const text = "DOMBANTARA";

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.3
            }
        }
    };

    const letterVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                type: "spring",
                damping: 12,
                stiffness: 200
            }
        }
    };

    return (
        <div className="fixed inset-0 z-[10000] bg-[#065f46] flex flex-col items-center justify-center animate-in fade-in duration-500">
            <div className="relative mb-8">
                <div className="absolute inset-0 bg-white/20 rounded-full blur-3xl animate-pulse scale-150"></div>
                <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                        type: "spring",
                        stiffness: 260,
                        damping: 20,
                        duration: 1.5
                    }}
                    className="w-32 h-32 bg-gradient-to-tr from-emerald-100 to-white rounded-[2.5rem] flex items-center justify-center shadow-2xl border-4 border-white/20 relative z-10"
                >
                    <img
                        src="/logo-domba.png"
                        alt="Dombantara Logo"
                        className="w-20 h-20 object-contain drop-shadow-xl"
                    />
                </motion.div>
            </div>

            <motion.div
                className="flex items-center justify-center space-x-[2px]"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {text.split("").map((char, index) => (
                    <motion.span
                        key={index}
                        variants={letterVariants}
                        className="text-white text-2xl font-black tracking-widest drop-shadow-md"
                    >
                        {char}
                    </motion.span>
                ))}
            </motion.div>

            {/* Subtle loading indicator below text */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 0.5 }}
                className="mt-4 flex space-x-1"
            >
                {[0, 1, 2].map((i) => (
                    <motion.div
                        key={i}
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.5, 1, 0.5]
                        }}
                        transition={{
                            duration: 1,
                            repeat: Infinity,
                            delay: i * 0.2
                        }}
                        className="w-1.5 h-1.5 bg-emerald-200 rounded-full"
                    />
                ))}
            </motion.div>
        </div>
    );
};

export default SplashScreen;
