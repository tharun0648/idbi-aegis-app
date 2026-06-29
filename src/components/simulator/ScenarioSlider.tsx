/**
 * One lever as a labelled range control. Purely presentational: it owns no
 * state and does no scoring — it reports the chosen value upward, and the
 * panel feeds it to the engine. Range bounds are passed in (derived from the
 * engine's lever definitions), never guessed here.
 */
export default function ScenarioSlider({
  label,
  value,
  min,
  max,
  step,
  format,
  hint,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  hint: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <label className="text-sm font-medium text-[#1C1917]">{label}</label>
        <span className="text-sm font-semibold tabular-nums text-[#1C1917]">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        aria-label={label}
        className="mt-2.5 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[#F0EFED] accent-[#1D6F42]"
      />
      <div className="mt-1.5 flex justify-between text-xs tabular-nums text-[#A8A29E]">
        <span>{format(min)}</span>
        <span className="text-[#78716C]">{hint}</span>
        <span>{format(max)}</span>
      </div>
    </div>
  );
}
