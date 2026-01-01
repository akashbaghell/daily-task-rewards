import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'hi';

interface Translations {
  [key: string]: {
    en: string;
    hi: string;
  };
}

const translations: Translations = {
  // Navigation
  'nav.home': { en: 'Home', hi: 'होम' },
  'nav.videos': { en: 'Videos', hi: 'वीडियो' },
  'nav.dashboard': { en: 'Dashboard', hi: 'डैशबोर्ड' },
  'nav.referrals': { en: 'Referrals', hi: 'रेफरल' },
  'nav.profile': { en: 'Profile', hi: 'प्रोफाइल' },
  'nav.login': { en: 'Login', hi: 'लॉगिन' },
  'nav.signup': { en: 'Sign Up', hi: 'साइन अप' },
  'nav.logout': { en: 'Logout', hi: 'लॉगआउट' },

  // Home Page
  'home.hero.title': { en: 'Watch & Share Videos', hi: 'वीडियो देखें और शेयर करें' },
  'home.hero.subtitle': { en: 'Discover amazing videos and grow your network through referrals', hi: 'शानदार वीडियो खोजें और रेफरल के ज़रिए अपना नेटवर्क बढ़ाएं' },
  'home.hero.cta': { en: 'Get Started', hi: 'शुरू करें' },
  'home.featured': { en: 'Featured Videos', hi: 'फीचर्ड वीडियो' },
  'home.viewAll': { en: 'View All', hi: 'सभी देखें' },

  // Auth
  'auth.login': { en: 'Login', hi: 'लॉगिन करें' },
  'auth.signup': { en: 'Create Account', hi: 'खाता बनाएं' },
  'auth.email': { en: 'Email', hi: 'ईमेल' },
  'auth.password': { en: 'Password', hi: 'पासवर्ड' },
  'auth.name': { en: 'Full Name', hi: 'पूरा नाम' },
  'auth.referralCode': { en: 'Referral Code (Optional)', hi: 'रेफरल कोड (वैकल्पिक)' },
  'auth.haveAccount': { en: 'Already have an account?', hi: 'पहले से खाता है?' },
  'auth.noAccount': { en: "Don't have an account?", hi: 'खाता नहीं है?' },
  'auth.loginSuccess': { en: 'Login successful!', hi: 'लॉगिन सफल!' },
  'auth.signupSuccess': { en: 'Account created successfully!', hi: 'खाता सफलतापूर्वक बनाया गया!' },
  'auth.welcomeBack': { en: 'Welcome back!', hi: 'वापस स्वागत है!' },
  'auth.createAccount': { en: 'Create your account', hi: 'अपना खाता बनाएं' },

  // Dashboard
  'dashboard.welcome': { en: 'Welcome', hi: 'स्वागत है' },
  'dashboard.videosWatched': { en: 'Videos Watched', hi: 'देखे गए वीडियो' },
  'dashboard.totalReferrals': { en: 'Total Referrals', hi: 'कुल रेफरल' },
  'dashboard.recentVideos': { en: 'Recent Videos', hi: 'हाल के वीडियो' },
  'dashboard.yourReferralLink': { en: 'Your Referral Link', hi: 'आपका रेफरल लिंक' },
  'dashboard.copyLink': { en: 'Copy Link', hi: 'लिंक कॉपी करें' },
  'dashboard.linkCopied': { en: 'Link copied!', hi: 'लिंक कॉपी हो गया!' },

  // Videos
  'videos.title': { en: 'Browse Videos', hi: 'वीडियो ब्राउज़ करें' },
  'videos.all': { en: 'All', hi: 'सभी' },
  'videos.entertainment': { en: 'Entertainment', hi: 'मनोरंजन' },
  'videos.education': { en: 'Education', hi: 'शिक्षा' },
  'videos.tech': { en: 'Tech', hi: 'टेक' },
  'videos.music': { en: 'Music', hi: 'संगीत' },
  'videos.watch': { en: 'Watch Now', hi: 'अभी देखें' },
  'videos.noVideos': { en: 'No videos found', hi: 'कोई वीडियो नहीं मिला' },

  // Referrals
  'referrals.title': { en: 'Your Referrals', hi: 'आपके रेफरल' },
  'referrals.inviteFriends': { en: 'Invite Friends', hi: 'दोस्तों को आमंत्रित करें' },
  'referrals.shareMessage': { en: 'Share your unique link and grow your network!', hi: 'अपना यूनिक लिंक शेयर करें और अपना नेटवर्क बढ़ाएं!' },
  'referrals.yourCode': { en: 'Your Referral Code', hi: 'आपका रेफरल कोड' },
  'referrals.peopleJoined': { en: 'People Joined', hi: 'लोग शामिल हुए' },
  'referrals.shareWhatsApp': { en: 'Share on WhatsApp', hi: 'WhatsApp पर शेयर करें' },
  'referrals.noReferrals': { en: 'No referrals yet. Share your link!', hi: 'अभी तक कोई रेफरल नहीं। अपना लिंक शेयर करें!' },

  // Profile
  'profile.title': { en: 'Your Profile', hi: 'आपकी प्रोफाइल' },
  'profile.settings': { en: 'Settings', hi: 'सेटिंग्स' },
  'profile.language': { en: 'Language', hi: 'भाषा' },
  'profile.watchHistory': { en: 'Watch History', hi: 'देखने का इतिहास' },
  'profile.memberSince': { en: 'Member Since', hi: 'सदस्य बने' },

  // Common
  'common.loading': { en: 'Loading...', hi: 'लोड हो रहा है...' },
  'common.error': { en: 'Something went wrong', hi: 'कुछ गलत हो गया' },
  'common.save': { en: 'Save', hi: 'सेव करें' },
  'common.cancel': { en: 'Cancel', hi: 'रद्द करें' },
  'common.share': { en: 'Share', hi: 'शेयर' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('vidshare-language');
    return (saved as Language) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('vidshare-language', language);
  }, [language]);

  const t = (key: string): string => {
    const translation = translations[key];
    if (!translation) return key;
    return translation[language];
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'hi' : 'en');
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};