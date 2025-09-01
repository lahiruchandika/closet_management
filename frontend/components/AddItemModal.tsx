import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
  Platform,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { itemsAPI } from '../services/api';
import { itemTypesAPI } from '@/services/itemTypesAPI';
import { useAuth } from '@/contexts/AuthContext';

interface AddItemModalProps {
  visible: boolean;
  onClose: () => void;
  onItemAdded: () => void;
}

interface ItemFormData {
  name: string;
  type: string;
  typeId: string;
  color: string;
  dressCode: string;
  brand: string;
  material: string;
  image: string | null;
  removeBg: boolean;
}

interface ItemType {
  _id: string;
  name: string;
}

interface FormErrors {
  name?: string;
  image?: string;
  brand?: string;
}

const DRESS_CODES = [
  'Casual',
  'Business Casual',
  'Business Formal',
  'Formal',
  'Semi-Formal',
  'Party',
  'Athletic',
  'Beachwear',
  'Other',
];

const COLORS = [
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
  'Navy',
  'Maroon',
  'Gold',
  'Silver',
];

const MATERIALS = [
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
  'Rayon',
  'Spandex',
  'Lycra',
  'Other',
];

export const AddItemModal: React.FC<AddItemModalProps> = ({ visible, onClose, onItemAdded }) => {
  const { isAuthenticated, user } = useAuth();
  
  const [formData, setFormData] = useState<ItemFormData>({
    name: '',
    type: '',
    typeId: '',
    color: '',
    dressCode: '',
    brand: '',
    material: '',
    image: null,
    removeBg: true,
  });
  
  const [loading, setLoading] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showDressCodePicker, setShowDressCodePicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showMaterialPicker, setShowMaterialPicker] = useState(false);
  const [types, setTypes] = useState<ItemType[]>([]);
  const [typesLoading, setTypesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // Check authentication when modal becomes visible
  useEffect(() => {
    if (visible) {
      if (!isAuthenticated) {
        Alert.alert('Authentication Required', 'Please log in to add items.', [
          { text: 'OK', onPress: onClose }
        ]);
        return;
      }
      fetchItemTypes();
    }
  }, [visible, isAuthenticated]);

  const fetchItemTypes = async (): Promise<void> => {
    try {
      setTypesLoading(true);
      setError(null);
      console.log('Fetching item types with authentication...');
      
      const response = await itemTypesAPI.getTypes();
      setTypes(response);
      console.log('Fetched item types:', response);
    } catch (err: any) {
      console.error('Error fetching types:', err);
      
      if (err.response?.status === 401) {
        Alert.alert('Session Expired', 'Please log in again to continue.');
        onClose();
        return;
      }
      
      const errorMessage = 'Failed to load item types. Please try again.';
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setTypesLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: '',
      typeId: '',
      color: '',
      dressCode: '',
      brand: '',
      material: '',
      image: null,
      removeBg: true,
    });
    setError(null);
    setFormErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Clear specific field error when user starts typing/selecting
  const clearFieldError = (fieldName: keyof FormErrors) => {
    if (formErrors[fieldName]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const pickImage = async () => {
    // Clear image error when user attempts to pick an image
    clearFieldError('image');

    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Permission to access camera roll is required!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      console.log('Image picker result:', result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        console.log('Selected image URI:', asset.uri);

        if (Platform.OS === 'web') {
          setFormData((prev) => ({
            ...prev,
            image: asset.uri,
          }));
        } else {
          if (asset.uri.startsWith('data:')) {
            try {
              const filename = `image_${Date.now()}.jpg`;
              const fileUri = `${FileSystem.documentDirectory}${filename}`;

              const base64Data = asset.uri.split(',')[1];
              await FileSystem.writeAsStringAsync(fileUri, base64Data, {
                encoding: FileSystem.EncodingType.Base64,
              });

              console.log('Converted base64 to file:', fileUri);
              setFormData((prev) => ({
                ...prev,
                image: fileUri,
              }));
            } catch (error) {
              console.error('Error converting base64 to file:', error);
              Alert.alert('Error', 'Failed to process image');
            }
          } else {
            setFormData((prev) => ({
              ...prev,
              image: asset.uri,
            }));
          }
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    // Authentication check
    if (!isAuthenticated) {
      Alert.alert('Authentication Error', 'Please log in to add items');
      return false;
    }

    // Name validation
    if (!formData.name.trim()) {
      errors.name = 'Item name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Item name must be at least 2 characters long';
    } else if (formData.name.trim().length > 100) {
      errors.name = 'Item name must be less than 100 characters';
    }

    // Image validation
    if (!formData.image) {
      errors.image = 'Please select an image for your item';
    }

    // Brand validation (optional but if provided, should meet criteria)
    if (formData.brand.trim() && formData.brand.trim().length > 50) {
      errors.brand = 'Brand name must be less than 50 characters';
    }

    setFormErrors(errors);

    // If there are errors, show an alert with the first error
    if (Object.keys(errors).length > 0) {
      const firstError = Object.values(errors)[0];
      Alert.alert('Validation Error', firstError);
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      console.log('=== SUBMITTING ITEM ===');
      console.log('User authenticated:', isAuthenticated);
      console.log('User:', user?.email);
      console.log('Form data:', {
        name: formData.name,
        removeBg: formData.removeBg,
      });

      const formDataToSend = new FormData();
      
      // Add required fields that match your backend model
      formDataToSend.append('name', formData.name.trim());
      
      // Add optional fields
      if (formData.color) formDataToSend.append('color', formData.color);
      if (formData.dressCode) formDataToSend.append('dressCode', formData.dressCode);
      if (formData.brand.trim()) formDataToSend.append('brand', formData.brand.trim());
      if (formData.material) formDataToSend.append('material', formData.material);
      if (formData.typeId) formDataToSend.append('itemType', formData.typeId);
      
      // Add background removal flag
      formDataToSend.append('removeBg', formData.removeBg.toString());

      // Handle image upload
      if (formData.image) {
        if (Platform.OS === 'web') {
          if (formData.image.startsWith('blob:') || formData.image.startsWith('data:')) {
            try {
              const response = await fetch(formData.image);
              const blob = await response.blob();
              const filename = `image_${Date.now()}.jpg`;
              const file = new File([blob], filename, { type: blob.type || 'image/jpeg' });
              formDataToSend.append('image', file);
              console.log('Web: Added file to form data:', filename);
            } catch (error) {
              console.error('Error processing web image:', error);
              Alert.alert('Error', 'Failed to process image for upload');
              return;
            }
          }
        } else {
          // Mobile platform
          if (formData.image.startsWith('data:')) {
            Alert.alert('Error', 'Please try selecting the image again');
            return;
          }

          const filename = formData.image.split('/').pop() || `image_${Date.now()}.jpg`;
          let type = 'image/jpeg';
          const fileExtension = filename.split('.').pop()?.toLowerCase();
          
          if (fileExtension) {
            switch (fileExtension) {
              case 'png':
                type = 'image/png';
                break;
              case 'jpg':
              case 'jpeg':
                type = 'image/jpeg';
                break;
              case 'gif':
                type = 'image/gif';
                break;
              case 'webp':
                type = 'image/webp';
                break;
              default:
                type = 'image/jpeg';
            }
          }

          const imageFile = {
            uri: Platform.OS === 'ios' ? formData.image.replace('file://', '') : formData.image,
            name: filename,
            type: type,
          };

          console.log('Mobile: Image file object:', imageFile);
          formDataToSend.append('image', imageFile as any);
        }
      }

      console.log('Submitting to authenticated API...');
      
      // Use the authenticated itemsAPI
      const response = await itemsAPI.createItem(formDataToSend);
      
      console.log('Item creation response:', response);

      if (response.success) {
        const successMessage = formData.removeBg && response.data.backgroundRemoved
          ? 'Item added successfully with background removed!'
          : 'Item added successfully!';

        Alert.alert('Success', successMessage, [
          { 
            text: 'OK', 
            onPress: () => {
              resetForm();
              onItemAdded(); // This will refresh the items list
              onClose();
            }
          }
        ]);
        handleClose();
      } else {
        throw new Error(response.message || 'Failed to create item');
      }
    } catch (error: any) {
      console.error('Error adding item:', error);

      if (error.response?.status === 401) {
        Alert.alert('Session Expired', 'Please log in again to continue.');
        onClose();
        return;
      }

      let errorMessage = 'Failed to add item. Please try again.';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      // Special handling for background removal errors
      if (errorMessage.includes('remove background') || errorMessage.includes('Remove.bg')) {
        errorMessage += '\nTry turning off background removal or check your internet connection.';
      }

      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Don't render the modal if user is not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Helper function to render error text
  const renderErrorText = (fieldName: keyof FormErrors) => {
    if (formErrors[fieldName]) {
      return (
        <Text style={styles.errorText}>{formErrors[fieldName]}</Text>
      );
    }
    return null;
  };

  // Helper function to get input style with error state
  const getInputStyle = (fieldName: keyof FormErrors, baseStyle: any) => {
    return [
      baseStyle,
      formErrors[fieldName] && styles.inputError
    ];
  };

  const renderTypePicker = () => (
    <Modal visible={showTypePicker} transparent animationType="slide">
      <View style={styles.pickerOverlay}>
        <View style={styles.pickerContainer}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>Select Item Type</Text>
            <TouchableOpacity onPress={() => setShowTypePicker(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.pickerList}>
            {typesLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#007AFF" />
                <Text style={styles.loadingText}>Loading types...</Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity onPress={fetchItemTypes} style={styles.retryButton}>
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : (
              types.map((typeObj) => (
                <TouchableOpacity
                  key={typeObj._id}
                  style={styles.pickerItem}
                  onPress={() => {
                    setFormData((prev) => ({
                      ...prev,
                      type: typeObj.name,
                      typeId: typeObj._id,
                    }));
                    setShowTypePicker(false);
                  }}
                >
                  <Text style={styles.pickerItemText}>{typeObj.name}</Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderColorPicker = () => (
    <Modal visible={showColorPicker} transparent animationType="slide">
      <View style={styles.pickerOverlay}>
        <View style={styles.pickerContainer}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>Select Color</Text>
            <TouchableOpacity onPress={() => setShowColorPicker(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.pickerList}>
            {COLORS.map((color) => (
              <TouchableOpacity
                key={color}
                style={styles.pickerItem}
                onPress={() => {
                  setFormData((prev) => ({ ...prev, color: color }));
                  setShowColorPicker(false);
                }}
              >
                <View style={styles.colorPickerItem}>
                  <View style={[styles.colorSwatch, { backgroundColor: color.toLowerCase() }]} />
                  <Text style={styles.pickerItemText}>{color}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderDressCodePicker = () => (
    <Modal visible={showDressCodePicker} transparent animationType="slide">
      <View style={styles.pickerOverlay}>
        <View style={styles.pickerContainer}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>Select Dress Code</Text>
            <TouchableOpacity onPress={() => setShowDressCodePicker(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.pickerList}>
            {DRESS_CODES.map((code) => (
              <TouchableOpacity
                key={code}
                style={styles.pickerItem}
                onPress={() => {
                  setFormData((prev) => ({ ...prev, dressCode: code }));
                  setShowDressCodePicker(false);
                }}
              >
                <Text style={styles.pickerItemText}>{code}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderMaterialPicker = () => (
    <Modal visible={showMaterialPicker} transparent animationType="slide">
      <View style={styles.pickerOverlay}>
        <View style={styles.pickerContainer}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>Select Material</Text>
            <TouchableOpacity onPress={() => setShowMaterialPicker(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.pickerList}>
            {MATERIALS.map((material) => (
              <TouchableOpacity
                key={material}
                style={styles.pickerItem}
                onPress={() => {
                  setFormData((prev) => ({ ...prev, material: material }));
                  setShowMaterialPicker(false);
                }}
              >
                <Text style={styles.pickerItemText}>{material}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <>
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.title}>Add New Item</Text>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading}
              style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#007AFF" />
              ) : (
                <Text style={styles.saveButtonText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
            {/* Image Picker */}
            <View style={styles.imageSection}>
              <Text style={styles.label}>Photo *</Text>
              <TouchableOpacity 
                style={getInputStyle('image', styles.imagePicker)} 
                onPress={pickImage}
              >
                {formData.image ? (
                  <Image source={{ uri: formData.image }} style={styles.selectedImage} />
                ) : (
                  <View style={styles.imagePickerPlaceholder}>
                    <Ionicons name="camera" size={40} color="#ccc" />
                    <Text style={styles.imagePickerText}>Tap to add photo</Text>
                  </View>
                )}
              </TouchableOpacity>
              {renderErrorText('image')}

              {/* Background Removal Toggle */}
              <View style={styles.toggleSection}>
                <View style={styles.toggleRow}>
                  <View style={styles.toggleInfo}>
                    <Text style={styles.toggleLabel}>Remove Background</Text>
                    <Text style={styles.toggleDescription}>Automatically remove background from your image</Text>
                  </View>
                  <Switch
                    value={formData.removeBg}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, removeBg: value }))}
                    trackColor={{ false: '#767577', true: '#81b0ff' }}
                    thumbColor={formData.removeBg ? '#007AFF' : '#f4f3f4'}
                  />
                </View>
                {formData.removeBg && (
                  <Text style={styles.toggleNote}>Background removal may take a few extra seconds</Text>
                )}
              </View>
            </View>

            {/* Name - Required */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Name *</Text>
              <TextInput
                style={getInputStyle('name', styles.input)}
                value={formData.name}
                onChangeText={(text) => {
                  setFormData((prev) => ({ ...prev, name: text }));
                  clearFieldError('name');
                }}
                placeholder="Enter item name"
                placeholderTextColor="#999"
                maxLength={100}
              />
              {renderErrorText('name')}
            </View>

            {/* Type - Optional */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Type</Text>
              <TouchableOpacity style={styles.selectInput} onPress={() => setShowTypePicker(true)}>
                <Text style={[styles.selectText, !formData.type && styles.placeholderText]}>
                  {formData.type || 'Select item type'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#999" />
              </TouchableOpacity>
            </View>

            {/* Color - Optional */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Color</Text>
              <TouchableOpacity style={styles.selectInput} onPress={() => setShowColorPicker(true)}>
                <View style={styles.colorPickerButton}>
                  {formData.color && (
                    <View style={[styles.colorSwatch, { backgroundColor: formData.color.toLowerCase() }]} />
                  )}
                  <Text style={[styles.selectText, !formData.color && styles.placeholderText]}>
                    {formData.color || 'Select color'}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={20} color="#999" />
              </TouchableOpacity>
            </View>

            {/* Dress Code - Optional */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Dress Code</Text>
              <TouchableOpacity style={styles.selectInput} onPress={() => setShowDressCodePicker(true)}>
                <Text style={[styles.selectText, !formData.dressCode && styles.placeholderText]}>
                  {formData.dressCode || 'Select dress code'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#999" />
              </TouchableOpacity>
            </View>

            {/* Brand - Optional */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Brand</Text>
              <TextInput
                style={getInputStyle('brand', styles.input)}
                value={formData.brand}
                onChangeText={(text) => {
                  setFormData((prev) => ({ ...prev, brand: text }));
                  clearFieldError('brand');
                }}
                placeholder="Enter brand"
                placeholderTextColor="#999"
                maxLength={50}
              />
              {renderErrorText('brand')}
            </View>

            {/* Material - Optional */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Material</Text>
              <TouchableOpacity style={styles.selectInput} onPress={() => setShowMaterialPicker(true)}>
                <Text style={[styles.selectText, !formData.material && styles.placeholderText]}>
                  {formData.material || 'Select material'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#999" />
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {renderTypePicker()}
      {renderColorPicker()}
      {renderDressCodePicker()}
      {renderMaterialPicker()}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 60, // Account for status bar
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  form: {
    flex: 1,
    paddingHorizontal: 20,
  },
  imageSection: {
    marginVertical: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  imagePicker: {
    height: 200,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  selectedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePickerPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePickerText: {
    marginTop: 8,
    fontSize: 16,
    color: '#999',
  },
  toggleSection: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleInfo: {
    flex: 1,
    marginRight: 16,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  toggleDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  toggleNote: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 8,
    fontStyle: 'italic',
  },
  inputGroup: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#ff4444',
    borderWidth: 2,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  selectInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  selectText: {
    fontSize: 16,
    color: '#333',
  },
  placeholderText: {
    color: '#999',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
    marginTop: 4,
    marginLeft: 4,
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  pickerList: {
    maxHeight: 300,
  },
  pickerItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  pickerItemText: {
    fontSize: 16,
    color: '#333',
  },
  colorPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorSwatch: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});