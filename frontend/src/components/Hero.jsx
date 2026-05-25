import React from "react";
import { Play } from "lucide-react";
import hero1 from "../assets/images/hero1.jpg";
import hero2 from "../assets/images/hero2.jpg";
import hero3 from "../assets/images/hero3.jpg";
import hero4 from "../assets/images/hero4.jpg";

const Hero = () => {
  const bgClass =
    "relative h-full w-1/5 rounded-2xl bg-cover bg-center transform-gpu overflow-hidden flex-shrink-0";

  return (
    <section className="relative flex flex-col items-center justify-center pt-20 pb-32 overflow-hidden">
      {/* Background image columns (hero1..hero4) */}
      <div className="pointer-events-none select-none absolute inset-0 flex items-stretch justify-center z-0 px-12 gap-6">
        <div className={bgClass} style={{ backgroundImage: `url(${hero1})` }}>
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm" />
        </div>

        <div className={bgClass} style={{ backgroundImage: `url(${hero2})` }}>
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm" />
        </div>

        <div className={bgClass} style={{ backgroundImage: `url(${hero3})` }}>
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm" />
        </div>

        <div className={bgClass} style={{ backgroundImage: `url(${hero4})` }}>
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm" />
        </div>
      </div>

      {/* Badge Superior */}
      <div className="mb-6 px-4 py-1.5 rounded-full bg-gray-100/80 border border-gray-200 flex items-center gap-2 text-sm text-gray-600 z-10">
        <span className="text-purple-500">📈</span>
        Más de 1,000 coreografías disponibles
      </div>

      {/* Título Principal */}
      <h1 className="text-7xl font-black text-center leading-tight text-slate-900 mb-6 z-10">
        Encuentra tu <br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-500 to-purple-600">
          Flowstate
        </span>
      </h1>

      <p className="max-w-2xl text-center text-xl text-gray-500 mb-10 leading-relaxed z-10">
        Domina cualquier estilo de baile con más de 1000 coreografías
        profesionales. Desde Hip Hop hasta Salsa, todo en un solo lugar.
      </p>

      {/* Botones de Acción */}
      <div className="flex gap-4 z-10">
        <button className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white px-8 py-4 rounded-2xl font-bold shadow-xl shadow-purple-200 hover:opacity-90 transition-all">
          <Play size={20} fill="currentColor" />
          Explorar Coreografías
        </button>
        <button className="px-10 py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold hover:bg-gray-200 transition-all">
          Ver Demo
        </button>
      </div>
    </section>
  );
};

export default Hero;
