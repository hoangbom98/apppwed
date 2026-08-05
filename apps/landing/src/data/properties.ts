/**
 * Re-export Property interface và constants từ @lkvip/shared/types.
 * Giữ file này để các import @/data/properties vẫn hoạt động.
 */
export type { Property } from '@lkvip/shared/types';

// Constants đặc thù của landing (không cần share)
export const AMENITIES_LIST = [
  'Swimming Pool',
  'Gym',
  '24/7 Security',
  'Covered Parking',
  'High-Speed Elevators',
  'Central Air Conditioning',
  'Kids Play Area',
  'Landscaped Gardens',
  'BBQ Area',
  'Sauna & Steam Room',
  'Business Center',
  'Conference Rooms',
  'Concierge Service',
  'Smart Home Features',
  'Private Beach Access',
  'Tennis Court',
  'Jogging Track',
  'Yoga Studio',
  'Spa & Wellness Center',
  'Indoor Cinema',
  'Game Room',
  'Library',
  'Pets Allowed',
  'EV Charging Station',
  'Solar Panels',
  'Rainwater Harvesting',
  'Cafeteria/Restaurant',
  'Retail Shops',
  'Medical Center',
  'School/Nursery',
  'Prayer Room',
  'Laundry Facilities',
];
