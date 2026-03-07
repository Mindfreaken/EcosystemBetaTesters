"use client";

import * as React from "react";

export type UiSelectOption = {
  label: string;
  value: string;
  disabled?: boolean;
};

export type UiSelectProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: UiSelectOption[];
  placeholder?: string;
  size?: "sm" | "md";
  disabled?: boolean;
  className?: string;
  name?: string;
  id?: string;
};

function cx(...parts: Array<string | undefined | false>) {
  return parts.filter(Boolean).join(" ");
}

const base = "w-full inline-flex items-center gap-2 rounded-md border text-[color:var(--text)] bg-[color:var(--backgroundAlt)] border-[color:var(--border)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--highlight)] disabled:opacity-60 disabled:cursor-not-allowed";

const sizes = {
  sm: "h-9 px-3 text-[14px]",
  md: "h-10 px-3.5 text-[15px]",
};

export function UiSelect({ label, value, onChange, options, placeholder, size = "sm", disabled, className, name, id }: UiSelectProps) {
  const selectId = React.useId();
  const htmlId = id || selectId;

  return (
    <label className="grid gap-1 w-full" htmlFor={htmlId}>
      {label && (
        <span className="text-[12px] font-medium text-[color:var(--textSecondary)]">{label}</span>
      )}
      <div className={cx(base, sizes[size], className)}>
        <select
          id={htmlId}
          name={name}
          className={cx(
            "w-full bg-transparent appearance-none outline-none",
            "[background-image:linear-gradient(45deg,transparent_50%,currentColor_50%),linear-gradient(135deg,currentColor_50%,transparent_50%),linear-gradient(to_right,transparent,transparent)]",
            "[background-position:calc(100%-16px)_calc(50%+2px),calc(100%-10px)_calc(50%+2px),calc(100%-2.5rem)_0]",
            "[background-size:6px_6px,6px_6px,1px_100%]",
            "[background-repeat:no-repeat]"
          )}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        >
          {placeholder && (
            <option value="" disabled hidden>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </label>
  );
}

export default UiSelect;
