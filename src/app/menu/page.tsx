import { Metadata } from 'next';
import PageTransition from '@/components/motion/PageTransition';
import Reveal from '@/components/motion/Reveal';
import SplitHeading from '@/components/motion/SplitHeading';
import CourseNav from '@/components/menu/CourseNav';
import { dishes } from '@/content/dishes';
import { groupByCourse } from '@/lib/menu';
import styles from './menu.module.css';

export const metadata: Metadata = {
  title: 'Menu',
  description:
    'A live-flame menu of starters, mains, sides, desserts, and drinks.',
};

export default function MenuPage() {
  const groups = groupByCourse(dishes);

  return (
    <PageTransition>
      <div className={styles.page}>
        <SplitHeading as="h1" text="The Menu" className={styles.title} />
        <Reveal>
          <p className={styles.intro}>
            Written each morning around what arrives. Prices are in Philippine pesos and
            include service.
          </p>
        </Reveal>

        <div className={styles.layout}>
          <CourseNav groups={groups.map(({ course, label }) => ({ course, label }))} />

          <div>
            {groups.map((group) => (
              <section key={group.course} id={group.course} className={styles.course}>
                <h2 className={styles.courseTitle}>{group.label}</h2>
                <Reveal stagger={0.06}>
                  {group.dishes.map((dish) => (
                    <div key={dish.id} className={styles.dish}>
                      <div>
                        <h3 className={styles.dishName}>{dish.name}</h3>
                        <p className={styles.dishDescription}>{dish.description}</p>
                      </div>
                      <span className={styles.price}>₱{dish.price.toLocaleString('en-PH')}</span>
                    </div>
                  ))}
                </Reveal>
              </section>
            ))}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
