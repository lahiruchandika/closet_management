import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface PopupScreenButtonProps {
    type: string;
    isSelected?: boolean;
    onPress?: () => void;
}

const PopupScreenButton: React.FC<PopupScreenButtonProps> = ({ 
    type, 
    isSelected = false, 
    onPress 
}) => {
    return (
        <TouchableOpacity 
            style={[
                styles.button, 
                isSelected && styles.selectedButton
            ]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <Text style={[
                styles.buttonText,
                isSelected && styles.selectedButtonText
            ]} numberOfLines={1}>
                {type}
            </Text>
        </TouchableOpacity>
    );
}

export default PopupScreenButton;

const styles = StyleSheet.create({
    button: {
        backgroundColor: '#E9E2D7',
        paddingHorizontal: 16,
        paddingVertical: 8,
        minWidth: 70,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#D0D0D0',
    },
    selectedButton: {
        backgroundColor: '#007AFF',
        borderColor: '#005BB5',
    },
    buttonText: {
        color: '#5A5A5A',
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
    },
    selectedButtonText: {
        color: '#FFFFFF',
    },
});