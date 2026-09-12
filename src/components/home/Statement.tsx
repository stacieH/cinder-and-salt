import Reveal from '@/components/motion/Reveal';
import styles from './Statement.module.css';

export default function Statement() {
  return (
    <section className={styles.statement}>
      <Reveal>
        <p className={styles.body}>
          One menu, written each morning around what the farms and the day boats send.
          Seasoned with our own flake salt, cooked over live flame, and finished by hand
          at the pass a few steps from your table.
        </p>
        <div className={styles.rule} />
      </Reveal>
    </section>
  );
}
