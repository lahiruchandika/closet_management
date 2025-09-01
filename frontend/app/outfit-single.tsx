import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { apiUtils, outfitsAPI } from '@/services/api';

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

interface IOutfit {
  _id: string;
  name: string;
  occasion: string;
  createdDate?: string;
  plannedDate?: string;
  user: string;
  items: IOutfitItem[];
  createdAt?: string;
  updatedAt?: string;
}

const OutfitSingle = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [outfit, setOutfit] = useState<IOutfit | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  console.log('OutfitSingle id:', id);

  const fetchOutfit = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      // Check if user is authenticated
      const isAuth = await apiUtils.isAuthenticated();
      if (!isAuth) {
        setError('Please log in to view this outfit');
        // router.push('/login');
        return;
      }

      const fetchedOutfit = await outfitsAPI.getOutfit(id as string);
      setOutfit(fetchedOutfit);
    } catch (err: any) {
      console.error('Error fetching outfit:', err);

      // Handle authentication errors
      if (apiUtils.handleAuthError(err)) {
        setError('Session expired. Please log in again.');
        // router.push('/login');
        return;
      }

      if (err.response?.status === 404) {
        setError("Outfit not found or you don't have permission to view it.");
      } else {
        setError('Failed to load outfit. Please try again.');
      }

      Alert.alert('Error', 'Failed to load outfit. Please check your connection and try again.', [{ text: 'OK' }]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchOutfit();
    }
  }, [id]);

  const handleRetry = (): void => {
    fetchOutfit();
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Function to normalize coordinates for the larger outfit view
  const normalizePosition = (x: number, y: number, itemWidth: number, itemHeight: number) => {
    // Assuming the original canvas was around 500x600 pixels
    const originalCanvasWidth = 500;
    const originalCanvasHeight = 600;

    // Calculate normalized position as ratios (0 to 1)
    const normalizedX = Math.max(0, Math.min(x / originalCanvasWidth, 1));
    const normalizedY = Math.max(0, Math.min(y / originalCanvasHeight, 1));
    const normalizedWidth = Math.min(itemWidth / originalCanvasWidth, 0.8); // Cap at 80% of container
    const normalizedHeight = Math.min(itemHeight / originalCanvasHeight, 0.8); // Cap at 80% of container

    return {
      normalizedX,
      normalizedY,
      normalizedWidth,
      normalizedHeight,
    };
  };

  const renderOutfitItems = () => {
    if (!outfit?.items || outfit.items.length === 0) {
      return (
        <View style={styles.emptyOutfit}>
          <Text style={styles.emptyText}>No items in this outfit</Text>
        </View>
      );
    }

    // Sort items by zIndex to ensure proper layering
    const sortedItems = [...outfit.items].sort((a, b) => a.zIndex - b.zIndex);

    return sortedItems.map((outfitItem, index) => {
      const position = normalizePosition(outfitItem.x, outfitItem.y, outfitItem.width, outfitItem.height);

      return (
        <View
          key={`${outfitItem._id}-${index}`}
          style={[
            styles.itemWrapper,
            {
              left: `${position.normalizedX * 100}%`,
              top: `${position.normalizedY * 100}%`,
              width: `${position.normalizedWidth * 100}%`,
              height: `${position.normalizedHeight * 100}%`,
              transform: [{ rotate: `${outfitItem.rotation}deg` }],
              zIndex: outfitItem.zIndex,
            },
          ]}
        >
          <Image source={{ uri: outfitItem.item.image }} style={styles.itemImage} resizeMode="contain" />
        </View>
      );
    });
  };

  const renderItemsList = () => {
    if (!outfit?.items || outfit.items.length === 0) {
      return null;
    }

    return (
      <View style={styles.itemsListContainer}>
        <Text style={styles.itemsListTitle}>Items in this outfit:</Text>
        {outfit.items.map((outfitItem, index) => (
          <View key={`${outfitItem._id}-list-${index}`} style={styles.itemListRow}>
            <Image source={{ uri: outfitItem.item.image }} style={styles.itemListImage} />
            <View style={styles.itemListDetails}>
              <Text style={styles.itemListName}>{outfitItem.item.name}</Text>
              <Text style={styles.itemListBrand}>{outfitItem.item.brand}</Text>
              <Text style={styles.itemListColor}>
                {outfitItem.item.color} • {outfitItem.item.material}
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading outfit...</Text>
        </View>
      </View>
    );
  }

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

  if (!outfit) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Outfit not found!</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Back button at the top */}
      <View style={styles.headerRowWithBack}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={32} color="#222" />
        </TouchableOpacity>
      </View>
      <Text style={styles.name}>{outfit.name}</Text>
      {/* Outfit Visualization */}
      <View style={styles.outfitContainer}>{renderOutfitItems()}</View>

      {/* Outfit Details */}
      <View style={styles.detailsContainer}>
        <View style={styles.row}>
          <Text style={styles.label}>Occasion</Text>
          <Text style={styles.value}>{outfit.occasion ?? 'N/A'}</Text>
        </View>
        {outfit.plannedDate && (
          <View style={styles.row}>
            <Text style={styles.label}>Planned Date</Text>
            <Text style={styles.value}>{formatDate(outfit.plannedDate)}</Text>
          </View>
        )}
      </View>

      {/* Items List */}
      {renderItemsList()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  headerRowWithBack: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 8,
  },
  backButton: {
    marginRight: 12,
    padding: 0,
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    height: 40,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  outfitContainer: {
    width: '100%',
    height: 400,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    marginBottom: 20,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  itemWrapper: {
    position: 'absolute',
  },
  itemImage: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
  },
  emptyOutfit: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    fontStyle: 'italic',
  },
  detailsContainer: {
    width: '100%',
    marginBottom: 20,
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  value: {
    fontSize: 16,
    color: '#666',
    flex: 2,
    textAlign: 'right',
  },
  itemsListContainer: {
    marginBottom: 20,
  },
  itemsListTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  itemListRow: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  itemListImage: {
    width: 60,
    height: 60,
    borderRadius: 6,
    marginRight: 12,
  },
  itemListDetails: {
    flex: 1,
  },
  itemListName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  itemListBrand: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 2,
  },
  itemListColor: {
    fontSize: 12,
    color: '#666',
  },
  errorText: {
    fontSize: 18,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 20,
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
});

export default OutfitSingle;
