import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { Fonts } from '@/constants/theme';
import i18n from '@/lib/i18n';

interface ConfirmModalProps {
  visible: boolean;
  onClose: () => void;
  icon: React.ReactNode;
  iconBgColor?: string;
  title: string;
  description: string;
  cancelText?: string;
  confirmText: string;
  confirmColor?: string;
  onConfirm: () => void;
}

export function ConfirmModal({
  visible,
  onClose,
  icon,
  iconBgColor = 'rgba(239,68,68,0.12)',
  title,
  description,
  cancelText = i18n.t('common.cancel'),
  confirmText,
  confirmColor = '#EF4444',
  onConfirm,
}: ConfirmModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.content} onPress={(e) => e.stopPropagation()}>
          <View style={[styles.iconWrap, { backgroundColor: iconBgColor }]}>
            {icon}
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.desc}>{description}</Text>
          <View style={styles.actions}>
            <Pressable style={styles.cancel} onPress={onClose}>
              <Text style={styles.cancelText}>{cancelText}</Text>
            </Pressable>
            <Pressable
              style={[styles.confirm, { backgroundColor: confirmColor }]}
              onPress={onConfirm}
            >
              <Text style={styles.confirmText}>{confirmText}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  content: {
    backgroundColor: '#1C1C1E',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 28,
    alignItems: 'center',
    width: '100%',
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    marginTop: 16,
    textAlign: 'center',
  },
  desc: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 14,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 12,
    marginBottom: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 20,
  },
  cancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
  },
  cancelText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  confirm: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
});
