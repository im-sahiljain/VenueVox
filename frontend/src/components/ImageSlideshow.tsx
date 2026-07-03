import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageSlideshowProps {
  images: string[];
  autoSlideInterval?: number;
}

export const ImageSlideshow: React.FC<ImageSlideshowProps> = ({
  images,
  autoSlideInterval = 4000
}) => {
  const validImages = (images || []).filter((img) => img && typeof img === 'string');

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (validImages.length <= 1 || isHovered) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % validImages.length);
    }, autoSlideInterval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [validImages.length, autoSlideInterval, isHovered]);

  if (validImages.length === 0) {
    return (
      <div className="w-full h-56 bg-slate-100 dark:bg-slate-900 flex items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-800">
        <span className="text-slate-400 text-sm font-medium">No photos available</span>
      </div>
    );
  }

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prevIndex) => (prevIndex - 1 + validImages.length) % validImages.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prevIndex) => (prevIndex + 1) % validImages.length);
  };

  return (
    <div
      className="relative w-full h-64 sm:h-72 rounded-2xl overflow-hidden shadow-md group bg-slate-950"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <img
        src={validImages[currentIndex]}
        alt={`Slide ${currentIndex + 1}`}
        className="w-full h-full object-cover transition-all duration-700 ease-in-out"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent pointer-events-none" />

      {validImages.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-9 h-9 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/40 active:scale-95 transition-all duration-200 opacity-0 group-hover:opacity-100 cursor-pointer shadow-lg"
            aria-label="Previous Slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-9 h-9 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/40 active:scale-95 transition-all duration-200 opacity-0 group-hover:opacity-100 cursor-pointer shadow-lg"
            aria-label="Next Slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {validImages.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {validImages.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(idx);
              }}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                currentIndex === idx
                  ? 'bg-rose-500 w-5'
                  : 'bg-white/50 hover:bg-white/80'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}

      <div className="absolute top-3 right-3 px-2 py-1 text-[10px] font-bold text-white bg-slate-950/60 backdrop-blur-md rounded-lg border border-white/10 pointer-events-none">
        {currentIndex + 1} / {validImages.length}
      </div>
    </div>
  );
};
