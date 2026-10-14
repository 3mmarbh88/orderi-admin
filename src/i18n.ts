export type Language = "ar" | "en";

export interface Translations {
  // Login Screen
  welcomeBack: string;
  loginSubtitle: string;
  username: string;
  password: string;
  usernamePlaceholder: string;
  passwordPlaceholder: string;
  rememberBiometric: string;
  loginBtn: string;
  loggingIn: string;
  biometricDivider: string;
  faceIdBtn: string;
  faceIdScanning: string;
  fingerprintBtn: string;
  fingerprintScanning: string;
  previouslyRegistered: string;
  footerSystem: string;
  chooseLang: string;
  arabic: string;
  english: string;

  // Biometric Modal
  faceScanningTitle: string;
  faceScanningSub: string;
  fingerprintScanningTitle: string;
  fingerprintScanningSub: string;
  authSuccess: string;
  authFailed: string;
  cancel: string;

  // Topbar & Navigation
  dashboard: string;
  users: string;
  codes: string;
  analytics: string;
  server: string;
  audit: string;
  settings: string;
  overviewTitle: string;
  usersTitle: string;
  codesTitle: string;
  analyticsTitle: string;
  serverTitle: string;
  auditTitle: string;
  settingsTitle: string;
  searchPlaceholder: string;
  onlineNow: string;
  liveEditor: string;
  toggleTheme: string;
  refreshData: string;
  logout: string;
  controlPanel: string;
  systemStable: string;
  menu: string;

  // Settings & Appearance
  appearance: string;
  appearanceDesc: string;
  darkMode: string;
  darkModeDesc: string;
  appLanguage: string;
  appLanguageDesc: string;

  // Mobile Bottom Bar
  mobileHome: string;
  mobileUsers: string;
  mobileCodes: string;
  mobileServer: string;
  mobileAudit: string;
  mobileSettings: string;
}

export const translations: Record<Language, Translations> = {
  ar: {
    welcomeBack: "مرحبًا بعودتك",
    loginSubtitle: "سجّل الدخول إلى لوحة تحكم Orderi لإدارة النظام ومتابعة السيرفر والمستخدمين.",
    username: "اسم المستخدم",
    password: "كلمة المرور",
    usernamePlaceholder: "admin",
    passwordPlaceholder: "••••••••",
    rememberBiometric: "تفعيل الدخول السريع بالبصمة لهذا الجهاز",
    loginBtn: "دخول إلى لوحة التحكم",
    loggingIn: "جاري تسجيل الدخول...",
    biometricDivider: "تسجيل الدخول البيومتري الآمن",
    faceIdBtn: "تسجيل الدخول ببصمة الوجه (Face ID)",
    faceIdScanning: "جارٍ مسح بصمة الوجه...",
    fingerprintBtn: "تسجيل الدخول ببصمة الإصبع (Touch ID)",
    fingerprintScanning: "جارٍ التحقق من البصمة...",
    previouslyRegistered: "مسجل مسبقاً للحساب:",
    footerSystem: "منظومة Orderi الذكية • نظام الإدارة والتحكم المركزي",
    chooseLang: "لغة التطبيق",
    arabic: "العربية",
    english: "English",

    faceScanningTitle: "جارٍ مسح بصمة الوجه...",
    faceScanningSub: "يرجى النظر مباشرة إلى الكاميرا للتحقق والتعرف الفوري",
    fingerprintScanningTitle: "جارٍ التحقق من بصمة الإصبع...",
    fingerprintScanningSub: "يرجى وضع إصبعك المسجل على مستشعر البصمة",
    authSuccess: "تم التحقق بنجاح!",
    authFailed: "فشل التحقق، يرجى المحاولة مجدداً",
    cancel: "إلغاء",

    dashboard: "الرئيسية",
    users: "المستخدمون",
    codes: "أكواد التفعيل",
    analytics: "التحليلات والمؤشرات",
    server: "حالة السيرفر",
    audit: "سجل العمليات",
    settings: "الإعدادات",
    overviewTitle: "نظرة عامة والتحكم",
    usersTitle: "إدارة المستخدمين",
    codesTitle: "أكواد التفعيل",
    analyticsTitle: "التحليلات ومؤشرات الأداء",
    serverTitle: "حالة النظام والسيرفر",
    auditTitle: "سجل العمليات والتدقيق",
    settingsTitle: "إعدادات الإدارة",
    searchPlaceholder: "بحث وأوامر سريعة... (Ctrl+K)",
    onlineNow: "متصل الآن",
    liveEditor: "محرر مباشر",
    toggleTheme: "تغيير المظهر",
    refreshData: "تحديث البيانات",
    logout: "تسجيل الخروج",
    controlPanel: "لوحة التحكم",
    systemStable: "النظام نشط ومستقر",
    menu: "القائمة",

    appearance: "المظهر واللغة",
    appearanceDesc: "تخصيص شكل ولغة لوحة الإدارة",
    darkMode: "الوضع الداكن",
    darkModeDesc: "تغيير مظهر لوحة Orderi بين الوضع الفاتح والداكن",
    appLanguage: "لغة الواجهة",
    appLanguageDesc: "اختر اللغة المفضلة للبرنامج (العربية / English)",

    mobileHome: "الرئيسية",
    mobileUsers: "المستخدمين",
    mobileCodes: "الأكواد",
    mobileServer: "السيرفر",
    mobileAudit: "السجل",
    mobileSettings: "الإعدادات",
  },
  en: {
    welcomeBack: "Welcome Back",
    loginSubtitle: "Sign in to Orderi Admin Control to manage the system.",
    username: "Username",
    password: "Password",
    usernamePlaceholder: "admin",
    passwordPlaceholder: "••••••••",
    rememberBiometric: "Enable quick biometric sign-in on this device",
    loginBtn: "Sign In to Dashboard",
    loggingIn: "Signing in...",
    biometricDivider: "Secure Biometric Sign-in",
    faceIdBtn: "Sign In with Face ID",
    faceIdScanning: "Scanning Face ID...",
    fingerprintBtn: "Sign In with Touch ID",
    fingerprintScanning: "Verifying Fingerprint...",
    previouslyRegistered: "Registered account:",
    footerSystem: "Orderi Platform • Secure Central Management System",
    chooseLang: "App Language",
    arabic: "العربية",
    english: "English",

    faceScanningTitle: "Scanning Face ID...",
    faceScanningSub: "Please look directly at the camera for instant recognition",
    fingerprintScanningTitle: "Verifying Fingerprint...",
    fingerprintScanningSub: "Please place your registered finger on the sensor",
    authSuccess: "Verified Successfully!",
    authFailed: "Verification failed, please try again",
    cancel: "Cancel",

    dashboard: "Dashboard",
    users: "Users",
    codes: "Activation Codes",
    analytics: "Analytics & KPIs",
    server: "Server Status",
    audit: "Audit Logs",
    settings: "Settings",
    overviewTitle: "Overview & Control",
    usersTitle: "User Management",
    codesTitle: "Activation Codes",
    analyticsTitle: "Analytics & Performance",
    serverTitle: "System & Server Status",
    auditTitle: "Audit & Operations Log",
    settingsTitle: "Admin Settings",
    searchPlaceholder: "Search & quick commands... (Ctrl+K)",
    onlineNow: "Connected",
    liveEditor: "Live Mode",
    toggleTheme: "Toggle Theme",
    refreshData: "Refresh Data",
    logout: "Sign Out",
    controlPanel: "Control Panel",
    systemStable: "System active & stable",
    menu: "Menu",

    appearance: "Appearance & Language",
    appearanceDesc: "Customize look and language of the admin panel",
    darkMode: "Dark Mode",
    darkModeDesc: "Switch Orderi panel between light and dark themes",
    appLanguage: "Interface Language",
    appLanguageDesc: "Choose your preferred language (العربية / English)",

    mobileHome: "Home",
    mobileUsers: "Users",
    mobileCodes: "Codes",
    mobileServer: "Server",
    mobileAudit: "Logs",
    mobileSettings: "Settings",
  },
};
