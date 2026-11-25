import React, { useState } from 'react';
import {
  X,
  KeyRound,
  Database,
  RotateCcw,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { getGeminiApiKey, setGeminiApiKey } from '../services/aiService';
import {
  getFirebaseConfigString,
  saveFirebaseConfigString,
  resetDemoDatabase,
  isFirebaseConnected,
} from '../services/dbService';

export default function SettingsModal({ isOpen, onClose }) {
  const [geminiKey, setGeminiKey] = useState(getGeminiApiKey());
  const [firebaseJson, setFirebaseJson] = useState(getFirebaseConfigString());
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    setStatusMessage('');
    setErrorMessage('');

    try {
      setGeminiApiKey(geminiKey);
      if (firebaseJson.trim()) {
        saveFirebaseConfigString(firebaseJson);
      } else {
        saveFirebaseConfigString('');
      }
      setStatusMessage('تم حفظ إعدادات الربط بنجاح! ✅');
    } catch (err) {
      setErrorMessage(
        'تأكد من أن كود إعدادات Firebase مكتوب بصيغة JSON صحيحة!'
      );
    }
  };

  const handleResetDemo = () => {
    resetDemoDatabase();
    setStatusMessage('تمت استعادة البيانات التجريبية الأصلية للمعرض بنجاح! 🔄');
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-5 text-white space-y-4 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm font-black">إعدادات الربط السحابي (AI & Firebase)</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {statusMessage && (
          <div className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 text-xs font-bold p-3 rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs font-bold p-3 rounded-xl">
            ⚠️ {errorMessage}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-indigo-300 mb-1 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5" />
              <span>مفتاح الذكاء الاصطناعي (Gemini API Key - اختياري)</span>
            </label>
            <input
              type="password"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              إذا تركته فارغاً سيعمل المحرك الذكي المدمج تلقائياً بدون توقف.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-amber-300 mb-1 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5" />
              <span>
                إعدادات Firebase Config JSON{' '}
                {isFirebaseConnected() ? '(متصل بالسحابة 🟢)' : '(وضع المزامنة المحلية الفورية ⚡)'}
              </span>
            </label>
            <textarea
              rows={4}
              value={firebaseJson}
              onChange={(e) => setFirebaseJson(e.target.value)}
              placeholder='{"apiKey": "...", "authDomain": "...", "projectId": "..."}'
              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl p-2.5 text-xs text-white font-mono outline-none resize-none"
              dir="ltr"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              className="flex-1 btn-3d-indigo py-2.5 rounded-xl text-xs font-black text-white cursor-pointer"
            >
              حفظ الإعدادات
            </button>
            <button
              type="button"
              onClick={handleResetDemo}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition"
              title="استعادة البيانات التجريبية"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إعادة ضبط الديمو</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
