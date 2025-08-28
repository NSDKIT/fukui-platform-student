import React from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { AnimatedBackground } from './AnimatedBackground';

interface WelcomeScreenProps {
  onGetStarted: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onGetStarted }) => {
  return (
    <div className="min-h-screen relative w-full flex flex-col items-center justify-center overflow-hidden bg-white">
      <AnimatedBackground />

      {/* Text Content */}
      <div className="relative z-20 text-center mb-8 bg-white/50 backdrop-blur-sm p-8 rounded-2xl shadow-xl">
        {/* Main Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="mb-6"
        >
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-orange-500 mb-4">
            声キャン！
          </h1>
          <div className="w-32 h-1 bg-gradient-to-r from-orange-500 to-orange-400 mx-auto mb-6 rounded-full"></div>
        </motion.div>

        {/* Description */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="space-y-2"
        >
          <p className="text-xl md:text-2xl text-gray-700 font-semibold">
            ポイ活しながら、キャリア相談ができる！
          </p>
          <p className="text-lg md:text-xl text-orange-500 font-semibold">
            あなたの声が未来を作る、新しいプラットフォーム
          </p>
        </motion.div>
      </div>

      {/* CTA Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="relative z-20"
      >
        <button
          onClick={onGetStarted}
          className="group relative bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white font-semibold py-4 px-10 rounded-full text-lg transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl flex items-center space-x-3"
        >
          <span>今すぐ始める</span>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          <div className="absolute inset-0 bg-gradient-to-r from-orange-400/20 to-orange-300/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-300"></div>
        </button>
      </motion.div>
    </div>
  );
};