import { StyleSheet, Text, View } from 'react-native';

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.subtitle}>User preferences and account info will show here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f1117',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    color: '#f5f5f5',
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 10,
    color: '#8f98a8',
    fontSize: 15,
    textAlign: 'center',
  },
});
