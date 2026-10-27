
import { useEffect, useRef } from 'react';
import {
    ActivityIndicator,
    Animated,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

type SyncStatus = 'loading' | 'success' | 'error';

type Props = {
  visible: boolean;
  status: SyncStatus;
  message?: string;
  onClose: () => void;
};

export default function SyncStatusModal({
  visible,
  status,
  message,
  onClose,
}: Props) {
  const scale = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 7,
      }).start();
    } else {
      scale.setValue(0.92);
    }
  }, [visible, scale]);

  const isLoading = status === 'loading';
  const isSuccess = status === 'success';

  const title = isLoading
    ? 'Syncing your data'
    : isSuccess
      ? 'Sync complete'
      : 'Sync failed';

  const description = message ??
    (isLoading
      ? 'Please wait while we securely sync your financial data.'
      : isSuccess
        ? 'Your data has been synced successfully.'
        : 'Something went wrong while syncing your data.');

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={isLoading ? () => {} : onClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.card,
            { transform: [{ scale }] },
          ]}
        >
          <View
            style={[
              styles.iconCircle,
              isLoading
                ? styles.loadingCircle
                : isSuccess
                  ? styles.successCircle
                  : styles.errorCircle,
            ]}
          >
            {isLoading ? (
              <ActivityIndicator size="large" color="#6366F1" />
            ) : (
              <Text
                style={[
                  styles.statusIcon,
                  { color: isSuccess ? '#16A34A' : '#DC2626' },
                ]}
              >
                {isSuccess ? '✓' : '!'}
              </Text>
            )}
          </View>

          <Text style={styles.title}>{title}</Text>

          <Text style={styles.description}>
            {description}
          </Text>

          {isLoading ? (
            <View style={styles.progressTrack}>
              <View style={styles.progressBar} />
            </View>
          ) : (
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.button,
                isSuccess ? styles.successButton : styles.errorButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.buttonText}>Got it</Text>
            </Pressable>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 12, 25, 0.58)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 26,
    paddingVertical: 32,
    alignItems: 'center',
    elevation: 12,
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 22,
  },
  loadingCircle: {
    backgroundColor: '#EEF2FF',
  },
  successCircle: {
    backgroundColor: '#DCFCE7',
  },
  errorCircle: {
    backgroundColor: '#FEE2E2',
  },
  statusIcon: {
    fontSize: 38,
    fontWeight: '700',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
    color: '#6B7280',
    textAlign: 'center',
  },
  progressTrack: {
    width: '100%',
    height: 5,
    borderRadius: 5,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
    marginTop: 28,
  },
  progressBar: {
    width: '35%',
    height: '100%',
    borderRadius: 5,
    backgroundColor: '#6366F1',
  },
  button: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 26,
  },
  successButton: {
    backgroundColor: '#16A34A',
  },
  errorButton: {
    backgroundColor: '#DC2626',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
