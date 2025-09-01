import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

interface OutfitItem {
  item: {
    _id: string;
    name: string;
    color: string;
    image: string;
    brand: string;
    material: string;
  };
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  _id: string;
}

interface OutfitCardProps {
  name: string;
  imageUrl?: any;
  outfitId: string;
  items?: OutfitItem[];
}

const OutfitCard: React.FC<OutfitCardProps> = ({ name, imageUrl, outfitId, items = [] }) => {
  const router = useRouter();

  const handlePress = () => {
    console.log('OutfitCard handlePress called with:', { name, outfitId, imageUrl });

    if (!outfitId) {
      console.error('Error: outfitId is undefined!');
      return;
    }

    console.log('Navigating to Outfit:', { id: outfitId });

    router.push({
      pathname: '/outfit-single',
      params: { id: String(outfitId) },
    });
  };

  // Function to normalize coordinates for the card container
  const normalizePosition = (x: number, y: number, itemWidth: number, itemHeight: number) => {
    // Assuming the original canvas was around 500x600 pixels 
    const originalCanvasWidth = 500;
    const originalCanvasHeight = 600;
    
    // Calculate normalized position as ratios (0 to 1)
    const normalizedX = Math.max(0, Math.min(x / originalCanvasWidth, 1));
    const normalizedY = Math.max(0, Math.min(y / originalCanvasHeight, 1));
    const normalizedWidth = Math.min(itemWidth / originalCanvasWidth, 0.9); // Increased from 60% to 90% of container
    const normalizedHeight = Math.min(itemHeight / originalCanvasHeight, 0.9); // Increased from 60% to 90% of container
    
    return {
      normalizedX,
      normalizedY,
      normalizedWidth,
      normalizedHeight,
    };
  };

  const renderOutfitItems = () => {
    if (!items || items.length === 0) {
      // Fallback to old imageUrl if no items
      if (imageUrl) {
        return <Image source={imageUrl} style={styles.fallbackImage} />;
      }
      return <View style={styles.emptyOutfit} />;
    }

    // Sort items by zIndex to ensure proper layering
    const sortedItems = [...items].sort((a, b) => a.zIndex - b.zIndex);

    return sortedItems.map((outfitItem, index) => {
      const position = normalizePosition(
        outfitItem.x,
        outfitItem.y,
        outfitItem.width,
        outfitItem.height
      );

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
          <Image
            source={{ uri: outfitItem.item.image }}
            style={styles.itemImage}
            resizeMode="contain"
          />
        </View>
      );
    });
  };

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress}>
      <View style={styles.imageContainer}>
        {renderOutfitItems()}
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.category}>{name}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'column',
    alignItems: 'center',
    padding: 10,
    margin: 5,
    flex: 1,
    maxWidth: '30%',
    aspectRatio: 0.75,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  imageContainer: {
    width: '80%',
    height: '80%',
    borderRadius: 8,
    backgroundColor: '#fff',
    marginBottom: 10,
    position: 'relative',
    overflow: 'hidden',
  },
  itemWrapper: {
    position: 'absolute',
  },
  itemImage: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  fallbackImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  emptyOutfit: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  category: {
    fontSize: 12,
    fontWeight: 'bold',
    alignSelf: 'center',
    color: '#666',
  },
});

export default OutfitCard;