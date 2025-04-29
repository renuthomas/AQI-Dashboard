export default function handler(req, res) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    console.error('Google Maps API key is not configured');
    return res.status(500).json({ error: 'Google Maps API key not configured' });
  }

  try {
    // Set the content type to JavaScript
    res.setHeader('Content-Type', 'application/javascript');

    // Return the script with the API key embedded
    res.send(`
      initMap = function() {
        try {
          // Initialize the map
          const map = new google.maps.Map(document.getElementById('map'), {
            center: { lat: 12.9716, lng: 77.5946 },
            zoom: 8
          });
          console.log('Map initialized successfully');
        } catch (error) {
          console.error('Error initializing map:', error);
          document.getElementById('map').innerHTML = \`
            <div class="alert alert-danger" role="alert">
              <h4 class="alert-heading">Map Initialization Error</h4>
              <p>\${error.message}</p>
            </div>
          \`;
        }
      };

      const scriptgooglemap = document.createElement('script');
      scriptgooglemap.src = 'https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=marker,places&callback=initializeMap';
      scriptgooglemap.onerror = function(error) {
        console.error('Script loading error:', error);
        document.getElementById('map').innerHTML = \`
          <div class="alert alert-danger" role="alert">
            <h4 class="alert-heading">Script Loading Error</h4>
            <p>Failed to load Google Maps script. Please check your network connection.</p>
          </div>
        \`;
      };
      document.head.appendChild(scriptgooglemap);
      initMap()
    `);
  } catch (error) {
    console.error('Error in maps.js:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}