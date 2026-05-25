import React, { useState } from "react";
import ChoreographyCard from "../components/ChoreographyCard";
import { Search, SlidersHorizontal } from "lucide-react";
import choreographies from "../data/choreographies";
import salsaImg from "../assets/images/salsa.jpg";

const allChoreographies = choreographies;

const genres = [
  "Todos",
  "Hip Hop",
  "Salsa",
  "Contemporáneo",
  "Bachata",
  "Jazz",
  "Breakdance",
  "Moderno",
  "Coreografía Grupal",
];
const difficulties = ["Todas", "Principiante", "Intermedio", "Avanzado"];

export default function Choreographies() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("Todos");
  const [selectedDifficulty, setSelectedDifficulty] = useState("Todas");

  const filteredChoreographies = allChoreographies.filter((choreo) => {
    const matchesSearch = choreo.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesGenre =
      selectedGenre === "Todos" || choreo.genre === selectedGenre;
    const matchesDifficulty =
      selectedDifficulty === "Todas" ||
      choreo.difficulty === selectedDifficulty;
    return matchesSearch && matchesGenre && matchesDifficulty;
  });

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4 bg-muted/30">
        <div className="container mx-auto text-center">
          <h1
            className="text-4xl md:text-6xl font-bold mb-6"
            style={{
              background:
                "linear-gradient(135deg, var(--gradient-violet), var(--gradient-fuchsia))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Todas las Coreografías
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Más de 1000 coreografías para todos los niveles y estilos
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar coreografías..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-full bg-background border border-border focus:outline-none focus:ring-2 focus:ring-[var(--gradient-violet)]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Filters Section */}
      <section className="py-8 px-4 border-b bg-white/95 backdrop-blur-md sticky top-16 z-40 shadow-sm">
        <div className="container mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <SlidersHorizontal className="h-5 w-5" />
            <span className="font-medium">Filtrar por:</span>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Genre Filter */}
            <div>
              <label className="block text-sm mb-2">Género</label>
              <div className="flex flex-wrap gap-2">
                {genres.map((genre) => (
                  <button
                    key={genre}
                    onClick={() => setSelectedGenre(genre)}
                    className={`px-4 py-2 rounded-full text-sm transition-all ${
                      selectedGenre === genre
                        ? "text-white"
                        : "bg-muted hover:bg-muted/80"
                    }`}
                    style={
                      selectedGenre === genre
                        ? {
                            background:
                              "linear-gradient(135deg, var(--gradient-violet), var(--gradient-fuchsia))",
                          }
                        : undefined
                    }
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty Filter */}
            <div>
              <label className="block text-sm mb-2">Dificultad</label>
              <div className="flex flex-wrap gap-2">
                {difficulties.map((difficulty) => (
                  <button
                    key={difficulty}
                    onClick={() => setSelectedDifficulty(difficulty)}
                    className={`px-4 py-2 rounded-full text-sm transition-all ${
                      selectedDifficulty === difficulty
                        ? "text-white"
                        : "bg-muted hover:bg-muted/80"
                    }`}
                    style={
                      selectedDifficulty === difficulty
                        ? {
                            background:
                              "linear-gradient(135deg, var(--gradient-violet), var(--gradient-fuchsia))",
                          }
                        : undefined
                    }
                  >
                    {difficulty}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="mb-6">
            <p className="text-muted-foreground">
              Mostrando {filteredChoreographies.length} coreografías
            </p>
          </div>

          {filteredChoreographies.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredChoreographies.map((choreo) => (
                <ChoreographyCard
                  key={choreo.id}
                  {...choreo}
                  img={choreo.img || salsaImg}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-xl text-muted-foreground">
                No se encontraron coreografías con los filtros seleccionados
              </p>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedGenre("Todos");
                  setSelectedDifficulty("Todas");
                }}
                className="mt-4 px-6 py-2 rounded-full text-white transition-all hover:opacity-90"
                style={{
                  background:
                    "linear-gradient(135deg, var(--gradient-violet), var(--gradient-fuchsia))",
                }}
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
