import type { Playbook } from '@/types';

/**
 * Remediation Playbook catalog.
 *
 * Each playbook maps to a finding produced by the risk engine. Steps are
 * ordered, each with a plain-language explanation, a concrete action, an
 * optional deep link to a legitimate settings page, and a verification
 * method. No step performs a security-sensitive change silently — every
 * action requires the user to act and confirm.
 */
export const PLAYBOOKS: Playbook[] = [
  {
    id: 'protect_exposed_password',
    title: 'Protect an Exposed Password',
    category: 'password_hygiene',
    forFinding: 'Password exposure detected',
    summary:
      'This password appears in known compromised-password datasets. Stop using it immediately and secure your accounts.',
    estimatedMinutes: 5,
    steps: [
      {
        index: 0,
        title: 'Stop using this password',
        explanation: 'Never use this password again. Attackers use automated tools to test leaked passwords against thousands of websites every minute.',
        action: 'I understand',
        verification: 'user_reported',
      },
      {
        index: 1,
        title: 'Identify where you reused it',
        explanation: 'Think of any important accounts (email, banking, social media) where you might have used this exact password or a slight variation of it.',
        action: 'Accounts identified',
        verification: 'user_reported',
      },
      {
        index: 2,
        title: 'Change those passwords',
        explanation: 'Log into those services and change your password immediately. Prioritize your primary email account first, as it controls access to other accounts.',
        action: 'Passwords changed',
        verification: 'user_reported',
      },
      {
        index: 3,
        title: 'Use a unique password for each account',
        explanation: 'When changing passwords, ensure you use a completely different password for every service. Do not just append a number to the old password.',
        action: 'Unique passwords set',
        verification: 'user_reported',
      },
      {
        index: 4,
        title: 'Enable Two-Factor Authentication',
        explanation: 'Turn on 2FA (like an authenticator app) for all your important accounts. This protects you even if a password is stolen.',
        action: '2FA enabled',
        verification: 'user_reported',
      },
      {
        index: 5,
        title: 'Consider using a password manager',
        explanation: 'A password manager generates and remembers strong, unique passwords for every site automatically.',
        action: 'I use a password manager',
        verification: 'user_reported',
      },
      {
        index: 6,
        title: 'Watch for suspicious activity',
        explanation: 'Be on the lookout for strange login alerts, password reset emails you didn\'t request, or targeted phishing attempts.',
        action: 'I am on alert',
        verification: 'user_reported',
      },
    ],
  },
  {
    id: 'protect_breached_account',
    title: 'Protect a Breached Account',
    category: 'account_security',
    forFinding: 'Account exposure detected',
    estimatedMinutes: 5,
    summary:
      'Take immediate action to secure your account after its credentials or associated information appeared in a public data breach.',
    steps: [
      {
        index: 0,
        title: 'Change the affected account password',
        explanation:
          'The password you used when the breach occurred is no longer a secret. If you still use it on that site, or any other site, attackers can use it to sign in as you.',
        action: 'Log in to the affected service and change your password.',
        verification: 'You can sign in with the new password.',
      },
      {
        index: 1,
        title: 'Make sure the new password is unique',
        explanation:
          'If you reuse the same password on multiple sites, a single breach exposes all of them (known as credential stuffing).',
        action: 'Use a password manager or a passphrase to ensure the new password is long and not used anywhere else.',
        verification: 'The new password does not match any other password you use.',
      },
      {
        index: 2,
        title: 'Enable two-factor authentication',
        explanation:
          'Two-factor authentication (2FA) stops attackers even if they know your password.',
        action: 'Find the security settings for the breached account and turn on two-step verification or 2FA.',
        verification: 'The service requires a code or prompt when you sign in.',
      },
      {
        index: 3,
        title: 'Review active sessions and devices',
        explanation:
          'If an attacker already used the exposed credentials to sign in, they might still be logged in even after you change your password.',
        action: 'Check the active sessions in your account settings and sign out of any device you do not recognize.',
        verification: 'Only your current, recognized devices appear in the active sessions list.',
      },
      {
        index: 4,
        title: 'Check account recovery information',
        explanation:
          'Attackers sometimes change recovery emails or phone numbers to maintain access.',
        action: 'Verify that the recovery email and phone number listed in your account settings actually belong to you.',
        verification: 'Recovery details match your current contact info.',
      },
      {
        index: 5,
        title: 'Watch out for targeted phishing',
        explanation:
          'Because your information is in a breach, attackers may use your name or exposed details to craft convincing fake emails.',
        action: 'Be extremely cautious of unexpected emails asking you to log in, verify details, or click links regarding the breached account.',
        verification: 'You understand that legitimate companies rarely email asking for your password.',
      },
    ],
  },
  {
    id: 'enable_2fa',
    title: 'Enable Two-Factor Authentication',
    category: 'account_security',
    forFinding: 'Two-factor authentication is not enabled',
    estimatedMinutes: 5,
    summary:
      'Add a second verification step to your most important accounts so a password alone is not enough to break in.',
    steps: [
      {
        index: 0,
        title: 'Start with your email account',
        explanation:
          'Your email is the key to resetting every other password. Securing it first stops attackers from using it to take over other accounts.',
        action: 'Open your email provider security settings and find the two-factor or two-step verification section.',
        deepLink: 'https://myaccount.google.com/security',
        verification: 'Confirm you see 2-Step Verification or similar turned ON.',
      },
      {
        index: 1,
        title: 'Enable 2FA on banking and financial accounts',
        explanation:
          'Financial accounts cause the most harm if compromised. Protect them with a second factor such as a phone prompt or authenticator app.',
        action: 'Sign in to each banking or payment app and enable two-factor authentication in security settings.',
        verification: 'Log out and back in to confirm a second verification step is required.',
      },
      {
        index: 2,
        title: 'Enable 2FA on social media',
        explanation:
          'Social accounts can be used to phish your contacts and damage your reputation.',
        action: 'Open security settings on each social platform and turn on two-factor authentication.',
        verification: 'Each platform lists 2FA as active in its security settings.',
      },
      {
        index: 3,
        title: 'Use an authenticator app instead of SMS where possible',
        explanation:
          'Authenticator apps are harder to intercept than text messages.',
        action: 'Install an authenticator app and switch each account to it.',
        verification: 'Your accounts show the authenticator app as the verification method.',
      },
    ],
  },
  {
    id: 'update_recovery_info',
    title: 'Update Recovery Contact Information',
    category: 'account_security',
    forFinding: 'Recovery contact information may be outdated',
    estimatedMinutes: 5,
    summary:
      'Make sure your recovery email and phone number are current so you can regain access if you are ever locked out.',
    steps: [
      {
        index: 0,
        title: 'Open your main email account security settings',
        explanation:
          'Recovery options live in the security or account settings of your email provider.',
        action: 'Navigate to the recovery or account recovery section.',
        deepLink: 'https://myaccount.google.com/security',
        verification: 'You can see the recovery email and phone listed.',
      },
      {
        index: 1,
        title: 'Verify or update the recovery email and phone',
        explanation:
          'A current recovery email and phone let you safely regain access after a lockout.',
        action: 'Update any outdated contact details and confirm them via the verification message sent to each.',
        verification: 'Both the recovery email and phone show as verified.',
      },
    ],
  },
  {
    id: 'review_sessions',
    title: 'Review Active Login Sessions',
    category: 'account_security',
    forFinding: 'Active login sessions have not been reviewed',
    estimatedMinutes: 5,
    summary:
      'Check which devices and apps still have access to your accounts and remove anything you do not recognize.',
    steps: [
      {
        index: 0,
        title: 'Open account security settings',
        explanation:
          'Most providers list where your account is currently signed in.',
        action: 'Find the "Where you are signed in" or "Active sessions" section.',
        deepLink: 'https://myaccount.google.com/device-activity',
        verification: 'You see a list of devices and sessions.',
      },
      {
        index: 1,
        title: 'Remove unfamiliar sessions',
        explanation:
          'Any device or location you do not recognize could be an attacker.',
        action: 'Sign out of any session you do not recognize or no longer use.',
        verification: 'Only devices you recognize remain in the list.',
      },
    ],
  },
  {
    id: 'unique_passwords',
    title: 'Use Unique Passwords for Every Account',
    category: 'password_hygiene',
    forFinding: 'Passwords are reused across many accounts',
    estimatedMinutes: 5,
    summary:
      'Stop reusing passwords so that one breach cannot expose multiple accounts.',
    steps: [
      {
        index: 0,
        title: 'Identify where passwords are reused',
        explanation:
          'Make a list of accounts that share the same password, starting with the most important ones.',
        action: 'Write down (privately) which accounts currently share a password.',
        verification: 'You have a list of accounts to update.',
      },
      {
        index: 1,
        title: 'Create a unique password for each important account',
        explanation:
          'Each password should be long, random, and not used anywhere else.',
        action: 'Generate a new unique password for each account on your list, starting with email and banking.',
        verification: 'Each account on your list has its own password.',
      },
      {
        index: 2,
        title: 'Store them in a password manager',
        explanation:
          'A password manager remembers them so you do not have to.',
        action: 'Save each new password in your password manager.',
        verification: 'You can sign in to each account using only your password manager.',
      },
    ],
  },
  {
    id: 'adopt_password_manager',
    title: 'Adopt a Password Manager',
    category: 'password_hygiene',
    forFinding: 'No password manager in use',
    estimatedMinutes: 5,
    summary:
      'A password manager generates and remembers strong, unique passwords for every account.',
    steps: [
      {
        index: 0,
        title: 'Choose a reputable password manager',
        explanation:
          'Look for one with strong encryption and a good security reputation.',
        action: 'Pick a password manager and create your account.',
        verification: 'You have a password manager account set up.',
      },
      {
        index: 1,
        title: 'Import or add your existing accounts',
        explanation:
          'Add each account so the manager can remember and autofill your passwords.',
        action: 'Add your accounts one by one, generating new strong passwords as you go.',
        verification: 'Your most important accounts appear in the manager.',
      },
    ],
  },
  {
    id: 'strengthen_passwords',
    title: 'Strengthen Weak Passwords',
    category: 'password_hygiene',
    forFinding: 'Passwords may be weak',
    estimatedMinutes: 5,
    summary:
      'Replace short or simple passwords with long, complex ones that resist guessing.',
    steps: [
      {
        index: 0,
        title: 'Identify your weakest passwords',
        explanation:
          'Short passwords, common words, and patterns are easy for attackers to crack.',
        action: 'List the accounts where your password is short or easy to guess.',
        verification: 'You have a list of accounts with weak passwords.',
      },
      {
        index: 1,
        title: 'Replace each with a long, random password',
        explanation:
          'Aim for 14+ characters mixing letters, numbers, and symbols — or use a passphrase.',
        action: 'Generate and set a new strong password for each account on your list.',
        verification: 'Each updated password is 14+ characters and unique.',
      },
    ],
  },
  {
    id: 'enable_auto_updates',
    title: 'Enable Automatic Updates',
    category: 'app_security',
    forFinding: 'Apps and software are not updating automatically',
    estimatedMinutes: 5,
    summary:
      'Turn on automatic updates so security fixes are applied as soon as they are released.',
    steps: [
      {
        index: 0,
        title: 'Enable automatic app updates',
        explanation:
          'App stores can install updates in the background so you always have the latest fixes.',
        action: 'Open your app store settings and enable automatic updates.',
        verification: 'The setting shows automatic updates as ON.',
      },
      {
        index: 1,
        title: 'Enable automatic operating system updates',
        explanation:
          'OS updates fix the most serious vulnerabilities.',
        action: 'Open system settings and turn on automatic OS updates.',
        verification: 'Automatic OS updates show as enabled.',
      },
    ],
  },
  {
    id: 'remove_unused_apps',
    title: 'Remove Unused Apps',
    category: 'app_security',
    forFinding: 'Many unused apps are installed',
    estimatedMinutes: 5,
    summary:
      'Delete apps you no longer use so they can no longer access your data or introduce vulnerabilities.',
    steps: [
      {
        index: 0,
        title: 'List apps you have not opened recently',
        explanation:
          'Unused apps still hold the permissions you granted them.',
        action: 'Review your installed apps and identify ones you have not used in months.',
        verification: 'You have a list of apps to remove.',
      },
      {
        index: 1,
        title: 'Uninstall each unused app',
        explanation:
          'Removing an app also revokes the permissions it held.',
        action: 'Uninstall each app on your list.',
        verification: 'Your app list no longer contains the removed apps.',
      },
    ],
  },
  {
    id: 'review_app_sources',
    title: 'Only Install Apps from Trusted Sources',
    category: 'app_security',
    forFinding: 'Apps installed from untrusted sources',
    estimatedMinutes: 5,
    summary:
      'Apps from outside official stores are more likely to contain malware. Audit and remove them.',
    steps: [
      {
        index: 0,
        title: 'Identify apps installed outside official stores',
        explanation:
          'Sideloading apps bypasses the checks that official stores perform.',
        action: 'Review your installed apps and flag any that did not come from an official store.',
        verification: 'You know which apps came from unofficial sources.',
      },
      {
        index: 1,
        title: 'Remove untrusted apps',
        explanation:
          'If you cannot verify an app is safe, removing it is the safest choice.',
        action: 'Uninstall apps from untrusted sources.',
        verification: 'Only apps from official stores remain.',
      },
    ],
  },
  {
    id: 'review_permissions',
    title: 'Review App Permissions',
    category: 'privacy',
    forFinding: 'App permissions have not been reviewed',
    estimatedMinutes: 5,
    summary:
      'Check which apps can access your camera, microphone, location, and contacts, and remove access they do not need.',
    steps: [
      {
        index: 0,
        title: 'Open your device privacy or permission settings',
        explanation:
          'Most operating systems list which apps have access to each sensitive capability.',
        action: 'Navigate to privacy or permission settings on your device or browser.',
        verification: 'You see a list of apps per permission.',
      },
      {
        index: 1,
        title: 'Remove access apps do not need',
        explanation:
          'A flashlight app does not need your contacts. A calculator does not need your location.',
        action: 'For each permission, revoke access from apps that have no good reason to use it.',
        verification: 'Only apps with a clear need retain each permission.',
      },
    ],
  },
  {
    id: 'limit_location_access',
    title: 'Limit Location Access',
    category: 'privacy',
    forFinding: 'Location sharing is always on for non-essential apps',
    estimatedMinutes: 5,
    summary:
      'Stop apps that do not need your location from tracking your movements.',
    steps: [
      {
        index: 0,
        title: 'Open location permission settings',
        explanation:
          'Review which apps can see your location and how often.',
        action: 'Open your device or browser location settings.',
        verification: 'You see a list of apps with location access.',
      },
      {
        index: 1,
        title: 'Set location access to "only while using" or "never"',
        explanation:
          'Apps that do not need your location to work should not have it at all.',
        action: 'Change each non-essential app to "Only while using the app" or "Never".',
        verification: 'No non-essential app has "Always" location access.',
      },
    ],
  },
  {
    id: 'check_breaches',
    title: 'Check Your Email Against Known Data Breaches',
    category: 'privacy',
    forFinding: 'Email has not been checked against known data breaches',
    estimatedMinutes: 5,
    summary:
      'Find out whether your email and passwords have appeared in a known breach, then change any exposed passwords.',
    steps: [
      {
        index: 0,
        title: 'Run a breach check',
        explanation:
          'We check your email address against a database of known data breaches. We never store your password.',
        action: 'Enter the email address you want to check in the breach check tool.',
        verification: 'You see a report of any breaches involving your email.',
      },
      {
        index: 1,
        title: 'Change any exposed passwords',
        explanation:
          'For each breach that exposed a password, set a new, unique password for that account.',
        action: 'Update the password on every account that appeared in a breach.',
        verification: 'All breached accounts now have new, unique passwords.',
      },
    ],
  },
  {
    id: 'enable_device_lock',
    title: 'Enable a Device Screen Lock',
    category: 'device_security',
    forFinding: 'Device may not have a screen lock',
    estimatedMinutes: 5,
    summary:
      'Add a PIN, password, or biometric lock so no one can use your device without your permission.',
    steps: [
      {
        index: 0,
        title: 'Open device security settings',
        explanation:
          'Screen lock settings live under security or display settings on most devices.',
        action: 'Navigate to your device security or lock screen settings.',
        verification: 'You see the screen lock options.',
      },
      {
        index: 1,
        title: 'Set a strong PIN, password, or biometric lock',
        explanation:
          'A 6+ digit PIN or longer password is far harder to guess than a 4-digit one.',
        action: 'Choose and set a screen lock method.',
        verification: 'Locking and waking the device requires the lock.',
      },
    ],
  },
  {
    id: 'update_os',
    title: 'Update Your Operating System',
    category: 'device_security',
    forFinding: 'Device operating system is not up to date',
    estimatedMinutes: 5,
    summary:
      'Install the latest operating system updates to close known security gaps.',
    steps: [
      {
        index: 0,
        title: 'Check for system updates',
        explanation:
          'Updates include fixes for known vulnerabilities that attackers can exploit.',
        action: 'Open your device system update settings and check for updates.',
        verification: 'You see whether an update is available.',
      },
      {
        index: 1,
        title: 'Install available updates',
        explanation:
          'Install all pending updates and restart if asked.',
        action: 'Install the update and confirm the device restarts successfully.',
        verification: 'System settings show the device is up to date.',
      },
    ],
  },
  {
    id: 'secure_home_wifi',
    title: 'Secure Your Home Wi-Fi',
    category: 'network_security',
    forFinding: 'Home Wi-Fi may not be password protected',
    estimatedMinutes: 5,
    summary:
      'Add a strong password to your Wi-Fi so only people you allow can connect.',
    steps: [
      {
        index: 0,
        title: 'Sign in to your router admin page',
        explanation:
          'Router settings are usually reached by typing the router IP address into a browser.',
        action: 'Open your router admin page and sign in.',
        verification: 'You are in the router settings.',
      },
      {
        index: 1,
        title: 'Set WPA2 or WPA3 with a strong password',
        explanation:
          'WPA2 or WPA3 encryption with a long password keeps your network private.',
        action: 'Enable WPA2/WPA3 security and set a strong Wi-Fi password.',
        verification: 'Devices must enter the password to connect.',
      },
    ],
  },
  {
    id: 'use_vpn_public_wifi',
    title: 'Use a VPN on Public Wi-Fi',
    category: 'network_security',
    forFinding: 'No VPN used on public Wi-Fi',
    estimatedMinutes: 5,
    summary:
      'A VPN encrypts your internet traffic on public networks so others nearby cannot spy on it.',
    steps: [
      {
        index: 0,
        title: 'Choose a reputable VPN',
        explanation:
          'Look for a VPN with a clear no-logs policy and strong encryption.',
        action: 'Select and install a VPN app.',
        verification: 'The VPN app is installed and you can sign in.',
      },
      {
        index: 1,
        title: 'Turn it on before using public Wi-Fi',
        explanation:
          'The VPN must be active before you connect to public Wi-Fi to protect your traffic.',
        action: 'Connect to the VPN whenever you join a public network.',
        verification: 'The VPN status indicator shows as connected.',
      },
    ],
  },
  {
    id: 'review_auto_fill',
    title: 'Review Auto-fill Data',
    category: 'privacy',
    forFinding: 'Clipboard access',
    estimatedMinutes: 5,
    summary: 'Ensure only necessary information is saved for auto-fill in your browser and on your devices.',
    steps: [
      {
        index: 0,
        title: 'Review saved auto-fill data',
        explanation: 'Review the passwords, addresses, and payment methods saved for auto-fill and remove any that are no longer needed.',
        action: 'Go to your browser or device settings and review the auto-fill data.',
        verification: 'You have removed unnecessary auto-fill data.'
      }
    ]
  },
  {
    id: 'remove_risky_app',
    title: 'Remove Risky or Sideloaded App',
    category: 'app_security',
    forFinding: 'Sideloaded app',
    estimatedMinutes: 5,
    summary: 'Uninstall an application that has been flagged for highly suspicious behavior or dangerous permissions.',
    steps: [
      {
        index: 0,
        title: 'Uninstall the suspicious application',
        explanation: 'The application flagged by our scan was installed outside of official stores and requests dangerous access to your device. This is often how malware operates.',
        action: 'Go to your device Settings > Apps > see all apps. Find the flagged app and tap Uninstall.',
        verification: 'The application is no longer listed in your installed apps.',
      }
    ]
  },
  {
    id: 'review_app_permissions',
    title: 'Review Outdated App Permissions',
    category: 'app_security',
    forFinding: 'Sensitive permissions',
    estimatedMinutes: 5,
    summary: 'Review permissions for an application targeting an older version of Android.',
    steps: [
      {
        index: 0,
        title: 'Check granted permissions',
        explanation: 'Apps targeting older Android versions might bypass newer privacy controls. Ensure it only has access to what it strictly needs.',
        action: 'Go to device Settings > Apps. Find the app, tap Permissions, and revoke access to Location, Camera, or Microphone if not needed.',
        verification: 'You have restricted unnecessary permissions for this app.',
      }
    ]
  },
  {
    id: 'enable_device_lock',
    title: 'Enable Device Screen Lock',
    category: 'device_security',
    forFinding: 'Screen lock is disabled',
    estimatedMinutes: 5,
    summary: 'A screen lock prevents unauthorized physical access to your device and your accounts.',
    steps: [
      {
        index: 0,
        title: 'Open your device security settings',
        explanation: 'The screen lock options are typically found in the Settings app under Security or Lock Screen.',
        action: 'Navigate to Settings > Security (or Lock Screen).',
        verification: 'You are on the security settings screen.',
      },
      {
        index: 1,
        title: 'Set up a PIN, password, or biometric lock',
        explanation: 'A strong PIN (at least 6 digits) or password is required. You can also enable fingerprint or face unlock for convenience.',
        action: 'Choose your preferred lock method and configure it.',
        verification: 'Your device now requires authentication to unlock.',
      },
    ],
  },
  {
    id: 'enable_encryption',
    title: 'Enable Device Encryption',
    category: 'device_security',
    forFinding: 'Device encryption is disabled',
    estimatedMinutes: 5,
    summary: 'Encryption protects your files, photos, and messages even if your device is stolen and physically dismantled.',
    steps: [
      {
        index: 0,
        title: 'Open encryption settings',
        explanation: 'Most modern devices encrypt data by default, but it might be turned off or require a screen lock to activate.',
        action: 'Go to Settings > Security > Encryption (or similar on your device).',
        verification: 'You see the encryption status of your device.',
      },
      {
        index: 1,
        title: 'Encrypt the device',
        explanation: 'Follow the prompts to encrypt your device storage. This may take some time and require your device to be plugged in.',
        action: 'Select "Encrypt device" and follow the on-screen instructions.',
        verification: 'Your device settings report that it is encrypted.',
      },
    ],
  },
  {
    id: 'update_os',
    title: 'Update Operating System',
    category: 'device_security',
    forFinding: 'Device operating system is outdated',
    estimatedMinutes: 5,
    summary: 'Operating system updates contain critical fixes for known security vulnerabilities.',
    steps: [
      {
        index: 0,
        title: 'Check for system updates',
        explanation: 'Your device manufacturer or OS provider regularly releases patches to fix security holes.',
        action: 'Go to Settings > System > System Update (or Software Update).',
        verification: 'You are on the system update screen.',
      },
      {
        index: 1,
        title: 'Install available updates',
        explanation: 'Installing updates will likely require a restart. Do not turn off your device during this process.',
        action: 'Tap "Download and install" or "Check for updates" and complete the installation.',
        verification: 'Your device reports that the software is up to date.',
      },
    ],
  },
  {
    id: 'review_boot_security',
    title: 'Review Boot Security',
    category: 'device_security',
    forFinding: 'Secure boot verification failed',
    estimatedMinutes: 5,
    summary: 'Your device reported a Secure Boot failure, which could mean the operating system has been tampered with.',
    steps: [
      {
        index: 0,
        title: 'Do not ignore boot warnings',
        explanation: 'If you see warnings when turning on your device (e.g., "Your device software cannot be checked for corruption"), the core operating system might be compromised.',
        action: 'Take note of any warnings displayed during startup.',
        verification: 'You are aware of the boot warning.',
      },
      {
        index: 1,
        title: 'Consider a factory reset or professional help',
        explanation: 'If you did not intentionally unlock your bootloader, this is a serious security risk. A factory reset might be necessary, or the device may need to be wiped by a professional.',
        action: 'Back up your essential data (files, photos) and perform a factory data reset from Settings.',
        verification: 'The device starts up without security warnings.',
      },
    ],
  },
  {
    id: 'review_root_status',
    title: 'Review Root or Jailbreak Status',
    category: 'device_security',
    forFinding: 'Root or jailbreak indicators detected',
    estimatedMinutes: 5,
    summary: 'Rooting or jailbreaking removes the security boundaries that keep apps from accessing each other\'s data.',
    steps: [
      {
        index: 0,
        title: 'Understand the risks',
        explanation: 'A rooted or jailbroken device allows apps to gain full control over the system, making it extremely vulnerable to malware.',
        action: 'Acknowledge the risks associated with this modified state.',
        verification: 'You understand the device is operating outside normal security boundaries.',
      },
      {
        index: 1,
        title: 'Restore factory firmware',
        explanation: 'The only way to fully secure a compromised or intentionally rooted device is to reinstall the official operating system.',
        action: 'Unroot the device using the appropriate management app, or flash the factory firmware.',
        verification: 'Root checking apps or SafetyNet tests pass successfully.',
      },
    ],
  },
  {
    id: 'disable_developer_mode',
    title: 'Disable Developer Mode',
    category: 'device_security',
    forFinding: 'Developer mode is enabled',
    estimatedMinutes: 5,
    summary: 'Developer options expose powerful debugging tools (like USB debugging) that attackers can abuse if they get physical access to your device.',
    steps: [
      {
        index: 0,
        title: 'Find developer options',
        explanation: 'These options are usually hidden but were manually activated on this device.',
        action: 'Go to Settings > System > Developer Options (or directly in Settings).',
        verification: 'You have opened the Developer Options menu.',
      },
      {
        index: 1,
        title: 'Turn off developer options',
        explanation: 'Disabling these options secures your device against debugging attacks via USB or network.',
        action: 'Toggle the main switch at the top of the Developer Options screen to "Off".',
        verification: 'The Developer Options menu disappears or is disabled.',
      },
    ],
  },
  {
    id: 'enable_security_software',
    title: 'Enable Security Protections',
    category: 'device_security',
    forFinding: 'Security protections are disabled',
    estimatedMinutes: 5,
    summary: 'Built-in security scanning (like Google Play Protect) helps detect and remove malicious apps before they can cause harm.',
    steps: [
      {
        index: 0,
        title: 'Open security settings',
        explanation: 'Your device has built-in protections that are currently turned off.',
        action: 'Open the Google Play Store, tap your profile icon, and select Play Protect.',
        verification: 'You are on the Play Protect screen.',
      },
      {
        index: 1,
        title: 'Turn on app scanning',
        explanation: 'Scanning ensures that apps are checked for malicious behavior.',
        action: 'Tap the gear icon (Settings) and turn on "Scan apps with Play Protect".',
        verification: 'Play Protect reports that scanning is turned on.',
      },
    ],
  },
  {
    id: 'avoid_insecure_networks',
    title: 'Avoid Insecure Wi-Fi Networks',
    category: 'network_security',
    forFinding: 'Network risk detected',
    estimatedMinutes: 5,
    summary: 'You are connected to an unencrypted public Wi-Fi network without a VPN. Other people on this network could intercept your traffic.',
    steps: [
      {
        index: 0,
        title: 'Understand the risk of open Wi-Fi',
        explanation: 'Open Wi-Fi networks broadcast all data without encryption. While HTTPS protects websites, attackers can still see which sites you visit and may attempt to intercept unencrypted traffic.',
        action: 'Acknowledge that this network provides weaker protection.',
        verification: 'You understand the risks of public Wi-Fi.',
      },
      {
        index: 1,
        title: 'Disconnect or use a VPN',
        explanation: 'To protect your traffic, you should use a trusted cellular connection, a secure home network, or enable a Virtual Private Network (VPN).',
        action: 'Turn on your VPN or disconnect from the open Wi-Fi and use cellular data.',
        verification: 'You are connected to a secure network or using a VPN.',
      },
    ],
  },
  {
    id: 'enable_secure_dns',
    title: 'Enable Secure DNS',
    category: 'network_security',
    forFinding: 'Unencrypted DNS queries',
    estimatedMinutes: 5,
    summary: 'Your device is using unencrypted DNS. Your internet provider or network administrator can see the names of every website you visit.',
    steps: [
      {
        index: 0,
        title: 'Find Private DNS settings',
        explanation: 'Most modern operating systems and browsers support encrypted DNS (DNS-over-HTTPS or DNS-over-TLS).',
        action: 'Go to your device\'s Network & Internet settings and look for "Private DNS" or "Secure DNS".',
        verification: 'You have located the Secure DNS setting.',
      },
      {
        index: 1,
        title: 'Enable Private DNS',
        explanation: 'Enabling this feature encrypts your DNS queries, hiding your browsing destinations from local network observers.',
        action: 'Set the Private DNS mode to "Automatic" or specify a trusted provider (like Cloudflare or Google).',
        verification: 'Private DNS is enabled and active.',
      },
    ],
  }
];

export function getPlaybook(id: string): Playbook | undefined {
  return PLAYBOOKS.find((p) => p.id === id);
}
