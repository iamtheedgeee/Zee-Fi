/**
 * ChartPlaceholder
 *
 * A placeholder component representing a chart area.
 *
 * Real charts require a third-party library like Victory Native
 * or React Native Chart Kit which we are not adding in this
 * phase. This placeholder maintains the correct visual space
 * so the screen layout matches the PDF, and clearly labels
 * itself as a placeholder for later implementation.
 *
 * For bar and line charts we render simple representative
 * bars/lines using View components so the screen looks
 * reasonably close to the design without a chart library.
 *
 * Props:
 *  - type: 'bar' | 'line' | 'donut'
 *  - title: chart title shown above the placeholder
 *  - height: height of the chart area (default 160)
 *  - data: optional data to render simple visual bars
 */

import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING } from '@/constants';
import { ChartDataPoint, DonutSlice } from '@/types';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface ChartPlaceholderProps {
  type: 'bar' | 'line' | 'donut';
  title?: string;
  height?: number;
  barData?: ChartDataPoint[];
  donutData?: DonutSlice[];
}

export default function ChartPlaceholder({
  type,
  title,
  height = 160,
  barData,
  donutData,
}: ChartPlaceholderProps) {
  return (
    <View style={styles.container}>
      {title ? <Text style={styles.title}>{title}</Text> : null}

      {type === 'bar' && barData && (
        <SimpleBarChart data={barData} height={height} />
      )}

      {type === 'line' && (
        <SimpleLineChart height={height} />
      )}

      {type === 'donut' && donutData && (
        <SimpleDonutLegend data={donutData} />
      )}

      {/*
       * TODO: Replace this entire component with a real chart
       * library implementation in a later phase.
       * Recommended library: victory-native or react-native-chart-kit
       */}
    </View>
  );
}

/**
 * Renders a very simple bar chart using View components.
 * Bars are scaled relative to the maximum value in the dataset.
 * This is NOT a real chart — just a visual approximation.
 */
function SimpleBarChart({
  data,
  height,
}: {
  data: ChartDataPoint[];
  height: number;
}) {
  const maxValue = Math.max(...data.map((d) => d.value));

  return (
    <View style={[styles.chartArea, { height }]}>
      {/* Bar columns */}
      <View style={styles.barsRow}>
        {data.map((point) => {
          const barHeight = (point.value / maxValue) * (height - 32);
          return (
            <View key={point.label} style={styles.barColumn}>
              <View
                style={[
                  styles.bar,
                  {
                    height: barHeight,
                    backgroundColor: COLORS.primary,
                  },
                ]}
              />
              <Text style={styles.barLabel}>{point.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

/**
 * Renders a simple squiggly line approximation using a
 * series of angled View elements.
 * This is a rough visual placeholder only.
 */
function SimpleLineChart({ height }: { height: number }) {
  return (
    <View style={[styles.chartArea, { height }]}>
      <View style={styles.linePlaceholder}>
        <Text style={styles.placeholderLabel}>
          Daily Spending Trend
        </Text>
        {/* Simple wave-like visual approximation */}
        <View style={styles.lineRow}>
          {[40, 60, 30, 80, 50, 70, 35].map((h, i) => (
            <View
              key={i}
              style={[
                styles.lineSegment,
                {
                  height: h,
                  backgroundColor: COLORS.primaryLight,
                  opacity: 0.6 + i * 0.05,
                },
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

/**
 * Renders a legend for the donut chart showing each
 * category with its color dot, label, and percentage.
 * The actual donut circle is approximated with a
 * simple colored ring View.
 */
function SimpleDonutLegend({ data }: { data: DonutSlice[] }) {
  return (
    <View style={styles.donutContainer}>
      {/* Approximate donut ring */}
      <View style={styles.donutRing}>
        <View style={styles.donutHole} />
      </View>

      {/* Legend items */}
      <View style={styles.legendList}>
        {data.map((slice) => (
          <View key={slice.label} style={styles.legendItem}>
            <View
              style={[
                styles.legendDot,
                { backgroundColor: slice.color },
              ]}
            />
            <Text style={styles.legendLabel}>{slice.label}</Text>
            <Text style={styles.legendPercent}>
              {slice.percentage}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.md,
  },

  title: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semiBold,
    color: COLORS.textPrimary,
  },

  chartArea: {
    backgroundColor: COLORS.inputBackground,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    justifyContent: 'flex-end',
  },

  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    flex: 1,
    paddingBottom: SPACING.lg,
  },

  barColumn: {
    alignItems: 'center',
    gap: SPACING.xs,
    flex: 1,
    paddingHorizontal: 2,
  },

  bar: {
    width: '70%',
    borderRadius: RADIUS.sm,
    minHeight: 4,
  },

  barLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
  },

  linePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  },

  placeholderLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
  },

  lineRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.sm,
    height: 60,
  },

  lineSegment: {
    width: 12,
    borderRadius: RADIUS.sm,
  },

  donutContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['2xl'],
    padding: SPACING.lg,
  },

  /** Approximate donut using a large circle with a hole */
  donutRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  donutHole: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.surface,
  },

  legendList: {
    flex: 1,
    gap: SPACING.sm,
  },

  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },

  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },

  legendLabel: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },

  legendPercent: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semiBold,
    color: COLORS.textPrimary,
  },
});