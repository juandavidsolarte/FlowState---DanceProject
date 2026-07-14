import React from "react";
import { motion } from "framer-motion";
import ChoreographyCard from "./ChoreographyCard";
import choreographies from "../data/choreographies";

/**
 * PopularChoreographies
 *
 * This component renders the "Lo Más Popular" section on the home page.
 * Responsibilities:
 * - Render a responsive grid (1 column mobile, 2 small, 3 desktop) of
 *   choreography cards.
 * - Use the shared `choreographies` dataset (imported from `data/choreographies`).
 * - Apply a Framer Motion scroll-reveal animation to each card so items
 *   fade in and slide up when entering the viewport.
 *
 * Implementation details:
 * - Each card is wrapped with a small `motion` wrapper that sets `initial`
 *   and `whileInView` states to keep animation declarative and performant.
 * - The component is presentational and doesn't manage state; it expects
 *   the shared data to be local/imported so images are bundled by Vite.
 */
const cardVariant = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 1) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08 },
  }),
};

const PopularChoreographies = () => {
  return (
    <section className="py-16 px-6 md:px-12">
      <div className="max-w-6xl mx-auto text-center mb-10">
        <h2 className="text-4xl md:text-5xl font-extrabold text-foreground">
          Lo Más Popular
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
          Descubre las coreografías más populares y aprende con los mejores
          instructores
        </p>
      </div>

      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {choreographies.map((item, idx) => (
            <motion.div
              key={item.id}
              custom={idx}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={cardVariant}
            >
              <ChoreographyCard
                id={item.id}
                img={item.img}
                category={item.category}
                level={item.level}
                title={item.title}
                price={item.price}
                rating={item.rating}
                reviews={item.reviews}
                duration={item.duration}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PopularChoreographies;
