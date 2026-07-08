"use client";

import { useState, useEffect, useCallback } from "react";

// ─── Messages pool ────────────────────────────────────────────────────────────
const MESSAGES = [
  "Semangat rekapnya Kakak! 🐾",
  "Jangan lupa minum air ya! 🌸",
  "Kamu udah kerja keras banget hari ini! 💕",
  "Istirahat sebentar gak papa lho kak~ 🍵",
  "Affiliate-nya makin banyak, makin keren! ✨",
  "Kak, udah makan belum? 🍱",
  "Spreadsheet-nya rapi banget, bangga! 🎀",
  "Satu langkah lagi, pasti bisa! 🦋",
  "Jangan lupa stretch bentar ya kak~ 🙆‍♀️",
  "You're doing amazing, keep going! 🌷",
  "Kucing ini doain kamu sukses terus! 🐱💫",
  "Datanya udah masuk semua nih, yay! 📊",
];

// ─── Cat frames (ASCII-art style emoji animation) ─────────────────────────────
// Walking frames
const WALK_FRAMES = ["🐱", "😸", "🐱", "😺"];
// Sleeping frames
const SLEEP_FRAMES = ["😴", "💤", "😪", "💤"];

type CatMode = "walking" | "sleeping";

export default function FloatingCat() {
  const [mode, setMode]           = useState<CatMode>("walking");
  const [frame, setFrame]         = useState(0);
  const [flipped, setFlipped]     = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const [message, setMessage]     = useState(MESSAGES[0]);
  const [bubbleAnim, setBubbleAnim] = useState(false);
  const [position, setPosition]   = useState({ x: 0, dir: 1 }); // dir: 1=right, -1=left
  const [isMounted, setIsMounted] = useState(false);

  // Only run on client
  useEffect(() => { setIsMounted(true); }, []);

  // ── Mode switcher — randomly switch between walking & sleeping ──────────────
  useEffect(() => {
    if (!isMounted) return;
    const switchMode = () => {
      const next: CatMode = Math.random() > 0.35 ? "walking" : "sleeping";
      setMode(next);
      setFrame(0);
    };
    const t = setInterval(switchMode, 4000 + Math.random() * 4000);
    return () => clearInterval(t);
  }, [isMounted]);

  // ── Frame animation ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isMounted) return;
    const fps = mode === "walking" ? 400 : 900;
    const frames = mode === "walking" ? WALK_FRAMES : SLEEP_FRAMES;
    const t = setInterval(() => {
      setFrame((f) => (f + 1) % frames.length);
    }, fps);
    return () => clearInterval(t);
  }, [mode, isMounted]);

  // ── Walking position (oscillate left-right) ─────────────────────────────────
  useEffect(() => {
    if (!isMounted || mode !== "walking") return;
    const MAX = 80; // max px to travel
    const t = setInterval(() => {
      setPosition((prev) => {
        const next = prev.x + prev.dir * 1.2;
        if (next >= MAX)  { setFlipped(true);  return { x: MAX,  dir: -1 }; }
        if (next <= -MAX) { setFlipped(false); return { x: -MAX, dir:  1 }; }
        return { ...prev, x: next };
      });
    }, 30);
    return () => clearInterval(t);
  }, [mode, isMounted]);

  // ── Handle click ────────────────────────────────────────────────────────────
  const handleClick = useCallback(() => {
    // Pick a random message (different from current)
    setMessage((prev) => {
      const others = MESSAGES.filter((m) => m !== prev);
      return others[Math.floor(Math.random() * others.length)];
    });
    setShowBubble(true);
    setBubbleAnim(false);
    // Trigger animation on next tick
    requestAnimationFrame(() => setBubbleAnim(true));
    // Auto-hide after 3.5s
    setTimeout(() => {
      setBubbleAnim(false);
      setTimeout(() => setShowBubble(false), 300);
    }, 3500);
  }, []);

  if (!isMounted) return null;

  const currentFrame = mode === "walking"
    ? WALK_FRAMES[frame % WALK_FRAMES.length]
    : SLEEP_FRAMES[frame % SLEEP_FRAMES.length];

  return (
    <div
      className="fixed bottom-6 right-8 z-50 flex flex-col items-end select-none"
      style={{ pointerEvents: "none" }}
    >
      {/* Speech bubble */}
      {showBubble && (
        <div
          className={`relative mb-2 max-w-[200px] transition-all duration-300
            ${bubbleAnim ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-2 scale-95"}`}
          style={{ pointerEvents: "none" }}
        >
          {/* Bubble body */}
          <div className="bg-white border-2 border-pink-200 rounded-2xl rounded-br-sm px-4 py-2.5 shadow-cute">
            <p className="text-xs font-semibold text-pink-600 leading-relaxed font-poppins text-right">
              {message}
            </p>
          </div>
          {/* Bubble tail */}
          <div className="absolute -bottom-2 right-4 w-0 h-0
            border-l-[8px] border-l-transparent
            border-t-[10px] border-t-white
            border-r-[4px] border-r-transparent
            drop-shadow-sm"
          />
          <div className="absolute -bottom-[10px] right-[14px] w-0 h-0
            border-l-[9px] border-l-transparent
            border-t-[11px] border-t-pink-200
            border-r-[5px] border-r-transparent"
          />
        </div>
      )}

      {/* Cat container */}
      <div
        className="relative flex items-end justify-end"
        style={{
          transform:      `translateX(${position.x}px)`,
          transition:     mode === "walking" ? "none" : "transform 0.5s ease",
          pointerEvents:  "all",
          cursor:         "pointer",
        }}
        onClick={handleClick}
        title="Klik aku! 🐱"
      >
        {/* Shadow */}
        <div
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-pink-200/50 rounded-full blur-sm transition-all duration-500"
          style={{
            width:  mode === "sleeping" ? "48px" : "36px",
            height: "8px",
          }}
        />

        {/* Cat emoji + animations */}
        <div
          className={`text-5xl leading-none transition-transform duration-200 drop-shadow-md
            ${mode === "walking" ? "hover:scale-110" : ""}
          `}
          style={{
            transform:  flipped ? "scaleX(-1)" : "scaleX(1)",
            animation:  mode === "sleeping"
              ? "catSleep 3s ease-in-out infinite"
              : "catWalk 0.4s ease-in-out infinite alternate",
            display: "block",
          }}
        >
          {currentFrame}
        </div>

        {/* "Click me" hint — tiny pink dot pulse */}
        {!showBubble && (
          <div className="absolute -top-1 -right-1 w-3 h-3">
            <span className="absolute inline-flex h-full w-full rounded-full bg-hotpink opacity-75 animate-ping" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-pink-400" />
          </div>
        )}
      </div>

      {/* Inline keyframes */}
      <style>{`
        @keyframes catWalk {
          from { transform: ${flipped ? "scaleX(-1)" : "scaleX(1)"} translateY(0px);   }
          to   { transform: ${flipped ? "scaleX(-1)" : "scaleX(1)"} translateY(-4px);  }
        }
        @keyframes catSleep {
          0%,100% { transform: scaleX(1) rotate(0deg);   }
          50%      { transform: scaleX(1) rotate(-5deg);  }
        }
      `}</style>
    </div>
  );
}
