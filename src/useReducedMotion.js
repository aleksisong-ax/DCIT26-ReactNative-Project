import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

function initialPreference() {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  // Do not start motion on native until the preference is known.
  return true;
}

export default function useReducedMotion() {
  const [reduced, setReduced] = useState(initialPreference);
  useEffect(() => {
    let mounted = true;
    let subscription;
    let media;
    let onChange;
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.matchMedia) {
      media = window.matchMedia('(prefers-reduced-motion: reduce)');
      onChange = event => setReduced(event.matches);
      setReduced(media.matches);
      if (media.addEventListener) media.addEventListener('change', onChange);
    } else {
      AccessibilityInfo.isReduceMotionEnabled().then(value => { if (mounted) setReduced(value); }).catch(() => {});
      subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    }
    return () => {
      mounted = false;
      subscription?.remove();
      if (media?.removeEventListener) media.removeEventListener('change', onChange);
    };
  }, []);
  return reduced;
}
