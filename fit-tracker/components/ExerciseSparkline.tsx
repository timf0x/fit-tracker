import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Polyline, Circle, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { Fonts } from '@/constants/theme';
import { useWorkoutStore } from '@/stores/workoutStore';
import { getExerciseHistory } from '@/lib/progressiveOverload';

interface Props {
  exerciseId: string;
  width?: number;
  height?: number;
  metric?: 'bestWeight' | 'totalVolume' | 'bestReps';
}

export function ExerciseSparkline({
  exerciseId,
  width = 100,
  height = 32,
  metric = 'bestWeight',
}: Props) {
  const { history } = useWorkoutStore();

  const data = useMemo(
    () => getExerciseHistory(history, exerciseId, 8),
    [history, exerciseId]
  );

  const values = useMemo(
    () => data.map((d) => d[metric]),
    [data, metric]
  );

  // Need at least 2 points to draw a line
  if (values.length < 2) return null;

  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;

  // Padding inside the SVG
  const padX = 4;
  const padY = 4;
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;

  const points = values.map((v, i) => {
    const x = padX + (i / (values.length - 1)) * chartW;
    const y = padY + chartH - ((v - minVal) / range) * chartH;
    return { x, y };
  });

  const pointsStr = points.map((p) => `${p.x},${p.y}`).join(' ');
  const lastPoint = points[points.length - 1];
  const prevPoint = points[points.length - 2];

  // Determine trend color
  const lastVal = values[values.length - 1];
  const prevVal = values[values.length - 2];
  const isUp = lastVal > prevVal;
  const isFlat = lastVal === prevVal;
  const color = isFlat ? 'rgba(160,150,140,0.6)' : isUp ? '#4ADE80' : '#EF4444';

  // Format the latest value for display
  const displayVal =
    metric === 'bestWeight'
      ? `${lastVal}kg`
      : lastVal >= 1000
      ? `${(lastVal / 1000).toFixed(1)}t`
      : `${lastVal}kg`;

  return (
    <View style={styles.container}>
      <Svg width={width} height={height}>
        <Polyline
          points={pointsStr}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Glow dot on the latest point */}
        <Circle
          cx={lastPoint.x}
          cy={lastPoint.y}
          r={2.5}
          fill={color}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
