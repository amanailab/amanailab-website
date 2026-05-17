// Positions the design workspace below the fixed site navbar (64px)
// and makes it fill the remaining viewport with its own scroll container.
export default function DesignLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 bg-zinc-950 overflow-y-auto" style={{ top: 64 }}>
      {children}
    </div>
  )
}
