import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    ActivityIndicator, Alert, TextInput, Image
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { getGroupById, updateGroup, getEmployees } from '../services/api';
import { COLORS, FONT_FAMILY } from '../utils/theme';

const TasksView = (props) => {
    const insets = useSafeAreaInsets();
    const navigation = props.navigation || useNavigation(); // Ensure we have navigation
    const route = props.route;
    const isStandalone = !!route; // If route is passed, it's a screen

    // Extract params from props (if embedded) or route.params (if screen)
    const groupId = props.groupId || route?.params?.groupId;
    const groupName = props.groupName || route?.params?.groupName;
    const currentUser = props.currentUser || route?.params?.currentUser;

    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [employees, setEmployees] = useState([]);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [adding, setAdding] = useState(false);

    const loadData = async () => {
        try {
            const [groupRes, empRes] = await Promise.all([
                getGroupById(groupId),
                getEmployees()
            ]);

            if (groupRes.success) {
                // Merge pinned 'task' string into tasks array if it exists and isn't already there
                let currentTasks = groupRes.data?.tasks || [];
                if (groupRes.data?.task && !currentTasks.some(t => t.title === groupRes.data.task)) {
                    // Option: Treat the pinned task as a regular task, or keep separate. 
                    // For now, let's just use the array.
                    // If array is empty but pinned task exists, migrate it?
                    // Let's just stick to the array.
                }
                setTasks(currentTasks);
            }
            setEmployees(empRes.employees || []);
        } catch (error) {
            console.log('Error loading tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [groupId])
    );

    const handleAddTask = async () => {
        if (!newTaskTitle.trim()) return;
        setAdding(true);
        try {
            const newTask = {
                id: Date.now().toString(),
                title: newTaskTitle.trim(),
                status: 'pending',
                assigneeId: null,
                createdAt: new Date(),
                createdBy: currentUser.employeeId
            };
            const updatedTasks = [newTask, ...tasks];

            // Initial update
            await updateGroup(groupId, { tasks: updatedTasks });
            setTasks(updatedTasks);
            setNewTaskTitle('');
        } catch (error) {
            console.log('Error adding task:', error);
            Alert.alert('Error', 'Failed to add task');
        } finally {
            setAdding(false);
        }
    };





    const getAssigneeName = (assigneeId) => {
        if (!assigneeId) return 'Unassigned';
        const emp = employees.find(e => e.employeeId === assigneeId);
        return emp?.name || assigneeId;
    };

    const renderTask = ({ item }) => {
        const isCompleted = item.status === 'completed';

        return (
            <View style={[styles.taskCard, isCompleted && styles.taskCompleted]}>
                <View style={styles.taskContent}>
                    <Text style={[styles.taskTitle, isCompleted && styles.taskTitleCompleted]}>
                        {item.title}
                    </Text>
                    <View style={styles.taskMeta}>
                        <View style={styles.taskMetaItem}>
                            <Icon name="person-outline" size={14} color="#888" />
                            <Text style={styles.taskMetaText}>{getAssigneeName(item.assigneeId)}</Text>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, isStandalone && { paddingTop: insets.top }]}>
            {isStandalone && (
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Icon name="arrow-back" size={24} color="#000" />
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.headerTitle}>Tasks</Text>
                        <Text style={styles.headerSubtitle}>{groupName}</Text>
                    </View>
                    <Image
                        source={require('../assets/srm-logo.png')}
                        style={styles.headerLogo}
                        resizeMode="contain"
                    />
                </View>
            )}
            {currentUser?.role === 'admin' && (
                <View style={styles.addTaskContainer}>
                    <TextInput
                        style={styles.addTaskInput}
                        placeholder="Add a new task..."
                        value={newTaskTitle}
                        onChangeText={setNewTaskTitle}
                        placeholderTextColor="#999"
                    />
                    <TouchableOpacity
                        style={[styles.addTaskButton, !newTaskTitle.trim() && styles.addTaskButtonDisabled]}
                        onPress={handleAddTask}
                        disabled={!newTaskTitle.trim() || adding}
                    >
                        {adding ? (
                            <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                            <Icon name="add" size={24} color="#FFF" />
                        )}
                    </TouchableOpacity>
                </View>
            )}

            <FlatList
                data={tasks}
                renderItem={renderTask}
                keyExtractor={item => item.id}
                contentContainerStyle={[styles.listContent, { paddingBottom: 80 + insets.bottom }]}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Icon name="assignment" size={60} color="#ddd" />
                        <Text style={styles.emptyText}>No tasks yet</Text>
                        <Text style={styles.emptySubText}>Add a task to get started</Text>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F7F8' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { padding: 16 },
    header: {
        flexDirection: 'row', alignItems: 'center', padding: 15,
        backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
    },
    backBtn: { marginRight: 12, padding: 4 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#000' },
    headerSubtitle: { fontSize: 12, color: '#999' },
    headerLogo: { width: 40, height: 40, marginLeft: 8 },

    // Add Task Styles
    addTaskContainer: {
        flexDirection: 'row', padding: 16, backgroundColor: '#FFF',
        borderBottomWidth: 1, borderBottomColor: '#F5F5F5', alignItems: 'center',
        elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3,
    },
    addTaskInput: {
        flex: 1, backgroundColor: '#F9F9F9', borderRadius: 12, paddingHorizontal: 16,
        paddingVertical: 12, fontSize: 15, fontFamily: FONT_FAMILY.regular, marginRight: 12, color: '#1A1A1A',
        borderWidth: 1, borderColor: '#EEE',
    },
    addTaskButton: {
        width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.primary,
        justifyContent: 'center', alignItems: 'center', elevation: 3,
        shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3,
    },
    addTaskButtonDisabled: { backgroundColor: '#E0E0E0', elevation: 0, shadowOpacity: 0 },

    taskCard: {
        flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 16,
        padding: 16, marginBottom: 12, elevation: 1,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2,
        borderWidth: 1, borderColor: '#FAFAFA', alignItems: 'flex-start',
    },
    taskCompleted: { backgroundColor: '#F9F9F9', borderColor: '#F0F0F0' },
    taskCheckbox: { marginRight: 16, marginTop: 2 },
    taskContent: { flex: 1 },
    taskTitle: { fontSize: 16, fontFamily: FONT_FAMILY.medium, color: '#1A1A1A', marginBottom: 6, lineHeight: 22 },
    taskTitleCompleted: { textDecorationLine: 'line-through', color: '#9E9E9E' },
    taskMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    taskMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F5F5F5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    taskMetaText: { fontSize: 12, fontFamily: FONT_FAMILY.medium, color: '#757575' },

    emptyContainer: { alignItems: 'center', marginTop: 100 },
    emptyText: { fontSize: 18, fontFamily: FONT_FAMILY.semiBold, color: '#424242', marginTop: 16 },
    emptySubText: { fontSize: 14, fontFamily: FONT_FAMILY.regular, color: '#9E9E9E', marginTop: 8 },
});

export default TasksView;
