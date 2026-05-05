import analytics from '@react-native-firebase/analytics';

type LeaderboardRequestPayload = {
  federation: string;
  weightClass: string;
  sex: string;
  equipment: string;
  liftType: string;
  sortBy: string;
};

export async function logLeaderboardRequest(payload: LeaderboardRequestPayload): Promise<void> {
  try {
    await analytics().logEvent('leaderboard_request', {
      federation: payload.federation,
      weight_class: payload.weightClass,
      sex: payload.sex,
      equipment: payload.equipment,
      lift_type: payload.liftType,
      sort_by: payload.sortBy,
      source: 'filter_apply',
    });
  } catch {
    // Keep leaderboard UX non-blocking even if analytics is unavailable.
  }
}
