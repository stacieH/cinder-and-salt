import { COURSE_LABELS, groupByCourse, signatureDishes } from '@/lib/menu';
import { Dish } from '@/types';

const dish = (id: string, course: Dish['course'], signature = false): Dish => ({
  id,
  name: `Dish ${id}`,
  description: 'A description.',
  course,
  price: 1200,
  image: 'https://images.unsplash.com/photo-1',
  signature,
});

describe('groupByCourse', () => {
  it('groups dishes into the canonical course order', () => {
    const groups = groupByCourse([
      dish('a', 'desserts'),
      dish('b', 'starters'),
      dish('c', 'mains'),
    ]);

    expect(groups.map((g) => g.course)).toEqual(['starters', 'mains', 'desserts']);
  });

  it('labels each group', () => {
    const [group] = groupByCourse([dish('a', 'starters')]);
    expect(group.label).toBe(COURSE_LABELS.starters);
  });

  it('omits courses with no dishes', () => {
    const groups = groupByCourse([dish('a', 'drinks')]);
    expect(groups).toHaveLength(1);
    expect(groups[0].course).toBe('drinks');
  });

  it('returns an empty array for no dishes', () => {
    expect(groupByCourse([])).toEqual([]);
  });
});

describe('signatureDishes', () => {
  it('returns only signature dishes', () => {
    const result = signatureDishes([
      dish('a', 'mains', true),
      dish('b', 'mains', false),
    ]);
    expect(result.map((d) => d.id)).toEqual(['a']);
  });

  it('respects the limit', () => {
    const result = signatureDishes(
      [dish('a', 'mains', true), dish('b', 'mains', true), dish('c', 'mains', true)],
      2,
    );
    expect(result).toHaveLength(2);
  });
});
