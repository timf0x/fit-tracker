import { View, Text, StyleSheet, Pressable, LayoutAnimation } from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  ChevronDown,
  Minus,
  Plus,
  Pencil,
  Info,
  Timer,
  TrendingUp,
  TrendingDown,
  Trash2,
  RotateCcw,
} from 'lucide-react-native';
import { Colors, Fonts } from '@/constants/theme';
import i18n from '@/lib/i18n';
import { formatWeight, getWeightUnitLabel } from '@/stores/settingsStore';
import { ExerciseIcon } from '@/components/ExerciseIcon';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { useEffect } from 'react';

// ─── Types ───

export interface ExerciseRowProps {
  // Identity
  index: number;
  exerciseName: string;
  exerciseIconName?: string;
  bodyPart: string;
  gifUrl?: string;

  // Layer 1 data
  sets: number;
  reps: number;
  minReps?: number;

  // Layer 2 data
  weight?: number;
  restTime?: number;
  setTime?: number;
  overloadAction?: 'bump' | 'hold' | 'drop' | 'none';
  overloadTip?: string;
  lastPerformance?: { weight: number; reps: number };

  // Editor (Layer 3)
  overloadMessages?: {
    bump?: string;
    drop?: string;
    hold?: string;
    suggestion?: string;
  };
  editorTip?: string;
  editorWeight?: number;
  repsLabel?: string;
  showMinRepsHint?: { min: number };

  // State
  isExpanded: boolean;
  isEditing: boolean;
  isLast: boolean;

  // Callbacks
  onToggleExpand: () => void;
  onToggleEdit: () => void;
  onEditField?: (field: string, delta: number) => void;
  onInfoPress?: () => void;
  onLongPress?: () => void;
  onRemove?: () => void;
  onReset?: () => void;
}

// ─── Stepper Sub-component ───

function EditorStepper({
  label,
  hint,
  value,
  field,
  onEditField,
}: {
  label: string;
  hint?: string;
  value: number;
  field: string;
  onEditField: (field: string, delta: number) => void;
}) {
  return (
    <View style={styles.editorRow}>
      <View>
        <Text style={styles.editorFieldLabel}>{label}</Text>
        {hint ? <Text style={styles.editorFieldHint}>{hint}</Text> : null}
      </View>
      <View style={styles.stepperRow}>
        <Pressable style={styles.stepperBtn} onPress={() => onEditField(field, -1)}>
          <Minus size={14} color="#fff" />
        </Pressable>
        <Text style={styles.stepperValue}>{value}</Text>
        <Pressable style={styles.stepperBtn} onPress={() => onEditField(field, 1)}>
          <Plus size={14} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

// ─── Overload dot color ───

const OVERLOAD_DOT: Record<string, string> = {
  bump: '#4ADE80',
  drop: '#FBBF24',
};

// ─── Main Component ───

export function ExerciseRow(props: ExerciseRowProps) {
  const {
    index,
    exerciseName,
    exerciseIconName,
    bodyPart,
    gifUrl,
    sets,
    reps,
    minReps,
    weight,
    restTime,
    setTime,
    overloadAction,
    overloadTip,
    lastPerformance,
    overloadMessages,
    editorTip,
    editorWeight,
    repsLabel,
    showMinRepsHint,
    isExpanded,
    isEditing,
    isLast,
    onToggleExpand,
    onToggleEdit,
    onEditField,
    onInfoPress,
    onLongPress,
    onRemove,
    onReset,
  } = props;

  // Chevron rotation animation
  const chevronRotation = useSharedValue(0);

  useEffect(() => {
    chevronRotation.value = withTiming(isExpanded || isEditing ? 1 : 0, { duration: 200 });
  }, [isExpanded, isEditing]);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(chevronRotation.value, [0, 1], [0, 180])}deg` }],
  }));

  // Reps display string
  const repsStr = minReps && minReps !== reps ? `${minReps}-${reps}` : `${reps}`;
  const repsSummary = `${sets}x${repsStr}`;

  // Overload dot color
  const dotColor = overloadAction ? OVERLOAD_DOT[overloadAction] : undefined;

  // Weight color for Layer 2
  const weightColor =
    overloadAction === 'bump' ? '#4ADE80' :
    overloadAction === 'drop' ? '#FBBF24' :
    Colors.primary;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onToggleExpand();
  };

  const handleLongPress = () => {
    if (onLongPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      onLongPress();
    }
  };

  const handleEditPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onToggleEdit();
  };

  const showLayer2 = isExpanded && !isEditing;
  const showLayer3 = isEditing;

  return (
    <View>
      {/* ─── Layer 1: Collapsed Row ─── */}
      <Pressable
        style={[
          styles.row,
          showLayer3 && styles.rowEditing,
        ]}
        onPress={handlePress}
        onLongPress={onLongPress ? handleLongPress : undefined}
      >
        {/* Number badge */}
        <View style={styles.numberBadge}>
          <Text style={styles.numberText}>
            {String(index + 1).padStart(2, '0')}
          </Text>
        </View>

        <ExerciseIcon
          exerciseName={exerciseIconName || exerciseName}
          bodyPart={bodyPart}
          gifUrl={gifUrl}
          size={20}
          containerSize={44}
        />

        <View style={styles.nameWrap}>
          <Text style={styles.name} numberOfLines={1}>
            {exerciseName}
          </Text>
        </View>

        {/* Reps summary — plain text, no pill */}
        <Text style={styles.repsSummary}>{repsSummary}</Text>

        {/* Overload dot */}
        {dotColor ? <View style={[styles.overloadDot, { backgroundColor: dotColor }]} /> : null}

        {/* Chevron */}
        <Animated.View style={chevronStyle}>
          <ChevronDown size={14} color="rgba(255,255,255,0.15)" strokeWidth={2} />
        </Animated.View>
      </Pressable>

      {/* ─── Layer 2: Expanded Detail ─── */}
      {showLayer2 && (
        <View style={styles.detailPanel}>
          {/* Weight */}
          {(weight ?? 0) > 0 && (
            <View style={styles.detailRow}>
              <Text style={[styles.detailIcon, { color: weightColor }]}>⚖</Text>
              <Text style={[styles.detailText, { color: weightColor }]}>
                {formatWeight(weight!)}{getWeightUnitLabel()}
                {overloadAction === 'bump' ? ' ↑' : overloadAction === 'drop' ? ' ↓' : ''}
              </Text>
            </View>
          )}

          {/* Rest time */}
          {(restTime ?? 0) > 0 && (
            <View style={styles.detailRow}>
              <Timer size={13} color="rgba(255,255,255,0.35)" />
              <Text style={styles.detailTextMuted}>
                {restTime}s {i18n.t('exerciseRow.restSuffix')}
              </Text>
            </View>
          )}

          {/* Last performance */}
          {lastPerformance && (
            <Text style={styles.lastPerfText}>
              {i18n.t('exerciseRow.lastTime')} : {lastPerformance.weight > 0 ? `${formatWeight(lastPerformance.weight)}${getWeightUnitLabel()} × ` : ''}{lastPerformance.reps} {i18n.t('common.reps')}
            </Text>
          )}

          {/* Overload tip */}
          {overloadTip && (
            <View style={styles.detailRow}>
              <TrendingUp size={13} color={Colors.primary} />
              <Text style={styles.tipText} numberOfLines={2}>{overloadTip}</Text>
            </View>
          )}

          {/* Action row */}
          <View style={styles.actionRow}>
            <Pressable style={styles.editButton} onPress={handleEditPress}>
              <Pencil size={13} color="rgba(255,255,255,0.5)" />
              <Text style={styles.editButtonText}>{i18n.t('common.modify')}</Text>
            </Pressable>
            {onInfoPress && (
              <Pressable style={styles.infoButton} onPress={onInfoPress} hitSlop={8}>
                <Info size={15} color="rgba(255,255,255,0.25)" />
              </Pressable>
            )}
          </View>
        </View>
      )}

      {/* ─── Layer 3: Editor ─── */}
      {showLayer3 && onEditField && (
        <View style={styles.editorPanel}>
          {/* Overload context banners */}
          {overloadMessages?.bump && overloadAction === 'bump' && (
            <View style={[styles.overloadBanner, { backgroundColor: 'rgba(74,222,128,0.08)', borderColor: 'rgba(74,222,128,0.15)' }]}>
              <TrendingUp size={12} color="#4ADE80" />
              <Text style={[styles.overloadBannerText, { color: '#4ADE80' }]}>{overloadMessages.bump}</Text>
            </View>
          )}
          {overloadMessages?.drop && overloadAction === 'drop' && (
            <View style={[styles.overloadBanner, { backgroundColor: 'rgba(251,191,36,0.08)', borderColor: 'rgba(251,191,36,0.15)' }]}>
              <TrendingDown size={12} color="#FBBF24" />
              <Text style={[styles.overloadBannerText, { color: '#FBBF24' }]}>{overloadMessages.drop}</Text>
            </View>
          )}
          {overloadMessages?.hold && overloadAction === 'hold' && (
            <View style={styles.overloadBanner}>
              <TrendingUp size={12} color={Colors.primary} />
              <Text style={styles.overloadBannerText}>{overloadMessages.hold}</Text>
            </View>
          )}
          {overloadMessages?.suggestion && overloadAction === 'none' && (
            <View style={styles.overloadBanner}>
              <TrendingUp size={12} color={Colors.primary} />
              <Text style={styles.overloadBannerText}>{overloadMessages.suggestion}</Text>
            </View>
          )}

          {/* Editor tip */}
          {editorTip && <Text style={styles.editorTip}>{editorTip}</Text>}

          {/* Steppers */}
          <EditorStepper
            label={i18n.t('exerciseRow.sets')}
            value={sets}
            field="sets"
            onEditField={onEditField}
          />
          <EditorStepper
            label={repsLabel || i18n.t('exerciseRow.reps')}
            hint={showMinRepsHint ? i18n.t('exerciseRow.minReps', { min: showMinRepsHint.min }) : undefined}
            value={reps}
            field="reps"
            onEditField={onEditField}
          />
          <EditorStepper
            label={i18n.t('exerciseRow.weight')}
            value={editorWeight ?? weight ?? 0}
            field="weight"
            onEditField={onEditField}
          />
          <EditorStepper
            label={i18n.t('exerciseRow.rest')}
            value={restTime ?? 0}
            field="restTime"
            onEditField={onEditField}
          />
          <EditorStepper
            label={i18n.t('exerciseRow.timePerSet')}
            value={setTime ?? 35}
            field="setTime"
            onEditField={onEditField}
          />

          {/* Remove button (custom workouts) */}
          {onRemove && (
            <Pressable style={styles.removeRow} onPress={onRemove}>
              <Trash2 size={12} color="#FF4B4B" />
              <Text style={styles.removeText}>{i18n.t('exerciseRow.remove')}</Text>
            </Pressable>
          )}

          {/* Reset button (program day) */}
          {onReset && (
            <Pressable style={styles.resetRow} onPress={onReset}>
              <RotateCcw size={12} color="rgba(255,255,255,0.4)" />
              <Text style={styles.resetText}>{i18n.t('exerciseRow.reset')}</Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Separator — only when fully collapsed and not last */}
      {!isExpanded && !isEditing && !isLast && <View style={styles.separator} />}
    </View>
  );
}

// ─── Styles ───

const styles = StyleSheet.create({
  // Layer 1 — collapsed row (56px+ height for gym fingers)
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    minHeight: 56,
  },
  rowEditing: {
    backgroundColor: 'rgba(255,107,53,0.04)',
    borderRadius: 14,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingHorizontal: 10,
    marginHorizontal: -10,
  },
  numberBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    color: 'rgba(120,120,130,1)',
    fontSize: 11,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
  },
  nameWrap: {
    flex: 1,
  },
  name: {
    color: '#fff',
    fontSize: 14,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  repsSummary: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  overloadDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },

  // Separator
  separator: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginLeft: 82,
  },

  // Layer 2 — expanded detail panel
  detailPanel: {
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.04)',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    marginLeft: 38,
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailIcon: {
    fontSize: 13,
  },
  detailText: {
    fontSize: 13,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },
  detailTextMuted: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  lastPerfText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 11,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  tipText: {
    color: 'rgba(255,107,53,0.7)',
    fontSize: 11,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    minHeight: 44,
  },
  editButtonText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  infoButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Layer 3 — editor panel
  editorPanel: {
    backgroundColor: 'rgba(255,107,53,0.04)',
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: 'rgba(255,107,53,0.15)',
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    padding: 14,
    marginHorizontal: -10,
    gap: 10,
  },
  overloadBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,107,53,0.1)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.2)',
  },
  overloadBannerText: {
    color: Colors.primary,
    fontSize: 12,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    flex: 1,
  },
  editorTip: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 11,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    marginBottom: 2,
  },
  editorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
  },
  editorFieldLabel: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  editorFieldHint: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 10,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    marginTop: 1,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepperBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: Fonts?.bold,
    fontWeight: '700',
    minWidth: 40,
    textAlign: 'center',
  },
  removeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    minHeight: 48,
  },
  removeText: {
    color: '#FF4B4B',
    fontSize: 13,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
  resetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    minHeight: 48,
  },
  resetText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
});
