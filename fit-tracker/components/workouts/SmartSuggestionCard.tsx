import { View, Text, StyleSheet } from 'react-native';
import { Plus, BookOpen, Sparkles } from 'lucide-react-native';
import { Colors, Fonts } from '@/constants/theme';
import { AnimatedStartButton } from '@/components/ui/AnimatedStartButton';
import { PressableScale } from '@/components/ui/PressableScale';
import { BODY_ICONS, DEFAULT_BODY_ICON } from '@/components/home/ActiveProgramCard';
import { MUSCLE_TO_BODYPART } from '@/lib/muscleMapping';
import { RECOVERY_COLORS } from '@/constants/recovery';
import { RP_VOLUME_LANDMARKS } from '@/constants/volumeLandmarks';
import type { SmartSuggestion } from '@/lib/smartWorkout';
import i18n from '@/lib/i18n';

interface SmartSuggestionCardProps {
  suggestion: SmartSuggestion;
  onGenerate: () => void;
  onCreateManual: () => void;
  onCreateProgram: () => void;
}

export function SmartSuggestionCard({
  suggestion,
  onGenerate,
  onCreateManual,
  onCreateProgram,
}: SmartSuggestionCardProps) {
  // ─── State: No History ───
  if (!suggestion.hasHistory) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{i18n.t('smartSuggestion.label')}</Text>

        <View style={styles.heroRow}>
          <View style={[styles.focusDot, { backgroundColor: Colors.primary }]} />
          <Text style={styles.heroText}>{i18n.t('smartSuggestion.firstSession')}</Text>
        </View>
        <Text style={styles.subtitle}>
          {i18n.t('smartSuggestion.firstSessionDesc')}
        </Text>

        <View style={styles.generateWrap}>
          <AnimatedStartButton
            onPress={onGenerate}
            label={i18n.t('smartSuggestion.generateSession')}
            loadingLabel={i18n.t('smartSuggestion.letsGo')}
            iconSize={16}
            icon={Sparkles}
          />
        </View>

        <View style={styles.actionRow}>
          <PressableScale style={styles.actionLink} activeScale={0.97} onPress={onCreateManual}>
            <Plus size={14} color={Colors.primary} strokeWidth={2.5} />
            <Text style={styles.actionLinkText}>{i18n.t('smartSuggestion.createManual')}</Text>
          </PressableScale>
          <PressableScale style={styles.actionLink} activeScale={0.97} onPress={onCreateProgram}>
            <BookOpen size={14} color={Colors.primary} strokeWidth={2} />
            <Text style={styles.actionLinkText}>{i18n.t('smartSuggestion.program')}</Text>
          </PressableScale>
        </View>
      </View>
    );
  }

  // ─── State: Rest Day ───
  if (suggestion.sessionType === 'rest') {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{i18n.t('smartSuggestion.label')}</Text>
        <View style={styles.heroRow}>
          <View style={[styles.focusDot, { backgroundColor: suggestion.sessionColor }]} />
          <Text style={styles.heroText}>{i18n.t('smartSuggestion.rest')}</Text>
        </View>
        {suggestion.nudge ? (
          <Text style={styles.nudge}>{suggestion.nudge}</Text>
        ) : null}
      </View>
    );
  }

  // ─── State: Active Suggestion ───
  const estimatedSets = suggestion.muscles.reduce((sum, m) => {
    const lm = RP_VOLUME_LANDMARKS[m.muscle];
    if (!lm) return sum;
    return sum + Math.min(Math.max(Math.floor(lm.mavLow / 2), 2), 6);
  }, 0);
  const estimatedMin = Math.round(estimatedSets * 2.5);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{i18n.t('smartSuggestion.label')}</Text>

      {/* Hero */}
      <View style={styles.heroRow}>
        <View style={[styles.focusDot, { backgroundColor: suggestion.sessionColor }]} />
        <Text style={styles.heroText}>{suggestion.sessionLabel}</Text>
      </View>

      {/* Meta line */}
      <Text style={styles.metaLine}>
        {i18n.t('smartSuggestion.summaryFormat', { muscles: suggestion.muscles.length, sets: estimatedSets, minutes: estimatedMin })}
      </Text>

      {/* Muscle rows */}
      {suggestion.muscles.length > 0 && (
        <View style={styles.muscleList}>
          {suggestion.muscles.slice(0, 3).map((m) => {
            const bp = MUSCLE_TO_BODYPART[m.muscle] || 'chest';
            const icon = BODY_ICONS[bp] || DEFAULT_BODY_ICON;
            return (
              <View key={m.muscle} style={styles.muscleRow}>
                <View style={[styles.muscleBadge, { backgroundColor: icon.bg }]}>
                  <icon.Icon size={12} color={icon.color} strokeWidth={2.5} />
                </View>
                <Text style={styles.muscleName}>{m.labelFr}</Text>
                <View style={[styles.recoveryDot, { backgroundColor: RECOVERY_COLORS[m.recoveryStatus] }]} />
                <Text style={[styles.zoneText, { color: m.zoneColor }]}>{m.zoneLabelShort}</Text>
              </View>
            );
          })}
          {suggestion.muscles.length > 3 && (
            <Text style={styles.moreText}>+{suggestion.muscles.length - 3} {i18n.t('common.musclesUnit')}</Text>
          )}
        </View>
      )}

      {/* Nudge */}
      {suggestion.nudge ? (
        <Text style={styles.nudge}>{suggestion.nudge}</Text>
      ) : null}

      {/* Generate button */}
      <View style={styles.generateWrap}>
        <AnimatedStartButton
          onPress={onGenerate}
          label={i18n.t('smartSuggestion.generateButton')}
          loadingLabel={i18n.t('common.generating')}
          iconSize={16}
          icon={Sparkles}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 12,
  },
  sectionLabel: {
    color: 'rgba(160,150,140,1)',
    fontSize: 11,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    letterSpacing: 1.5,
  },

  // Hero row — matches ActiveProgramCard sessionTitleRow
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  focusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  heroText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
  },

  // Meta line — matches ActiveProgramCard sessionMeta
  metaLine: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 12,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    paddingLeft: 16,
  },

  // Muscle list — matches ActiveProgramCard exercisePreviewList
  muscleList: {
    gap: 6,
    paddingLeft: 16,
  },
  muscleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  muscleBadge: {
    width: 24,
    height: 24,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  muscleName: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    flex: 1,
  },
  recoveryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  zoneText: {
    fontSize: 11,
    fontFamily: Fonts?.semibold,
    fontWeight: '600',
    minWidth: 30,
    textAlign: 'right',
  },
  moreText: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 11,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    paddingLeft: 32,
  },

  // Nudge
  nudge: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    fontStyle: 'italic',
    lineHeight: 18,
    paddingLeft: 16,
  },

  // Generate button
  generateWrap: {
    marginTop: 4,
  },

  // Subtitle (no-history state)
  subtitle: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
    lineHeight: 18,
    paddingLeft: 16,
  },

  // Action links (no-history state) — text only, no border/bg
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    paddingTop: 4,
  },
  actionLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  actionLinkText: {
    color: Colors.primary,
    fontSize: 13,
    fontFamily: Fonts?.medium,
    fontWeight: '500',
  },
});
