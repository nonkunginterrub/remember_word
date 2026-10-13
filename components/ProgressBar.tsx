interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
}

export default function ProgressBar({ value, max, label }: ProgressBarProps) {
  const percent = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={max} aria-valuenow={value}>
      {label && <div className="progress-label">{label}</div>}
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
