import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import useReducedMotion from './useReducedMotion';

// A short entrance only; navigation and actions never wait for animation.
export default function Entrance({ children, fill = false }) {
  const reduced = useReducedMotion();
  const progress = useRef(new Animated.Value(reduced ? 1 : 0)).current;
  useEffect(() => {
    progress.stopAnimation();
    if (reduced) { progress.setValue(1); return undefined; }
    progress.setValue(0);
    const animation = Animated.timing(progress, { toValue: 1, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [progress, reduced]);
  return <Animated.View style={[fill && { flex: 1 }, { opacity: progress, transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }]}>{children}</Animated.View>;
}
