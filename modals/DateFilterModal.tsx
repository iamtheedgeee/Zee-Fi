/**
 * DateFilterModal
 *
 * A bottom sheet modal for filtering transactions by date.
 * Offers quick preset buttons and a custom date range input.
 *
 * The modal is purely presentational — it calls onApply
 * with a DateFilter object and the parent screen decides
 * what to do with it. This keeps the filtering logic
 * co-located with the transaction list rather than buried
 * inside a modal.
 */

import {
    COLORS,
    FONT_SIZE,
    FONT_WEIGHT,
    RADIUS,
    SHADOWS,
    SPACING,
} from '@/constants';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────

export type DatePreset =
  | 'all'
  | 'today'
  | 'this_week'
  | 'this_month'
  | 'custom';

export interface DateFilter {
  preset: DatePreset;
  /**
   * ISO date strings (YYYY-MM-DD).
   * startDate and endDate are only meaningful when
   * preset is 'custom', but are always present for
   * convenience so the caller never has to null-check.
   */
  startDate: string;
  endDate: string;
  /** Human-readable label shown on the filter button */
  label: string;
}

interface DateFilterModalProps {
  visible: boolean;
  onClose: () => void;
  /** Called when the user taps Apply */
  onApply: (filter: DateFilter) => void;
  /** The currently active filter so the modal opens pre-selected */
  currentFilter: DateFilter;
}

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────

/** Returns today's date as a YYYY-MM-DD string */
function today(): string {
  return new Date().toISOString().split('T')[0];
}

/** Returns the date n days ago as YYYY-MM-DD */
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

/** Returns the first day of the current month as YYYY-MM-DD */
function startOfMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

/** Returns the Monday of the current week as YYYY-MM-DD */
function startOfWeek(): string {
  const d = new Date();
  const day = d.getDay(); // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day; // adjust to Monday
  d.setDate(d.getDate() + diff);
  return d.toISOString().split('T')[0];
}

/**
 * Builds a complete DateFilter from a preset.
 * Centralised here so the same date calculation logic
 * is always used, whether triggered from the modal or
 * from external code.
 */
export function buildPresetFilter(preset: DatePreset): DateFilter {
  switch (preset) {
    case 'today':
      return {
        preset,
        startDate: today(),
        endDate: today(),
        label: 'Today',
      };
    case 'this_week':
      return {
        preset,
        startDate: startOfWeek(),
        endDate: today(),
        label: 'This Week',
      };
    case 'this_month':
      return {
        preset,
        startDate: startOfMonth(),
        endDate: today(),
        label: 'This Month',
      };
    case 'all':
    default:
      return {
        preset: 'all',
        startDate: '2000-01-01',
        endDate: '2099-12-31',
        label: 'All Time',
      };
  }
}

/**
 * Validates that a string looks like YYYY-MM-DD.
 * Does not check calendar validity (e.g. Feb 30)
 * but catches obvious typos.
 */
function isValidDate(str: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(str);
}

// ─────────────────────────────────────────────────────────
// Preset config — drives the preset buttons
// ─────────────────────────────────────────────────────────

const PRESETS: { id: DatePreset; label: string; icon: string }[] = [
  { id: 'all',        label: 'All Time',   icon: 'infinite-outline' },
  { id: 'today',      label: 'Today',      icon: 'today-outline' },
  { id: 'this_week',  label: 'This Week',  icon: 'calendar-outline' },
  { id: 'this_month', label: 'This Month', icon: 'calendar-number-outline' },
  { id: 'custom',     label: 'Custom',     icon: 'options-outline' },
];

// ─────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────

export default function DateFilterModal({
  visible,
  onClose,
  onApply,
  currentFilter,
}: DateFilterModalProps) {
  /**
   * Local state mirrors the current filter when the modal opens.
   * Changes here don't affect the parent until Apply is tapped.
   */
  const [selectedPreset, setSelectedPreset] = useState<DatePreset>(
    currentFilter.preset
  );
  const [customStart, setCustomStart] = useState(currentFilter.startDate);
  const [customEnd, setCustomEnd] = useState(currentFilter.endDate);
  const [startError, setStartError] = useState('');
  const [endError, setEndError] = useState('');

  // Reset local state to current filter when modal opens
  function handleOpen() {
    setSelectedPreset(currentFilter.preset);
    setCustomStart(currentFilter.startDate);
    setCustomEnd(currentFilter.endDate);
    setStartError('');
    setEndError('');
  }

  function handlePresetSelect(preset: DatePreset) {
    setSelectedPreset(preset);
    setStartError('');
    setEndError('');

    // Pre-fill the custom date inputs when switching to custom
    // so the user sees a sensible starting range
    if (preset === 'custom') {
      setCustomStart(startOfMonth());
      setCustomEnd(today());
    }
  }

  function validate(): boolean {
    let valid = true;

    if (selectedPreset === 'custom') {
      if (!isValidDate(customStart)) {
        setStartError('Enter a valid date (YYYY-MM-DD)');
        valid = false;
      } else {
        setStartError('');
      }

      if (!isValidDate(customEnd)) {
        setEndError('Enter a valid date (YYYY-MM-DD)');
        valid = false;
      } else {
        setEndError('');
      }

      if (valid && customStart > customEnd) {
        setEndError('End date must be on or after start date.');
        valid = false;
      }
    }

    return valid;
  }

  function handleApply() {
    if (!validate()) return;

    let filter: DateFilter;

    if (selectedPreset === 'custom') {
      filter = {
        preset: 'custom',
        startDate: customStart,
        endDate: customEnd,
        label: `${customStart}  →  ${customEnd}`,
      };
    } else {
      filter = buildPresetFilter(selectedPreset);
    }

    onApply(filter);
    onClose();
  }

  function handleClear() {
    const allTime = buildPresetFilter('all');
    onApply(allTime);
    onClose();
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
      onShow={handleOpen}
    >
      <View style={styles.backdrop}>
        {/* Tap backdrop to close */}
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.sheet}>
          {/* ── Header ──────────────────────────── */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Filter by Date</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >

            {/* ── Preset buttons ───────────────────── */}
            <Text style={styles.sectionLabel}>Quick Select</Text>
            <View style={styles.presetsGrid}>
              {PRESETS.map((preset) => {
                const isActive = selectedPreset === preset.id;
                return (
                  <TouchableOpacity
                    key={preset.id}
                    style={[
                      styles.presetButton,
                      isActive && styles.presetButtonActive,
                    ]}
                    onPress={() => handlePresetSelect(preset.id)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={preset.icon as any}
                      size={18}
                      color={isActive ? COLORS.textOnPrimary : COLORS.textSecondary}
                    />
                    <Text
                      style={[
                        styles.presetButtonText,
                        isActive && styles.presetButtonTextActive,
                      ]}
                    >
                      {preset.label}
                    </Text>
                    {isActive && (
                      <View style={styles.presetCheck}>
                        <Ionicons name="checkmark" size={12} color={COLORS.textOnPrimary} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* ── Custom date range ────────────────── */}
            {/**
             * Only show the custom inputs when the custom
             * preset is selected. Animating the reveal would
             * be nice but keeping it simple for now.
             */}
            {selectedPreset === 'custom' && (
              <View style={styles.customSection}>
                <Text style={styles.sectionLabel}>Custom Range</Text>

                {/* Date range visual */}
                <View style={styles.dateRangeRow}>
                  {/* Start date */}
                  <View style={styles.dateField}>
                    <Text style={styles.dateFieldLabel}>From</Text>
                    <View
                      style={[
                        styles.dateInputWrapper,
                        startError ? styles.dateInputError : null,
                      ]}
                    >
                      <Ionicons
                        name="calendar-outline"
                        size={16}
                        color={COLORS.textMuted}
                        style={styles.dateInputIcon}
                      />
                      <TextInput
                        style={styles.dateInput}
                        value={customStart}
                        onChangeText={(v) => {
                          setCustomStart(v);
                          setStartError('');
                        }}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={COLORS.textMuted}
                        keyboardType="numeric"
                        maxLength={10}
                      />
                    </View>
                    {startError ? (
                      <Text style={styles.dateError}>{startError}</Text>
                    ) : null}
                  </View>

                  {/* Arrow between dates */}
                  <View style={styles.dateArrow}>
                    <Ionicons
                      name="arrow-forward"
                      size={16}
                      color={COLORS.textMuted}
                    />
                  </View>

                  {/* End date */}
                  <View style={styles.dateField}>
                    <Text style={styles.dateFieldLabel}>To</Text>
                    <View
                      style={[
                        styles.dateInputWrapper,
                        endError ? styles.dateInputError : null,
                      ]}
                    >
                      <Ionicons
                        name="calendar-outline"
                        size={16}
                        color={COLORS.textMuted}
                        style={styles.dateInputIcon}
                      />
                      <TextInput
                        style={styles.dateInput}
                        value={customEnd}
                        onChangeText={(v) => {
                          setCustomEnd(v);
                          setEndError('');
                        }}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={COLORS.textMuted}
                        keyboardType="numeric"
                        maxLength={10}
                      />
                    </View>
                    {endError ? (
                      <Text style={styles.dateError}>{endError}</Text>
                    ) : null}
                  </View>
                </View>

                {/* Quick shortcut chips for the custom range */}
                <Text style={styles.chipRowLabel}>Quick fill</Text>
                <View style={styles.chipRow}>
                  {[
                    { label: 'Last 7 days',  start: daysAgo(7),  end: today() },
                    { label: 'Last 30 days', start: daysAgo(30), end: today() },
                    { label: 'Last 90 days', start: daysAgo(90), end: today() },
                  ].map((chip) => (
                    <TouchableOpacity
                      key={chip.label}
                      style={styles.chip}
                      onPress={() => {
                        setCustomStart(chip.start);
                        setCustomEnd(chip.end);
                        setStartError('');
                        setEndError('');
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.chipText}>{chip.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* ── Active filter preview ────────────── */}
            {/**
             * Shows the user exactly what date range will
             * be applied when they hit Apply, so there are
             * no surprises.
             */}
            <View style={styles.previewBox}>
              <Ionicons
                name="information-circle-outline"
                size={16}
                color={COLORS.primary}
                style={{ marginRight: SPACING.xs }}
              />
              <Text style={styles.previewText}>
                {selectedPreset === 'custom'
                  ? `Showing: ${customStart || '—'}  to  ${customEnd || '—'}`
                  : `Showing: ${buildPresetFilter(selectedPreset).label}`}
              </Text>
            </View>

            {/* ── Action buttons ───────────────────── */}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleClear}
                activeOpacity={0.7}
              >
                <Text style={styles.clearButtonText}>Clear Filter</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.applyButton}
                onPress={handleApply}
                activeOpacity={0.85}
              >
                <Text style={styles.applyButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>

          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },

  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS['2xl'],
    borderTopRightRadius: RADIUS['2xl'],
    padding: SPACING.xl,
    paddingBottom: SPACING['4xl'],
    maxHeight: '80%',
    ...SHADOWS.lg,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
  },

  headerTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },

  sectionLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semiBold,
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
  },

  // ── Presets ───────────────────────────────────────────
  /**
   * 2-column grid so all 5 presets fit without scrolling.
   * Each button is a row (icon + label + optional check).
   */
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },

  presetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.inputBackground,
    /**
     * width: '47%' makes two buttons per row with the
     * gap accounting for the remaining space.
     */
    width: '47%',
  },

  presetButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  presetButtonText: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.textSecondary,
  },

  presetButtonTextActive: {
    color: COLORS.textOnPrimary,
    fontWeight: FONT_WEIGHT.semiBold,
  },

  presetCheck: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Custom section ────────────────────────────────────
  customSection: {
    marginBottom: SPACING.lg,
  },

  dateRangeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },

  dateField: {
    flex: 1,
    gap: SPACING.xs,
  },

  dateFieldLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semiBold,
    color: COLORS.textPrimary,
  },

  dateInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBackground,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.sm,
    height: 44,
  },

  dateInputError: {
    borderColor: COLORS.danger,
  },

  dateInputIcon: {
    marginRight: SPACING.xs,
  },

  dateInput: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textPrimary,
  },

  dateError: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.danger,
  },

  dateArrow: {
    marginTop: 28, // aligns the arrow with the input fields
    padding: SPACING.xs,
  },

  // ── Quick-fill chips ──────────────────────────────────
  chipRowLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    marginBottom: SPACING.xs,
  },

  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },

  chip: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryMuted,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
  },

  chipText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.primary,
  },

  // ── Preview box ───────────────────────────────────────
  previewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryMuted,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.lg,
    marginBottom: SPACING.lg,
  },

  previewText: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.medium,
  },

  // ── Action buttons ────────────────────────────────────
  buttonRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },

  clearButton: {
    flex: 1,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.inputBackground,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  clearButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semiBold,
    color: COLORS.textSecondary,
  },

  applyButton: {
    flex: 2,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    ...SHADOWS.sm,
  },

  applyButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semiBold,
    color: COLORS.textOnPrimary,
  },
});