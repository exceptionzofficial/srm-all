import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { View, Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ChatListScreen from '../screens/ChatListScreen';
import ChatScreen from '../screens/ChatScreen';
import TasksScreen from '../screens/TasksScreen';
import MembersScreen from '../screens/MembersScreen';
import GroupInfoScreen from '../screens/GroupInfoScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = ({ currentUser }) => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="ChatList">
                {(props) => <ChatListScreen {...props} currentUser={currentUser} />}
            </Stack.Screen>
            <Stack.Screen name="ChatScreen" component={ChatScreen} />
            <Stack.Screen name="GroupInfo" component={GroupInfoScreen} />
            <Stack.Screen name="Tasks" component={TasksScreen} />
            <Stack.Screen name="Members" component={MembersScreen} />
        </Stack.Navigator>
    );
};

export default AppNavigator;
