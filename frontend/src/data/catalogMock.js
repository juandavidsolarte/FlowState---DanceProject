import choreographies from "./choreographies";

const purchasedIds = new Set([2, 5]);

export const normalizeCatalogItem = (item) => ({
  id: item.id,
  title: item.title || item.titulo || "Sin título",
  description: item.description || item.descripcion || "",
  category: item.category || item.genero || "",
  genre: item.genre || item.genero || item.category || "",
  level: item.level || item.nivel || "",
  price: Number(item.price ?? item.precio ?? 0),
  img: item.img || item.thumbnail || item.thumbnail_url || item.image_url || "",
  thumbnail: item.thumbnail || item.thumbnail_url || item.img || item.image_url || "",
  previewUrl: item.previewUrl || item.preview_url || item.preview_video || item.video_url || "",
  rating: item.rating ?? null,
  reviews: item.reviews ?? null,
  duration:
    item.duration ||
    item.duracion ||
    formatDuration(item.duracion_segundos),
  responsible: item.responsible || item.profesor || "",
  includes: item.includes || item.incluye || [],
  requirements: item.requirements || item.requisitos || [],
  purchased: Boolean(item.purchased ?? item.already_bought ?? item.ya_comprado),
});

const formatDuration = (value) => {
  const seconds = Number(value || 0);

  if (!seconds) {
    return "";
  }

  const minutes = Math.round(seconds / 60);

  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours} h ${remainingMinutes} min` : `${hours} h`;
  }

  return `${minutes} min`;
};

export const catalogMockItems = choreographies.map((item) =>
  normalizeCatalogItem({
    ...item,
    purchased: purchasedIds.has(item.id),
  }),
);

export const catalogGenres = [
  "Todos",
  ...new Set(catalogMockItems.map((item) => item.genre).filter(Boolean)),
];

export const catalogLevels = ["Todos", "Principiante", "Intermedio", "Avanzado"];

export const getCatalogItemById = (id) =>
  catalogMockItems.find((item) => String(item.id) === String(id));
