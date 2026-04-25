import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type DataLoadStateProps = {
  title: string;
  message: string;
  isOffline?: boolean;
  retryLabel?: string;
  onRetry?: () => void;
  secondaryLabel?: string;
  onSecondaryAction?: () => void;
};

export function DataLoadState({
  title,
  message,
  isOffline = false,
  retryLabel = 'Try again',
  onRetry,
  secondaryLabel,
  onSecondaryAction,
}: DataLoadStateProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.iconCircle}>
        <Ionicons
          name={isOffline ? 'cloud-offline-outline' : 'alert-circle-outline'}
          size={42}
          color={isOffline ? '#e63012' : '#f5f5f5'}
        />
      </View>

      <Text style={styles.title}>{isOffline ? 'You are not connected' : title}</Text>
      <Text style={styles.message}>{isOffline ? 'You are offline. Please check your connection.' : message}</Text>

      <View style={styles.actions}>
        {onRetry ? (
          <Pressable style={styles.primaryButton} onPress={onRetry}>
            <Text style={styles.primaryButtonLabel}>{retryLabel}</Text>
          </Pressable>
        ) : null}

        {secondaryLabel && onSecondaryAction ? (
          <Pressable style={styles.secondaryButton} onPress={onSecondaryAction}>
            <Text style={styles.secondaryButtonLabel}>{secondaryLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    width: '100%',
  },
  iconCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#171b25',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  message: {
    color: '#9ba3c2',
    fontSize: 15,
    marginTop: 8,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    marginTop: 18,
    gap: 10,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#e63012',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  primaryButtonLabel: {
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
});
