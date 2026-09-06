// Free Geocoding utility using OpenStreetMap Nominatim + Offline Global City Dictionary
// 100% free, zero API key required

const OFFLINE_CITY_COORDINATES = {
  // India & South Asia
  'bengaluru': { lat: 12.9716, lon: 77.5946, country: 'India' },
  'bangalore': { lat: 12.9716, lon: 77.5946, country: 'India' },
  'delhi': { lat: 28.6139, lon: 77.2090, country: 'India' },
  'new delhi': { lat: 28.6139, lon: 77.2090, country: 'India' },
  'mumbai': { lat: 19.0760, lon: 72.8777, country: 'India' },
  'pune': { lat: 18.5204, lon: 73.8567, country: 'India' },
  'hyderabad': { lat: 17.3850, lon: 78.4867, country: 'India' },
  'chennai': { lat: 13.0827, lon: 80.2707, country: 'India' },
  'kolkata': { lat: 22.5726, lon: 88.3639, country: 'India' },
  'ahmedabad': { lat: 23.0225, lon: 72.5714, country: 'India' },
  'jaipur': { lat: 26.9124, lon: 75.7873, country: 'India' },
  'noida': { lat: 28.5355, lon: 77.3910, country: 'India' },
  'gurugram': { lat: 28.4595, lon: 77.0266, country: 'India' },
  'gurgaon': { lat: 28.4595, lon: 77.0266, country: 'India' },
  'dhaka': { lat: 23.8103, lon: 90.4125, country: 'Bangladesh' },
  'colombo': { lat: 6.9271, lon: 79.8612, country: 'Sri Lanka' },
  'lahore': { lat: 31.5204, lon: 74.3587, country: 'Pakistan' },

  // Southeast Asia & East Asia
  'singapore': { lat: 1.3521, lon: 103.8198, country: 'Singapore' },
  'jakarta': { lat: -6.2088, lon: 106.8456, country: 'Indonesia' },
  'kuala lumpur': { lat: 3.1390, lon: 101.6869, country: 'Malaysia' },
  'bangkok': { lat: 13.7563, lon: 100.5018, country: 'Thailand' },
  'tokyo': { lat: 35.6762, lon: 139.6503, country: 'Japan' },
  'seoul': { lat: 37.5665, lon: 126.9780, country: 'South Korea' },
  'taipei': { lat: 25.0330, lon: 121.5654, country: 'Taiwan' },
  'hanoi': { lat: 21.0285, lon: 105.8542, country: 'Vietnam' },
  'ho chi minh city': { lat: 10.8231, lon: 106.6297, country: 'Vietnam' },
  'manila': { lat: 14.5995, lon: 120.9842, country: 'Philippines' },

  // Europe
  'london': { lat: 51.5074, lon: -0.1278, country: 'United Kingdom' },
  'berlin': { lat: 52.5200, lon: 13.4050, country: 'Germany' },
  'munich': { lat: 48.1351, lon: 11.5820, country: 'Germany' },
  'paris': { lat: 48.8566, lon: 2.3522, country: 'France' },
  'amsterdam': { lat: 52.3676, lon: 4.9041, country: 'Netherlands' },
  'dublin': { lat: 53.3498, lon: -6.2603, country: 'Ireland' },
  'stockholm': { lat: 59.3293, lon: 18.0686, country: 'Sweden' },
  'helsinki': { lat: 60.1699, lon: 24.9384, country: 'Finland' },
  'zurich': { lat: 47.3769, lon: 8.5417, country: 'Switzerland' },
  'vienna': { lat: 48.2082, lon: 16.3738, country: 'Austria' },
  'madrid': { lat: 40.4168, lon: -3.7038, country: 'Spain' },
  'barcelona': { lat: 41.3851, lon: 2.1734, country: 'Spain' },
  'warsaw': { lat: 52.2297, lon: 21.0122, country: 'Poland' },
  'tallinn': { lat: 59.4370, lon: 24.7536, country: 'Estonia' },

  // North America
  'san francisco': { lat: 37.7749, lon: -122.4194, country: 'United States' },
  'new york': { lat: 40.7128, lon: -74.0060, country: 'United States' },
  'seattle': { lat: 47.6062, lon: -122.3321, country: 'United States' },
  'austin': { lat: 30.2672, lon: -97.7431, country: 'United States' },
  'boston': { lat: 42.3601, lon: -71.0589, country: 'United States' },
  'los angeles': { lat: 34.0522, lon: -118.2437, country: 'United States' },
  'chicago': { lat: 41.8781, lon: -87.6298, country: 'United States' },
  'toronto': { lat: 43.6532, lon: -79.3832, country: 'Canada' },
  'vancouver': { lat: 49.2827, lon: -123.1207, country: 'Canada' },
  'montreal': { lat: 45.5017, lon: -73.5673, country: 'Canada' },

  // Latin America
  'sao paulo': { lat: -23.5505, lon: -46.6333, country: 'Brazil' },
  'rio de janeiro': { lat: -22.9068, lon: -43.1729, country: 'Brazil' },
  'buenos aires': { lat: -34.6037, lon: -58.3816, country: 'Argentina' },
  'mexico city': { lat: 19.4326, lon: -99.1332, country: 'Mexico' },
  'bogota': { lat: 4.7110, lon: -74.0721, country: 'Colombia' },
  'santiago': { lat: -33.4489, lon: -70.6693, country: 'Chile' },

  // Africa & Middle East
  'lagos': { lat: 6.5244, lon: 3.3792, country: 'Nigeria' },
  'nairobi': { lat: -1.2921, lon: 36.8219, country: 'Kenya' },
  'cape town': { lat: -33.9249, lon: 18.4241, country: 'South Africa' },
  'johannesburg': { lat: -26.2041, lon: 28.0473, country: 'South Africa' },
  'cairo': { lat: 30.0444, lon: 31.2357, country: 'Egypt' },
  'dubai': { lat: 25.2048, lon: 55.2708, country: 'United Arab Emirates' },
  'tel aviv': { lat: 32.0853, lon: 34.7818, country: 'Israel' },

  // Oceania
  'sydney': { lat: -33.8688, lon: 151.2093, country: 'Australia' },
  'melbourne': { lat: -37.8136, lon: 144.9631, country: 'Australia' },
  'auckland': { lat: -36.8485, lon: 174.7633, country: 'New Zealand' }
};

/**
 * Geocodes city and country into Latitude & Longitude using OpenStreetMap Nominatim
 * with an instant offline lookup dictionary fallback.
 * If isRemote is true, uses country-level centroid with randomized jitter for privacy,
 * or global equatorial hub if country is worldwide/empty.
 */
export async function geocodeLocation(city = '', country = '', isRemote = false) {
  const cleanCity = (city || '').trim().toLowerCase();
  const cleanCountry = (country || '').trim();
  const isExplicitRemote = isRemote || 
    cleanCity === 'remote' || 
    cleanCity === 'worldwide' || 
    cleanCity === 'global' || 
    cleanCity === 'hidden';

  // 1. If Remote / Privacy Mode is requested
  if (isExplicitRemote) {
    if (!cleanCountry || cleanCountry.toLowerCase() === 'global' || cleanCountry.toLowerCase() === 'worldwide' || cleanCountry.toLowerCase() === 'remote') {
      // Global / Cloud team hub in equatorial mid-Atlantic
      return {
        lat: 0.0 + (Math.random() - 0.5) * 4,
        lon: -25.0 + (Math.random() - 0.5) * 6,
        isRemote: true,
        isGlobal: true,
        source: 'global-hub'
      };
    }

    // Country-level privacy pin with subtle jitter (+/- 1.5 deg) so pins don't overlap exactly
    const baseCoords = getFallbackCoordinates(cleanCountry);
    const jitterLat = (Math.random() - 0.5) * 2.8;
    const jitterLon = (Math.random() - 0.5) * 3.2;
    return {
      lat: parseFloat((baseCoords.lat + jitterLat).toFixed(4)),
      lon: parseFloat((baseCoords.lon + jitterLon).toFixed(4)),
      isRemote: true,
      source: 'country-centroid'
    };
  }

  // 2. Instant offline lookup for known cities
  if (cleanCity && OFFLINE_CITY_COORDINATES[cleanCity]) {
    const entry = OFFLINE_CITY_COORDINATES[cleanCity];
    return {
      lat: entry.lat,
      lon: entry.lon,
      source: 'offline-cache'
    };
  }

  // 3. Query free OpenStreetMap Nominatim API
  try {
    const query = encodeURIComponent(`${city}${cleanCountry ? ', ' + cleanCountry : ''}`);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'TalentGlobeProjectShowcase/1.0'
      }
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lon: parseFloat(data[0].lon),
          source: 'nominatim'
        };
      }
    }
  } catch (err) {
    // Network or rate limit gracefully handled
  }

  // 4. Fallback coordinates based on country or default centroid
  return getFallbackCoordinates(cleanCountry);
}

function getFallbackCoordinates(country) {
  const countryLower = (country || '').toLowerCase();
  if (countryLower.includes('india') || countryLower.includes('bharat')) return { lat: 20.5937, lon: 78.9629, source: 'fallback' };
  if (countryLower.includes('united states') || countryLower.includes('usa') || countryLower.includes('us')) return { lat: 37.0902, lon: -95.7129, source: 'fallback' };
  if (countryLower.includes('germany') || countryLower.includes('deutschland')) return { lat: 51.1657, lon: 10.4515, source: 'fallback' };
  if (countryLower.includes('united kingdom') || countryLower.includes('uk')) return { lat: 55.3781, lon: -3.4360, source: 'fallback' };
  if (countryLower.includes('japan')) return { lat: 36.2048, lon: 138.2529, source: 'fallback' };
  if (countryLower.includes('brazil')) return { lat: -14.2350, lon: -51.9253, source: 'fallback' };
  if (countryLower.includes('australia')) return { lat: -25.2744, lon: 133.7751, source: 'fallback' };
  if (countryLower.includes('singapore')) return { lat: 1.3521, lon: 103.8198, source: 'fallback' };
  if (countryLower.includes('canada')) return { lat: 56.1304, lon: -106.3468, source: 'fallback' };
  if (countryLower.includes('france')) return { lat: 46.2276, lon: 2.2137, source: 'fallback' };
  if (countryLower.includes('netherlands')) return { lat: 52.1326, lon: 5.2913, source: 'fallback' };
  if (countryLower.includes('sweden')) return { lat: 60.1282, lon: 18.6435, source: 'fallback' };
  if (countryLower.includes('switzerland')) return { lat: 46.8182, lon: 8.2275, source: 'fallback' };
  
  return { lat: 18.5204, lon: 73.8567, source: 'fallback' };
}

