import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import "./HomeCarousel.css";

interface CarouselItem {
  id: number;
  title: string;
  img: string[];
}

interface HomeCarouselProps {
  items: CarouselItem[];
  basePath: string;
}

function HomeCarousel({ items, basePath }: HomeCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animationPhase, setAnimationPhase] = useState<"in" | "out">("in");
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemsPerView = 3;

  useEffect(() => {
    // Check if mobile/tablet
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 991.98);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Auto-scroll for desktop (vertical)
  useEffect(() => {
    if (items.length <= itemsPerView || isMobile) {
      return;
    }

    const timer = setInterval(() => {
      setAnimationPhase("out");
    }, 3000);

    return () => clearInterval(timer);
  }, [items.length, isMobile]);

  // Auto-scroll for mobile/tablet (horizontal)
  useEffect(() => {
    if (!isMobile || items.length === 0) {
      return;
    }

    const timer = setInterval(() => {
      if (containerRef.current) {
        const container = containerRef.current;
        const itemWidth =
          container.querySelector(".promo-img-container")?.clientWidth || 0;
        const gap = 20;
        const scrollAmount = itemWidth + gap;

        // Scroll to next item
        const newScrollLeft = container.scrollLeft + scrollAmount;

        // If at the end, scroll back to start
        if (newScrollLeft >= container.scrollWidth - container.clientWidth) {
          container.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          container.scrollTo({ left: newScrollLeft, behavior: "smooth" });
        }
      }
    }, 3000);

    return () => clearInterval(timer);
  }, [isMobile, items.length]);

  const handleAnimationEnd = () => {
    if (animationPhase === "out" && !isMobile) {
      setCurrentIndex((prevIndex) => {
        const newIndex = prevIndex + itemsPerView;
        return newIndex >= items.length ? 0 : newIndex;
      });
      setAnimationPhase("in");
    }
  };

  const getVisibleItems = () => {
    if (items.length === 0) {
      return [];
    }

    // On mobile/tablet, show all items for horizontal scroll
    if (isMobile) {
      return items;
    }

    // On desktop, show only current items
    const visibleItems = [];
    for (let i = 0; i < itemsPerView; i++) {
      const index = (currentIndex + i) % items.length;
      if (items[index]) {
        visibleItems.push(items[index]);
      }
    }
    return visibleItems;
  };

  const visibleItems = getVisibleItems();
  const animationClass = !isMobile
    ? `carousel-animation-${animationPhase}`
    : "";

  return (
    <div
      className="home-carousel-vertical-container"
      ref={containerRef}
      onAnimationEnd={handleAnimationEnd}
    >
      <div className={`home-carousel-vertical-content ${animationClass}`}>
        {visibleItems.map((item) => (
          <Link
            key={item.id}
            to={`${basePath}/${item.id}`}
            className="promo-card-link"
          >
            <div className="promo-img-container">
              <img src={item.img[0]} alt={item.title} />
            </div>
            <div className="promo-card-title">{item.title}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default HomeCarousel;
