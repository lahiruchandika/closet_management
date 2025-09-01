import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

const PrimaryButton: React.FC = () => {
    return (
        <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button}>
                <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity>
        </View>
    );

}

export default PrimaryButton;

const styles = StyleSheet.create({
    buttonContainer: {
        padding: 10,
    },
    button: {
        backgroundColor: '#87B18A',
        padding: 10,
        width: 100,
        borderRadius: 30,
        alignItems: 'center',
    },
    buttonText: {
        color: '#E9E2D7',
        fontSize: 22,
        fontWeight: 'bold',
    },
});