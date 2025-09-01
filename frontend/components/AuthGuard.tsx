import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    if (isLoading || !navigationState?.key) return;

    const inAuthGroup = segments[0] === 'auth';
    
    console.log('AuthGuard - segments:', segments);
    console.log('AuthGuard - isAuthenticated:', isAuthenticated);
    console.log('AuthGuard - inAuthGroup:', inAuthGroup);

    // Use setTimeout to prevent redirect loops
    setTimeout(() => {
      if (!isAuthenticated && !inAuthGroup) {
        console.log('Redirecting to login');
        router.replace('/auth/login');
      } else if (isAuthenticated && inAuthGroup) {
        console.log('Redirecting to tabs');
        router.replace('/(tabs)');
      }
    }, 100);
  }, [isAuthenticated, segments, isLoading, navigationState?.key]);

  // Show loading while authentication is being determined
  if (isLoading || !navigationState?.key) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});