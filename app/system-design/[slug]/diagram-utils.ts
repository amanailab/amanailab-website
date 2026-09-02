// Server-safe helpers for the system-design canvas.
// Kept free of any React Flow / browser imports so it can be used during SSR.

interface DiagramNodeLike {
  id: string
  data?: { label?: string; kind?: string }
}
interface DiagramEdgeLike {
  source: string
  target: string
  data?: { label?: string }
}

// Friendly names for component kinds — so the AI still knows what a box is
// even after the user renames it (e.g. "User DB" is still a SQL Database).
const KIND_NAME: Record<string, string> = {
  client: 'Client', dns: 'DNS', cdn: 'CDN', lb: 'Load Balancer', gateway: 'API Gateway',
  ratelimit: 'Rate Limiter', auth: 'Auth Service', service: 'Service', worker: 'Worker/GPU',
  scheduler: 'Scheduler/Cron', cache: 'Cache', sql: 'SQL Database', nosql: 'NoSQL Database',
  replica: 'Read Replica', search: 'Search Index', queue: 'Message Queue', kafka: 'Kafka/Event Bus',
  stream: 'Stream Processor', blob: 'Object Storage', warehouse: 'Data Warehouse', analytics: 'Analytics',
  vector: 'Vector DB', llm: 'LLM/Model', featurestore: 'Feature Store', notify: 'Notification Service',
  websocket: 'WebSocket Server', coordinator: 'Coordination (ZooKeeper)', monitor: 'Monitoring',
}

function nodeName(n: DiagramNodeLike): string {
  const label = n.data?.label?.trim()
  const kind  = n.data?.kind
  const type  = kind ? (KIND_NAME[kind] ?? kind) : ''
  if (label && type && label.toLowerCase() !== type.toLowerCase()) return `${label} (${type})`
  return label || type || 'node'
}

/** Serialize a node/edge graph into a plain-text description for the AI reviewer. */
export function serializeDiagram(nodes: DiagramNodeLike[], edges: DiagramEdgeLike[]): string {
  if (!nodes.length) return ''

  // Build a UNIQUE display name per node. When several nodes share the same
  // name (e.g. two un-renamed "Cache" boxes) we suffix "#1, #2, ..." so the AI
  // treats them as separate components and connections stay unambiguous —
  // otherwise identical labels read as accidental duplicates.
  const baseName = new Map<string, string>()
  const total: Record<string, number> = {}
  for (const n of nodes) {
    const b = nodeName(n)
    baseName.set(n.id, b)
    total[b] = (total[b] ?? 0) + 1
  }
  const running: Record<string, number> = {}
  const byId: Record<string, string> = {}
  for (const n of nodes) {
    const b = baseName.get(n.id) as string
    if (total[b] > 1) { running[b] = (running[b] ?? 0) + 1; byId[n.id] = `${b} #${running[b]}` }
    else byId[n.id] = b
  }

  const comps = nodes.map(n => `- ${byId[n.id]}`).join('\n')

  const conns = edges.length
    ? edges.map(e => {
        const label = e.data?.label ? ` [${e.data.label}]` : ''
        return `- ${byId[e.source] ?? '?'} -->${label} ${byId[e.target] ?? '?'}`
      }).join('\n')
    : '- (components placed but NO connections drawn yet)'

  // Flag components that aren't wired to anything — useful signal for the reviewer.
  const connected = new Set<string>()
  for (const e of edges) { connected.add(e.source); connected.add(e.target) }
  const orphans = nodes.filter(n => !connected.has(n.id)).map(n => byId[n.id])
  const orphanNote = edges.length && orphans.length
    ? `\n\nComponents with no connections (possible gaps): ${orphans.join(', ')}`
    : ''

  return `Components on the canvas (${nodes.length}):\n${comps}\n\nData flow / connections (${edges.length}):\n${conns}${orphanNote}\n\nNote: components of the same type (e.g. "Cache #1" and "Cache #2") are SEPARATE instances the candidate placed on purpose — they are not duplicates; judge them by how they are wired and what role they play.`
}
