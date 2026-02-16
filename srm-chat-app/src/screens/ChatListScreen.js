import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    RefreshControl, StatusBar, ActivityIndicator, Image, Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, CommonActions } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserGroups, markMessageAsRead } from '../services/api';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { COLORS, FONT_FAMILY } from '../utils/theme';

const ChatListScreen = ({ currentUser }) => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadChats = async () => {
        try {
            if (currentUser?.employeeId) {
                const response = await getUserGroups(currentUser.employeeId);
                if (response.success) {
                    const sortedGroups = response.data.sort((a, b) => {
                        const timeA = a.lastMessageTime?._seconds || 0;
                        const timeB = b.lastMessageTime?._seconds || 0;
                        return timeB - timeA;
                    });
                    setGroups(sortedGroups);
                }
            }
        } catch (error) {
            console.log('Error loading chats:', error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadChats();
            const interval = setInterval(loadChats, 5000);
            return () => clearInterval(interval);
        }, [currentUser])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await loadChats();
        setRefreshing(false);
    };

    const handleLogout = async () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await AsyncStorage.clear();
                            navigation.dispatch(
                                CommonActions.reset({
                                    index: 0,
                                    routes: [{ name: 'Login' }],
                                })
                            );
                        } catch (error) {
                            console.error('Error clearing data:', error);
                        }
                    }
                }
            ]
        );
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        const date = timestamp._seconds ? new Date(timestamp._seconds * 1000) : new Date(timestamp);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();
        if (isToday) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    const handleChatPress = (item) => {
        if (currentUser && item.unreadCounts?.[currentUser.employeeId] > 0) {
            markMessageAsRead(item.id, currentUser.employeeId).catch(console.log);
            setGroups(prev => prev.map(g =>
                g.id === item.id
                    ? { ...g, unreadCounts: { ...g.unreadCounts, [currentUser.employeeId]: 0 } }
                    : g
            ));
        }
        navigation.navigate('ChatScreen', {
            groupId: item.id,
            groupName: item.name,
            currentUser,
        });
    };

    const renderItem = ({ item }) => {
        const unread = currentUser ? item.unreadCounts?.[currentUser.employeeId] || 0 : 0;

        return (
            <TouchableOpacity style={styles.chatItem} onPress={() => handleChatPress(item)}>
                {/* Replaced Initials with SRM Logo */}
                <View style={styles.avatarContainer}>
                    <Image
                        source={require('../assets/srm-logo.png')}
                        style={styles.avatarImage}
                        resizeMode="contain"
                    />
                </View>
                <View style={styles.chatContent}>
                    <View style={styles.chatHeader}>
                        <Text style={[styles.groupName, unread > 0 && styles.groupNameUnread]} numberOfLines={1}>
                            {item.name}
                        </Text>
                        <Text style={[styles.timeText, unread > 0 && styles.timeTextUnread]}>
                            {formatTime(item.lastMessageTime)}
                        </Text>
                    </View>
                    <View style={styles.lastMessageContainer}>
                        <Text style={[styles.lastMessage, unread > 0 && styles.lastMessageUnread]} numberOfLines={1}>
                            {item.lastMessageSender ? `${item.lastMessageSender}: ` : ''}
                            {item.lastMessage || 'No messages yet'}
                        </Text>
                        {unread > 0 && (
                            <View style={styles.badgeContainer}>
                                <Text style={styles.badgeText}>{unread}</Text>
                            </View>
                        )}
                    </View>
                    {item.task && (
                        <View style={styles.pinnedTask}>
                            <Text style={styles.pinnedTaskText} numberOfLines={1}>📌 {item.task}</Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Chats</Text>
                    <Text style={styles.headerSubtitle}>{groups.length} groups</Text>
                </View>
                <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                    <Icon name="logout" size={24} color={COLORS.primary} />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <FlatList
                    data={groups}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
                    }
                    contentContainerStyle={[styles.listContent, { paddingBottom: 20 + insets.bottom }]}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Icon name="chat-bubble-outline" size={60} color="#ddd" />
                            <Text style={styles.emptyText}>No conversations yet</Text>
                            <Text style={styles.emptySubText}>You'll see your groups here once added by admin</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    header: {
        paddingHorizontal: 20, paddingVertical: 16,
        backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
        elevation: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    },
    logoutButton: { padding: 8 },
    headerTitle: { fontSize: 24, fontFamily: FONT_FAMILY.bold, color: '#1A1A1A' },
    headerSubtitle: { fontSize: 13, color: '#757575', marginTop: 2, fontFamily: FONT_FAMILY.medium },
    listContent: { paddingBottom: 20 },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    chatItem: {
        flexDirection: 'row', padding: 16,
        borderBottomWidth: 1, borderBottomColor: '#F9F9F9', alignItems: 'center',
    },
    avatarContainer: {
        width: 56, height: 56, borderRadius: 28,
        justifyContent: 'center', alignItems: 'center', marginRight: 16,
        backgroundColor: '#F5F5F5', overflow: 'hidden', // Clean background for transparent logos
        elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2,
    },
    avatarImage: { width: '70%', height: '70%' }, // Scaled down slightly to look good inside circle
    chatContent: { flex: 1, justifyContent: 'center' },
    chatHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6, alignItems: 'center' },
    groupName: { fontSize: 16, fontFamily: FONT_FAMILY.semiBold, color: '#1A1A1A', flex: 1, marginRight: 8 },
    groupNameUnread: { color: '#000' },
    timeText: { fontSize: 11, color: '#9E9E9E', fontFamily: FONT_FAMILY.medium },
    timeTextUnread: { color: COLORS.primary, fontFamily: FONT_FAMILY.semiBold },
    lastMessageContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    lastMessage: { fontSize: 14, color: '#757575', flex: 1, fontFamily: FONT_FAMILY.regular, lineHeight: 20 },
    lastMessageUnread: { color: '#424242', fontFamily: FONT_FAMILY.medium },
    pinnedTask: {
        marginTop: 6, backgroundColor: '#FFF3E0', paddingHorizontal: 10,
        paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start',
    },
    pinnedTaskText: { fontSize: 11, color: '#E65100', fontFamily: FONT_FAMILY.medium },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100, padding: 32 },
    emptyText: { fontSize: 18, fontFamily: FONT_FAMILY.semiBold, color: '#424242', marginTop: 16 },
    emptySubText: { fontSize: 14, color: '#9E9E9E', textAlign: 'center', marginTop: 8, fontFamily: FONT_FAMILY.regular, lineHeight: 20 },
    badgeContainer: {
        backgroundColor: COLORS.primary, borderRadius: 12,
        minWidth: 24, height: 24, justifyContent: 'center',
        alignItems: 'center', marginLeft: 8, paddingHorizontal: 6, borderWidth: 1.5, borderColor: '#FFF',
    },
    badgeText: { color: 'white', fontSize: 11, fontFamily: FONT_FAMILY.bold },
});

export default ChatListScreen;

