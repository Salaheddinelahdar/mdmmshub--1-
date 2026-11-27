import { motion } from 'motion/react';

export function WhatsAppButton() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-30"
    >
      <div className="group relative flex items-center">
        {/* Tooltip on hover / focus-visible */}
        <div
          role="tooltip"
          className="pointer-events-none hidden sm:block absolute right-full mr-3 whitespace-nowrap rounded-lg border border-(color:--c-ink)/[0.10] bg-(color:--c-surface) px-3 py-1.5 text-xs font-medium text-(color:--c-ink2) shadow-sm opacity-0 translate-x-1 transition-all duration-150 group-hover:opacity-100 group-hover:translate-x-0 group-focus-within:opacity-100 group-focus-within:translate-x-0"
        >
          Send proof of activity to instructor
        </div>

        <a
          href="https://wa.me/212693381255"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Send proof of activity to instructor"
          title="Send proof of activity to instructor"
          className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-[#25D366]/25 transition-transform duration-150 hover:scale-105 hover:bg-[#20BD5A] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0F1E]"
        >
          <svg
            viewBox="0 0 32 32"
            fill="currentColor"
            aria-hidden="true"
            className="h-6 w-6 sm:h-7 sm:w-7"
          >
            <path d="M16.004 3.2c-7.056 0-12.8 5.744-12.8 12.8 0 2.256.592 4.464 1.712 6.4L3.2 28.8l6.576-1.728a12.74 12.74 0 0 0 6.228 1.608h.004c7.056 0 12.796-5.744 12.796-12.8 0-3.416-1.332-6.628-3.748-9.044A12.715 12.715 0 0 0 16.004 3.2Zm7.46 18.212c-.312.88-1.82 1.68-2.536 1.784-.648.096-1.468.136-2.368-.152-.544-.176-1.244-.404-2.14-.792-3.764-1.624-6.224-5.412-6.412-5.664-.188-.252-1.532-2.04-1.532-3.892 0-1.852.972-2.764 1.316-3.14.344-.376.752-.472 1.004-.472.252 0 .5.004.72.012.232.012.544-.088.852.652.312.752 1.064 2.596 1.156 2.784.092.188.156.408.032.66-.124.252-.188.408-.376.628-.188.22-.396.492-.564.66-.188.188-.384.392-.164.768.22.376.976 1.612 2.096 2.612 1.44 1.284 2.652 1.684 3.028 1.872.376.188.596.156.816-.096.22-.252.94-1.096 1.192-1.472.252-.376.5-.312.844-.188.344.124 2.192 1.032 2.568 1.22.376.188.628.28.72.436.092.156.092.904-.22 1.784Z" />
          </svg>
        </a>
      </div>
    </motion.div>
  );
}
