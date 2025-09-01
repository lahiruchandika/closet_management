import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, StatusBar, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import ItemCard from '@/components/itemCard';
import { itemsAPI } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

interface Item {
  _id: string;
  name: string;
  image: string;
  color?: string;
  dressCode?: string;
  brand?: string;
  material?: string;
  backgroundRemoved?: boolean;
  itemType?: {
    _id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

const ClosetType = () => {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { isAuthenticated, logout } = useAuth();
  const { typeId, typeName } = params;

  // State management
  const [items, setItems] = useState<Item[]>([]);
  const [filterVisible, setFilterVisible] = useState<boolean>(false);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null);
  const [selectedSort, setSelectedSort] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filter options
  const COLOR_OPTIONS = [
    'Red',
    'Blue',
    'Green',
    'Yellow',
    'Black',
    'White',
    'Gray',
    'Brown',
    'Pink',
    'Purple',
    'Orange',
    'Beige',
  ];

  const MATERIAL_OPTIONS = [
    'Cotton',
    'Linen',
    'Silk',
    'Wool',
    'Polyester',
    'Nylon',
    'Denim',
    'Leather',
    'Velvet',
    'Satin',
    'Chiffon',
    'Other',
  ];

  const SORT_OPTIONS: { key: string; label: string }[] = [
    { key: 'newest', label: 'New → Old' },
    { key: 'oldest', label: 'Old → New' },
    { key: 'name-asc', label: 'Name A → Z' },
    { key: 'name-desc', label: 'Name Z → A' },
  ];

  // Helper function to map color names to hex codes for display
  const mapColorNameToHex = (color: string): string => {
    const colorMap: { [key: string]: string } = {
      red: '#FF3B30',
      blue: '#007AFF',
      green: '#34C759',
      yellow: '#FFCC00',
      black: '#000000',
      white: '#FFFFFF',
      gray: '#8E8E93',
      brown: '#8B5A2B',
      pink: '#FF2D55',
      purple: '#5856D6',
      orange: '#FF9500',
      beige: '#F5F5DC',
    };
    return colorMap[color?.toLowerCase()] || '#CCCCCC';
  };

  // Navigation handler
  const handlePress = (itemId: string): void => {
    router.push(`/closet-single?id=${itemId}`);
  };

  // Fetch items from authenticated API - SINGLE API CALL
  const fetchItems = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      if (!isAuthenticated) {
        router.replace('/auth/login');
        return;
      }

      const apiTypeId = Array.isArray(typeId) ? typeId[0] : typeId;

      if (!apiTypeId) {
        setError('No category ID provided');
        return;
      }

      console.log(`Fetching items for type: ${typeName} (${apiTypeId})`);

      // Get ALL user items (single authenticated API call)
      const response = await itemsAPI.getItems();

      if (response.success) {
        // Filter items by the selected itemType
        const filteredItems = response.data.filter((item: Item) => {
          const itemTypeId = item.itemType && typeof item.itemType === 'object' ? item.itemType._id : item.itemType;
          return itemTypeId === apiTypeId;
        });

        console.log(`Found ${filteredItems.length} items for type ${typeName}`);
        setItems(filteredItems);
      } else {
        throw new Error(response.message || 'Failed to fetch items');
      }
    } catch (err: any) {
      console.error('Error fetching items:', err);

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

      const errorMessage = err.response?.data?.message || err.message || 'Failed to load items';
      setError(errorMessage);
      Alert.alert('Error', 'Failed to load items. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // EFFICIENT FILTERING LOGIC - No additional API calls
  const getFilteredAndSortedItems = (): Item[] => {
    let filteredItems = [...items];

    // Apply color filter
    if (selectedColor) {
      filteredItems = filteredItems.filter((item) => item.color?.toLowerCase() === selectedColor.toLowerCase());
    }

    // Apply material filter
    if (selectedMaterial) {
      filteredItems = filteredItems.filter((item) => item.material?.toLowerCase() === selectedMaterial.toLowerCase());
    }

    // Apply sorting
    if (selectedSort) {
      filteredItems.sort((a, b) => {
        switch (selectedSort) {
          case 'newest':
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          case 'oldest':
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          case 'name-asc':
            return a.name.localeCompare(b.name);
          case 'name-desc':
            return b.name.localeCompare(a.name);
          default:
            return 0;
        }
      });
    }

    return filteredItems;
  };

  // Load items when component mounts or typeId changes
  useEffect(() => {
    if (typeId && isAuthenticated) {
      fetchItems();
    } else if (!isAuthenticated) {
      router.replace('/auth/login');
    }
  }, [typeId, isAuthenticated]);

  // Get the items to display
  const displayedItems = getFilteredAndSortedItems();

  // Clear all filters
  const clearFilters = (): void => {
    setSelectedColor(null);
    setSelectedMaterial(null);
    setSelectedSort(null);
  };

  // Check authentication first
  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.authErrorText}>Please log in to view your items</Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.replace('/auth/login')}
          >
            <Text style={styles.loginButtonText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#EC4899" />
          <Text style={styles.loadingText}>Loading {typeName || 'items'}...</Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchItems}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Main render
  return (
    <View style={styles.container}>
      {/* Header with back button and filter clear*/}
      <View style={styles.headerContainer}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={16} color="#333" />
          </TouchableOpacity>

          {/* Active filters indicator */}
          {(selectedColor || selectedMaterial || selectedSort) && (
            <TouchableOpacity style={styles.clearAllButton} onPress={clearFilters}>
              <Text style={styles.clearAllText}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>

        <View>
          <Text style={styles.headerTitle}>{typeName || 'Category'}</Text>
          <Text style={styles.headerSubtitle}>
            {displayedItems.length} {displayedItems.length === 1 ? 'item' : 'items'} in your collection
          </Text>
        </View>

        {/* Filter and Sort bar */}
        <View style={styles.filterSortBar}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setFilterVisible(!filterVisible)}
          >
            <Ionicons name="filter" size={16} color="white" style={{ marginRight: 6 }} />
            <Text style={styles.filterButtonText}>Filter & Sort</Text>
          </TouchableOpacity>

          <View style={styles.sortIndicator}>
            <Text style={styles.sortLabel}>Sort by:</Text>
            <Text style={styles.sortValue}>
              {selectedSort ? SORT_OPTIONS.find((opt) => opt.key === selectedSort)?.label : 'Recently Added'}
            </Text>
          </View>
        </View>
      </View>

      {/* Filter panel */}
      {filterVisible && (
        <View style={styles.filterPanel}>
          {/* Color filter */}
          <Text style={styles.filterSectionTitle}>Color</Text>
          <View style={styles.colorFilterRow}>
            {COLOR_OPTIONS.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorOption,
                  { backgroundColor: mapColorNameToHex(color) },
                  selectedColor === color ? styles.selectedColorOption : styles.unselectedColorOption
                ]}
                onPress={() => setSelectedColor(selectedColor === color ? null : color)}
              />
            ))}
          </View>

          {/* Material filter */}
          <Text style={[styles.filterSectionTitle, styles.materialTitle]}>Material</Text>
          <View style={styles.materialFilterRow}>
            {MATERIAL_OPTIONS.map((material) => (
              <TouchableOpacity
                key={material}
                style={[
                  styles.materialOption,
                  selectedMaterial === material ? styles.selectedMaterialOption : styles.unselectedMaterialOption
                ]}
                onPress={() => setSelectedMaterial(selectedMaterial === material ? null : material)}
              >
                <Text style={[
                  styles.materialOptionText,
                  selectedMaterial === material ? styles.selectedMaterialText : styles.unselectedMaterialText
                ]}>
                  {material}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Sort options */}
          <Text style={[styles.filterSectionTitle, styles.sortTitle]}>Sort</Text>
          <View style={styles.sortFilterRow}>
            {SORT_OPTIONS.map((sortOption) => (
              <TouchableOpacity
                key={sortOption.key}
                style={[
                  styles.sortOption,
                  selectedSort === sortOption.key ? styles.selectedSortOption : styles.unselectedSortOption
                ]}
                onPress={() => setSelectedSort(selectedSort === sortOption.key ? null : sortOption.key)}
              >
                <Text style={[
                  styles.sortOptionText,
                  selectedSort === sortOption.key ? styles.selectedSortText : styles.unselectedSortText
                ]}>
                  {sortOption.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Filter actions */}
          <View style={styles.filterActions}>
            <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
              <Text style={styles.clearFiltersText}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.doneButton} onPress={() => setFilterVisible(false)}>
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Items list */}
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {displayedItems.length > 0 ? (
          <View style={styles.itemsGrid}>
            {displayedItems.map((item: Item) => (
              <TouchableOpacity key={item._id} style={styles.itemContainer} onPress={() => handlePress(item._id)}>
                <ItemCard
                  color={item.color}
                  category={item.dressCode}
                  name={item.name}
                  imageUrl={{ uri: item.image }}
                  itemId={item._id}
                />
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateText}>
              {selectedColor || selectedMaterial || selectedSort
                ? 'No items match your filters'
                : `No ${typeName?.toString().toLowerCase()} items in your closet yet`}
            </Text>
            {(selectedColor || selectedMaterial || selectedSort) && (
              <TouchableOpacity style={styles.clearFiltersEmptyButton} onPress={clearFilters}>
                <Text style={styles.clearFiltersEmptyText}>Clear Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  // Main Container
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },

  // Center Container for loading/error states
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  // Authentication Error
  authErrorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: '#ec4899',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  loginButtonText: {
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
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#ec4899',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Header Container
  headerContainer: {
    flexDirection: 'column',
    gap: 12,
    backgroundColor: '#fdf2f8', // Light rose/pink background
    paddingVertical: 12,
    paddingHorizontal: 16,
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

  // Header Top Row
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  clearAllButton: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
  },
  clearAllText: {
    color: '#9f1239',
    fontWeight: '600',
    fontSize: 12,
  },

  // Header Title
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },

  // Filter and Sort Bar
  filterSortBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  filterButton: {
    backgroundColor: '#ec4899',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  sortIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginRight: 8,
  },
  sortValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },

  // Filter Panel
  filterPanel: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },

  // Filter Section Titles
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  materialTitle: {
    marginTop: 16,
  },
  sortTitle: {
    marginTop: 16,
  },

  // Color Filter
  colorFilterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  colorOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
    marginBottom: 8,
    borderWidth: 2,
  },
  selectedColorOption: {
    borderColor: '#ec4899',
    borderWidth: 3,
  },
  unselectedColorOption: {
    borderColor: '#d1d5db',
  },

  // Material Filter
  materialFilterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  materialOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedMaterialOption: {
    backgroundColor: '#ec4899',
  },
  unselectedMaterialOption: {
    backgroundColor: '#f3f4f6',
  },
  materialOptionText: {
    fontSize: 14,
  },
  selectedMaterialText: {
    color: '#ffffff',
  },
  unselectedMaterialText: {
    color: '#1f2937',
  },

  // Sort Filter
  sortFilterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  sortOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedSortOption: {
    backgroundColor: '#ec4899',
  },
  unselectedSortOption: {
    backgroundColor: '#f3f4f6',
  },
  sortOptionText: {
    fontSize: 14,
  },
  selectedSortText: {
    color: '#ffffff',
  },
  unselectedSortText: {
    color: '#1f2937',
  },

  // Filter Actions
  filterActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  clearFiltersButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
  },
  clearFiltersText: {
    color: '#ec4899',
    fontWeight: '600',
  },
  doneButton: {
    backgroundColor: '#ec4899',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  doneButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },

  // Scroll Container
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },

  // Items Grid
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  itemContainer: {
    width: '45%',
    marginBottom: 20,
  },

  // Empty State
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  clearFiltersEmptyButton: {
    backgroundColor: '#ec4899',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  clearFiltersEmptyText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ClosetType;