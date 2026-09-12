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

export interface Milestone {
  year: string;
  title: string;
  body: string;
}

export interface AboutContent {
  title: string;
  story: string[];
  milestones: Milestone[];
}

export interface OpeningHours {
  days: string;
  time: string;
}

export interface LatLng {
  lat: number;
  lng: number;
}

export interface Venue {
  name: string;
  tagline: string;
  address: string[];
  phone: string;
  email: string;
  /** Neighbourhood named in the map's accessible title. */
  mapArea: string;
  /** Point the embedded map centres on and marks with the venue pin. */
  coordinates: LatLng;
  hours: OpeningHours[];
}

