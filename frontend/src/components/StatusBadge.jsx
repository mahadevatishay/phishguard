export default function StatusBadge({ status }) {
  const map = {
    running: <span className="badge-success">● Running</span>,
    completed: <span className="badge-neutral">✓ Completed</span>,
    paused: <span className="badge-warning">⏸ Paused</span>,
    draft: <span className="badge-info">◌ Draft</span>,
  }
  return map[status] || <span className="badge-neutral">{status}</span>
}
