import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade, Pagination, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-fade";
import "swiper/css/pagination";
import "swiper/css/navigation";
import { Link } from "react-router-dom";
import "./BackdropCarousel.css";

export interface CarouselItem {
  id: number | string;
  image: string;
  link: string;
  title?: string;
}

interface BackdropCarouselProps {
  items: CarouselItem[];
}

const BackdropCarousel = ({ items }: BackdropCarouselProps) => {
  if (!items || items.length === 0) return null;

  return (
    <div className="backdrop-carousel-container">
      <Swiper
        spaceBetween={0}
        effect={"fade"}
        centeredSlides={true}
        autoplay={{
          delay: 4500,
          disableOnInteraction: false,
        }}
        pagination={{
          clickable: true,
        }}
        navigation={true}
        modules={[Autoplay, EffectFade, Pagination, Navigation]}
        className="backdropSwiper"
      >
        {items.map((item) => (
          <SwiperSlide key={item.id}>
            <Link to={item.link} className="backdrop-slide-link">
              <div
                className="backdrop-image"
                style={{ backgroundImage: `url(${item.image})` }}
              >
                <div className="backdrop-overlay">
                  {/* Removed text content as requested */}
                </div>
              </div>
            </Link>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default BackdropCarousel;
