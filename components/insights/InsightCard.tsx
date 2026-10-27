/**
 * InsightCard
 *
 * A card displaying a single AI-generated financial insight
 * or recommendation on the Financial Insights screen.
 *
 * Each card has:
 *  - A colored left accent strip based on severity
 *  - A severity icon
 *  - A title and description
 *  - An optional CTA link at the bottom
 *
 * Severity levels map to colors:
 *  - success: green (positive news)
 *  - warning: amber (something to watch)
 *  - info: blue (neutral information)
 *  - tip: primary green (actionable suggestion)
 *
 * Props:
 *  - insight: the Insight object to display
 *  - onCtaPress: called when the CTA link is tapped
 */

import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SHADOWS, SPACING } from '@/constants';
import { Insight, InsightSeverity } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface InsightCardProps {
  insight: Insight;
  onCtaPress?: () => void;
}

/**
 * Maps each severity level to a color and icon name.
 * Kept outside the component so it is not recreated
 * on every render.
 */
const SEVERITY_CONFIG: Record<
  InsightSeverity,
  { color: string; icon: string; background: string }
> = {
  success: {
    color: COLORS.success,
    icon: 'trending-up-outline',
    background: COLORS.primaryMuted,
  },
  warning: {
    color: COLORS.warning,
    icon: 'warning-outline',
    background: '#FEF3C7',
  },
  danger:{
    color:COLORS.danger,
    icon: 'warning-sharp',
    background:'#FEF3C7'
  },
  info: {
    color: COLORS.info,
    icon: 'information-circle-outline',
    background: '#DBEAFE',
  },
  tip: {
    color: COLORS.primary,
    icon: 'bulb-outline',
    background: COLORS.primaryMuted,
  },
};

export default function InsightCard({
  insight,
  onCtaPress,
}: InsightCardProps) {
  const config = SEVERITY_CONFIG[insight.severity];

  return (
    <View style={styles.card}>
      {/*
       * Left accent strip — a thin colored vertical bar
       * on the left edge of the card indicating severity.
       */}
      <View style={[styles.accentStrip, { backgroundColor: config.color }]} />

      {/* Card body */}
      <View style={styles.body}>
        {/* Icon and title row */}
        <View style={styles.titleRow}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: config.background },
            ]}
          >
            <Ionicons
              name={config.icon as any}
              size={18}
              color={config.color}
            />
          </View>
          <Text style={styles.title}>{insight.title}</Text>
        </View>

        {/* Description text */}
        <Text style={styles.description}>{insight.description}</Text>

        {/* Optional CTA link */}
        {insight.ctaLabel && (
          <TouchableOpacity
            onPress={onCtaPress}
            activeOpacity={0.7}
            style={styles.ctaButton}
          >
            <Text style={[styles.ctaText, { color: config.color }]}>
              {insight.ctaLabel}
            </Text>
            <Ionicons
              name="arrow-forward"
              size={14}
              color={config.color}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },

  /**
   * A 4px wide colored strip on the far left of the card.
   * overflow: 'hidden' on the card clips the rounded corners
   * so this strip follows the card's border radius cleanly.
   */
  accentStrip: {
    width: 4,
    borderTopLeftRadius: RADIUS.lg,
    borderBottomLeftRadius: RADIUS.lg,
  },

  body: {
    flex: 1,
    padding: SPACING.lg,
    gap: SPACING.sm,
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },

  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  title: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semiBold,
    color: COLORS.textPrimary,
    flex: 1,
  },

  description: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.regular,
    color: COLORS.textSecondary,
    lineHeight: FONT_SIZE.sm * 1.6,
  },

  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    marginTop: SPACING.xs,
  },

  ctaText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semiBold,
  },
});