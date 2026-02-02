"use client";

import { motion } from "framer-motion";

interface BusinessHealthGaugeProps {
  score: number;
}

export default function BusinessHealthGauge({
  score,
}: BusinessHealthGaugeProps) {
  const getColor = (s: number) => {
    if (s >= 80) return "#22c55e"; // Success
    if (s >= 50) return "#fca90d"; // Warning (Primary)
    return "#ef4444"; // Destructive
  };

  const color = getColor(score);
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center w-32 h-32">
      <svg className="w-full h-full transform -rotate-90">
        {/* Background Circle */}
        <circle
          cx="64"
          cy="64"
          r={radius}
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="8"
          fill="transparent"
        />
        {/* Progress Circle */}
        <motion.circle
          cx="64"
          cy="64"
          r={radius}
          stroke={color}
          strokeWidth="8"
          fill="transparent"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-black text-white">{score}</span>
        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-tighter">
          SALUD
        </span>
      </div>

      {/* Glow Effect */}
      <div
        className="absolute inset-0 rounded-full blur-2xl opacity-20 transition-colors duration-1000"
        style={{ backgroundColor: color }}
      />
    </div>
  );
}
