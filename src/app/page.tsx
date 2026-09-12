import Hero from '@/components/home/Hero';
import Statement from '@/components/home/Statement';
import DishShowcase from '@/components/home/DishShowcase';
import MenuSection from '@/components/menu/MenuSection';
import GallerySection from '@/components/gallery/GallerySection';
import AboutSection from '@/components/about/AboutSection';
import VisitSection from '@/components/contact/VisitSection';
import { dishes } from '@/content/dishes';
import { signatureDishes } from '@/lib/menu';

export default function HomePage() {
  return (
    <>
      <Hero />
      <Statement />
      <DishShowcase dishes={signatureDishes(dishes, 4)} />
      <MenuSection />
      <GallerySection />
      <AboutSection />
      <VisitSection />
    </>
  );
}
