"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Send, Mail, CheckCircle, MessageSquare } from "lucide-react";
import { YoutubeIcon, GithubIcon, TwitterIcon, LinkedinIcon } from "@/components/icons/SocialIcons";

const socials = [
  {
    icon: YoutubeIcon,
    label: "YouTube",
    handle: "@AmanAI_lab",
    href: "https://youtube.com/@AmanAI_lab",
    hoverColor: "hover:text-red-400",
  },
  {
    icon: GithubIcon,
    label: "GitHub",
    handle: "amanailab",
    href: "https://github.com",
    hoverColor: "hover:text-white",
  },
  {
    icon: TwitterIcon,
    label: "Twitter / X",
    handle: "@AmanAI_lab",
    href: "https://twitter.com",
    hoverColor: "hover:text-blue-400",
  },
  {
    icon: LinkedinIcon,
    label: "LinkedIn",
    handle: "Aman AI Lab",
    href: "https://linkedin.com",
    hoverColor: "hover:text-blue-400",
  },
  {
    icon: Mail,
    label: "Email",
    handle: "hello@amanailab.com",
    href: "mailto:hello@amanailab.com",
    hoverColor: "hover:text-orange-400",
  },
];

const subjects = [
  "General Question",
  "Collaboration / Sponsorship",
  "Course Feedback",
  "Bug Report",
  "Other",
];

type FormData = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

export default function ContactForm() {
  const [form, setForm] = useState<FormData>({
    name: "",
    email: "",
    subject: subjects[0],
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1400));
    setLoading(false);
    setSubmitted(true);
  };

  const inputClass =
    "w-full bg-zinc-900 border border-zinc-800 focus:border-orange-500/60 focus:outline-none text-zinc-100 placeholder:text-zinc-600 rounded-xl px-4 py-3 text-sm transition-colors";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-xl mb-14"
      >
        <p className="text-orange-500 text-xs font-semibold uppercase tracking-[0.2em] mb-3">
          Contact
        </p>
        <h1 className="text-4xl sm:text-5xl font-bold mb-4">Get in Touch</h1>
        <p className="text-zinc-400 text-lg leading-relaxed">
          Have a question, a collaboration idea, or just want to say hello? I&apos;d love to hear
          from you.
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-5 gap-10">
        {/* Form — 3 cols */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="lg:col-span-3"
        >
          {submitted ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center h-full flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 bg-green-400/10 border border-green-400/20 rounded-2xl flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Message Sent!</h3>
                <p className="text-zinc-400 text-sm max-w-xs">
                  Thanks for reaching out. I&apos;ll get back to you within 1–3 business days.
                </p>
              </div>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setForm({ name: "", email: "", subject: subjects[0], message: "" });
                }}
                className="text-orange-400 hover:text-orange-300 text-sm font-medium transition-colors"
              >
                Send another message →
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Name <span className="text-orange-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Your name"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Email <span className="text-orange-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@email.com"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Subject</label>
                <select
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  className={`${inputClass} cursor-pointer`}
                >
                  {subjects.map((s) => (
                    <option key={s} value={s} className="bg-zinc-900">
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Message <span className="text-orange-500">*</span>
                </label>
                <textarea
                  name="message"
                  required
                  rows={6}
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Tell me more..."
                  className={`${inputClass} resize-none`}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold px-6 py-4 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-orange-500/25 text-sm"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Message
                  </>
                )}
              </button>
            </form>
          )}
        </motion.div>

        {/* Sidebar — 2 cols */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-2 space-y-5"
        >
          {/* Social links */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <h3 className="font-semibold text-zinc-200 mb-4 flex items-center gap-2 text-sm">
              <MessageSquare className="w-4 h-4 text-orange-400" />
              Find me on
            </h3>
            <div className="space-y-1">
              {socials.map(({ icon: Icon, label, handle, href, hoverColor }) => (
                <a
                  key={label}
                  href={href}
                  target={href.startsWith("mailto") ? undefined : "_blank"}
                  rel="noopener noreferrer"
                  className={`flex items-center gap-3.5 p-2.5 rounded-xl hover:bg-zinc-800/60 transition-all group`}
                >
                  <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center shrink-0">
                    <Icon className={`w-3.5 h-3.5 text-zinc-500 ${hoverColor} group-hover:scale-110 transition-all`} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-zinc-300">{label}</p>
                    <p className="text-[11px] text-zinc-600">{handle}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Collab card */}
          <div className="bg-gradient-to-br from-orange-500/8 to-transparent border border-orange-500/15 rounded-2xl p-5">
            <h3 className="font-semibold text-zinc-200 mb-2 text-sm">Collaborations & Sponsorships</h3>
            <p className="text-zinc-400 text-xs leading-relaxed mb-3">
              Interested in sponsoring a video or partnering on AI education content? Let&apos;s
              talk business.
            </p>
            <a
              href="mailto:hello@amanailab.com"
              className="text-orange-400 hover:text-orange-300 text-xs font-semibold transition-colors"
            >
              hello@amanailab.com →
            </a>
          </div>

          {/* Response time */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <h3 className="font-semibold text-zinc-200 mb-1 text-sm">Response Time</h3>
            <p className="text-zinc-500 text-xs leading-relaxed">
              I typically respond within{" "}
              <span className="text-zinc-300 font-medium">1–3 business days</span>. For urgent
              matters, reach out directly on Twitter/X.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
