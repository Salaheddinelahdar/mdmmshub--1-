import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  LEVEL_CHART_MARKERS,
  buildStudentProgressSeries,
  getProgressChartDomain,
  type ProgressChartPoint,
} from '../lib/leaderboard';
import type { PointLog } from '../types';

interface TooltipPayloadItem {
  payload?: ProgressChartPoint;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}

function formatSignedPoints(pts: number): string {
  return pts >= 0 ? `+${pts} pts` : `${pts} pts`;
}

function CustomProgressTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0 || !payload[0]?.payload) {
    return null;
  }
  const point = payload[0].payload;
  const isPositive = point.dayPoints >= 0;

  if (point.actions.length === 1) {
    return (
      <div className="rounded-xl border border-white/15 bg-[#0A0F1E]/95 backdrop-blur-md px-3 py-2 shadow-xl shadow-black/40 max-w-[280px]">
        <p className="text-xs font-medium text-white leading-snug">
          <span className="text-slate-400 font-mono-tabular">{point.dateLabel}</span>
          <span className="text-slate-500"> · </span>
          <span className={`font-mono-tabular font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatSignedPoints(point.dayPoints)}
          </span>
          <span className="text-slate-500"> · </span>
          <span>{point.actions[0].action}</span>
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/15 bg-[#0A0F1E]/95 backdrop-blur-md px-3 py-2 shadow-xl shadow-black/40 max-w-[280px] space-y-1">
      <p className="text-xs font-medium text-white">
        <span className="text-slate-400 font-mono-tabular">{point.dateLabel}</span>
        <span className="text-slate-500"> · </span>
        <span className={`font-mono-tabular font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
          {formatSignedPoints(point.dayPoints)}
        </span>
      </p>
      <ul className="space-y-0.5 text-[11px] text-slate-300">
        {point.actions.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-3">
            <span className="truncate">{item.action}</span>
            <span
              className={`font-mono-tabular font-semibold shrink-0 ${
                item.points >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {formatSignedPoints(item.points)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const EMPTY_BASELINE_DATA: ProgressChartPoint[] = [
  {
    key: 'empty_start',
    dateKey: 'empty_start',
    dateLabel: '',
    fullDateLabel: '',
    dayPoints: 0,
    cumulativePoints: 0,
    actions: [],
    tooltipSummary: '',
    createdAt: 0,
  },
  {
    key: 'empty_end',
    dateKey: 'empty_end',
    dateLabel: '',
    fullDateLabel: '',
    dayPoints: 0,
    cumulativePoints: 0,
    actions: [],
    tooltipSummary: '',
    createdAt: 0,
  },
];

const MARKER_LABEL_BY_POINTS = new Map(
  LEVEL_CHART_MARKERS.map((m) => [m.points, m.shortLabel])
);

interface LevelYAxisTickProps {
  x?: number | string;
  y?: number | string;
  payload?: { value?: number };
}

function LevelYAxisTick({ x = 0, y = 0, payload }: LevelYAxisTickProps) {
  const val = payload?.value;
  if (val === undefined) return null;
  const label = MARKER_LABEL_BY_POINTS.get(val) ?? String(val);
  return (
    <text
      x={Number(x) - 6}
      y={Number(y)}
      dy={3.5}
      textAnchor="end"
      fill="#94A3B8"
      fontSize={11}
      fontWeight={500}
    >
      {label}
    </text>
  );
}

export function PointsProgressChart({ logs }: { logs: PointLog[] }) {
  const series = useMemo(() => buildStudentProgressSeries(logs), [logs]);
  const isEmpty = series.length === 0;
  const chartData = isEmpty ? EMPTY_BASELINE_DATA : series;
  const [minY, maxY] = useMemo(() => getProgressChartDomain(series), [series]);

  const pointByKey = useMemo(() => {
    const map = new Map<string, ProgressChartPoint>();
    for (const pt of series) {
      map.set(pt.key, pt);
    }
    return map;
  }, [series]);

  const yTicks = useMemo(() => LEVEL_CHART_MARKERS.map((m) => m.points), []);

  return (
    <section aria-labelledby="my-progress-heading" className="space-y-3">
      <h2 id="my-progress-heading" className="font-display text-lg sm:text-xl font-bold text-white">
        My Progress
      </h2>

      <div className="rounded-2xl border border-white/[0.08] bg-[#11182E]/80 backdrop-blur-md p-3 sm:p-5">
        <div className="relative h-[220px] sm:h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 760, height: 250 }}>
            <AreaChart
              data={chartData}
              margin={{ top: 14, right: 12, left: 0, bottom: 4 }}
            >
              <defs>
                <linearGradient id="progressAreaFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366F1" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
                </linearGradient>
                <filter id="indigoVioletGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#8B5CF6" floodOpacity="0.65" />
                </filter>
              </defs>

              <CartesianGrid
                stroke="rgba(255, 255, 255, 0.04)"
                strokeDasharray="3 3"
                vertical={false}
              />

              <XAxis
                dataKey="key"
                tickFormatter={(key: string) => pointByKey.get(key)?.dateLabel ?? ''}
                tick={{ fill: '#94A3B8', fontSize: 11 }}
                axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                tickLine={false}
                minTickGap={24}
              />

              <YAxis
                domain={[minY, maxY]}
                ticks={yTicks}
                tick={<LevelYAxisTick />}
                axisLine={false}
                tickLine={false}
                width={74}
              />

              {isEmpty && (
                <ReferenceLine
                  y={0}
                  stroke="#6366F1"
                  strokeDasharray="6 6"
                  strokeOpacity={0.75}
                />
              )}

              {LEVEL_CHART_MARKERS.map((marker) => (
                <ReferenceLine
                  key={marker.points}
                  y={marker.points}
                  stroke={marker.color}
                  strokeOpacity={0.32}
                  strokeDasharray="5 5"
                />
              ))}

              {!isEmpty && (
                <Tooltip
                  content={<CustomProgressTooltip />}
                  cursor={{ stroke: 'rgba(139, 92, 246, 0.35)', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
              )}

              <Area
                type="monotone"
                dataKey="cumulativePoints"
                stroke="#6366F1"
                strokeWidth={isEmpty ? 0 : 2.5}
                strokeOpacity={isEmpty ? 0 : 1}
                filter={isEmpty ? undefined : 'url(#indigoVioletGlow)'}
                fill={isEmpty ? 'none' : 'url(#progressAreaFill)'}
                dot={
                  isEmpty
                    ? false
                    : {
                        r: 4,
                        fill: '#6366F1',
                        stroke: '#C4B5FD',
                        strokeWidth: 2,
                      }
                }
                activeDot={
                  isEmpty
                    ? false
                    : {
                        r: 6,
                        fill: '#8B5CF6',
                        stroke: '#FFFFFF',
                        strokeWidth: 2,
                      }
                }
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>

          {isEmpty && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center pl-[74px] pr-3 pb-5">
              <p className="rounded-xl border border-white/[0.08] bg-[#0A0F1E]/92 backdrop-blur-sm px-3.5 py-2 text-center text-xs sm:text-sm text-slate-300 shadow-lg shadow-black/30 max-w-[260px] sm:max-w-sm">
                Your progress will appear here once you earn your first points
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
