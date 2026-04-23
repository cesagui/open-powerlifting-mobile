import { useMemo } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fetchAthleteProfile, type AthleteCompetitionRow } from '@/lib/api';
import { formatNumber } from '@/lib/format';

function formatLiftValue(value: number | null): string {
  if (value === null) {
    return '-';
  }

  return value.toFixed(1);
}

export default function AthleteScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ slug?: string }>();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;

  const athleteQuery = useQuery({
    queryKey: ['athlete-profile', slug],
    queryFn: () => fetchAthleteProfile(slug ?? ''),
    enabled: Boolean(slug),
  });

  const athlete = athleteQuery.data;
  const title = useMemo(() => athlete?.name ?? 'Athlete', [athlete?.name]);

  if (!slug) {
    return (
      <View style={[styles.screen, styles.centered, { paddingTop: insets.top + 24 }]}>
        <Text style={styles.errorTitle}>Missing athlete</Text>
        <Pressable style={styles.actionButton} onPress={() => router.back()}>
          <Text style={styles.actionButtonLabel}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  if (athleteQuery.isLoading) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <ActivityIndicator size="large" color="#e63012" />
        <Text style={styles.stateText}>Loading athlete profile...</Text>
      </View>
    );
  }

  if (athleteQuery.isError || !athlete) {
    return (
      <View style={[styles.screen, styles.centered, { paddingTop: insets.top + 24 }]}>
        <Text style={styles.errorTitle}>Unable to load athlete</Text>
        <Text style={styles.stateText}>Please try again.</Text>
        <View style={styles.actionRow}>
          <Pressable style={styles.actionButton} onPress={() => athleteQuery.refetch()}>
            <Text style={styles.actionButtonLabel}>Retry</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
            <Text style={styles.secondaryButtonLabel}>Close</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top, 10) + 6 }]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View style={styles.headerTextWrap}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{athlete.sex || 'Athlete profile'}</Text>
          </View>

          <View style={styles.headerActions}>
            <Pressable
              style={styles.linkButton}
              onPress={() => Linking.openURL(`https://www.openpowerlifting.org/api/liftercsv/${slug}`)}>
              <Text style={styles.linkButtonLabel}>Download CSV</Text>
            </Pressable>
            <Pressable style={styles.closeButton} onPress={() => router.back()}>
              <Text style={styles.closeButtonLabel}>Close</Text>
            </Pressable>
          </View>
        </View>

        <SectionTitle title="Personal Bests" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tableScroll}>
          <View style={styles.personalBestsTable}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.tableHeaderText, styles.equipmentCol]}>Equip</Text>
              <Text style={[styles.tableHeaderText, styles.metricCol]}>Squat</Text>
              <Text style={[styles.tableHeaderText, styles.metricCol]}>Bench</Text>
              <Text style={[styles.tableHeaderText, styles.metricCol]}>Deadlift</Text>
              <Text style={[styles.tableHeaderText, styles.metricCol]}>Total</Text>
              <Text style={[styles.tableHeaderText, styles.metricCol]}>Dots</Text>
            </View>
            {athlete.personalBests.map((best) => (
              <View key={best.equipment} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.equipmentCol]} numberOfLines={1}>
                  {best.equipment}
                </Text>
                <Text style={[styles.tableCell, styles.squatText, styles.metricCol]}>{formatLiftValue(best.squat)}</Text>
                <Text style={[styles.tableCell, styles.benchText, styles.metricCol]}>{formatLiftValue(best.bench)}</Text>
                <Text style={[styles.tableCell, styles.deadliftText, styles.metricCol]}>{formatLiftValue(best.deadlift)}</Text>
                <Text style={[styles.tableCell, styles.totalText, styles.metricCol]}>{formatLiftValue(best.total)}</Text>
                <Text style={[styles.tableCell, styles.dotsText, styles.metricCol]}>{formatNumber(best.dots)}</Text>
              </View>
            ))}
          </View>
        </ScrollView>

        <SectionTitle title="Competition Results" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tableScroll}>
          <View style={styles.resultsTable}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.tableHeaderText, styles.placeCol]}>Place</Text>
              <Text style={[styles.tableHeaderText, styles.fedCol]}>Fed</Text>
              <Text style={[styles.tableHeaderText, styles.dateCol]}>Date</Text>
              <Text style={[styles.tableHeaderText, styles.locationCol]}>Location</Text>
              <Text style={[styles.tableHeaderText, styles.competitionCol]}>Competition</Text>
              <Text style={[styles.tableHeaderText, styles.divisionCol]}>Division</Text>
              <Text style={[styles.tableHeaderText, styles.ageCol]}>Age</Text>
              <Text style={[styles.tableHeaderText, styles.equipCol]}>Equip</Text>
              <Text style={[styles.tableHeaderText, styles.classCol]}>Class</Text>
              <Text style={[styles.tableHeaderText, styles.weightCol]}>Weight</Text>
              <Text style={[styles.tableHeaderText, styles.liftCol]}>Squat</Text>
              <Text style={[styles.tableHeaderText, styles.liftCol]}>Bench</Text>
              <Text style={[styles.tableHeaderText, styles.liftCol]}>Deadlift</Text>
              <Text style={[styles.tableHeaderText, styles.totalCol]}>Total</Text>
              <Text style={[styles.tableHeaderText, styles.dotsCol]}>Dots</Text>
            </View>
            {athlete.results.map((result, index) => (
              <ResultRow
                key={`${result.date}-${result.competition}-${index}`}
                result={result}
                onOpenMeet={(federation, meetId) =>
                  router.push({
                    pathname: '/meet/[federation]/[meetId]',
                    params: { federation, meetId },
                  } as never)
                }
              />
            ))}
          </View>
        </ScrollView>
      </ScrollView>
    </View>
  );
}

function ResultRow({
  result,
  onOpenMeet,
}: {
  result: AthleteCompetitionRow;
  onOpenMeet: (federation: string, meetId: string) => void;
}) {
  const hasMeetLink = Boolean(result.meetFederation && result.meetId);

  return (
    <View style={styles.tableRow}>
      <Text style={[styles.tableCell, styles.placeCol]}>{result.place || '-'}</Text>
      <Text style={[styles.tableCell, styles.fedCol]} numberOfLines={1}>
        {result.federation || '-'}
      </Text>
      <Text style={[styles.tableCell, styles.dateCol]}>{result.date || '-'}</Text>
      <Text style={[styles.tableCell, styles.locationCol]} numberOfLines={1}>
        {result.location || '-'}
      </Text>
      {hasMeetLink ? (
        <Pressable
          onPress={() => onOpenMeet(result.meetFederation as string, result.meetId as string)}
          style={({ pressed }) => [styles.competitionCellButton, pressed && styles.competitionCellButtonPressed]}>
          <Text style={[styles.tableCell, styles.competitionCol, styles.competitionLinkText]} numberOfLines={1}>
            {result.competition || '-'}
          </Text>
        </Pressable>
      ) : (
        <Text style={[styles.tableCell, styles.competitionCol]} numberOfLines={1}>
          {result.competition || '-'}
        </Text>
      )}
      <Text style={[styles.tableCell, styles.divisionCol]} numberOfLines={1}>
        {result.division || '-'}
      </Text>
      <Text style={[styles.tableCell, styles.ageCol]} numberOfLines={1}>
        {result.age || '-'}
      </Text>
      <Text style={[styles.tableCell, styles.equipCol]} numberOfLines={1}>
        {result.equipment || '-'}
      </Text>
      <Text style={[styles.tableCell, styles.classCol]} numberOfLines={1}>
        {result.weightClass || '-'}
      </Text>
      <Text style={[styles.tableCell, styles.weightCol]}>{formatNumber(result.bodyweight)}</Text>
      <Text style={[styles.tableCell, styles.squatText, styles.liftCol]}>{formatLiftValue(result.bestSquat)}</Text>
      <Text style={[styles.tableCell, styles.benchText, styles.liftCol]}>{formatLiftValue(result.bestBench)}</Text>
      <Text style={[styles.tableCell, styles.deadliftText, styles.liftCol]}>{formatLiftValue(result.bestDeadlift)}</Text>
      <Text style={[styles.tableCell, styles.totalText, styles.totalCol]}>{formatLiftValue(result.total)}</Text>
      <Text style={[styles.tableCell, styles.dotsText, styles.dotsCol]}>{formatNumber(result.dots)}</Text>
    </View>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0f1117',
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  content: {
    paddingBottom: 32,
  },
  headerRow: {
    paddingHorizontal: 16,
    marginBottom: 18,
    gap: 14,
  },
  headerTextWrap: {
    gap: 4,
  },
  title: {
    color: '#f5f5f5',
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: '#8f98a8',
    fontSize: 13,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  linkButton: {
    backgroundColor: '#1f2430',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  linkButtonLabel: {
    color: '#f5f5f5',
    fontSize: 13,
    fontWeight: '700',
  },
  closeButton: {
    backgroundColor: '#e63012',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  closeButtonLabel: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  sectionTitle: {
    color: '#ff3b43',
    fontSize: 20,
    fontWeight: '800',
    paddingHorizontal: 16,
    marginBottom: 12,
    marginTop: 6,
  },
  tableScroll: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  personalBestsTable: {
    minWidth: 480,
  },
  resultsTable: {
    minWidth: 1330,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#cf2027',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderBottomColor: '#1b1f2a',
    borderBottomWidth: 1,
    backgroundColor: '#171b25',
  },
  tableHeaderText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  tableCell: {
    color: '#f1f4fa',
    fontSize: 12,
    fontWeight: '600',
  },
  equipmentCol: {
    width: 96,
    paddingRight: 8,
  },
  metricCol: {
    width: 72,
    textAlign: 'right',
    paddingLeft: 6,
  },
  placeCol: {
    width: 54,
    paddingRight: 6,
  },
  fedCol: {
    width: 72,
    paddingRight: 6,
  },
  equipCol: {
    width: 72,
    paddingLeft: 10,
    paddingRight: 6,
  },
  dateCol: {
    width: 92,
    paddingRight: 6,
  },
  locationCol: {
    width: 112,
    paddingRight: 6,
  },
  competitionCol: {
    width: 230,
    paddingRight: 6,
  },
  competitionCellButton: {
    borderRadius: 4,
  },
  competitionCellButtonPressed: {
    opacity: 0.7,
  },
  competitionLinkText: {
    color: '#8bd7ff',
    textDecorationLine: 'underline',
  },
  divisionCol: {
    width: 120,
    paddingRight: 6,
  },
  ageCol: {
    width: 56,
    textAlign: 'right',
    paddingLeft: 6,
    paddingRight: 8,
  },
  classCol: {
    width: 72,
    textAlign: 'right',
    paddingLeft: 6,
  },
  weightCol: {
    width: 72,
    textAlign: 'right',
    paddingLeft: 6,
  },
  liftCol: {
    width: 88,
    textAlign: 'right',
    paddingLeft: 6,
  },
  totalCol: {
    width: 84,
    textAlign: 'right',
    paddingLeft: 6,
  },
  dotsCol: {
    width: 84,
    textAlign: 'right',
    paddingLeft: 6,
  },
  squatText: {
    color: '#ffae20',
  },
  benchText: {
    color: '#00e0d8',
  },
  deadliftText: {
    color: '#caa5ff',
  },
  totalText: {
    color: '#ffffff',
  },
  dotsText: {
    color: '#c7cde1',
  },
  stateText: {
    color: '#9ba3c2',
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
  },
  errorTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  actionButton: {
    backgroundColor: '#e63012',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
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
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  secondaryButtonLabel: {
    color: '#b4bdd0',
    fontSize: 13,
    fontWeight: '600',
  },
});