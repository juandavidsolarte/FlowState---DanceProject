import api from "./api";
import {
  catalogGenres,
  catalogLevels,
  catalogMockItems,
  normalizeCatalogItem,
} from "../data/catalogMock";

export const CATALOG_PAGE_SIZE = 8;

const getCatalogPageCount = (totalItems, pageSize) =>
  Math.max(1, Math.ceil((totalItems || 0) / pageSize));

const cleanParam = (value) => {
  if (value === undefined || value === null || value === "") return undefined;
  return value;
};

const normalizeMultiValue = (value) => {
  if (Array.isArray(value)) {
    if (value.length === 0) return undefined;
    return value.join(",");
  }

  return cleanParam(value);
};

const normalizePriceValue = (filters, key, fallbackKey) =>
  cleanParam(filters?.[key] ?? filters?.[fallbackKey]);

export const buildCatalogQueryParams = (filters, page) => {
  const params = {
    search: cleanParam(filters.search?.trim()),
    genero: normalizeMultiValue(filters.genres ?? filters.genre),
    nivel: normalizeMultiValue(filters.levels ?? filters.level),
    precio_min: normalizePriceValue(filters, "priceMin", "priceRangeMin"),
    precio_max: normalizePriceValue(filters, "priceMax", "priceRangeMax"),
    page,
  };

  Object.keys(params).forEach((key) => {
    if (params[key] === undefined) {
      delete params[key];
    }
  });

  return params;
};

const extractCatalogItems = (payload) => {
  if (Array.isArray(payload)) return payload;
  return payload?.results ?? payload?.items ?? null;
};

const extractCatalogItem = (payload, id) => {
  if (!payload) return null;

  if (Array.isArray(payload)) {
    return payload.find((item) => String(item.id) === String(id)) ?? null;
  }

  if (Array.isArray(payload?.results)) {
    return payload.results.find((item) => String(item.id) === String(id)) ?? null;
  }

  if (payload?.id !== undefined) {
    return payload;
  }

  return null;
};

export const filterLocalCatalogItems = (items, filters) => {
  const searchTerm = filters.search.trim().toLowerCase();
  const selectedGenres = Array.isArray(filters.genres)
    ? filters.genres
    : filters.genre && filters.genre !== "Todos"
      ? [filters.genre]
      : [];
  const selectedLevels = Array.isArray(filters.levels)
    ? filters.levels
    : filters.level && filters.level !== "Todos"
      ? [filters.level]
      : [];
  const min = Number(filters.priceMin ?? filters.priceRangeMin ?? 0);
  const max = Number(filters.priceMax ?? filters.priceRangeMax ?? 50);

  return items.filter((item) => {
    const matchesSearch =
      !searchTerm ||
      [item.title, item.description, item.category, item.level, item.responsible]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(searchTerm));

    const matchesGenre = selectedGenres.length === 0 || selectedGenres.includes(item.genre);
    const matchesLevel = selectedLevels.length === 0 || selectedLevels.includes(item.level);
    const matchesMin = min === null || Number(item.price) >= min;
    const matchesMax = max === null || Number(item.price) <= max;

    return matchesSearch && matchesGenre && matchesLevel && matchesMin && matchesMax;
  });
};

export const getLocalCatalogPage = (filters, page, pageSize = CATALOG_PAGE_SIZE) => {
  const filteredItems = filterLocalCatalogItems(catalogMockItems, filters);
  const start = (page - 1) * pageSize;

  return {
    items: filteredItems.slice(start, start + pageSize),
    totalItems: filteredItems.length,
    totalPages: getCatalogPageCount(filteredItems.length, pageSize),
    source: "mock",
  };
};

export const loadCatalogPage = async (filters, page, pageSize = CATALOG_PAGE_SIZE) => {
  try {
    const params = buildCatalogQueryParams(filters, page);
    const response = await api.get("/catalogo/", { params });
    const remoteItems = extractCatalogItems(response.data);

    if (remoteItems !== null) {
      const normalized = remoteItems.map(normalizeCatalogItem);
      const totalItems = Number(response.data?.count ?? normalized.length);
      const remotePageSize = Number(response.data?.page_size ?? pageSize) || pageSize;

      return {
        items: normalized,
        totalItems,
        totalPages: getCatalogPageCount(totalItems || normalized.length, remotePageSize),
        source: "api",
      };
    }
  } catch (error) {
    console.error(error);
  }

  return getLocalCatalogPage(filters, page, pageSize);
};

export const loadCatalogItem = async (id) => {
  try {
    const response = await api.get(`/catalogo/${id}/`);
    const remoteItem = extractCatalogItem(response.data, id);

    if (remoteItem) {
      return normalizeCatalogItem(remoteItem);
    }
  } catch (error) {
    console.error(error);
  }

  return catalogMockItems.find((item) => String(item.id) === String(id)) ?? null;
};

export { catalogGenres, catalogLevels };