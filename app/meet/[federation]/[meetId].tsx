import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DataLoadState } from '@/components/DataLoadState';
import { fetchMeetResults, isNetworkError, type MeetResultRow } from '@/lib/api';
import { formatNumber } from '@/lib/format';

function formatLiftValue(value: number | null): string {
  if (value === null) {
    return '-';
  }

  return value.toFixed(1);
}

function formatAgeValue(value: string): string {
  const trimmed = value.trim();

  if (!trimmed) {
    return '-';
  }

  const numeric = Number(trimmed);
  if (Number.isFinite(numeric)) {
    return `${Math.trunc(numeric)}`;
  }

  return trimmed;
}

export default function MeetResultsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ federation?: string; meetId?: string }>();
  const federation = Array.isArray(params.federation) ? params.federation[0] : params.federation;
  const meetId = Array.isArray(params.meetId) ? params.meetId[0] : params.meetId;

  const meetQuery = useQuery({
    queryKey: ['meet-results', federation, meetId],
    queryFn: () => fetchMeetResults(federation ?? '', meetId ?? ''),
    enabled: Boolean(federation && meetId),
  });

  const meet = meetQuery.data;
  const meetTitle = meet
    ? formatMeetTitle(meet.date, federation, meet.meetName)
    : '';

  if (!federation || !meetId) {
    return (
      <View style={[styles.screen, styles.centered, { paddingTop: insets.top + 24 }]}> 
        <Text style={styles.errorTitle}>Missing meet information</Text>
        <Pressable style={styles.actionButton} onPress={() => router.back()}>
          <Text style={styles.actionButtonLabel}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  if (meetQuery.isLoading) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <ActivityIndicator size="large" color="#e63012" />
        <Text style={styles.stateText}>Loading meet results...</Text>
      </View>
    );
  }

  if (meetQuery.isError || !meet) {
    const offline = isNetworkError(meetQuery.error);

    return (
      <View style={[styles.screen, styles.centered, { paddingTop: insets.top + 24 }]}>
        <DataLoadState
          title="Unable to load meet"
          message="Please try again."
          isOffline={offline}
          onRetry={() => meetQuery.refetch()}
          secondaryLabel="Back"
          onSecondaryAction={() => router.back()}
        />
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
            <Text style={styles.title}>{meetTitle}</Text>
            <Text style={styles.subtitle}>{[meet.date, meet.location].filter(Boolean).join(', ')}</Text>
          </View>

          <View style={styles.headerActions}>
            <Pressable
              style={styles.linkButton}
              onPress={() =>
                Linking.openURL(
                  `https://www.openpowerlifting.org/api/meetcsv/${encodeURIComponent(federation)}/${encodeURIComponent(meetId)}`
                )
              }>
              <Text style={styles.linkButtonLabel}>Download CSV</Text>
            </Pressable>
            <Pressable style={styles.closeButton} onPress={() => router.back()}>
              <Text style={styles.closeButtonLabel}>Close</Text>
            </Pressable>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tableScroll}>
          <View style={styles.resultsTable}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.tableHeaderText, styles.rankCol]}>Rank</Text>
              <Text style={[styles.tableHeaderText, styles.lifterCol]}>Lifter</Text>
              <Text style={[styles.tableHeaderText, styles.sexCol]}>Sex</Text>
              <Text style={[styles.tableHeaderText, styles.ageCol]}>Age</Text>
              <Text style={[styles.tableHeaderText, styles.equipCol]}>Equip</Text>
              <Text style={[styles.tableHeaderText, styles.classCol]}>Class</Text>
              <Text style={[styles.tableHeaderText, styles.weightCol]}>Weight</Text>
              <Text style={[styles.tableHeaderText, styles.attemptCol]}>Squat 1</Text>
              <Text style={[styles.tableHeaderText, styles.attemptCol]}>Squat 2</Text>
              <Text style={[styles.tableHeaderText, styles.attemptCol]}>Squat 3</Text>
              <Text style={[styles.tableHeaderText, styles.attemptCol]}>Bench 1</Text>
              <Text style={[styles.tableHeaderText, styles.attemptCol]}>Bench 2</Text>
              <Text style={[styles.tableHeaderText, styles.attemptCol]}>Bench 3</Text>
              <Text style={[styles.tableHeaderText, styles.attemptCol]}>DL 1</Text>
              <Text style={[styles.tableHeaderText, styles.attemptCol]}>DL 2</Text>
              <Text style={[styles.tableHeaderText, styles.attemptCol]}>DL 3</Text>
              <Text style={[styles.tableHeaderText, styles.totalCol]}>Total</Text>
              <Text style={[styles.tableHeaderText, styles.dotsCol]}>Dots</Text>
            </View>
            {meet.rows.map((row, index) => (
              <MeetRow key={`${row.name}-${row.place}-${index}`} row={row} rank={index + 1} />
            ))}
          </View>
        </ScrollView>
      </ScrollView>
    </View>
  );
}

function MeetRow({ row, rank }: { row: MeetResultRow; rank: number }) {
  const rankLabel = row.place.toUpperCase() === 'DQ' ? 'DQ' : `${rank}`;

  return (
    <View style={styles.tableRow}>
      <Text style={[styles.tableCell, styles.rankCol]}>{rankLabel}</Text>
      <Text style={[styles.tableCell, styles.lifterCol]} numberOfLines={1}>
        {row.name || '-'}
      </Text>
      <Text style={[styles.tableCell, styles.sexCol]}>{row.sex || '-'}</Text>
      <Text style={[styles.tableCell, styles.ageCol]}>{formatAgeValue(row.age)}</Text>
      <Text style={[styles.tableCell, styles.equipCol]} numberOfLines={1}>
        {row.equipment || '-'}
      </Text>
      <Text style={[styles.tableCell, styles.classCol]}>{row.weightClass || '-'}</Text>
      <Text style={[styles.tableCell, styles.weightCol]}>{formatNumber(row.bodyweight)}</Text>
      <Text style={[styles.tableCell, styles.squatText, styles.attemptCol]}>{formatLiftValue(row.squat1)}</Text>
      <Text style={[styles.tableCell, styles.squatText, styles.attemptCol]}>{formatLiftValue(row.squat2)}</Text>
      <Text style={[styles.tableCell, styles.squatText, styles.attemptCol]}>{formatLiftValue(row.squat3)}</Text>
      <Text style={[styles.tableCell, styles.benchText, styles.attemptCol]}>{formatLiftValue(row.bench1)}</Text>
      <Text style={[styles.tableCell, styles.benchText, styles.attemptCol]}>{formatLiftValue(row.bench2)}</Text>
      <Text style={[styles.tableCell, styles.benchText, styles.attemptCol]}>{formatLiftValue(row.bench3)}</Text>
      <Text style={[styles.tableCell, styles.deadliftText, styles.attemptCol]}>{formatLiftValue(row.deadlift1)}</Text>
      <Text style={[styles.tableCell, styles.deadliftText, styles.attemptCol]}>{formatLiftValue(row.deadlift2)}</Text>
      <Text style={[styles.tableCell, styles.deadliftText, styles.attemptCol]}>{formatLiftValue(row.deadlift3)}</Text>
      <Text style={[styles.tableCell, styles.totalText, styles.totalCol]}>{formatLiftValue(row.total)}</Text>
      <Text style={[styles.tableCell, styles.dotsText, styles.dotsCol]}>{formatNumber(row.dots)}</Text>
    </View>
  );
}

function formatMeetTitle(date: string, federation: string, meetName: string): string {
  const year = date ? new Date(date).getFullYear() : null;
  const federationLabel = federation.toUpperCase();

  if (year && meetName) {
    return `${year} ${federationLabel} ${meetName}`;
  }

  if (meetName) {
    return `${federationLabel} ${meetName}`;
  }

  return federationLabel;
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
  tableScroll: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  resultsTable: {
    minWidth: 1540,
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
  rankCol: {
    width: 56,
    paddingRight: 6,
  },
  lifterCol: {
    width: 260,
    paddingRight: 6,
  },
  sexCol: {
    width: 56,
    paddingRight: 6,
  },
  ageCol: {
    width: 56,
    textAlign: 'right',
    paddingLeft: 6,
    paddingRight: 8,
  },
  equipCol: {
    width: 96,
    paddingRight: 6,
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
  attemptCol: {
    width: 72,
    textAlign: 'right',
    paddingLeft: 6,
  },
  totalCol: {
    width: 86,
    textAlign: 'right',
    paddingLeft: 6,
  },
  dotsCol: {
    width: 86,
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
