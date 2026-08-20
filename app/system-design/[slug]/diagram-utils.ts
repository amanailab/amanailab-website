// Server-safe helpers for the system-design canvas.
// Kept free of any React Flow / browser imports so it can be used during SSR.

interface DiagramNodeLike {
  id: string
  data?: { label?: string; kind?: string }
}
interface DiagramEdgeLike {
  source: string
  target: string
}

/** Serialize a node/edge graph into a plain-text description for the AI reviewer. */
export function serializeDiagram(nodes: DiagramNodeLike[], edges: DiagramEdgeLike[]): string {
  if (!nodes.length) return ''
  const byId = Object.fromEntries(nodes.map(n => [n.id, n.data?.label || n.data?.kind || 'node']))
  const comps = nodes.map(n => `- ${n.data?.label || n.data?.kind || 'node'}`).join('\n')
  const conns = edges.length
    ? edges.map(e => `- ${byId[e.source] ?? '?'} → ${byId[e.target] ?? '?'}`).join('\n')
    : '- (components placed but no connections drawn yet)'
  return `Components on the canvas:\n${comps}\n\nData flow / connections:\n${conns}`
}
