import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Image,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useChatStore, ChatMessage } from '../../store/useChatStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Header } from '../../components/Header';
import { SubscriptionGate } from '../../components/SubscriptionGate';
import { ConfirmModal } from '../../components/ConfirmModal';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';
import { Send, Trash2, Smile, ShieldCheck, Crown } from 'lucide-react-native';

const QUICK_EMOJIS = ['🔥', '🚀', '💰', '📈', '👏', '💯', '🎯', '🙌'];

export default function ChatScreen() {
  const { user } = useAuthStore();
  const {
    messages,
    fetchMessages,
    sendMessage,
    deleteMessage,
    subscribeRealtime,
    unsubscribeRealtime,
    markAsRead,
    typingUsers,
  } = useChatStore();

  const [inputContent, setInputContent] = useState('');
  const [showEmojis, setShowEmojis] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ visible: boolean; messageId: string }>({
    visible: false,
    messageId: '',
  });

  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    fetchMessages();
    subscribeRealtime();
    markAsRead();
    return () => unsubscribeRealtime();
  }, []);

  const handleSend = async () => {
    if (!inputContent.trim() || !user) return;
    const textToSend = inputContent;
    setInputContent('');
    setShowEmojis(false);
    await sendMessage(user.id, textToSend);

    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleAddEmoji = (emoji: string) => {
    setInputContent((prev) => prev + emoji);
  };

  const confirmDelete = async () => {
    if (deleteModal.messageId && user) {
      await deleteMessage(deleteModal.messageId, user.id);
      setDeleteModal({ visible: false, messageId: '' });
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const renderMessageItem = ({ item }: { item: ChatMessage }) => {
    const isOwn = item.user_id === user?.id;
    const isModOrAdmin = user?.role === 'admin' || user?.role === 'moderator';
    const canDelete = isOwn || isModOrAdmin;

    return (
      <View style={[styles.msgRow, isOwn && styles.msgRowOwn]}>
        <Image
          source={{
            uri:
              item.user_profile?.avatar_url ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
          }}
          style={styles.avatar}
        />

        <View style={styles.msgBodyContainer}>
          <View style={styles.msgHeader}>
            <View style={styles.userNameRow}>
              <Text style={styles.userName}>
                {item.user_profile?.full_name || 'Membro VIP'}
              </Text>
              {item.user_profile?.role === 'admin' && (
                <View style={styles.adminBadge}>
                  <Crown size={10} color={COLORS.textDark} />
                  <Text style={styles.adminBadgeText}>ADMIN</Text>
                </View>
              )}
            </View>
            <Text style={styles.msgTime}>{formatTime(item.created_at)}</Text>
          </View>

          <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
            <Text style={[styles.msgText, isOwn && styles.msgTextOwn]}>
              {item.content}
            </Text>
          </View>
        </View>

        {canDelete && (
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => setDeleteModal({ visible: true, messageId: item.id })}
          >
            <Trash2 size={14} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SubscriptionGate>
      <View style={styles.container}>
        <Header subtitle="Chat Privado para Membros (Discord-Style)" />

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          {/* Chat Messages List */}
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessageItem}
            contentContainerStyle={styles.listContent}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />

          {/* Typing Indicator */}
          {typingUsers.length > 0 && (
            <View style={styles.typingContainer}>
              <Text style={styles.typingText}>
                {typingUsers.join(', ')} {typingUsers.length === 1 ? 'está' : 'estão'} digitando...
              </Text>
            </View>
          )}

          {/* Quick Emoji Bar */}
          {showEmojis && (
            <View style={styles.emojiBar}>
              {QUICK_EMOJIS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  onPress={() => handleAddEmoji(emoji)}
                  style={styles.emojiBtn}
                >
                  <Text style={styles.emojiText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Input Bar */}
          <View style={styles.inputContainer}>
            <TouchableOpacity
              onPress={() => setShowEmojis(!showEmojis)}
              style={styles.iconBtn}
            >
              <Smile size={24} color={COLORS.gold} />
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              placeholder="Digite sua mensagem no chat VIP..."
              placeholderTextColor={COLORS.textMuted}
              value={inputContent}
              onChangeText={setInputContent}
              multiline
            />

            <TouchableOpacity onPress={handleSend} style={styles.sendBtn}>
              <Send size={18} color={COLORS.textDark} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          visible={deleteModal.visible}
          title="Excluir Mensagem"
          message="Tem certeza que deseja apagar esta mensagem do chat?"
          confirmText="Excluir"
          cancelText="Cancelar"
          isDanger
          onConfirm={confirmDelete}
          onCancel={() => setDeleteModal({ visible: false, messageId: '' })}
        />
      </View>
    </SubscriptionGate>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
  msgRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.xs,
  },
  msgRowOwn: {
    flexDirection: 'row-reverse',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  msgBodyContainer: {
    maxWidth: '75%',
  },
  msgHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    gap: 8,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  userName: {
    color: COLORS.goldLight,
    fontSize: 13,
    fontWeight: '700',
  },
  adminBadge: {
    backgroundColor: COLORS.gold,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  adminBadgeText: {
    color: COLORS.textDark,
    fontSize: 8,
    fontWeight: '900',
  },
  msgTime: {
    color: COLORS.textMuted,
    fontSize: 10,
  },
  bubble: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  bubbleOther: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  bubbleOwn: {
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.goldDark,
  },
  msgText: {
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 19,
  },
  msgTextOwn: {
    color: COLORS.text,
  },
  deleteBtn: {
    padding: 6,
    alignSelf: 'center',
  },
  typingContainer: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
  },
  typingText: {
    color: COLORS.gold,
    fontSize: 12,
    fontStyle: 'italic',
  },
  emojiBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: COLORS.surfaceElevated,
    paddingVertical: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceBorder,
  },
  emojiBtn: {
    padding: 4,
  },
  emojiText: {
    fontSize: 22,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceBorder,
    gap: SPACING.xs,
  },
  iconBtn: {
    padding: SPACING.xs,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    backgroundColor: COLORS.surfaceElevated,
    color: COLORS.text,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    fontSize: 15,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
