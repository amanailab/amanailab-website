export async function fireConfetti() {
  const { default: confetti } = await import('canvas-confetti')
  confetti({
    particleCount: 130,
    spread: 75,
    origin: { y: 0.6 },
    colors: ['#f97316', '#fb923c', '#fbbf24', '#34d399', '#60a5fa', '#a78bfa'],
  })
}

export async function fireSuccessConfetti() {
  const { default: confetti } = await import('canvas-confetti')
  const colors = ['#4ade80', '#22c55e', '#86efac', '#f0fdf4']
  confetti({ particleCount: 90, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors })
  setTimeout(() => confetti({ particleCount: 90, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors }), 150)
}

export async function fireAchievementConfetti() {
  const { default: confetti } = await import('canvas-confetti')
  const colors = ['#facc15', '#f97316', '#ec4899', '#8b5cf6', '#06b6d4']
  // Stars burst
  confetti({ particleCount: 60, spread: 100, origin: { y: 0.5 }, shapes: ['star'], colors })
  setTimeout(() => confetti({ particleCount: 40, spread: 60, origin: { y: 0.4 }, colors }), 200)
}
