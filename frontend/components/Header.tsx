import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const Header: React.FC<{ tabName: string }> = ({ tabName }) => {
  const navigation = useNavigation();
  if(tabName === 'index'){
    tabName = 'Closet';
  }
  else{
  tabName = tabName.charAt(0).toUpperCase() + tabName.slice(1);
  }

  return (
    <View style={styles.headerContainer}>
      <Text style={styles.tabName}>{tabName}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    padding: 10,
    paddingTop: 30,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  tabName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color:'#45444',
  },
  separator: {
    width: '100%',
    height: 1,
    backgroundColor: '#ddd', 
    marginBottom: 10,
  },
  searchInput: {
    width: '100%',
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: '#e6e6e6',
  },
});

export default Header;