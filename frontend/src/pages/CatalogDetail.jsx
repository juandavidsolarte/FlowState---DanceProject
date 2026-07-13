import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Clock, DollarSign, PlayCircle, Star, Users } from "lucide-react";
import { loadCatalogItem } from "../services/catalog";
import { useCart } from "../context/CartContext";
import balletVideo from "../assets/video/ballet.mp4";
import capoeiraVideo from "../assets/video/capoeira.mp4";
import jazzVideo from "../assets/video/jazz.mp4";
import rapVideo from "../assets/video/rap.mp4";
import salsaVideo from "../assets/video/salsac.mp4";
import urbanVideo from "../assets/video/urban.mp4";

const videoByGenre = {
  "Hip Hop": urbanVideo,
  Salsa: salsaVideo,
  Jazz: jazzVideo,
  Capoeira: capoeiraVideo,
  Ballet: balletVideo,
  Rap: rapVideo,
  Urban: urbanVideo,
};

const formatCurrency = (value) =>
  `$${Number(value || 0).toLocaleString("es-CO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const CatalogDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const previewRef = useRef(null);
  const [previewMessage, setPreviewMessage] = useState("Vista previa de 30 segundos");
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { agregarItem, isInCart } = useCart();

  const previewVideo = item
    ? item.previewUrl || videoByGenre[item.category || item.genre] || null
    : null;
  const enCarrito = item ? isInCart(item.id) : false;

  useEffect(() => {
    setPreviewMessage("Vista previa de 30 segundos");
    if (previewRef.current) {
      previewRef.current.currentTime = 0;
    }
  }, [id]);

  useEffect(() => {
    let isActive = true;

    const loadItem = async () => {
      setLoading(true);
      setError(null);

      try {
        const catalogItem = await loadCatalogItem(id);
        if (!isActive) return;

        if (!catalogItem) {
          setError("Coreografía no encontrada.");
          setItem(null);
          return;
        }

        setItem(catalogItem);
      } catch (fetchError) {
        if (!isActive) return;
        setError("No se pudo cargar la coreografía.");
        setItem(null);
        console.error(fetchError);
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    loadItem();

    return () => {
      isActive = false;
    };
  }, [id]);

  const handlePreviewTimeUpdate = () => {
    if (!previewRef.current) return;
    if (previewRef.current.currentTime >= 30) {
      previewRef.current.pause();
      previewRef.current.currentTime = 30;
      setPreviewMessage("La vista previa llegó al límite de 30 segundos");
    }
  };

  const handleAddToCart = () => {
    if (item) {
      agregarItem(item);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0a1e] px-6 py-20 text-white">
        <div className="mx-auto max-w-4xl rounded-3xl border border-purple-900/20 bg-[#130d26] p-8 text-gray-300">
          Cargando coreografía...
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen bg-[#0f0a1e] px-6 py-20 text-white">
        <div className="mx-auto max-w-4xl rounded-3xl border border-purple-900/20 bg-[#130d26] p-8">
          <p className="text-gray-400">{error || "Coreografía no encontrada."}</p>
          <button
            onClick={() => navigate("/catalogo")}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-purple-600 px-5 py-3 font-medium text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Volver al catálogo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0a1e] text-white">
      <div className="mx-auto max-w-7xl px-6 py-8 md:px-10">
        <Link
          to="/catalogo"
          className="inline-flex items-center gap-2 text-sm text-gray-400 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Volver al catálogo
        </Link>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_0.9fr]">
          <section className="overflow-hidden rounded-[2rem] border border-purple-900/20 bg-[#130d26] shadow-2xl shadow-black/20">
            <div className="relative bg-black">
              <div className="absolute left-4 top-4 z-10 rounded-full border border-white/20 bg-black/50 px-3 py-1 text-xs uppercase tracking-[0.28em] text-white">
                Preview 30s
              </div>
              {previewVideo ? (
                <video
                  ref={previewRef}
                  src={previewVideo}
                  autoPlay
                  muted
                  controls
                  playsInline
                  onTimeUpdate={handlePreviewTimeUpdate}
                  onLoadedMetadata={() => {
                    if (previewRef.current) {
                      previewRef.current.currentTime = 0;
                    }
                  }}
                  className="h-[420px] w-full object-cover md:h-[560px]"
                />
              ) : (
                <img
                  src={item.img}
                  alt={item.title}
                  className="h-[420px] w-full object-cover md:h-[560px]"
                />
              )}
            </div>
          </section>

          <aside className="space-y-6 rounded-[2rem] border border-purple-900/20 bg-[#130d26] p-6 shadow-2xl shadow-black/20">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-purple-300/80">Catálogo</p>
                <h1 className="mt-2 text-3xl font-black leading-tight">{item.title}</h1>
                <p className="mt-2 text-gray-400">
                  {item.category || item.genre} · {item.level}
                </p>
              </div>
              {item.purchased && (
                <span className="rounded-full border border-emerald-400/30 bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-100">
                  Ya comprado
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-purple-900/20 bg-[#0f0a1e] p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-gray-400">Precio</p>
                <div className="mt-2 flex items-center gap-2 text-xl font-semibold">
                  <DollarSign className="h-5 w-5 text-purple-300" />
                  {formatCurrency(item.price)}
                </div>
              </div>
              <div className="rounded-2xl border border-purple-900/20 bg-[#0f0a1e] p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-gray-400">Duración</p>
                <div className="mt-2 flex items-center gap-2 text-xl font-semibold">
                  <Clock className="h-5 w-5 text-purple-300" />
                  {item.duration || "—"}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 text-sm text-gray-300">
              <span className="inline-flex items-center gap-2 rounded-full border border-purple-900/20 bg-[#0f0a1e] px-3 py-2">
                <Star className="h-4 w-4 text-yellow-400" />
                {item.rating ?? "—"}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-purple-900/20 bg-[#0f0a1e] px-3 py-2">
                <Users className="h-4 w-4 text-purple-300" />
                {item.responsible || "Sin instructor"}
              </span>
            </div>

            <div>
              <h2 className="text-lg font-semibold">Descripción</h2>
              <p className="mt-2 text-sm leading-7 text-gray-300">{item.description}</p>
            </div>

            {item.includes?.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold">Incluye</h2>
                <ul className="mt-3 space-y-2 text-sm text-gray-300">
                  {item.includes.map((entry) => (
                    <li key={entry} className="flex items-start gap-3">
                      <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-purple-600/30 text-xs text-white">
                        ✓
                      </span>
                      <span>{entry}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {item.requirements?.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold">Requisitos</h2>
                <ul className="mt-3 space-y-2 text-sm text-gray-300">
                  {item.requirements.map((entry) => (
                    <li key={entry} className="flex items-start gap-3">
                      <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full border border-purple-900/30 text-xs text-purple-300">
                        !
                      </span>
                      <span>{entry}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="rounded-2xl border border-purple-900/20 bg-[#0f0a1e] p-4 text-sm text-gray-300">
              <p className="font-medium text-white">{previewMessage}</p>
              <p className="mt-1">La reproducción se detiene automáticamente al llegar a los 30 segundos.</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-500 px-4 py-3 font-semibold text-white transition hover:opacity-90">
                <PlayCircle className="h-5 w-5" /> Comprar ahora
              </button>
              <button
                onClick={handleAddToCart}
                className="rounded-2xl border border-purple-900/30 px-4 py-3 font-medium text-white transition hover:bg-purple-900/20"
              >
                Agregar al carrito
              </button>
            </div>

            {enCarrito ? (
              <p className="text-sm text-purple-300">Esta coreografía ya está en tu carrito.</p>
            ) : null}
          </aside>
        </div>
      </div>
    </div>
  );
};

export default CatalogDetail;