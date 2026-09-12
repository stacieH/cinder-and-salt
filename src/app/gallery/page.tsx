import { Metadata } from 'next';
import PageTransition from '@/components/motion/PageTransition';
import Reveal from '@/components/motion/Reveal';
import SplitHeading from '@/components/motion/SplitHeading';
import GalleryGrid from '@/components/gallery/GalleryGrid';
import { galleryImages } from '@/content/gallery';
import styles from './gallery.module.css';

export const metadata: Metadata = {
  title: 'Gallery',
  description: 'The dining room, the grill, and the plates that leave it.',
};

export default function GalleryPage() {
  return (
    <PageTransition>
      <div className={styles.page}>
        <SplitHeading as="h1" text="The Room" className={styles.title} />
        <Reveal>
          <p className={styles.intro}>
            Photographs from service — the grill at its hottest, and the room once it
            settles.
          </p>
        </Reveal>

        <GalleryGrid images={galleryImages} />
      </div>
    </PageTransition>
  );
}
