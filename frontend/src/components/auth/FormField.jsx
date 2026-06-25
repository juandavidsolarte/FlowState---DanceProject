import React from "react";

const FormField = ({ id, label, error, helperText, children, required = false }) => {
  return (
    <div className="grid gap-2">
      <label htmlFor={id} className="flex items-center justify-between gap-3 text-sm font-medium text-white/90">
        <span>
          {label}
          {required ? <span className="ml-1 text-fuchsia-300">*</span> : null}
        </span>
      </label>
      {children}
      {helperText ? <p className="text-xs text-white/55">{helperText}</p> : null}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-rose-300">
          {error}
        </p>
      ) : null}
    </div>
  );
};

export default FormField;