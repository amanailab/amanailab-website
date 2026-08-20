// Positions the design workspace below the fixed site navbar (64px)
// and lets the workspace manage its own panels (each scrolls internally).
export default function DesignLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 bg-zinc-950 overflow-hidden" style={{ top: 64 }}>
      {children}
    </div>
  )
}
