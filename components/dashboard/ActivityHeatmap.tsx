// Server component — receives raw session data, renders GitHub-style heatmap

interface Props {
  sessions: { created_at: string }[]
  totalSessions: number
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAYS   = ['','M','','W','','F','']

function cellColor(count: number): string {
  if (count === 0) return 'bg-zinc-800/70'
  if (count === 1) return 'bg-orange-500/35'
  if (count === 2) return 'bg-orange-500/60'
  if (count === 3) return 'bg-orange-500/85'
  return 'bg-orange-500'
}

export default function ActivityHeatmap({ sessions, totalSessions }: Props) {
  // Build date → count map
  const countMap: Record<string, number> = {}
  sessions.forEach(s => {
    const d = s.created_at.split('T')[0]
    countMap[d] = (countMap[d] ?? 0) + 1
  })

  const activeDays  = Object.keys(countMap).length
  const longestStreak = (() => {
    const dates = Object.keys(countMap).sort()
    let best = 0; let cur = 0; let prev = ''
    for (const d of dates) {
      const diff = prev ? (new Date(d).getTime() - new Date(prev).getTime()) / 86400000 : 1
      cur = diff === 1 ? cur + 1 : 1
      best = Math.max(best, cur); prev = d
    }
    return best
  })()

  // Build 53 weeks × 7 days (Sun→Sat), going back from today
  const today   = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString().split('T')[0]

  // Start on the Sunday of 52 weeks ago
  const start = new Date(today)
  start.setDate(start.getDate() - 52 * 7)
  start.setDate(start.getDate() - start.getDay())

  const weeks: { date: Date; dateStr: string }[][] = []
  for (let w = 0; w < 53; w++) {
    const week: { date: Date; dateStr: string }[] = []
    for (let d = 0; d < 7; d++) {
      const date = new Date(start)
      date.setDate(start.getDate() + w * 7 + d)
      week.push({ date, dateStr: date.toISOString().split('T')[0] })
    }
    weeks.push(week)
  }

  // Month label positions
  const monthLabels: { label: string; col: number }[] = []
  weeks.forEach((week, wi) => {
    const m = week[0].date.getMonth()
    if (wi === 0 || weeks[wi - 1][0].date.getMonth() !== m) {
      monthLabels.push({ label: MONTHS[m], col: wi })
    }
  })

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-bold text-zinc-100">Practice Activity</p>
          <p className="text-xs text-zinc-500">{totalSessions} sessions · {activeDays} active days · {longestStreak}-day best streak</p>
        </div>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="inline-block min-w-max">
          {/* Month labels */}
          <div className="flex mb-1 pl-5">
            {weeks.map((_, wi) => {
              const ml = monthLabels.find(m => m.col === wi)
              return (
                <div key={wi} className="w-3 shrink-0 text-[9px] text-zinc-600 font-medium">
                  {ml ? ml.label : ''}
                </div>
              )
            })}
          </div>

          {/* Grid */}
          <div className="flex gap-0.5">
            {/* Day labels */}
            <div className="flex flex-col gap-0.5 mr-1">
              {DAYS.map((d, i) => (
                <div key={i} className="w-3 h-2.5 text-[8px] text-zinc-600 flex items-center justify-end pr-0.5">{d}</div>
              ))}
            </div>

            {/* Week columns */}
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-0.5">
                {week.map(({ date, dateStr }) => {
                  const count   = countMap[dateStr] ?? 0
                  const isFuture = dateStr > todayStr
                  const isToday  = dateStr === todayStr
                  return (
                    <div
                      key={dateStr}
                      title={`${dateStr}${count > 0 ? `: ${count} session${count > 1 ? 's' : ''}` : ': no activity'}`}
                      className={`w-2.5 h-2.5 rounded-[2px] transition-all cursor-default ${isFuture ? 'opacity-0' : cellColor(count)} ${isToday ? 'ring-1 ring-orange-400/60' : ''}`}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between mt-3">
        <p className="text-[10px] text-zinc-600">Last 12 months</p>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-zinc-600">Less</span>
          {[0,1,2,3,4].map(n => <div key={n} className={`w-2.5 h-2.5 rounded-[2px] ${cellColor(n)}`} />)}
          <span className="text-[10px] text-zinc-600">More</span>
        </div>
      </div>
    </div>
  )
}
