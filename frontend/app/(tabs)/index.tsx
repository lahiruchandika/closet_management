import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, ActivityIndicator, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import OutfitTypeCard from '../../components/ItemTypesCard';
import { itemsAPI } from '../../services/api';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { itemTypesAPI } from '@/services/itemTypesAPI';
import { AddItemModal } from '@/components/AddItemModal';

interface ClosetCategory {
  id: string;
  type: string;
  items_available: number;
  imageUrl?: string;
}

interface Item {
  _id: string;
  name: string;
  image: string;
  itemType?:
    | {
        _id: string;
        name: string;
      }
    | string;
}

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, token, logout } = useAuth();
  const [categories, setCategories] = useState<ClosetCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalVisible, setIsAddModalVisible] = useState<boolean>(false);
  const [totalItems, setTotalItems] = useState<number>(0);

  const fetchCategoriesWithItems = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      if (!isAuthenticated) {
        Alert.alert('Authentication Required', 'Please log in to view your items.', [
          { text: 'OK', onPress: () => router.replace('/auth/login') },
        ]);
        return;
      }

      console.log('Fetching categories with authentication...');

      // Fetch item types (single API call - global data)
      const itemTypesResponse = await itemTypesAPI.getTypes();
      console.log('Item types fetched:', itemTypesResponse.length);

      // Fetch ALL user items (single API call - user-specific data)
      const userItemsResponse = await itemsAPI.getItems();
      const userItems: Item[] = userItemsResponse.success ? userItemsResponse.data : [];

      console.log('User items fetched:', userItems.length);
      setTotalItems(userItems.length); // Set total items count

      console.log(
        'Sample items with types:',
        userItems.slice(0, 3).map((item) => ({
          name: item.name,
          itemType: item.itemType,
        })),
      );

      // Group user items by itemType to create categories
      const categoriesWithItems: ClosetCategory[] = [];

      itemTypesResponse.forEach((itemType: any) => {
        console.log(`Processing item type: ${itemType.name} (ID: ${itemType._id})`);

        // Filter user's items that belong to this item type
        const itemsForThisType = userItems.filter((item) => {
          // Handle both populated and non-populated itemType references
          const itemTypeId = item.itemType && typeof item.itemType === 'object' ? item.itemType._id : item.itemType;

          const matches = itemTypeId === itemType._id;
          if (matches) {
            console.log(`Item "${item.name}" matches type "${itemType.name}"`);
          }
          return matches;
        });

        console.log(`Found ${itemsForThisType.length} items for type "${itemType.name}"`);

        // Only include categories that have items
        if (itemsForThisType.length > 0) {
          categoriesWithItems.push({
            id: itemType._id,
            type: itemType.name,
            items_available: itemsForThisType.length,
            imageUrl: itemsForThisType[0]?.image || undefined,
          });
        }
      });

      // Sort categories by item count (most items first)
      const sortedCategories = categoriesWithItems.sort((a, b) => b.items_available - a.items_available);

      console.log('Final categories with items:', sortedCategories);
      setCategories(sortedCategories);
    } catch (err: any) {
      console.error('Error fetching categories:', err);

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

      const errorMessage = err.response?.data?.message || err.message || 'Failed to load categories';
      setError(errorMessage);
      Alert.alert('Error', 'Failed to load categories. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        fetchCategoriesWithItems();
      } else {
        setLoading(false);
        router.replace('/auth/login');
      }
    }, [isAuthenticated]),
  );

  const handleRetry = (): void => {
    fetchCategoriesWithItems();
  };

  const handleRefresh = (): void => {
    fetchCategoriesWithItems();
  };

  const handleAddItem = () => {
    if (!isAuthenticated) {
      Alert.alert('Authentication Required', 'Please log in to add items.');
      return;
    }
    setIsAddModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsAddModalVisible(false);
  };

  const handleItemAdded = () => {
    setIsAddModalVisible(false);
    fetchCategoriesWithItems(); // Refresh the list after adding item
  };

  const handleCategoryPress = (categoryId: string, categoryName: string) => {
    if (!categoryId) {
      Alert.alert('Error', 'Unable to navigate to this category.');
      return;
    }

    console.log(`Navigating to category: ${categoryName} (${categoryId})`);

    // Navigate with both ID and name for better UX
    router.push(`/closet-type?typeId=${categoryId}&typeName=${encodeURIComponent(categoryName)}`);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning!';
    if (hour < 17) return 'Good afternoon!';
    return 'Good evening!';
  };

  // Header component
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Top header with title and icons */}
      <View style={styles.topHeader}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>My Closet</Text>
          <Text style={styles.headerSubtitle}>Create stunning outfits</Text>
        </View>
      </View>

      <View style={styles.headerBody}>
        {/* Greeting section */}
        <View style={styles.greetingSection}>
          <View style={styles.greetingContent}>
            <Text style={styles.greetingText}>{getGreeting()} ✨</Text>
            <Text style={styles.greetingSubtext}>Ready to create amazing outfits?</Text>
          </View>
        </View>

        {/* Stats section */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalItems}</Text>
            <Text style={styles.statLabel}>TOTAL ITEMS</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={[styles.statValue, styles.outfitsValue]}>12</Text>
            <Text style={styles.statLabel}>OUTFITS</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={[styles.statValue, styles.weekValue]}>5</Text>
            <Text style={styles.statLabel}>THIS WEEK</Text>
          </View>
        </View>
      </View>
    </View>
  );

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContainer}>
          <Ionicons name="lock-closed-outline" size={64} color="#666" />
          <Text style={styles.authTitle}>Authentication Required</Text>
          <Text style={styles.authSubtitle}>Please log in to view your closet items.</Text>
          <TouchableOpacity style={styles.authButton} onPress={() => router.replace('/auth/login')}>
            <Text style={styles.authButtonText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading your closet...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#FF3B30" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      {renderHeader()}
      
      <View style={styles.contentContainer}>
        <Text style={styles.categoriesTitle}>Categories</Text>

        <FlatList
          data={categories}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <OutfitTypeCard
              category={item.type}
              itemCount={item.items_available}
              imageUrl={item.imageUrl}
              onPress={() => handleCategoryPress(item.id, item.type)}
            />
          )}
          refreshing={loading}
          onRefresh={handleRefresh}
          showsVerticalScrollIndicator={false}
          style={styles.flatList}
        />
      </View>

      <TouchableOpacity
        style={styles.addButton}
        onPress={handleAddItem}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      <AddItemModal visible={isAddModalVisible} onClose={handleCloseModal} onItemAdded={handleItemAdded} />
    </View>
  );
}

const styles = StyleSheet.create({
  // Main Containers
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#F6F7F9',
    position: 'relative',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  // Header Styles
  headerContainer: {
    paddingBottom: 20,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    height: 160,
    backgroundColor: '#fdf2f8', // Light rose/pink gradient approximation
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  headerContent: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#B91C7C',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },

  // Header Body
  headerBody: {
    paddingHorizontal: 16,
  },

  // Greeting Section
  greetingSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FCFDFD',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  greetingContent: {
    flex: 1,
  },
  greetingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  greetingSubtext: {
    fontSize: 14,
    color: '#6b7280',
  },

  // Stats Section
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#FCFCFD',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  outfitsValue: {
    color: '#E91E63',
  },
  weekValue: {
    color: '#9C27B0',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
    letterSpacing: 0.5,
  },

  // Authentication States
  authTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 20,
    marginBottom: 10,
  },
  authSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  authButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  authButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Loading State
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6b7280',
  },

  // Error State
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginVertical: 16,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Content Container
  contentContainer: {
    flex: 1,
    flexDirection: 'column',
    gap: 16,
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  categoriesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },

  // FlatList
  flatList: {
    flex: 1,
  },

  // Add Button (FAB)
  addButton: {
    position: 'absolute',
    bottom: 130, // Increased from 16 to ensure visibility
    right: 20,  // Increased from 16 for better visibility
    width: 56,
    height: 56,
    backgroundColor: '#ec4899', // Pink gradient approximation
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 1000,
  },
});