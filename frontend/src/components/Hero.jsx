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
    <section className="relative flex flex-col items-center justify-center overflow-hidden pb-28 pt-20">
      {/* Background image columns (hero1..hero4) */}
      <div className="pointer-events-none select-none absolute inset-0 flex items-stretch justify-center z-0 px-12 gap-6">
        <div className={bgClass} style={{ backgroundImage: `url(${hero1})` }}>
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm dark:bg-background/75" />
        </div>

        <div className={bgClass} style={{ backgroundImage: `url(${hero2})` }}>
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm dark:bg-background/75" />
        </div>

        <div className={bgClass} style={{ backgroundImage: `url(${hero3})` }}>
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm dark:bg-background/75" />
        </div>

        <div className={bgClass} style={{ backgroundImage: `url(${hero4})` }}>
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm dark:bg-background/75" />
        </div>
      </div>

      {/* Badge Superior */}
      <div className="z-10 mb-6 flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-1.5 text-sm text-muted-foreground backdrop-blur-sm">
        <span className="text-purple-500 dark:text-fuchsia-400">📈</span>
        Más de 1,000 coreografías disponibles
      </div>

      

      {/* Título Principal */}
      <h1 className="z-10 mb-6 text-center text-7xl font-black leading-tight text-foreground dark:text-slate-50">
        Encuentra tu <br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-500 to-purple-600 dark:from-fuchsia-300 dark:via-fuchsia-400 dark:to-purple-300">
          Flowstate
        </span>
      </h1>

      <p className="z-10 mb-10 max-w-2xl text-center text-xl leading-relaxed text-muted-foreground dark:text-slate-400">
        Domina cualquier estilo de baile con más de 1000 coreografías
        profesionales. Desde Hip Hop hasta Salsa, todo en un solo lugar.
      </p>

      {/* Botones de Acción */}
      <div className="flex gap-4 z-10">
        <button className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-500 to-fuchsia-500 px-8 py-4 font-bold text-white shadow-xl shadow-purple-200 transition-all hover:opacity-90">
          <Play size={20} fill="currentColor" />
          Explorar Coreografías
        </button>
        <button className="rounded-2xl bg-muted px-10 py-4 font-bold text-foreground transition-all hover:bg-muted/80">
          Ver Demo
        </button>
      </div>
    </section>
  );
};

export default Hero;
