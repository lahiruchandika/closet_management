import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface ItemTypeCardProps {
  category: string;
  itemCount: number;
  imageUrl: any;
  onPress?: () => void;
}

const ItemTypeCard: React.FC<ItemTypeCardProps> = ({ category, itemCount, imageUrl, onPress }) => {
  const [isPressed, setIsPressed] = useState(false);

  // Different gradient colors for variety
  const gradients = [
    ['#667eea', '#764ba2'], // Purple-blue
    ['#f093fb', '#f5576c'], // Pink-red
    ['#4facfe', '#00f2fe'], // Blue-cyan
    ['#43e97b', '#38f9d7'], // Green-teal
    ['#ffecd2', '#fcb69f'], // Orange-peach
    ['#a8edea', '#fed6e3'], // Mint-pink
  ] as const;

  // Simple hash function to consistently assign colors based on category
  const getGradientForCategory = (category: string) => {
    let hash = 0;
    for (let i = 0; i < category.length; i++) {
      hash = category.charCodeAt(i) + ((hash << 5) - hash);
    }
    return gradients[Math.abs(hash) % gradients.length];
  };

  const selectedGradient = getGradientForCategory(category);

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isPressed ? styles.containerPressed : null,
        { elevation: isPressed ? 6 : 2 }
      ]}
      onPress={onPress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      activeOpacity={0.95}
    >
      {/* Gradient overlay */}
      <LinearGradient
        colors={[...selectedGradient, 'transparent'] as const}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.gradientOverlay,
          { opacity: isPressed ? 0.2 : 0.1 }
        ]}
      />

      <View style={styles.content}>
        {/* Image container */}
        <View style={styles.imageContainer}>
          {imageUrl ? (
            <>
              <Image
                source={typeof imageUrl === 'string' ? { uri: imageUrl } : imageUrl}
                style={[
                  styles.image,
                  isPressed ? styles.imagePressed : null
                ]}
                resizeMode="cover"
              />
              {/* Overlay for better contrast */}
              <View style={[
                styles.imageOverlay,
                { backgroundColor: isPressed ? 'rgba(0, 0, 0, 0)' : 'rgba(0, 0, 0, 0.1)' }
              ]} />
            </>
          ) : (
            <View style={styles.placeholderContainer}>
              <LinearGradient
                colors={selectedGradient}
                style={styles.placeholderGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="shirt-outline" size={24} color="rgba(255,255,255,0.8)" />
              </LinearGradient>
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.textContainer}>
          <Text style={styles.categoryText}>{category}</Text>
          <Text style={styles.itemCountText}>
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </Text>
        </View>

        {/* Arrow indicator */}
        <View style={[
          styles.arrowContainer,
          { backgroundColor: isPressed ? '#f3f4f6' : '#f9fafb' }
        ]}>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={isPressed ? '#4B5563' : '#9CA3AF'}
            style={{
              transform: isPressed ? [{ translateX: 2 }] : [{ translateX: 0 }],
            }}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Main Container
  container: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  containerPressed: {
    transform: [{ translateY: -4 }],
  },

  // Gradient Overlay
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
  },

  // Content Container
  content: {
    position: 'relative',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },

  // Image Container
  imageContainer: {
    position: 'relative',
    width: 48,
    height: 48,
    borderRadius: 12,
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

  // Image Styles
  image: {
    width: '100%',
    height: '100%',
  },
  imagePressed: {
    transform: [{ scale: 1.1 }],
  },

  // Image Overlay
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  // Placeholder (when no image)
  placeholderContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Text Container
  textContainer: {
    flex: 1,
    minWidth: 0, // Equivalent to min-w-0 in Tailwind
  },

  // Text Styles
  categoryText: {
    color: '#111827',
    fontWeight: '600',
    fontSize: 18,
    lineHeight: 20,
    marginBottom: 4,
  },
  itemCountText: {
    color: '#6b7280',
    fontSize: 14,
  },

  // Arrow Container
  arrowContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ItemTypeCard;