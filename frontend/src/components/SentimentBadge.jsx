export default function SentimentBadge({ label, score }) {
  const badgeClass =
    label === 'Positive' ? 'badge-positive' :
    label === 'Negative' ? 'badge-negative' :
    'badge-neutral'

  return (
    <span
      className={`${badgeClass} inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold`}
      title={`Confidence: ${(score * 100).toFixed(1)}%`}
    >
      <span className="w-1.5 h-1.5 rounded-full"
        style={{
          backgroundColor: 'currentColor',
          opacity: 0.7,
        }}
      />
      {label}
      <span className="opacity-60 font-normal">
        {(score * 100).toFixed(0)}%
      </span>
    </span>
  )
}
