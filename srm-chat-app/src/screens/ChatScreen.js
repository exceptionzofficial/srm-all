import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
    KeyboardAvoidingView, Platform, StatusBar, ActivityIndicator,
    Image, Alert, Modal, Dimensions, Keyboard
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { launchImageLibrary } from 'react-native-image-picker';
import { getMessages, sendMessage, sendMediaMessage, getGroupById, votePoll } from '../services/api';
import { COLORS, FONT_FAMILY } from '../utils/theme';
import TasksView from './TasksScreen'; // Importing the refactored TasksView

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ChatView = ({ groupId, currentUser, navigation }) => {
    const insets = useSafeAreaInsets();
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [imageViewerUrl, setImageViewerUrl] = useState(null);
    const flatListRef = useRef(null);
    const intervalRef = useRef(null);

    useEffect(() => {
        loadMessages();
        intervalRef.current = setInterval(loadMessages, 3000);
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, []);

    const loadMessages = async () => {
        try {
            const response = await getMessages(groupId);
            if (response.success) {
                setMessages(response.data);
                if (loading) setLoading(false);
            }
        } catch (error) {
            console.log('Error fetching messages:', error);
        }
    };

    const handleSend = async () => {
        if (!inputText.trim()) return;
        const text = inputText.trim();
        setInputText('');
        setSending(true);
        try {
            await sendMessage(groupId, {
                senderId: currentUser.employeeId,
                senderName: currentUser.name,
                content: text,
            });
            await loadMessages();
        } catch (error) {
            console.log('Error sending message:', error);
        } finally {
            setSending(false);
        }
    };

    const handlePickMedia = () => {
        launchImageLibrary(
            { mediaType: 'mixed', quality: 0.8, maxWidth: 1200, maxHeight: 1200 },
            async (response) => {
                if (response.didCancel || response.errorCode) return;
                const asset = response.assets?.[0];
                if (!asset) return;

                setSending(true);
                try {
                    const formData = new FormData();
                    formData.append('file', {
                        uri: asset.uri,
                        type: asset.type || 'image/jpeg',
                        name: asset.fileName || 'media.jpg',
                    });
                    formData.append('senderId', currentUser.employeeId);
                    formData.append('senderName', currentUser.name);
                    formData.append('content', '');

                    await sendMediaMessage(groupId, formData);
                    await loadMessages();
                } catch (error) {
                    console.log('Error sending media:', error);
                    Alert.alert('Error', 'Failed to send media');
                } finally {
                    setSending(false);
                }
            }
        );
    };

    const handleVote = async (messageId, optionIndex) => {
        try {
            await votePoll(groupId, messageId, currentUser.employeeId, optionIndex);
            loadMessages();
        } catch (error) {
            console.log('Error voting:', error);
        }
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        const date = timestamp._seconds ? new Date(timestamp._seconds * 1000) : new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const renderPoll = (item) => {
        const totalVotes = Object.values(item.pollData?.votes || {}).length;
        const myVote = item.pollData?.votes?.[currentUser.employeeId];

        return (
            <View style={styles.pollContainer}>
                <Text style={styles.pollQuestion}>{item.content}</Text>
                {item.pollData?.options?.map((option, idx) => {
                    const votesForOption = Object.values(item.pollData?.votes || {}).filter(v => v === idx).length;
                    const percentage = totalVotes === 0 ? 0 : Math.round((votesForOption / totalVotes) * 100);
                    const isSelected = myVote === idx;

                    return (
                        <TouchableOpacity
                            key={idx}
                            style={[styles.pollOption, isSelected && styles.pollOptionSelected]}
                            onPress={() => handleVote(item.id, idx)}
                        >
                            <View style={[styles.pollBar, { width: `${percentage}%` }]} />
                            <View style={styles.pollOptionContent}>
                                <Text style={styles.pollOptionText}>{option}</Text>
                                <Text style={styles.pollOptionCount}>{percentage}% ({votesForOption})</Text>
                            </View>
                        </TouchableOpacity>
                    );
                })}
                <Text style={styles.pollFooter}>{totalVotes} votes</Text>
            </View>
        );
    };

    const renderMedia = (item) => {
        if (item.type === 'image') {
            return (
                <TouchableOpacity onPress={() => setImageViewerUrl(item.fileUrl)}>
                    <Image source={{ uri: item.fileUrl }} style={styles.messageImage} resizeMode="cover" />
                    {item.content && item.content !== 'Sent an image' && (
                        <Text style={styles.mediaCaption}>{item.content}</Text>
                    )}
                </TouchableOpacity>
            );
        }
        if (item.type === 'video') {
            return (
                <TouchableOpacity style={styles.videoPlaceholder}>
                    <Icon name="play-circle-outline" size={48} color="#FFF" />
                    <Text style={styles.videoText}>Video</Text>
                </TouchableOpacity>
            );
        }
        return null;
    };

    const renderMessage = ({ item }) => {
        const isOwn = item.senderId === currentUser.employeeId;
        const isPoll = item.type === 'poll';
        const isMedia = item.type === 'image' || item.type === 'video';

        return (
            <View style={[
                styles.messageBubble,
                isOwn ? styles.ownMessage : styles.otherMessage,
                isPoll && styles.pollMessageBubble
            ]}>
                {!isOwn && <Text style={styles.senderName}>{item.senderName}</Text>}

                {isPoll ? renderPoll(item) :
                    isMedia ? renderMedia(item) :
                        <Text style={[styles.messageText, isOwn ? styles.ownMessageText : styles.otherMessageText]}>
                            {item.content}
                        </Text>
                }

                <Text style={[styles.timestamp, isOwn ? styles.ownTimestamp : styles.otherTimestamp]}>
                    {formatTime(item.timestamp)}
                </Text>
            </View>
        );
    };

    return (
        <View style={{ flex: 1 }}>
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.messagesList}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                    onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
                    ListEmptyComponent={
                        <View style={styles.emptyChat}>
                            <Icon name="chat" size={50} color="#ddd" />
                            <Text style={styles.emptyChatText}>No messages yet. Say hello!</Text>
                        </View>
                    }
                />
            )}

            {/* Input */}
            <View style={styles.inputContainer}>
                <TouchableOpacity style={styles.mediaBtn} onPress={handlePickMedia}>
                    <Icon name="image" size={24} color={COLORS.primary} />
                </TouchableOpacity>
                <TextInput
                    style={styles.input}
                    value={inputText}
                    onChangeText={setInputText}
                    placeholder="Type a message..."
                    placeholderTextColor="#999"
                    multiline
                />
                <TouchableOpacity
                    style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
                    onPress={handleSend}
                    disabled={!inputText.trim() || sending}
                >
                    {sending ? (
                        <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                        <Icon name="send" size={22} color="#FFF" />
                    )}
                </TouchableOpacity>
            </View>

            {/* Image Viewer Modal */}
            <Modal visible={!!imageViewerUrl} transparent animationType="fade">
                <View style={styles.imageViewerOverlay}>
                    <TouchableOpacity style={styles.imageViewerClose} onPress={() => setImageViewerUrl(null)}>
                        <Icon name="close" size={28} color="#FFF" />
                    </TouchableOpacity>
                    {imageViewerUrl && (
                        <Image source={{ uri: imageViewerUrl }} style={styles.fullImage} resizeMode="contain" />
                    )}
                </View>
            </Modal>
        </View>
    );
};

const ChatScreen = ({ route, navigation }) => {
    const insets = useSafeAreaInsets();
    const { groupId, groupName, currentUser } = route.params;
    const [activeTab, setActiveTab] = useState('chat'); // 'chat' or 'tasks'
    const [groupInfo, setGroupInfo] = useState(null);

    useEffect(() => {
        loadGroupDetails();
    }, []);

    const loadGroupDetails = async () => {
        try {
            const response = await getGroupById(groupId);
            if (response.success) setGroupInfo(response.data);
        } catch (error) {
            console.log('Error fetching group details:', error);
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Icon name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.headerTitleContainer}
                    onPress={() => navigation.navigate('GroupInfo', { groupId, groupName, currentUser })}
                >
                    <Image
                        source={require('../assets/srm-logo.png')}
                        style={styles.headerAvatarImage}
                        resizeMode="contain"
                    />
                    <View>
                        <Text style={styles.headerTitle} numberOfLines={1}>{groupName}</Text>
                        <Text style={styles.headerMembers}>
                            {groupInfo?.members ? `${groupInfo.members.length} members` : ''}
                        </Text>
                    </View>
                </TouchableOpacity>
                <Image
                    source={require('../assets/srm-logo.png')}
                    style={styles.headerLogo}
                    resizeMode="contain"
                />
            </View>

            {/* Tabs */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'chat' && styles.activeTab]}
                    onPress={() => setActiveTab('chat')}
                >
                    <Text style={[styles.tabText, activeTab === 'chat' && styles.activeTabText]}>Chat</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'tasks' && styles.activeTab]}
                    onPress={() => setActiveTab('tasks')}
                >
                    <Text style={[styles.tabText, activeTab === 'tasks' && styles.activeTabText]}>Tasks</Text>
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior="padding"
            >
                {activeTab === 'chat' ? (
                    <ChatView groupId={groupId} currentUser={currentUser} navigation={navigation} />
                ) : (
                    <TasksView groupId={groupId} groupName={groupName} currentUser={currentUser} />
                )}
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F7F8' },
    header: {
        flexDirection: 'row', alignItems: 'center', padding: 12,
        backgroundColor: '#FFF', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2,
    },
    backButton: { marginRight: 8, padding: 8, borderRadius: 20 },
    headerTitleContainer: { flex: 1, flexDirection: 'row', alignItems: 'center' },
    headerAvatarImage: {
        width: 36, height: 36, marginRight: 10,
        borderRadius: 18, backgroundColor: '#F5F5F5'
    },
    headerTitle: { fontSize: 16, fontFamily: FONT_FAMILY.bold, color: '#1A1A1A' },
    headerMembers: { fontSize: 12, fontFamily: FONT_FAMILY.regular, color: '#757575' },
    headerLogo: { width: 40, height: 40, marginLeft: 8 },

    // Tab Styles
    tabContainer: {
        flexDirection: 'row', paddingHorizontal: 16, backgroundColor: '#FFF',
        borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
    },
    tab: {
        marginRight: 24, paddingVertical: 14, borderBottomWidth: 2, borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: COLORS.primary,
    },
    tabText: {
        fontSize: 14, fontFamily: FONT_FAMILY.medium, color: '#9E9E9E',
    },
    activeTabText: {
        color: COLORS.primary, fontFamily: FONT_FAMILY.semiBold,
    },

    // Chat Styles
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    messagesList: { padding: 16, paddingBottom: 20 },
    messageBubble: {
        maxWidth: '75%', padding: 12, borderRadius: 16, marginBottom: 4,
        elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 1
    },
    ownMessage: {
        alignSelf: 'flex-end', backgroundColor: COLORS.primary,
        borderBottomRightRadius: 4, marginLeft: 40
    },
    otherMessage: {
        alignSelf: 'flex-start', backgroundColor: '#FFFFFF',
        borderBottomLeftRadius: 4, marginRight: 40, borderWidth: 1, borderColor: '#EEE'
    },
    pollMessageBubble: { width: '85%', maxWidth: '85%' },
    senderName: { fontSize: 11, color: '#757575', marginBottom: 4, fontFamily: FONT_FAMILY.bold, marginLeft: 2 },
    messageText: { fontSize: 15, lineHeight: 22, fontFamily: FONT_FAMILY.regular },
    ownMessageText: { color: '#FFF' },
    otherMessageText: { color: '#1A1A1A' },
    timestamp: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end', fontFamily: FONT_FAMILY.medium },
    ownTimestamp: { color: 'rgba(255,255,255,0.8)' },
    otherTimestamp: { color: '#9E9E9E' },
    messageImage: { width: SCREEN_WIDTH * 0.6, height: SCREEN_WIDTH * 0.45, borderRadius: 12 },
    mediaCaption: { fontSize: 13, marginTop: 6, color: '#333', fontFamily: FONT_FAMILY.regular },

    // Input
    inputContainer: {
        flexDirection: 'row', alignItems: 'center', padding: 10,
        backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F5F5F5',
    },
    mediaBtn: { padding: 10, marginRight: 4 },
    input: {
        flex: 1, backgroundColor: '#F8F9FA', borderRadius: 24,
        paddingHorizontal: 16, paddingVertical: 10, maxHeight: 100,
        marginRight: 10, color: '#1A1A1A', fontSize: 15, fontFamily: FONT_FAMILY.regular,
        borderWidth: 1, borderColor: '#EEE',
    },
    sendButton: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center',
        elevation: 2, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3
    },
    sendButtonDisabled: { backgroundColor: '#E0E0E0', elevation: 0, shadowOpacity: 0 },

    // Poll Styles
    pollContainer: { marginTop: 4 },
    pollQuestion: { fontSize: 15, fontFamily: FONT_FAMILY.bold, marginBottom: 10, color: '#1A1A1A' },
    pollOption: {
        marginBottom: 8, borderRadius: 10, borderWidth: 1, borderColor: '#EEEEEE',
        overflow: 'hidden', height: 40, justifyContent: 'center', backgroundColor: '#FAFAFA',
    },
    pollOptionSelected: { borderColor: COLORS.primary, backgroundColor: '#FFF5F5' },
    pollBar: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: 'rgba(239,65,54,0.1)' },
    pollOptionContent: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12, zIndex: 1 },
    pollOptionText: { fontSize: 13, color: '#333', fontFamily: FONT_FAMILY.medium },
    pollOptionCount: { fontSize: 11, fontFamily: FONT_FAMILY.bold, color: '#666' },
    pollFooter: { textAlign: 'right', fontSize: 11, color: '#9E9E9E', marginTop: 6, fontFamily: FONT_FAMILY.medium },

    emptyChat: { alignItems: 'center', marginTop: 100 },
    emptyChatText: { color: '#999', marginTop: 16, fontFamily: FONT_FAMILY.medium, fontSize: 16 },

    imageViewerOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.95)',
        justifyContent: 'center', alignItems: 'center',
    },
    imageViewerClose: { position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 10, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20 },
    fullImage: { width: '100%', height: '80%' },
});

export default ChatScreen;
