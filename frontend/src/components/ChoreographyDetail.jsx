import React, { useRef, useState, useEffect } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import choreographies from "../data/choreographies";
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  Star,
  Clock,
  Users,
  ShoppingCart,
  Heart,
  Share2,
} from "lucide-react";
import { useCart } from "../context/CartContext";
// Import genre videos directly and map to categories so the detail
// page can play the correct video as the default media for a choreography.
import balletVideo from "../assets/video/ballet.mp4";
import capoeiraVideo from "../assets/video/capoeira.mp4";
import jazzVideo from "../assets/video/jazz.mp4";
import rapVideo from "../assets/video/rap.mp4";
import salsaVideo from "../assets/video/salsac.mp4";
import salsacVideo from "../assets/video/salsac.mp4";
import urbanVideo from "../assets/video/urban.mp4";

/**
 * ChoreographyDetail
 *
 * Detail/landing page for a single choreography. Responsibilities:
 * - Read `:id` from route params and look up the choreography in the
 *   shared `choreographies` dataset.
 * - Render a large media area where the default image is shown but the
 *   user can upload a local video/GIF/image to preview (uses URL.createObjectURL).
 * - Show title, metadata and description alongside a purchase/info panel.
 *
 * Notes about implementation:
 * - `media` state stores the temporary preview object { url, name, type }.
 * - `handleFile` accepts the first selected file, creates an object URL and
 *   stores it in state for preview. This is client-side only and not persisted.
 * - The media area chooses <video controls> for video MIME types and <img>
 *   for images/GIFs.
 */

const ChoreographyDetail = () => {
  const { id } = useParams();
  const item = choreographies.find((c) => String(c.id) === String(id));
  const { agregarItem, isInCart } = useCart();

  // Simple mapping from choreography.category to the video file.
  const categoryToVideoKey = {
    "Hip Hop": urbanVideo,
    Salsa: salsaVideo,
    Jazz: jazzVideo,
    Capoeira: capoeiraVideo,
    Ballet: balletVideo,
    Rap: rapVideo,
    // fallback keys
    Urban: urbanVideo,
    Salsac: salsacVideo,
  };

  const defaultVideo = item ? categoryToVideoKey[item.category] || null : null;
  const enCarrito = item ? isInCart(item.id) : false;

  const videoRef = useRef(null);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = isMuted;
  }, [isMuted]);

  const handleAddToCart = () => {
    if (item) {
      agregarItem(item);
    }
  };

  if (!item)
    return (
      <div className="min-h-screen bg-background p-8 text-foreground">
        <p>Coreografía no encontrada.</p>
        <Link to="/" className="text-primary hover:underline">
          Volver
        </Link>
      </div>
    );

  // Page no longer supports uploading media; it shows the category video
  // by default (or a fallback image) and presents the details on the
  // right column above the purchase card. (Si viene una imagen desde la navegación → úsala
  // Si NO viene → usa la imagen del dataset (item.img)

  const location = useLocation();
  // allow callers to pass an image URL via Link state (e.g. from courses/cards)
  const fallbackImage = location?.state?.image || item.img;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft size={18} /> Volver
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left: media area spanning two columns */}
          <div className="lg:col-span-2">
            {/* Centered container with black background to hold the video
                The video will use object-contain and be limited to the viewport height */}
            <div className="flex w-full items-center justify-center overflow-hidden rounded-lg bg-black">
              {defaultVideo ? (
                <div className="relative w-full flex items-center justify-center">
                  {/* Blurred background layer , fills area */}
                  <video
                    aria-hidden
                    src={defaultVideo}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover filter blur-sm opacity-30 pointer-events-none"
                  />

                  {/* Main video: fully visible, scaled with object-contain and limited to viewport height */}
                  <video
                    ref={videoRef}
                    src={defaultVideo}
                    autoPlay
                    loop
                    playsInline
                    muted={isMuted}
                    className="relative z-10 max-h-screen max-w-full object-contain mx-auto my-auto"
                  />

                  {/* Mute / unmute toggle (top-right overlay) */}
                  <button
                    onClick={() => setIsMuted((s) => !s)}
                    aria-label={isMuted ? "Unmute video" : "Mute video"}
                    className="absolute right-4 top-4 z-20 rounded-full bg-black/40 p-2 text-white transition-transform hover:scale-105 hover:bg-black/60"
                  >
                    {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  </button>
                </div>
              ) : (
                <div className="w-full flex items-center justify-center p-6">
                  <img
                    src={fallbackImage}
                    alt={item.title}
                    className="max-h-screen max-w-full object-contain"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Right column: title, description, then purchase card */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <div>
              <div className="flex items-center gap-4 mb-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1">
                  <Star className="h-4 w-4 text-yellow-400" />
                  <span className="font-medium">{item.rating}</span>
                  <span className="text-sm text-muted-foreground">
                    ({item.reviews} reseñas)
                  </span>
                </div>

                <div className="inline-flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{item.duration}</span>
                </div>

                <div className="inline-flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{item.responsible || "Sin asignar"}</span>
                </div>
              </div>

              <h1 className="text-3xl md:text-4xl font-extrabold text-foreground">
                {item.title}
              </h1>
              <p className="mt-2 text-muted-foreground">
                {item.category} • {item.level}
              </p>

              <section className="mt-4">
                <h3 className="text-lg font-semibold mb-2">Descripción</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </section>

              {/* Qué incluye */}
              {item.includes && (
                <section className="mt-8">
                  <h3 className="text-xl font-bold mb-4">Qué Incluye</h3>
                  <ul className="space-y-3">
                    {item.includes.map((inc, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-purple-500 text-white">
                          ✓
                        </span>
                        <span className="text-foreground">{inc}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Requisitos */}
              {item.requirements && (
                <section className="mt-8">
                  <h3 className="text-xl font-bold mb-4">Requisitos</h3>
                  <ul className="list-inside list-disc space-y-2 text-foreground">
                    {item.requirements.map((req, i) => (
                      <li key={i}>{req}</li>
                    ))}
                  </ul>
                </section>
              )}
            </div>

            <aside className="rounded-xl border border-border bg-card p-6 shadow-md">
              <div className="text-right text-sm text-muted-foreground">Precio</div>
              <div className="text-3xl font-bold mt-2">
                ${item.price?.toFixed(2) ?? "—"}
              </div>

              <div className="mt-4 grid gap-3">
                <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-purple-500 to-fuchsia-500 py-3 text-white">
                  <ShoppingCart /> Comprar Ahora
                </button>

                <button
                  onClick={handleAddToCart}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-border py-3 text-foreground transition-colors hover:bg-muted"
                >
                  <ShoppingCart /> Agregar al Carrito
                </button>

                {enCarrito ? (
                  <p className="text-center text-sm text-purple-300">
                    Esta coreografía ya está en tu carrito.
                  </p>
                ) : null}

                <div className="flex gap-3 mt-2">
                  <button className="flex flex-1 items-center justify-center rounded-lg border border-border py-3 text-foreground transition-colors hover:bg-muted">
                    <Heart />
                  </button>
                  <button className="flex flex-1 items-center justify-center rounded-lg border border-border py-3 text-foreground transition-colors hover:bg-muted">
                    <Share2 />
                  </button>
                </div>
              </div>

              <div className="mt-6 border-t border-border pt-4 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>Garantía</span>
                  <span>30 días</span>
                </div>
                <div className="flex justify-between">
                  <span>Formato</span>
                  <span>Video HD</span>
                </div>
                <div className="flex justify-between">
                  <span>Responsable</span>
                  <span className="font-medium">
                    {item.responsible || "Sin asignar"}
                  </span>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChoreographyDetail;
