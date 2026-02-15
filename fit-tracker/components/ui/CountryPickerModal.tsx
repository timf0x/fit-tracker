import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  FlatList,
  TextInput,
} from 'react-native';
import { X, Search } from 'lucide-react-native';
import { Colors, Fonts, GlassStyle, IconStroke } from '@/constants/theme';
import i18n from '@/lib/i18n';
import { COUNTRY_CODES, type CountryCode } from '@/data/countryCodes';

interface Props {
  visible: boolean;
  selected: string; // ISO code
  onSelect: (code: string) => void;
  onClose: () => void;
}

export function CountryPickerModal({ visible, selected, onSelect, onClose }: Props) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return COUNTRY_CODES;
    const q = search.toLowerCase();
    return COUNTRY_CODES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.nameFr.toLowerCase().includes(q) ||
        c.dialCode.includes(q) ||
        c.code.toLowerCase().includes(q),
    );
  }, [search]);

  const renderItem = ({ item }: { item: CountryCode }) => {
    const isSelected = item.code === selected;
    const displayName = i18n.locale === 'fr' ? item.nameFr : item.name;
    return (
      <Pressable
        style={[styles.row, isSelected && styles.rowSelected]}
        onPress={() => {
          onSelect(item.code);
          setSearch('');
          onClose();
        }}
      >
        <Text style={styles.flag}>{item.flag}</Text>
        <Text
          style={[styles.countryName, isSelected && styles.countryNameSelected]}
          numberOfLines={1}
        >
          {displayName}
        </Text>
        <Text style={[styles.dialCode, isSelected && styles.dialCodeSelected]}>
          {item.dialCode}
        </Text>
      </Pressable>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{i18n.t('profileSetup.selectCountry')}</Text>
            <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={12}>
              <X size={20} color="#fff" strokeWidth={IconStroke.default} />
            </Pressable>
          </View>

          {/* Search */}
          <View style={styles.searchWrap}>
            <Search size={16} color="rgba(120,120,130,1)" strokeWidth={IconStroke.default} />
            <TextInput
              style={styles.searchInput}
              placeholder={i18n.t('profileSetup.searchCountry')}
              placeholderTextColor="rgba(100,100,110,1)"
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
              autoCapitalize="none"
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch('')} hitSlop={8}>
                <X size={14} color="rgba(120,120,130,1)" strokeWidth={IconStroke.default} />
              </Pressable>
            )}
          </View>

          {/* List */}
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.code}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.listContent}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    height: '80%',
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    color: '#fff',
    padding: 0,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 40,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    minHeight: 56,
    gap: 14,
  },
  rowSelected: {
    backgroundColor: 'rgba(255,107,53,0.08)',
  },
  flag: {
    fontSize: 22,
  },
  countryName: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  countryNameSelected: {
    color: Colors.primary,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  dialCode: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  dialCodeSelected: {
    color: Colors.primary,
  },
});
