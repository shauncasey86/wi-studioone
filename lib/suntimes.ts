// Sunrise / sunset for a given date + location, computed astronomically — no
// network call, so it works offline and needs no CSP allowance. This is the
// compact NOAA/"suncalc" core, trimmed to just the two times the hero day-arc
// needs. Returns Date objects (UTC instants); the caller reads them in its own
// local zone (the arc already works in the browser's local time, i.e. London).

const rad = Math.PI / 180;
const dayMs = 86_400_000;
const J1970 = 2_440_588;
const J2000 = 2_451_545;
const e = rad * 23.4397; // obliquity of the ecliptic
const J0 = 0.0009;

const toDays = (date: Date) => date.valueOf() / dayMs - 0.5 + J1970 - J2000;
const fromJulian = (j: number) => new Date((j + 0.5 - J1970) * dayMs);

const solarMeanAnomaly = (d: number) => rad * (357.5291 + 0.98560028 * d);
const eclipticLongitude = (M: number) => {
  const C =
    rad *
    (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M));
  const P = rad * 102.9372; // perihelion of the Earth
  return M + C + P + Math.PI;
};

const julianCycle = (d: number, lw: number) =>
  Math.round(d - J0 - lw / (2 * Math.PI));
const approxTransit = (Ht: number, lw: number, n: number) =>
  J0 + (Ht + lw) / (2 * Math.PI) + n;
const solarTransitJ = (ds: number, M: number, L: number) =>
  J2000 + ds + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L);
const hourAngle = (h: number, phi: number, dec: number) =>
  Math.acos(
    (Math.sin(h) - Math.sin(phi) * Math.sin(dec)) /
      (Math.cos(phi) * Math.cos(dec)),
  );

/**
 * Sunrise and sunset for `date` at (`lat`, `lng`) in decimal degrees
 * (east-positive longitude). Returns null in the rare polar day/night case
 * where the sun never crosses the horizon.
 */
export function getSunTimes(
  date: Date,
  lat: number,
  lng: number,
): { sunrise: Date; sunset: Date } | null {
  const lw = rad * -lng;
  const phi = rad * lat;
  const d = toDays(date);
  const n = julianCycle(d, lw);
  const ds = approxTransit(0, lw, n);
  const M = solarMeanAnomaly(ds);
  const L = eclipticLongitude(M);
  const dec = Math.asin(Math.sin(e) * Math.sin(L));
  const Jnoon = solarTransitJ(ds, M, L);

  const h = -0.833 * rad; // standard sunrise/sunset altitude (with refraction)
  const w = hourAngle(h, phi, dec);
  if (!Number.isFinite(w)) return null; // polar day or night

  const Jset = solarTransitJ(approxTransit(w, lw, n), M, L);
  const Jrise = Jnoon - (Jset - Jnoon);
  return { sunrise: fromJulian(Jrise), sunset: fromJulian(Jset) };
}
