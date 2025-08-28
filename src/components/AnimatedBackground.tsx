import React from "react";
import { motion } from "framer-motion";

export const AnimatedBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 flex flex-col">
      {/* Top Section - continuous left scroll */}
      <div className="flex-1 flex overflow-hidden">
        <motion.div
          className="flex flex-shrink-0"
          animate={{ x: ["0%", "-50%"] }}
          transition={{
            duration: 100,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          {/* First set of images (x1 to x7) */}
          <div className="flex flex-shrink-0">
            <div className="w-[50vw] h-full flex-shrink-0"><img src="/x1.png" alt="Image 1" className="w-full h-full object-cover opacity-20"/></div>
            <div className="w-[50vw] h-full flex-shrink-0"><img src="/x2.png" alt="Image 2" className="w-full h-full object-cover opacity-20"/></div>
            <div className="w-[50vw] h-full flex-shrink-0"><img src="/x3.png" alt="Image 3" className="w-full h-full object-cover opacity-20"/></div>
            <div className="w-[50vw] h-full flex-shrink-0"><img src="/x4.png" alt="Image 4" className="w-full h-full object-cover opacity-20"/></div>
            <div className="w-[50vw] h-full flex-shrink-0"><img src="/x5.png" alt="Image 5" className="w-full h-full object-cover opacity-20"/></div>
            <div className="w-[50vw] h-full flex-shrink-0"><img src="/x6.png" alt="Image 6" className="w-full h-full object-cover opacity-20"/></div>
            <div className="w-[50vw] h-full flex-shrink-0"><img src="/x7.png" alt="Image 7" className="w-full h-full object-cover opacity-20"/></div>
          </div>
          {/* Second set (duplicate for seamless loop) */}
          <div className="flex flex-shrink-0">
            <div className="w-[50vw] h-full flex-shrink-0"><img src="/x1.png" alt="Image 1" className="w-full h-full object-cover opacity-20"/></div>
            <div className="w-[50vw] h-full flex-shrink-0"><img src="/x2.png" alt="Image 2" className="w-full h-full object-cover opacity-20"/></div>
            <div className="w-[50vw] h-full flex-shrink-0"><img src="/x3.png" alt="Image 3" className="w-full h-full object-cover opacity-20"/></div>
            <div className="w-[50vw] h-full flex-shrink-0"><img src="/x4.png" alt="Image 4" className="w-full h-full object-cover opacity-20"/></div>
            <div className="w-[50vw] h-full flex-shrink-0"><img src="/x5.png" alt="Image 5" className="w-full h-full object-cover opacity-20"/></div>
            <div className="w-[50vw] h-full flex-shrink-0"><img src="/x6.png" alt="Image 6" className="w-full h-full object-cover opacity-20"/></div>
            <div className="w-[50vw] h-full flex-shrink-0"><img src="/x7.png" alt="Image 7" className="w-full h-full object-cover opacity-20"/></div>
          </div>
        </motion.div>
      </div>
      
      {/* Bottom Section - continuous left scroll */}
      <div className="flex-1 flex overflow-hidden">
        <motion.div
          className="flex flex-shrink-0"
          animate={{ x: ["0%", "-50%"] }}
          transition={{
            duration: 100,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          {/* First set of images (x8 to x14) */}
          <div className="flex flex-shrink-0">
            <div className="w-[50vw] h-full flex-shrink-0"><img src="/x8.png" alt="Image 8" className="w-full h-full object-cover opacity-20"/></div>
            <div className="w-[50vw] h-full flex-shrink-0"><img src="/x9.png" alt="Image 9" className="w-full h-full object-cover opacity-20"/></div>
            <div className="w-[50vw] h-full flex-shrink-0"><img src="/x10.png" alt="Image 10" className="w-full h-full object-cover opacity-20"/></div>
            <div className="w-[50vw] h-full flex-shrink-0"><img src="/x11.png" alt="Image 11" className="w-full h-full object-cover opacity-20"/></div>
            <div className="w-[50vw] h-full flex-shrink-0"><img src="/x12.png" alt="Image 12" className="w-full h-full object-cover opacity-20"/></div>
            <div className="w-[50vw] h-full flex-shrink-0"><img src="/x13.png" alt="Image 13" className="w-full h-full object-cover opacity-20"/></div>
            <div className="w-[50vw] h-full flex-shrink-0"><img src="/x14.png" alt="Image 14" className="w-full h-full object-cover opacity-20"/></div>
          </div>
          {/* Second set (duplicate for seamless loop) */}
          <div className="flex flex-shrink-0">
            <div className="w-[50vw] h-full flex-shrink-0"><img src="/x8.png" alt="Image 8" className="w-full h-full object-cover opacity-20"/></div>
            <div className="w-[50vw] h-full flex-shrink-0"><img src="/x9.png" alt="Image 9" className="w-full h-full object-cover opacity-20"/></div>
            <div className="w-[50vw] h-full flex-shrink-0"><img src="/x10.png" alt="Image 10" className="w-full h-full object-cover opacity-20"/></div>
            <div className="w-[50vw] h-full flex-shrink-0"><img src="/x11.png" alt="Image 11" className="w-full h-full object-cover opacity-20"/></div>
            <div className="w-[50vw] h-full flex-shrink-0"><img src="/x12.png" alt="Image 12" className="w-full h-full object-cover opacity-20"/></div>
            <div className="w-[50vw] h-full flex-shrink-0"><img src="/x13.png" alt="Image 13" className="w-full h-full object-cover opacity-20"/></div>
            <div className="w-[50vw] h-full flex-shrink-0"><img src="/x14.png" alt="Image 14" className="w-full h-full object-cover opacity-20"/></div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};