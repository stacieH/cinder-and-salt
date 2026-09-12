import { Venue } from '@/types';

export const venue: Venue = {
  name: 'Cinder & Salt',
  tagline: 'Live-flame cooking, seasonal plates, and a cellar built for pairing.',
  address: ['27 Cinderwood Lane', 'Poblacion', 'Makati 1210'],
  phone: '+63 2 8123 4567',
  email: 'reserve@cinderandsalt.example',
  // The street address above is fictional, so the map marks an invented spot
  // in Poblacion: inside the block between General Luna Street and Kalayaan
  // Avenue, just west of Makati Avenue, clear of the roads. Replace both with
  // the real location once there is one.
  mapArea: 'Poblacion, Makati City',
  coordinates: { lat: 14.5653, lng: 121.0288 },
  hours: [
    { days: 'Tuesday — Thursday', time: '18:00 — 23:00' },
    { days: 'Friday — Saturday', time: '17:30 — 00:30' },
    { days: 'Sunday', time: '17:30 — 22:00' },
    { days: 'Monday', time: 'Closed' },
  ],
};
