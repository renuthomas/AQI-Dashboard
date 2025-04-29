export default async function handler(req, res) {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'API key not configured' });
    }

    const { address } = req.body;
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${encodeURIComponent(address)}&key=${apiKey}`;

    try {
        const response = await fetch(url,{
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });
        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch geocoding data' });
    }
}