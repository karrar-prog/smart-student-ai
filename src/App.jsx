import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Maximize2,
  Settings,
  Sparkles,
  Sun,
  Moon,
  Type,
  Presentation,
} from 'lucide-react';
import {
  getDatabaseState,
  subscribeToDatabase,
  initFirebaseIfConfigured,
} from './services/dbService';
import AuthView from './components/AuthView';
import AdminView from './components/AdminView';
import TeacherView from './components/TeacherView';
import StudentView from './components/StudentView';
import SettingsModal from './components/SettingsModal';
import PresentationView from './components/PresentationView';
import SmartBookIcon from './components/SmartBookIcon';

const MODERN_FONTS = [
  { id: 'Alexandria', label: 'الإسكندرية' },
  { id: 'Readex Pro', label: 'ريدكس برو' },
  { id: 'IBM Plex Sans Arabic', label: 'IBM Plex' },
  { id: 'Cairo', label: 'كايرو' },
];

const SESSION_STORAGE_KEY = 'smart_student_session';

export default function App() {
  const [dbState, setDbState] = useState(() => getDatabaseState());
  const [session, setSession] = useState(() => {
    try {
      const saved = localStorage.getItem(SESSION_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isMobileFrame, setIsMobileFrame] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showPresentation, setShowPresentation] = useState(() => {
    try {
      return (
        window.location.search.includes('view=presentation') ||
        window.location.hash.includes('presentation')
      );
    } catch {
      return false;
    }
  });

  const handleLoginSession = (userSession) => {
    setSession(userSession);
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(userSession));
    } catch {
      // ignore
    }
  };

  const handleLogoutSession = () => {
    setIsSettingsOpen(false);
    setSession(null);
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {
      // ignore
    }
  };
  const [isMobileAppView] = useState(() => {
    try {
      return (
        window.location.search.includes('mobile=1') ||
        window.navigator.userAgent.includes('Expo')
      );
    } catch {
      return false;
    }
  });
  const [theme, setTheme] = useState(
    () => localStorage.getItem('smart_student_theme') || 'dark'
  );
  useEffect(() => {
    document.documentElement.style.setProperty('--app-font', `'Cairo'`);
    localStorage.setItem('smart_student_font', 'Cairo');
    const rawScale = localStorage.getItem('smart_student_font_scale_v2');
    const savedScale = rawScale ? Number(rawScale) : 110;
    const clamped =
      savedScale >= 70 && savedScale <= 160
        ? Math.min(120, Math.max(80, savedScale))
        : 110;
    localStorage.setItem('smart_student_font_scale_v2', String(clamped));
    document.documentElement.style.setProperty(
      '--app-font-scale',
      String(clamped / 100)
    );
  }, []);

  useEffect(() => {
    setDbState({ ...getDatabaseState() });
    initFirebaseIfConfigured();
    const unsub = subscribeToDatabase((newState) => {
      setDbState({ ...newState });
    });
    return () => unsub();
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('smart_student_theme', next);
  };

  if (showPresentation) {
    return (
      <PresentationView
        theme={theme}
        onToggleTheme={toggleTheme}
        onEnterApp={() => {
          setShowPresentation(false);
          try {
            if (window.location.search.includes('view=presentation')) {
              window.history.replaceState({}, '', window.location.pathname);
            }
          } catch {
            // ignore
          }
        }}
      />
    );
  }

  return (
    <div
      className={`h-[100dvh] w-full flex flex-col items-center justify-center p-0 md:p-3 overflow-hidden transition-colors duration-300 ${
        theme === 'light'
          ? 'theme-light bg-slate-100 text-slate-900'
          : 'bg-slate-950 text-white'
      }`}
    >
      {/* شريط التحكم العلوي (يختفي داخل تطبيق الموبايل ليملأ الشاشة بالكامل) */}
      {!isMobileAppView && (
        <div
          className={`w-full ${
            isMobileFrame ? 'max-w-[420px]' : 'max-w-4xl'
          } shrink-0 mb-0 md:mb-2 px-3 py-2 bg-slate-900/90 border-b md:border border-slate-800 md:rounded-2xl flex items-center justify-between text-xs text-slate-300 shadow-lg`}
        >
          <div className="flex items-center gap-1.5 font-extrabold text-white">
            <SmartBookIcon className="w-4 h-4" />
            <span>مساعد الطالب الذكي</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowPresentation(true)}
              className="flex items-center gap-1 bg-indigo-600/25 hover:bg-indigo-600/40 border border-indigo-500/40 text-indigo-200 px-2.5 py-1 rounded-xl text-[11px] font-bold cursor-pointer transition"
              title="فتح صفحة العرض التعريفي للمشروع (Presentation)"
            >
              <Presentation className="w-3.5 h-3.5 text-indigo-400" />
              <span>العرض التعريفي</span>
            </button>

            <button
              onClick={toggleTheme}
              className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded-xl text-[11px] font-bold cursor-pointer transition"
              title="تبديل الوضع النهاري / الليلي"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>نهاري</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-500" />
                  <span>ليلي</span>
                </>
              )}
            </button>

            <button
              onClick={() => setIsMobileFrame((prev) => !prev)}
              className="hidden md:flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded-xl text-[11px] font-bold cursor-pointer transition"
              title="تبديل نمط العرض (موبايل / شاشة كاملة)"
            >
              {isMobileFrame ? (
                <>
                  <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>ملء الشاشة</span>
                </>
              ) : (
                <>
                  <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                  <span>موبايل</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* حاوية التطبيق كشاشة تطبيق حقيقية ثابتة الأبعاد */}
      <div
        className={`w-full flex-1 min-h-0 bg-slate-950 flex flex-col overflow-hidden transition-all duration-300 ${
          isMobileAppView
            ? 'h-full max-w-full'
            : isMobileFrame
            ? 'max-w-[420px] md:max-h-[840px] md:rounded-[38px] md:border-[6px] md:border-slate-800 md:shadow-2xl'
            : 'max-w-4xl md:rounded-3xl md:border md:border-slate-800 md:shadow-2xl'
        }`}
      >
        {!session && (
          <AuthView
            dbState={dbState}
            theme={theme}
            onToggleTheme={toggleTheme}
            onLoginSuccess={handleLoginSession}
          />
        )}

        {session?.role === 'admin' && (
          <AdminView
            dbState={dbState}
            theme={theme}
            onToggleTheme={toggleTheme}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onLogout={handleLogoutSession}
          />
        )}

        {session?.role === 'teacher' && (
          <TeacherView
            session={session}
            dbState={dbState}
            theme={theme}
            onToggleTheme={toggleTheme}
            onLogout={handleLogoutSession}
          />
        )}

        {session?.role === 'student' && (
          <StudentView
            studentId={session.studentId}
            dbState={dbState}
            theme={theme}
            onToggleTheme={toggleTheme}
            onLogout={handleLogoutSession}
          />
        )}
      </div>

      {session?.role === 'admin' && (
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </div>
  );
}
