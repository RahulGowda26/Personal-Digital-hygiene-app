import type { CheckupQuestion, SecurityCategory } from '@/types';

export const checkupCategories: SecurityCategory[] = [
  'account_security',
  'password_hygiene',
  'app_security',
  'privacy',
  'device_security',
  'network_security',
];

export const categoryLabels: Record<SecurityCategory, string> = {
  account_security: 'Account security',
  password_hygiene: 'Password hygiene',
  app_security: 'App security',
  privacy: 'Privacy',
  device_security: 'Device security',
  network_security: 'Network security',
};

export const categoryShortLabels: Record<SecurityCategory, string> = {
  account_security: 'Accounts',
  password_hygiene: 'Passwords',
  app_security: 'Apps',
  privacy: 'Privacy',
  device_security: 'Device',
  network_security: 'Network',
};

const options = (...values: Array<[string, string]>) =>
  values.map(([value, label]) => ({ value, label }));

export const checkupQuestions: CheckupQuestion[] = [
  {
    id: 'two_factor_enabled',
    category: 'account_security',
    label: 'How widely do you use two-factor authentication?',
    help: 'Use an authenticator app, security key, or another verification step beyond your password.',
    options: options(['yes_all', 'On all important accounts'], ['yes_some', 'On some accounts'], ['no', 'Not currently'], ['not_sure', 'I am not sure']),
  },
  {
    id: 'recovery_info_updated',
    category: 'account_security',
    label: 'Is your account recovery email and phone number up to date?',
    options: options(['yes', 'Yes'], ['maybe', 'Not sure'], ['no', 'No']),
  },
  {
    id: 'active_sessions_reviewed',
    category: 'account_security',
    label: 'Have you reviewed active sign-in sessions recently?',
    options: options(['yes', 'Yes'], ['no', 'No']),
  },
  {
    id: 'password_reuse',
    category: 'password_hygiene',
    label: 'How often do you reuse the same password?',
    options: options(['never', 'Never'], ['rarely', 'Rarely'], ['sometimes', 'Sometimes'], ['often', 'Often']),
  },
  {
    id: 'password_manager',
    category: 'password_hygiene',
    label: 'Do you use a password manager?',
    options: options(['yes', 'Yes'], ['no', 'No']),
  },
  {
    id: 'password_strength',
    category: 'password_hygiene',
    label: 'How would you describe your important passwords?',
    options: options(['strong', 'Unique and long'], ['medium', 'Some could be stronger'], ['weak', 'Short, simple, or reused']),
  },
  {
    id: 'app_updates',
    category: 'app_security',
    label: 'How are your apps and browser updated?',
    options: options(['yes', 'Automatically'], ['manual', 'I update them manually'], ['no', 'They are often out of date']),
  },
  {
    id: 'unused_apps',
    category: 'app_security',
    label: 'How many apps do you no longer use?',
    options: options(['no', 'None or almost none'], ['few', 'A few'], ['many', 'Many']),
  },
  {
    id: 'app_sources',
    category: 'app_security',
    label: 'Do you install apps only from trusted sources?',
    options: options(['yes', 'Always'], ['sometimes', 'Sometimes'], ['no', 'No']),
  },
  {
    id: 'app_permissions',
    category: 'privacy',
    label: 'How often do you review app permissions?',
    options: options(['yes', 'Regularly'], ['once', 'Only once'], ['no', 'Never']),
  },
  {
    id: 'location_sharing',
    category: 'privacy',
    label: 'Do non-essential apps have continuous location access?',
    options: options(['no', 'No'], ['sometimes', 'Some do'], ['yes', 'Yes']),
  },
  {
    id: 'data_breach_awareness',
    category: 'privacy',
    label: 'Have you checked whether your email appeared in a known breach?',
    help: 'This checkup does not send your email anywhere.',
    options: options(['yes', 'Yes'], ['no', 'No']),
  },
  {
    id: 'device_lock',
    category: 'device_security',
    label: 'Is your device protected by a screen lock?',
    options: options(['yes', 'Yes'], ['no', 'No'], ['not_sure', 'Not sure']),
  },
  {
    id: 'os_updates',
    category: 'device_security',
    label: 'How is your device operating system updated?',
    options: options(['yes', 'Automatically'], ['manual', 'I update it manually'], ['no', 'It is often out of date']),
  },
  {
    id: 'home_wifi_password',
    category: 'network_security',
    label: 'Is your home Wi-Fi protected with a strong, non-default password?',
    options: options(['yes', 'Yes'], ['no', 'No or not sure']),
  },
  {
    id: 'public_wifi',
    category: 'network_security',
    label: 'How do you protect sensitive activity on public Wi-Fi?',
    options: options(['always', 'I avoid it or use a VPN'], ['sometimes', 'Only sometimes'], ['never', 'I do not take extra precautions']),
  },
];

export function questionsByCategory(category: SecurityCategory): CheckupQuestion[] {
  return checkupQuestions.filter((question) => question.category === category);
}
