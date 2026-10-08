type SegmentedControlProps<T extends string> = {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  formatLabel?: (value: T) => string;
};

export default function SegmentedControl<T extends string>({
  label, options, value, onChange, formatLabel,
}: SegmentedControlProps<T>) {
  return (
    <div className="ats-segment-control" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          className="ats-segment-option"
          aria-pressed={value === option}
          onClick={() => onChange(option)}
        >
          {formatLabel ? formatLabel(option) : option}
        </button>
      ))}
    </div>
  );
}
