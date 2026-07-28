import React from 'react';
// @ts-ignore — swiper not installed yet; add "swiper": "^11.0.0" to package.json when deploying
import { Swiper, SwiperSlide } from 'swiper/react';
// @ts-ignore
import { Autoplay, Pagination } from 'swiper/modules';
// @ts-ignore — swiper CSS side-effect imports have no TS declarations
import 'swiper/css';
// @ts-ignore
import 'swiper/css/pagination';

interface BannerItem {
  id: string;
  image: string;
  link?: string;
}

interface BannerCarouselProps {
  banners: BannerItem[];
}

const BannerCarousel: React.FC<BannerCarouselProps> = ({ banners }) => {
  if (!banners || banners.length === 0) return null;
  return (
    <div className="game-banner">
      <Swiper
        modules={[Autoplay, Pagination]}
        autoplay={{ delay: 3000, disableOnInteraction: false }}
        pagination={{ clickable: true }}
        loop={true}
        className="rounded-lg overflow-hidden"
        style={{ height: '140px' }}
      >
        {banners.map((banner) => (
          <SwiperSlide key={banner.id}>
            <img src={banner.image} alt="banner" className="w-full h-full object-cover" />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default BannerCarousel;
