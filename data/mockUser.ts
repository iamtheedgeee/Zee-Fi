import { User } from '@/types';

export const mockUser: User = {
  id: 'user-001',
  name: 'Alex Johnson',
  email: 'alex.johnson@gmail.com',
  memberSince: '2023-01-15',
  // No real image asset available yet — UI will show initials fallback
  avatarUri: null,
};
