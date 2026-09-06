// Regional cluster definitions and geographic mapping
export const CLUSTERS_DATA = [
  { name: "India", region: "India", lat: 20.5937, lon: 78.9629, count: 36 },
  { name: "Southeast Asia", region: "Southeast Asia", lat: 8.7832, lon: 106.0, count: 18 },
  { name: "Europe", region: "Europe", lat: 50.1109, lon: 9.6830, count: 24 },
  { name: "North America", region: "United States", lat: 39.8283, lon: -98.5795, count: 18 },
  { name: "Latin America", region: "Brazil / Latin America", lat: -14.2350, lon: -51.9253, count: 12 },
  { name: "Africa", region: "Nigeria / Africa", lat: 4.0383, lon: 21.7587, count: 12 }
];

export const CLUSTER_COUNTRY_MAPPINGS = {
  'West India': ['India'],
  'South & East India': ['India'],
  'South Asia': ['India'],
  'India': ['India'],
  'Western Europe': ['United Kingdom', 'France', 'Spain', 'Netherlands', 'Germany'],
  'Central & Northern Europe': ['Germany', 'Poland', 'Sweden', 'Netherlands'],
  'Europe': ['United Kingdom', 'France', 'Spain', 'Germany', 'Poland', 'Sweden', 'Netherlands'],
  'Southeast Asia': ['Indonesia', 'Malaysia', 'Philippines', 'Singapore', 'Thailand', 'Vietnam'],
  'North America': ['United States of America'],
  'United States': ['United States of America'],
  'Latin America': ['Brazil', 'Argentina', 'Colombia', 'Mexico'],
  'Brazil / Latin America': ['Brazil', 'Argentina', 'Colombia', 'Mexico'],
  'Africa': ['Nigeria', 'Kenya', 'South Africa', 'Egypt', 'Ghana', 'Rwanda'],
  'Nigeria / Africa': ['Nigeria', 'Kenya', 'South Africa', 'Egypt', 'Ghana', 'Rwanda']
};

export const COUNTRY_NAME_MAP = {
  'United States': 'United States of America',
  'USA': 'United States of America',
  'US': 'United States of America',
  'UK': 'United Kingdom',
  'Great Britain': 'United Kingdom',
  'Russia': 'Russian Federation',
  'Korea': 'South Korea',
  'Republic of Korea': 'South Korea',
  'Tanzania': 'United Republic of Tanzania',
  'Congo': 'Dem. Rep. Congo'
};

export function buildClusterNodes(profilesData) {
  return CLUSTERS_DATA.map(base => {
    const members = profilesData.filter(p => p.region === base.region);
    return {
      name: base.name,
      region: base.region,
      lat: base.lat,
      lon: base.lon,
      count: members.length || base.count
    };
  });
}

export function getCountryListForLabel(label, countryPaths) {
  if (!label) return [];
  if (CLUSTER_COUNTRY_MAPPINGS[label]) {
    return CLUSTER_COUNTRY_MAPPINGS[label];
  }
  const mapped = COUNTRY_NAME_MAP[label] || label;
  if (countryPaths[mapped]) return [mapped];
  if (countryPaths[label]) return [label];
  const lower = label.toLowerCase();
  for (const k in countryPaths) {
    if (k.toLowerCase() === lower) return [k];
  }
  return [];
}
