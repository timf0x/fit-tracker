import { View, StyleSheet } from 'react-native';
import {
  Dumbbell, ArrowLeft, ArrowDown, ArrowUp, ArrowRight,
  ArrowDownCircle, Expand, MoveHorizontal, RefreshCw,
  Eye, ChevronUp, ChevronDown, TrendingUp, TrendingDown,
  Infinity, Hand, Grid2x2, Hammer, Skull, Diamond,
  Layers, Footprints, Circle, Minus, ChevronsUp,
  Target, Bug, Triangle, Bike, User, Activity,
  Waves, Ship, Link, Box, Zap,
  Flame, Anchor, Mountain, GripHorizontal,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { BodyPart } from '@/types';
import { getExerciseIcon, getBodyPartColors, getCategoryIcon } from '@/constants/icons';

const LUCIDE_MAP: Record<string, LucideIcon> = {
  'dumbbell': Dumbbell,
  'arrow-left': ArrowLeft,
  'arrow-down': ArrowDown,
  'arrow-up': ArrowUp,
  'arrow-right': ArrowRight,
  'arrow-down-circle': ArrowDownCircle,
  'expand': Expand,
  'move-horizontal': MoveHorizontal,
  'refresh-cw': RefreshCw,
  'eye': Eye,
  'chevron-up': ChevronUp,
  'chevron-down': ChevronDown,
  'trending-up': TrendingUp,
  'trending-down': TrendingDown,
  'infinity': Infinity,
  'hand': Hand,
  'grid-2x2': Grid2x2,
  'hammer': Hammer,
  'skull': Skull,
  'diamond': Diamond,
  'layers': Layers,
  'footprints': Footprints,
  'circle': Circle,
  'minus': Minus,
  'chevrons-up': ChevronsUp,
  'target': Target,
  'bug': Bug,
  'triangle': Triangle,
  'bike': Bike,
  'user': User,
  'activity': Activity,
  'waves': Waves,
  'ship': Ship,
  'link': Link,
  'box': Box,
  'zap': Zap,
  'flame': Flame,
  'anchor': Anchor,
  'mountain': Mountain,
  'grip-horizontal': GripHorizontal,
};

function getLucideComponent(iconName: string): LucideIcon {
  return LUCIDE_MAP[iconName] || Dumbbell;
}

interface ExerciseIconProps {
  exerciseName?: string;
  bodyPart?: BodyPart | string;
  size?: number;
  containerSize?: number;
  showBackground?: boolean;
  color?: string;
  backgroundColor?: string;
}

export function ExerciseIcon({
  exerciseName,
  bodyPart,
  size = 24,
  containerSize,
  showBackground = true,
  color,
  backgroundColor,
}: ExerciseIconProps) {
  const iconName = exerciseName ? getExerciseIcon(exerciseName) : 'dumbbell';
  const colors = bodyPart ? getBodyPartColors(bodyPart) : { color: '#ff7043', bgColor: 'rgba(255, 112, 67, 0.12)' };
  const IconComponent = getLucideComponent(iconName);

  const iconColor = color || colors.color;
  const bgColor = backgroundColor || colors.bgColor;
  const container = containerSize || size * 2;

  if (!showBackground) {
    return <IconComponent size={size} color={iconColor} strokeWidth={2} />;
  }

  return (
    <View
      style={[
        styles.container,
        {
          width: container,
          height: container,
          borderRadius: container / 3,
          backgroundColor: bgColor,
          borderColor: `${iconColor}30`,
        },
      ]}
    >
      <IconComponent size={size} color={iconColor} strokeWidth={2} />
    </View>
  );
}

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
  const IconComponent = getLucideComponent(iconInfo.icon);
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
});

export default ExerciseIcon;
