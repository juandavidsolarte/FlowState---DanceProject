import React, { useState } from "react";
import ImageWithFallback from "../components/figma/ImageWithFallback";
import { Link } from "react-router-dom";
import { Star, Clock, Users, Play } from "lucide-react";

const courses = [
  {
    id: 1,
    title: "Fundamentos de Hip Hop",
    description:
      "Aprende los movimientos básicos del hip hop desde cero con nuestros instructores expertos.",
    image:
      "https://images.unsplash.com/photo-1770739723922-a4fd700bdb3b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoaXAlMjBob3AlMjBkYW5jZXIlMjB1cmJhbnxlbnwxfHx8fDE3NzMwMjIxOTN8MA&ixlib=rb-4.1.0&q=80&w=1080",
    instructor: "Carlos Méndez",
    duration: "6 semanas",
    students: 1250,
    rating: 4.9,
    price: 49.99,
    level: "Principiante",
  },
  {
    id: 2,
    title: "Salsa Para Parejas",
    description:
      "Domina los pasos básicos y avanzados de la salsa con tu pareja o encuentra una en clase.",
    image:
      "https://images.unsplash.com/photo-1665765422248-6df88f47f92e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzYWxzYSUyMGRhbmNpbmclMjBjb3VwbGV8ZW58MXx8fHwxNzczMDIyMTkzfDA&ixlib=rb-4.1.0&q=80&w=1080",
    instructor: "María González",
    duration: "8 semanas",
    students: 980,
    rating: 4.8,
    price: 59.99,
    level: "Principiante",
  },
  {
    id: 3,
    title: "Contemporáneo Avanzado",
    description:
      "Explora la expresión artística y técnicas avanzadas del baile contemporáneo.",
    image:
      "https://images.unsplash.com/photo-1701067975778-646fc11418ca?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb250ZW1wb3JhcnklMjBiYWxsZXQlMjBkYW5jZXJ8ZW58MXx8fHwxNzczMDI3NDUwfDA&ixlib=rb-4.1.0&q=80&w=1080",
    instructor: "Ana Rodríguez",
    duration: "10 semanas",
    students: 756,
    rating: 4.9,
    price: 79.99,
    level: "Avanzado",
  },
  {
    id: 4,
    title: "Bachata Sensual",
    description:
      "Aprende los movimientos sensuales y la conexión de pareja en la bachata.",
    image:
      "https://images.unsplash.com/photo-1662392228425-92ba6109dc8f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYWNoYXRhJTIwZGFuY2UlMjBwYXJ0bmVyfGVufDF8fHx8MTc3MzA1OTgzN3ww&ixlib=rb-4.1.0&q=80&w=1080",
    instructor: "Roberto Silva",
    duration: "6 semanas",
    students: 1420,
    rating: 4.7,
    price: 54.99,
    level: "Intermedio",
  },
  {
    id: 5,
    title: "Jazz Dance Técnico",
    description: "Desarrolla técnica, estilo y musicalidad en el jazz dance.",
    image:
      "https://images.unsplash.com/photo-1765278543368-6e89f3e080bf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxqYXp6JTIwZGFuY2UlMjBwZXJmb3JtYW5jZXxlbnwxfHx8fDE3NzMwNTk4Mzh8MA&ixlib=rb-4.1.0&q=80&w=1080",
    instructor: "Laura Martínez",
    duration: "8 semanas",
    students: 890,
    rating: 4.8,
    price: 64.99,
    level: "Intermedio",
  },
  {
    id: 6,
    title: "Breakdance: Power Moves",
    description: "Aprende los movimientos más impresionantes del breakdance.",
    image:
      "https://images.unsplash.com/photo-1588671815815-b0cd3b2a9189?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxicmVha2RhbmNlJTIwc3RyZWV0JTIwZGFuY2VyfGVufDF8fHx8MTc3MzAyNzQ1MXww&ixlib=rb-4.1.0&q=80&w=1080",
    instructor: "Diego Torres",
    duration: "12 semanas",
    students: 1100,
    rating: 4.9,
    price: 89.99,
    level: "Avanzado",
  },
];

export default function Courses() {
  const [filter, setFilter] = useState("all");

  const filteredCourses =
    filter === "all"
      ? courses
      : courses.filter((course) => course.level === filter);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative bg-muted/30 px-4 py-20 dark:bg-muted/10">
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
            Nuestros Cursos
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Programas completos diseñados para llevar tu baile al siguiente
            nivel
          </p>
        </div>
      </section>

      {/* Filter Section */}
      <section className="border-b border-border px-4 py-8 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto">
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => setFilter("all")}
              className={`px-6 py-2 rounded-full transition-all ${
                filter === "all" ? "text-white" : "bg-muted hover:bg-muted/80"
              }`}
              style={
                filter === "all"
                  ? {
                      background:
                        "linear-gradient(135deg, var(--gradient-violet), var(--gradient-fuchsia))",
                    }
                  : undefined
              }
            >
              Todos
            </button>
            <button
              onClick={() => setFilter("Principiante")}
              className={`px-6 py-2 rounded-full transition-all ${
                filter === "Principiante"
                  ? "text-white"
                  : "bg-muted hover:bg-muted/80"
              }`}
              style={
                filter === "Principiante"
                  ? {
                      background:
                        "linear-gradient(135deg, var(--gradient-violet), var(--gradient-fuchsia))",
                    }
                  : undefined
              }
            >
              Principiante
            </button>
            <button
              onClick={() => setFilter("Intermedio")}
              className={`px-6 py-2 rounded-full transition-all ${
                filter === "Intermedio"
                  ? "text-white"
                  : "bg-muted hover:bg-muted/80"
              }`}
              style={
                filter === "Intermedio"
                  ? {
                      background:
                        "linear-gradient(135deg, var(--gradient-violet), var(--gradient-fuchsia))",
                    }
                  : undefined
              }
            >
              Intermedio
            </button>
            <button
              onClick={() => setFilter("Avanzado")}
              className={`px-6 py-2 rounded-full transition-all ${
                filter === "Avanzado"
                  ? "text-white"
                  : "bg-muted hover:bg-muted/80"
              }`}
              style={
                filter === "Avanzado"
                  ? {
                      background:
                        "linear-gradient(135deg, var(--gradient-violet), var(--gradient-fuchsia))",
                    }
                  : undefined
              }
            >
              Avanzado
            </button>
          </div>
        </div>
      </section>

      {/* Courses Grid */}
      <section className="px-4 py-16">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCourses.map((course) => (
              <Link
                key={course.id}
                to={`/choreographies/${course.id}`}
                state={{ image: course.image }}
                className="group overflow-hidden rounded-xl border border-border bg-card text-card-foreground transition-all hover:shadow-lg"
              >
                <div className="relative overflow-hidden aspect-video">
                  <ImageWithFallback
                    src={course.image}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <button className="rounded-full bg-background/90 p-4 text-foreground transition-colors hover:bg-background">
                      <Play className="h-6 w-6 text-[var(--gradient-violet)]" />
                    </button>
                  </div>
                  <span className="absolute right-4 top-4 rounded-full bg-background/90 px-3 py-1 text-xs font-medium text-foreground">
                    {course.level}
                  </span>
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2">{course.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {course.description}
                  </p>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <span>Por {course.instructor}</span>
                  </div>

                  <div className="flex items-center gap-4 text-sm mb-4">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{course.duration}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{course.students.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>{course.rating}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">${course.price}</span>
                    <button
                      className="px-6 py-2 rounded-lg text-white transition-all hover:opacity-90"
                      style={{
                        background:
                          "linear-gradient(135deg, var(--gradient-violet), var(--gradient-fuchsia))",
                      }}
                    >
                      Inscribirse
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
