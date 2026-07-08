"use client";

import { useEffect, useState } from "react";

const MESSAGES = [
  "You make every spreadsheet prettier just by being near it. 🌸",
  "Behind every great brand is a girl who stays organized and stays cute. ✨",
  "Your attention to detail is your superpower. Never forget that. 💕",
  "You don't just manage affiliates — you build relationships. That's rare. 🎀",
  "Hard days are temporary. Your dedication is permanent. Keep going, kak. 🌷",
];

export default function LandingGift({ onEnter }: { onEnter: () => void }) {
  const [visible, setVisible]   = useState(false);
  const [msgIdx]                = useState(() => Math.floor(Math.random() * MESSAGES.length));
  const [leaving, setLeaving]   = useState(false);

  useEffect(() => {
    // Slight delay so CSS transition fires properly
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  const handleEnter = () => {
    setLeaving(true);
    setTimeout(onEnter, 600);
  };

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center
        bg-gradient-to-br from-pink-50 via-white to-pink-100
        transition-all duration-700
        ${leaving ? "opacity-0 scale-110" : "opacity-100 scale-100"}
      `}
    >
      {/* Floating petals decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {["🌸","✨","🎀","💕","🌷","✨","🌸","💗"].map((e, i) => (
          <span
            key={i}
            className="absolute text-2xl animate-float opacity-30"
            style={{
              left:             `${10 + i * 11}%`,
              top:              `${5 + (i % 4) * 20}%`,
              animationDelay:   `${i * 0.4}s`,
              animationDuration:`${3 + (i % 3)}s`,
            }}
          >{e}</span>
        ))}
      </div>

      {/* Card */}
      <div
        className={`relative card max-w-md w-full mx-4 text-center shadow-cute-xl
          border-2 border-pink-100 transition-all duration-700
          ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
        `}
      >
        {/* Top sparkle */}
        <div className="text-5xl mb-2 animate-sparkle">✨</div>

        {/* Greeting */}
        <h1 className="font-quicksand font-bold text-hotpink text-4xl mb-1 tracking-tight">
          Hi, iiaaa 🌸
        </h1>
        <p className="text-pink-300 text-xs font-medium mb-6 tracking-widest uppercase">
          from adjisyahrul, with love 💌
        </p>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-pink-100" />
          <span className="text-pink-300 text-sm">🎀</span>
          <div className="flex-1 h-px bg-pink-100" />
        </div>

        {/* Daily message */}
        <p className="text-gray-500 text-sm leading-relaxed italic px-2 mb-8 min-h-[48px]">
          &ldquo;{MESSAGES[msgIdx]}&rdquo;
        </p>

        {/* CTA */}
        <button
          onClick={handleEnter}
          className="btn-pink w-full text-base py-4 font-quicksand font-bold tracking-wide"
        >
          Let&apos;s get to work ✨
        </button>

        <p className="text-pink-200 text-xs mt-4">
          Your Co-Pilot is ready 🚀
        </p>
      </div>
    </div>
  );
}
