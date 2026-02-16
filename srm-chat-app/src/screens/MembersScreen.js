import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    StatusBar, ActivityIndicator, TextInput, Alert, Modal, Image
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { getGroupById, getEmployees, updateGroup } from '../services/api';
import { COLORS } from '../utils/theme';

const MembersScreen = ({ route, navigation }) => {
    const insets = useSafeAreaInsets();
    const { groupId, groupName, currentUser } = route.params;
    const [members, setMembers] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [group, setGroup] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedNewMembers, setSelectedNewMembers] = useState([]);

    const loadData = async () => {
        try {
            const [groupRes, empRes] = await Promise.all([
                getGroupById(groupId),
                getEmployees()
            ]);
            const allEmps = empRes.employees || [];
            setEmployees(allEmps);

            if (groupRes.success && groupRes.data) {
                setGroup(groupRes.data);
                const resolved = (groupRes.data.members || []).map(memberId => {
                    const emp = allEmps.find(e => e.employeeId === memberId);
                    return {
                        id: memberId,
                        name: emp?.name || memberId,
                        designation: emp?.designation || '',
                    };
                });
                setMembers(resolved);
            }
        } catch (error) {
            console.log('Error loading members:', error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => { loadData(); }, [groupId])
    );

    const getNonMembers = () => {
        if (!group?.members) return employees;
        const filtered = employees.filter(emp => !group.members.includes(emp.employeeId));
        if (!searchQuery.trim()) return filtered;
        const q = searchQuery.toLowerCase();
        return filtered.filter(emp =>
            emp.name?.toLowerCase().includes(q) ||
            emp.employeeId?.toLowerCase().includes(q)
        );
    };

    const toggleNewMember = (empId) => {
        setSelectedNewMembers(prev =>
            prev.includes(empId) ? prev.filter(id => id !== empId) : [...prev, empId]
        );
    };

    const handleAddMembers = async () => {
        if (selectedNewMembers.length === 0) return;
        try {
            const updatedMembers = [...(group.members || []), ...selectedNewMembers];
            await updateGroup(groupId, { members: updatedMembers });
            setShowAddModal(false);
            setSelectedNewMembers([]);
            setSearchQuery('');
            loadData();
            Alert.alert('Success', `${selectedNewMembers.length} member(s) added`);
        } catch (error) {
            console.log('Error adding members:', error);
            Alert.alert('Error', 'Failed to add members');
        }
    };

    const getAvatarColor = (name) => {
        const colors = ['#EF4136', '#FF7F27', '#4CAF50', '#2196F3', '#9C27B0', '#FF5722', '#00BCD4'];
        let hash = 0;
        for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
        return colors[Math.abs(hash) % colors.length];
    };

    const renderMember = ({ item }) => (
        <View style={styles.memberCard}>
            <View style={[styles.avatar, { backgroundColor: getAvatarColor(item.name) + '20' }]}>
                <Text style={[styles.avatarText, { color: getAvatarColor(item.name) }]}>
                    {item.name.substring(0, 2).toUpperCase()}
                </Text>
            </View>
            <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{item.name}</Text>
                <Text style={styles.memberId}>{item.id}</Text>
                {item.designation ? <Text style={styles.memberDesignation}>{item.designation}</Text> : null}
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Icon name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitle}>Members ({members.length})</Text>
                    <Text style={styles.headerSubtitle}>{groupName}</Text>
                </View>
                <TouchableOpacity onPress={() => setShowAddModal(true)} style={styles.addBtn}>
                    <Icon name="person-add" size={24} color={COLORS.primary} />
                </TouchableOpacity>
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
            ) : (
                <FlatList
                    data={members}
                    renderItem={renderMember}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Icon name="group" size={60} color="#ddd" />
                            <Text style={styles.emptyText}>No members</Text>
                        </View>
                    }
                />
            )}

            {/* Add Member Modal */}
            <Modal visible={showAddModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContainer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Add Members</Text>
                            <TouchableOpacity onPress={() => { setShowAddModal(false); setSelectedNewMembers([]); setSearchQuery(''); }}>
                                <Icon name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>
                        <TextInput
                            style={styles.searchInput}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholder="Search employees..."
                            placeholderTextColor="#999"
                        />
                        {selectedNewMembers.length > 0 && (
                            <Text style={styles.selectedCount}>{selectedNewMembers.length} selected</Text>
                        )}
                        <FlatList
                            data={getNonMembers()}
                            keyExtractor={item => item.employeeId}
                            style={styles.modalList}
                            renderItem={({ item }) => {
                                const isSelected = selectedNewMembers.includes(item.employeeId);
                                return (
                                    <TouchableOpacity
                                        style={[styles.empItem, isSelected && styles.empItemSelected]}
                                        onPress={() => toggleNewMember(item.employeeId)}
                                    >
                                        <View style={styles.empInfo}>
                                            <View style={[styles.smallAvatar, { backgroundColor: getAvatarColor(item.name || '') + '20' }]}>
                                                <Text style={[styles.smallAvatarText, { color: getAvatarColor(item.name || '') }]}>
                                                    {(item.name || 'U').substring(0, 2).toUpperCase()}
                                                </Text>
                                            </View>
                                            <View>
                                                <Text style={styles.empName}>{item.name}</Text>
                                                <Text style={styles.empId}>{item.employeeId}</Text>
                                            </View>
                                        </View>
                                        <Icon
                                            name={isSelected ? 'check-box' : 'check-box-outline-blank'}
                                            size={24}
                                            color={isSelected ? COLORS.primary : '#CCC'}
                                        />
                                    </TouchableOpacity>
                                );
                            }}
                        />
                        <TouchableOpacity
                            style={[styles.addButton, selectedNewMembers.length === 0 && styles.addButtonDisabled]}
                            onPress={handleAddMembers}
                            disabled={selectedNewMembers.length === 0}
                        >
                            <Text style={styles.addButtonText}>
                                Add {selectedNewMembers.length} Member{selectedNewMembers.length !== 1 ? 's' : ''}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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
    headerSubtitle: { fontSize: 12, color: '#999' },
    headerLogo: { width: 40, height: 40, marginLeft: 8 },
    addBtn: { padding: 8 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { padding: 16, paddingBottom: 30 },
    memberCard: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',
        padding: 14, borderRadius: 12, marginBottom: 8,
        elevation: 1, borderWidth: 1, borderColor: '#F0F0F0',
    },
    avatar: {
        width: 46, height: 46, borderRadius: 23,
        justifyContent: 'center', alignItems: 'center', marginRight: 14,
    },
    avatarText: { fontSize: 15, fontWeight: 'bold' },
    memberInfo: { flex: 1 },
    memberName: { fontSize: 15, fontWeight: '600', color: '#333' },
    memberId: { fontSize: 12, color: '#999', marginTop: 2 },
    memberDesignation: { fontSize: 12, color: '#666', marginTop: 1 },
    emptyContainer: { alignItems: 'center', marginTop: 80 },
    emptyText: { fontSize: 18, color: '#666', marginTop: 16 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContainer: {
        backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20,
        maxHeight: '80%', padding: 20,
    },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#000' },
    searchInput: {
        backgroundColor: '#F5F5F5', borderRadius: 12, paddingHorizontal: 14,
        paddingVertical: 10, fontSize: 15, color: '#000', marginBottom: 10,
    },
    selectedCount: { fontSize: 13, color: COLORS.primary, fontWeight: '600', marginBottom: 8 },
    modalList: { maxHeight: 350 },
    empItem: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        padding: 12, borderRadius: 10, marginBottom: 4,
    },
    empItemSelected: { backgroundColor: '#FFF0EF' },
    empInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    smallAvatar: {
        width: 36, height: 36, borderRadius: 18,
        justifyContent: 'center', alignItems: 'center', marginRight: 10,
    },
    smallAvatarText: { fontSize: 12, fontWeight: 'bold' },
    empName: { fontSize: 14, fontWeight: '500', color: '#333' },
    empId: { fontSize: 11, color: '#999' },
    addButton: {
        backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 14,
        alignItems: 'center', marginTop: 10,
    },
    addButtonDisabled: { backgroundColor: '#E0E0E0' },
    addButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});

export default MembersScreen;
