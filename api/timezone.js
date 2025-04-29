export default async function handler(req, res) {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'API key not configured' });
    }

    const { latitude, longitude, timestamp } = req.body;
    const url = `https://maps.googleapis.com/maps/api/timezone/json?location=${latitude}%2C${longitude}&timestamp=${timestamp}&key=${apiKey}`;

    try {
        const response = await fetch(url,{
            method: 'POST',
            
        });
        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch timezone data' });
    }
}