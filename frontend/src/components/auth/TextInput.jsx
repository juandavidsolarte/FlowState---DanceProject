import React from "react";

const baseClassName =
  "w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-3.5 text-white placeholder:text-white/35 shadow-sm outline-none transition duration-200 focus:border-fuchsia-300/70 focus:bg-white/10 focus:ring-2 focus:ring-fuchsia-400/30";

const TextInput = ({ icon: Icon, className = "", ...props }) => {
  return (
    <div className="relative">
      {Icon ? (
        <Icon className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-white/45" />
      ) : null}
      <input
        {...props}
        className={`${baseClassName} ${Icon ? "pl-11" : ""} ${className}`}
      />
    </div>
  );
};

export default TextInput;