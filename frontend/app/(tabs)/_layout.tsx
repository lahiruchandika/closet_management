import { Tabs, usePathname } from "expo-router";
import React from "react";
import { Platform, View, Dimensions } from "react-native";
import { HapticTab } from "@/components/HapticTab";
import TabBarBackground from "@/components/ui/TabBarBackground";
import Header from "@/components/Header";
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get("window");

export default function TabLayout() {
  const pathname = usePathname();
  const tabName = pathname.split('/').pop() || 'index';
  
  return (
    <>
      {/* <Header tabName={tabName}/> */}
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarShowLabel: false,
          tabBarBackground: TabBarBackground,
          tabBarActiveTintColor: "#F83191",
          tabBarInactiveTintColor: "#9CA3AF",
          tabBarStyle: Platform.select({
            ios: {
              position: "absolute",
              bottom: 27,
              left: 16,
              right: 16,
              height: 72,
              borderRadius: 20,
              backgroundColor: "white",
              elevation: 0,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.15,
              shadowRadius: 16,
              borderWidth: 1,
              borderColor: "rgba(255, 255, 255, 0.8)",
            },
            android: {
              position: "absolute",
              bottom: 16,
              left: 16,
              right: 16,
              height: 72,
              borderRadius: 20,
              backgroundColor: "white",
              elevation: 8,
              alignItems: "center",
              justifyContent: "center",
            },
          }),
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Closet",
            tabBarIcon: ({ color, focused }) => (
              <View style={styles.tabIconContainer}>
                <View style={[
                  styles.iconWrapper,
                  focused && { backgroundColor: 'rgba(102, 126, 234, 0.12)' }
                ]}>
                  <Ionicons
                    name={focused ? "shirt" : "shirt-outline"}
                    size={24}
                    color={color}
                  />
                </View>
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="outfits"
          options={{
            title: "Outfits",
            tabBarIcon: ({ color, focused }) => (
              <View style={styles.tabIconContainer}>
                <View style={[
                  styles.iconWrapper,
                  focused && { backgroundColor: 'rgba(102, 126, 234, 0.12)' }
                ]}>
                  <Ionicons
                    name={focused ? "layers" : "layers-outline"}
                    size={24}
                    color={color}
                  />
                </View>
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="canvas"
          options={{
            title: "Canvas",
            tabBarIcon: ({ color, focused }) => (
              <View style={styles.tabIconContainer}>
                <View style={[
                  styles.iconWrapper,
                  focused && { backgroundColor: 'rgba(102, 126, 234, 0.12)' }
                ]}>
                  <Ionicons
                    name={focused ? "create" : "create-outline"}
                    size={24}
                    color={color}
                  />
                </View>
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="planner"
          options={{
            title: "Planner",
            tabBarIcon: ({ color, focused }) => (
              <View style={styles.tabIconContainer}>
                <View style={[
                  styles.iconWrapper,
                  focused && { backgroundColor: 'rgba(102, 126, 234, 0.12)' }
                ]}>
                  <Ionicons
                    name={focused ? "calendar" : "calendar-outline"}
                    size={24}
                    color={color}
                  />
                </View>
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, focused }) => (
              <View style={styles.tabIconContainer}>
                <View style={[
                  styles.iconWrapper,
                  focused && { backgroundColor: 'rgba(102, 126, 234, 0.12)' }
                ]}>
                  <Ionicons
                    name={focused ? "person" : "person-outline"}
                    size={24}
                    color={color}
                  />
                </View>
              </View>
            ),
          }}
        />
      </Tabs>
    </>
  );
}

const styles = {
  tabIconContainer: {
    paddingTop: 8,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    transition: "all 0.2s ease" as const,
  },
};