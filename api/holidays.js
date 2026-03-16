const holidayCache = new Map();

function parseYear(value) {
  const year = parseInt(String(value || ''), 10);
  if (!Number.isInteger(year) || year < 2000 || year > 2100) return null;
  return year;
}

export default async function handler(req, res) {
  const method = (req.method || 'GET').toUpperCase();
  if (method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const year = parseYear(req.query && req.query.year) || new Date().getFullYear();
  const cached = holidayCache.get(year);
  if (cached) {
    return res.status(200).json({ ok: true, holidays: cached });
  }

  try {
    const response = await fetch(`https://date.nager.at/api/v3/publicholidays/${year}/KR`);
    if (!response.ok) {
      throw new Error(`Holiday API failed (${response.status})`);
    }

    const data = await response.json();
    const holidays = Array.isArray(data)
      ? data.map((item) => ({
          date: item && item.date ? String(item.date).slice(0, 10) : '',
          name: item && (item.localName || item.name) ? String(item.localName || item.name) : '',
        })).filter((item) => item.date)
      : [];

    holidayCache.set(year, holidays);
    return res.status(200).json({ ok: true, holidays });
  } catch (err) {
    return res.status(503).json({ ok: false, error: err.message || 'Holiday fetch failed' });
  }
}
