import PageTransition from '@/components/motion/PageTransition';
import Hero from '@/components/home/Hero';
import Statement from '@/components/home/Statement';
import DishShowcase from '@/components/home/DishShowcase';
import { dishes } from '@/content/dishes';
import { signatureDishes } from '@/lib/menu';

export default function HomePage() {
  return (
    <PageTransition>
      <Hero />
      <Statement />
      <DishShowcase dishes={signatureDishes(dishes, 4)} />
    </PageTransition>
  );
}
