"use client";

interface SuccessModalProps {
  isOpen:   boolean;
  onClose:  () => void;
  title:    string;
  message:  string;
}

export default function SuccessModal({ isOpen, onClose, title, message }: SuccessModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-pink-900/20 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal box */}
      <div className="relative bg-white rounded-4xl shadow-cute-xl p-8 max-w-sm w-full text-center animate-[fadeInScale_0.3s_ease]">
        {/* Sparkle decoration */}
        <div className="text-6xl mb-4 animate-sparkle">✨</div>

        <h2 className="text-2xl font-bold text-hotpink font-quicksand mb-2">{title}</h2>
        <p className="text-pink-500 text-sm mb-6 leading-relaxed">{message}</p>

        {/* Decorative dots */}
        <div className="flex justify-center gap-2 mb-6">
          {["🌸", "🎀", "💕", "🌸"].map((e, i) => (
            <span key={i} className="text-lg">{e}</span>
          ))}
        </div>

        <button
          onClick={onClose}
          className="btn-pink w-full text-base"
        >
          Sip, lanjut! 🌸
        </button>
      </div>
    </div>
  );
}
