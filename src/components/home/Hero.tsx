import Image from 'next/image';
import Parallax from '@/components/motion/Parallax';
import Reveal from '@/components/motion/Reveal';
import SplitHeading from '@/components/motion/SplitHeading';
import { venue } from '@/content/venue';
import styles from './Hero.module.css';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=2000&q=80&auto=format&fit=crop';

export default function Hero() {
  return (
    <section className={styles.hero}>
      <Parallax className={styles.media} speed={0.18}>
        <Image
          className={styles.image}
          src={HERO_IMAGE}
          alt=""
          fill
          priority
          sizes="100vw"
        />
      </Parallax>
      <div className={styles.scrim} aria-hidden="true" />

      <div className={styles.content}>
        <Reveal>
          <p className={styles.eyebrow}>Scorchlit · Downtown</p>
        </Reveal>
        <SplitHeading as="h1" text="Live flame, seasonal plates" className={styles.title} />
        <Reveal delay={0.3}>
          <p className={styles.tagline}>{venue.tagline}</p>
        </Reveal>
      </div>
    </section>
  );
}
