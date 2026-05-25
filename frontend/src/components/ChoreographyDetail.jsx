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

  const defaultVideo = categoryToVideoKey[item.category] || null;

  const videoRef = useRef(null);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = isMuted;
  }, [isMuted]);

  if (!item)
    return (
      <div className="p-8">
        <p>Coreografía no encontrada.</p>
        <Link to="/" className="text-purple-600">
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
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <Link
          to="/"
          // We no longer allow uploading media here; the page shows the
          // category-specific video by default (or a fallback image).
        >
          <ArrowLeft size={18} /> Volver
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left: media area spanning two columns */}
          <div className="lg:col-span-2">
            {/* Centered container with black background to hold the video
                The video will use object-contain and be limited to the viewport height */}
            <div className="w-full bg-black rounded-lg overflow-hidden flex items-center justify-center">
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
                    className="absolute right-4 top-4 z-20 bg-black/40 text-white p-2 rounded-full hover:bg-black/60 transition-transform transform hover:scale-105"
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
                <div className="inline-flex items-center gap-2 bg-white/60 px-3 py-1 rounded-full">
                  <Star className="h-4 w-4 text-yellow-400" />
                  <span className="font-medium">{item.rating}</span>
                  <span className="text-sm text-gray-500">
                    ({item.reviews} reseñas)
                  </span>
                </div>

                <div className="inline-flex items-center gap-2 text-gray-500">
                  <Clock className="h-4 w-4" />
                  <span>{item.duration}</span>
                </div>

                <div className="inline-flex items-center gap-2 text-gray-500">
                  <Users className="h-4 w-4" />
                  <span>{item.responsible || "Sin asignar"}</span>
                </div>
              </div>

              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900">
                {item.title}
              </h1>
              <p className="mt-2 text-gray-500">
                {item.category} • {item.level}
              </p>

              <section className="mt-4">
                <h3 className="text-lg font-semibold mb-2">Descripción</h3>
                <p className="text-gray-700">{item.description}</p>
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
                        <span className="text-gray-700">{inc}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Requisitos */}
              {item.requirements && (
                <section className="mt-8">
                  <h3 className="text-xl font-bold mb-4">Requisitos</h3>
                  <ul className="list-inside list-disc text-gray-700 space-y-2">
                    {item.requirements.map((req, i) => (
                      <li key={i}>{req}</li>
                    ))}
                  </ul>
                </section>
              )}
            </div>

            <aside className="bg-white rounded-xl p-6 shadow-md">
              <div className="text-right text-sm text-gray-500">Precio</div>
              <div className="text-3xl font-bold mt-2">
                ${item.price?.toFixed(2) ?? "—"}
              </div>

              <div className="mt-4 grid gap-3">
                <button className="w-full bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white py-3 rounded-lg flex items-center justify-center gap-2">
                  <ShoppingCart /> Comprar Ahora
                </button>

                <button className="w-full border rounded-lg py-3 flex items-center justify-center gap-2">
                  <ShoppingCart /> Agregar al Carrito
                </button>

                <div className="flex gap-3 mt-2">
                  <button className="flex-1 border rounded-lg py-3 flex items-center justify-center">
                    <Heart />
                  </button>
                  <button className="flex-1 border rounded-lg py-3 flex items-center justify-center">
                    <Share2 />
                  </button>
                </div>
              </div>

              <div className="mt-6 border-t pt-4 text-sm text-gray-600">
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
