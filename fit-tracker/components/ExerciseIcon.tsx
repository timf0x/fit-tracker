import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import {
  Dumbbell, Flame, Anchor, Mountain, Target, Zap, User, Footprints,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { BodyPart } from '@/types';
import { exercises } from '@/data/exercises';
import { getBodyPartColors, getCategoryIcon } from '@/constants/icons';

// ─── GIF Lookup (by lowercase exercise name) ───

const GIF_LOOKUP: Record<string, string> = {};
exercises.forEach(ex => {
  if (ex.gifUrl) {
    GIF_LOOKUP[ex.name.toLowerCase().trim()] = ex.gifUrl;
  }
});

// ─── Category icon mapping (kept minimal for CategoryIcon) ───

const CATEGORY_LUCIDE: Record<string, LucideIcon> = {
  flame: Flame,
  anchor: Anchor,
  mountain: Mountain,
  target: Target,
  zap: Zap,
  user: User,
  dumbbell: Dumbbell,
  footprints: Footprints,
};

// ─── ExerciseIcon ───

interface ExerciseIconProps {
  exerciseName?: string;
  bodyPart?: BodyPart | string;
  gifUrl?: string;
  size?: number;
  containerSize?: number;
  showBackground?: boolean;
  color?: string;
  backgroundColor?: string;
}

export function ExerciseIcon({
  exerciseName,
  bodyPart,
  gifUrl,
  size = 24,
  containerSize,
  showBackground = true,
  color,
  backgroundColor,
}: ExerciseIconProps) {
  const colors = bodyPart ? getBodyPartColors(bodyPart) : { color: '#ff7043', bgColor: 'rgba(255, 112, 67, 0.12)' };
  const iconColor = color || colors.color;
  const bgColor = backgroundColor || colors.bgColor;
  const container = containerSize || size * 2;
  const borderRadius = container / 2.8;

  // Resolve GIF URL: explicit prop > lookup by name
  const resolvedGif = gifUrl || (exerciseName ? GIF_LOOKUP[exerciseName.toLowerCase().trim()] : undefined);

  if (!showBackground) {
    if (resolvedGif) {
      return (
        <Image
          source={{ uri: resolvedGif }}
          style={{ width: size * 1.5, height: size * 1.5, borderRadius: size * 0.3 }}
          contentFit="cover"
          cachePolicy="disk"
          autoplay={true}
        />
      );
    }
    // Fallback: colored initial
    return (
      <View style={[styles.initialContainer, { width: size * 1.5, height: size * 1.5, borderRadius: size * 0.3, backgroundColor: bgColor }]}>
        <Text style={[styles.initialText, { fontSize: size * 0.6, color: iconColor }]}>
          {(exerciseName || 'E')[0].toUpperCase()}
        </Text>
      </View>
    );
  }

  if (resolvedGif) {
    return (
      <View
        style={[
          styles.container,
          {
            width: container,
            height: container,
            borderRadius,
            backgroundColor: 'rgba(255,255,255,0.04)',
            borderColor: `${iconColor}25`,
            overflow: 'hidden',
          },
        ]}
      >
        <Image
          source={{ uri: resolvedGif }}
          style={{ width: container, height: container }}
          contentFit="cover"
          cachePolicy="disk"
          autoplay={true}
        />
      </View>
    );
  }

  // Fallback: body-part colored initial
  return (
    <View
      style={[
        styles.container,
        {
          width: container,
          height: container,
          borderRadius,
          backgroundColor: bgColor,
          borderColor: `${iconColor}30`,
        },
      ]}
    >
      <Text style={[styles.initialText, { fontSize: container * 0.38, color: iconColor }]}>
        {(exerciseName || 'E')[0].toUpperCase()}
      </Text>
    </View>
  );
}

// ─── CategoryIcon (unchanged — uses Lucide) ───

interface CategoryIconProps {
  category: string;
  size?: number;
  containerSize?: number;
  showBackground?: boolean;
}

export function CategoryIcon({
  category,
  size = 24,
  containerSize,
  showBackground = true,
}: CategoryIconProps) {
  const iconInfo = getCategoryIcon(category);
  const IconComponent = CATEGORY_LUCIDE[iconInfo.icon] || Dumbbell;
  const container = containerSize || size * 2;

  if (!showBackground) {
    return <IconComponent size={size} color={iconInfo.color} strokeWidth={2} />;
  }

  return (
    <View
      style={[
        styles.container,
        {
          width: container,
          height: container,
          borderRadius: container / 3,
          backgroundColor: iconInfo.bgColor,
          borderColor: `${iconInfo.color}30`,
        },
      ]}
    >
      <IconComponent size={size} color={iconInfo.color} strokeWidth={2} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  initialContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialText: {
    fontFamily: 'PlusJakartaSans-Bold',
    textAlign: 'center',
  },
});

export default ExerciseIcon;
