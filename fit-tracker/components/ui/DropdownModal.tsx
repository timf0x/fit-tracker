import { View, Text, StyleSheet, Pressable, ScrollView, Modal } from 'react-native';
import { X, Check } from 'lucide-react-native';
import { Colors, Fonts } from '@/constants/theme';

interface DropdownModalProps {
  visible: boolean;
  title: string;
  options: { value: string; label: string }[];
  selected: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}

export function DropdownModal({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
}: DropdownModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <View style={styles.dropdownModal}>
          <View style={styles.dropdownHeader}>
            <Text style={styles.dropdownTitle}>{title}</Text>
            <Pressable onPress={onClose}>
              <X size={18} color={Colors.text} strokeWidth={2} />
            </Pressable>
          </View>
          <ScrollView style={{ maxHeight: 300 }}>
            {options.map((opt) => (
              <Pressable
                key={opt.value}
                style={[styles.dropdownOption, selected === opt.value && styles.dropdownOptionActive]}
                onPress={() => onSelect(opt.value)}
              >
                <Text style={[styles.dropdownOptionText, selected === opt.value && styles.dropdownOptionTextActive]}>
                  {opt.label}
                </Text>
                {selected === opt.value && <Check size={16} color={Colors.primary} strokeWidth={2.5} />}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Pressable>
    </Modal>
  );
}

export const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  dropdownModal: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: 'rgba(28,28,32,0.98)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  dropdownTitle: {
    color: Colors.text,
    fontSize: 16,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  dropdownOptionActive: {
    backgroundColor: 'rgba(255,107,53,0.06)',
  },
  dropdownOptionText: {
    color: 'rgba(180,180,190,1)',
    fontSize: 14,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  dropdownOptionTextActive: {
    color: Colors.primary,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },
});
