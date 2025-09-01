import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { outfitsAPI } from '../../services/api';

export interface IOutfit {
  _id: string;
  name: string;
  image_url?: any;
  plannedDate?: string; // expects an ISO date or date string
}

const Planner: React.FC = () => {
  const router = useRouter();
  const { isAuthenticated, logout } = useAuth();

  const [outfits, setOutfits] = useState<IOutfit[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const fetchOutfits = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      if (!isAuthenticated) {
        Alert.alert('Authentication Required', 'Please log in to view planned outfits.', [
          { text: 'OK', onPress: () => router.replace('/auth/login') },
        ]);
        return;
      }

      console.log('Fetching outfits for planner with authentication...');

      const fetchedOutfits = await outfitsAPI.getOutfits();
      setOutfits(fetchedOutfits || []);
    } catch (err: any) {
      console.error('Error fetching outfits for planner:', err);

      if (err.response?.status === 401) {
        Alert.alert('Session Expired', 'Please log in again.', [
          {
            text: 'OK',
            onPress: () => {
              logout();
              router.replace('/auth/login');
            },
          },
        ]);
        return;
      }

      const errorMessage = err.response?.data?.message || err.message || 'Failed to load planned outfits';
      setError(errorMessage);
      Alert.alert('Error', 'Failed to load planned outfits. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // Refetch outfits when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        fetchOutfits();
      } else {
        setLoading(false);
        router.replace('/auth/login');
      }
    }, [isAuthenticated]),
  );

  // Get outfits for a specific date
  const getOutfitsForDate = (dateString: string): IOutfit[] => {
    return outfits.filter((outfit) => {
      if (!outfit.plannedDate) return false;
      const outfitDate = new Date(outfit.plannedDate).toISOString().split('T')[0];
      return outfitDate === dateString;
    });
  };

  const handleDayPress = (day: { dateString: string }) => {
    setSelectedDate(day.dateString);

    // Get outfits for the selected date
    const outfitsForDate = getOutfitsForDate(day.dateString);

    if (outfitsForDate.length > 0) {
      // Navigate to the first outfit if there are outfits for this date
      handleOutfitPress(outfitsForDate[0]._id);
    } else {
      // Navigate to canvas/outfit creation page for dates without outfits
      router.push({
        pathname: '/canvas',
        params: {
          plannedDate: day.dateString,
          autoOpenItems: 'true',
        },
      });
    }
  };

  const handleOutfitPress = (id?: string) => {
    if (!id) return;
    router.push({ pathname: '/outfit-single', params: { id: String(id) } });
  };

  const DayComponent = ({ date, state }: any) => {
    const dateString: string = date.dateString;
    const outfitsHere = getOutfitsForDate(dateString);

    return (
      <TouchableOpacity onPress={() => handleDayPress({ dateString })} style={styles.dayContainer} activeOpacity={0.8}>
        <Text style={[styles.dayText, state === 'disabled' && styles.dayTextDisabled]}>{date.day}</Text>

        {/* Dot indicator shows that at least one outfit is planned for this date */}
        {outfitsHere.length > 0 && <View style={styles.dot} />}

        {outfitsHere.length > 0 && (
          <View style={styles.thumbsContainer}>
            {outfitsHere.slice(0, 4).map((o) => (
              <TouchableOpacity key={o._id} onPress={() => handleOutfitPress(o._id)}>
                <Image
                  source={typeof o.image_url === 'string' ? { uri: o.image_url } : o.image_url}
                  style={styles.dayThumb}
                />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Please log in to view planned outfits</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color="#007AFF" />
        </View>
      )}

      <Calendar
        current={new Date().toISOString().split('T')[0]}
        enableSwipeMonths={true}
        onDayPress={handleDayPress}
        dayComponent={DayComponent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    marginTop: 50,
  },
  listHeader: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  listHeaderText: {
    fontSize: 16,
    fontWeight: '600',
  },
  outfitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#fafafa',
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 8,
    marginRight: 12,
  },
  thumbPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#f0f0f0',
  },
  outfitName: {
    fontSize: 14,
    color: '#333',
  },
  loadingContainer: {
    padding: 12,
  },
  errorContainer: {
    padding: 12,
  },
  errorText: {
    color: '#FF3B30',
  },
  emptyContainer: {
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
  },
  dayContainer: {
    alignItems: 'center',
    padding: 2,
    minHeight: 70,
    width: '100%',
  },
  dayText: {
    fontSize: 12,
    color: '#333',
  },
  dayTextDisabled: {
    color: '#ccc',
  },
  thumbsContainer: {
    flexDirection: 'row',
    marginTop: 4,
  },
  dayThumb: {
    width: 28,
    height: 28,
    borderRadius: 6,
    marginRight: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1b6604ff',
    alignSelf: 'center',
    marginTop: 4,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 8,
    right: 12,
    zIndex: 10,
  },
});

export default Planner;
