import React from "react";
import ImageWithFallback from "../components/figma/ImageWithFallback";
import { Users, Award, Heart, Globe } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="container mx-auto">
          <h1
            className="text-4xl md:text-6xl font-bold text-center mb-6"
            style={{
              background:
                "linear-gradient(135deg, var(--gradient-violet), var(--gradient-fuchsia))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Sobre Flowstate
          </h1>
          <p className="text-xl text-center text-muted-foreground max-w-3xl mx-auto">
            Tu plataforma de confianza para aprender y dominar el arte del baile
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-4">Nuestra Misión</h2>
              <p className="text-muted-foreground mb-4">
                En Flowstate, creemos que el baile es una forma universal de
                expresión que trasciende fronteras y conecta culturas. Nuestra
                misión es hacer que el aprendizaje del baile sea accesible para
                todos, desde principiantes hasta profesionales.
              </p>
              <p className="text-muted-foreground">
                Con más de 1000 coreografías de diferentes géneros y niveles de
                dificultad, te ofrecemos las herramientas para encontrar tu
                ritmo y alcanzar tu máximo potencial.
              </p>
            </div>
            <div className="rounded-2xl overflow-hidden">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1706604342065-f36f34513a9f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkYW5jZSUyMHN0dWRpbyUyMHRlYW0lMjBhYm91dCUyMHVzfGVufDF8fHx8MTc3NDAwNDI4Mnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Flowstate Team"
                className="w-full h-[400px] object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Nuestros Valores
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div
                className="inline-flex p-4 rounded-full mb-4"
                style={{
                  background:
                    "linear-gradient(135deg, var(--gradient-violet), var(--gradient-fuchsia))",
                }}
              >
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Comunidad</h3>
              <p className="text-muted-foreground">
                Construimos una comunidad global de bailarines apasionados
              </p>
            </div>

            <div className="text-center">
              <div
                className="inline-flex p-4 rounded-full mb-4"
                style={{
                  background:
                    "linear-gradient(135deg, var(--gradient-violet), var(--gradient-fuchsia))",
                }}
              >
                <Award className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Excelencia</h3>
              <p className="text-muted-foreground">
                Trabajamos con los mejores instructores del mundo
              </p>
            </div>

            <div className="text-center">
              <div
                className="inline-flex p-4 rounded-full mb-4"
                style={{
                  background:
                    "linear-gradient(135deg, var(--gradient-violet), var(--gradient-fuchsia))",
                }}
              >
                <Heart className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Pasión</h3>
              <p className="text-muted-foreground">
                El amor por el baile impulsa todo lo que hacemos
              </p>
            </div>

            <div className="text-center">
              <div
                className="inline-flex p-4 rounded-full mb-4"
                style={{
                  background:
                    "linear-gradient(135deg, var(--gradient-violet), var(--gradient-fuchsia))",
                }}
              >
                <Globe className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Accesibilidad</h3>
              <p className="text-muted-foreground">
                Hacemos el baile accesible para todos, en cualquier lugar
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div>
              <div
                className="text-5xl font-bold mb-2"
                style={{
                  background:
                    "linear-gradient(135deg, var(--gradient-violet), var(--gradient-fuchsia))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                1000+
              </div>
              <p className="text-muted-foreground">Coreografías</p>
            </div>

            <div>
              <div
                className="text-5xl font-bold mb-2"
                style={{
                  background:
                    "linear-gradient(135deg, var(--gradient-violet), var(--gradient-fuchsia))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                50K+
              </div>
              <p className="text-muted-foreground">Estudiantes</p>
            </div>

            <div>
              <div
                className="text-5xl font-bold mb-2"
                style={{
                  background:
                    "linear-gradient(135deg, var(--gradient-violet), var(--gradient-fuchsia))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                100+
              </div>
              <p className="text-muted-foreground">Instructores</p>
            </div>

            <div>
              <div
                className="text-5xl font-bold mb-2"
                style={{
                  background:
                    "linear-gradient(135deg, var(--gradient-violet), var(--gradient-fuchsia))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                20+
              </div>
              <p className="text-muted-foreground">Géneros</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
