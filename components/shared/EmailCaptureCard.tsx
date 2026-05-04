"use client";

import { useState, useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Check, Loader2 } from "lucide-react";
import {
  saveEmail,
  isCaptured,
  markCaptured,
  EMAIL_CAPTURED_KEY,
  type EmailSource,
} from "@/lib/email-capture";

// Subscribe to localStorage changes from other tabs/windows so the
// thank-you state stays in sync. Same-tab writes use the React state
// inside this component to flip immediately.
function subscribeCaptured(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = (e: StorageEvent) => {
    if (e.key === EMAIL_CAPTURED_KEY) callback();
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}
function getCapturedSnapshot() {
  return isCaptured();
}
function getCapturedServerSnapshot() {
  return false;
}

interface BaseProps {
  source: EmailSource;
  title: string;
  subtitle: string;
  buttonLabel: string;
  successMessage: string;
  emailPlaceholder?: string;
  smallText?: string;
  variant?: "card" | "banner";
  /** Hide entirely once captured (no thank-you replacement). */
  hideOnCaptured?: boolean;
}

export default function EmailCaptureCard(props: BaseProps) {
  const {
    source,
    title,
    subtitle,
    buttonLabel,
    successMessage,
    emailPlaceholder = "Enter your email",
    smallText,
    variant = "card",
    hideOnCaptured = false,
  } = props;

  const [email, setEmail] = useState("");
  const [working, setWorking] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const alreadyCaptured = useSyncExternalStore(
    subscribeCaptured,
    getCapturedSnapshot,
    getCapturedServerSnapshot
  );

  if (alreadyCaptured && hideOnCaptured) return null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (working || done) return;
    setError("");
    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }
    setWorking(true);
    const ok = await saveEmail(email, source);
    setWorking(false);
    if (!ok) {
      setError("Could not subscribe. Please try again.");
      return;
    }
    markCaptured();
    setDone(true);
  }

  // Already-captured (from a previous visit) → show condensed thank-you.
  if (alreadyCaptured && !done) {
    return (
      <ThankYou
        variant={variant}
        message="You are subscribed to AmanAI Lab. Thanks for being here!"
      />
    );
  }

  if (done) {
    return <ThankYou variant={variant} message={successMessage} />;
  }

  if (variant === "banner") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
            <Mail className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-100">{title}</h3>
            <p className="text-sm text-zinc-400 mt-0.5">{subtitle}</p>
          </div>
        </div>
        <Form
          email={email}
          setEmail={setEmail}
          working={working}
          onSubmit={onSubmit}
          buttonLabel={buttonLabel}
          emailPlaceholder={emailPlaceholder}
          error={error}
          compact
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-zinc-900 border border-orange-500/40 rounded-2xl p-6 sm:p-8 flex flex-col gap-4 shadow-lg shadow-orange-500/5"
    >
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center shrink-0">
          <Mail className="w-5 h-5 text-orange-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-zinc-100">{title}</h3>
          <p className="text-sm text-zinc-400 mt-1 leading-relaxed">{subtitle}</p>
        </div>
      </div>
      <Form
        email={email}
        setEmail={setEmail}
        working={working}
        onSubmit={onSubmit}
        buttonLabel={buttonLabel}
        emailPlaceholder={emailPlaceholder}
        error={error}
      />
      {smallText && (
        <p className="text-[11px] text-zinc-500 text-center sm:text-left">{smallText}</p>
      )}
    </motion.div>
  );
}

function Form({
  email,
  setEmail,
  working,
  onSubmit,
  buttonLabel,
  emailPlaceholder,
  error,
  compact = false,
}: {
  email: string;
  setEmail: (v: string) => void;
  working: boolean;
  onSubmit: (e: React.FormEvent) => void;
  buttonLabel: string;
  emailPlaceholder: string;
  error: string;
  compact?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <form
        onSubmit={onSubmit}
        className={`flex flex-col sm:flex-row gap-2 ${compact ? "md:min-w-[400px]" : ""}`}
      >
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={emailPlaceholder}
          required
          className="flex-1 bg-zinc-800 border border-zinc-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors"
        />
        <button
          type="submit"
          disabled={working}
          className="inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/25 whitespace-nowrap"
        >
          {working ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Sending…
            </>
          ) : (
            buttonLabel
          )}
        </button>
      </form>
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-xs text-red-400"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function ThankYou({
  variant,
  message,
}: {
  variant: "card" | "banner";
  message: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`flex items-center gap-3 ${
        variant === "banner"
          ? "bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4"
          : "bg-zinc-900 border border-green-500/30 rounded-2xl p-6"
      }`}
    >
      <div className="w-10 h-10 rounded-xl bg-green-500/15 border border-green-500/30 flex items-center justify-center shrink-0">
        <Check className="w-5 h-5 text-green-400" />
      </div>
      <p className="text-sm font-semibold text-zinc-100">{message}</p>
    </motion.div>
  );
}
