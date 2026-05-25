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
      className="group relative bg-white rounded-xl shadow-md overflow-hidden cursor-pointer transition-all duration-200"
      //className="group relative bg-white rounded-xl shadow-md overflow-hidden cursor-pointer"
      whileHover={{ scale: 1.01 }}
      //whileHover={{ y: -8, boxShadow: "0 10px 20px rgba(16,24,40,0.08)" }}
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
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center transition-none">
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
          <span className="bg-purple-600/50 backdrop-blur-md text-sm text-white px-3 py-1 rounded-full font-medium border border-white/30">
            {category}
          </span>
        </div>
        <div className="absolute top-3 right-3">
          <span className="bg-white/20 backdrop-brightness-50 text-sm text-white px-3 py-1 rounded-full font-medium border border-white/30">
            {level}
          </span>
        </div>
      </div>

      {/* Info panel: title, rating and duration (glass-like card footer) */}
      <div className="p-4 bg-white/80 backdrop-blur-sm">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>

        <div className="mt-3 flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <span className="text-yellow-400">★</span>
            <span className="font-medium text-gray-800">{rating}</span>
            <span className="text-gray-400">({reviews})</span>
          </div>

          <div className="text-gray-500">{duration}</div>
        </div>
      </div>
    </motion.article>
  );
};

export default ChoreographyCard;
