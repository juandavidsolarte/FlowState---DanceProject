import React from "react";
import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * ChoreographyCard
 *
 * Interactive presentation component that displays a single choreography
 * preview card. This component is used inside the `PopularChoreographies`
 * grid and is intentionally self-contained (no external state).
 *
 * Props:
 * - id: number | string — unique identifier used for routing to detail page
 * - img: string — imported image URL (local import from assets/images)
 * - category: string — category badge label (e.g. "Hip Hop")
 * - level: string — difficulty badge label (e.g. "Intermedio")
 * - title: string — card title
 * - rating: number — average rating shown as number
 * - reviews: number — number of reviews (displayed in parentheses)
 * - duration: string — human-friendly duration (e.g. "45 min")
 *
 * Interaction details implemented here:
 * - Clicking the card navigates to `/choreographies/${id}` using `useNavigate`.
 * - Hover effect: a small elevation (scale) is handled via Framer Motion on the
 *   root container. The image uses a micro-scale by CSS (`scale-105`) on hover.
 * - Play overlay: a centered Play icon appears above the image on hover. The
 *   Play button uses a solid, transitionless appearance so its color doesn't
 *   change when it becomes visible.
 * - Accessibility: card is focusable (`tabIndex=0`) and has `role="button"`.
 */

// Component: ChoreographyCard
// - Interactive card used in the "Lo Más Popular" grid
// - Hover: elevation + image scale + play overlay
// - Click: navigates to `/choreographies/${id}` via react-router
const ChoreographyCard = ({
  id,
  img,
  category,
  level,
  title,
  rating,
  reviews,
  duration,
}) => {
  // Router navigation hook (used to redirect when card is clicked)
  const navigate = useNavigate();

  // Handler: navigate to choreography detail page
  const handleClick = () => {
    navigate(`/choreographies/${id}`);
  };

  return (
    // Root interactive container: motion.article provides hover animation props
    <motion.article
      onClick={handleClick}
      role="button"
      tabIndex={0}
      className="group relative overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-md cursor-pointer transition-all duration-200 dark:shadow-black/20"
      whileHover={{ scale: 1.01 }}
    >
      {/* Image area: contains image, hover-play overlay and top badges */}
      <div className="relative">
        {/* Background image: scales on hover */}
        <img
          src={img}
          alt={title}
          className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110"
        />

        {/* Play overlay (appears on hover):
            - gradient dark layer to emphasize contrast
            - central circular Play button with backdrop blur
            - pointer-events-none on overlay so the click is handled by the card
        */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300 opacity-0 group-hover:opacity-100">
          {/* Removed full-image dark gradient to avoid greying the card on hover */}
          <div className="absolute inset-0 bg-transparent" />
          <div className="relative z-10">
            {/* Play button: fixed appearance, no color transition */}
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-background/20 backdrop-blur-md transition-none">
              <Play
                size={28}
                className="text-white transition-none"
                aria-hidden
              />
            </div>
          </div>
        </div>

        {/* Top-left and top-right badges (Glassmorphism style) */}
        <div className="absolute top-3 left-3">
          <span className="rounded-full border border-white/30 bg-purple-600/50 px-3 py-1 text-sm font-medium text-white backdrop-blur-md">
            {category}
          </span>
        </div>
        <div className="absolute top-3 right-3">
          <span className="rounded-full border border-white/30 bg-background/20 px-3 py-1 text-sm font-medium text-white backdrop-brightness-50 backdrop-blur-md">
            {level}
          </span>
        </div>
      </div>

      {/* Info panel: title, rating and duration (glass-like card footer) */}
      <div className="bg-card/90 p-4 backdrop-blur-sm">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>

        <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="text-yellow-400">★</span>
            <span className="font-medium text-foreground">{rating}</span>
            <span className="text-muted-foreground/70">({reviews})</span>
          </div>

          <div className="text-muted-foreground">{duration}</div>
        </div>
      </div>
    </motion.article>
  );
};

export default ChoreographyCard;
