import React from "react";

const CheckboxField = ({ id, checked, onChange, label, error }) => {
  return (
    <div className="grid gap-2">
      <label
        htmlFor={id}
        className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-4 text-sm transition ${checked ? "border-fuchsia-300/60 bg-white/8" : "border-white/10 bg-white/5 hover:bg-white/8"}`}
      >
        <input
          id={id}
          name={id}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="mt-1 h-4 w-4 rounded border-white/20 bg-transparent text-fuchsia-500 focus:ring-fuchsia-400"
        />
        <span className="text-white/90">{label}</span>
      </label>
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
    </div>
  );
};

export default CheckboxField;