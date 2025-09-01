const express = require("express");
const axios = require("axios");
const router = express.Router();

const API_KEY = process.env.WEATHER_API_KEY;

// GET /api/weather?lat=6.9271&lon=79.8612 (coordinates)
router.get("/", async (req, res) => {
  const { lat, lon, city } = req.query;
  
  if (!API_KEY) {
    console.error("ERROR: Weather API key not configured");
    return res.status(500).json({ error: "Weather API key not configured" });
  }

  // Determine query parameter for WeatherAPI
  let queryParam;
  let requestType;
  
  if (lat && lon) {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);
    
    if (isNaN(latitude) || isNaN(longitude)) {
      console.error(`ERROR: Invalid coordinates - lat: ${lat}, lon: ${lon}`);
      return res.status(400).json({ error: "Invalid latitude or longitude values" });
    }
    
    // Validate coordinate ranges
    if (latitude < -90 || latitude > 90) {
      console.error(`ERROR: Latitude out of range: ${latitude}`);
      return res.status(400).json({ error: "Latitude must be between -90 and 90" });
    }
    
    if (longitude < -180 || longitude > 180) {
      console.error(`ERROR: Longitude out of range: ${longitude}`);
      return res.status(400).json({ error: "Longitude must be between -180 and 180" });
    }
    
    queryParam = `${latitude},${longitude}`;
    requestType = 'coordinates';
    
    console.log(`=== WEATHER API REQUEST (Backend) ===`);
    console.log(`Request type: ${requestType}`);
    console.log(`Input coordinates: ${queryParam}`);
    console.log(`Received from client - lat: ${latitude}, lon: ${longitude}`);
    
  } else if (city) {
    // Fallback to city name
    queryParam = city;
    requestType = 'city';
    console.log(`=== WEATHER API REQUEST (Backend) ===`);
    console.log(`Request type: ${requestType}`);
    console.log(`City name: ${queryParam}`);
  } else {
    console.error("ERROR: Missing required parameters");
    return res.status(400).json({ 
      error: "Missing required parameters. Provide either 'lat' and 'lon' coordinates, or 'city' name" 
    });
  }

  try {
    console.log(`Fetching weather data for: ${queryParam}`);
    console.log(`WeatherAPI.com URL: http://api.weatherapi.com/v1/forecast.json`);
    
    const startTime = Date.now();
    
    const response = await axios.get(
      `http://api.weatherapi.com/v1/forecast.json`,
      {
        params: {
          key: API_KEY,
          q: queryParam, // Can be coordinates "lat,lon" or city name
          days: 3,
          aqi: "no",
          alerts: "no",
        },
        timeout: 10000, // Increased timeout
      }
    );

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    // Enhanced logging for successful response
    console.log(`=== WEATHER API RESPONSE (Backend) ===`);
    console.log(`Response time: ${responseTime}ms`);
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (response.data && response.data.location) {
      const loc = response.data.location;
      console.log(`Returned location details:`);
      console.log(`  Name: ${loc.name}`);
      console.log(`  Region: ${loc.region}`);
      console.log(`  Country: ${loc.country}`);
      console.log(`  Coordinates: ${loc.lat}, ${loc.lon}`);
      console.log(`  Timezone: ${loc.tz_id}`);
      console.log(`  Local time: ${loc.localtime}`);
      
      if (requestType === 'coordinates') {
        // Calculate and log coordinate differences
        const inputLat = parseFloat(lat);
        const inputLon = parseFloat(lon);
        const returnedLat = parseFloat(loc.lat);
        const returnedLon = parseFloat(loc.lon);
        
        const latDiff = Math.abs(inputLat - returnedLat);
        const lonDiff = Math.abs(inputLon - returnedLon);
        
        console.log(`=== COORDINATE ANALYSIS ===`);
        console.log(`Input:    ${inputLat}, ${inputLon}`);
        console.log(`Returned: ${returnedLat}, ${returnedLon}`);
        console.log(`Lat diff: ${latDiff.toFixed(6)} degrees`);
        console.log(`Lon diff: ${lonDiff.toFixed(6)} degrees`);
        
        // Rough distance calculation (not precise, but good enough for debugging)
        const roughDistanceKm = Math.sqrt(latDiff * latDiff + lonDiff * lonDiff) * 111;
        console.log(`Approximate distance: ${roughDistanceKm.toFixed(2)} km`);
        
        if (roughDistanceKm > 10) {
          console.log(`WARNING: Large distance difference detected!`);
          console.log(`This might explain why you're seeing weather for a different location.`);
        }
        console.log(`==========================`);
      }
    }
    
    // Log current weather summary
    if (response.data && response.data.current) {
      const current = response.data.current;
      console.log(`Current weather: ${current.condition.text}, ${current.temp_c}°C`);
    }
    
    console.log(`Weather data fetched successfully!`);
    console.log(`=====================================`);
    
    res.json(response.data);
    
  } catch (error) {
    console.error(`=== WEATHER API ERROR (Backend) ===`);
    console.error(`Query parameter: ${queryParam}`);
    console.error(`Request type: ${requestType}`);
    console.error(`Error type: ${error.code || 'Unknown'}`);
    console.error(`Status: ${error?.response?.status || 'No status'}`);
    console.error(`Status text: ${error?.response?.statusText || 'No status text'}`);
    
    if (error?.response?.data) {
      console.error(`API error details:`, error.response.data);
    } else {
      console.error(`Error message: ${error.message}`);
    }
    
    console.error(`===================================`);

    // Provide more specific error messages based on error type
    let errorMessage = "Weather data fetch failed";
    let statusCode = 500;
    
    if (error?.response?.status === 400) {
      errorMessage = "Invalid location. The provided coordinates or city name could not be found.";
      statusCode = 400;
      
      // Check for specific WeatherAPI error messages
      if (error?.response?.data?.error?.message) {
        const apiError = error.response.data.error.message;
        if (apiError.includes('No matching location')) {
          errorMessage = "No weather station found for your exact location. Please try again or check your GPS signal.";
        } else if (apiError.includes('Invalid coordinates')) {
          errorMessage = "Invalid GPS coordinates received. Please check your location settings.";
        }
      }
      
    } else if (error?.response?.status === 401) {
      errorMessage = "Weather service authentication failed - API key issue";
      statusCode = 500; // Don't expose auth issues to client
    } else if (error?.response?.status === 403) {
      errorMessage = "Weather service access denied - quota exceeded or invalid API key";
      statusCode = 500; // Don't expose auth issues to client
    } else if (error?.response?.status === 429) {
      errorMessage = "Weather service rate limit exceeded. Please try again later.";
      statusCode = 429;
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = "Weather service request timed out. Please try again.";
      statusCode = 408;
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      errorMessage = "Cannot connect to weather service. Please try again later.";
      statusCode = 503;
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = "Weather service connection timed out. Please check your internet connection.";
      statusCode = 408;
    }

    res.status(statusCode).json({ 
      error: errorMessage,
      details: error?.response?.data?.error?.message || error.message,
      coordinates: requestType === 'coordinates' ? queryParam : undefined
    });
  }
});

module.exports = router;