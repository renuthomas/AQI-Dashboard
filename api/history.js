export default async function handler(req, res) {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY; // Replace with the correct API key environment variable
    if (!apiKey) {
        return res.status(500).json({ error: 'API key not configured' });
    }

    const { location, period,pageToken } = req.body;
    const url = `https://airquality.googleapis.com/v1/history:lookup?key=${apiKey}`;

    try {
        const response = await fetch(url,{
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                location,
                period,
                pageToken
            }),
        });
        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch historical data' });
    }
}