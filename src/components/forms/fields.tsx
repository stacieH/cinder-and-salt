'use client';
import { ReactNode } from 'react';
import styles from './form.module.css';

export function fieldIds(id: string) {
  return { hint: `${id}-hint`, error: `${id}-error` };
}

export function describedBy(
  id: string,
  { hint, error }: { hint?: ReactNode; error?: string },
): string | undefined {
  const ids = [hint ? fieldIds(id).hint : null, error ? fieldIds(id).error : null].filter(Boolean);
  return ids.length > 0 ? ids.join(' ') : undefined;
}

/** Moves focus to the first of `ids` present on the page (submit with errors). */
export function focusFirstInvalid(ids: string[]): void {
  for (const id of ids) {
    const element = document.getElementById(id);
    if (element) {
      element.focus();
      return;
    }
  }
}

function Label({ id, label, optional }: { id: string; label: ReactNode; optional?: boolean }) {
  return (
    <label className={styles.label} htmlFor={id}>
      {label}
      {optional && <span className={styles.optional}> (optional)</span>}
    </label>
  );
}

function HintAndError({ id, hint, error }: { id: string; hint?: ReactNode; error?: string }) {
  return (
    <>
      {hint && (
        <p id={fieldIds(id).hint} className={styles.hint}>
          {hint}
        </p>
      )}
      {error && (
        <p id={fieldIds(id).error} className={styles.error} role="alert">
          {error}
        </p>
      )}
    </>
  );
}

interface CommonProps {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
  disabled?: boolean;
  onBlur?: () => void;
}

interface TextFieldProps extends CommonProps {
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'tel' | 'password' | 'number' | 'date';
  autoComplete?: string;
  inputMode?: 'text' | 'email' | 'tel' | 'numeric';
  maxLength?: number;
  /** Date inputs only: the first and last date the field accepts. */
  min?: string;
  max?: string;
}

export function TextField({
  id,
  label,
  hint,
  error,
  optional,
  disabled,
  onBlur,
  value,
  onChange,
  type = 'text',
  autoComplete,
  inputMode,
  maxLength,
  min,
  max,
}: TextFieldProps) {
  return (
    <div className={styles.field}>
      <Label id={id} label={label} optional={optional} />
      <input
        id={id}
        type={type}
        className={styles.input}
        value={value}
        disabled={disabled}
        autoComplete={autoComplete}
        inputMode={inputMode}
        maxLength={maxLength}
        min={min}
        max={max}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy(id, { hint, error })}
      />
      <HintAndError id={id} hint={hint} error={error} />
    </div>
  );
}

interface TextAreaFieldProps extends CommonProps {
  value: string;
  onChange: (value: string) => void;
}

export function TextAreaField({
  id,
  label,
  hint,
  error,
  optional,
  disabled,
  onBlur,
  value,
  onChange,
}: TextAreaFieldProps) {
  return (
    <div className={styles.field}>
      <Label id={id} label={label} optional={optional} />
      <textarea
        id={id}
        className={styles.textarea}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy(id, { hint, error })}
      />
      <HintAndError id={id} hint={hint} error={error} />
    </div>
  );
}

export interface ChoiceOption {
  value: string;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
}

interface SelectFieldProps extends CommonProps {
  value: string;
  onChange: (value: string) => void;
  options: ChoiceOption[];
  placeholder?: string;
}

export function SelectField({
  id,
  label,
  hint,
  error,
  optional,
  disabled,
  onBlur,
  value,
  onChange,
  options,
  placeholder,
}: SelectFieldProps) {
  return (
    <div className={styles.field}>
      <Label id={id} label={label} optional={optional} />
      <select
        id={id}
        className={styles.select}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy(id, { hint, error })}
      >
        {placeholder !== undefined && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
      <HintAndError id={id} hint={hint} error={error} />
    </div>
  );
}

interface CheckboxFieldProps extends Omit<CommonProps, 'optional'> {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function CheckboxField({
  id,
  label,
  hint,
  error,
  disabled,
  onBlur,
  checked,
  onChange,
}: CheckboxFieldProps) {
  return (
    <div className={styles.field}>
      <label className={styles.checkbox} htmlFor={id}>
        <input
          id={id}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
          onBlur={onBlur}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy(id, { hint, error })}
        />
        <span>{label}</span>
      </label>
      <HintAndError id={id} hint={hint} error={error} />
    </div>
  );
}

interface RadioGroupFieldProps extends Omit<CommonProps, 'label' | 'optional'> {
  legend: ReactNode;
  value: string;
  onChange: (value: string) => void;
  options: ChoiceOption[];
}

export function RadioGroupField({
  id,
  legend,
  hint,
  error,
  disabled,
  onBlur,
  value,
  onChange,
  options,
}: RadioGroupFieldProps) {
  return (
    <fieldset
      className={styles.fieldset}
      role="radiogroup"
      aria-labelledby={`${id}-legend`}
      aria-describedby={describedBy(id, { hint, error })}
      aria-invalid={Boolean(error)}
    >
      <legend id={`${id}-legend`} className={styles.legend}>
        {legend}
      </legend>
      <div className={styles.choices}>
        {options.map((option) => {
          const optionId = `${id}-${option.value}`;
          return (
            <label key={option.value} className={styles.choice} htmlFor={optionId}>
              <input
                id={optionId}
                type="radio"
                name={id}
                value={option.value}
                checked={value === option.value}
                disabled={disabled || option.disabled}
                onChange={() => onChange(option.value)}
                onBlur={onBlur}
              />
              <span className={styles.choiceText}>
                <span>{option.label}</span>
                {option.description && (
                  <span className={styles.choiceDescription}>{option.description}</span>
                )}
              </span>
            </label>
          );
        })}
      </div>
      <HintAndError id={id} hint={hint} error={error} />
    </fieldset>
  );
}

export function FormAlert({ message }: { message: string | null }) {
  if (!message) return null;

  return (
    <p className={styles.alert} role="alert">
      {message}
    </p>
  );
}
