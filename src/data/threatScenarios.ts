import type { ThreatScenario } from '@/types';

/**
 * Interactive threat simulations for the Learn screen.
 *
 * Each scenario walks the user through realistic situations and tests their
 * instincts with multiple-choice questions. Explanations are plain-language
 * and educational — no fear-mongering.
 */
export const threatScenarios: ThreatScenario[] = [
  {
    id: 'phishing_email',
    title: 'Spotting a Phishing Email',
    category: 'Social Engineering',
    difficulty: 'Beginner',
    duration: '3 min',
    summary:
      'You just received an email that looks like it is from your bank. Can you tell whether it is genuine?',
    scenes: [
      {
        id: 'p1',
        prompt:
          'An email arrives saying "Urgent: Your account has been suspended. Click here to verify your credentials." The sender shows "support@your-bank-secure.com". What do you do?',
        choices: [
          { label: 'Click the link and verify my details immediately' },
          { label: 'Do not click. Sign in to my bank by typing the address myself' },
          { label: 'Reply asking if this is really them' },
          { label: 'Forward it to a friend to ask their opinion' },
        ],
        correctIndex: 1,
        explanation:
          'Banks rarely ask you to click links to verify credentials. The sender domain is also slightly altered. Always navigate to your bank yourself by typing the address or using your saved bookmark.',
      },
      {
        id: 'p2',
        prompt:
          'The email also includes a phone number to call "immediately". You feel pressured. What is the safest response?',
        choices: [
          { label: 'Call the number in the email' },
          { label: 'Call the official number on the back of my bank card' },
          { label: 'Ignore it and hope it goes away' },
        ],
        correctIndex: 1,
        explanation:
          'Urgency is a classic manipulation tactic. If you want to check, always use the phone number printed on your card or statement — never one provided in an unsolicited message.',
      },
    ],
  },
  {
    id: 'public_wifi',
    title: 'Using Public Wi-Fi Safely',
    category: 'Network',
    difficulty: 'Beginner',
    duration: '3 min',
    summary:
      'You are at a cafe and want to get some work done on the free Wi-Fi. What could go wrong?',
    scenes: [
      {
        id: 'w1',
        prompt:
          'You see two networks: "CafeGuest" and "Cafe_Free_WiFi". Which do you connect to?',
        choices: [
          { label: 'Whichever has the strongest signal' },
          { label: 'Ask staff which is the real network before connecting' },
          { label: 'Connect to both and pick the faster one' },
        ],
        correctIndex: 1,
        explanation:
          'Attackers create look-alike Wi-Fi names to intercept your traffic. Always confirm the official network name with staff.',
      },
      {
        id: 'w2',
        prompt:
          'You are connected and need to check your bank account. What is the safest approach?',
        choices: [
          { label: 'Open the banking site as usual' },
          { label: 'Turn on a VPN first, then access banking' },
          { label: 'Wait until I am on a trusted network at home' },
        ],
        correctIndex: 2,
        explanation:
          'Public Wi-Fi can expose your traffic. A VPN helps, but for sensitive tasks like banking, waiting for a trusted network is the safest choice. If you must, always use a VPN.',
      },
    ],
  },
  {
    id: 'password_strength',
    title: 'Building Strong Passwords',
    category: 'Authentication',
    difficulty: 'Beginner',
    duration: '2 min',
    summary:
      'A friend asks you for password advice. Which recommendations are actually good?',
    scenes: [
      {
        id: 'pw1',
        prompt:
          'Your friend uses "Summer2024!" for every account because it has a capital letter, number, and symbol. Is this a good strategy?',
        choices: [
          { label: 'Yes, it meets all the complexity rules' },
          { label: 'No, it is reused and predictable — attackers guess these patterns' },
          { label: 'Only if they change the year each January' },
        ],
        correctIndex: 1,
        explanation:
          'Complexity rules alone do not make a password strong. Reusing it everywhere means one breach exposes everything, and patterns like Season+Year+! are among the first attackers try.',
      },
      {
        id: 'pw2',
        prompt: 'What is the best way to manage many unique passwords?',
        choices: [
          { label: 'Write them in a notebook by your computer' },
          { label: 'Use a reputable password manager' },
          { label: 'Use one strong password and add the site name to it' },
        ],
        correctIndex: 1,
        explanation:
          'A password manager generates and remembers a unique, strong password for every account. You only need to remember one master password.',
      },
    ],
  },
  {
    id: 'app_permissions',
    title: 'Understanding App Permissions',
    category: 'Privacy',
    difficulty: 'Intermediate',
    duration: '3 min',
    summary:
      'A new app asks for several permissions. Which ones make sense, and which should you refuse?',
    scenes: [
      {
        id: 'ap1',
        prompt:
          'A flashlight app requests access to your contacts and location. What should you do?',
        choices: [
          { label: 'Allow everything — it probably needs it' },
          { label: 'Deny contacts and location; a flashlight needs neither' },
          { label: 'Allow contacts but deny location' },
        ],
        correctIndex: 1,
        explanation:
          'A flashlight needs only camera flash control (on some platforms). Asking for contacts and location is a red flag — grant only what the feature genuinely requires.',
      },
      {
        id: 'ap2',
        prompt:
          'A maps app asks for location access. Which option is the best balance of convenience and privacy?',
        choices: [
          { label: 'Always allow, even when the app is closed' },
          { label: 'Allow only while using the app' },
          { label: 'Never allow' },
        ],
        correctIndex: 1,
        explanation:
          'A maps app needs location to navigate, but it does not need to track you when you are not using it. "Only while using the app" gives functionality without constant tracking.',
      },
    ],
  },
  {
    id: 'social_engineering',
    title: 'Resisting Social Engineering',
    category: 'Social Engineering',
    difficulty: 'Advanced',
    duration: '4 min',
    summary:
      'Someone contacts you claiming to be from IT support. Can you spot the manipulation?',
    scenes: [
      {
        id: 'se1',
        prompt:
          'You get a call at work: "This is IT. We detected a virus on your machine. I need your password to run a cleanup script." What do you do?',
        choices: [
          { label: 'Give them the password so they can fix it quickly' },
          { label: 'Refuse and report the call through your official IT channel' },
          { label: 'Give them a fake password and see what happens' },
        ],
        correctIndex: 1,
        explanation:
          'Legitimate IT will never ask for your password. This is a classic social engineering attack. Refuse and report it through the channel you already use for IT issues.',
      },
      {
        id: 'se2',
        prompt:
          'They then say "If you do not cooperate, your account will be disabled in 5 minutes." How do you respond?',
        choices: [
          { label: 'Comply — the deadline must be real' },
          { label: 'Stay calm; urgency is a manipulation tactic. Verify independently' },
          { label: 'Hang up and do nothing' },
        ],
        correctIndex: 1,
        explanation:
          'Creating false urgency prevents you from thinking clearly. Real IT issues are not resolved by demanding passwords under time pressure. Verify independently before acting.',
      },
    ],
  },
];
