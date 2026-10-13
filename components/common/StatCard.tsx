
import {
  COLORS,
  FONT_SIZE,
  FONT_WEIGHT,
  RADIUS,
  SHADOWS,
  SPACING,
} from '@/constants';
import { formatCurrency } from '@/utils/formatters';
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

interface StatCardProps {
  label: string;
  func: () => void;
  summaryLoading: boolean;
  value: number | undefined;
  trend?: number | null;
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

        {trend != null && trend !== 0 ? (
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
                {
                  color: trendPositive
                    ? COLORS.primary
                    : COLORS.danger,
                },
              ]}
            >
              {`${trend > 0 ? '+' : ''}${trend.toFixed(0)}%`}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.valueContainer}>
        {summaryLoading ? (
          <ActivityIndicator
            size="small"
            color={COLORS.primary}
          />
        ) : (
          <Text style={styles.value}>
            {value != null ? formatCurrency(value) : '--'}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
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

  valueContainer: {
    height: 24,
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginTop: SPACING.xs,
  },

  value: {
    fontSize: FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
});
