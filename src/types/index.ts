export type Course = 'starters' | 'mains' | 'sides' | 'desserts' | 'drinks';

export interface Dish {
  id: string;
  name: string;
  description: string;
  course: Course;
  price: number;
  image: string;
  signature: boolean;
}

export interface GalleryImage {
  id: string;
  src: string;
  alt: string;
  width: number;
  height: number;
}

export interface OpeningHours {
  days: string;
  time: string;
}

export interface Venue {
  name: string;
  tagline: string;
  address: string[];
  phone: string;
  email: string;
  hours: OpeningHours[];
}

