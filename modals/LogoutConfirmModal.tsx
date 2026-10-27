
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View
} from 'react-native';

type Props = {
  visible: boolean;
  syncing?: boolean;
  onSync: () => void;
  onLogout: () => void;
  onCancel: () => void;
};

export default function LogoutConfirmModal({
  visible,
  onSync,
  onLogout,
  onCancel,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Text style={styles.icon}>!</Text>
          </View>

          <Text style={styles.title}>Unsynced changes</Text>

          <Text style={styles.description}>
            You have financial data that hasn't been synced to your
            account. If you log out now, these changes will remain
            on this device but won't be available in the cloud.
          </Text>

          <Pressable
            onPress={()=>onSync}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.primaryText}>Sync now</Text> 
          </Pressable>

          <Pressable
            onPress={onLogout}
            style={({ pressed }) => [
              styles.logoutButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.logoutText}>Log out anyway</Text>
          </Pressable>

          <Pressable
            onPress={onCancel}
            style={({ pressed }) => [
              styles.cancelButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
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
    padding: 24,
    alignItems: 'center',
    elevation: 12,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  icon: {
    color: '#D97706',
    fontSize: 32,
    fontWeight: '700',
  },
  title: {
    color: '#111827',
    fontSize: 21,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    color: '#6B7280',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 24,
  },
  primaryButton: {
    width: '100%',
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    marginBottom: 10,
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  logoutButton: {
    width: '100%',
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    marginBottom: 6,
  },
  logoutText: {
    color: '#DC2626',
    fontSize: 15,
    fontWeight: '600',
  },
  cancelButton: {
    width: '100%',
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  cancelText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
  pressed: {
    opacity: 0.75,
  },
  disabled: {
    opacity: 0.6,
  },
});
