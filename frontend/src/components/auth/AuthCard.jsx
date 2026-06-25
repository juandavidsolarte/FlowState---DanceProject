import React from "react";

const AuthCard = ({ children, className = "" }) => {
  return (
    <section
      className={`relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/6 p-5 shadow-[0_30px_90px_rgba(30,10,50,0.45)] backdrop-blur-2xl sm:p-8 ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.12),_transparent_45%)]" />
      <div className="relative">{children}</div>
    </section>
  );
};

export default AuthCard;