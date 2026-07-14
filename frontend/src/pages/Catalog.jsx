import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, Search, SlidersHorizontal } from "lucide-react";
import ChoreographyCard from "../components/ChoreographyCard";
import { normalizeCatalogItem } from "../data/catalogMock";
import api from "../services/api";
import { CATALOG_PAGE_SIZE, catalogGenres, catalogLevels, getLocalCatalogPage } from "../services/catalog";

const initialFilters = {
  search: "",
  genre: "Todos",
  level: "Todos",
  priceMin: "",
  priceMax: "",
};

const formatCurrency = (value) =>
  `$${Number(value || 0).toLocaleString("es-CO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const buildParams = (filters, page) => {
  const params = { page };

  if (filters.search.trim()) params.search = filters.search.trim();
  if (filters.genre && filters.genre !== "Todos") params.genero = filters.genre;
  if (filters.level && filters.level !== "Todos") params.nivel = filters.level;
  if (filters.priceMin !== "") params.precio_min = filters.priceMin;
  if (filters.priceMax !== "") params.precio_max = filters.priceMax;

  return params;
};

export default function Catalog() {
  const [draftFilters, setDraftFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const fallbackPage = useMemo(() => getLocalCatalogPage(initialFilters, 1), []);
  const [items, setItems] = useState(fallbackPage.items);
  const [count, setCount] = useState(fallbackPage.totalItems);
  const [totalPages, setTotalPages] = useState(fallbackPage.totalPages);
  const [nextAvailable, setNextAvailable] = useState(false);
  const [previousAvailable, setPreviousAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [source, setSource] = useState("mock");

  useEffect(() => {
    let active = true;

    const loadPage = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await api.get("/catalogo/", {
          params: buildParams(appliedFilters, page),
        });

        if (!active) return;

        const results = Array.isArray(response.data?.results) ? response.data.results : [];
        const normalized = results.map(normalizeCatalogItem);
        const totalCount = Number(response.data?.count ?? normalized.length);
        const pageSize = Number(response.data?.page_size ?? CATALOG_PAGE_SIZE) || CATALOG_PAGE_SIZE;

        setItems(normalized);
        setCount(totalCount);
        setTotalPages(Math.max(1, Math.ceil(totalCount / pageSize)));
        setNextAvailable(Boolean(response.data?.next));
        setPreviousAvailable(Boolean(response.data?.previous));
        setSource("api");
      } catch (fetchError) {
        if (!active) return;

        const fallback = getLocalCatalogPage(appliedFilters, page);
        setItems(fallback.items);
        setCount(fallback.totalItems);
        setTotalPages(fallback.totalPages);
        setNextAvailable(page < fallback.totalPages);
        setPreviousAvailable(page > 1);
        setSource("mock");
        setError("No se pudo conectar con el catálogo. Mostrando datos de respaldo.");
        console.error(fetchError);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadPage();

    return () => {
      active = false;
    };
  }, [appliedFilters, page]);

  const handleApplyFilters = () => {
    setPage(1);
    setAppliedFilters(draftFilters);
  };

  const handleResetFilters = () => {
    setDraftFilters(initialFilters);
    setAppliedFilters(initialFilters);
    setPage(1);
  };

  const resultCountLabel = useMemo(() => {
    if (loading) {
      return "Cargando coreografías...";
    }

    if (count === 0) {
      return "No se encontraron coreografías";
    }

    return `Mostrando ${items.length} de ${count} coreografías`;
  }, [count, items.length, loading]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="relative bg-muted/30 px-4 py-20 dark:bg-muted/10">
        <div className="container mx-auto text-center">
          <h1
            className="mb-6 text-4xl font-bold md:text-6xl"
            style={{
              background: "linear-gradient(135deg, var(--gradient-violet), var(--gradient-fuchsia))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Catálogo de Coreografías
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-xl text-muted-foreground">
            Explora coreografías reales del catálogo y filtra por género, nivel y precio.
          </p>

          <div className="mx-auto max-w-2xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar coreografías..."
                value={draftFilters.search}
                onChange={(event) => setDraftFilters((current) => ({ ...current, search: event.target.value }))}
                className="w-full rounded-full border border-border bg-background py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-[var(--gradient-violet)]"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-10 md:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[320px_1fr]">
          <aside className="sticky top-24 h-fit rounded-[2rem] border border-border bg-[#130d26] p-6 shadow-2xl shadow-black/20">
            <div className="mb-5 flex items-center gap-3">
              <SlidersHorizontal className="h-5 w-5 text-purple-300" />
              <h2 className="text-lg font-semibold text-white">Filtrar por</h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-sm text-gray-400">Género</label>
                <div className="flex flex-wrap gap-2">
                  {catalogGenres.map((genre) => (
                    <button
                      key={genre}
                      type="button"
                      onClick={() => setDraftFilters((current) => ({ ...current, genre }))}
                      className={`rounded-full px-4 py-2 text-sm transition ${
                        draftFilters.genre === genre
                          ? "bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white"
                          : "bg-[#0f0a1e] text-gray-300 hover:bg-purple-900/20"
                      }`}
                    >
                      {genre}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-400">Nivel</label>
                <div className="flex flex-wrap gap-2">
                  {catalogLevels.map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setDraftFilters((current) => ({ ...current, level }))}
                      className={`rounded-full px-4 py-2 text-sm transition ${
                        draftFilters.level === level
                          ? "bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white"
                          : "bg-[#0f0a1e] text-gray-300 hover:bg-purple-900/20"
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-3">
                <label className="grid gap-2 text-sm text-gray-400">
                  Precio mínimo
                  <input
                    type="number"
                    min="0"
                    value={draftFilters.priceMin}
                    onChange={(event) => setDraftFilters((current) => ({ ...current, priceMin: event.target.value }))}
                    className="rounded-2xl border border-purple-900/30 bg-[#0f0a1e] px-4 py-3 text-white outline-none focus:border-purple-500"
                    placeholder="0"
                  />
                </label>
                <label className="grid gap-2 text-sm text-gray-400">
                  Precio máximo
                  <input
                    type="number"
                    min="0"
                    value={draftFilters.priceMax}
                    onChange={(event) => setDraftFilters((current) => ({ ...current, priceMax: event.target.value }))}
                    className="rounded-2xl border border-purple-900/30 bg-[#0f0a1e] px-4 py-3 text-white outline-none focus:border-purple-500"
                    placeholder="500000"
                  />
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleApplyFilters}
                  className="flex-1 rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-500 px-4 py-3 font-semibold text-white transition hover:opacity-90"
                >
                  Aplicar filtros
                </button>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="rounded-2xl border border-purple-900/30 px-4 py-3 font-medium text-white transition hover:bg-purple-900/20"
                >
                  Limpiar
                </button>
              </div>
            </div>
          </aside>

          <main className="space-y-6">
            <div className="rounded-[2rem] border border-border bg-[#130d26] px-6 py-4 shadow-2xl shadow-black/20">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-gray-400">{resultCountLabel}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.24em] text-purple-300/80">
                    Fuente: {source === "api" ? "Backend real" : "Datos de respaldo"}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={!previousAvailable || loading}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    className="inline-flex items-center gap-2 rounded-full border border-purple-900/30 px-4 py-2 text-sm text-white transition hover:bg-purple-900/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </button>
                  <span className="rounded-full border border-purple-900/20 bg-[#0f0a1e] px-4 py-2 text-sm text-gray-300">
                    Página {page} de {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={!nextAvailable || loading}
                    onClick={() => setPage((current) => current + 1)}
                    className="inline-flex items-center gap-2 rounded-full border border-purple-900/30 px-4 py-2 text-sm text-white transition hover:bg-purple-900/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {error ? (
              <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                {error}
              </div>
            ) : null}

            <div className="relative min-h-[320px]">
              {loading ? (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[2rem] bg-[#0f0a1e]/70 backdrop-blur-sm">
                  <div className="flex items-center gap-3 rounded-full border border-purple-900/20 bg-[#130d26] px-5 py-3 text-white shadow-xl shadow-black/20">
                    <Loader2 className="h-5 w-5 animate-spin text-purple-300" />
                    Cargando coreografías...
                  </div>
                </div>
              ) : null}

              {items.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {items.map((item) => (
                    <ChoreographyCard
                      key={item.id}
                      id={item.id}
                      img={item.thumbnail || item.img}
                      category={item.category || item.genre}
                      level={item.level}
                      title={item.title}
                      price={item.price}
                      purchased={item.purchased}
                      rating={item.rating}
                      reviews={item.reviews}
                      duration={item.duration}
                      to={`/catalogo/${item.id}`}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex min-h-[260px] items-center justify-center rounded-[2rem] border border-dashed border-border bg-[#130d26] px-6 text-center">
                  <p className="text-lg text-muted-foreground">No se encontraron coreografías</p>
                </div>
              )}
            </div>
          </main>
        </div>
      </section>
    </div>
  );
}