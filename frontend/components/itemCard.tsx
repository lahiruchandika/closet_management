import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface ItemCardProps {
  name: string;
  imageUrl: any;
  itemId: string;
  brand?: string;
  category?: string;
  color?: string;
  material?: string;
}

const ItemCard: React.FC<ItemCardProps> = ({ 
  name, 
  imageUrl, 
  itemId, 
  brand, 
  category, 
  color,
  material,
}) => {
  const router = useRouter();
  const [isPressed, setIsPressed] = useState(false);

  const handlePress = () => {
    router.push(`/closet-single?id=${itemId}`);
  };

  const getColorValue = (colorName: string) => {
    const colorMap: { [key: string]: string } = {
      red: '#ef4444',
      blue: '#3b82f6',
      green: '#10b981',
      yellow: '#f59e0b',
      black: '#1f2937',
      white: '#ffffff',
      gray: '#6b7280',
      brown: '#92400e',
      pink: '#ec4899',
      purple: '#8b5cf6',
      orange: '#f97316',
      beige: '#d6d3d1',
    };
    return colorMap[colorName?.toLowerCase()] || '#9ca3af';
  };

  return (
    <Pressable 
      onPress={handlePress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      style={{
        backgroundColor: 'white',
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        borderWidth: 1,
        borderColor: '#f3f4f6',
        overflow: 'hidden',
        transform: [{ scale: isPressed ? 0.95 : 1 }],
        elevation: 3,
      }}
    >
      {/* Image container */}
      <View style={{ backgroundColor: '#f9fafb', aspectRatio: 3 / 4 }}>
        <Image 
          source={imageUrl} 
          style={{ 
            width: '100%',
            height: '100%',
            resizeMode: 'cover',
          }}
        />
        
        {/* Overlay gradient */}
        <LinearGradient
          colors={['transparent', 'transparent', 'rgba(0,0,0,0.2)']}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
          pointerEvents="none"
        />
        
        {/* Category badge */}
        {category && (
          <View style={{ position: 'absolute', top: 12, left: 12 }}>
            <View style={{
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: 9999,
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.5)',
            }}>
              <Text style={{
                color: '#374151',
                fontSize: 12,
                fontWeight: '500',
              }}>
                {category}
              </Text>
            </View>
          </View>
        )}
      </View>
      
      {/* Content */}
      <View style={{ padding: 16 }}>
        {brand && (
          <Text style={{
            color: '#6b7280',
            fontSize: 14,
            marginBottom: 4,
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}>
            {brand}
          </Text>
        )}
        
        <Text 
          style={{
            color: '#111827',
            fontWeight: '600',
            textTransform: 'capitalize',
            lineHeight: 20,
            marginBottom: 8,
          }}
          numberOfLines={2}
        >
          {name}
        </Text>
        
        {/* Material info */}
        {material && (
          <Text style={{
            color: '#6b7280',
            fontSize: 12,
            marginBottom: 8,
          }}>
            {material}
          </Text>
        )}
        
        {/* Action row */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 8,
        }}>
          {/* Color indicators */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {color && (
              <View 
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 9999,
                  borderWidth: 2,
                  borderColor: 'white',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                  backgroundColor: getColorValue(color),
                }}
              />
            )}
          </View>
          
          {/* View button */}
          <TouchableOpacity
            onPress={handlePress}
            activeOpacity={0.7}
          >
            <Text style={{
              color: '#e11d48',
              fontSize: 12,
              fontWeight: '500',
            }}>
              View
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Pressable>
  );
};

export default ItemCard;