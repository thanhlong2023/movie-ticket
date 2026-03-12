import { useState, useEffect } from "react";

const slides = [
  {
    image: "/image-carousel/carousel1.jpg",
  },
  {
    image: "/image-carousel/carousel2.webp",
  },
  {
    image: "/image-carousel/carousel3.webp",
  },
  {
    image: "/image-carousel/carousel4.webp",
  },
  {
    image: "/image-carousel/carousel6.webp",
  },
];

function CarouselWelcome() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    const isLastSlide = currentIndex === slides.length - 1;
    const newIndex = isLastSlide ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const isLastSlide = prevIndex === slides.length - 1;
        return isLastSlide ? 0 : prevIndex + 1;
      });
    }, 5000);
    return () => clearInterval(timer);
  }, []); // Empty dependency array - runs once on mount

  const prevSlide = () => {
    const isFirstSlide = currentIndex === 0;
    const newIndex = isFirstSlide ? slides.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  const goToSlide = (slideIndex: number) => {
    setCurrentIndex(slideIndex);
  };

  return (
    <div className="carousel-welcome">
      <div className="slides-container">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`slide ${
              index === currentIndex ? "active" : "inactive"
            }`}
          >
            <div
              className="slide-background"
              style={{ backgroundImage: `url(${slide.image})` }}
            ></div>
          </div>
        ))}
      </div>

      <button
        onClick={prevSlide}
        className="arrow arrow-left"
        aria-label="Previous Slide"
      >
        <i className="fa-solid fa-chevron-left"></i>
      </button>

      <button
        onClick={nextSlide}
        className="arrow arrow-right"
        aria-label="Next Slide"
      >
        <i className="fa-solid fa-chevron-right"></i>
      </button>

      <div className="dots">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`dot ${index === currentIndex ? "active" : ""}`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

export default CarouselWelcome;
