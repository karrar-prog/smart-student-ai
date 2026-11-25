import React, { useState, useRef } from 'react';
import {
  BookOpen,
  Upload,
  FileText,
  Image as ImageIcon,
  FileUp,
  Sparkles,
  LogOut,
  CheckCircle2,
  Trash2,
  Eye,
  Loader2,
  HelpCircle,
  Sun,
  Moon,
  Settings,
  Camera,
  X,
  Mic,
  Square,
  Pencil,
} from 'lucide-react';
import { analyzeLessonWithAI } from '../services/aiService';
import {
  addSmartLesson,
  deleteLesson,
  updateLessonQuestions,
  updateLessonDetails,
  updateTeacherProfile,
} from '../services/dbService';

export default function TeacherView({
  session,
  dbState,
  theme,
  onToggleTheme,
  onLogout,
}) {
  const [lessonTitle, setLessonTitle] = useState('');
  const [uploadType, setUploadType] = useState('text');
  const [rawText, setRawText] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileDataUrl, setFileDataUrl] = useState(null);
  const [fileMimeType, setFileMimeType] = useState('');
  const [imageFilesList, setImageFilesList] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [expandedLessonId, setExpandedLessonId] = useState(null);
  const [lessonToDelete, setLessonToDelete] = useState(null);
  const [lessonToEdit, setLessonToEdit] = useState(null);
  const [editLesTitle, setEditLesTitle] = useState('');
  const [editLesType, setEditLesType] = useState('text');
  const [editLesFileName, setEditLesFileName] = useState('');
  const [editLesImagePreview, setEditLesImagePreview] = useState(null);
  const [editLesImagesList, setEditLesImagesList] = useState([]);
  const [editLesPdfPreview, setEditLesPdfPreview] = useState(null);
  const [editLesRawText, setEditLesRawText] = useState('');
  const [editLesAiSummary, setEditLesAiSummary] = useState('');
  const [editLesError, setEditLesError] = useState('');
  const [successBanner, setSuccessBanner] = useState('');

  // حالات تعديل وإضافة أسئلة للدرس بعد توليد الـ AI
  const [editingQuestionKey, setEditingQuestionKey] = useState(null); // `${lessonId}_${qIdx}` أو `${lessonId}_new`
  const [draftQuestionText, setDraftQuestionText] = useState('');
  const [draftOptions, setDraftOptions] = useState(['', '', '', '']);
  const [draftCorrectIndex, setDraftCorrectIndex] = useState(0);

  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [recordError, setRecordError] = useState('');
  const [teacherAudioDataUrl, setTeacherAudioDataUrl] = useState(null);
  const [teacherAudioMimeType, setTeacherAudioMimeType] = useState('');
  const [teacherAudioName, setTeacherAudioName] = useState('');
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordTimerRef = useRef(null);

  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [editTeacherName, setEditTeacherName] = useState('');
  const [editTeacherPassword, setEditTeacherPassword] = useState('');
  const [editTeacherIcon, setEditTeacherIcon] = useState('👨‍🏫');
  const [editTeacherColor, setEditTeacherColor] = useState('emerald');
  const [teacherProfileMsg, setTeacherProfileMsg] = useState('');
  const [teacherProfileError, setTeacherProfileError] = useState('');

  const colorThemes = {
    indigo: {
      bg: 'from-indigo-500 to-purple-600',
      shadow: 'shadow-indigo-600/30',
      swatch: 'bg-indigo-500',
      label: 'بنفسجي',
    },
    emerald: {
      bg: 'from-emerald-500 to-teal-600',
      shadow: 'shadow-emerald-600/30',
      swatch: 'bg-emerald-500',
      label: 'أخضر',
    },
    sky: {
      bg: 'from-sky-500 to-blue-600',
      shadow: 'shadow-sky-600/30',
      swatch: 'bg-sky-500',
      label: 'أزرق',
    },
    amber: {
      bg: 'from-amber-500 to-orange-600',
      shadow: 'shadow-amber-600/30',
      swatch: 'bg-amber-500',
      label: 'ذهبي',
    },
    rose: {
      bg: 'from-rose-500 to-pink-600',
      shadow: 'shadow-rose-600/30',
      swatch: 'bg-rose-500',
      label: 'أحمر وردي',
    },
    pink: {
      bg: 'from-pink-400 to-fuchsia-500',
      shadow: 'shadow-pink-500/30',
      swatch: 'bg-pink-400',
      label: 'وردي',
    },
    lightBrown: {
      bg: 'from-[#C89F72] to-[#A67B51]',
      shadow: 'shadow-amber-800/30',
      swatch: 'bg-[#C89F72]',
      label: 'بني فاتح',
    },
  };

  const currentSubject = (dbState.subjects || []).find(
    (s) => s.id === session.subjectId
  );
  const activeTeacherIcon =
    currentSubject?.icon || session.subjectIcon || '👨‍🏫';
  const activeTeacherName =
    currentSubject?.teacherName || session.teacherName || 'أستاذ المادة';
  const activeTeacherColor =
    currentSubject?.profileColor || currentSubject?.color || 'emerald';
  const activeColorTheme =
    colorThemes[activeTeacherColor] || colorThemes.emerald;

  const openTeacherSettings = () => {
    setEditTeacherName(activeTeacherName);
    setEditTeacherPassword(currentSubject?.teacherPassword || '123');
    setEditTeacherIcon(activeTeacherIcon);
    setEditTeacherColor(activeTeacherColor);
    setTeacherProfileMsg('');
    setTeacherProfileError('');
    setIsTeacherModalOpen(true);
  };

  const handleTeacherPhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (typeof ev.target?.result === 'string') {
        setEditTeacherIcon(ev.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveTeacherProfile = (e) => {
    e.preventDefault();
    setTeacherProfileMsg('');
    setTeacherProfileError('');
    const res = updateTeacherProfile(session.subjectId, {
      teacherName: editTeacherName,
      teacherPassword: editTeacherPassword,
      icon: editTeacherIcon,
      profileColor: editTeacherColor,
    });
    if (res.error) {
      setTeacherProfileError(res.error);
      return;
    }
    setTeacherProfileMsg('تم حفظ الإعدادات بنجاح! ✅');
    setTimeout(() => {
      setIsTeacherModalOpen(false);
    }, 700);
  };

  const subjectLessons = (dbState.lessons || []).filter(
    (l) => l.subjectId === session.subjectId
  );

  const compressImageDataUrl = (file) =>
    new Promise((resolve) => {
      const mime = file.type || 'image/jpeg';
      const reader = new FileReader();
      reader.onload = () => {
        const resultStr = reader.result;
        if (typeof resultStr !== 'string') {
          resolve(null);
          return;
        }
        if (mime.startsWith('image/') && resultStr.length > 160000) {
          const img = new window.Image();
          img.onload = () => {
            const maxDim = 1150;
            let { width, height } = img;
            if (width > maxDim || height > maxDim) {
              if (width > height) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              } else {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            resolve({
              name: file.name,
              dataUrl: canvas.toDataURL('image/jpeg', 0.75),
              mimeType: 'image/jpeg',
            });
          };
          img.onerror = () =>
            resolve({ name: file.name, dataUrl: resultStr, mimeType: mime });
          img.src = resultStr;
        } else {
          resolve({ name: file.name, dataUrl: resultStr, mimeType: mime });
        }
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (uploadType === 'image') {
      const processed = (
        await Promise.all(files.map((f) => compressImageDataUrl(f)))
      ).filter(Boolean);
      if (processed.length > 0) {
        setImageFilesList((prev) => {
          const next = [...prev, ...processed];
          setFileDataUrl(next[0]?.dataUrl || null);
          setFileMimeType(next[0]?.mimeType || 'image/jpeg');
          setFileName(
            next.length === 1 ? next[0].name : `${next.length} صور مرفقة`
          );
          return next;
        });
      }
      e.target.value = '';
      return;
    }

    const file = files[0];
    setFileName(file.name);
    const mime = file.type || 'application/octet-stream';
    setFileMimeType(mime);

    const reader = new FileReader();
    reader.onload = () => {
      const resultStr = reader.result;
      setFileDataUrl(resultStr);
    };
    reader.readAsDataURL(file);
  };

  const handleAudioFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setTeacherAudioName(file.name);
    setTeacherAudioMimeType(file.type || 'audio/webm');
    const reader = new FileReader();
    reader.onload = () => {
      setTeacherAudioDataUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const startVoiceRecording = async () => {
    setRecordError('');
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setRecordError('المتصفح لا يدعم التسجيل الصوتي المباشر، يمكنك اختيار ملف صوتي.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const preferredMime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : '';
      const recorder = preferredMime
        ? new MediaRecorder(stream, {
            mimeType: preferredMime,
            audioBitsPerSecond: 32000,
          })
        : new MediaRecorder(stream);

      audioChunksRef.current = [];
      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) {
          audioChunksRef.current.push(ev.data);
        }
      };

      recorder.onstop = () => {
        const cleanMime = (recorder.mimeType || 'audio/webm').split(';')[0];
        const blob = new Blob(audioChunksRef.current, { type: cleanMime });
        const reader = new FileReader();
        reader.onloadend = () => {
          setTeacherAudioDataUrl(reader.result);
          setTeacherAudioMimeType(cleanMime);
          setTeacherAudioName(`توجيه_صوتي_${new Date().toLocaleTimeString('ar-IQ')}.webm`);
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setRecordSeconds(0);
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      recordTimerRef.current = setInterval(() => {
        setRecordSeconds((s) => s + 1);
      }, 1000);
    } catch (err) {
      setRecordError('تعذر الوصول للمايكروفون! تأكد من منح صلاحية المايكروفون.');
    }
  };

  const stopVoiceRecording = () => {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== 'inactive'
    ) {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleFillSampleLesson = () => {
    setLessonTitle('المجموعة الشمسية وكواكبها السيّارة 🪐');
    setUploadType('text');
    setRawText(
      'تتكون المجموعة الشمسية من نجم واحد عظيم هو الشمس، وتدور حولها ثمانية كواكب في مدارات محددة بفعل جاذبية الشمس. أقرب الكواكب إلى الشمس هو عطارد، ويليه الزهرة، ثم كوكبنا الأرض (الكوكب المائي الوحيد الذي توجد عليه حياة)، ثم المريخ (الكوكب الأحمر). أما أكبر كواكب المجموعة الشمسية حجماً فهو كوكب المشتري العملاق.'
    );
  };

  const openEditLessonModal = (les) => {
    if (!les) return;
    setLessonToEdit(les);
    setEditLesTitle(les.title || '');
    const existingImgs =
      Array.isArray(les.imagePreviews) && les.imagePreviews.length > 0
        ? les.imagePreviews
        : les.imagePreview
        ? [les.imagePreview]
        : [];
    const initialType =
      existingImgs.length > 0
        ? 'image'
        : les.pdfPreview
        ? 'pdf'
        : les.fileType || 'text';
    setEditLesType(initialType);
    setEditLesFileName(les.fileName || '');
    setEditLesImagePreview(existingImgs[0] || null);
    setEditLesImagesList(existingImgs);
    setEditLesPdfPreview(les.pdfPreview || null);
    setEditLesRawText(les.rawText || '');
    setEditLesAiSummary(les.aiSummary || '');
    setEditLesError('');
  };

  const handleEditLessonFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (editLesType === 'image') {
      const processed = (
        await Promise.all(files.map((f) => compressImageDataUrl(f)))
      ).filter(Boolean);
      if (processed.length > 0) {
        const newUrls = processed.map((p) => p.dataUrl);
        setEditLesImagesList((prev) => {
          const next = [...prev, ...newUrls];
          setEditLesImagePreview(next[0] || null);
          setEditLesFileName(
            next.length === 1
              ? processed[0].name
              : `${next.length} صور مرفقة`
          );
          return next;
        });
        setEditLesPdfPreview(null);
      }
      e.target.value = '';
      return;
    }

    const file = files[0];
    setEditLesFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const resultStr = reader.result;
      if (typeof resultStr !== 'string') return;
      setEditLesPdfPreview(resultStr);
      setEditLesImagePreview(null);
      setEditLesImagesList([]);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveEditedLesson = (e) => {
    e.preventDefault();
    if (!lessonToEdit) return;
    setEditLesError('');

    const cleanTitle = editLesTitle.trim();
    if (!cleanTitle) {
      setEditLesError('يرجى إدخال عنوان الدرس!');
      return;
    }

    const res = updateLessonDetails(lessonToEdit.id, {
      title: cleanTitle,
      fileType: editLesType,
      fileName: editLesFileName,
      rawText: editLesRawText,
      imagePreview:
        editLesType === 'image' ? editLesImagesList[0] || null : null,
      imagePreviews: editLesType === 'image' ? editLesImagesList : [],
      pdfPreview: editLesType === 'pdf' ? editLesPdfPreview : null,
      aiSummary:
        editLesAiSummary.trim() ||
        editLesRawText.trim() ||
        lessonToEdit.aiSummary,
    });

    if (res.error) {
      setEditLesError(res.error);
      return;
    }

    setLessonToEdit(null);
    setSuccessBanner(`تم تعديل درس "${cleanTitle}" وحفظ التغييرات بنجاح! ✅`);
  };

  const openOrDownloadTeacherMedia = (dataUrl, type, title, fileName, mode = 'open') => {
    try {
      if (!dataUrl || typeof dataUrl !== 'string') return;
      let targetUrl = dataUrl;
      if (dataUrl.startsWith('data:')) {
        const parts = dataUrl.split(',');
        const meta = parts[0] || '';
        const base64 = parts[1] || '';
        const mimeMatch = meta.match(/data:([^;]+)/);
        const mimeType =
          mimeMatch?.[1] || (type === 'pdf' ? 'application/pdf' : 'image/jpeg');
        const binaryStr = window.atob(base64);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: mimeType });
        targetUrl = URL.createObjectURL(blob);
      }
      if (mode === 'download') {
        const ext = type === 'pdf' ? 'pdf' : 'jpg';
        const link = document.createElement('a');
        link.href = targetUrl;
        link.download =
          fileName && fileName.includes('.')
            ? fileName
            : `${title || 'مادة_الدرس'}.${ext}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        window.open(targetUrl, '_blank', 'noopener,noreferrer');
      }
    } catch {
      // ignore
    }
  };

  const handlePublishLesson = async (e) => {
    e.preventDefault();
    if (!lessonTitle.trim()) return;
    const activeImageUrls =
      uploadType === 'image'
        ? imageFilesList.map((item) => item.dataUrl).filter(Boolean)
        : [];
    if (
      !rawText.trim() &&
      !fileDataUrl &&
      activeImageUrls.length === 0 &&
      !teacherAudioDataUrl
    ) {
      return;
    }

    setIsAnalyzing(true);
    setSuccessBanner('');

    try {
      const aiData = await analyzeLessonWithAI({
        title: lessonTitle,
        subjectName: session.subjectName,
        stageName: session.stageName,
        rawText,
        fileDataUrl: activeImageUrls[0] || fileDataUrl,
        fileMimeType,
        imageDataUrls: activeImageUrls,
        teacherAudioDataUrl,
        teacherAudioMimeType,
      });

      const isPdfFile =
        uploadType === 'pdf' ||
        fileMimeType.includes('pdf') ||
        (typeof fileDataUrl === 'string' &&
          fileDataUrl.startsWith('data:application/pdf'));
      const isImageFile =
        !isPdfFile &&
        (activeImageUrls.length > 0 ||
          (Boolean(fileDataUrl) &&
            (uploadType === 'image' ||
              fileMimeType.startsWith('image/') ||
              (typeof fileDataUrl === 'string' &&
                fileDataUrl.startsWith('data:image/')))));

      const finalImages = isImageFile
        ? activeImageUrls.length > 0
          ? activeImageUrls
          : fileDataUrl
          ? [fileDataUrl]
          : []
        : [];

      const created = addSmartLesson({
        schoolId: session.schoolId,
        stageId: session.stageId,
        subjectId: session.subjectId,
        subjectName: session.subjectName,
        title: lessonTitle,
        fileType: isPdfFile ? 'pdf' : isImageFile ? 'image' : uploadType,
        fileName:
          fileName ||
          (finalImages.length > 1
            ? `${finalImages.length} صور مرفقة`
            : uploadType === 'text'
            ? 'نص مباشر'
            : 'ملف مرفق'),
        rawText,
        imagePreview: finalImages[0] || null,
        imagePreviews: finalImages,
        pdfPreview: isPdfFile ? fileDataUrl : null,
        audioPreview: teacherAudioDataUrl || null,
        audioName: teacherAudioName || 'التسجيل الصوتي للمعلم',
        aiData,
      });

      setLessonTitle('');
      setRawText('');
      setFileName('');
      setFileDataUrl(null);
      setImageFilesList([]);
      setTeacherAudioDataUrl(null);
      setTeacherAudioMimeType('');
      setTeacherAudioName('');
      setExpandedLessonId(created.id);
      setSuccessBanner(
        'تم تحليل الدرس وتوجيهاتك بالذكاء الاصطناعي وتوليد الملخص والأسئلة ونشره للطلاب بنجاح! ✨'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-slate-950 text-white relative">
      {/* نافذة تأكيد حذف الدرس */}
      {lessonToDelete && (
        <div
          onClick={() => setLessonToDelete(null)}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-rose-500/40 rounded-3xl max-w-xs w-full p-5 text-center text-white space-y-4 shadow-2xl"
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-black text-white">
                هل تريد حقاً حذف هذا الدرس؟
              </h3>
              <p className="text-xs text-slate-300 font-bold">
                "{lessonToDelete.title}"
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  deleteLesson(lessonToDelete.id);
                  setLessonToDelete(null);
                }}
                className="bg-rose-600 hover:bg-rose-500 text-white py-2.5 rounded-xl text-xs font-black cursor-pointer transition shadow-lg shadow-rose-600/30"
              >
                حذف
              </button>
              <button
                type="button"
                onClick={() => setLessonToDelete(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* نافذة تعديل الدرس (العنوان، الصورة أو ملف PDF، والشرح) */}
      {lessonToEdit && (
        <div
          onClick={() => setLessonToEdit(null)}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-indigo-500/40 rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto custom-scroll p-5 text-white space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Pencil className="w-4 h-4 text-indigo-400" />
                <h2 className="text-sm font-black">تعديل الدرس</h2>
              </div>
              <button
                type="button"
                onClick={() => setLessonToEdit(null)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editLesError && (
              <div className="bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs font-bold p-3 rounded-xl">
                ⚠️ {editLesError}
              </div>
            )}

            <form onSubmit={handleSaveEditedLesson} className="space-y-3.5">
              {/* 1. تعديل عنوان الدرس */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  عنوان الدرس
                </label>
                <input
                  type="text"
                  required
                  value={editLesTitle}
                  onChange={(e) => setEditLesTitle(e.target.value)}
                  placeholder="عنوان الدرس..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              {/* 2. نوع المادة المرفقة (نص / صورة / ملف PDF) */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  مادة الدرس (نص / صورة / ملف PDF):
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditLesType('text')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border cursor-pointer transition ${
                      editLesType === 'text'
                        ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>نص</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditLesType('image')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border cursor-pointer transition ${
                      editLesType === 'image'
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>صورة</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditLesType('pdf')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border cursor-pointer transition ${
                      editLesType === 'pdf'
                        ? 'bg-amber-600/20 border-amber-500 text-amber-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <FileUp className="w-3.5 h-3.5" />
                    <span>ملف PDF</span>
                  </button>
                </div>

                {editLesType === 'image' && (
                  <div className="mt-2.5 bg-slate-950 border border-slate-800 rounded-2xl p-3 space-y-2.5 text-center">
                    {editLesImagesList.length > 0 ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          {editLesImagesList.map((imgUrl, idx) => (
                            <div
                              key={idx}
                              className="relative bg-slate-900 border border-slate-800 rounded-xl p-1.5"
                            >
                              <span className="absolute top-2 right-2 bg-slate-950/85 text-indigo-300 text-[10px] font-black px-1.5 py-0.5 rounded-md">
                                صورة {idx + 1}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditLesImagesList((prev) => {
                                    const next = prev.filter((_, i) => i !== idx);
                                    setEditLesImagePreview(next[0] || null);
                                    return next;
                                  });
                                }}
                                className="absolute top-2 left-2 w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center cursor-pointer shadow"
                                title="حذف هذه الصورة"
                              >
                                ✖
                              </button>
                              <img
                                src={imgUrl}
                                alt={`صورة ${idx + 1}`}
                                className="h-28 w-full rounded-lg object-contain"
                              />
                            </div>
                          ))}
                        </div>
                        <p className="text-[11px] text-emerald-400 font-bold">
                          ✅ عدد الصور المرفقة: {editLesImagesList.length}
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">
                        لا توجد صور مرفوعة حالياً لهذا الدرس
                      </p>
                    )}

                    <div className="flex items-center justify-center gap-2">
                      <label className="bg-indigo-600/25 hover:bg-indigo-600/35 border border-indigo-500/50 text-indigo-200 px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer transition">
                        <span>
                          {editLesImagesList.length > 0
                            ? '+ إضافة صورة أخرى 🖼️'
                            : 'رفع صور الدرس 🖼️'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleEditLessonFileChange}
                          className="hidden"
                        />
                      </label>
                      {editLesImagesList.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditLesImagesList([]);
                            setEditLesImagePreview(null);
                            setEditLesFileName('');
                          }}
                          className="bg-rose-950 hover:bg-rose-900 border border-rose-700/50 text-rose-300 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer"
                        >
                          حذف الكل
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {editLesType === 'pdf' && (
                  <div className="mt-2.5 bg-slate-950 border border-slate-800 rounded-2xl p-3 space-y-2.5 text-center">
                    {editLesPdfPreview ? (
                      <p className="text-xs text-amber-300 font-bold truncate">
                        📄 الملف الحالي: {editLesFileName || 'ملف_الدرس.pdf'}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400">
                        لا يوجد ملف PDF مرفوع حالياً لهذا الدرس
                      </p>
                    )}

                    <div className="flex items-center justify-center gap-2">
                      <label className="bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-200 px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer transition">
                        <span>
                          {editLesPdfPreview ? 'تغيير ملف PDF 📄' : 'رفع ملف PDF 📄'}
                        </span>
                        <input
                          type="file"
                          accept="application/pdf"
                          onChange={handleEditLessonFileChange}
                          className="hidden"
                        />
                      </label>
                      {editLesPdfPreview && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditLesPdfPreview(null);
                            setEditLesFileName('');
                          }}
                          className="bg-rose-950 hover:bg-rose-900 border border-rose-700/50 text-rose-300 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer"
                        >
                          حذف الـ PDF
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 3. تعديل الشرح المبسط الذي يظهر للطالب */}
              <div>
                <label className="block text-xs font-bold text-indigo-300 mb-1">
                  الشرح المبسط للطالب:
                </label>
                <textarea
                  rows={4}
                  value={editLesAiSummary}
                  onChange={(e) => setEditLesAiSummary(e.target.value)}
                  placeholder="اكتب أو عدّل شرح الدرس الذي يظهر للطالب..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-3 text-xs text-white outline-none resize-none leading-relaxed"
                />
              </div>

              {/* 4. تعديل نص الدرس الأساسي */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  نص وشرح المادة الأساسي (اختياري):
                </label>
                <textarea
                  rows={3}
                  value={editLesRawText}
                  onChange={(e) => setEditLesRawText(e.target.value)}
                  placeholder="النص التفصيلي للدرس..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-3 text-xs text-white outline-none resize-none leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  type="submit"
                  className="btn-3d-emerald py-2.5 rounded-xl text-xs font-black text-white cursor-pointer"
                >
                  حفظ التعديلات ✅
                </button>
                <button
                  type="button"
                  onClick={() => setLessonToEdit(null)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* نافذة إعدادات المعلم */}
      {isTeacherModalOpen && (
        <div
          onClick={() => setIsTeacherModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-slate-700 rounded-3xl max-w-sm w-full p-5 text-white space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-400" />
                <h2 className="text-sm font-black">الإعدادات</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsTeacherModalOpen(false)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {teacherProfileMsg && (
              <div className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 text-xs font-bold p-3 rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{teacherProfileMsg}</span>
              </div>
            )}

            {teacherProfileError && (
              <div className="bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs font-bold p-3 rounded-xl">
                ⚠️ {teacherProfileError}
              </div>
            )}

            <form onSubmit={handleSaveTeacherProfile} className="space-y-3.5">
              {/* 1. تغيير الصورة أو اختيار شكل + لون الإطار */}
              <div className="flex flex-col items-center gap-2">
                <div
                  className={`w-20 h-20 rounded-3xl bg-gradient-to-tr ${
                    colorThemes[editTeacherColor]?.bg || colorThemes.emerald.bg
                  } flex items-center justify-center text-3xl shadow-lg overflow-hidden border-2 border-white/20`}
                >
                  {editTeacherIcon?.startsWith('data:image') ? (
                    <img
                      src={editTeacherIcon}
                      alt="صورة المعلم"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{editTeacherIcon || '👨‍🏫'}</span>
                  )}
                </div>

                <label className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-indigo-300 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition">
                  <Camera className="w-3.5 h-3.5" />
                  <span>تغيير صورتك من الجهاز</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleTeacherPhotoChange}
                    className="hidden"
                  />
                </label>

                <div className="flex flex-wrap justify-center gap-1.5 pt-1">
                  {[
                    '👨‍🏫',
                    '👩‍🏫',
                    '🔬',
                    '📐',
                    '🌍',
                    '🕌',
                    '📖',
                    '🗺️',
                    '🧪',
                    '🔭',
                    '🎓',
                    '✒️',
                    '🧠',
                    '💡',
                  ].map((emo) => (
                    <button
                      type="button"
                      key={emo}
                      onClick={() => setEditTeacherIcon(emo)}
                      className={`w-8 h-8 rounded-xl text-sm flex items-center justify-center cursor-pointer border transition ${
                        editTeacherIcon === emo
                          ? 'bg-indigo-600/30 border-indigo-400 scale-105'
                          : 'bg-slate-950 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      {emo}
                    </button>
                  ))}
                </div>

                {/* اختيار لون الإطار / الخلفية */}
                <div className="w-full bg-slate-950/90 border border-slate-800 rounded-2xl p-3 flex items-center justify-between gap-2 mt-1">
                  <span className="text-xs font-black text-slate-300 flex items-center gap-1.5">
                    <span>تغيير اللون:</span>
                  </span>
                  <div className="flex items-center gap-2">
                    {Object.entries(colorThemes).map(([key, theme]) => (
                      <button
                        type="button"
                        key={key}
                        onClick={() => setEditTeacherColor(key)}
                        title={theme.label}
                        className={`w-7 h-7 rounded-full ${theme.swatch} cursor-pointer transition-all ${
                          editTeacherColor === key
                            ? 'ring-2 ring-white scale-110 shadow-lg'
                            : 'opacity-70 hover:opacity-100'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* 2. الاسم */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  الاسم
                </label>
                <input
                  type="text"
                  value={editTeacherName}
                  onChange={(e) => setEditTeacherName(e.target.value)}
                  placeholder="اكتب اسمك الكامل"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-white outline-none"
                />
              </div>

              {/* 3. كلمة السر (الرمز السري) */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  كلمة السر (الرمز السري)
                </label>
                <input
                  type="text"
                  value={editTeacherPassword}
                  onChange={(e) => setEditTeacherPassword(e.target.value)}
                  placeholder="اكتب كلمة السر الجديدة"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-white outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full btn-3d-indigo py-3 rounded-xl text-xs font-black text-white cursor-pointer"
              >
                حفظ التغييرات ✅
              </button>
            </form>
          </div>
        </div>
      )}

      {/* الهيدر الخاص بأستاذ المادة */}
      <div className="bg-gradient-to-l from-emerald-600/25 via-slate-900 to-slate-900 border-b border-slate-800 p-4 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={openTeacherSettings}
            title="الإعدادات"
            className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${activeColorTheme.bg} text-white flex items-center justify-center text-xl shadow-lg ${activeColorTheme.shadow} overflow-hidden cursor-pointer hover:scale-105 transition`}
          >
            {activeTeacherIcon?.startsWith('data:image') ? (
              <img
                src={activeTeacherIcon}
                alt={activeTeacherName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{activeTeacherIcon}</span>
            )}
          </button>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-black text-white">{session.subjectName}</h1>
              <span className="text-[10px] font-bold text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded-full">
                {activeTeacherName}
              </span>
            </div>
            <p className="text-[11px] text-emerald-300 font-bold">
              {session.schoolName} • {session.stageName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
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

      <div className="p-4 space-y-5 flex-1 min-h-0 overflow-y-auto custom-scroll">
        <form
          onSubmit={handlePublishLesson}
          className="bg-slate-900 border border-emerald-500/30 rounded-3xl p-4 space-y-3.5 shadow-xl"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-white flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-emerald-400" />
              <span>رفع درس جديد</span>
            </h2>
          </div>

          {successBanner && (
            <div className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 text-xs font-bold p-3 rounded-2xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successBanner}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              عنوان الدرس
            </label>
            <input
              type="text"
              required
              value={lessonTitle}
              onChange={(e) => setLessonTitle(e.target.value)}
              placeholder="مثال: المجموعة الشمسية..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs text-white outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              1. مادة الدرس (تعرض للطالب للمراجعة):
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setUploadType('text')}
                className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border cursor-pointer transition ${
                  uploadType === 'text'
                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>نص</span>
              </button>

              <button
                type="button"
                onClick={() => setUploadType('image')}
                className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border cursor-pointer transition ${
                  uploadType === 'image'
                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>صورة</span>
              </button>

              <button
                type="button"
                onClick={() => setUploadType('pdf')}
                className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border cursor-pointer transition ${
                  uploadType === 'pdf'
                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <FileUp className="w-3.5 h-3.5" />
                <span>ملف PDF</span>
              </button>
            </div>
          </div>

          {(uploadType === 'image' || uploadType === 'pdf') && (
            <div className="bg-slate-950 border-2 border-dashed border-slate-700 hover:border-emerald-500/60 rounded-2xl p-4 text-center transition space-y-3">
              <input
                type="file"
                id="teacher-file-upload"
                accept={uploadType === 'image' ? 'image/*' : '.pdf,application/pdf'}
                multiple={uploadType === 'image'}
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="teacher-file-upload"
                className="cursor-pointer flex flex-col items-center gap-1.5"
              >
                {uploadType === 'image' ? (
                  <ImageIcon className="w-8 h-8 text-emerald-400" />
                ) : (
                  <FileUp className="w-8 h-8 text-amber-400" />
                )}
                <span className="text-xs font-bold text-slate-200">
                  {uploadType === 'image'
                    ? imageFilesList.length > 0
                      ? `+ إضافة صورة أخرى (${imageFilesList.length} صور مختارة)`
                      : 'اختيار صورة أو أكثر للدرس'
                    : fileName
                    ? `✅ ${fileName}`
                    : 'اختيار ملف PDF'}
                </span>
              </label>

              {uploadType === 'image' && imageFilesList.length > 0 && (
                <div className="space-y-2 pt-1">
                  <div className="grid grid-cols-2 gap-2">
                    {imageFilesList.map((imgItem, idx) => (
                      <div
                        key={idx}
                        className="relative bg-slate-900 border border-slate-800 rounded-xl p-1.5"
                      >
                        <span className="absolute top-2 right-2 bg-slate-950/85 text-emerald-300 text-[10px] font-black px-1.5 py-0.5 rounded-md">
                          صورة {idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setImageFilesList((prev) => {
                              const next = prev.filter((_, i) => i !== idx);
                              setFileDataUrl(next[0]?.dataUrl || null);
                              setFileName(
                                next.length === 0
                                  ? ''
                                  : next.length === 1
                                  ? next[0].name
                                  : `${next.length} صور مرفقة`
                              );
                              return next;
                            });
                          }}
                          className="absolute top-2 left-2 w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center cursor-pointer shadow"
                          title="حذف هذه الصورة"
                        >
                          ✖
                        </button>
                        <img
                          src={imgItem.dataUrl}
                          alt={imgItem.name || `صورة ${idx + 1}`}
                          className="h-28 w-full mx-auto rounded-lg object-contain"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              {uploadType === 'text' ? 'محتوى الدرس النصي' : 'ملاحظات نصية للمادة (اختياري)'}
            </label>
            <textarea
              rows={3}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="اكتب أو الصق نص الدرس هنا..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-3 text-xs text-white outline-none resize-none leading-relaxed"
            />
          </div>

          {/* القسم الثاني بالأسفل: إرسال صوت لتوجيه الذكاء الاصطناعي */}
          <div className="bg-slate-950 border border-indigo-500/30 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-indigo-300 flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-rose-400" />
                <span>2. توجيه صوتي للذكاء الاصطناعي (اختياري)</span>
              </span>
              {teacherAudioDataUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setTeacherAudioDataUrl(null);
                    setTeacherAudioName('');
                    setTeacherAudioMimeType('');
                  }}
                  className="text-[10px] font-bold text-rose-400 hover:text-rose-300 cursor-pointer"
                >
                  حذف الصوت ✖
                </button>
              )}
            </div>

            {recordError && (
              <div className="bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-bold p-2 rounded-xl">
                ⚠️ {recordError}
              </div>
            )}

            <div className="flex items-center gap-2">
              {!isRecording ? (
                <button
                  type="button"
                  onClick={startVoiceRecording}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/50 text-rose-300 text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer transition"
                >
                  <Mic className="w-4 h-4 text-rose-400" />
                  <span>سجّل صوتك لتوجيه الـ AI 🎙️</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopVoiceRecording}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-rose-600 text-white text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer animate-pulse shadow-lg shadow-rose-600/40"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>
                    جاري التسجيل ({Math.floor(recordSeconds / 60)}:
                    {String(recordSeconds % 60).padStart(2, '0')}) — إيقاف
                  </span>
                </button>
              )}

              <input
                type="file"
                id="teacher-audio-upload"
                accept="audio/*"
                onChange={handleAudioFileChange}
                className="hidden"
              />
              <label
                htmlFor="teacher-audio-upload"
                className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-bold cursor-pointer transition shrink-0"
              >
                ملف صوتي
              </label>
            </div>

            {teacherAudioDataUrl && (
              <div className="pt-1 space-y-1">
                <p className="text-[10px] font-bold text-emerald-400">
                  ✅ {teacherAudioName || 'تم تجهيز التوجيه الصوتي للـ AI'}
                </p>
                <audio
                  controls
                  src={teacherAudioDataUrl}
                  className="w-full h-8 rounded-xl"
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isAnalyzing}
            className="w-full btn-3d-emerald py-3 rounded-xl text-xs font-black text-white flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>جاري التحليل والنشر...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>تحليل ونشر الدرس ✨</span>
              </>
            )}
          </button>
        </form>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-300 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <span>الدروس المنشورة ({subjectLessons.length})</span>
            </h3>
          </div>

          {subjectLessons.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 text-center">
              <p className="text-xs font-bold text-slate-400">
                لم تقم برفع أي درس في هذه المادة بعد.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {subjectLessons.map((les) => {
                const isExpanded = expandedLessonId === les.id;
                return (
                  <div
                    key={les.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="inline-block bg-emerald-500/15 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full mb-1">
                          ✨ معالج بالذكاء الاصطناعي ({les.aiQuestions?.length || 0} أسئلة)
                        </span>
                        <h4 className="text-sm font-black text-white">{les.title}</h4>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditLessonModal(les)}
                          className="bg-indigo-600/20 hover:bg-indigo-600/35 border border-indigo-500/40 text-indigo-300 px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 cursor-pointer transition"
                          title="تعديل عنوان الدرس أو الصورة أو ملف PDF أو الشرح"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>تعديل</span>
                        </button>
                        <button
                          onClick={() =>
                            setExpandedLessonId(isExpanded ? null : les.id)
                          }
                          className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 cursor-pointer transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{isExpanded ? 'إخفاء' : 'معاينة الـ AI'}</span>
                        </button>
                        <button
                          onClick={() => setLessonToDelete(les)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 rounded-xl cursor-pointer transition"
                          title="حذف الدرس"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="bg-slate-950 border border-slate-800/90 rounded-xl p-3 space-y-3 text-xs">
                        {(les.imagePreview ||
                          (Array.isArray(les.imagePreviews) &&
                            les.imagePreviews.length > 0) ||
                          les.pdfPreview ||
                          les.audioPreview) && (
                          <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 space-y-2">
                            <p className="font-black text-amber-300 text-[11px]">
                              📎 مرفقات المادة المرفوعة للطالب:
                            </p>
                            {les.audioPreview && (
                              <div className="bg-slate-950 border border-rose-500/40 rounded-xl p-2.5 space-y-1.5">
                                <p className="text-[11px] font-black text-rose-300">
                                  🎙️ التسجيل الصوتي للمعلم ({les.audioName || 'شرح صوتي'}):
                                </p>
                                <audio
                                  controls
                                  src={les.audioPreview}
                                  className="w-full h-9 rounded-lg"
                                />
                              </div>
                            )}
                            {(Array.isArray(les.imagePreviews) &&
                            les.imagePreviews.length > 0
                              ? les.imagePreviews
                              : les.imagePreview
                              ? [les.imagePreview]
                              : []
                            ).map((imgSrc, imgIdx, imgArr) => (
                              <div key={imgIdx} className="space-y-2">
                                {imgArr.length > 1 && (
                                  <p className="text-[11px] font-black text-emerald-300">
                                    🖼️ صورة ({imgIdx + 1} من {imgArr.length}):
                                  </p>
                                )}
                                <img
                                  src={imgSrc}
                                  alt={`${les.title} - ${imgIdx + 1}`}
                                  className="w-full max-h-40 object-contain rounded-lg bg-slate-950 p-1"
                                />
                                <div className="grid grid-cols-2 gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openOrDownloadTeacherMedia(
                                        imgSrc,
                                        'image',
                                        `${les.title}_${imgIdx + 1}`,
                                        les.fileName,
                                        'open'
                                      )
                                    }
                                    className="py-1.5 px-2 rounded-lg bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 font-black cursor-pointer"
                                  >
                                    🔍 فتح الصورة
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openOrDownloadTeacherMedia(
                                        imgSrc,
                                        'image',
                                        `${les.title}_${imgIdx + 1}`,
                                        les.fileName,
                                        'download'
                                      )
                                    }
                                    className="py-1.5 px-2 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-black cursor-pointer"
                                  >
                                    ⬇️ تحميل الصورة
                                  </button>
                                </div>
                              </div>
                            ))}
                            {les.pdfPreview && (
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    openOrDownloadTeacherMedia(
                                      les.pdfPreview,
                                      'pdf',
                                      les.title,
                                      les.fileName,
                                      'open'
                                    )
                                  }
                                  className="py-1.5 px-2 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 font-black cursor-pointer"
                                >
                                  📄 فتح الـ PDF
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    openOrDownloadTeacherMedia(
                                      les.pdfPreview,
                                      'pdf',
                                      les.title,
                                      les.fileName,
                                      'download'
                                    )
                                  }
                                  className="py-1.5 px-2 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-black cursor-pointer"
                                >
                                  ⬇️ تحميل الـ PDF
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        <div>
                          <p className="font-black text-indigo-300 mb-1">
                            🤖 الشرح المبسط الذي يظهر للطالب:
                          </p>
                          <p className="text-slate-300 whitespace-pre-line leading-relaxed">
                            {les.aiSummary}
                          </p>
                        </div>

                        {les.aiKeyPoints?.length > 0 && (
                          <div>
                            <p className="font-black text-emerald-300 mb-1">
                              📌 النقاط الذهبية المستخلصة:
                            </p>
                            <ul className="space-y-1 text-slate-300">
                              {les.aiKeyPoints.map((pt, i) => (
                                <li key={i}>{pt}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-black text-amber-300 flex items-center gap-1">
                              <HelpCircle className="w-3.5 h-3.5" />
                              <span>
                                بنك الأسئلة ({les.aiQuestions?.length || 0} أسئلة):
                              </span>
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingQuestionKey(`${les.id}_new`);
                                setDraftQuestionText('');
                                setDraftOptions(['', '', '', '']);
                                setDraftCorrectIndex(0);
                              }}
                              className="bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/50 text-emerald-300 px-2.5 py-1 rounded-xl text-[10px] font-black cursor-pointer transition"
                            >
                              + إضافة سؤال جديد
                            </button>
                          </div>

                          <div className="space-y-2">
                            {(les.aiQuestions || []).map((q, qIdx) => {
                              const currentKey = `${les.id}_${qIdx}`;
                              const isEditingThis = editingQuestionKey === currentKey;

                              if (isEditingThis) {
                                return (
                                  <div
                                    key={qIdx}
                                    className="bg-slate-900 border border-indigo-500/60 rounded-xl p-3 space-y-2.5"
                                  >
                                    <div>
                                      <label className="block text-[10px] font-bold text-indigo-300 mb-1">
                                        تعديل نص السؤال ({qIdx + 1}):
                                      </label>
                                      <input
                                        type="text"
                                        value={draftQuestionText}
                                        onChange={(e) =>
                                          setDraftQuestionText(e.target.value)
                                        }
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                                      />
                                    </div>
                                    <div className="space-y-1.5">
                                      <span className="block text-[10px] font-bold text-slate-400">
                                        الخيارات (اضغط على الدائرة لتحديد الجواب الصحيح):
                                      </span>
                                      {draftOptions.map((optVal, oIdx) => (
                                        <div
                                          key={oIdx}
                                          className="flex items-center gap-1.5"
                                        >
                                          <button
                                            type="button"
                                            onClick={() =>
                                              setDraftCorrectIndex(oIdx)
                                            }
                                            className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] cursor-pointer shrink-0 ${
                                              draftCorrectIndex === oIdx
                                                ? 'bg-emerald-500 border-emerald-400 text-slate-950 font-black'
                                                : 'bg-slate-950 border-slate-700 text-slate-500'
                                            }`}
                                          >
                                            ✓
                                          </button>
                                          <input
                                            type="text"
                                            value={optVal}
                                            onChange={(e) => {
                                              const next = [...draftOptions];
                                              next[oIdx] = e.target.value;
                                              setDraftOptions(next);
                                            }}
                                            placeholder={`الخيار ${oIdx + 1}`}
                                            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-[11px] text-white outline-none"
                                          />
                                        </div>
                                      ))}
                                    </div>
                                    <div className="flex items-center gap-2 pt-1">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (!draftQuestionText.trim()) return;
                                          const nextQuestions = [
                                            ...(les.aiQuestions || []),
                                          ];
                                          nextQuestions[qIdx] = {
                                            ...q,
                                            question: draftQuestionText.trim(),
                                            options: draftOptions.map(
                                              (o, idx) =>
                                                o.trim() || `خيار ${idx + 1}`
                                            ),
                                            correctIndex: draftCorrectIndex,
                                          };
                                          updateLessonQuestions(
                                            les.id,
                                            nextQuestions
                                          );
                                          setEditingQuestionKey(null);
                                        }}
                                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-[11px] font-black cursor-pointer"
                                      >
                                        حفظ التعديل ✅
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setEditingQuestionKey(null)
                                        }
                                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer"
                                      >
                                        إلغاء
                                      </button>
                                    </div>
                                  </div>
                                );
                              }

                              return (
                                <div
                                  key={qIdx}
                                  className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 space-y-1.5"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <p className="font-bold text-white">
                                      س{qIdx + 1}: {q.question}
                                    </p>
                                    <div className="flex items-center gap-1 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingQuestionKey(currentKey);
                                          setDraftQuestionText(q.question || '');
                                          const opts = Array.isArray(q.options)
                                            ? [...q.options]
                                            : [];
                                          while (opts.length < 4) opts.push('');
                                          setDraftOptions(opts.slice(0, 4));
                                          setDraftCorrectIndex(
                                            Number(q.correctIndex) || 0
                                          );
                                        }}
                                        className="px-2 py-0.5 bg-slate-800 hover:bg-indigo-600/30 text-indigo-300 rounded text-[10px] font-bold cursor-pointer"
                                      >
                                        تعديل ✏️
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const nextQuestions = (
                                            les.aiQuestions || []
                                          ).filter((_, idx) => idx !== qIdx);
                                          updateLessonQuestions(
                                            les.id,
                                            nextQuestions
                                          );
                                        }}
                                        className="px-1.5 py-0.5 bg-slate-800 hover:bg-rose-600/30 text-rose-300 rounded text-[10px] font-bold cursor-pointer"
                                        title="حذف السؤال"
                                      >
                                        ✖
                                      </button>
                                    </div>
                                  </div>
                                  <p className="text-[11px] text-emerald-400 font-bold">
                                    ✅ الجواب الصحيح: {q.options?.[q.correctIndex]}
                                  </p>
                                </div>
                              );
                            })}

                            {editingQuestionKey === `${les.id}_new` && (
                              <div className="bg-slate-900 border border-emerald-500/60 rounded-xl p-3 space-y-2.5">
                                <div>
                                  <label className="block text-[10px] font-bold text-emerald-300 mb-1">
                                    إضافة سؤال جديد للدرس:
                                  </label>
                                  <input
                                    type="text"
                                    value={draftQuestionText}
                                    onChange={(e) =>
                                      setDraftQuestionText(e.target.value)
                                    }
                                    placeholder="اكتب نص السؤال الجديد..."
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <span className="block text-[10px] font-bold text-slate-400">
                                    الخيارات (اضغط على الدائرة لتحديد الجواب الصحيح):
                                  </span>
                                  {draftOptions.map((optVal, oIdx) => (
                                    <div
                                      key={oIdx}
                                      className="flex items-center gap-1.5"
                                    >
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setDraftCorrectIndex(oIdx)
                                        }
                                        className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] cursor-pointer shrink-0 ${
                                          draftCorrectIndex === oIdx
                                            ? 'bg-emerald-500 border-emerald-400 text-slate-950 font-black'
                                            : 'bg-slate-950 border-slate-700 text-slate-500'
                                        }`}
                                      >
                                        ✓
                                      </button>
                                      <input
                                        type="text"
                                        value={optVal}
                                        onChange={(e) => {
                                          const next = [...draftOptions];
                                          next[oIdx] = e.target.value;
                                          setDraftOptions(next);
                                        }}
                                        placeholder={`الخيار ${oIdx + 1}`}
                                        className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-[11px] text-white outline-none"
                                      />
                                    </div>
                                  ))}
                                </div>
                                <div className="flex items-center gap-2 pt-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (!draftQuestionText.trim()) return;
                                      const newQ = {
                                        question: draftQuestionText.trim(),
                                        options: draftOptions.map(
                                          (o, idx) =>
                                            o.trim() || `خيار ${idx + 1}`
                                        ),
                                        correctIndex: draftCorrectIndex,
                                        explanation: 'سؤال مضاف من أستاذ المادة.',
                                        difficulty: 'متوسط',
                                      };
                                      const nextQuestions = [
                                        ...(les.aiQuestions || []),
                                        newQ,
                                      ];
                                      updateLessonQuestions(
                                        les.id,
                                        nextQuestions
                                      );
                                      setEditingQuestionKey(null);
                                    }}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-[11px] font-black cursor-pointer"
                                  >
                                    إضافة السؤال ✅
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingQuestionKey(null)}
                                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer"
                                  >
                                    إلغاء
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
