import React, { useState } from 'react';
import {
  Building2,
  Layers,
  BookOpen,
  UserCheck,
  UserX,
  Plus,
  Trash2,
  LogOut,
  Users,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sun,
  Moon,
  Settings,
  Search,
  X,
} from 'lucide-react';
import {
  addSchool,
  deleteSchool,
  addStage,
  deleteStage,
  addSubject,
  deleteSubject,
  updateStudentJoinStatus,
  deleteStudent,
} from '../services/dbService';

export default function AdminView({
  dbState,
  theme,
  onToggleTheme,
  onOpenSettings,
  onLogout,
}) {
  const [activeTab, setActiveTab] = useState('schools');
  const [selectedSchoolId, setSelectedSchoolId] = useState(
    dbState.schools[0]?.id || null
  );
  const [selectedStageId, setSelectedStageId] = useState(
    dbState.stages.find((st) => st.schoolId === dbState.schools[0]?.id)?.id || null
  );

  const [newSchoolName, setNewSchoolName] = useState('');
  const [newSchoolCity, setNewSchoolCity] = useState('');
  const [newStageName, setNewStageName] = useState('');
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newTeacherName, setNewTeacherName] = useState('');
  const [newTeacherUser, setNewTeacherUser] = useState('');
  const [newTeacherPass, setNewTeacherPass] = useState('123');
  const [newSubjectIcon] = useState('📘');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');

  const handleConfirmDelete = () => {
    if (!confirmDelete) return;
    if (confirmDelete.type === 'school') {
      deleteSchool(confirmDelete.id);
      if (selectedSchoolId === confirmDelete.id) {
        const remaining = dbState.schools.filter((s) => s.id !== confirmDelete.id);
        setSelectedSchoolId(remaining[0]?.id || null);
      }
    } else if (confirmDelete.type === 'stage') {
      deleteStage(confirmDelete.id);
      if (selectedStageId === confirmDelete.id) {
        const remaining = schoolStages.filter((st) => st.id !== confirmDelete.id);
        setSelectedStageId(remaining[0]?.id || null);
      }
    } else if (confirmDelete.type === 'subject') {
      deleteSubject(confirmDelete.id);
    }
    setConfirmDelete(null);
  };

  const pendingStudents = dbState.students.filter((s) => s.status === 'pending');
  const approvedStudents = dbState.students.filter((s) => s.status === 'approved');

  const normalizeArabicName = (str = '') =>
    String(str)
      .toLowerCase()
      .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
      .replace(/[أإآٱ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .replace(/ؤ/g, 'و')
      .replace(/ئ/g, 'ي')
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const getWordSimilarity = (a, b) => {
    if (!a || !b) return 0;
    if (a.includes(b) || b.includes(a)) return 0.95;
    if (a.length < 2 || b.length < 2) return a === b ? 1 : 0;
    const bigramsA = [];
    for (let i = 0; i < a.length - 1; i++) bigramsA.push(a.slice(i, i + 2));
    const bigramsB = [];
    for (let i = 0; i < b.length - 1; i++) bigramsB.push(b.slice(i, i + 2));
    let matches = 0;
    const used = new Array(bigramsB.length).fill(false);
    for (const bgA of bigramsA) {
      const idx = bigramsB.findIndex((bgB, j) => !used[j] && bgB === bgA);
      if (idx !== -1) {
        used[idx] = true;
        matches++;
      }
    }
    return (2 * matches) / (bigramsA.length + bigramsB.length);
  };

  const filteredApprovedStudents = (() => {
    const cleanQ = normalizeArabicName(studentSearchQuery);
    if (!cleanQ) return approvedStudents;

    const queryTokens = cleanQ.split(' ').filter(Boolean);
    if (queryTokens.length === 0) return approvedStudents;

    const scored = approvedStudents.map((std) => {
      const fullNorm = normalizeArabicName(std.name || '');
      const nameParts = fullNorm.split(' ').filter(Boolean);

      let score = 0;
      for (const qTok of queryTokens) {
        // مطابقة مباشرة مع أي جزء من الاسم (الأول أو الأب أو اللقب، مثل كتابة "قاسم" ليظهر "محمد قاسم")
        if (
          fullNorm.includes(qTok) ||
          nameParts.some((part) => part.includes(qTok) || qTok.includes(part))
        ) {
          score += 50;
          continue;
        }
        // مطابقة الأسماء المشابهة في الحروف
        let bestSim = 0;
        for (const part of nameParts) {
          const sim = getWordSimilarity(qTok, part);
          if (sim > bestSim) bestSim = sim;
        }
        if (bestSim >= 0.45) {
          score += Math.round(bestSim * 35);
        }
      }

      return { std, score };
    });

    return scored
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((entry) => entry.std);
  })();

  const currentSchool = dbState.schools.find((s) => s.id === selectedSchoolId);
  const schoolStages = dbState.stages.filter(
    (st) => st.schoolId === selectedSchoolId
  );
  const currentStage = dbState.stages.find((st) => st.id === selectedStageId);
  const stageSubjects = dbState.subjects.filter(
    (sub) => sub.stageId === selectedStageId
  );

  const handleSelectSchool = (schoolId) => {
    setSelectedSchoolId(schoolId);
    const firstStage = dbState.stages.find((st) => st.schoolId === schoolId);
    setSelectedStageId(firstStage ? firstStage.id : null);
  };

  const handleCreateSchool = (e) => {
    e.preventDefault();
    if (!newSchoolName.trim()) return;
    const created = addSchool({ name: newSchoolName, city: newSchoolCity });
    setNewSchoolName('');
    setNewSchoolCity('');
    setSelectedSchoolId(created.id);
    setSelectedStageId(null);
  };

  const handleCreateStage = (e) => {
    e.preventDefault();
    if (!selectedSchoolId || !newStageName.trim()) return;
    const created = addStage({ schoolId: selectedSchoolId, name: newStageName });
    setNewStageName('');
    setSelectedStageId(created.id);
  };

  const handleCreateSubject = (e) => {
    e.preventDefault();
    if (
      !selectedSchoolId ||
      !selectedStageId ||
      !newSubjectName.trim() ||
      !newTeacherUser.trim() ||
      !newTeacherPass.trim()
    ) {
      return;
    }
    addSubject({
      schoolId: selectedSchoolId,
      stageId: selectedStageId,
      name: `${newSubjectName.trim()} ${newSubjectIcon}`,
      icon: newSubjectIcon,
      teacherName: newTeacherName || 'أستاذ المادة',
      teacherUsername: newTeacherUser,
      teacherPassword: newTeacherPass,
    });
    setNewSubjectName('');
    setNewTeacherName('');
    setNewTeacherUser('');
    setNewTeacherPass('123');
  };

  const getSchoolName = (id) =>
    dbState.schools.find((s) => s.id === id)?.name || 'غير محدد';
  const getStageName = (id) =>
    dbState.stages.find((st) => st.id === id)?.name || 'غير محدد';

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-slate-950 text-white relative">
      {/* نافذة تأكيد الحذف */}
      {confirmDelete && (
        <div
          onClick={() => setConfirmDelete(null)}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-slate-700 rounded-3xl max-w-xs w-full p-5 text-center space-y-4 shadow-2xl"
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-black text-white">
                {confirmDelete.type === 'school'
                  ? 'هل تريد حقاً حذف هذه المدرسة؟'
                  : confirmDelete.type === 'stage'
                  ? 'هل تريد حقاً حذف هذه المرحلة؟'
                  : 'هل تريد حقاً حذف الأستاذ؟'}
              </h3>
              {confirmDelete.type === 'subject' ? (
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 text-right space-y-1.5 text-xs">
                  <p className="font-bold text-white">
                    👨‍🏫 الأستاذ:{' '}
                    <span className="text-amber-300">{confirmDelete.name}</span>
                  </p>
                  <p className="font-bold text-slate-300">
                    📘 المادة:{' '}
                    <span className="text-emerald-300">
                      {confirmDelete.subjectName}
                    </span>
                  </p>
                </div>
              ) : (
                <p className="text-xs font-bold text-amber-300">
                  ({confirmDelete.name})
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="btn-3d-rose py-2.5 rounded-xl text-xs font-black text-white cursor-pointer"
              >
                حذف
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* الهيدر العلوي لمدير النظام */}
      <div className="bg-gradient-to-l from-amber-500/20 via-slate-900 to-slate-900 border-b border-slate-800 p-4 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-black text-white">لوحة الإدارة</h1>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              className="bg-indigo-950/90 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-200 px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition"
              title="إعدادات الربط والذكاء الاصطناعي"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>الربط والـ AI</span>
            </button>
          )}
          {onToggleTheme && (
            <button
              type="button"
              onClick={onToggleTheme}
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl cursor-pointer transition"
              title="تبديل الوضع النهاري / الليلي"
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4 text-indigo-600" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400" />
              )}
            </button>
          )}
          <button
            onClick={onLogout}
            className="bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-300 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>خروج</span>
          </button>
        </div>
      </div>

      {/* شريط التبويبات */}
      <div className="p-3 bg-slate-900/70 border-b border-slate-800 shrink-0 grid grid-cols-2 gap-2">
        <button
          onClick={() => setActiveTab('schools')}
          className={`py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer transition ${
            activeTab === 'schools'
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25'
              : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>المدارس والمواد</span>
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className={`relative py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer transition ${
            activeTab === 'requests'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>طلبات الطلاب</span>
          {pendingStudents.length > 0 && (
            <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
              {pendingStudents.length}
            </span>
          )}
        </button>
      </div>

      <div className="p-4 space-y-5 flex-1 min-h-0 overflow-y-auto custom-scroll">
        {activeTab === 'requests' ? (
          <div className="space-y-4">

            {pendingStudents.length === 0 ? (
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-80" />
                <p className="text-sm font-bold text-slate-300">
                  لا توجد طلبات انضمام معلقة حالياً!
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {pendingStudents.map((std) => (
                  <div
                    key={std.id}
                    className="bg-slate-900 border border-amber-500/40 rounded-2xl p-3.5 flex flex-col gap-3 shadow-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="inline-block bg-amber-500/20 text-amber-300 text-[10px] font-black px-2 py-0.5 rounded-full mb-1">
                          ⏳ طلب انضمام جديد
                        </span>
                        <h3 className="text-sm font-black text-white">
                          👨‍🎓 {std.name}
                        </h3>
                        <p className="text-xs text-slate-300 mt-1">
                          🏫 المدرسة:{' '}
                          <span className="text-amber-300 font-bold">
                            {getSchoolName(std.schoolId)}
                          </span>
                        </p>
                        <p className="text-xs text-slate-300">
                          📚 المرحلة:{' '}
                          <span className="text-indigo-300 font-bold">
                            {getStageName(std.stageId)}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800">
                      <button
                        onClick={() => updateStudentJoinStatus(std.id, 'approved')}
                        className="btn-3d-emerald py-2 rounded-xl text-xs font-black text-white flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <UserCheck className="w-4 h-4" />
                        <span>موافقة وقبول ✅</span>
                      </button>
                      <button
                        onClick={() => updateStudentJoinStatus(std.id, 'rejected')}
                        className="bg-rose-950 hover:bg-rose-900 border border-rose-700/60 text-rose-200 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition"
                      >
                        <UserX className="w-4 h-4" />
                        <span>رفض الطلب</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-3 border-t border-slate-800 space-y-2.5">
              {/* خانة البحث الذكي عن أسماء الطلاب في المكان المحدد */}
              <div className="bg-slate-900 border-2 border-indigo-500/70 focus-within:border-indigo-400 rounded-2xl px-3.5 py-2.5 flex items-center gap-2.5 shadow-md">
                <Search className="w-4 h-4 text-indigo-400 shrink-0" />
                <input
                  type="text"
                  value={studentSearchQuery}
                  onChange={(e) => setStudentSearchQuery(e.target.value)}
                  placeholder="ابحث عن اسم الطالب..."
                  className="flex-1 bg-transparent text-xs font-bold text-white placeholder:text-slate-300 outline-none"
                />
                {studentSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setStudentSearchQuery('')}
                    className="text-slate-400 hover:text-white cursor-pointer"
                    title="مسح البحث"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <h3 className="text-xs font-black text-slate-400">
                ✅ الطلاب المقبولون في المدارس ({filteredApprovedStudents.length})
              </h3>
              {filteredApprovedStudents.length === 0 ? (
                <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 text-center text-xs font-bold text-slate-400">
                  لا يوجد طالب مطابق لبحثك "{studentSearchQuery}"
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredApprovedStudents.map((std) => (
                    <div
                      key={std.id}
                      className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-xs font-bold text-white">👨‍🎓 {std.name}</p>
                        <p className="text-[11px] text-slate-400">
                          {getSchoolName(std.schoolId)} • {getStageName(std.stageId)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-left">
                        <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-black px-2.5 py-1 rounded-lg">
                          💎 {std.points || 0} نقطة
                        </span>
                        <button
                          type="button"
                          onClick={() => deleteStudent(std.id)}
                          className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-950/50 rounded-xl cursor-pointer transition"
                          title="حذف الطالب"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-black text-amber-400 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4" />
                  <span>1. المدارس ({dbState.schools.length})</span>
                </h2>
                <span className="text-[11px] text-slate-400">
                  اختر مدرسة لإدارة مراحلها
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {dbState.schools.map((sch) => {
                  const isSelected = sch.id === selectedSchoolId;
                  return (
                    <div
                      key={sch.id}
                      onClick={() => handleSelectSchool(sch.id)}
                      className={`group flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border cursor-pointer transition ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <span>🏫 {sch.name}</span>
                      {dbState.schools.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDelete({
                              type: 'school',
                              id: sch.id,
                              name: sch.name,
                            });
                          }}
                          className={`p-1 rounded-lg hover:bg-rose-500 hover:text-white transition ${
                            isSelected ? 'text-slate-900' : 'text-slate-500'
                          }`}
                          title="حذف المدرسة"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <form onSubmit={handleCreateSchool} className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={newSchoolName}
                  onChange={(e) => setNewSchoolName(e.target.value)}
                  placeholder="اسم المدرسة الجديدة (مثال: مدرسة النور)..."
                  className="flex-1 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-3.5 py-2 rounded-xl flex items-center gap-1 shrink-0 cursor-pointer transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>فتح مدرسة</span>
                </button>
              </form>
            </div>

            {currentSchool && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-black text-indigo-400 flex items-center gap-1.5">
                    <Layers className="w-4 h-4" />
                    <span>2. المراحل في ({currentSchool.name})</span>
                  </h2>
                </div>

                {schoolStages.length === 0 ? (
                  <p className="text-xs text-slate-400 bg-slate-950 p-3 rounded-xl text-center">
                    لا توجد مراحل بعد في هذه المدرسة.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {schoolStages.map((stg) => {
                      const isSelected = stg.id === selectedStageId;
                      return (
                        <div
                          key={stg.id}
                          onClick={() => setSelectedStageId(stg.id)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border cursor-pointer transition ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30'
                              : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <span>🎓 {stg.name}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDelete({
                                type: 'stage',
                                id: stg.id,
                                name: stg.name,
                              });
                            }}
                            className="p-1 rounded-lg hover:bg-rose-500 hover:text-white opacity-70 hover:opacity-100 transition"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                <form onSubmit={handleCreateStage} className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={newStageName}
                    onChange={(e) => setNewStageName(e.target.value)}
                    placeholder="اسم المرحلة الجديدة (مثال: الصف الثاني المتوسط)..."
                    className="flex-1 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  />
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs px-3.5 py-2 rounded-xl flex items-center gap-1 shrink-0 cursor-pointer transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>فتح مرحلة</span>
                  </button>
                </form>
              </div>
            )}

            {currentSchool && currentStage && (
              <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-3.5 space-y-3.5">
                <div>
                  <h2 className="text-sm font-black text-emerald-400 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4" />
                    <span>3. المواد وحسابات الأساتذة في ({currentStage.name})</span>
                  </h2>
                </div>

                {stageSubjects.length === 0 ? (
                  <p className="text-xs text-slate-400 bg-slate-950 p-3 rounded-xl text-center">
                    لا توجد مواد مضافة في هذه المرحلة بعد.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {stageSubjects.map((sub) => (
                      <div
                        key={sub.id}
                        className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-2"
                      >
                        <div>
                          <h3 className="text-xs font-black text-white">
                            {sub.name}
                          </h3>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            👨‍🏫 الأستاذ: {sub.teacherName}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-1.5">
                            <span className="bg-emerald-950 text-emerald-300 border border-emerald-700/50 text-[10px] font-bold px-2 py-0.5 rounded-md">
                              اليوزر: <code className="text-white">{sub.teacherUsername}</code>
                            </span>
                            <span className="bg-slate-900 text-amber-300 border border-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
                              الباسوورد: <code className="text-white">{sub.teacherPassword}</code>
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setConfirmDelete({
                              type: 'subject',
                              id: sub.id,
                              name: sub.teacherName,
                              subjectName: sub.name,
                              teacherUsername: sub.teacherUsername,
                              teacherPassword: sub.teacherPassword,
                            })
                          }
                          className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-950/50 rounded-xl cursor-pointer transition"
                          title="حذف الأستاذ والمادة"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <form
                  onSubmit={handleCreateSubject}
                  className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 space-y-2.5"
                >
                  <p className="text-xs font-extrabold text-emerald-300">
                    ➕ فتح مادة جديدة وتعيين حساب أستاذها:
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">
                        اسم المادة الدراسية
                      </label>
                      <input
                        type="text"
                        required
                        value={newSubjectName}
                        onChange={(e) => setNewSubjectName(e.target.value)}
                        placeholder="مثال: اللغة العربية"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">
                        اسم الأستاذ (اختياري)
                      </label>
                      <input
                        type="text"
                        value={newTeacherName}
                        onChange={(e) => setNewTeacherName(e.target.value)}
                        placeholder="مثال: أ. محمد علي"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-emerald-300 font-bold mb-1">
                        🔑 يوزر المادة (يدخل به الأستاذ)
                      </label>
                      <input
                        type="text"
                        required
                        value={newTeacherUser}
                        onChange={(e) => setNewTeacherUser(e.target.value)}
                        placeholder="مثال: arab5"
                        className="w-full bg-slate-900 border border-emerald-700/60 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-emerald-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-amber-300 font-bold mb-1">
                        🔒 باسوورد المادة
                      </label>
                      <input
                        type="text"
                        required
                        value={newTeacherPass}
                        onChange={(e) => setNewTeacherPass(e.target.value)}
                        placeholder="مثال: 123"
                        className="w-full bg-slate-900 border border-amber-700/60 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full btn-3d-emerald py-2.5 rounded-xl text-xs font-black text-white flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة المادة وتفعيل يوزر الأستاذ</span>
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
