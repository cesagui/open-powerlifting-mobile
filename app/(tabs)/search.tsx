import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { buildLifterSlug, fetchRankingsWindow, searchRankingIndex } from '@/lib/api';
import { formatNumber } from '@/lib/format';
import { useRecentLiftersStore } from '@/stores/useRecentLiftersStore';

export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const recentLifters = useRecentLiftersStore((state) => state.recentLifters);
  const addRecentLifter = useRecentLiftersStore((state) => state.addRecentLifter);
  const removeRecentLifter = useRecentLiftersStore((state) => state.removeRecentLifter);

  const openAthleteProfile = (slug: string) => {
    router.push({
      pathname: '/athlete/[slug]',
      params: { slug },
    } as never);
  };

  const normalizedQuery = submittedQuery.trim().toLowerCase();

  const searchQuery = useQuery({
    queryKey: ['search-lifter', normalizedQuery],
    enabled: normalizedQuery.length > 0,
    queryFn: async () => {
      const index = await searchRankingIndex(normalizedQuery, 0);

      if (index === null) {
        return null;
      }

      const window = await fetchRankingsWindow({ start: index, end: index });
      return window.lifters[0] ?? null;
    },
  });

  const result = searchQuery.data ?? null;

  const cardLabel = useMemo(() => {
    if (!normalizedQuery) {
      if (recentLifters.length > 0) {
        return '';
      }
      return 'Start typing to search.';
    }

    if (searchQuery.isFetching) {
      return 'Searching OpenPowerlifting...';
    }

    if (!result) {
      return 'No matches found. Try a different spelling or partial name.';
    }

    return '';
  }, [normalizedQuery, result, searchQuery.isFetching, recentLifters.length]);

  if (searchQuery.isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#e63012" />
        <Text style={styles.helperText}>Loading search data...</Text>
      </View>
    );
  }

  if (searchQuery.isError) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.title}>Unable to load search data</Text>
        <Text style={styles.helperText}>Please try again.</Text>
        <Pressable style={styles.primaryButton} onPress={() => searchQuery.refetch()}>
          <Text style={styles.primaryButtonLabel}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 8) + 8 }]}>
      <Text style={styles.title}>Search Lifters</Text>
      <Text style={styles.helperText}>Type a lifter name to find and open their profile.</Text>

      <TextInput
        value={query}
        onChangeText={(text) => {
          setQuery(text);

          if (text.trim().length === 0) {
            setSubmittedQuery('');
          }
        }}
        placeholder="Search by lifter name"
        placeholderTextColor="#6f788c"
        style={styles.searchInput}
        autoCapitalize="words"
        autoCorrect={false}
        clearButtonMode="while-editing"
        returnKeyType="search"
        blurOnSubmit
        onSubmitEditing={() => setSubmittedQuery(query)}
      />

      {recentLifters.length > 0 && query.trim().length === 0 ? (
        <View style={styles.recentSection}>
          <Text style={styles.recentTitle}>History</Text>
          <View style={styles.recentList}>
            {recentLifters.map((lifter) => (
              <View key={lifter.slug} style={styles.recentCard}>
                <View style={styles.recentCardHeader}>
                  <Pressable
                    accessibilityRole="button"
                    style={({ pressed }) => [styles.recentCardMain, pressed && styles.resultCardPressed]}
                    onPress={() => openAthleteProfile(lifter.slug)}>
                    <Text style={styles.resultName}>{lifter.name}</Text>
                    <Text style={styles.resultMeta}>
                      {lifter.federation} | {lifter.sex} | {lifter.equipment}
                    </Text>
                    <Text style={styles.resultMeta}>
                      Class {lifter.weightClass}
                    </Text>
                    <Text style={styles.resultMeta}>
                      Dots {formatNumber(lifter.dots)}
                    </Text>
                  </Pressable>

                  <Pressable
                    accessibilityRole="button"
                    style={({ pressed }) => [styles.deleteButton, pressed && styles.deleteButtonPressed]}
                    onPress={() => removeRecentLifter(lifter.slug)}>
                    <Text style={styles.deleteButtonLabel}>✕</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.emptyState}>
        {cardLabel ? <Text style={styles.emptyText}>{cardLabel}</Text> : null}
      </View>

      {result ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            const slug = buildLifterSlug(result.name);
            addRecentLifter({
              slug,
              name: result.name,
              federation: result.federation,
              sex: result.sex,
              equipment: result.equipment,
              weightClass: result.weightClass,
              dots: result.dots,
            });
            openAthleteProfile(slug);
          }}
          style={({ pressed }) => [styles.resultCard, pressed && styles.resultCardPressed]}>
          <Text style={styles.resultName}>{result.name}</Text>
          <Text style={styles.resultMeta}>
            {result.federation} | {result.sex} | {result.equipment}
          </Text>
          <Text style={styles.resultMeta}>
            Class {result.weightClass}
          </Text>
          <Text style={styles.resultMeta}>
            Dots {formatNumber(result.dots)}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f1117',
    paddingHorizontal: 16,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 30,
  },
  title: {
    color: '#f5f5f5',
    fontSize: 24,
    fontWeight: '700',
  },
  helperText: {
    marginTop: 8,
    color: '#8f98a8',
    fontSize: 14,
  },
  searchInput: {
    marginTop: 14,
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a3141',
    backgroundColor: '#171b25',
    color: '#f5f5f5',
    fontSize: 15,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  recentSection: {
    marginTop: 4,
  },
  recentTitle: {
    color: '#d5dbeb',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  recentList: {
    gap: 8,
  },
  recentCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#262d3d',
    backgroundColor: '#171b25',
    overflow: 'hidden',
  },
  recentCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  recentCardMain: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 12,
    gap: 4,
  },
  deleteButton: {
    paddingTop: 12,
    paddingRight: 12,
    paddingBottom: 12,
    paddingLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonPressed: {
    opacity: 0.6,
  },
  deleteButtonLabel: {
    color: '#8f98a8',
    fontSize: 18,
    fontWeight: '700',
  },
  resultCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#262d3d',
    backgroundColor: '#171b25',
    padding: 12,
    gap: 4,
  },
  resultCardPressed: {
    opacity: 0.85,
  },
  resultName: {
    color: '#f5f5f5',
    fontSize: 16,
    fontWeight: '700',
  },
  resultMeta: {
    color: '#b4bdd0',
    fontSize: 13,
  },
  emptyState: {
    marginTop: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  emptyText: {
    color: '#d5dbeb',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySubtext: {
    marginTop: 6,
    color: '#8f98a8',
    fontSize: 13,
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: '#e63012',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    marginTop: 14,
  },
  primaryButtonLabel: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  endText: {
    marginTop: 14,
    color: '#8f98a8',
    fontSize: 12,
    textAlign: 'center',
  },
});