import { StyleSheet, Switch, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { ExternalLink } from '@/components/ExternalLink';
import { useUnitStore } from '@/stores/useUnitStore';

export default function ProfileScreen() {
  const unit = useUnitStore((state) => state.unit);
  const toggleUnit = useUnitStore((state) => state.toggleUnit);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Preferences</Text>

      <View style={styles.preferenceCard}>
        <View style={styles.preferenceRow}>
          <View style={styles.preferenceLabelRow}>
            <MaterialCommunityIcons name="kettlebell" size={22} color="#c7cde1" />
            <Text style={styles.preferenceLabel}>Weight Unit</Text>
          </View>

          <View style={styles.toggleRow}>
            <Text style={styles.unitLabel}>kg</Text>
            <Switch
              value={unit === 'lbs'}
              onValueChange={toggleUnit}
              thumbColor="#f5f5f5"
              trackColor={{ false: '#1e2130', true: '#e63012' }}
            />
            <Text style={styles.unitLabel}>lbs</Text>
          </View>
        </View>
      </View>

      <View style={styles.preferenceCard}>
        <ExternalLink
          href="https://cesagui.github.io/lift-surfer-privacy-policy/privacy-policy.html"
          style={styles.linkRow}>
          <MaterialCommunityIcons name="shield-lock-outline" size={22} color="#c7cde1" />
          <Text style={styles.preferenceLabel}>Privacy Policy</Text>
        </ExternalLink>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f1117',
    paddingHorizontal: 18,
    paddingTop: 20,
  },
  title: {
    color: '#f5f5f5',
    fontSize: 26,
    fontWeight: '700',
  },
  preferenceCard: {
    marginTop: 14,
    paddingVertical: 6,
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  preferenceLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  preferenceLabel: {
    color: '#f5f5f5',
    fontSize: 16,
    fontWeight: '700',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  unitLabel: {
    color: '#c7cde1',
    fontSize: 13,
    fontWeight: '700',
  },
});
