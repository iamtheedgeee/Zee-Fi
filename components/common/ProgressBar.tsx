/**
 * ProgressBar
 *
 * A horizontal progress bar that fills from left to right
 * based on a percentage value between 0 and 100.
 *
 * Used on:
 *  - Budget screen: per-category spending progress
 *  - Dashboard: overall budget progress card
 *  - Dashboard: savings goal card
 *  - Insights: financial score bar
 *
 * The fill color changes based on the percentage to give
 * a visual warning when spending is high:
 *  - Under 75%: primary green (on track)
 *  - 75–90%: warning amber (approaching limit)
 *  - Over 90%: danger red (near or over limit)
 *
 * Props:
 *  - percent: number between 0 and 100
 *  - height: bar height in pixels (default 8)
 *  - overrideColor: skip automatic coloring and use this color
 */

import { COLORS, RADIUS } from '@/constants';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface ProgressBarProps {
  percent: number;
  height?: number;
  overrideColor?: string;
}

export default function ProgressBar({
  percent,
  height = 8,
  overrideColor,
}: ProgressBarProps) {
  /**
   * Clamp percent between 0 and 100 so the bar never
   * overflows its container even with bad data.
   */
  const clampedPercent = Math.min(100, Math.max(0, percent));

  /**
   * Automatically pick a fill color based on how close
   * spending is to the limit, unless overrideColor is given.
   */
  const fillColor =
    overrideColor ??
    (clampedPercent >= 90
      ? COLORS.danger
      : clampedPercent >= 75
      ? COLORS.warning
      : COLORS.primaryLight);

  return (
    <View style={[styles.track, { height }]}>
      <View
        style={[
          styles.fill,
          {
            width: `${clampedPercent}%`,
            backgroundColor: fillColor,
            height,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  /** The grey background track the fill sits inside */
  track: {
    width: '100%',
    backgroundColor: COLORS.border,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },

  /** The colored portion that grows based on percent */
  fill: {
    borderRadius: RADIUS.full,
  },
});