import { motion } from 'motion/react';
import { Mail, MessageCircle } from 'lucide-react';
import { BOOTSTRAPPED_ADMIN_EMAIL } from '../lib/firebase';

const WHATSAPP_URL = 'https://wa.me/212693381255';

export function ContactPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="flex-1 flex flex-col"
    >
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
        <div className="w-full max-w-2xl space-y-8">
          <div className="text-center space-y-2">
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Get in Touch
            </h1>
            <p className="text-sm sm:text-base text-slate-400 max-w-md mx-auto">
              Have a question or want to send proof of an activity? Reach out directly.
            </p>
          </div>

          <section className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Email Card */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#11182E]/80 backdrop-blur-md p-6 flex flex-col justify-between gap-6 transition-all duration-200 hover:-translate-y-1 hover:border-white/15 hover:shadow-xl hover:shadow-black/30">
              <div className="space-y-3">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-indigo-400/25 bg-indigo-500/15 text-indigo-300">
                  <Mail className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="space-y-1">
                  <h2 className="font-display text-lg font-semibold text-white">
                    Email the instructor
                  </h2>
                  <p className="text-sm text-slate-300 break-all">
                    {BOOTSTRAPPED_ADMIN_EMAIL}
                  </p>
                </div>
              </div>
              <a
                href={`mailto:${BOOTSTRAPPED_ADMIN_EMAIL}`}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400 transition-colors"
              >
                <Mail className="h-4 w-4" aria-hidden="true" />
                <span>Send Email</span>
              </a>
            </div>

            {/* WhatsApp Card */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#11182E]/80 backdrop-blur-md p-6 flex flex-col justify-between gap-6 transition-all duration-200 hover:-translate-y-1 hover:border-white/15 hover:shadow-xl hover:shadow-black/30">
              <div className="space-y-3">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#25D366]/30 bg-[#25D366]/15 text-[#25D366]">
                  <MessageCircle className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="space-y-1">
                  <h2 className="font-display text-lg font-semibold text-white">
                    WhatsApp the instructor
                  </h2>
                  <p className="text-sm text-slate-300">
                    Send your activity proof directly
                  </p>
                </div>
              </div>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-[#042410] hover:bg-[#22c35e] transition-colors"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                <span>Open WhatsApp</span>
              </a>
            </div>
          </section>
        </div>
      </main>
    </motion.div>
  );
}
