import React, { useState, useCallback } from 'react';
import { Text } from 'react-native-gesture-handler';
import { StyleSheet, View, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import OutfitCard from '../../components/outfitCard';
import { outfitsAPI } from '../../services/api';

export interface IOutfitItem {
  item: {
    _id: string;
    name: string;
    color: string;
    dressCode: string;
    image: string;
    brand: string;
    material: string;
    itemType: string;
    dateAdded: string;
    createdAt: string;
    updatedAt: string;
    usageCount: number;
  };
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  _id: string;
}

export interface IOutfit {
  _id: string;
  name: string;
  occasion?: string;
  plannedDate?: string | null;
  user: string;
  items: IOutfitItem[];
  createdDate: string;
  createdAt: string;
  updatedAt: string;
  image_url?: any;
}

export default function Outfit() {
  const router = useRouter();
  const { isAuthenticated, logout } = useAuth();

  // State management
  const [outfits, setOutfits] = useState<IOutfit[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Fetch outfits from API
  const fetchOutfits = async (isRefresh: boolean = false): Promise<void> => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      if (!isAuthenticated) {
        Alert.alert('Authentication Required', 'Please log in to view your outfits.', [
          { text: 'OK', onPress: () => router.replace('/auth/login') },
        ]);
        return;
      }

      console.log('Fetching outfits with authentication...');

      const fetchedOutfits = await outfitsAPI.getOutfits();
      setOutfits(fetchedOutfits);
    } catch (err: any) {
      console.error('Error fetching outfits:', err);

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

      const errorMessage = err.response?.data?.message || err.message || 'Failed to load outfits';
      setError(errorMessage);
      Alert.alert('Error', 'Failed to load outfits. Please check your connection and try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
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

  // Pull to refresh handler
  const handleRefresh = (): void => {
    fetchOutfits(true);
  };

  // Retry function for error state
  const handleRetry = (): void => {
    fetchOutfits();
  };

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={styles.authContainer}>
          <Text style={styles.authTitle}>Authentication Required</Text>
          <Text style={styles.authText}>Please log in to view your outfits.</Text>
          <TouchableOpacity style={styles.authButton} onPress={() => router.replace('/auth/login')}>
            <Text style={styles.authButtonText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading outfits...</Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Empty state
  if (outfits.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No outfits found</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Outfits</Text>
      </View>
      <FlatList
        data={outfits}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <OutfitCard
            name={item.name}
            imageUrl={item.image_url}
            outfitId={item._id}
            items={item.items} // Pass the items array
          />
        )}
        numColumns={3}
        columnWrapperStyle={styles.row}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.listContainer}
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerContainer: {
    marginTop: 50,
    marginBottom: 10,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#B91C7C',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    marginBottom: 8,
  },
  listContainer: {
    padding: 10,
    marginTop: 70,
  },
  row: {
    justifyContent: 'space-around',
    paddingHorizontal: 5,
  },
  separator: {
    height: 15,
  },
  itemContainer: {
    flex: 1,
    margin: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  authTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  authText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  authButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  authButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
