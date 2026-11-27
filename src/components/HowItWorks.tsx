import { CheckCircle2, Trophy, UserPlus } from 'lucide-react';

const STEPS = [
  { Icon: UserPlus, title: 'Sign up', text: 'Create your account with your name and a photo.' },
  { Icon: CheckCircle2, title: 'Get approved', text: 'Your instructor approves you, then you appear on the board.' },
  { Icon: Trophy, title: 'Earn points', text: 'Attend, present, help classmates. Points show up the same day.' },
];

export function HowItWorks() {
  return (
    <section aria-label="How it works" className="rounded-xl border border-(color:--c-ink)/10 bg-(color:--c-surface) p-5 sm:p-6">
      <h2 className="font-display text-lg text-(color:--c-ink) mb-4">How it works</h2>
      <ol className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {STEPS.map(({ Icon, title, text }, i) => (
          <li key={title} className="flex items-start gap-3">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-(color:--c-accent)/10 text-(color:--c-accent-d)">
              <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold text-(color:--c-ink)">
                {i + 1}. {title}
              </p>
              <p className="text-sm text-(color:--c-muted) leading-relaxed mt-0.5">{text}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
