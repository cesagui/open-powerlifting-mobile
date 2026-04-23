import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useRankings } from '@/hooks/useRankings';
import type { Lifter } from '@/lib/api';
import { formatNumber } from '@/lib/format';
import { buildLifterSlug } from '@/lib/api';
import { convertLifterWeights } from '@/lib/units';
import { useFilterStore } from '@/stores/useFilterStore';
import { useUnitStore, type Unit } from '@/stores/useUnitStore';

type FilterSectionKey =
  | 'sortBy'
  | 'federation'
  | 'equipment'
  | 'sex'
  | 'weightClass'
  | 'liftType';

type FilterDraft = {
  sortBy: string;
  federation: string;
  equipment: string;
  sex: string;
  weightClass: string;
  liftType: string;
};

const TABLE_WIDTH = 556;

const TRADITIONAL_WEIGHT_CLASS_VALUES = ['44', '48', '52', '56', '60', '67.5', '75', '82.5', '90', '90+', '100', '110', '110+', '125', '140', '140+'];
const IPF_MEN_WEIGHT_CLASS_VALUES = ['ipf53', 'ipf59', 'ipf66', 'ipf74', 'ipf83', 'ipf93', 'ipf105', 'ipf120', 'ipfover120'];
const IPF_WOMEN_WEIGHT_CLASS_VALUES = ['ipf43', 'ipf47', 'ipf52', 'ipf57', 'ipf63', 'ipf69', 'ipf76', 'ipf84', 'ipfover84'];
const WEIGHT_CLASS_VALUES = ['All', ...TRADITIONAL_WEIGHT_CLASS_VALUES, ...IPF_MEN_WEIGHT_CLASS_VALUES, ...IPF_WOMEN_WEIGHT_CLASS_VALUES];

const FILTER_OPTIONS: Record<FilterSectionKey, string[]> = {
  sortBy: ['Dots', 'Wilks', 'Total', 'GL Points'],
  federation: ['All', 'Fully-Tested', 'IPF', 'USAPL', 'USPA', 'WRPF', 'GPC'],
  equipment: ['All', 'Raw', 'Wraps', 'Single-ply', 'Multi-ply', 'Unlimited'],
  sex: ['All', 'M', 'F'],
  weightClass: WEIGHT_CLASS_VALUES,
  liftType: ['All', 'Full Power', 'Squat Only', 'Bench Only', 'Deadlift Only'],
};

const TRADITIONAL_WEIGHT_CLASS_OPTIONS = TRADITIONAL_WEIGHT_CLASS_VALUES;

const SORT_GROUPS: Array<{ heading: string; options: string[] }> = [
  {
    heading: 'Point Sorts',
    options: ['Dots', 'Wilks', 'GL Points'],
  },
  {
    heading: 'Weight Sorts',
    options: ['Squat', 'Bench', 'Deadlift', 'Total'],
  },
];

const FILTER_SECTIONS: Array<{ key: FilterSectionKey; label: string }> = [
  { key: 'sortBy', label: 'Sort By' },
  { key: 'federation', label: 'Federation' },
  { key: 'equipment', label: 'Equipment' },
  { key: 'sex', label: 'Sex' },
  { key: 'weightClass', label: 'Weight Class' },
  { key: 'liftType', label: 'Lift Type' },
];

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const federation = useFilterStore((state) => state.federation);
  const weightClass = useFilterStore((state) => state.weightClass);
  const sex = useFilterStore((state) => state.sex);
  const equipment = useFilterStore((state) => state.equipment);
  const ageClass = useFilterStore((state) => state.ageClass);
  const year = useFilterStore((state) => state.year);
  const sortBy = useFilterStore((state) => state.sortBy);
  const liftCriteria = useFilterStore((state) => state.liftCriteria);
  const setFederation = useFilterStore((state) => state.setFederation);
  const setWeightClass = useFilterStore((state) => state.setWeightClass);
  const setSex = useFilterStore((state) => state.setSex);
  const setEquipment = useFilterStore((state) => state.setEquipment);
  const setSortBy = useFilterStore((state) => state.setSortBy);
  const setLiftCriteria = useFilterStore((state) => state.setLiftCriteria);
  const resetFilters = useFilterStore((state) => state.resetFilters);

  const unit = useUnitStore((state) => state.unit);

  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [activeFilterSection, setActiveFilterSection] = useState<FilterSectionKey>('federation');
  const [draftFilters, setDraftFilters] = useState<FilterDraft>({
    sortBy,
    federation,
    equipment,
    sex,
    weightClass,
    liftType: liftCriteria,
  });

  function openFilter(section: FilterSectionKey) {
    setDraftFilters({
      sortBy,
      federation,
      equipment,
      sex,
      weightClass,
      liftType: liftCriteria,
    });
    setActiveFilterSection(section);
    setIsFilterVisible(true);
  }

  function closeFilter() {
    setIsFilterVisible(false);
  }

  function clearDraftFilters() {
    setDraftFilters({
      sortBy: 'Dots',
      federation: 'All',
      equipment: 'All',
      sex: 'All',
      weightClass: 'All',
      liftType: 'All',
    });
  }

  function applyDraftFilters() {
    setSortBy(draftFilters.sortBy);
    setFederation(draftFilters.federation);
    setEquipment(draftFilters.equipment);
    setSex(draftFilters.sex);
    setWeightClass(draftFilters.weightClass);
    setLiftCriteria(draftFilters.liftType);
    closeFilter();
  }

  const filters = useMemo(
    () => ({
      federation,
      weightClass,
      sex,
      equipment,
      ageClass,
      year,
      sortBy,
    }),
    [federation, weightClass, sex, equipment, ageClass, year, sortBy]
  );

  const rankingsQuery = useRankings(filters);

  const lifters = useMemo(() => {
    const rows = rankingsQuery.data?.pages.flatMap((page) => page.lifters) ?? [];
    const converted = rows.map((lifter) => convertLifterWeights(lifter, unit));
    return converted.filter((lifter) => matchesLiftCriteria(lifter, liftCriteria));
  }, [rankingsQuery.data, unit, liftCriteria]);

  const scoreLabel = getScoreLabel(sortBy);
  const extraMetrics = getExtraMetrics();

  if (rankingsQuery.isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#e63012" />
        <Text style={styles.stateText}>Loading leaderboard...</Text>
      </View>
    );
  }

  if (rankingsQuery.isError) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.stateTitle}>Unable to load leaderboard</Text>
        <Text style={styles.stateText}>Please try again.</Text>
        <View style={styles.stateActions}>
          <Pressable style={styles.actionButton} onPress={() => rankingsQuery.refetch()}>
            <Text style={styles.actionButtonLabel}>Retry</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={resetFilters}>
            <Text style={styles.secondaryButtonLabel}>Reset Filters</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (lifters.length === 0) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.stateTitle}>No results found</Text>
        <Text style={styles.stateText}>Try broadening your filters.</Text>
        <Pressable style={styles.actionButton} onPress={resetFilters}>
          <Text style={styles.actionButtonLabel}>Reset Filters</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 8) + 8 }]}>
      <View style={styles.topRow}>
        <Text style={styles.screenTitle}>Leaderboard</Text>
      </View>

      <View style={styles.controlsRow}>
        <Pressable style={styles.controlButton} onPress={() => openFilter('sortBy')}>
          <View style={styles.controlButtonContent}>
            <Text style={styles.controlButtonLabel}>Sort By</Text>
            <Ionicons name="chevron-down" size={16} color="#d2d8e8" />
          </View>
        </Pressable>

        <Pressable style={styles.controlButton} onPress={() => openFilter('federation')}>
          <Text style={styles.controlButtonLabel}>Filter</Text>
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={styles.tableScrollContent}>
        <FlatList
          data={lifters}
          keyExtractor={(item, index) => `${item.rank}-${item.name}-${index}`}
          stickyHeaderIndices={[0]}
          onEndReachedThreshold={0.55}
          onEndReached={() => {
            if (rankingsQuery.hasNextPage && !rankingsQuery.isFetchingNextPage) {
              rankingsQuery.fetchNextPage();
            }
          }}
          style={styles.tableList}
          ListHeaderComponent={
            <View style={[styles.headerRow, styles.tableRowWidth]}>
              <Text style={[styles.headerText, styles.rankCol]}>#</Text>
              <Text style={[styles.headerText, styles.nameCol]}>name</Text>
              <Text style={[styles.headerText, styles.scoreCol]}>{scoreLabel.toLowerCase()}</Text>
              <Text style={[styles.headerText, styles.liftCol]}>squat</Text>
              <Text style={[styles.headerText, styles.liftCol]}>bench</Text>
              <Text style={[styles.headerText, styles.liftCol]}>dl</Text>
              {extraMetrics.map((metric) => (
                <Text key={metric} style={[styles.headerText, styles.metricCol]}>
                  {metric.toLowerCase()}
                </Text>
              ))}
            </View>
          }
          renderItem={({ item }) => {
            const isTopRank = item.rank === 1;
            return (
              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  router.push({
                    pathname: '/athlete/[slug]',
                    params: { slug: buildLifterSlug(item.name) },
                  } as never)
                }
                style={({ pressed }) => [
                  styles.row,
                  styles.tableRowWidth,
                  isTopRank && styles.rowTopRank,
                  pressed && styles.rowPressed,
                ]}>
                <Text style={[styles.rankValue, isTopRank ? styles.rankOne : styles.rankDefault]}>
                  {item.rank}
                </Text>

                <View style={styles.nameCol}>
                  <Text style={styles.nameText} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.metaText} numberOfLines={1}>
                    {item.federation} | {item.weightClass}
                  </Text>
                </View>

                <Text style={[styles.cellText, styles.scoreValue]}>{formatScore(item, scoreLabel)}</Text>
                <Text style={[styles.cellText, styles.squatText]}>{formatLift(item.squat)}</Text>
                <Text style={[styles.cellText, styles.benchDeadliftText]}>{formatLift(item.bench)}</Text>
                <Text style={[styles.cellText, styles.deadliftText]}>{formatLift(item.deadlift)}</Text>
                {extraMetrics.map((metric) => (
                  <Text key={metric} style={[styles.cellText, styles.extraMetricValue]}>
                    {formatExtraMetric(item, metric, scoreLabel)}
                  </Text>
                ))}
              </Pressable>
            );
          }}
          ListFooterComponent={
            rankingsQuery.isFetchingNextPage ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color="#e63012" />
              </View>
            ) : null
          }
        />
      </ScrollView>

      <FilterModal
        visible={isFilterVisible}
        activeSection={activeFilterSection}
        draftFilters={draftFilters}
        bottomInset={insets.bottom}
        onClose={closeFilter}
        onSectionChange={setActiveFilterSection}
        onSelectOption={(section, value) =>
          setDraftFilters((current) => ({
            ...current,
            [section]: value,
            sex:
              section === 'weightClass'
                ? isIpfMenWeightClass(value)
                  ? 'M'
                  : isIpfWomenWeightClass(value)
                    ? 'F'
                    : current.sex
                : current.sex,
          }))
        }
        onClear={clearDraftFilters}
        onApply={applyDraftFilters}
      />
    </View>
  );
}

function getScoreLabel(sortBy: string): 'Dots' | 'Wilks' | 'Total' | 'GL' | 'Squat' | 'Bench' | 'Deadlift' {
  const normalized = sortBy.toLowerCase();

  if (normalized.includes('squat')) {
    return 'Squat';
  }

  if (normalized.includes('bench')) {
    return 'Bench';
  }

  if (normalized.includes('deadlift')) {
    return 'Deadlift';
  }

  if (normalized.includes('gl')) {
    return 'GL';
  }

  if (normalized.includes('wilks')) {
    return 'Wilks';
  }

  if (normalized.includes('total')) {
    return 'Total';
  }

  return 'Dots';
}

function formatLift(value: number | null): string {
  if (value === null) {
    return '-';
  }

  return value.toFixed(1);
}

function formatScore(
  lifter: Lifter,
  scoreLabel: 'Dots' | 'Wilks' | 'Total' | 'GL' | 'Squat' | 'Bench' | 'Deadlift'
): string {
  if (scoreLabel === 'Squat') {
    return formatLift(lifter.squat);
  }

  if (scoreLabel === 'Bench') {
    return formatLift(lifter.bench);
  }

  if (scoreLabel === 'Deadlift') {
    return formatLift(lifter.deadlift);
  }

  if (scoreLabel === 'Wilks') {
    return formatNumber(lifter.wilks);
  }

  if (scoreLabel === 'Total') {
    return formatLift(lifter.total);
  }

  return formatNumber(lifter.dots);
}

function getExtraMetrics(): Array<'Total'> {
  return ['Total'];
}

function formatExtraMetric(
  lifter: Lifter,
  metric: 'Total',
  _scoreLabel: 'Dots' | 'Wilks' | 'Total' | 'GL' | 'Squat' | 'Bench' | 'Deadlift'
): string {
  return formatLift(lifter.total);
}

function FilterModal({
  visible,
  activeSection,
  draftFilters,
  bottomInset,
  onClose,
  onSectionChange,
  onSelectOption,
  onClear,
  onApply,
}: {
  visible: boolean;
  activeSection: FilterSectionKey;
  draftFilters: FilterDraft;
  bottomInset: number;
  onClose: () => void;
  onSectionChange: (section: FilterSectionKey) => void;
  onSelectOption: (section: FilterSectionKey, value: string) => void;
  onClear: () => void;
  onApply: () => void;
}) {
  const [isTraditionalExpanded, setIsTraditionalExpanded] = useState(false);
  const [isIpfMenExpanded, setIsIpfMenExpanded] = useState(false);
  const [isIpfWomenExpanded, setIsIpfWomenExpanded] = useState(false);
  const unit = useUnitStore((state) => state.unit);
  const options = FILTER_OPTIONS[activeSection];
  const currentValue = draftFilters[activeSection];
  const actionBottomGap = Math.max(bottomInset, 12);
  const footerReservedSpace = actionBottomGap + 72;
  const isSortBySection = activeSection === 'sortBy';
  const isWeightClassSection = activeSection === 'weightClass';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose}>
        <Pressable style={styles.sheetContainer} onPress={(event) => event.stopPropagation()}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Filter</Text>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>X</Text>
            </Pressable>
          </View>

          <View style={[styles.sheetBody, { paddingBottom: footerReservedSpace }]}>
            <View style={styles.sectionRail}>
              {FILTER_SECTIONS.map((section) => {
                const selected = section.key === activeSection;
                return (
                  <Pressable
                    key={section.key}
                    style={[styles.sectionItem, selected && styles.sectionItemActive]}
                    onPress={() => onSectionChange(section.key)}>
                    <Text style={[styles.sectionItemText, selected && styles.sectionItemTextActive]}>
                      {section.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.sectionOptionsPane}>
              <Text style={styles.optionHeading}>{sectionLabel(activeSection)}</Text>
              <ScrollView showsVerticalScrollIndicator={false}>
                {isWeightClassSection ? (
                  <>
                    <Pressable
                      onPress={() => onSelectOption(activeSection, 'All')}
                      style={styles.optionRow}>
                      <View style={[styles.radioOuter, currentValue === 'All' && styles.radioOuterSelected]}>
                        {currentValue === 'All' ? <View style={styles.radioInner} /> : null}
                      </View>
                      <Text style={[styles.optionText, currentValue === 'All' && styles.optionTextSelected]}>
                        All
                      </Text>
                    </Pressable>

                    <View style={[styles.optionGroupBlock, styles.weightClassGroupBlock, styles.traditionalGroupBlock]}>
                      <Pressable
                        onPress={() => setIsTraditionalExpanded((value) => !value)}
                        style={styles.optionGroupHeader}>
                        <Text style={[styles.optionGroupHeading, styles.traditionalGroupHeading]}>Traditional</Text>
                        <Ionicons
                          name={isTraditionalExpanded ? 'chevron-up' : 'chevron-down'}
                          size={16}
                          color="#9ba3c2"
                        />
                      </Pressable>
                      {isTraditionalExpanded
                        ? TRADITIONAL_WEIGHT_CLASS_OPTIONS.map((option) => {
                            const selected = option === currentValue;
                            const label = formatWeightClassLabel(option, unit);
                            return (
                              <Pressable
                                key={option}
                                onPress={() => onSelectOption(activeSection, option)}
                                style={styles.optionRow}>
                                <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
                                  {selected ? <View style={styles.radioInner} /> : null}
                                </View>
                                <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{label}</Text>
                              </Pressable>
                            );
                          })
                        : null}
                    </View>

                    <View style={[styles.optionGroupBlock, styles.weightClassGroupBlock, styles.traditionalGroupBlock]}>
                      <Pressable
                        onPress={() => setIsIpfMenExpanded((value) => !value)}
                        style={styles.optionGroupHeader}>
                        <Text style={[styles.optionGroupHeading, styles.traditionalGroupHeading]}>IPF Men</Text>
                        <Ionicons
                          name={isIpfMenExpanded ? 'chevron-up' : 'chevron-down'}
                          size={16}
                          color="#9ba3c2"
                        />
                      </Pressable>
                      {isIpfMenExpanded
                        ? IPF_MEN_WEIGHT_CLASS_VALUES.map((option) => {
                            const selected = option === currentValue;
                            const label = formatWeightClassLabel(option, unit);
                            return (
                              <Pressable
                                key={option}
                                onPress={() => onSelectOption(activeSection, option)}
                                style={styles.optionRow}>
                                <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
                                  {selected ? <View style={styles.radioInner} /> : null}
                                </View>
                                <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{label}</Text>
                              </Pressable>
                            );
                          })
                        : null}
                    </View>

                    <View style={[styles.optionGroupBlock, styles.weightClassGroupBlock, styles.traditionalGroupBlock]}>
                      <Pressable
                        onPress={() => setIsIpfWomenExpanded((value) => !value)}
                        style={styles.optionGroupHeader}>
                        <Text style={[styles.optionGroupHeading, styles.traditionalGroupHeading]}>IPF Women</Text>
                        <Ionicons
                          name={isIpfWomenExpanded ? 'chevron-up' : 'chevron-down'}
                          size={16}
                          color="#9ba3c2"
                        />
                      </Pressable>
                      {isIpfWomenExpanded
                        ? IPF_WOMEN_WEIGHT_CLASS_VALUES.map((option) => {
                            const selected = option === currentValue;
                            const label = formatWeightClassLabel(option, unit);
                            return (
                              <Pressable
                                key={option}
                                onPress={() => onSelectOption(activeSection, option)}
                                style={styles.optionRow}>
                                <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
                                  {selected ? <View style={styles.radioInner} /> : null}
                                </View>
                                <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{label}</Text>
                              </Pressable>
                            );
                          })
                        : null}
                    </View>
                  </>
                ) : isSortBySection
                  ? SORT_GROUPS.map((group) => (
                      <View key={group.heading} style={styles.optionGroupBlock}>
                        <Text style={styles.optionGroupHeading}>{group.heading}</Text>
                        {group.options.map((option) => {
                          const selected = option === currentValue;
                          return (
                            <Pressable
                              key={option}
                              onPress={() => onSelectOption(activeSection, option)}
                              style={styles.optionRow}>
                              <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
                                {selected ? <View style={styles.radioInner} /> : null}
                              </View>
                              <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                                {option}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    ))
                  : options.map((option) => {
                      const selected = option === currentValue;
                      return (
                        <Pressable
                          key={option}
                          onPress={() => onSelectOption(activeSection, option)}
                          style={styles.optionRow}>
                          <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
                            {selected ? <View style={styles.radioInner} /> : null}
                          </View>
                          <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{option}</Text>
                        </Pressable>
                      );
                    })}
              </ScrollView>
            </View>
          </View>

          <View
            style={[
              styles.sheetFooter,
              {
                left: 0,
                right: 0,
                bottom: actionBottomGap,
                paddingHorizontal: 18,
                paddingTop: 14,
              },
            ]}>
            <Pressable style={styles.clearButton} onPress={onClear}>
              <Text style={styles.clearButtonText}>Clear Filters</Text>
            </Pressable>
            <Pressable style={styles.applyButton} onPress={onApply}>
              <Text style={styles.applyButtonText}>Apply</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function sectionLabel(section: FilterSectionKey): string {
  if (section === 'sortBy') return 'Sort By';
  if (section === 'federation') return 'Federation';
  if (section === 'equipment') return 'Equipment';
  if (section === 'sex') return 'Sex';
  if (section === 'weightClass') return 'Weight Class';
  return 'Lift Type';
}

function formatWeightClassLabel(value: string, unit: Unit): string {
  if (value === 'All') {
    return 'All';
  }

  const ipfClassKg = getIpfClassKg(value);
  if (ipfClassKg !== null) {
    if (value === 'ipfover120' || value === 'ipfover84') {
      if (unit === 'kg') {
        return `${ipfClassKg}+`;
      }

      return `${Math.round(ipfClassKg * 2.20462)}+`;
    }

    if (unit === 'kg') {
      return `-${ipfClassKg}`;
    }

    return `-${Math.round(ipfClassKg * 2.20462)}`;
  }

  const asBelowClass = (classValue: string) => `-${classValue}`;
  const asAboveClass = (classValue: string) => `${classValue}+`;
  const isAboveClass = value === '90+' || value === '110+' || value === '140+';

  if (unit === 'kg') {
    if (isAboveClass) {
      return asAboveClass(value.replace('+', ''));
    }

    return asBelowClass(value.replace('+', ''));
  }

  if (value === '90+') {
    return asAboveClass('198');
  }

  if (value === '110+') {
    return asAboveClass('242');
  }

  if (value === '140+') {
    return asAboveClass('308');
  }

  const pounds = Math.round(Number(value) * 2.20462);
  return Number.isFinite(pounds) ? asBelowClass(`${pounds}`) : asBelowClass(value.replace('+', ''));
}

function isIpfMenWeightClass(value: string): boolean {
  return IPF_MEN_WEIGHT_CLASS_VALUES.includes(value);
}

function isIpfWomenWeightClass(value: string): boolean {
  return IPF_WOMEN_WEIGHT_CLASS_VALUES.includes(value);
}

function getIpfClassKg(value: string): number | null {
  if (value === 'ipf43') return 43;
  if (value === 'ipf47') return 47;
  if (value === 'ipf52') return 52;
  if (value === 'ipf57') return 57;
  if (value === 'ipf63') return 63;
  if (value === 'ipf69') return 69;
  if (value === 'ipf76') return 76;
  if (value === 'ipf84') return 84;
  if (value === 'ipfover84') return 84;
  if (value === 'ipf53') return 53;
  if (value === 'ipf59') return 59;
  if (value === 'ipf66') return 66;
  if (value === 'ipf74') return 74;
  if (value === 'ipf83') return 83;
  if (value === 'ipf93') return 93;
  if (value === 'ipf105') return 105;
  if (value === 'ipf120') return 120;
  if (value === 'ipfover120') return 120;

  return null;
}

function matchesLiftCriteria(lifter: Lifter, liftCriteria: string): boolean {
  if (liftCriteria === 'All') {
    return true;
  }

  const hasSquat = lifter.squat !== null;
  const hasBench = lifter.bench !== null;
  const hasDeadlift = lifter.deadlift !== null;

  if (liftCriteria === 'Full Power') {
    return hasSquat && hasBench && hasDeadlift;
  }

  if (liftCriteria === 'Squat Only') {
    return hasSquat && !hasBench && !hasDeadlift;
  }

  if (liftCriteria === 'Bench Only') {
    return !hasSquat && hasBench && !hasDeadlift;
  }

  if (liftCriteria === 'Deadlift Only') {
    return !hasSquat && !hasBench && hasDeadlift;
  }

  return true;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f1117',
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  screenTitle: {
    color: '#f5f5f5',
    fontSize: 22,
    fontWeight: '700',
  },
  controlsRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    gap: 10,
    marginBottom: 16,
  },
  controlButton: {
    minHeight: 40,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#2d3448',
    backgroundColor: '#171b25',
    paddingVertical: 8,
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  controlButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  controlButtonLabel: {
    color: '#d2d8e8',
    fontSize: 15,
    fontWeight: '700',
  },
  tableScrollContent: {
    paddingRight: 0,
  },
  tableList: {
    width: TABLE_WIDTH,
  },
  tableRowWidth: {
    width: TABLE_WIDTH,
  },
  headerRow: {
    backgroundColor: '#0f1117',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomColor: '#1f2430',
    borderBottomWidth: 1,
  },
  headerText: {
    color: '#4a4f6a',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomColor: '#161a25',
    borderBottomWidth: 1,
  },
  rowTopRank: {
    backgroundColor: '#1a1d2e',
  },
  rowPressed: {
    opacity: 0.82,
  },
  rankCol: {
    width: 34,
  },
  rankValue: {
    width: 34,
    fontSize: 12,
    fontWeight: '700',
  },
  rankOne: {
    color: '#e63012',
  },
  rankDefault: {
    color: '#9ba3c2',
  },
  nameCol: {
    width: 210,
    paddingRight: 8,
  },
  liftCol: {
    width: 56,
    paddingLeft: 6,
    textAlign: 'right',
  },
  scoreCol: {
    width: 60,
    paddingLeft: 6,
    textAlign: 'right',
  },
  metricCol: {
    width: 60,
    paddingLeft: 6,
    textAlign: 'right',
  },
  nameText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  metaText: {
    color: '#4a4f6a',
    fontSize: 10,
    marginTop: 2,
  },
  cellText: {
    width: 56,
    paddingLeft: 6,
    textAlign: 'right',
    fontSize: 12,
    fontWeight: '600',
  },
  squatText: {
    color: '#ffae20',
  },
  benchDeadliftText: {
    color: '#00e0d8',
  },
  deadliftText: {
    color: '#caa5ff',
  },
  scoreValue: {
    width: 60,
    paddingLeft: 6,
    color: '#ffffff',
    fontWeight: '700',
  },
  extraMetricValue: {
    width: 60,
    color: '#c7cde1',
    fontWeight: '600',
  },
  stateTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
  },
  stateText: {
    color: '#9ba3c2',
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
  },
  stateActions: {
    flexDirection: 'row',
    marginTop: 14,
    gap: 10,
  },
  actionButton: {
    backgroundColor: '#e63012',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  actionButtonLabel: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  secondaryButton: {
    borderColor: '#2e3648',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  secondaryButtonLabel: {
    color: '#b4bdd0',
    fontSize: 13,
    fontWeight: '600',
  },
  footerLoader: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#171b25',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: 480,
    height: '80%',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#242b3d',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  sheetTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2b3145',
  },
  closeButtonText: {
    color: '#c9d0e5',
    fontSize: 14,
    fontWeight: '700',
  },
  sheetBody: {
    flex: 1,
    flexDirection: 'row',
    minHeight: 340,
  },
  sectionRail: {
    width: '40%',
    borderRightWidth: 1,
    borderRightColor: '#242b3d',
    backgroundColor: '#121621',
    paddingVertical: 6,
  },
  sectionItem: {
    minHeight: 52,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  sectionItemActive: {
    backgroundColor: '#1c2436',
    borderLeftWidth: 4,
    borderLeftColor: '#e63012',
    paddingLeft: 12,
  },
  sectionItemText: {
    color: '#9ba3c2',
    fontSize: 15,
    fontWeight: '600',
  },
  sectionItemTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  sectionOptionsPane: {
    width: '60%',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  optionHeading: {
    color: '#c7cde1',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  optionGroupBlock: {
    marginBottom: 16,
  },
  weightClassGroupBlock: {
    marginBottom: 0,
  },
  traditionalGroupBlock: {
    marginTop: 8,
  },
  optionGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  optionGroupHeading: {
    color: '#9ba3c2',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 6,
    letterSpacing: 0.7,
  },
  traditionalGroupHeading: {
    fontSize: 14,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#717a96',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: '#e63012',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 999,
    backgroundColor: '#e63012',
  },
  optionText: {
    color: '#c7cde1',
    fontSize: 17,
    fontWeight: '500',
  },
  optionTextSelected: {
    color: '#ffffff',
    fontWeight: '700',
  },
  sheetFooter: {
    position: 'absolute',
    borderTopWidth: 1,
    borderTopColor: '#242b3d',
    backgroundColor: '#171b25',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  clearButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3a435c',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
  },
  clearButtonText: {
    color: '#ff8f74',
    fontSize: 16,
    fontWeight: '700',
  },
  applyButton: {
    flex: 1.3,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    backgroundColor: '#e63012',
  },
  applyButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
