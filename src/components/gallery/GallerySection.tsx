import Reveal from '@/components/motion/Reveal';
import SplitHeading from '@/components/motion/SplitHeading';
import GalleryGrid from '@/components/gallery/GalleryGrid';
import { galleryImages } from '@/content/gallery';
import styles from './GallerySection.module.css';

export default function GallerySection() {
  return (
    <section id="gallery" className={styles.section}>
      <SplitHeading text="The Room" className={styles.title} />
      <Reveal>
        <p className={styles.intro}>
          Photographs from service — the grill at its hottest, and the room once it
          settles.
        </p>
      </Reveal>

      <GalleryGrid images={galleryImages} />
    </section>
  );
}
