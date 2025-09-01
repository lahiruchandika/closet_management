import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Modal,
  Image,
  Dimensions,
  Text,
  Animated,
  PanResponder,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import ItemsPopUp from '@/components/itemsPopUp';
import WeatherWidget from '@/components/WeatherWidget';
import { apiUtils, outfitsAPI } from '@/services/api';

interface DroppedItem {
  id: string;
  itemId: string;
  image: string;
  name: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation?: number;
  zIndex?: number;
}

export default function Canvas() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [outfitName, setOutfitName] = useState('');
  const [outfitOccasion, setOutfitOccasion] = useState('');
  const [plannedDate, setPlannedDate] = useState('');
  const [droppedItems, setDroppedItems] = useState<DroppedItem[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [cameFromCalendar, setCameFromCalendar] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  // Check authentication on component mount
  useEffect(() => {
    checkAuthentication();
  }, []);

  // Handle navigation and parameter processing
  useFocusEffect(
    useCallback(() => {
      console.log('Canvas focused with params:', params);

      // Always reset modal states when screen comes into focus
      setModalVisible(false);
      setSaveModalVisible(false);
      setSaving(false);

      // Check if there's a planned date parameter (coming from calendar)
      const incomingPlannedDate = params.plannedDate;
      const hasPlannedDateParam = incomingPlannedDate && typeof incomingPlannedDate === 'string';

      if (hasPlannedDateParam) {
        // Always set the planned date from params
        setPlannedDate(incomingPlannedDate as string);
        setSelectedDate(new Date(incomingPlannedDate as string));
        setCameFromCalendar(true);

        // Auto-open items popup if specified
        if (params.autoOpenItems === 'true') {
          setTimeout(() => {
            setModalVisible(true);
          }, 300);
        }

        // Clear the URL parameters after processing to prevent re-triggering
        setTimeout(() => {
          router.replace('/canvas');
        }, 100);
      } else if (hasInitialized && !hasPlannedDateParam && !cameFromCalendar) {
        // User navigated to canvas directly - reset everything
        setPlannedDate('');
        setDroppedItems([]);
        setOutfitName('');
        setOutfitOccasion('');
        setSelectedDate(new Date());
      }

      if (!hasInitialized) {
        setHasInitialized(true);
      }
    }, [params.plannedDate, params.autoOpenItems, hasInitialized, cameFromCalendar]),
  );

  const checkAuthentication = async () => {
    try {
      setAuthLoading(true);
      const authStatus = await apiUtils.isAuthenticated();
      const token = await apiUtils.getToken();

      console.log('Canvas Auth Check:', {
        authStatus,
        tokenExists: !!token,
      });

      setIsAuthenticated(authStatus && !!token);
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthenticated(false);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleItemDrag = (item: any, gestureState: any) => {
    console.log('handleItemDrag called with:', {
      itemName: item.name,
      gestureState,
    });

    if (!isAuthenticated) {
      Alert.alert('Authentication Required', 'Please log in to create outfits.');
      return;
    }

    // Get screen dimensions
    const modalHeight = screenHeight * 0.5;
    const canvasArea = screenHeight - modalHeight;

    // More lenient drag detection - check multiple conditions
    const wasDraggedUp = gestureState.translationY < -30; // Dragged up by 30px
    const isInCanvasArea = gestureState.absoluteY < canvasArea + 100; // More generous area
    const wasSignificantDrag = Math.abs(gestureState.translationX) > 20 || Math.abs(gestureState.translationY) > 20;

    console.log('Drag analysis:', {
      modalHeight,
      canvasArea,
      absoluteY: gestureState.absoluteY,
      translationY: gestureState.translationY,
      wasDraggedUp,
      isInCanvasArea,
      wasSignificantDrag,
      shouldAddToCanvas: (wasDraggedUp || isInCanvasArea) && wasSignificantDrag,
    });

    // Add item if it was dragged significantly upward OR into canvas area
    if ((wasDraggedUp || isInCanvasArea) && wasSignificantDrag) {
      const actualItemId = item._id || item.id || item.itemId;

      if (!actualItemId) {
        Alert.alert('Error', 'Invalid item - missing database ID.');
        return;
      }

      const itemIdString = String(actualItemId);

      if (itemIdString === 'undefined' || itemIdString.includes('undefined')) {
        Alert.alert('Error', 'Item ID is invalid.');
        return;
      }

      // Calculate position - prefer gesture position, fallback to center
      let dropX = gestureState.absoluteX || screenWidth / 2;
      let dropY = gestureState.absoluteY || canvasArea / 2;

      // INCREASED ITEM SIZE - now 120x120 instead of 60x60
      const itemSize = 120;
      
      // Ensure item stays within canvas bounds with new size
      dropX = Math.max(10, Math.min(dropX - itemSize/2, screenWidth - itemSize - 10));
      dropY = Math.max(10, Math.min(dropY - itemSize/2, canvasArea - itemSize - 10));

      const newItem: DroppedItem = {
        id: itemIdString + '_dropped_' + Date.now(),
        itemId: itemIdString,
        image: item.image || item.image_url,
        name: item.name,
        x: dropX,
        y: dropY,
        width: itemSize,
        height: itemSize,
        rotation: 0,
        zIndex: Date.now(),
      };

      setDroppedItems((prev) => [...prev, newItem]);
      console.log('Item successfully added to canvas:', item.name, 'at position:', { x: dropX, y: dropY });
    } else {
      console.log('Item drag did not meet criteria for adding to canvas');
    }
  };

  const removeItem = (id: string) => {
    setDroppedItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateItemPosition = (id: string, newX: number, newY: number) => {
    setDroppedItems((prev) => prev.map((item) => (item.id === id ? { ...item, x: newX, y: newY } : item)));
  };

  const handleDone = async () => {
    await checkAuthentication();

    if (!isAuthenticated) {
      Alert.alert('Authentication Required', 'Please log in to save outfits.');
      return;
    }

    if (droppedItems.length === 0) {
      Alert.alert('No Items', 'Please add some items to your outfit before saving.');
      return;
    }

    setSaveModalVisible(true);
  };

  const handleSave = async () => {
    if (!outfitName.trim()) {
      Alert.alert('Missing Name', 'Please enter a name for your outfit.');
      return;
    }

    const finalOccasion = outfitOccasion.trim() || 'General';

    // Validate items
    const invalidItems = droppedItems.filter((d) => {
      return (
        !d.itemId ||
        d.itemId.includes('undefined') ||
        d.itemId === 'undefined' ||
        typeof d.itemId !== 'string' ||
        d.itemId.trim() === ''
      );
    });

    if (invalidItems.length > 0) {
      Alert.alert('Error', `${invalidItems.length} item(s) have invalid IDs. Please remove and re-add them.`);
      return;
    }

    setSaving(true);

    try {
      const payload = {
        name: outfitName.trim(),
        occasion: finalOccasion,
        plannedDate: plannedDate ? plannedDate : undefined,
        items: droppedItems.map((d) => ({
          item: d.itemId,
          x: d.x,
          y: d.y,
          width: d.width || 120,
          height: d.height || 120,
          rotation: d.rotation || 0,
          zIndex: d.zIndex || 1,
        })),
      };

      const result = await outfitsAPI.createOutfit(payload);

      // Reset form and canvas
      setOutfitName('');
      setOutfitOccasion('');
      setPlannedDate('');
      setDroppedItems([]);
      setCameFromCalendar(false);
      setSaveModalVisible(false);

      Alert.alert('Success', 'Outfit saved successfully!');
    } catch (error: any) {
      console.error('Save error:', error);

      if (apiUtils.handleAuthError(error)) {
        setIsAuthenticated(false);
        Alert.alert('Session Expired', 'Your session has expired. Please log in again.');
        return;
      }

      let errorMessage = 'Could not save outfit. Please try again.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert('Error', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelSave = () => {
    setOutfitName('');
    setOutfitOccasion('');
    setSaveModalVisible(false);
  };

  const handleImmediateClear = () => {
    setDroppedItems([]);
    setOutfitName('');
    setOutfitOccasion('');
    setPlannedDate('');
    setCameFromCalendar(false);
  };

  // Fixed date picker handlers
  const handleDatePickerOpen = () => {
    try {
      if (plannedDate) {
        setSelectedDate(new Date(plannedDate));
      } else {
        setSelectedDate(new Date());
      }
      setDatePickerVisible(true);
    } catch (error) {
      console.error('Error opening date picker:', error);
      setSelectedDate(new Date());
      setDatePickerVisible(true);
    }
  };

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setDatePickerVisible(false);
    }
    
    if (date) {
      setSelectedDate(date);
      const formattedDate = date.toISOString().split('T')[0];
      setPlannedDate(formattedDate);
    }
  };

  const handleDateConfirm = () => {
    if (Platform.OS === 'ios') {
      setDatePickerVisible(false);
    }
  };

  // Draggable dropped item component
  const DraggableDroppedItem = ({ item }: { item: DroppedItem }) => {
    const pan = useRef(new Animated.ValueXY({ x: item.x, y: item.y })).current;
    const scale = useRef(new Animated.Value(1)).current;

    const panResponder = useRef(
      PanResponder.create({
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          pan.setOffset({ x: item.x, y: item.y });
          pan.setValue({ x: 0, y: 0 });
          Animated.spring(scale, { toValue: 1.1, useNativeDriver: false }).start();
        },
        onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
        onPanResponderRelease: (evt, gestureState) => {
          const canvasHeight = screenHeight * 0.5;
          const finalX = Math.max(10, Math.min(item.x + gestureState.dx, screenWidth - 130));
          const finalY = Math.max(10, Math.min(item.y + gestureState.dy, canvasHeight - 130));

          updateItemPosition(item.id, finalX, finalY);

          pan.flattenOffset();
          pan.setValue({ x: finalX, y: finalY });

          Animated.spring(scale, { toValue: 1, useNativeDriver: false }).start();
        },
      }),
    ).current;

    return (
      <Animated.View
        style={[
          styles.droppedItem,
          {
            left: item.x,
            top: item.y,
            transform: [{ scale }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity style={styles.itemTouchable}>
          <Image source={{ uri: item.image }} style={styles.droppedItemImage} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.removeButton} onPress={() => removeItem(item.id)}>
          <Ionicons name="close" size={12} color="white" />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Checking authentication...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.authContainer}>
        <View style={styles.authContent}>
          <Ionicons name="lock-closed" size={48} color="#6c757d" />
          <Text style={styles.authTitle}>Authentication Required</Text>
          <Text style={styles.authMessage}>Please log in to create and save outfits.</Text>
          <TouchableOpacity style={styles.retryButton} onPress={checkAuthentication}>
            <Text style={styles.retryButtonText}>Check Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        {/* Weather widget */}
        <View style={styles.weatherWrap} pointerEvents="box-none">
          <WeatherWidget />
        </View>

        {/* Clear canvas button */}
        {(droppedItems.length > 0 || (plannedDate && plannedDate.trim() !== '')) && (
          <View style={styles.clearButtonsContainer}>
            <TouchableOpacity style={styles.immediateClearButton} onPress={handleImmediateClear}>
              <Ionicons name="trash" size={20} color="white" />
            </TouchableOpacity>
          </View>
        )}

        {/* Canvas area with dropped items */}
        <View style={styles.canvasArea}>
          {droppedItems.length === 0 && (
            <View style={styles.dropZoneHint}>
              <Text style={styles.dropZoneText}>
                {plannedDate
                  ? `Planning outfit for ${plannedDate}\nDrag items here from the popup below`
                  : 'Drag items here from the popup below'}
              </Text>
            </View>
          )}
          {droppedItems.map((item) => (
            <DraggableDroppedItem key={item.id} item={item} />
          ))}
        </View>

        {/* Add button */}
        <TouchableOpacity style={styles.add} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>

        {/* Done button */}
        {droppedItems.length > 0 && (
          <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
            <Ionicons name="checkmark" size={24} color="white" />
          </TouchableOpacity>
        )}

        {/* Items Modal - FIXED LAYOUT */}
        <Modal 
          animationType="slide" 
          transparent 
          visible={modalVisible} 
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <TouchableOpacity 
                style={styles.closeButton} 
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="black" />
              </TouchableOpacity>
              
              <ItemsPopUp onItemDrag={handleItemDrag} />
            </View>
          </View>
        </Modal>

        {/* Save Modal with Fixed Date Picker */}
        <Modal animationType="fade" transparent visible={saveModalVisible} onRequestClose={handleCancelSave}>
          <View style={styles.saveModalOverlay}>
            <View style={styles.saveModalContent}>
              <Text style={styles.saveModalTitle}>Save Outfit</Text>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Name *</Text>
                <TextInput
                  style={styles.textInput}
                  value={outfitName}
                  onChangeText={setOutfitName}
                  placeholder="Enter outfit name"
                  placeholderTextColor="#999"
                  editable={!saving}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Occasion *</Text>
                <TextInput
                  style={styles.textInput}
                  value={outfitOccasion}
                  onChangeText={setOutfitOccasion}
                  placeholder="e.g., Work, Party, Casual"
                  placeholderTextColor="#999"
                  editable={!saving}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Planned Date (Optional)</Text>
                <View style={styles.datePickerRow}>
                  <TouchableOpacity
                    style={[styles.textInput, { flex: 1, justifyContent: 'center' }]}
                    onPress={handleDatePickerOpen}
                    disabled={saving}
                  >
                    <Text style={{ color: plannedDate ? '#000' : '#999' }}>
                      {plannedDate || 'YYYY-MM-DD'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleDatePickerOpen}
                    disabled={saving}
                  >
                    <Ionicons name="calendar" size={24} color="#007AFF" style={styles.calendarIcon} />
                  </TouchableOpacity>
                </View>

                {/* Fixed Date Picker */}
                {datePickerVisible && (
                  <View style={styles.datePickerContainer}>
                    <DateTimePicker
                      value={selectedDate}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={handleDateChange}
                      minimumDate={new Date()}
                    />
                    {Platform.OS === 'ios' && (
                      <TouchableOpacity style={styles.dateConfirmButton} onPress={handleDateConfirm}>
                        <Text style={styles.dateConfirmText}>Confirm</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>

              <View style={styles.saveModalButtons}>
                <TouchableOpacity
                  style={[styles.cancelButton, saving && styles.disabledButton]}
                  onPress={handleCancelSave}
                  disabled={saving}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.saveButton, saving && styles.disabledButton]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={styles.saveButtonText}>SAVE</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  canvasArea: {
    flex: 1,
    width: '100%',
    backgroundColor: '#fff',
    position: 'relative',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6c757d',
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  authContent: {
    alignItems: 'center',
    padding: 40,
  },
  authTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#495057',
    marginTop: 16,
    marginBottom: 8,
  },
  authMessage: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  dropZoneHint: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -100 }, { translateY: -50 }],
    alignItems: 'center',
    justifyContent: 'center',
    width: 200,
  },
  dropZoneText: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    lineHeight: 22,
  },
  droppedItem: {
    position: 'absolute',
    width: 120,
    height: 120,
    backgroundColor: 'white',
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  itemTouchable: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  droppedItemImage: {
    width: 112,
    height: 112,
    borderRadius: 8,
  },
  removeButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
    zIndex: 1,
  },
  add: {
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
  doneButton: {
    position: 'absolute',
    bottom: 130,
    left: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#80AE85',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  clearButtonsContainer: {
    position: 'absolute',
    top: 60,
    right: 15,
    zIndex: 15,
  },
  immediateClearButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF3030',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  weatherWrap: {
    position: 'absolute',
    top: 60,
    left: 12,
    zIndex: 20,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '100%',
    height: '50%',
    backgroundColor: 'white',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 1000,
    backgroundColor: 'white',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  saveModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveModalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    width: '85%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  saveModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 25,
    color: '#333',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  datePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calendarIcon: {
    marginLeft: 10,
  },
  datePickerContainer: {
    marginTop: 10,
    alignItems: 'center',
  },
  dateConfirmButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 10,
  },
  dateConfirmText: {
    color: 'white',
    fontWeight: '600',
  },
  saveModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
    marginRight: 10,
  },
  cancelButtonText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#80AE85',
    marginLeft: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  disabledButton: {
    opacity: 0.6,
  },
});