import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, Pressable, Text } from 'react-native';

// The visible face changes while the card is edge-on, so long text can size the card naturally.
export default function FlipCard({ flipped, onFlip, front, back, frontLabel, backLabel, cardStyle, labelStyle, textStyle, hintStyle }) {
  const rotation = useRef(new Animated.Value(0)).current;
  const [visibleBack, setVisibleBack] = useState(flipped);
  // Start without motion until the device preference is known.
  const [reduceMotion, setReduceMotion] = useState(true);

  useEffect(() => {
    let mounted = true;
    let subscription;
    let media;
    let onMediaChange;
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.matchMedia) {
      media = window.matchMedia('(prefers-reduced-motion: reduce)');
      onMediaChange = event => setReduceMotion(event.matches);
      setReduceMotion(media.matches);
      if (media.addEventListener) media.addEventListener('change', onMediaChange);
    } else {
      AccessibilityInfo.isReduceMotionEnabled().then(value => { if (mounted) setReduceMotion(value); }).catch(() => {});
      subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    }
    return () => {
      mounted = false;
      subscription?.remove();
      if (media?.removeEventListener) media.removeEventListener('change', onMediaChange);
    };
  }, []);

  useEffect(() => {
    rotation.stopAnimation();
    rotation.setValue(0);
    if (visibleBack === flipped) return undefined;
    if (reduceMotion) { setVisibleBack(flipped); return undefined; }
    const close = Animated.timing(rotation, { toValue: 90, duration: 140, easing: Easing.in(Easing.quad), useNativeDriver: true });
    close.start(({ finished }) => {
      if (!finished) return;
      setVisibleBack(flipped);
      rotation.setValue(-90);
      Animated.timing(rotation, { toValue: 0, duration: 160, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
    });
    return () => { rotation.stopAnimation(); };
  }, [flipped, reduceMotion, rotation]);

  const text = visibleBack ? back : front;
  const label = visibleBack ? backLabel : frontLabel;
  return <Pressable accessibilityRole="button" accessibilityLabel={`Flip flashcard. ${label}: ${text}`} accessibilityHint="Shows the other side" onPress={onFlip}>
    <Animated.View style={[cardStyle, { transform: [{ perspective: 1000 }, { rotateY: rotation.interpolate({ inputRange: [-90, 90], outputRange: ['-90deg', '90deg'] }) }] }]}>
      <Text style={labelStyle}>{label}</Text><Text style={textStyle}>{text}</Text><Text style={hintStyle || labelStyle}>↻  TAP TO FLIP</Text>
    </Animated.View>
  </Pressable>;
}
