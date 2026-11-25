import React, { useState } from 'react';
import {
  Sparkles,
  Share2,
  Play,
  Sun,
  Moon,
} from 'lucide-react';
import SmartBookIcon from './SmartBookIcon';

export default function PresentationView({
  theme = 'dark',
  onToggleTheme,
  onEnterApp,
}) {
  const [copied, setCopied] = useState(false);

  const shareUrl = `${window.location.origin}${window.location.pathname}?view=presentation`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div
      dir="rtl"
      className={`min-h-screen w-full overflow-x-hidden pb-14 transition-colors duration-300 ${
        theme === 'light'
          ? 'theme-light bg-slate-100 text-slate-900'
          : 'bg-slate-950 text-white'
      }`}
    >
      {/* الشريط العلوي البسيط */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-rose-400 p-[1.5px] flex items-center justify-center shadow-md">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <SmartBookIcon className="w-5 h-5" />
              </div>
            </div>
            <span className="text-sm md:text-base font-black text-white">
              مساعد الطالب الذكي
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onToggleTheme && (
              <button
                type="button"
                onClick={onToggleTheme}
                className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-xl flex items-center justify-center cursor-pointer transition"
                title="تبديل النظام الصباحي / المسائي"
              >
                {theme === 'light' ? (
                  <Moon className="w-4 h-4 text-indigo-600" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-400" />
                )}
              </button>
            )}

            <button
              type="button"
              onClick={handleCopyLink}
              className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copied ? 'تم نسخ الرابط ✅' : 'مشاركة'}</span>
            </button>

            <button
              type="button"
              onClick={onEnterApp}
              className="btn-3d-indigo px-4 py-2 rounded-xl text-xs font-black text-white flex items-center gap-1.5 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              <span>استخدم التطبيق</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-6 space-y-6">
        {/* البطاقة الرئيسية الواضحة والمبسطة */}
        <section className="bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 md:p-8 text-center space-y-4 shadow-2xl">
          <span className="inline-flex items-center gap-1.5 bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 px-3.5 py-1 rounded-full text-xs font-black">
            ✨ صديقك الذكي للمراجعة اليومية
          </span>

          <h1 className="text-2xl md:text-3xl font-black text-white leading-snug">
            راجع دروسك يومياً بسهولة وتفوّق بمتعة! 🚀
          </h1>

          <p className="text-sm md:text-base text-slate-200 leading-relaxed font-bold max-w-xl mx-auto">
            تطبيق بسيط وذكي يساعد كل طالب في مراجعة دروسه اليومية خطوة بخطوة: يلخّص
            لك الدرس، يقرأه لك بالصوت، يجيب عن أسئلتك، ويختبرك مع أصدقائك!
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={onEnterApp}
              className="btn-3d-indigo px-7 py-3.5 rounded-2xl text-sm font-black text-white flex items-center gap-2 cursor-pointer shadow-xl"
            >
              <Play className="w-4 h-4" />
              <span>استخدم التطبيق الآن 🚀</span>
            </button>
          </div>
        </section>

        {/* كيف يساعدك التطبيق كل يوم؟ (4 بطاقات بسيطة جداً) */}
        <section className="space-y-3">
          <h2 className="text-base md:text-lg font-black text-center text-white">
            كيف يساعدك التطبيق في مراجعتك اليومية؟ 📚
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-2.5 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xl">
                  📖
                </div>
                <h3 className="text-sm md:text-base font-black text-white">
                  1. يفهمك الدرس بسرعة
                </h3>
                <p className="text-xs md:text-sm text-slate-300 leading-relaxed font-semibold">
                  يعطيك زبدة الدرس وأهم النقاط بطريقة سهلة وواضحة، وتقدر تسمع الشرح
                  بالصوت أو تفتح ملزمة الدرس (صورة أو PDF).
                </p>
              </div>
              <button
                type="button"
                onClick={onEnterApp}
                className="w-full bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 py-2 rounded-xl text-xs font-black cursor-pointer transition mt-2"
              >
                استخدم التطبيق ⬅️
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-2.5 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl">
                  🤖
                </div>
                <h3 className="text-sm md:text-base font-black text-white">
                  2. معلم ذكي يجاوبك فوراً
                </h3>
                <p className="text-xs md:text-sm text-slate-300 leading-relaxed font-semibold">
                  إذا عندك أي سؤال بالدرس ما فاهمه، اكتب سؤالك للمعلم الذكي وراح
                  يشرحه لك فوراً بأسلوب مبسط وممتع.
                </p>
              </div>
              <button
                type="button"
                onClick={onEnterApp}
                className="w-full bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 py-2 rounded-xl text-xs font-black cursor-pointer transition mt-2"
              >
                استخدم التطبيق ⬅️
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-2.5 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="w-11 h-11 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center text-xl">
                  ⚔️
                </div>
                <h3 className="text-sm md:text-base font-black text-white">
                  3. اختبر نفسك وتحدَّ أصدقاءك
                </h3>
                <p className="text-xs md:text-sm text-slate-300 leading-relaxed font-semibold">
                  بعد ما تراجع درسك، ادخل امتحان سريع أو العب مسابقة مباشرة مع
                  أصدقائك بصفك في نفس الدرس أو كل دروس المادة!
                </p>
              </div>
              <button
                type="button"
                onClick={onEnterApp}
                className="w-full bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 py-2 rounded-xl text-xs font-black cursor-pointer transition mt-2"
              >
                استخدم التطبيق ⬅️
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-2.5 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-xl">
                  🏆
                </div>
                <h3 className="text-sm md:text-base font-black text-white">
                  4. اجمع النقاط وافتح شخصيات نادرة
                </h3>
                <p className="text-xs md:text-sm text-slate-300 leading-relaxed font-semibold">
                  كل مراجعة واختبار يرفع مستواك ويزيد نقاطك 💎 لتفتح شخصيات أبطال
                  وأنمي نادرة وتتصدر لوحة الأبطال!
                </p>
              </div>
              <button
                type="button"
                onClick={onEnterApp}
                className="w-full bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 py-2 rounded-xl text-xs font-black cursor-pointer transition mt-2"
              >
                استخدم التطبيق ⬅️
              </button>
            </div>
          </div>
        </section>

        {/* قسم بسيط للأستاذ والمدرسة */}
        <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-3 text-center">
          <h3 className="text-sm md:text-base font-black text-emerald-300">
            👨‍🏫 للأستاذ وإدارة المدرسة أيضاً!
          </h3>
          <p className="text-xs md:text-sm text-slate-300 leading-relaxed font-semibold max-w-xl mx-auto">
            يرفع الأستاذ الدرس (نص أو صورة أو PDF) فيقوم الذكاء الاصطناعي فوراً بتجهيز
            الملخص والأسئلة للطلاب لتكون مراجعتهم اليومية جاهزة دائماً.
          </p>
          <div className="pt-1 flex justify-center">
            <button
              type="button"
              onClick={onEnterApp}
              className="btn-3d-emerald px-6 py-2.5 rounded-2xl text-xs font-black text-white flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4" />
              <span>استخدم التطبيق الآن</span>
            </button>
          </div>
        </section>

        {/* التذييل */}
        <footer className="text-center space-y-2 pt-2">
          <p className="text-xs font-black text-white">
            تمت البرمجة بواسطة <span className="text-indigo-400">مجتبى كرار</span>
          </p>
        </footer>
      </main>
    </div>
  );
}
