// Makes the problem page truly full-screen below the fixed navbar,
// hiding the Footer that the root layout always renders.
export default function ProblemLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 bg-zinc-950 overflow-hidden" style={{ top: 64 }}>
      {children}
    </div>
  )
}
