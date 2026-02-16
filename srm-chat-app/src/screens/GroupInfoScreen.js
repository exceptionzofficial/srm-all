import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, StatusBar,
    ActivityIndicator, ScrollView, Image
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { getGroupById, getEmployees } from '../services/api';
import { COLORS } from '../utils/theme';

const GroupInfoScreen = ({ route, navigation }) => {
    const insets = useSafeAreaInsets();
    const { groupId, groupName, currentUser } = route.params;
    const [group, setGroup] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadGroupInfo = async () => {
        try {
            const response = await getGroupById(groupId);
            if (response.success) setGroup(response.data);
        } catch (error) {
            console.log('Error loading group info:', error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => { loadGroupInfo(); }, [groupId])
    );

    const getAvatarColor = (name) => {
        const colors = ['#EF4136', '#FF7F27', '#4CAF50', '#2196F3', '#9C27B0'];
        let hash = 0;
        for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
        return colors[Math.abs(hash) % colors.length];
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Icon name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Group Info</Text>
                <View style={{ flex: 1 }} />
                <Image
                    source={require('../assets/srm-logo.png')}
                    style={styles.headerLogo}
                    resizeMode="contain"
                />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : group ? (
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {/* Group Avatar & Name */}
                    <View style={styles.profileSection}>
                        <View style={styles.bigAvatarContainer}>
                            <Image
                                source={require('../assets/srm-logo.png')}
                                style={styles.bigAvatarImage}
                                resizeMode="contain"
                            />
                        </View>
                        <Text style={styles.groupNameText}>{groupName}</Text>
                        <View style={styles.groupTypeRow}>
                            <Icon
                                name={group.groupType === 'announcement' ? 'campaign' : 'chat-bubble-outline'}
                                size={16}
                                color="#888"
                            />
                            <Text style={styles.groupType}>
                                {group.groupType === 'announcement' ? 'Announcement Group' : 'Standard Group'}
                            </Text>
                        </View>
                        <Text style={styles.memberCountText}>{group.members?.length || 0} members</Text>
                    </View>

                    {/* Pinned Task */}
                    {group.task && (
                        <View style={styles.section}>
                            <View style={styles.sectionTitleRow}>
                                <Icon name="push-pin" size={16} color="#333" />
                                <Text style={styles.sectionTitle}>Pinned Task</Text>
                            </View>
                            <View style={styles.pinnedCard}>
                                <Text style={styles.pinnedTaskTitle}>{group.task}</Text>
                                {group.timeline && (
                                    <View style={styles.timelineRow}>
                                        <Icon name="schedule" size={14} color="#888" />
                                        <Text style={styles.timelineText}>{group.timeline}</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    )}

                    {/* Quick Actions */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Quick Actions</Text>

                        <TouchableOpacity
                            style={styles.actionItem}
                            onPress={() => navigation.navigate('Tasks', { groupId, groupName, currentUser })}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: '#FFF3E0' }]}>
                                <Icon name="assignment" size={22} color="#FF9800" />
                            </View>
                            <View style={styles.actionContent}>
                                <Text style={styles.actionText}>View Tasks</Text>
                                <Text style={styles.actionSubText}>{group.tasks?.length || 0} tasks</Text>
                            </View>
                            <Icon name="chevron-right" size={22} color="#CCC" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionItem}
                            onPress={() => navigation.navigate('Members', { groupId, groupName, currentUser })}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: '#E3F2FD' }]}>
                                <Icon name="group" size={22} color="#2196F3" />
                            </View>
                            <View style={styles.actionContent}>
                                <Text style={styles.actionText}>View Members</Text>
                                <Text style={styles.actionSubText}>{group.members?.length || 0} members</Text>
                            </View>
                            <Icon name="chevron-right" size={22} color="#CCC" />
                        </TouchableOpacity>
                    </View>

                    {/* Created Info */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Details</Text>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Created by</Text>
                            <Text style={styles.detailValue}>{group.createdBy || 'Admin'}</Text>
                        </View>
                        {group.createdAt && (
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Created on</Text>
                                <Text style={styles.detailValue}>
                                    {group.createdAt._seconds
                                        ? new Date(group.createdAt._seconds * 1000).toLocaleDateString()
                                        : new Date(group.createdAt).toLocaleDateString()}
                                </Text>
                            </View>
                        )}
                    </View>
                </ScrollView>
            ) : (
                <View style={styles.center}>
                    <Text>Group not found</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    header: {
        flexDirection: 'row', alignItems: 'center', padding: 15,
        backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
    },
    backBtn: { marginRight: 12, padding: 4 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#000' },
    headerLogo: { width: 42, height: 42 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollContent: { paddingBottom: 40 },
    profileSection: { alignItems: 'center', paddingVertical: 30, backgroundColor: '#FFF' },
    bigAvatarContainer: {
        width: 80, height: 80, borderRadius: 40,
        justifyContent: 'center', alignItems: 'center', marginBottom: 14,
        backgroundColor: '#FAFAFA', overflow: 'hidden', borderWidth: 1, borderColor: '#F0F0F0'
    },
    bigAvatarImage: { width: '60%', height: '60%' },
    bigAvatarText: { fontSize: 28, fontWeight: 'bold' },
    groupNameText: { fontSize: 22, fontWeight: 'bold', color: '#000', marginBottom: 4 },
    groupTypeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
    groupType: { fontSize: 13, color: '#888' },
    memberCountText: { fontSize: 14, color: '#666' },
    section: {
        backgroundColor: '#FFF', marginTop: 10, paddingHorizontal: 16, paddingVertical: 14,
    },
    sectionTitle: { fontSize: 14, fontWeight: '700', color: '#333', textTransform: 'uppercase' },
    sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
    pinnedCard: {
        backgroundColor: '#F8F4FF', borderRadius: 10, padding: 14,
        borderLeftWidth: 3, borderLeftColor: '#9C27B0',
    },
    pinnedTaskTitle: { fontSize: 15, fontWeight: '600', color: '#333' },
    timelineRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
    timelineText: { fontSize: 12, color: '#888' },
    actionItem: {
        flexDirection: 'row', alignItems: 'center', paddingVertical: 12,
        borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
    },
    actionIcon: {
        width: 42, height: 42, borderRadius: 12,
        justifyContent: 'center', alignItems: 'center', marginRight: 14,
    },
    actionContent: { flex: 1 },
    actionText: { fontSize: 15, fontWeight: '500', color: '#333' },
    actionSubText: { fontSize: 12, color: '#999', marginTop: 2 },
    detailRow: {
        flexDirection: 'row', justifyContent: 'space-between',
        paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
    },
    detailLabel: { fontSize: 14, color: '#888' },
    detailValue: { fontSize: 14, fontWeight: '500', color: '#333' },
});

export default GroupInfoScreen;
