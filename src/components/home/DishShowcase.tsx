import Image from 'next/image';
import PinnedSequence from '@/components/motion/PinnedSequence';
import Reveal from '@/components/motion/Reveal';
import SplitHeading from '@/components/motion/SplitHeading';
import { Dish } from '@/types';
import styles from './DishShowcase.module.css';

interface DishShowcaseProps {
  dishes: Dish[];
}

export default function DishShowcase({ dishes }: DishShowcaseProps) {
  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <Reveal>
          <p className={styles.eyebrow}>Signatures</p>
        </Reveal>
        <SplitHeading text="Plates worth the trip" className={styles.title} />
      </div>

      <PinnedSequence>
        {dishes.map((dish) => (
          <article key={dish.id} className={styles.panel}>
            <div className={styles.frame}>
              <Image
                className={styles.image}
                src={dish.image}
                alt={dish.name}
                fill
                sizes="(max-width: 900px) 78vw, 460px"
              />
            </div>
            <h3 className={styles.name}>{dish.name}</h3>
            <p className={styles.description}>{dish.description}</p>
          </article>
        ))}
      </PinnedSequence>
    </section>
  );
}
