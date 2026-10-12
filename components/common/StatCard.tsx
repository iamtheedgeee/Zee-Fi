/**
 * StatCard
 *
 * A small card showing a single financial stat with a label
 * above and a value below. Used in the 2x2 stats grid on
 * the Dashboard screen showing:
 *  - Monthly Income
 *  - Monthly Expense
 *  - Daily Budget
 *  - Monthly Savings
 *
 * Props:
 *  - label: the small grey label text at the top
 *  - value: the main value to display (formatted string)
 *  - trend: optional percentage change string e.g. "+8%"
 *  - trendPositive: if true, trend shows in green; false shows red
 */

import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SHADOWS, SPACING } from '@/constants';
import { formatCurrency } from '@/utils/formatters';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
interface StatCardProps {
  label: string;
  func:()=>void;
  summaryLoading:boolean;
  value: number|undefined;
  trend?: number|null;
  trendPositive?: boolean;
}

export default function StatCard({
  label,
  func,
  value,
  trend,
  summaryLoading,
  trendPositive = true,
}: StatCardProps) {
  return (
    <Pressable style={styles.card} onPress={func}>
      <View style={styles.topRow}>
        <Text style={styles.label}>{label}</Text>
        {trend ? (
          <View
            style={[
              styles.trendBadge,
              {
                backgroundColor: trendPositive
                  ? COLORS.primaryMuted
                  : '#FFE4E4',
              },
            ]}
          >
            <Text
              style={[
                styles.trendText,
                { color: trendPositive ? COLORS.primary : COLORS.danger },
              ]}
            >
              {`${trend>0?'+':''}${trend}%`}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Main value */}
      <Text style={styles.value}>{value?formatCurrency(value):'--'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    /**
     * Each StatCard takes up roughly half the row width.
     * The parent screen uses a 2-column flexWrap layout
     * so two cards sit side by side.
     */
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },

  label: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.regular,
    color: COLORS.textSecondary,
  },

  trendBadge: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },

  trendText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semiBold,
  },

  value: {
    fontSize: FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
    marginTop: SPACING.xs,
  },
});