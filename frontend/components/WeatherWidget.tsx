import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  StyleSheet,
  Image,
  FlatList,
  Alert,
} from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

// Use environment variable WEATHER_API_BASE when available; fallback to localhost for development
const API_BASE = (process.env && process.env.WEATHER_API_BASE) || 'http://192.168.8.124:3000';

interface LocationCoords {
  latitude: number;
  longitude: number;
}

const WeatherWidget: React.FC = () => {
  const [current, setCurrent] = useState<any | null>(null);
  const [forecast, setForecast] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [locationName, setLocationName] = useState<string>('Your Location');
  const [watcher, setWatcher] = useState<any>(null);

  // Request location permissions and get current location with highest accuracy
  const getLocation = async (): Promise<LocationCoords | null> => {
    try {
      console.log('=== LOCATION PERMISSION REQUEST ===');
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required.');
        return null;
      }

      console.log('Location permission granted, getting position...');

      const locationResult = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest, // true GPS accuracy
        mayShowUserSettingsDialog: true,
      });

      const coords = {
        latitude: locationResult.coords.latitude,
        longitude: locationResult.coords.longitude,
      };

      console.log('GPS Coordinates:', coords, 'Accuracy:', locationResult.coords.accuracy, 'm');
      return coords;
    } catch (error) {
      console.error('Error getting location:', error);
      return null;
    }
  };

  // Start watching for more precise updates
  const startWatching = async () => {
    if (watcher) {
      watcher.remove();
    }

    const sub = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Highest,
        distanceInterval: 1, // every 1 meter
        timeInterval: 1000, // or every 1s
      },
      (loc) => {
        console.log('Watch update:', loc.coords);
        setLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
      },
    );

    setWatcher(sub);
  };

  const fetchWeather = async () => {
    setLoading(true);
    setError(null);

    try {
      const coords = await getLocation();
      if (!coords) {
        setError('Location access required');
        setLoading(false);
        return;
      }

      setLocation(coords);

      const res = await axios.get(`${API_BASE}/api/weather`, {
        params: { lat: coords.latitude, lon: coords.longitude },
        timeout: 10000,
      });

      const curr = res?.data?.current;
      const days = res?.data?.forecast?.forecastday;
      const locationData = res?.data?.location;

      if (locationData) {
        // Compare GPS vs API location
        const latDiff = Math.abs(coords.latitude - locationData.lat);
        const lonDiff = Math.abs(coords.longitude - locationData.lon);
        const approxDistance = Math.sqrt(latDiff * latDiff + lonDiff * lonDiff) * 111;
        console.log(`API says: ${locationData.name}, ${locationData.region} (diff ~${approxDistance.toFixed(2)} km)`);

        // If difference > 50km, trust GPS instead of API
        if (approxDistance > 50) {
          console.warn('Weather API returned a distant city, keeping GPS coords instead');
          setLocationName(`GPS: ${coords.latitude.toFixed(3)}, ${coords.longitude.toFixed(3)}`);
        } else {
          setLocationName(`${locationData.name}, ${locationData.region}`);
        }
      }

      setCurrent(curr ?? null);
      setForecast(days ?? null);
    } catch (err: any) {
      console.error('Weather fetch error:', err);
      setError('Failed to load weather');
    }
    setLoading(false);
  };

  const refreshLocation = async () => {
    console.log('=== FORCING FRESH GPS ===');
    startWatching(); // start live updates
    fetchWeather(); // also trigger weather fetch
  };

  const openModal = () => {
    setVisible(true);
    fetchWeather();
  };

  useEffect(() => {
    return () => {
      if (watcher) watcher.remove();
    };
  }, [watcher]);

  // Render current weather info
  const renderCurrent = () => {
    if (!current) return null;
    const iconRaw = current?.condition?.icon;
    const iconUrl = iconRaw ? (iconRaw.startsWith('//') ? `https:${iconRaw}` : iconRaw) : null;

    return (
      <View style={styles.currentRow}>
        {iconUrl ? (
          <Image source={{ uri: iconUrl }} style={styles.currentIcon} />
        ) : (
          <Ionicons name="cloud-outline" size={34} color="#333" />
        )}
        <View style={{ marginLeft: 12 }}>
          <Text style={styles.currentTemp}>{current.temp_c}°C</Text>
          <Text style={styles.currentText}>{current.condition?.text}</Text>
          <Text style={styles.currentSmall}>
            Feels like {current.feelslike_c}°C • Humidity {current.humidity}%
          </Text>
        </View>
      </View>
    );
  };

  const renderDay = ({ item }: { item: any }) => {
    const iconRaw = item?.day?.condition?.icon || item?.day?.condition?.icon;
    const iconUrl = iconRaw ? (iconRaw.startsWith('//') ? `https:${iconRaw}` : iconRaw) : null;

    return (
      <View style={styles.dayRow}>
        {iconUrl ? (
          <Image source={{ uri: iconUrl }} style={styles.dayIcon} />
        ) : (
          <Ionicons name="cloud-outline" size={26} color="#333" />
        )}
        <View style={{ marginLeft: 10 }}>
          <Text style={styles.dayTitle}>
            {item.date} — {item.day?.avgtemp_c}°C
          </Text>
          <Text style={styles.daySubtitle}>{item.day?.condition?.text}</Text>
        </View>
      </View>
    );
  };

  return (
    <View>
      <TouchableOpacity style={styles.iconButton} onPress={openModal}>
        <Ionicons name="cloud-outline" size={26} color="#fff" />
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="slide" onRequestClose={() => setVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.titleRow}>
              <Ionicons name="cloud-outline" size={20} color="#333" />
              <Text style={styles.modalTitle}>{locationName}</Text>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Getting your precise location...</Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="warning-outline" size={24} color="#FF3B30" />
                <Text style={styles.errorText}>{error}</Text>
                <View style={styles.buttonRow}>
                  <TouchableOpacity style={styles.retryButton} onPress={fetchWeather}>
                    <Text style={styles.retryText}>Try Again</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.refreshButton} onPress={refreshLocation}>
                    <Text style={styles.refreshText}>Fresh GPS</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : current ? (
              <>
                {renderCurrent()}
                <View style={styles.separator} />
                <Text style={styles.forecastTitle}>3-day Forecast</Text>
                {forecast ? (
                  <FlatList data={forecast} keyExtractor={(d) => d.date} renderItem={renderDay} />
                ) : (
                  <Text style={styles.errorText}>No forecast available</Text>
                )}
              </>
            ) : (
              <Text style={styles.errorText}>No weather available</Text>
            )}

            <TouchableOpacity style={styles.closeButton} onPress={() => setVisible(false)}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '85%',
    maxWidth: 420,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    maxHeight: '80%',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 14,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  errorText: {
    color: '#FF3B30',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryText: {
    color: 'white',
    fontWeight: '600',
  },
  refreshButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  refreshText: {
    color: 'white',
    fontWeight: '600',
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
  },
  dayIcon: {
    width: 48,
    height: 48,
  },
  dayTitle: {
    fontWeight: '700',
  },
  daySubtitle: {
    color: '#666',
  },
  closeButton: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 12,
  },
  closeText: {
    color: '#007AFF',
    fontWeight: '600',
    fontSize: 16,
  },
  currentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  currentIcon: {
    width: 64,
    height: 64,
  },
  currentTemp: {
    fontSize: 28,
    fontWeight: '800',
  },
  currentText: {
    color: '#444',
    fontWeight: '600',
  },
  currentSmall: {
    color: '#666',
    marginTop: 4,
    fontSize: 12,
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 12,
  },
  forecastTitle: {
    fontWeight: '700',
    marginBottom: 8,
    fontSize: 16,
  },
});

export default WeatherWidget;
