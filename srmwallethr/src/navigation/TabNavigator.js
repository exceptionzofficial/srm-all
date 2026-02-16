import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AttendanceScreen from '../screens/AttendanceScreen';
import ProfileScreen from '../screens/ProfileScreen';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { COLORS } from '../utils/theme';

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
    const insets = useSafeAreaInsets();

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarActiveTintColor: '#EF4136', // Red
                tabBarInactiveTintColor: '#9E9E9E', // Grey
                tabBarStyle: {
                    backgroundColor: '#FFFFFF',
                    borderTopWidth: 1,
                    borderTopColor: '#EEEEEE',
                    paddingBottom: Math.max(insets.bottom, 10),
                    height: 60 + Math.max(insets.bottom, 10),
                    paddingTop: 5,
                    elevation: 0,
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    marginBottom: 5,
                    fontFamily: 'Poppins-Medium',
                },
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;
                    if (route.name === 'Attendance') {
                        iconName = 'access-time'; // Clock/Time icon
                    } else if (route.name === 'My Profile') {
                        iconName = 'person'; // User icon
                    }
                    return <Icon name={iconName} size={28} color={color} />;
                },
            })}
        >
            <Tab.Screen name="Attendance" component={AttendanceScreen} />
            <Tab.Screen name="My Profile" component={ProfileScreen} />
        </Tab.Navigator>
    );
};

export default TabNavigator;
