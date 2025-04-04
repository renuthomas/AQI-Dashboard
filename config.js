// config.js
const CONFIG = {
    API_ENDPOINTS: {
        AIR_QUALITY: 'https://airquality.googleapis.com/v1/currentConditions:lookup',
        GEOCODING: 'https://maps.googleapis.com/maps/api/geocode/json',
        TIMEZONE: 'https://maps.googleapis.com/maps/api/timezone/json',
        HISTORY: 'https://airquality.googleapis.com/v1/history:lookup'
    }
};

export default CONFIG; 