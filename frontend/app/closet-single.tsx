import React, { useState, useEffect } from 'react';
import { View, Text, Image, ActivityIndicator, Alert, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiUtils, itemsAPI } from '@/services/api';

// Define the Item interface
export interface Item {
  _id: string;
  name: string;
  image: string | any;
  itemType: string;
  color?: string;
  material?: string;
  brand?: string;
  dressCode?: string;
  occasion?: string;
  usageCount?: number;
}

const ClosetSingle = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  console.log(item);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check if user is authenticated
        const isAuth = await apiUtils.isAuthenticated();
        if (!isAuth) {
          setError('Please log in to view this item');
          return;
        }

        const response = await itemsAPI.getItem(id as string);
        const fetchedItem = response.data || response;
        setItem(fetchedItem);
      } catch (err: any) {
        console.error('Error fetching item:', err);

        if (apiUtils.handleAuthError(err)) {
          setError('Session expired. Please log in again.');
          return;
        }

        if (err.response?.status === 404) {
          setError("Item not found or you don't have permission to view it.");
        } else {
          setError('Failed to load item. Please try again.');
        }

        Alert.alert('Error', 'Failed to load item details. Please try again.', [{ text: 'OK' }]);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchItem();
    }
  }, [id]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ec4899" />
        <Text style={styles.loadingText}>Loading item details...</Text>
      </View>
    );
  }

  if (error || !item) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Item not found!'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerBackground} />
        <View style={styles.headerContent}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={16} color="#333" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView>
        {/* Product Image */}
        <View style={styles.contentContainer}>
          <View style={styles.imageContainer}>
            <View style={styles.imageWrapper}>
              <Image
                source={typeof item.image === 'string' ? { uri: item.image } : item.image}
                style={styles.itemImage}
                resizeMode="cover"
                onError={() => console.log('Image failed to load')}
              />
            </View>
          </View>

          {/* Product Info */}
          <View style={styles.infoCard}>
            <View style={styles.infoContent}>
              <Text style={styles.itemName}>{item.name}</Text>
              {item.brand && <Text style={styles.brandText}>{item.brand}</Text>}
              {item.dressCode && (
                <View style={styles.dressCodeBadge}>
                  <Text style={styles.dressCodeText}>{item.dressCode}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Product Details */}
          <View style={styles.detailsCard}>
            <Text style={styles.sectionTitle}>Details</Text>

            <View style={styles.detailsList}>
              {item.color && (
                <View style={styles.detailRow}>
                  <View style={styles.detailLeft}>
                    <View style={styles.colorIcon} />
                    <Text style={styles.detailLabel}>Color</Text>
                  </View>
                  <Text style={styles.detailValue}>{item.color}</Text>
                </View>
              )}

              {item.material && (
                <View style={styles.detailRow}>
                  <View style={styles.detailLeft}>
                    <View style={styles.materialIcon}>
                      <Text style={styles.iconEmoji}>🌿</Text>
                    </View>
                    <Text style={styles.detailLabel}>Material</Text>
                  </View>
                  <Text style={styles.detailValue}>{item.material}</Text>
                </View>
              )}

              {(item.occasion || item.dressCode) && (
                <View style={styles.detailRow}>
                  <View style={styles.detailLeft}>
                    <View style={styles.occasionIcon}>
                      <Text style={styles.iconEmoji}>👔</Text>
                    </View>
                    <Text style={styles.detailLabel}>Occasion</Text>
                  </View>
                  <Text style={styles.detailValue}>{item.occasion || item.dressCode}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Usage Analytics */}
          <View style={styles.analyticsCard}>
            <Text style={styles.sectionTitle}>Usage Analytics</Text>

            <View style={styles.analyticsRow}>
              <View style={styles.analyticsItem}>
                <View style={[styles.analyticsIcon, styles.trendingIcon]}>
                  <Ionicons name="trending-up" size={24} color="white" />
                </View>
                <Text style={styles.analyticsValue}>{item.usageCount || 0}</Text>
                <Text style={styles.analyticsLabel}>Times Worn</Text>
              </View>

              <View style={styles.analyticsItem}>
                <View style={[styles.analyticsIcon, styles.calendarIcon]}>
                  <Ionicons name="calendar" size={24} color="white" />
                </View>
                <Text style={styles.analyticsValue}>5</Text>
                <Text style={styles.analyticsLabel}>In Outfits</Text>
              </View>

              <View style={styles.analyticsItem}>
                <View style={[styles.analyticsIcon, styles.paletteIcon]}>
                  <Ionicons name="color-palette" size={24} color="white" />
                </View>
                <Text style={styles.analyticsValue}>8</Text>
                <Text style={styles.analyticsLabel}>Style Matches</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  // Loading and Error States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  errorText: {
    fontSize: 18,
    color: '#ef4444',
    marginTop: 20,
    textAlign: 'center',
    paddingHorizontal: 24,
  },

  // Main Container
  container: {
    flex: 1,
  },

  // Header
  header: {
    position: 'relative',
    backgroundColor: '#ffffff',
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fdf2f8', // Light rose background
  },
  headerContent: {
    position: 'relative',
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
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
    shadowRadius: 3,
    elevation: 2,
  },

  // Content
  contentContainer: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },

  // Image Container
  imageContainer: {
    marginBottom: 24,
  },
  imageWrapper: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  itemImage: {
    width: '100%',
    aspectRatio: 11/12,
  },

  // Info Card
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  infoContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  brandText: {
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 14,
    marginBottom: 8,
  },
  dressCodeBadge: {
    backgroundColor: '#fef2f2',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(251, 113, 133, 0.2)',
  },
  dressCodeText: {
    color: '#9f1239',
    fontSize: 14,
    fontWeight: '500',
  },

  // Details Card
  detailsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  detailsList: {
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  colorIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f59e0b', // Amber gradient approximation
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  materialIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#d1fae5', // Green background
    borderWidth: 2,
    borderColor: '#ffffff',
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
  occasionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#dbeafe', // Blue background
    borderWidth: 2,
    borderColor: '#ffffff',
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
  iconEmoji: {
    fontSize: 12,
  },
  detailLabel: {
    color: '#374151',
    fontWeight: '500',
  },
  detailValue: {
    color: '#111827',
    fontWeight: '500',
  },

  // Analytics Card
  analyticsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  analyticsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  analyticsItem: {
    alignItems: 'center',
    flex: 1,
  },
  analyticsIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  trendingIcon: {
    backgroundColor: '#ec4899', // Rose gradient approximation
  },
  calendarIcon: {
    backgroundColor: '#8b5cf6', // Purple gradient approximation
  },
  paletteIcon: {
    backgroundColor: '#10b981', // Emerald gradient approximation
  },
  analyticsValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  analyticsLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
});

export default ClosetSingle;