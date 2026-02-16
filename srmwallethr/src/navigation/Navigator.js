/**
 * Main Navigation for SRM Sweets App
 * Flow: Attendance (main) -> Registration for new users
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import screens
import TabNavigator from './TabNavigator';
import EmployeeIdScreen from '../screens/EmployeeIdScreen';
import FaceRegistrationScreen from '../screens/FaceRegistrationScreen';
import DashboardScreen from '../screens/DashboardScreen';
import FaceLivenessScreen from '../screens/FaceLivenessScreen';
import RequestsScreen from '../screens/RequestsScreen';
import RulesScreen from '../screens/RulesScreen';
import PayDetailsScreen from '../screens/PayDetailsScreen';
import AttendanceDetailsScreen from '../screens/AttendanceDetailsScreen';
import ApplyRequestScreen from '../screens/ApplyRequestScreen';

// Auth Screens
import RegisterScreen from '../screens/Auth/RegisterScreen';
import LoginScreen from '../screens/Auth/LoginScreen';
import OtpScreen from '../screens/Auth/OtpScreen';
import PasswordCreateScreen from '../screens/Auth/PasswordCreateScreen';
import CompleteProfileScreen from '../screens/Auth/CompleteProfileScreen';

const Stack = createNativeStackNavigator();

const Navigator = () => {
    return (
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName="Login"
                screenOptions={{
                    headerShown: false,
                    animation: 'slide_from_right',
                }}>
                {/* Auth Flow */}
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Register" component={RegisterScreen} />
                <Stack.Screen name="Otp" component={OtpScreen} />
                <Stack.Screen name="PasswordCreate" component={PasswordCreateScreen} />
                <Stack.Screen name="CompleteProfile" component={CompleteProfileScreen} />
                {/* Main App with Tabs */}
                <Stack.Screen
                    name="Home"
                    component={TabNavigator}
                    options={{
                        animation: 'fade',
                    }}
                />

                {/* Dashboard */}
                <Stack.Screen
                    name="Dashboard"
                    component={DashboardScreen}
                    options={{
                        animation: 'fade',
                    }}
                />

                {/* Registration Flow */}
                <Stack.Screen
                    name="EmployeeId"
                    component={EmployeeIdScreen}
                />
                <Stack.Screen
                    name="FaceRegistration"
                    component={FaceRegistrationScreen}
                />
                <Stack.Screen
                    name="FaceLiveness"
                    component={FaceLivenessScreen}
                />
                <Stack.Screen
                    name="Requests"
                    component={RequestsScreen}
                />


                {/* General */}
                <Stack.Screen
                    name="RulesScreen"
                    component={RulesScreen}
                />
                <Stack.Screen
                    name="PayDetails"
                    component={PayDetailsScreen}
                    options={{
                        headerShown: true,
                        title: 'Pay Details',
                        headerTintColor: '#FFF',
                        headerStyle: { backgroundColor: '#EF4136' },
                        headerTitleStyle: { fontFamily: 'Poppins-Bold' }
                    }}
                />
                <Stack.Screen
                    name="AttendanceDetails"
                    component={AttendanceDetailsScreen}
                    options={{
                        headerShown: true,
                        title: 'Attendance Details',
                        headerTintColor: '#FFF',
                        headerStyle: { backgroundColor: '#EF4136' },
                        headerTitleStyle: { fontFamily: 'Poppins-Bold' }
                    }}
                />
                <Stack.Screen
                    name="ApplyRequest"
                    component={ApplyRequestScreen}
                    options={{ headerShown: false }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default Navigator;

