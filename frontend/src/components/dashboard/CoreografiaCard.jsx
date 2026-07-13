import React from "react";
import { Link } from "react-router-dom";
import { Clock3, Star } from "lucide-react";

const genreBadgeStyles = {
  Salsa: "bg-rose-500/90 text-white",
  Bachata: "bg-amber-500/90 text-white",
  "Hip Hop": "bg-cyan-500/90 text-white",
  "Hip-Hop": "bg-cyan-500/90 text-white",
  Pop: "bg-fuchsia-500/90 text-white",
  Merengue: "bg-yellow-500/90 text-white",
  Contemporáneo: "bg-violet-500/90 text-white",
  Jazz: "bg-emerald-500/90 text-white",
  "K-Pop": "bg-sky-500/90 text-white",
};

const levelMeta = {
  Principiante: { stars: 1, label: "Básico" },
  Intermedio: { stars: 2, label: "Intermedio" },
  Avanzado: { stars: 3, label: "Avanzado" },
};

const currencyFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatPrice = (value) => {
  const numericValue = Number(value ?? 0);
  if (Number.isNaN(numericValue)) return value;
  return currencyFormatter.format(numericValue).replace("US$", "$ ").replace(" $", "$");
};

const CoreografiaCard = ({ item }) => {
  const level = levelMeta[item.level] || { stars: 0, label: item.level || "" };
  const genreLabel = item.genre || item.category || "Sin género";
  const badgeClass = genreBadgeStyles[genreLabel] || "bg-purple-600/90 text-white";
  const imageSrc = item.thumbnail || item.img || "";

  return (
    <article className="group overflow-hidden rounded-2xl border border-purple-900/25 bg-[#130d26] shadow-[0_18px_50px_rgba(0,0,0,0.28)] transition-transform duration-300 hover:-translate-y-1">
      <div className="relative aspect-[4/3] overflow-hidden bg-[#0f0a1e]">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={item.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-[linear-gradient(135deg,_rgba(124,58,237,0.35),_rgba(15,10,30,0.9))]" />
        )}

        <div className="absolute inset-0 bg-[linear-gradient(180deg,_rgba(0,0,0,0.05)_0%,_rgba(0,0,0,0.45)_100%)]" />

        <div className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] shadow-lg backdrop-blur-md ${badgeClass}`}>
          {genreLabel}
        </div>

        {item.purchased && (
          <div className="absolute right-3 top-3 rounded-full border border-emerald-400/30 bg-emerald-500/85 px-3 py-1 text-xs font-semibold text-white shadow-lg backdrop-blur-md">
            Ya comprado
          </div>
        )}

        <div className="absolute bottom-3 left-3 right-3 rounded-xl border border-white/10 bg-black/45 px-3 py-2 backdrop-blur-md">
          <div className="flex items-center gap-2 text-sm text-white">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="font-semibold">{item.rating ?? "—"}</span>
          </div>
          <p className="mt-1 text-xs text-gray-200">{item.reviews ?? 0} reseñas</p>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div>
          <h3 className="text-lg font-extrabold tracking-tight text-white">{item.title}</h3>
          <p className="mt-2 text-sm text-gray-400">
            {item.responsible || "Sin profesor"} · {item.duration || "—"}
          </p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            {Array.from({ length: 3 }, (_, index) => (
              <Star
                key={`${item.id}-level-${index}`}
                className={`h-4 w-4 ${index < level.stars ? "fill-orange-500 text-orange-500" : "text-orange-900/50"}`}
              />
            ))}
            <span className="ml-2 text-xs font-medium uppercase tracking-[0.24em] text-orange-300/80">
              {level.label}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-400">
            <Clock3 className="h-4 w-4 text-emerald-400" />
            {formatPrice(item.price)}
          </div>
        </div>

        <Link
          to={`/catalogo/${item.id}`}
          className="inline-flex w-full items-center justify-center rounded-xl bg-purple-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-purple-500"
        >
          Ver detalle &gt;
        </Link>
      </div>
    </article>
  );
};

export default CoreografiaCard;