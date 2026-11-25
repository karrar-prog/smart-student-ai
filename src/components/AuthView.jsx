import React, { useState } from 'react';
import {
  GraduationCap,
  BookOpen,
  ShieldCheck,
  Sparkles,
  LogIn,
  KeyRound,
  User,
  Zap,
  CheckCircle2,
  Sun,
  Moon,
} from 'lucide-react';
import {
  loginAdmin,
  loginTeacherBySubject,
  loginOrRegisterStudent,
} from '../services/dbService';
import SmartBookIcon from './SmartBookIcon';

const SAVED_CREDENTIALS_KEY = 'smart_student_saved_credentials';

function getSavedCredentials(role) {
  try {
    const all = JSON.parse(localStorage.getItem(SAVED_CREDENTIALS_KEY) || '{}');
    return all[role] || { username: '', password: '' };
  } catch {
    return { username: '', password: '' };
  }
}

function saveCredentialsForRole(role, username, password) {
  try {
    const all = JSON.parse(localStorage.getItem(SAVED_CREDENTIALS_KEY) || '{}');
    all[role] = { username, password };
    localStorage.setItem(SAVED_CREDENTIALS_KEY, JSON.stringify(all));
  } catch {
    // ignore
  }
}

export default function AuthView({
  onLoginSuccess,
  dbState,
  theme,
  onToggleTheme,
}) {
  const [activeTab, setActiveTab] = useState('student');
  const [username, setUsername] = useState(
    () => getSavedCredentials('student').username
  );
  const [password, setPassword] = useState(
    () => getSavedCredentials('student').password
  );
  const [errorMsg, setErrorMsg] = useState('');

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    setErrorMsg('');
    const saved = getSavedCredentials(tab);
    setUsername(saved.username || '');
    setPassword(saved.password || '');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim() || !password.trim()) {
      setErrorMsg('يرجى إدخال جميع الحقول المطلوبة!');
      return;
    }

    if (activeTab === 'admin') {
      const adminUser = loginAdmin(username, password);
      if (!adminUser) {
        setErrorMsg('بيانات مدير النظام غير صحيحة!');
        return;
      }
      saveCredentialsForRole('admin', username.trim(), password.trim());
      onLoginSuccess(adminUser);
    } else if (activeTab === 'teacher') {
      const teacherUser = loginTeacherBySubject(username, password);
      if (!teacherUser) {
        setErrorMsg('يوزر أو باسوورد المادة غير صحيح! تأكد من مدير النظام.');
        return;
      }
      saveCredentialsForRole('teacher', username.trim(), password.trim());
      onLoginSuccess(teacherUser);
    } else {
      const res = loginOrRegisterStudent(username, password);
      if (res.error) {
        setErrorMsg(res.error);
        return;
      }
      saveCredentialsForRole('student', username.trim(), password.trim());
      onLoginSuccess({ role: 'student', studentId: res.student.id });
    }
  };

  const pendingCount = (dbState?.students || []).filter(
    (s) => s.status === 'pending'
  ).length;

  return (
    <div className="flex flex-col h-full w-full overflow-y-auto custom-scroll bg-gradient-to-b from-indigo-950 via-slate-900 to-slate-950 text-white p-5 justify-center gap-5 relative">
      {onToggleTheme && (
        <button
          type="button"
          onClick={onToggleTheme}
          className="absolute top-4 left-4 bg-slate-800/90 hover:bg-slate-700 border border-slate-700 px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition"
        >
          {theme === 'light' ? (
            <>
              <Moon className="w-3.5 h-3.5 text-indigo-600" />
              <span>ليلي</span>
            </>
          ) : (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>نهاري</span>
            </>
          )}
        </button>
      )}
      {/* الشعار والترحيب */}
      <div className="text-center pt-3 pb-4">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-rose-400 p-0.5 shadow-xl shadow-indigo-500/30 mb-3 animate-float">
          <div className="w-full h-full bg-slate-950/90 rounded-[22px] flex items-center justify-center">
            <SmartBookIcon className="w-10 h-10" />
          </div>
        </div>
        <h1 className="text-2xl font-black tracking-tight text-white">
          مساعد الطالب الذكي
        </h1>
      </div>

      {/* أزرار اختيار الدور */}
      <div className="bg-slate-900/90 border border-slate-800 p-1.5 rounded-2xl grid grid-cols-3 gap-1.5 mb-4 shadow-inner">
        <button
          type="button"
          onClick={() => handleTabSwitch('student')}
          className={`flex flex-col items-center py-2.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'student'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/40 scale-[1.02]'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <GraduationCap className="w-5 h-5 mb-1" />
          <span>الطالب</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabSwitch('teacher')}
          className={`flex flex-col items-center py-2.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'teacher'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/40 scale-[1.02]'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <BookOpen className="w-5 h-5 mb-1" />
          <span>الأستاذ</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabSwitch('admin')}
          className={`relative flex flex-col items-center py-2.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'admin'
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/40 scale-[1.02]'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          {pendingCount > 0 && (
            <span className="absolute -top-1 -left-1 bg-rose-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow">
              {pendingCount}
            </span>
          )}
          <ShieldCheck className="w-5 h-5 mb-1" />
          <span>الإدارة</span>
        </button>
      </div>

      {/* بطاقة تسجيل الدخول */}
      <form
        onSubmit={handleSubmit}
        className="bg-slate-900/90 backdrop-blur-md border border-slate-800/90 rounded-3xl p-5 shadow-2xl space-y-4"
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <h2 className="text-sm font-extrabold text-white">
            {activeTab === 'student' && '👨‍🎓 دخول الطالب'}
            {activeTab === 'teacher' && '👨‍🏫 دخول الأستاذ'}
            {activeTab === 'admin' && '🛡️ دخول الإدارة'}
          </h2>
        </div>

        {errorMsg && (
          <div className="bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-bold p-3 rounded-xl">
            ⚠️ {errorMsg}
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1.5">
            {activeTab === 'student' && 'اسم الطالب'}
            {activeTab === 'teacher' && 'يوزر المادة'}
            {activeTab === 'admin' && 'اسم المستخدم'}
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
            <input
              type="text"
              name="username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={
                activeTab === 'student'
                  ? 'مثال: جعفر امين'
                  : activeTab === 'teacher'
                  ? 'sci5 أو math5'
                  : 'اسم مستخدم الإدارة'
              }
              className="w-full bg-slate-950/90 border border-slate-700/80 focus:border-indigo-500 rounded-xl pr-10 pl-4 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1.5">
            {activeTab === 'student' ? 'الرمز السري' : 'كلمة المرور'}
          </label>
          <div className="relative">
            <KeyRound className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={activeTab === 'student' ? '1234' : '••••••••'}
              className="w-full bg-slate-950/90 border border-slate-700/80 focus:border-indigo-500 rounded-xl pr-10 pl-4 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition"
            />
          </div>
        </div>

        <button
          type="submit"
          className={`w-full py-3 rounded-xl font-extrabold text-sm text-white flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'student'
              ? 'btn-3d-indigo'
              : activeTab === 'teacher'
              ? 'btn-3d-emerald'
              : 'btn-3d-amber !text-slate-950'
          }`}
        >
          <LogIn className="w-4 h-4" />
          <span>تسجيل الدخول</span>
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-xs font-black text-white">
          تمت البرمجة بواسطة{' '}
          <span
            className={`transition-colors duration-200 ${
              activeTab === 'student'
                ? 'text-indigo-400'
                : activeTab === 'teacher'
                ? 'text-emerald-400'
                : 'text-amber-400'
            }`}
          >
            مجتبى كرار
          </span>
        </p>
      </div>
    </div>
  );
}
