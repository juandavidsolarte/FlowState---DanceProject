/**
 * Shared data for choreographies
 *
 * This module exports an array `choreographies` used by the grid and
 * the detail page. Each choreography object contains the following fields:
 * - id: unique numeric identifier
 * - img: imported image reference (local file under `assets/images`)
 * - category: string (e.g. 'Hip Hop')
 * - level: string (e.g. 'Intermedio')
 * - title: display title
 * - rating: numeric average rating
 * - reviews: number of reviews
 * - duration: human-friendly duration string
 * - description: full text description
 *
 * To add a new choreography: import the image at the top and add a new
 * object to the array with the fields above. The components assume images
 * are local imports so bundlers (Vite) will include them in the build.
 */

import salsaImg from "../assets/images/salsa.jpg";
import urbanImg from "../assets/images/urban.jpg";
import jazzImg from "../assets/images/jazz.jpg";
import capoeiraImg from "../assets/images/capoeira.jpg";
import balletImg from "../assets/images/ballet.jpg";
import rapImg from "../assets/images/rap.jpg";

const choreographies = [
  {
    id: 1,
    img: urbanImg,
    category: "Hip Hop",
    level: "Intermedio",
    title: "Urban Hip Hop Flow",
    rating: 4.8,
    reviews: 342,
    duration: "45 min",
    price: 29.99,
    responsible: "Carlos Méndez",
    includes: [
      "Video tutorial completo",
      "Música incluida",
      "Guía paso a paso",
      "Acceso de por vida",
    ],
    requirements: [
      "Nivel intermedio de baile",
      "Espacio para practicar",
      "Ropa cómoda",
    ],
    description:
      "Una coreografía energética que combina movimientos urbanos con técnicas de hip hop moderno. Perfecta para desarrollar tu estilo y fluidez en el baile.",
  },
  {
    id: 2,
    img: salsaImg,
    category: "Salsa",
    level: "Principiante",
    title: "Salsa Caliente",
    rating: 4.9,
    reviews: 125,
    duration: "45 min",
    price: 24.99,
    responsible: "María González",
    includes: [
      "Video tutorial completo",
      "Guía de pasos",
      "Acceso de por vida",
    ],
    requirements: ["Ropa cómoda"],
    description:
      "Aprende pasos y giros tradicionales de salsa con secuencias diseñadas para principiantes.",
  },
  {
    id: 3,
    img: jazzImg,
    category: "Jazz",
    level: "Intermedio",
    title: "Jazz Grooves",
    rating: 4.7,
    reviews: 98,
    duration: "40 min",
    price: 34.99,
    responsible: "Ana Rodríguez",
    includes: ["Video tutorial", "Ejercicios técnicos", "Acceso de por vida"],
    requirements: ["Principios de técnica básica"],
    description:
      "Técnicas de jazz y combinaciones rítmicas para mejorar coordinación y musicalidad.",
  },
  {
    id: 4,
    img: capoeiraImg,
    category: "Capoeira",
    level: "Avanzado",
    title: "Capoeira Beats",
    rating: 4.6,
    reviews: 76,
    duration: "50 min",
    price: 39.99,
    responsible: "Roberto Silva",
    includes: [
      "Video tutorial avanzado",
      "Técnicas acrobáticas",
      "Acceso de por vida",
    ],
    requirements: ["Nivel avanzado", "Espacio despejado"],
    description:
      "Fusión de capoeira y movimiento acrobático para desarrollar fuerza y agilidad.",
  },
  {
    id: 5,
    img: balletImg,
    category: "Ballet",
    level: "Principiante",
    title: "Ballet Basics",
    rating: 4.5,
    reviews: 64,
    duration: "35 min",
    price: 19.99,
    responsible: "Laura Martínez",
    includes: ["Video tutorial", "Ejercicios paso a paso"],
    requirements: ["Ropa cómoda"],
    description:
      "Ejercicios básicos de ballet para postura, alineación y control corporal.",
  },
  {
    id: 6,
    img: rapImg,
    category: "Rap",
    level: "Intermedio",
    title: "Rap Movement",
    rating: 4.4,
    reviews: 88,
    duration: "30 min",
    price: 29.99,
    responsible: "Diego Torres",
    includes: ["Video tutorial", "Lista de música"],
    requirements: ["Conocimiento básico de ritmo"],
    description: "Coreografías urbanas inspiradas en rap y street dance.",
  },
];

export default choreographies;
