import Reveal from '@/components/motion/Reveal';
import SplitHeading from '@/components/motion/SplitHeading';
import { about } from '@/content/about';
import styles from './AboutSection.module.css';

export default function AboutSection() {
  return (
    <section id="about" className={styles.section}>
      <div className={styles.story}>
        <SplitHeading text={about.title} className={styles.title} />
        <Reveal>
          {about.story.map((paragraph) => (
            <p key={paragraph} className={styles.paragraph}>
              {paragraph}
            </p>
          ))}
        </Reveal>
      </div>

      <ol className={styles.timeline}>
        {about.milestones.map((milestone) => (
          <Reveal as="li" key={milestone.year}>
            <div className={styles.entry}>
              <span className={styles.year}>{milestone.year}</span>
              <div>
                <h3 className={styles.entryTitle}>{milestone.title}</h3>
                <p className={styles.entryBody}>{milestone.body}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </ol>
    </section>
  );
}
