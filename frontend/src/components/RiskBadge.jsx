export default function RiskBadge({ score }) {
  if (score >= 70) return <span className="badge-danger">High Risk {score.toFixed(0)}</span>
  if (score >= 40) return <span className="badge-warning">Medium {score.toFixed(0)}</span>
  if (score > 0) return <span className="badge-info">Low {score.toFixed(0)}</span>
  return <span className="badge-neutral">No Risk</span>
}
