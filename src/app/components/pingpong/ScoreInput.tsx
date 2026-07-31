'use client';

import { ChangeEvent, FC, FocusEvent, useId } from 'react';

interface ScoreInputProps {
  /** Announced to screen readers, e.g. "Set 1, Marc". Never shown visually. */
  label: string;
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  className?: string;
}

/** No table tennis set reaches three digits. */
const MAX_DIGITS = 2;

/**
 * One set score.
 *
 * `type="text"` with `inputmode="numeric"` rather than `type="number"`.
 * GOV.UK moved off the number input for reasons that all apply here: a
 * scroll wheel silently changes the value, NVDA announces an unlabelled spin
 * button, and Chrome discards non-digits without telling anyone — so the
 * field can appear to accept input that never lands.
 *
 * The value is selected on focus. Baymard watched a participant try to
 * change a quantity from 1 to 2 and end up with 21, because the field was
 * not cleared first. Scores here are one or two digits, so that is precisely
 * the failure this avoids.
 *
 * No steppers: NN/g's rule is that they suit a field with one common value
 * and small deviations from it. Tapping + eleven times is the opposite.
 */
const ScoreInput: FC<ScoreInputProps> = ({
  label,
  value,
  onChange,
  invalid = false,
  className = '',
}) => {
  const id = useId();

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const next = event.target.value;

    // Empty is allowed: a cleared field is not a zero, and blocking deletion
    // would strand anyone who mistyped.
    if (next === '') {
      onChange('');
      return;
    }

    if (!/^\d+$/.test(next)) return;
    if (next.length > MAX_DIGITS) return;

    onChange(next);
  };

  const selectAll = (event: FocusEvent<HTMLInputElement>) => {
    event.target.select();
  };

  return (
    <input
      id={id}
      aria-label={label}
      aria-invalid={invalid}
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      autoComplete="off"
      value={value}
      onChange={handleChange}
      onFocus={selectAll}
      // Generous height: the research on entering data while standing found
      // walking roughly doubles touch error rates, and this form is filled
      // in next to the table rather than at a desk.
      className={`w-full h-14 text-center text-2xl font-bold rounded-lg
        bg-neutral-800 text-white tabular-nums
        border-2 transition-colors
        focus:outline-none focus:ring-2 focus:ring-emerald-500/50
        ${
          invalid
            ? 'border-error-500 focus:border-error-500'
            : 'border-neutral-700 focus:border-emerald-500'
        }
        ${className}`}
    />
  );
};

export default ScoreInput;
