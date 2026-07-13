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
  img: item.img || item.thumbnail || item.image_url || "",
  thumbnail: item.thumbnail || item.img || item.image_url || "",
  previewUrl: item.previewUrl || item.preview_url || item.preview_video || item.video_url || "",
  rating: item.rating ?? null,
  reviews: item.reviews ?? null,
  duration: item.duration || item.duracion || "",
  responsible: item.responsible || item.profesor || "",
  includes: item.includes || item.incluye || [],
  requirements: item.requirements || item.requisitos || [],
  purchased: Boolean(item.purchased ?? item.already_bought ?? item.ya_comprado),
});

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
