import { Course, Dish } from '@/types';

export const COURSE_ORDER: Course[] = ['starters', 'mains', 'sides', 'desserts', 'drinks'];

export const COURSE_LABELS: Record<Course, string> = {
  starters: 'Starters',
  mains: 'Mains',
  sides: 'Sides',
  desserts: 'Desserts',
  drinks: 'Drinks',
};

export interface CourseGroup {
  course: Course;
  label: string;
  dishes: Dish[];
}

export function groupByCourse(dishes: Dish[]): CourseGroup[] {
  return COURSE_ORDER.map((course) => ({
    course,
    label: COURSE_LABELS[course],
    dishes: dishes.filter((dish) => dish.course === course),
  })).filter((group) => group.dishes.length > 0);
}

export function signatureDishes(dishes: Dish[], limit = 4): Dish[] {
  return dishes.filter((dish) => dish.signature).slice(0, limit);
}
