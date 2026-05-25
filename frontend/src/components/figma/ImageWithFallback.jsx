import React, { useState } from "react";

const ImageWithFallback = ({
  src,
  alt = "",
  className = "",
  fallback = null,
}) => {
  const [errored, setErrored] = useState(false);
  const fallbackSrc =
    fallback || "https://via.placeholder.com/800x600?text=Flowstate";

  return (
    <img
      src={errored ? fallbackSrc : src}
      alt={alt}
      className={className}
      onError={() => setErrored(true)}
    />
  );
};

export default ImageWithFallback;
