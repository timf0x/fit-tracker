import { useState, useEffect, useRef } from 'react';
import { View, Text, Animated, Easing } from 'react-native';
import Svg, { Circle as SvgCircle } from 'react-native-svg';
import { Fonts } from '@/constants/theme';

const AnimatedCircle = Animated.createAnimatedComponent(SvgCircle);

function getScoreColor(score: number): string {
  if (score >= 70) return '#22C55E';
  if (score >= 40) return '#FBBF24';
  return '#EF4444';
}

interface ScoreRingProps {
  score: number;
  size?: number;
}

export function ScoreRing({ score, size = 100 }: ScoreRingProps) {
  const strokeWidth = Math.max(4, Math.round(size * 0.08));
  const fontSize = Math.max(14, Math.round(size * 0.32));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  const scoreColor = getScoreColor(score);

  const progress = useRef(new Animated.Value(0)).current;
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    const listener = progress.addListener(({ value }) => {
      setDisplayScore(Math.round((value * score) / 100));
    });

    setTimeout(() => {
      Animated.timing(progress, {
        toValue: 100,
        duration: 1400,
        useNativeDriver: false,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      }).start();
    }, 300);

    return () => progress.removeListener(listener);
  }, [score]);

  const strokeDashoffset = progress.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, circumference * (1 - score / 100)],
    extrapolate: 'clamp',
  });

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <SvgCircle
          cx={center}
          cy={center}
          r={radius}
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          stroke={scoreColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          rotation={-90}
          origin={`${center}, ${center}`}
        />
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center' }}>
        <Text style={{
          fontSize,
          fontFamily: Fonts?.bold,
          fontWeight: '700',
          color: '#FFFFFF',
          letterSpacing: -1,
        }}>
          {displayScore}
        </Text>
      </View>
    </View>
  );
}
