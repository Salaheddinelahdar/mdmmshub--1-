import { useEffect, useState } from 'react';
import { Download, Share2, X } from 'lucide-react';
import type { RankedStudent } from '../types';
import { useTheme } from '../lib/theme';

const W = 1080;
const H = 1350;

const LIGHT = { page: '#F5F1EA', ink: '#1F1E1D', muted: '#6B6760', surface: '#FFFDF9', line: 'rgba(31,30,29,0.12)' };
const DARK = { page: '#262624', ink: '#F0EEE6', muted: '#A8A398', surface: '#30302E', line: 'rgba(240,238,230,0.14)' };

function draw(top: RankedStudent[], seasonName: string, total: number, dark: boolean): string {
  const P = dark ? DARK : LIGHT;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d')!;
  g.fillStyle = P.page;
  g.fillRect(0, 0, W, H);

  const serif = "Newsreader, Georgia, 'Times New Roman', serif";
  const sans = "Inter, system-ui, -apple-system, 'Segoe UI', sans-serif";

  g.fillStyle = P.ink;
  g.font = `500 54px ${serif}`;
  g.fillText('MDMMS', 80, 120);
  const w = g.measureText('MDMMS').width;
  g.fillStyle = '#C96442';
  g.fillText('space', 80 + w, 120);

  g.fillStyle = P.muted;
  g.font = `400 30px ${sans}`;
  g.fillText(`Marketing Digital Cohort, UCA  ·  ${seasonName}`, 80, 175);

  g.fillStyle = P.ink;
  g.font = `500 92px ${serif}`;
  g.fillText('Class leaderboard', 80, 330);
  g.fillStyle = P.muted;
  g.font = `400 34px ${sans}`;
  g.fillText('Top 3 right now', 80, 390);

  const rowH = 230;
  top.slice(0, 3).forEach((s, i) => {
    const y = 450 + i * (rowH + 30);
    g.fillStyle = P.surface;
    g.strokeStyle = i === 0 ? 'rgba(201,100,66,0.55)' : P.line;
    g.lineWidth = 3;
    const r = 28;
    g.beginPath();
    g.roundRect(80, y, W - 160, rowH, r);
    g.fill();
    g.stroke();

    g.fillStyle = i === 0 ? '#C96442' : P.muted;
    g.font = `500 100px ${serif}`;
    g.fillText(`#${s.rank}`, 130, y + 145);

    g.fillStyle = P.ink;
    g.font = `500 52px ${serif}`;
    const name = s.name.length > 20 ? s.name.slice(0, 19) + '…' : s.name;
    g.fillText(name, 340, y + 105);
    g.fillStyle = P.muted;
    g.font = `400 30px ${sans}`;
    g.fillText(s.weeklyPoints > 0 ? `+${s.weeklyPoints} pts this week` : 'Ready for more points', 340, y + 155);

    g.fillStyle = P.ink;
    g.textAlign = 'right';
    g.font = `600 58px ${sans}`;
    g.fillText(`${s.totalPoints}`, W - 130, y + 118);
    g.fillStyle = P.muted;
    g.font = `400 28px ${sans}`;
    g.fillText('pts', W - 130, y + 160);
    g.textAlign = 'left';
  });

  g.fillStyle = P.muted;
  g.font = `400 30px ${sans}`;
  g.fillText(`${total} students  ·  mdmms.space`, 80, H - 90);
  return c.toDataURL('image/png');
}

async function dataUrlToFile(url: string): Promise<File> {
  const blob = await (await fetch(url)).blob();
  return new File([blob], 'mdmmsspace-top3.png', { type: 'image/png' });
}

export function ShareLeaderboard({ top, seasonName, total }: { top: RankedStudent[]; seasonName: string; total: number }) {
  const [open, setOpen] = useState(false);
  const [img, setImg] = useState('');
  const [canShare, setCanShare] = useState(false);
  const { resolved } = useTheme();

  useEffect(() => {
    if (!open) return;
    const make = () => setImg(draw(top, seasonName, total, resolved === 'dark'));
    // wait for web fonts so the image uses the site fonts
    if (document.fonts?.ready) document.fonts.ready.then(make);
    else make();
  }, [open, top, seasonName, total, resolved]);

  useEffect(() => {
    if (!img || !navigator.canShare) return;
    dataUrlToFile(img).then((f) => setCanShare(navigator.canShare({ files: [f] }))).catch(() => setCanShare(false));
  }, [img]);

  if (top.length === 0) return null;

  const share = async () => {
    try {
      const f = await dataUrlToFile(img);
      await navigator.share({ files: [f], title: 'MDMMSspace top 3' });
    } catch {
      /* user cancelled */
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-(color:--c-ink)/15 bg-(color:--c-surface) px-4 py-2 text-sm font-medium text-(color:--c-ink) hover:bg-(color:--c-soft) transition-colors cursor-pointer whitespace-nowrap"
      >
        <Share2 className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
        Share top 3
      </button>
      {open && (
        <div role="dialog" aria-modal="true" aria-label="Share the top 3" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md max-h-[92vh] overflow-auto rounded-xl border border-(color:--c-ink)/10 bg-(color:--c-surface) p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg text-(color:--c-ink)">Share the top 3</h2>
              <button type="button" aria-label="Close" onClick={() => setOpen(false)} className="p-1 text-(color:--c-muted) hover:text-(color:--c-ink) cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            {img ? <img src={img} alt="Top 3 leaderboard card" className="w-full rounded-lg border border-(color:--c-ink)/10" /> : <div className="h-64 rounded-lg bg-(color:--c-soft)" />}
            <div className="flex gap-2">
              {canShare && (
                <button type="button" onClick={share} className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-(color:--c-accent) px-4 py-2.5 text-sm font-semibold text-white hover:bg-(color:--c-accent-d) cursor-pointer">
                  <Share2 className="h-4 w-4" aria-hidden="true" /> Share
                </button>
              )}
              <a
                href={img}
                download="mdmmsspace-top3.png"
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-(color:--c-ink)/15 px-4 py-2.5 text-sm font-medium text-(color:--c-ink) hover:bg-(color:--c-soft)"
              >
                <Download className="h-4 w-4" aria-hidden="true" /> Download image
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
