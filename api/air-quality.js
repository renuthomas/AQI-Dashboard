export default async function handler(req, res) {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'API key not configured' });
    }

    const { location } = req.body;
    const latitude=location.latitude;
    const longitude=location.longitude;
    const url = `https://airquality.googleapis.com/v1/currentConditions:lookup?key=${apiKey}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                location: { latitude, longitude },
                universalAqi: true,
                extraComputations: [
                  "LOCAL_AQI",
                  "HEALTH_RECOMMENDATIONS",
                  "POLLUTANT_ADDITIONAL_INFO",
                  "DOMINANT_POLLUTANT_CONCENTRATION",
                  "POLLUTANT_CONCENTRATION",
                  "EXTRA_COMPUTATION_UNSPECIFIED",
                ]})
        });
        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch air quality data' });
    }
}