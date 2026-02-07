import { useState, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Modal } from 'react-native';
import { ChevronDown, Check, X } from 'lucide-react-native';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

interface FilterOption {
  label: string;
  value: string;
}

interface FilterConfig {
  key: string;
  label: string;
  options: FilterOption[];
}

interface FilterPillsProps {
  filters: FilterConfig[];
  activeFilters: Record<string, string | null>;
  onFilterChange: (key: string, value: string | null) => void;
}

export function FilterPills({ filters, activeFilters, onFilterChange }: FilterPillsProps) {
  const [openFilter, setOpenFilter] = useState<string | null>(null);

  const handlePillPress = useCallback((key: string) => {
    if (activeFilters[key]) {
      // Clear the filter
      onFilterChange(key, null);
    } else {
      setOpenFilter(prev => prev === key ? null : key);
    }
  }, [activeFilters, onFilterChange]);

  const handleOptionSelect = useCallback((key: string, value: string) => {
    onFilterChange(key, value);
    setOpenFilter(null);
  }, [onFilterChange]);

  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filters.map((filter) => {
          const isActive = !!activeFilters[filter.key];
          const activeOption = isActive
            ? filter.options.find(o => o.value === activeFilters[filter.key])
            : null;

          return (
            <Pressable
              key={filter.key}
              style={[styles.pill, isActive && styles.pillActive]}
              onPress={() => handlePillPress(filter.key)}
            >
              <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                {activeOption ? activeOption.label : filter.label}
              </Text>
              {isActive ? (
                <X
                  size={11}
                  color={Colors.primary}
                  strokeWidth={3}
                />
              ) : (
                <ChevronDown
                  size={12}
                  color="rgba(120, 120, 130, 1)"
                  strokeWidth={2.5}
                />
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Dropdown for open filter */}
      {openFilter && (
        <Animated.View
          entering={FadeIn.duration(150)}
          exiting={FadeOut.duration(100)}
          style={styles.dropdown}
        >
          {filters
            .find(f => f.key === openFilter)
            ?.options.map((option) => {
              const isSelected = activeFilters[openFilter] === option.value;
              return (
                <Pressable
                  key={option.value}
                  style={[styles.dropdownItem, isSelected && styles.dropdownItemActive]}
                  onPress={() => handleOptionSelect(openFilter, option.value)}
                >
                  <Text style={[styles.dropdownText, isSelected && styles.dropdownTextActive]}>
                    {option.label}
                  </Text>
                  {isSelected && (
                    <Check size={14} color={Colors.primary} strokeWidth={2.5} />
                  )}
                </Pressable>
              );
            })}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 14,
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  pillActive: {
    borderColor: 'rgba(255, 107, 53, 0.25)',
    backgroundColor: 'rgba(255, 107, 53, 0.06)',
  },
  pillText: {
    color: 'rgba(160, 160, 170, 1)',
    fontSize: 12,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  pillTextActive: {
    color: Colors.primary,
  },
  dropdown: {
    marginHorizontal: 24,
    marginTop: 8,
    backgroundColor: 'rgba(30, 30, 35, 0.98)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  dropdownItemActive: {
    backgroundColor: 'rgba(255, 107, 53, 0.06)',
  },
  dropdownText: {
    color: 'rgba(180, 180, 190, 1)',
    fontSize: 14,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  dropdownTextActive: {
    color: Colors.primary,
  },
});
