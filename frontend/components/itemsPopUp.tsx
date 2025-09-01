import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  PanResponder,
  Animated,
  ScrollView,
} from 'react-native';
import { itemsAPI } from '@/services/api';
import { itemTypesAPI } from '@/services/itemTypesAPI';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';

interface Item {
  _id: string;
  name: string;
  image: string;
  color?: string;
  brand?: string;
  itemType?: {
    _id: string;
    name: string;
  } | string;
}

interface ItemType {
  _id: string;
  name: string;
  itemCount?: number;
}

interface ItemsPopUpProps {
  onItemDrag: (item: Item, gestureState: any) => void;
}

const ItemsPopUp: React.FC<ItemsPopUpProps> = ({ onItemDrag }) => {
  const { isAuthenticated, logout } = useAuth();
  const router = useRouter();
  
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [itemTypes, setItemTypes] = useState<ItemType[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState<string>('All');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      if (!isAuthenticated) {
        router.replace('/auth/login');
        return;
      }

      console.log('Fetching data for outfit creation...');

      // Fetch item types and user items in parallel
      const [itemTypesResponse, userItemsResponse] = await Promise.all([
        itemTypesAPI.getTypes(),
        itemsAPI.getItems()
      ]);

      const userItems: Item[] = userItemsResponse.success ? userItemsResponse.data : [];
      
      console.log('User items fetched:', userItems.length);

      // Calculate item counts for each type
      const typesWithCounts: ItemType[] = [];

      itemTypesResponse.forEach((itemType: any) => {
        const itemsForThisType = userItems.filter(item => {
          const itemTypeId = item.itemType && typeof item.itemType === 'object' 
            ? item.itemType._id 
            : item.itemType;
          return itemTypeId === itemType._id;
        });

        // Only include types that have items
        if (itemsForThisType.length > 0) {
          typesWithCounts.push({
            _id: itemType._id,
            name: itemType.name,
            itemCount: itemsForThisType.length,
          });
        }
      });

      // Set state with fetched data
      setAllItems(userItems);
      setFilteredItems(userItems); // Show all items initially
      setItemTypes(typesWithCounts);
      
      console.log('Data loading completed:', {
        totalItems: userItems.length,
        availableTypes: typesWithCounts.length
      });

    } catch (err: any) {
      console.error('Error fetching data:', err);
      
      if (err.response?.status === 401) {
        Alert.alert('Session Expired', 'Please log in again.', [
          { text: 'OK', onPress: () => {
            logout();
            router.replace('/auth/login');
          }}
        ]);
        return;
      }
      
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load items';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Filter items by type
  const handleTypeSelect = (typeId: string) => {
    console.log('Filtering items by type:', typeId);
    setSelectedTypeId(typeId);

    if (typeId === 'All') {
      setFilteredItems(allItems);
    } else {
      const filtered = allItems.filter(item => {
        const itemTypeId = item.itemType && typeof item.itemType === 'object' 
          ? item.itemType._id 
          : item.itemType;
        return itemTypeId === typeId;
      });
      setFilteredItems(filtered);
    }
    
    console.log(`Showing items for type: ${typeId}, count: ${typeId === 'All' ? allItems.length : filteredItems.length}`);
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  // Category Button Component
  const CategoryButton = ({ type, isSelected, onPress }: {
    type: string;
    isSelected: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      style={[
        styles.categoryButton,
        isSelected && styles.categoryButtonSelected
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[
        styles.categoryButtonText,
        isSelected && styles.categoryButtonTextSelected
      ]}>
        {type}
      </Text>
    </TouchableOpacity>
  );

  // Enhanced Draggable Item Component with better drag detection
  const DraggableItem = ({ item }: { item: Item }) => {
    const pan = useRef(new Animated.ValueXY()).current;
    const scale = useRef(new Animated.Value(1)).current;
    const isDragging = useRef(false);

    const panResponder = useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (evt, gestureState) => {
          // Start drag if moved more than 3 pixels (more sensitive)
          const shouldStart = Math.abs(gestureState.dx) > 3 || Math.abs(gestureState.dy) > 3;
          if (shouldStart && !isDragging.current) {
            isDragging.current = true;
            console.log('Starting drag for:', item.name);
          }
          return shouldStart;
        },
        onPanResponderGrant: (evt, gestureState) => {
          console.log('Pan responder granted for:', item.name);
          isDragging.current = true;
          
          // Scale up the item when drag starts
          Animated.spring(scale, {
            toValue: 1.3,
            tension: 100,
            friction: 8,
            useNativeDriver: false,
          }).start();
        },
        onPanResponderMove: Animated.event(
          [null, { dx: pan.x, dy: pan.y }],
          { 
            useNativeDriver: false,
            listener: (evt, gestureState) => {
              // Optional: Add visual feedback during drag
              if (Math.abs(gestureState.dy) > 50) {
                console.log('Dragging upward significantly:', gestureState.dy);
              }
            }
          }
        ),
        onPanResponderRelease: (evt, gestureState) => {
          console.log('Item drag released:', {
            item: item.name,
            dx: gestureState.dx,
            dy: gestureState.dy,
            absoluteX: evt.nativeEvent.pageX,
            absoluteY: evt.nativeEvent.pageY,
            wasDragging: isDragging.current
          });

          // Reset visual state
          Animated.spring(scale, {
            toValue: 1,
            tension: 100,
            friction: 8,
            useNativeDriver: false,
          }).start();
          
          pan.setValue({ x: 0, y: 0 });

          // Always call onItemDrag if there was any movement
          if (isDragging.current && (Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5)) {
            console.log('Calling onItemDrag for:', item.name);
            
            onItemDrag(item, {
              translationX: gestureState.dx,
              translationY: gestureState.dy,
              absoluteX: evt.nativeEvent.pageX,
              absoluteY: evt.nativeEvent.pageY,
              moveX: gestureState.moveX,
              moveY: gestureState.moveY,
            });
          }

          isDragging.current = false;
        },
        onPanResponderTerminate: () => {
          // Reset if gesture is terminated
          Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: false,
          }).start();
          pan.setValue({ x: 0, y: 0 });
          isDragging.current = false;
        },
      })
    ).current;

    return (
      <Animated.View
        style={[
          styles.item,
          {
            transform: [
              { translateX: pan.x },
              { translateY: pan.y },
              { scale },
            ],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <View style={styles.itemContent}>
          <Image source={{ uri: item.image }} style={styles.itemImage} />
          <Text style={styles.itemName} numberOfLines={2}>
            {item.name}
          </Text>
          {item.color && (
            <Text style={styles.itemDetail}>{item.color}</Text>
          )}
          {item.brand && (
            <Text style={styles.itemDetail}>{item.brand}</Text>
          )}
        </View>
      </Animated.View>
    );
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading your items...</Text>
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
          <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // No items state
  if (allItems.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No Items Available</Text>
          <Text style={styles.emptyText}>
            Add some items to your closet first to create outfits.
          </Text>
        </View>
      </View>
    );
  }

  // Main render
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Items</Text>
        <Text style={styles.headerSubtitle}>
          Drag items upward to canvas • {filteredItems.length} of {allItems.length} shown
        </Text>
      </View>

      {/* Category Filter Section */}
      {itemTypes.length > 0 && (
        <View style={styles.filterSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContentContainer}
          >
            {/* All button */}
            <CategoryButton
              type="All"
              isSelected={selectedTypeId === 'All'}
              onPress={() => handleTypeSelect('All')}
            />
            
            {/* Item type buttons */}
            {itemTypes.map((itemType) => (
              <CategoryButton
                key={itemType._id}
                type={itemType.name}
                isSelected={selectedTypeId === itemType._id}
                onPress={() => handleTypeSelect(itemType._id)}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Items Grid */}
      <View style={styles.itemsContainer}>
        {filteredItems.length > 0 ? (
          <FlatList
            data={filteredItems}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => <DraggableItem item={item} />}
            numColumns={3}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            bounces={false}
            removeClippedSubviews={false}
            scrollEnabled={true}
          />
        ) : (
          <View style={styles.emptyFilterContainer}>
            <Text style={styles.emptyFilterText}>
              No items in this category
            </Text>
            <TouchableOpacity 
              style={styles.showAllButton} 
              onPress={() => handleTypeSelect('All')}
            >
              <Text style={styles.showAllButtonText}>Show All Items</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  filterSection: {
    backgroundColor: '#f8f8f8',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  scrollContentContainer: {
    paddingHorizontal: 15,
    gap: 8,
    alignItems: 'center',
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    minWidth: 60,
    alignItems: 'center',
  },
  categoryButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  categoryButtonTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  itemsContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  listContainer: {
    padding: 15,
    flexGrow: 1,
  },
  row: {
    justifyContent: 'space-around',
    marginBottom: 5,
  },
  item: {
    alignItems: 'center',
    width: 100,
    marginBottom: 15,
    backgroundColor: 'transparent',
  },
  itemContent: {
    alignItems: 'center',
    width: '100%',
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  itemImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f0f0f0',
  },
  itemName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  itemDetail: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
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
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyFilterContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyFilterText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  showAllButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  showAllButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ItemsPopUp;