import Reveal from '@/components/motion/Reveal';
import SplitHeading from '@/components/motion/SplitHeading';
import CourseNav from '@/components/menu/CourseNav';
import { dishes } from '@/content/dishes';
import { groupByCourse } from '@/lib/menu';
import styles from './MenuSection.module.css';

export default function MenuSection() {
  const groups = groupByCourse(dishes);

  return (
    <section id="menu" className={styles.section}>
      <SplitHeading text="The Menu" className={styles.title} />
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
              <h3 className={styles.courseTitle}>{group.label}</h3>
              <Reveal stagger={0.06}>
                {group.dishes.map((dish) => (
                  <div key={dish.id} className={styles.dish}>
                    <div>
                      <h4 className={styles.dishName}>{dish.name}</h4>
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
    </section>
  );
}
