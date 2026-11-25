import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  BookOpen,
  Sparkles,
  Brain,
  Swords,
  Trophy,
  LogOut,
  Building2,
  Layers,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Users,
  Play,
  Bot,
  Crown,
  Flame,
  Lock,
  Loader2,
  Volume2,
  RotateCcw,
  FileText,
  ChevronDown,
  Sun,
  Moon,
  Camera,
  X,
  Settings,
  TrendingUp,
  Bell,
  Search,
} from 'lucide-react';
import {
  getDatabaseState,
  requestStudentJoinSchoolStage,
  updateStudentJoinStatus,
  updateStudentProfile,
  updateStudentVoiceGender,
  purchaseRareAvatar,
  addPointsToStudent,
  createChallengeRoom,
  inviteStudentToChallengeRoom,
  acceptChallengeInvitation,
  declineChallengeInvitation,
  cancelChallengeRoom,
  startChallengeGame,
  submitPlayerRoomAnswer,
  advanceOrFinishChallengeRoom,
} from '../services/dbService';
import {
  askSmartTutor,
  cleanTextForArabicSpeech,
  splitTextIntoSpeechSegments,
  generateGeminiArabicSpeechPayload,
  prefetchGeminiSpeechSegments,
} from '../services/aiService';
import SmartBookIcon from './SmartBookIcon';

export default function StudentView({
  studentId,
  dbState,
  theme,
  onToggleTheme,
  onLogout,
}) {
  const student =
    (dbState.students || []).find((s) => s.id === studentId) ||
    (getDatabaseState().students || []).find((s) => s.id === studentId);

  const [pickedSchoolId, setPickedSchoolId] = useState('');
  const [pickedStageId, setPickedStageId] = useState('');

  const [activeTab, setActiveTab] = useState('review');
  const [challengeSubTab, setChallengeSubTab] = useState('friends');
  const [selectedSubjectId, setSelectedSubjectId] = useState('all');
  const [activeLessonId, setActiveLessonId] = useState(null);

  const [tutorQuestion, setTutorQuestion] = useState('');
  const [tutorChat, setTutorChat] = useState([]);
  const [isAskingTutor, setIsAskingTutor] = useState(false);
  const [showLessonCardModal, setShowLessonCardModal] = useState(false);
  const [mediaPreviewModal, setMediaPreviewModal] = useState(null);
  const [isLessonPickerOpen, setIsLessonPickerOpen] = useState(false);

  const [quizLesson, setQuizLesson] = useState(null);
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  const [activeRoomId, setActiveRoomId] = useState(null);
  const [inspectedStudentId, setInspectedStudentId] = useState(null);
  const [showInviteFriendsList, setShowInviteFriendsList] = useState(false);
  const [roomError, setRoomError] = useState('');
  const [selectedChallengeTier, setSelectedChallengeTier] = useState('standard');
  const [selectedRoomLessonId, setSelectedRoomLessonId] = useState('');
  const [lessonSearchQuery, setLessonSearchQuery] = useState('');
  const [countdown, setCountdown] = useState(null);
  const [lobbyTimeLeft, setLobbyTimeLeft] = useState(30);
  const [timeLeft, setTimeLeft] = useState(15);
  const [myRoomAnswer, setMyRoomAnswer] = useState(null);

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editAvatar, setEditAvatar] = useState('👨‍🎓');
  const [editProfileColor, setEditProfileColor] = useState('indigo');
  const [editVoiceGender, setEditVoiceGender] = useState(
    () => student?.voiceGender || 'male'
  );
  const [editFontScale, setEditFontScale] = useState(() => {
    const saved = Number(
      localStorage.getItem('smart_student_font_scale_v2') ||
        (student?.fontScale && student.fontScale !== 100
          ? student.fontScale
          : 110)
    );
    return saved >= 70 && saved <= 160
      ? Math.min(120, Math.max(80, saved))
      : 110;
  });
  const [profileMsg, setProfileMsg] = useState('');
  const [profileError, setProfileError] = useState('');
  const [pendingAvatarPurchase, setPendingAvatarPurchase] = useState(null);
  const [noInviteWarningModal, setNoInviteWarningModal] = useState(false);

  const [dismissedRoomIds, setDismissedRoomIds] = useState([]);
  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);
  const notifiedRoomIdsRef = useRef(new Set());
  const [speakingMsgKey, setSpeakingMsgKey] = useState(null);
  const speakingKeyRef = useRef(null);
  const speechSessionIdRef = useRef(0);
  const activeUtteranceRef = useRef(null);
  const activeSpeechAudioRef = useRef(null);
  const speechAudioCtxRef = useRef(null);
  const activeBufferSourceRef = useRef(null);
  const speechWatchdogRef = useRef(null);
  const lockedVoicesRef = useRef({ male: null, female: null });

  useEffect(() => {
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.getVoices();
        window.speechSynthesis.onvoiceschanged = () => {
          lockedVoicesRef.current = { male: null, female: null };
          window.speechSynthesis.getVoices();
        };
      }
    } catch {
      // ignore
    }
    return () => {
      speechSessionIdRef.current += 1;
      speakingKeyRef.current = null;
      if (speechWatchdogRef.current) {
        clearInterval(speechWatchdogRef.current);
        speechWatchdogRef.current = null;
      }
      try {
        if (activeBufferSourceRef.current) {
          activeBufferSourceRef.current.onended = null;
          activeBufferSourceRef.current.stop();
          activeBufferSourceRef.current.disconnect();
          activeBufferSourceRef.current = null;
        }
        if (activeUtteranceRef.current) {
          activeUtteranceRef.current.onend = null;
          activeUtteranceRef.current.onerror = null;
          activeUtteranceRef.current = null;
        }
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
        if (activeSpeechAudioRef.current) {
          activeSpeechAudioRef.current.pause();
          activeSpeechAudioRef.current = null;
        }
      } catch {
        // ignore
      }
    };
  }, []);

  const playInviteNotificationSound = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const notes = [587.33, 880, 1174.66]; // D5 -> A5 -> D6 chime
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.13);
          gain.gain.setValueAtTime(0.22, ctx.currentTime + idx * 0.13);
          gain.gain.exponentialRampToValueAtTime(
            0.001,
            ctx.currentTime + idx * 0.13 + 0.32
          );
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.13);
          osc.stop(ctx.currentTime + idx * 0.13 + 0.33);
        });
      }
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
      }
    } catch {
      // ignore audio context restrictions
    }
  };

  const colorThemes = {
    indigo: {
      label: 'بنفسجي',
      bg: 'from-indigo-600 to-purple-500',
      swatch: 'bg-indigo-500',
    },
    emerald: {
      label: 'أخضر',
      bg: 'from-emerald-600 to-teal-500',
      swatch: 'bg-emerald-500',
    },
    sky: {
      label: 'أزرق',
      bg: 'from-sky-500 to-blue-600',
      swatch: 'bg-sky-500',
    },
    amber: {
      label: 'ذهبي',
      bg: 'from-amber-500 to-orange-500',
      swatch: 'bg-amber-500',
    },
    rose: {
      label: 'أحمر وردي',
      bg: 'from-rose-500 to-pink-600',
      swatch: 'bg-rose-500',
    },
    pink: {
      label: 'وردي',
      bg: 'from-pink-400 to-fuchsia-500',
      swatch: 'bg-pink-400',
    },
    lightBrown: {
      label: 'بني فاتح',
      bg: 'from-[#c69c6d] to-[#9c6f44]',
      swatch: 'bg-[#c69c6d]',
    },
  };

  const buildAnimeCharacterAvatar = ({
    bg1,
    bg2,
    hair,
    hairShadow,
    eye,
    outfit,
    accent,
    skin = '#ffeadb',
    accessory = 'headband',
    mask = false,
    aura = false,
  }) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${bg1}"/>
          <stop offset="100%" stop-color="${bg2}"/>
        </linearGradient>
        <radialGradient id="glow" cx="50%" cy="45%" r="50%">
          <stop offset="0%" stop-color="${accent}" stop-opacity="0.45"/>
          <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="hairG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${hair}"/>
          <stop offset="100%" stop-color="${hairShadow}"/>
        </linearGradient>
        <linearGradient id="eyeG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#0f172a"/>
          <stop offset="45%" stop-color="${eye}"/>
          <stop offset="100%" stop-color="#ffffff"/>
        </linearGradient>
      </defs>
      <rect width="120" height="120" rx="26" fill="url(#bg)"/>
      <circle cx="60" cy="56" r="54" fill="url(#glow)"/>
      ${
        aura
          ? `<circle cx="60" cy="58" r="49" fill="none" stroke="${accent}" stroke-width="2.2" stroke-dasharray="7 5" opacity="0.85"/>
             <path d="M16 30 L20 22 L24 30 L16 26 L24 26 Z" fill="${accent}" opacity="0.9"/>
             <path d="M96 26 L100 18 L104 26 L96 22 L104 22 Z" fill="#ffffff" opacity="0.9"/>
             <circle cx="20" cy="86" r="2.5" fill="${accent}" opacity="0.8"/>
             <circle cx="102" cy="82" r="2.5" fill="${accent}" opacity="0.8"/>`
          : `<circle cx="22" cy="26" r="2" fill="#ffffff" opacity="0.5"/>
             <circle cx="98" cy="30" r="2.2" fill="${accent}" opacity="0.65"/>`
      }
      <!-- الشعر الخلفي بطبقات الأنمي -->
      <path d="M14 68 L6 42 L26 42 L16 18 L42 28 L60 6 L78 28 L104 18 L94 42 L114 42 L106 68 L96 92 L24 92 Z" fill="${hairShadow}"/>
      <path d="M18 65 L12 42 L30 43 L22 22 L45 30 L60 11 L75 30 L98 22 L90 43 L108 42 L102 65 Z" fill="url(#hairG)"/>
      <!-- العباءة والدرع القتالي -->
      <path d="M18 120 C22 92 38 84 60 84 C82 84 98 92 102 120 Z" fill="${outfit}" stroke="${accent}" stroke-width="1.8"/>
      <path d="M36 87 L60 112 L84 87" fill="#0f172a" stroke="${accent}" stroke-width="3" stroke-linejoin="round"/>
      <polygon points="60,95 66,103 60,111 54,103" fill="${accent}"/>
      <!-- الأذنان والرقبة والوجه -->
      <ellipse cx="33" cy="58" rx="4.5" ry="7" fill="${skin}"/>
      <ellipse cx="87" cy="58" rx="4.5" ry="7" fill="${skin}"/>
      <rect x="51" y="75" width="18" height="16" rx="7" fill="#f3cbb6"/>
      <path d="M34 45 C34 27 86 27 86 45 C86 68 74 83 60 83 C46 83 34 68 34 45 Z" fill="${skin}"/>
      <!-- تظليل الوجه وخدود الأنمي -->
      <ellipse cx="43" cy="64" rx="5" ry="2.4" fill="#fb7185" opacity="0.35"/>
      <ellipse cx="77" cy="64" rx="5" ry="2.4" fill="#fb7185" opacity="0.35"/>
      <!-- عيون الأنمي الاحترافية -->
      ${
        accessory === 'visor'
          ? `<path d="M35 48 L85 48 L81 61 L60 58 L39 61 Z" fill="${accent}" stroke="#ffffff" stroke-width="1.8"/>
             <path d="M41 52 L57 52" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>`
          : `<path d="M38 51 Q47 47 55 52" fill="none" stroke="#0f172a" stroke-width="3" stroke-linecap="round"/>
             <path d="M65 52 Q73 47 82 51" fill="none" stroke="#0f172a" stroke-width="3" stroke-linecap="round"/>
             <ellipse cx="47" cy="57" rx="6.8" ry="7.8" fill="#0f172a"/>
             <ellipse cx="73" cy="57" rx="6.8" ry="7.8" fill="#0f172a"/>
             <ellipse cx="47" cy="58" rx="5" ry="5.8" fill="url(#eyeG)"/>
             <ellipse cx="73" cy="58" rx="5" ry="5.8" fill="url(#eyeG)"/>
             <circle cx="47" cy="58" r="2.3" fill="#0f172a"/>
             <circle cx="73" cy="58" r="2.3" fill="#0f172a"/>
             <circle cx="44.5" cy="54" r="2.4" fill="#ffffff"/>
             <circle cx="70.5" cy="54" r="2.4" fill="#ffffff"/>
             <circle cx="49.5" cy="60.5" r="1.3" fill="#ffffff"/>
             <circle cx="75.5" cy="60.5" r="1.3" fill="#ffffff"/>
             <path d="M38 45 Q47 42 55 46" fill="none" stroke="${hairShadow}" stroke-width="2.6" stroke-linecap="round"/>
             <path d="M65 46 Q73 42 82 45" fill="none" stroke="${hairShadow}" stroke-width="2.6" stroke-linecap="round"/>`
      }
      <!-- الأنف والفم أو القناع -->
      <path d="M59 62 L61 64" stroke="#d99b82" stroke-width="1.8" stroke-linecap="round"/>
      ${
        mask
          ? `<path d="M35 62 Q60 57 85 62 C83 76 72 84 60 84 C48 84 37 76 35 62 Z" fill="#0f172a" stroke="${accent}" stroke-width="1.8"/>
             <path d="M45 70 L55 72 M75 70 L65 72" stroke="${accent}" stroke-width="2" stroke-linecap="round"/>`
          : `<path d="M53 71 Q60 76 67 70" fill="none" stroke="#9f1239" stroke-width="2.5" stroke-linecap="round"/>
             <path d="M56 72 Q60 74 64 71.5" fill="none" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round"/>`
      }
      <!-- خصلات الشعر الأمامية ولمعة الشعر -->
      <path d="M30 48 L38 26 L46 47 L54 27 L60 49 L67 27 L75 47 L82 26 L90 48 C82 32 38 32 30 48 Z" fill="url(#hairG)"/>
      <path d="M40 28 Q60 22 80 28" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" opacity="0.45"/>
      <!-- الإكسسوارات العلوية -->
      ${
        accessory === 'headband'
          ? `<rect x="33" y="33" width="54" height="9.5" rx="4.5" fill="${accent}" stroke="#0f172a" stroke-width="1.2"/>
             <rect x="47" y="34.8" width="26" height="6" rx="2.5" fill="#f8fafc"/>
             <path d="M56 37.8 L64 37.8 M60 35.8 L60 39.8" stroke="#0f172a" stroke-width="1.5" stroke-linecap="round"/>`
          : accessory === 'crown'
          ? `<path d="M36 31 L43 13 L53 24 L60 9 L67 24 L77 13 L84 31 Z" fill="${accent}" stroke="#ffffff" stroke-width="1.6" stroke-linejoin="round"/>
             <circle cx="60" cy="22" r="3" fill="#ef4444"/>`
          : accessory === 'horns'
          ? `<path d="M34 32 Q18 12 35 6 Q40 20 45 28 Z" fill="${accent}" stroke="#ffffff" stroke-width="1.2"/>
             <path d="M86 32 Q102 12 85 6 Q80 20 75 28 Z" fill="${accent}" stroke="#ffffff" stroke-width="1.2"/>`
          : accessory === 'halo'
          ? `<ellipse cx="60" cy="13" rx="24" ry="5.5" fill="none" stroke="${accent}" stroke-width="3.5"/>
             <ellipse cx="60" cy="13" rx="24" ry="5.5" fill="none" stroke="#ffffff" stroke-width="1.2"/>`
          : ''
      }
    </svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  };

  const RARE_AVATARS_1000 = [
    {
      id: 'char_shinobi',
      name: 'نينجا اللهب',
      avatar: buildAnimeCharacterAvatar({
        bg1: '#7f1d1d',
        bg2: '#ea580c',
        hair: '#1e293b',
        hairShadow: '#0f172a',
        eye: '#ef4444',
        outfit: '#0f172a',
        accent: '#ef4444',
        accessory: 'headband',
      }),
    },
    {
      id: 'char_thunder',
      name: 'بطل البرق',
      avatar: buildAnimeCharacterAvatar({
        bg1: '#1e3a8a',
        bg2: '#0284c7',
        hair: '#facc15',
        hairShadow: '#ca8a04',
        eye: '#38bdf8',
        outfit: '#1e40af',
        accent: '#facc15',
        accessory: 'headband',
      }),
    },
    {
      id: 'char_shadow',
      name: 'صائد الظلال',
      avatar: buildAnimeCharacterAvatar({
        bg1: '#311042',
        bg2: '#4c1d95',
        hair: '#e2e8f0',
        hairShadow: '#94a3b8',
        eye: '#a855f7',
        outfit: '#1e1b4b',
        accent: '#c084fc',
        accessory: 'none',
        mask: true,
      }),
    },
    {
      id: 'char_sakura',
      name: 'محاربة الساكورا',
      avatar: buildAnimeCharacterAvatar({
        bg1: '#831843',
        bg2: '#ec4899',
        hair: '#f472b6',
        hairShadow: '#db2777',
        eye: '#10b981',
        outfit: '#881337',
        accent: '#fde047',
        accessory: 'crown',
      }),
    },
    {
      id: 'char_cyber',
      name: 'ساموراي السايبر',
      avatar: buildAnimeCharacterAvatar({
        bg1: '#0f172a',
        bg2: '#0d9488',
        hair: '#38bdf8',
        hairShadow: '#0284c7',
        eye: '#2dd4bf',
        outfit: '#111827',
        accent: '#2dd4bf',
        accessory: 'visor',
        mask: true,
      }),
    },
    {
      id: 'char_frost',
      name: 'أمير الجليد',
      avatar: buildAnimeCharacterAvatar({
        bg1: '#0c4a6e',
        bg2: '#38bdf8',
        hair: '#f8fafc',
        hairShadow: '#bae6fd',
        eye: '#0284c7',
        outfit: '#0369a1',
        accent: '#7dd3fc',
        accessory: 'crown',
      }),
    },
  ];

  const RARE_AVATARS_2000 = [
    {
      id: 'char_dragon_king',
      name: 'إمبراطور التنين',
      avatar: buildAnimeCharacterAvatar({
        bg1: '#450a0a',
        bg2: '#d97706',
        hair: '#fef08a',
        hairShadow: '#eab308',
        eye: '#f97316',
        outfit: '#7c2d12',
        accent: '#fbbf24',
        accessory: 'horns',
        aura: true,
      }),
    },
    {
      id: 'char_cosmic',
      name: 'حارس المجرة',
      avatar: buildAnimeCharacterAvatar({
        bg1: '#1e1b4b',
        bg2: '#7e22ce',
        hair: '#c084fc',
        hairShadow: '#7e22ce',
        eye: '#38bdf8',
        outfit: '#312e81',
        accent: '#f472b6',
        accessory: 'halo',
        aura: true,
      }),
    },
    {
      id: 'char_mecha',
      name: 'قائد الميكا الخارق',
      avatar: buildAnimeCharacterAvatar({
        bg1: '#111827',
        bg2: '#b45309',
        hair: '#ef4444',
        hairShadow: '#991b1b',
        eye: '#fbbf24',
        outfit: '#1f2937',
        accent: '#fbbf24',
        accessory: 'visor',
        mask: true,
        aura: true,
      }),
    },
    {
      id: 'char_phoenix',
      name: 'أسطورة العنقاء',
      avatar: buildAnimeCharacterAvatar({
        bg1: '#7c2d12',
        bg2: '#ef4444',
        hair: '#fb923c',
        hairShadow: '#c2410c',
        eye: '#fde047',
        outfit: '#881337',
        accent: '#fde047',
        accessory: 'crown',
        aura: true,
      }),
    },
    {
      id: 'char_void',
      name: 'حكيم الأبعاد',
      avatar: buildAnimeCharacterAvatar({
        bg1: '#022c22',
        bg2: '#10b981',
        hair: '#ecfdf5',
        hairShadow: '#6ee7b7',
        eye: '#10b981',
        outfit: '#064e3b',
        accent: '#34d399',
        accessory: 'horns',
        mask: true,
        aura: true,
      }),
    },
    {
      id: 'char_titan',
      name: 'البطل الأسطوري',
      avatar: buildAnimeCharacterAvatar({
        bg1: '#172554',
        bg2: '#4f46e5',
        hair: '#fde047',
        hairShadow: '#ca8a04',
        eye: '#60a5fa',
        outfit: '#1e1b4b',
        accent: '#38bdf8',
        accessory: 'crown',
        aura: true,
      }),
    },
  ];

  const isRareAvatarSelected = [...RARE_AVATARS_1000, ...RARE_AVATARS_2000].some(
    (item) => item.avatar === editAvatar
  );

  useEffect(() => {
    const saved = Number(
      localStorage.getItem('smart_student_font_scale_v2') ||
        (student?.fontScale && student.fontScale !== 100
          ? student.fontScale
          : 110)
    );
    if (saved >= 70 && saved <= 160) {
      const clamped = Math.min(120, Math.max(80, saved));
      document.documentElement.style.setProperty(
        '--app-font-scale',
        String(clamped / 100)
      );
    }
  }, [student?.id, student?.fontScale]);

  const openProfileSettings = () => {
    if (!student) return;
    setEditName(student.name || '');
    setEditCode(student.code || '');
    setEditAvatar(student.avatar || '👨‍🎓');
    setEditProfileColor(student.profileColor || 'indigo');
    setEditVoiceGender(student.voiceGender === 'female' ? 'female' : 'male');
    const currentScale = Number(
      localStorage.getItem('smart_student_font_scale_v2') ||
        (student.fontScale && student.fontScale !== 100
          ? student.fontScale
          : 110)
    );
    setEditFontScale(
      currentScale >= 70 && currentScale <= 160
        ? Math.min(120, Math.max(80, currentScale))
        : 110
    );
    setProfileMsg('');
    setProfileError('');
    setPendingAvatarPurchase(null);
    setIsProfileModalOpen(true);
  };

  const handleSelectRareAvatar = (charItem, cost) => {
    if (!student) return;
    setProfileMsg('');
    setProfileError('');
    const isOwned =
      Array.isArray(student.unlockedAvatars) &&
      student.unlockedAvatars.includes(charItem.avatar);

    if (isOwned) {
      purchaseRareAvatar(student.id, charItem.avatar, cost);
      setEditAvatar(charItem.avatar);
      setProfileMsg(`تم اختيار شخصية «${charItem.name}» بنجاح! ✨`);
      return;
    }

    const currentPoints = Number(student.points) || 0;
    if (currentPoints < cost) {
      setProfileError(
        `🔒 هذا الشكل مقفول! تحتاج إلى ${cost} نقطة لفتحه (رصيدك الحالي: ${currentPoints} نقطة).`
      );
      return;
    }

    setPendingAvatarPurchase({ charItem, cost });
  };

  const confirmRareAvatarPurchase = () => {
    if (!student || !pendingAvatarPurchase) return;
    const { charItem, cost } = pendingAvatarPurchase;
    setPendingAvatarPurchase(null);
    setProfileMsg('');
    setProfileError('');
    const res = purchaseRareAvatar(student.id, charItem.avatar, cost);
    if (res.error) {
      setProfileError(res.error);
      return;
    }
    setEditAvatar(charItem.avatar);
    setProfileMsg(
      `🎉 مبروك! تم فتح شخصية «${charItem.name}» مقابل ${cost} نقطة (المتبقي لك: ${res.remainingPoints} نقطة)`
    );
    confetti({
      particleCount: 45,
      spread: 60,
      origin: { y: 0.7 },
    });
  };

  const handleAvatarFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const resStr = ev.target?.result;
      if (typeof resStr !== 'string') return;
      const img = new window.Image();
      img.onload = () => {
        const size = 240;
        const minSide = Math.min(img.width, img.height);
        const sx = Math.floor((img.width - minSide) / 2);
        const sy = Math.floor((img.height - minSide) / 2);
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
        setEditAvatar(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => setEditAvatar(resStr);
      img.src = resStr;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setProfileMsg('');
    setProfileError('');
    const cleanScale =
      Number(editFontScale) >= 70 && Number(editFontScale) <= 160
        ? Math.min(120, Math.max(80, Number(editFontScale)))
        : 110;
    const res = updateStudentProfile(student.id, {
      name: editName,
      code: editCode,
      avatar: editAvatar,
      profileColor: editProfileColor,
      voiceGender: editVoiceGender,
      fontScale: cleanScale,
    });
    if (res.error) {
      setProfileError(res.error);
      return;
    }
    try {
      localStorage.setItem('smart_student_font_scale_v2', String(cleanScale));
      document.documentElement.style.setProperty(
        '--app-font-scale',
        String(cleanScale / 100)
      );
    } catch {
      // ignore
    }
    setProfileMsg('تم حفظ الإعدادات بنجاح! ✅');
    setTimeout(() => {
      setIsProfileModalOpen(false);
    }, 700);
  };

  if (!student) {
    return (
      <div className="p-6 text-center text-white">
        <p>لم يتم العثور على بيانات الطالب.</p>
        <button onClick={onLogout} className="mt-4 btn-3d-indigo px-4 py-2 rounded-xl">
          العودة للدخول
        </button>
      </div>
    );
  }

  const school = dbState.schools.find((s) => s.id === student.schoolId);
  const stage = dbState.stages.find((st) => st.id === student.stageId);

  // قراءة أحدث قائمة مواد ودروس (5 أسئلة لكل درس) لضمان التحديث الفوري
  const latestDb = getDatabaseState();
  const allSubjects = latestDb.subjects || dbState.subjects;
  const allLessons = latestDb.lessons || dbState.lessons;
  const allStudents = latestDb.students || dbState.students;
  const allRooms = latestDb.rooms || dbState.rooms;

  const stageSubjects = allSubjects.filter(
    (sub) => sub.stageId === student.stageId
  );
  const stageLessons = allLessons.filter(
    (les) => les.stageId === student.stageId
  );
  const stageFriends = allStudents.filter(
    (s) =>
      s.stageId === student.stageId &&
      s.schoolId === student.schoolId &&
      s.status === 'approved' &&
      s.id !== student.id
  );
  const invitedRooms = allRooms.filter(
    (r) =>
      r.status !== 'finished' &&
      r.hostId !== student.id &&
      !dismissedRoomIds.includes(r.id) &&
      r.players.some((p) => p.id === student.id)
  );

  const invitedRoomIdsKey = invitedRooms.map((r) => r.id).join(',');

  useEffect(() => {
    if (!invitedRooms.length) return;
    let hasNewInvite = false;
    invitedRooms.forEach((r) => {
      if (!notifiedRoomIdsRef.current.has(r.id)) {
        notifiedRoomIdsRef.current.add(r.id);
        hasNewInvite = true;
      }
    });
    if (hasNewInvite) {
      playInviteNotificationSound();
      setDismissedRoomIds((prev) =>
        prev.filter((id) => !invitedRooms.some((r) => r.id === id))
      );
    }
  }, [invitedRoomIdsKey]);

  const filteredLessons =
    selectedSubjectId === 'all'
      ? stageLessons
      : stageLessons.filter((l) => l.subjectId === selectedSubjectId);

  const buildCombinedLesson = (subName, subId, lessonsList) => {
    if (!lessonsList || lessonsList.length === 0) return null;
    return {
      id: subId && subId !== 'all' ? `ALL_SUB_${subId}` : 'ALL_LESSONS',
      isCombined: true,
      bundledLessons: lessonsList,
      subjectId: subId || 'all',
      subjectName: subName || 'جميع المواد',
      title: `كل دروس ${subName || 'المادة'} (${lessonsList.length} دروس)`,
      aiSummary: lessonsList
        .map(
          (l, idx) =>
            `📘 الدرس (${idx + 1}) - ${l.title}:\n${l.aiSummary || ''}`
        )
        .join('\n\n'),
      aiKeyPoints: lessonsList.flatMap((l) =>
        (l.aiKeyPoints || []).map((pt) => `[${l.title}] ${pt}`)
      ),
      aiGoldenTip: lessonsList
        .map((l) => l.aiGoldenTip)
        .filter(Boolean)
        .join(' • '),
      aiQuestions: lessonsList.flatMap((l) => l.aiQuestions || []),
      rawText: lessonsList
        .map(
          (l, idx) =>
            `📘 الدرس (${idx + 1}): ${l.title}\n${
              l.rawText || l.aiSummary || ''
            }`
        )
        .join('\n\n────────────────────\n\n'),
    };
  };

  const currentSubjectObj = stageSubjects.find(
    (s) => s.id === selectedSubjectId
  );
  const currentSubjectLabel =
    selectedSubjectId === 'all'
      ? 'جميع المواد'
      : currentSubjectObj?.name || 'المادة';

  const combinedSubjectLesson = buildCombinedLesson(
    currentSubjectLabel,
    selectedSubjectId,
    filteredLessons
  );

  // خيارات الدروس المجمّعة لكل مادة (للامتحان السريع وتحدي الأصدقاء)
  const subjectCombinedLessons = stageSubjects
    .map((sub) => {
      const subLessons = stageLessons.filter((l) => l.subjectId === sub.id);
      if (subLessons.length < 2) return null;
      return buildCombinedLesson(sub.name, sub.id, subLessons);
    })
    .filter(Boolean);

  const allSelectableChallengeItems = [
    ...subjectCombinedLessons,
    ...stageLessons,
  ];

  const normalizeArabicForSearch = (str = '') =>
    String(str)
      .toLowerCase()
      .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
      .replace(/[أإآٱ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .replace(/ؤ/g, 'و')
      .replace(/ئ/g, 'ي')
      .replace(/انكليز/g, 'انجليز')
      .replace(/انكلش/g, 'انجليز')
      .replace(/كليزي/g, 'جليزي')
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const stripLeadingAl = (word = '') =>
    word.startsWith('ال') && word.length > 3 ? word.slice(2) : word;

  const getSemanticSubjectAliases = (item) => {
    const base = normalizeArabicForSearch(item.subjectName || '');
    const aliases = [];
    if (base.includes('اجتماعيات')) {
      aliases.push('اجتماعيات جغرافيا جغرافيه تاريخ وطنيه');
    }
    if (base.includes('علوم')) {
      aliases.push('علوم احياء فيزياء كيمياء');
    }
    if (base.includes('انجليز')) {
      aliases.push('انجليزي انكليزي انكلش english انجليزيه');
    }
    if (base.includes('عربي')) {
      aliases.push('عربي عربيه قواعد قراءه ادب املاء نحو');
    }
    if (base.includes('رياضيات')) {
      aliases.push('رياضيات حساب جبر هندسه');
    }
    if (base.includes('اسلامي')) {
      aliases.push('اسلاميه اسلامي قران حديث فقه');
    }
    return aliases.join(' ');
  };

  const getBigramSimilarity = (a, b) => {
    if (!a || !b) return 0;
    if (a.includes(b) || b.includes(a)) return 0.92;
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

  const filteredSelectableChallengeItems = (() => {
    const cleanQ = normalizeArabicForSearch(lessonSearchQuery);
    if (!cleanQ) return allSelectableChallengeItems;

    const rawTokens = cleanQ
      .split(' ')
      .map((t) => stripLeadingAl(t.trim()))
      .filter(Boolean);
    if (rawTokens.length === 0) return allSelectableChallengeItems;

    // تجاهل الكلمات العامة مثل "اللغة" أو "مادة" أو "درس" عندما يكتب الطالب معها اسم المادة (مثل: اللغة الانكليزية)
    const STOP_WORDS = new Set(['لغه', 'ماده', 'درس', 'دروس', 'كل', 'في', 'عن']);
    const specificTokens = rawTokens.filter((t) => !STOP_WORDS.has(t));
    const queryTokens = specificTokens.length > 0 ? specificTokens : rawTokens;

    // 1. فحص المطابقة المباشرة مع اسم المادة أو مرادفاتها أو عنوان الدرس فقط (بدون إظهار مواد أخرى)
    const directMatches = allSelectableChallengeItems.filter((item) => {
      const subjNorm = normalizeArabicForSearch(
        `${item.subjectName || ''} ${getSemanticSubjectAliases(item)}`
      );
      const subjWords = subjNorm.split(' ').map(stripLeadingAl).filter(Boolean);

      const titleNorm = normalizeArabicForSearch(item.title || '');
      const titleWords = titleNorm
        .split(' ')
        .map(stripLeadingAl)
        .filter((w) => !STOP_WORDS.has(w));

      return queryTokens.every(
        (qTok) =>
          subjWords.some((sw) => sw.includes(qTok) || qTok.includes(sw)) ||
          titleWords.some((tw) => tw.includes(qTok) || qTok.includes(tw))
      );
    });

    if (directMatches.length > 0) {
      return directMatches;
    }

    // 2. إذا كتب الطالب أكثر من كلمة (مثل: اجتماعيات جغرافيا) ولم تتطابق كل الكلمات معاً، نطابق المادة المحددة أولاً
    const subjectOnlyMatches = allSelectableChallengeItems.filter((item) => {
      const subjNorm = normalizeArabicForSearch(
        `${item.subjectName || ''} ${getSemanticSubjectAliases(item)}`
      );
      const subjWords = subjNorm.split(' ').map(stripLeadingAl).filter(Boolean);
      return queryTokens.some((qTok) =>
        subjWords.some((sw) => sw.includes(qTok) || qTok.includes(sw))
      );
    });

    if (subjectOnlyMatches.length > 0) {
      return subjectOnlyMatches;
    }

    // 3. في حال عدم وجود تطابق مباشر (مثلاً خطأ إملائي بسيط)، نعرض فقط أقرب مادة أو درس شبيه بدون إظهار بقية المواد
    const fuzzyScored = allSelectableChallengeItems.map((item) => {
      const targetWords = normalizeArabicForSearch(
        `${item.subjectName || ''} ${item.title || ''} ${getSemanticSubjectAliases(
          item
        )}`
      )
        .split(' ')
        .map(stripLeadingAl)
        .filter((w) => w && !STOP_WORDS.has(w));

      let bestScore = 0;
      for (const qTok of queryTokens) {
        let maxWordSim = 0;
        for (const tw of targetWords) {
          const sim = getBigramSimilarity(qTok, tw);
          if (sim > maxWordSim) maxWordSim = sim;
        }
        bestScore += maxWordSim;
      }
      const avgSim = bestScore / queryTokens.length;
      return { item, avgSim };
    });

    const maxSim = Math.max(...fuzzyScored.map((e) => e.avgSim), 0);
    if (maxSim < 0.45) return [];

    // نأخذ فقط العناصر التي تقترب جداً من أعلى نسبة تشابه (أقرب مادة أو درس فقط)
    return fuzzyScored
      .filter((e) => e.avgSim >= Math.max(0.45, maxSim - 0.08))
      .sort((a, b) => b.avgSim - a.avgSim)
      .slice(0, 4)
      .map((e) => e.item);
  })();

  const activeLesson =
    activeLessonId === 'ALL_LESSONS' && combinedSubjectLesson
      ? combinedSubjectLesson
      : filteredLessons.find((l) => l.id === activeLessonId) ||
        filteredLessons[0] ||
        null;

  const activeRoom = allRooms.find((r) => r.id === activeRoomId) || null;
  const allPlayersAnswered =
    activeRoom?.status === 'playing' &&
    activeRoom.players.every(
      (p) => p.isBot || p.lastAnsweredQuestion >= activeRoom.currentQuestionIndex
    );

  // عداد الـ 30 ثانية لانتظار قبول الأصدقاء للدعوة (محمي من فرق توقيت الأجهزة)
  useEffect(() => {
    if (
      !activeRoom ||
      activeRoom.status !== 'waiting' ||
      !activeRoom.inviteStartedAt
    ) {
      setLobbyTimeLeft(30);
      return;
    }

    setLobbyTimeLeft(30);
    const interval = setInterval(() => {
      setLobbyTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (activeRoom.hostId === student.id) {
            const latestRoom = (getDatabaseState().rooms || []).find(
              (rm) => rm.id === activeRoom.id
            );
            if (latestRoom && latestRoom.status === 'waiting') {
              const acceptedPlayers = (latestRoom.players || []).filter(
                (p) => p.hasAccepted !== false
              );
              if (acceptedPlayers.length >= 2) {
                startChallengeGame(latestRoom.id);
              } else {
                cancelChallengeRoom(latestRoom.id);
                setActiveRoomId(null);
                setRoomError(
                  'انتهى وقت الانتظار (30 ثانية) ولم يقبل أحد الدعوة، تم إلغاء المسابقة.'
                );
              }
            }
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activeRoom?.id, activeRoom?.status, activeRoom?.inviteStartedAt, student.id]);

  useEffect(() => {
    if (!activeRoom || activeRoom.status !== 'playing') return;
    setMyRoomAnswer(null);
    setTimeLeft(15);

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeRoom?.status, activeRoom?.currentQuestionIndex]);

  useEffect(() => {
    if (!activeRoom || activeRoom.status !== 'playing') return;
    if (!allPlayersAnswered && timeLeft > 0) return;

    const currentIdx = activeRoom.currentQuestionIndex;
    const totalQ = activeRoom.questions?.length || 0;
    const timer = setTimeout(() => {
      if (currentIdx + 1 >= totalQ) {
        triggerCelebration();
      }
      advanceOrFinishChallengeRoom(activeRoom.id, currentIdx);
    }, 1300);

    return () => clearTimeout(timer);
  }, [
    activeRoom?.id,
    activeRoom?.status,
    activeRoom?.currentQuestionIndex,
    allPlayersAnswered,
    timeLeft,
  ]);

  const triggerCelebration = () => {
    try {
      confetti({
        particleCount: 70,
        spread: 65,
        origin: { y: 0.6 },
      });
    } catch (e) {
      // ignore
    }
  };

  if (student.status === 'none' || student.status === 'rejected') {
    const stagesForPickedSchool = dbState.stages.filter(
      (st) => st.schoolId === pickedSchoolId
    );

    const handleJoinSubmit = (e) => {
      e.preventDefault();
      if (!pickedSchoolId || !pickedStageId) return;
      requestStudentJoinSchoolStage(student.id, pickedSchoolId, pickedStageId);
    };

    return (
      <div className="flex flex-col min-h-full bg-slate-950 text-white p-5 justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
            <div>
              <h1 className="text-base font-black text-white">
                أهلاً بك يا {student.name} 👋
              </h1>
              <p className="text-xs text-indigo-300 font-semibold">
                اختر مدرستك ومرحلتك الدراسية للانضمام
              </p>
            </div>
            <button
              onClick={onLogout}
              className="bg-slate-800 text-slate-300 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer"
            >
              خروج
            </button>
          </div>

          {student.status === 'rejected' && (
            <div className="bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs font-bold p-3 rounded-2xl mb-4">
              ⚠️ تم رفض طلب الانضمام السابق. يرجى التأكد من اختيار مدرستك ومرحلتك الصحيحة وإعادة الطلب.
            </div>
          )}

          <form
            onSubmit={handleJoinSubmit}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-4 shadow-xl"
          >
            <div>
              <label className="block text-xs font-black text-amber-300 mb-2 flex items-center gap-1.5">
                <Building2 className="w-4 h-4" />
                <span>1. اختر مدرستك:</span>
              </label>
              <div className="space-y-2">
                {dbState.schools.map((sch) => (
                  <div
                    key={sch.id}
                    onClick={() => {
                      setPickedSchoolId(sch.id);
                      setPickedStageId('');
                    }}
                    className={`p-3 rounded-2xl border cursor-pointer flex items-center justify-between transition ${
                      pickedSchoolId === sch.id
                        ? 'bg-amber-500/15 border-amber-400 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-xs font-bold">🏫 {sch.name}</span>
                    {pickedSchoolId === sch.id && (
                      <CheckCircle2 className="w-4 h-4 text-amber-400" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {pickedSchoolId && (
              <div>
                <label className="block text-xs font-black text-indigo-300 mb-2 flex items-center gap-1.5">
                  <Layers className="w-4 h-4" />
                  <span>2. اختر المرحلة الدراسية:</span>
                </label>
                {stagesForPickedSchool.length === 0 ? (
                  <p className="text-xs text-slate-500 bg-slate-950 p-3 rounded-xl">
                    لا توجد مراحل مفتوحة في هذه المدرسة حالياً.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {stagesForPickedSchool.map((stg) => (
                      <div
                        key={stg.id}
                        onClick={() => setPickedStageId(stg.id)}
                        className={`p-3 rounded-2xl border cursor-pointer flex items-center justify-between transition ${
                          pickedStageId === stg.id
                            ? 'bg-indigo-600/25 border-indigo-400 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <span className="text-xs font-bold">🎓 {stg.name}</span>
                        {pickedStageId === stg.id && (
                          <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {pickedSchoolId && pickedStageId && (
              <button
                type="submit"
                className="w-full btn-3d-indigo py-3.5 rounded-2xl text-xs font-black text-white flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>إنشاء الحساب وإرسال الطلب 🚀</span>
              </button>
            )}
          </form>
        </div>

        <p className="text-[11px] text-center text-slate-500 mt-4">
          بعد إرسال الطلب، سيقوم مدير النظام بالموافقة لتفتح لك دروس ومسابقات مرحلتك.
        </p>
      </div>
    );
  }

  if (student.status === 'pending') {
    return (
      <div className="flex flex-col min-h-full bg-slate-950 text-white p-5 justify-between">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <span className="text-xs font-bold text-slate-300">👨‍🎓 {student.name}</span>
          <button
            onClick={onLogout}
            className="bg-slate-800 text-slate-300 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer"
          >
            خروج
          </button>
        </div>

        <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-6 text-center space-y-4 my-auto shadow-2xl">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto animate-pulse">
            <Clock className="w-8 h-8" />
          </div>
          <h2 className="text-base font-black text-white">
            طلب انضمامك قيد المراجعة! ⏳
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            تم إرسال طلب انضمامك إلى مدير النظام. بمجرد موافقته ستفتح لك جميع الدروس الذكية والمسابقات تلقائياً!
          </p>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 text-right space-y-1 text-xs">
            <p className="text-slate-400">
              🏫 المدرسة المختارة:{' '}
              <span className="text-amber-300 font-bold">{school?.name}</span>
            </p>
            <p className="text-slate-400">
              🎓 المرحلة الدراسية:{' '}
              <span className="text-indigo-300 font-bold">{stage?.name}</span>
            </p>
          </div>

          <div className="pt-2 border-t border-slate-800 space-y-2">
            <button
              onClick={() => updateStudentJoinStatus(student.id, 'approved')}
              className="w-full bg-emerald-950/90 hover:bg-emerald-900 border border-emerald-600/50 text-emerald-200 py-2.5 px-3 rounded-xl text-[11px] font-bold cursor-pointer transition"
            >
              ⚡ محاكاة موافقة مدير النظام الفورية (للتجربة بالمعرض)
            </button>
            <button
              onClick={() => updateStudentJoinStatus(student.id, 'none')}
              className="w-full text-slate-400 hover:text-white text-[11px] py-1 cursor-pointer"
            >
              تغيير المدرسة أو المرحلة
            </button>
          </div>
        </div>

        <div className="text-center text-[11px] text-slate-500">
          مساعد الطالب الذكي • تحديث لحظي مباشر
        </div>
      </div>
    );
  }

  const shuffleLessonQuestions = (questions = []) =>
    questions.map((q) => {
      const correctOptionText = q.options[q.correctIndex];
      const shuffledOptions = [...q.options];
      for (let i = shuffledOptions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledOptions[i], shuffledOptions[j]] = [
          shuffledOptions[j],
          shuffledOptions[i],
        ];
      }
      return {
        ...q,
        options: shuffledOptions,
        correctIndex: shuffledOptions.indexOf(correctOptionText),
      };
    });

  const handleStartQuickQuiz = (lesson) => {
    setQuizLesson({
      ...lesson,
      aiQuestions: shuffleLessonQuestions(lesson.aiQuestions || []),
    });
    setQuizIndex(0);
    setSelectedOption(null);
    setQuizScore(0);
    setQuizFinished(false);
    setChallengeSubTab('self');
    setActiveTab('gamemode');
  };

  const handleSelectQuizOption = (idx) => {
    if (selectedOption !== null) return;
    setSelectedOption(idx);
    const currentQ = quizLesson.aiQuestions[quizIndex];
    if (idx === currentQ.correctIndex) {
      setQuizScore((prev) => prev + 1);
    }
  };

  const handleNextQuizQuestion = () => {
    if (quizIndex + 1 < quizLesson.aiQuestions.length) {
      setQuizIndex((prev) => prev + 1);
      setSelectedOption(null);
    } else {
      setQuizFinished(true);
      addPointsToStudent(student.id, quizScore * 4, false, true);
      triggerCelebration();
    }
  };

  const activeVoiceGender =
    (isProfileModalOpen ? editVoiceGender : student?.voiceGender) === 'female'
      ? 'female'
      : 'male';

  const sendMessageToGemini = async (textToSend) => {
    const cleanQ = (textToSend || '').trim();
    if (!cleanQ || !activeLesson || isAskingTutor) return;

    const updatedHistory = [...tutorChat, { sender: 'student', text: cleanQ }];
    setTutorQuestion('');
    setTutorChat(updatedHistory);
    setIsAskingTutor(true);

    try {
      const answer = await askSmartTutor({
        question: cleanQ,
        lesson: activeLesson,
        chatHistory: updatedHistory,
      });
      setTutorChat((prev) => [...prev, { sender: 'ai', text: answer }]);
      // تجهيز المقطع الأول من الصوت الجميل بالخلفية فوراً ليعمل زر استماع بأقصى سرعة
      prefetchGeminiSpeechSegments(answer, activeVoiceGender).catch(() => {});
    } finally {
      setIsAskingTutor(false);
    }
  };

  useEffect(() => {
    const lastAiMsg = [...tutorChat]
      .reverse()
      .find((m) => m.sender === 'ai');
    if (lastAiMsg?.text) {
      prefetchGeminiSpeechSegments(lastAiMsg.text, activeVoiceGender).catch(
        () => {}
      );
    }
  }, [activeVoiceGender]);

  const handleAskTutor = (e) => {
    e.preventDefault();
    sendMessageToGemini(tutorQuestion);
  };

  const stopCurrentSpeech = () => {
    speechSessionIdRef.current += 1;
    speakingKeyRef.current = null;
    if (speechWatchdogRef.current) {
      clearInterval(speechWatchdogRef.current);
      speechWatchdogRef.current = null;
    }
    try {
      if (activeBufferSourceRef.current) {
        activeBufferSourceRef.current.onended = null;
        try {
          activeBufferSourceRef.current.stop();
        } catch {
          // ignore
        }
        try {
          activeBufferSourceRef.current.disconnect();
        } catch {
          // ignore
        }
        activeBufferSourceRef.current = null;
      }
      if (activeUtteranceRef.current) {
        activeUtteranceRef.current.onend = null;
        activeUtteranceRef.current.onerror = null;
        activeUtteranceRef.current = null;
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (activeSpeechAudioRef.current) {
        activeSpeechAudioRef.current.onended = null;
        activeSpeechAudioRef.current.onerror = null;
        activeSpeechAudioRef.current.loop = false;
        activeSpeechAudioRef.current.pause();
        activeSpeechAudioRef.current.currentTime = 0;
        activeSpeechAudioRef.current = null;
      }
    } catch {
      // ignore
    }
    setSpeakingMsgKey(null);
  };

  const handleSpeakText = async (text, msgKey = 'default') => {
    try {
      // إذا كان هذا النص قيد القراءة حالياً وتم الضغط على الزر مرة أخرى -> إيقاف فوري
      if (speakingKeyRef.current === msgKey || speakingMsgKey === msgKey) {
        stopCurrentSpeech();
        return;
      }

      stopCurrentSpeech();

      const segments = splitTextIntoSpeechSegments(text);
      if (segments.length === 0) return;

      const voiceGender = activeVoiceGender;
      const mySessionId = speechSessionIdRef.current;

      speakingKeyRef.current = msgKey;
      setSpeakingMsgKey(msgKey);

      // فتح وتفعيل قناة الصوت متزامناً مع لمسة المستخدم على الآيباد (AudioContext + Looping Silent Audio)
      let audioCtx = speechAudioCtxRef.current;
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          if (!audioCtx || audioCtx.state === 'closed') {
            audioCtx = new AudioCtx();
            speechAudioCtxRef.current = audioCtx;
          }
          if (audioCtx.state === 'suspended') {
            audioCtx.resume().catch(() => {});
          }
          // تشغيل نبضة صامتة قصيرة لفتح صلاحية الصوت نهائياً على iPadOS Safari
          const silentBuf = audioCtx.createBuffer(1, 1, 24000);
          const silentSrc = audioCtx.createBufferSource();
          silentSrc.buffer = silentBuf;
          silentSrc.connect(audioCtx.destination);
          silentSrc.start(0);
        }
      } catch {
        // ignore
      }

      const unlockedAudio = new window.Audio(
        'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA'
      );
      unlockedAudio.loop = true;
      unlockedAudio.volume = 0;
      activeSpeechAudioRef.current = unlockedAudio;
      unlockedAudio.play().catch(() => {});

      const playSinglePayload = (payload) =>
        new Promise((resolve, reject) => {
          if (mySessionId !== speechSessionIdRef.current) {
            resolve();
            return;
          }

          // 1. التشغيل عبر Web Audio API (لا ينحظر أبداً على الآيباد حتى بعد الانتظار الشبكي)
          if (audioCtx && payload?.wavBuffer) {
            try {
              const bufferCopy = payload.wavBuffer.slice(0);
              audioCtx.decodeAudioData(
                bufferCopy,
                (decodedBuffer) => {
                  if (mySessionId !== speechSessionIdRef.current) {
                    resolve();
                    return;
                  }
                  try {
                    if (unlockedAudio) {
                      unlockedAudio.loop = false;
                      unlockedAudio.pause();
                    }
                    const source = audioCtx.createBufferSource();
                    source.buffer = decodedBuffer;
                    source.connect(audioCtx.destination);
                    activeBufferSourceRef.current = source;
                    source.onended = () => {
                      if (activeBufferSourceRef.current === source) {
                        activeBufferSourceRef.current = null;
                      }
                      resolve();
                    };
                    source.start(0);
                  } catch (playErr) {
                    reject(playErr);
                  }
                },
                (decodeErr) => {
                  reject(decodeErr);
                }
              );
              return;
            } catch {
              // المتابعة للتشغيل عبر HTMLAudioElement
            }
          }

          // 2. التشغيل عبر عنصر الصوت المفتوح مسبقاً
          if (payload?.audioUrl) {
            unlockedAudio.loop = false;
            unlockedAudio.volume = 1.0;
            unlockedAudio.src = payload.audioUrl;
            unlockedAudio.onended = () => resolve();
            unlockedAudio.onerror = (e) => reject(e);
            unlockedAudio.play().catch((e) => reject(e));
            return;
          }

          reject(new Error('No audio payload'));
        });

      let playedAnySegment = false;

      for (let idx = 0; idx < segments.length; idx++) {
        if (mySessionId !== speechSessionIdRef.current) return;

        // تجهيز المقطع التالي في الخلفية بالتوازي أثناء جلب أو قراءة المقطع الحالي
        if (idx + 1 < segments.length) {
          generateGeminiArabicSpeechPayload(
            segments[idx + 1],
            voiceGender
          ).catch(() => {});
        }

        const payload = await generateGeminiArabicSpeechPayload(
          segments[idx],
          voiceGender
        );

        if (mySessionId !== speechSessionIdRef.current) return;

        if (!payload) {
          break;
        }

        playedAnySegment = true;
        await playSinglePayload(payload);
      }

      if (mySessionId !== speechSessionIdRef.current) return;

      // في حال انتهاء جميع المقاطع بنجاح، نعيد الزر إلى (استماع)
      if (playedAnySegment) {
        stopCurrentSpeech();
        return;
      }

      // احتياطي فقط في حال عدم توفر اتصال بـ Gemini
      stopCurrentSpeech();
    } catch (e) {
      stopCurrentSpeech();
    }
  };

  const handleCreateRoom = () => {
    setRoomError('');
    const targetLesson =
      allSelectableChallengeItems.find((l) => l.id === selectedRoomLessonId) ||
      stageLessons[0];
    if (!targetLesson) {
      setRoomError('لا توجد دروس مرفوعة في مرحلتك بعد لإنشاء مسابقة!');
      return;
    }
    if (selectedChallengeTier === 'champions' && (student.points || 0) < 100) {
      setRoomError(
        'بطولة النخبة تتطلب رصيد 100 نقطة على الأقل! العب التحدي القياسي أو الاختبارات السريعة لتجمع النقاط أولاً.'
      );
      return;
    }
    const created = createChallengeRoom({
      hostStudent: student,
      lesson: targetLesson,
      challengeTier: selectedChallengeTier,
    });
    setShowInviteFriendsList(false);
    setActiveRoomId(created.id);
  };

  const handleTriggerStartGame = (roomId) => {
    const latestRoom =
      (getDatabaseState().rooms || []).find((rm) => rm.id === roomId) ||
      activeRoom;
    if (!latestRoom || (latestRoom.players || []).length < 2) {
      setNoInviteWarningModal(true);
      return;
    }

    setCountdown(3);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          startChallengeGame(roomId);
          return null;
        }
        return prev - 1;
      });
    }, 800);
  };

  const handleAnswerInRoom = (optionIdx) => {
    if (!activeRoom || myRoomAnswer !== null) return;
    setMyRoomAnswer(optionIdx);
    const currentQ = activeRoom.questions[activeRoom.currentQuestionIndex];
    const isCorrect = optionIdx === currentQ.correctIndex;
    submitPlayerRoomAnswer({
      roomId: activeRoom.id,
      playerId: student.id,
      questionIndex: activeRoom.currentQuestionIndex,
      isCorrect,
      timeRemainingSec: timeLeft,
    });
  };

  const createBlobUrlFromDataUrl = (dataUrl, fallbackMime = 'application/octet-stream') => {
    try {
      if (!dataUrl || typeof dataUrl !== 'string') return '';
      if (!dataUrl.startsWith('data:')) return dataUrl;
      const parts = dataUrl.split(',');
      const meta = parts[0] || '';
      const base64 = parts[1] || '';
      const mimeMatch = meta.match(/data:([^;]+)/);
      const mimeType = mimeMatch ? mimeMatch[1] : fallbackMime;
      const binaryStr = window.atob(base64);
      const len = binaryStr.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: mimeType });
      return URL.createObjectURL(blob);
    } catch {
      return dataUrl;
    }
  };

  const handleOpenMediaFile = ({ dataUrl, type, title, fileName }) => {
    if (!dataUrl) return;
    const fallbackMime = type === 'pdf' ? 'application/pdf' : 'image/jpeg';
    const blobUrl = createBlobUrlFromDataUrl(dataUrl, fallbackMime);
    setMediaPreviewModal({
      type,
      dataUrl,
      blobUrl,
      title: title || 'مادة الدرس',
      fileName:
        fileName || `${title || 'ملف_الدرس'}.${type === 'pdf' ? 'pdf' : 'jpg'}`,
    });
  };

  const handleDownloadMediaFile = ({ dataUrl, type, title, fileName }) => {
    if (!dataUrl) return;
    const fallbackMime = type === 'pdf' ? 'application/pdf' : 'image/jpeg';
    const blobUrl = createBlobUrlFromDataUrl(dataUrl, fallbackMime);
    const defaultExt = type === 'pdf' ? 'pdf' : 'jpg';
    const cleanFileName =
      fileName && fileName.includes('.')
        ? fileName
        : `${title || 'مادة_الدرس'}.${defaultExt}`;
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = cleanFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-slate-950 text-white justify-between relative">
      {/* نافذة معاينة وتحميل الصورة أو ملف الـ PDF بملء الشاشة */}
      {mediaPreviewModal && (
        <div
          onClick={() => setMediaPreviewModal(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-4 text-white space-y-3 shadow-2xl flex flex-col max-h-[90vh]"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h3 className="text-xs font-black text-amber-300 truncate">
                {mediaPreviewModal.type === 'pdf' ? '📄 ' : '🖼️ '}
                {mediaPreviewModal.title}
              </h3>
              <button
                type="button"
                onClick={() => setMediaPreviewModal(null)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-auto bg-slate-950 rounded-2xl p-2 flex items-center justify-center min-h-[260px]">
              {mediaPreviewModal.type === 'image' ? (
                <img
                  src={mediaPreviewModal.blobUrl || mediaPreviewModal.dataUrl}
                  alt={mediaPreviewModal.title}
                  className="max-w-full max-h-[65vh] object-contain rounded-xl"
                />
              ) : (
                <iframe
                  src={mediaPreviewModal.blobUrl || mediaPreviewModal.dataUrl}
                  title={mediaPreviewModal.title}
                  className="w-full h-[60vh] rounded-xl bg-white"
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <a
                href={mediaPreviewModal.blobUrl || mediaPreviewModal.dataUrl}
                target="_blank"
                rel="noreferrer"
                className="bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl text-xs font-black text-center cursor-pointer transition"
              >
                ↗️ فتح في نافذة مستقلة
              </a>
              <button
                type="button"
                onClick={() =>
                  handleDownloadMediaFile({
                    dataUrl: mediaPreviewModal.dataUrl,
                    type: mediaPreviewModal.type,
                    title: mediaPreviewModal.title,
                    fileName: mediaPreviewModal.fileName,
                  })
                }
                className="bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl text-xs font-black cursor-pointer transition"
              >
                ⬇️ تحميل الملف للجهاز
              </button>
            </div>
          </div>
        </div>
      )}

      {/* نافذة إعدادات الطالب (مستطيل أقصر قابل للسحب للأعلى لإظهار الأسفل) */}
      {isProfileModalOpen && (
        <div
          onClick={() => setIsProfileModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-slate-700 rounded-3xl max-w-sm w-full max-h-[58vh] flex flex-col overflow-hidden p-4 text-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 shrink-0">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-400" />
                <h2 className="text-sm font-black">الإعدادات</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-amber-500/20 border border-amber-500/40 text-amber-300 px-2.5 py-1 rounded-xl text-[11px] font-black">
                  💎 {student.points || 0} نقطة
                </span>
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scroll pt-3 pr-0.5 space-y-3.5">
              {profileMsg && (
                <div className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 text-xs font-bold p-3 rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{profileMsg}</span>
                </div>
              )}

              {profileError && (
                <div className="bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs font-bold p-3 rounded-xl">
                  ⚠️ {profileError}
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-3.5">
              {/* تغيير الصورة */}
              <div className="flex flex-col items-center gap-2">
                <div
                  className={`w-20 h-20 min-w-[80px] min-h-[80px] aspect-square shrink-0 rounded-3xl bg-gradient-to-tr ${
                    colorThemes[editProfileColor]?.bg || colorThemes.indigo.bg
                  } flex items-center justify-center text-3xl shadow-lg overflow-hidden border-2 border-white/20`}
                >
                  {editAvatar?.startsWith('data:image') ? (
                    <img
                      src={editAvatar}
                      alt="الصورة الشخصية"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{editAvatar || '👨‍🎓'}</span>
                  )}
                </div>

                <label className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-indigo-300 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition">
                  <Camera className="w-3.5 h-3.5" />
                  <span>تغيير صورتك من الجهاز</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFileChange}
                    className="hidden"
                  />
                </label>

                {/* الإيموجيات العادية في مكانها الأصلي فوق */}
                <div className="flex flex-wrap justify-center gap-1.5 pt-1">
                  {[
                    '👨‍🎓',
                    '👩‍🎓',
                    '⭐',
                    '🏊‍♂️',
                    '📚',
                    '🏫',
                    '🤖',
                    '🦁',
                    '👑',
                    '🦸‍♂️',
                    '🦸‍♀️',
                    '🧑‍🚀',
                    '🚀',
                    '🏆',
                  ].map((emo) => (
                    <button
                      type="button"
                      key={emo}
                      onClick={() => setEditAvatar(emo)}
                      className={`w-8 h-8 rounded-xl text-sm flex items-center justify-center cursor-pointer border transition ${
                        editAvatar === emo
                          ? 'bg-indigo-600/30 border-indigo-400 scale-105'
                          : 'bg-slate-950 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      {emo}
                    </button>
                  ))}
                </div>

                {/* شخصيات الأنمي والأبطال النادرة بالأسفل مع مسافة فاصلة وقفل يحيط بالشخصية */}
                <div className="flex flex-wrap justify-center gap-1.5 mt-3 pt-1">
                  {RARE_AVATARS_1000.map((charItem) => {
                    const isOwned =
                      Array.isArray(student.unlockedAvatars) &&
                      student.unlockedAvatars.includes(charItem.avatar);
                    const canAfford = (Number(student.points) || 0) >= 1000;
                    const isLocked = !isOwned && !canAfford;
                    const isSelected = editAvatar === charItem.avatar;
                    return (
                      <button
                        type="button"
                        key={charItem.id}
                        onClick={() => handleSelectRareAvatar(charItem, 1000)}
                        title={
                          isOwned
                            ? `${charItem.name} (مفتوح لديك)`
                            : isLocked
                            ? `${charItem.name} (1000 نقطة)`
                            : `فتح ${charItem.name} مقابل 1000 نقطة`
                        }
                        className={`relative w-8 h-8 rounded-xl text-sm flex items-center justify-center cursor-pointer border overflow-hidden transition ${
                          isSelected
                            ? 'bg-indigo-600/30 border-indigo-400 scale-105 ring-2 ring-indigo-400'
                            : 'bg-slate-950 border-slate-800 hover:bg-slate-800'
                        }`}
                      >
                        <img
                          src={charItem.avatar}
                          alt={charItem.name}
                          className={`w-full h-full object-cover ${
                            isLocked ? 'opacity-50 scale-95' : ''
                          }`}
                        />
                        {isLocked && (
                          <span className="absolute inset-0 rounded-xl border-2 border-amber-500/80 bg-slate-950/55 flex items-center justify-center shadow-inner">
                            <span className="text-[13px] leading-none drop-shadow">
                              🔒
                            </span>
                          </span>
                        )}
                      </button>
                    );
                  })}

                  {RARE_AVATARS_2000.map((charItem) => {
                    const isOwned =
                      Array.isArray(student.unlockedAvatars) &&
                      student.unlockedAvatars.includes(charItem.avatar);
                    const canAfford = (Number(student.points) || 0) >= 2000;
                    const isLocked = !isOwned && !canAfford;
                    const isSelected = editAvatar === charItem.avatar;
                    return (
                      <button
                        type="button"
                        key={charItem.id}
                        onClick={() => handleSelectRareAvatar(charItem, 2000)}
                        title={
                          isOwned
                            ? `${charItem.name} (مفتوح لديك)`
                            : isLocked
                            ? `${charItem.name} (2000 نقطة)`
                            : `فتح ${charItem.name} مقابل 2000 نقطة`
                        }
                        className={`relative w-8 h-8 rounded-xl text-sm flex items-center justify-center cursor-pointer border overflow-hidden transition ${
                          isSelected
                            ? 'bg-indigo-600/30 border-indigo-400 scale-105 ring-2 ring-indigo-400'
                            : 'bg-slate-950 border-slate-800 hover:bg-slate-800'
                        }`}
                      >
                        <img
                          src={charItem.avatar}
                          alt={charItem.name}
                          className={`w-full h-full object-cover ${
                            isLocked ? 'opacity-50 scale-95' : ''
                          }`}
                        />
                        {isLocked && (
                          <span className="absolute inset-0 rounded-xl border-2 border-amber-500/80 bg-slate-950/55 flex items-center justify-center shadow-inner">
                            <span className="text-[13px] leading-none drop-shadow">
                              🔒
                            </span>
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* تغيير اللون (متاح للشخصيات العادية ومعطل للشخصيات النادرة) */}
              <div
                className={`bg-slate-950/90 border border-slate-800 rounded-2xl p-3 transition ${
                  isRareAvatarSelected ? 'opacity-45 select-none' : ''
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-300 shrink-0">
                    تغيير اللون:
                  </span>
                  <div className="flex flex-wrap items-center justify-end gap-1.5">
                    {Object.entries(colorThemes).map(([key, item]) => (
                      <button
                        type="button"
                        key={key}
                        disabled={isRareAvatarSelected}
                        onClick={() => {
                          if (!isRareAvatarSelected) {
                            setEditProfileColor(key);
                          }
                        }}
                        title={
                          isRareAvatarSelected
                            ? 'الشخصيات النادرة لها ألوانها الخاصة'
                            : item.label
                        }
                        className={`w-6 h-6 rounded-full ${item.swatch} transition ${
                          isRareAvatarSelected
                            ? 'cursor-not-allowed opacity-40'
                            : editProfileColor === key
                            ? 'ring-2 ring-white scale-110 cursor-pointer'
                            : 'opacity-60 hover:opacity-100 cursor-pointer'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* تغيير الصوت (صوت معلم بالأزرق / صوت معلمة بالوردي) */}
              <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>تغيير الصوت:</span>
                  </span>
                  <span
                    className={`text-[10px] font-bold ${
                      editVoiceGender === 'female'
                        ? 'text-pink-400'
                        : 'text-sky-400'
                    }`}
                  >
                    {editVoiceGender === 'female'
                      ? 'صوت معلمة 👩‍🏫'
                      : 'صوت معلم 👨‍🏫'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      stopCurrentSpeech();
                      setEditVoiceGender('male');
                      updateStudentVoiceGender(student.id, 'male');
                      setProfileMsg('تم اختيار «صوت معلم» للمساعد الذكي! 👨‍🏫🔊');
                    }}
                    className={`py-2.5 px-3 rounded-xl text-xs font-black border flex items-center justify-center gap-1.5 cursor-pointer transition ${
                      editVoiceGender !== 'female'
                        ? 'bg-sky-600 border-sky-400 text-white shadow-md shadow-sky-500/30'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <span>👨‍🏫</span>
                    <span>صوت معلم</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      stopCurrentSpeech();
                      setEditVoiceGender('female');
                      updateStudentVoiceGender(student.id, 'female');
                      setProfileMsg('تم اختيار «صوت معلمة» للمساعد الذكي! 👩‍🏫🔊');
                    }}
                    className={`py-2.5 px-3 rounded-xl text-xs font-black border flex items-center justify-center gap-1.5 cursor-pointer transition ${
                      editVoiceGender === 'female'
                        ? 'bg-pink-500 border-pink-300 text-white shadow-md shadow-pink-500/30'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <span>👩‍🏫</span>
                    <span>صوت معلمة</span>
                  </button>
                </div>
              </div>

              {/* تغيير حجم الخط (المعاينة تتغير على الجملة فقط، ويتطبق على كل المشروع عند الضغط على حفظ التغييرات) */}
              <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">
                    تغيير حجم الخط:
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-indigo-300">
                      {editFontScale}%
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditFontScale(110);
                        updateStudentProfile(student.id, {
                          name: editName || student.name,
                          code: editCode || student.code,
                          avatar: editAvatar || student.avatar,
                          profileColor: editProfileColor || student.profileColor,
                          voiceGender: editVoiceGender || student.voiceGender,
                          fontScale: 110,
                        });
                        try {
                          localStorage.setItem(
                            'smart_student_font_scale_v2',
                            '110'
                          );
                          document.documentElement.style.setProperty(
                            '--app-font-scale',
                            '1.1'
                          );
                        } catch {
                          // ignore
                        }
                      }}
                      className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 px-2.5 py-0.5 rounded-lg text-[10px] font-black flex items-center gap-1 cursor-pointer transition"
                      title="إرجاع حجم الخط إلى الحجم الافتراضي 110%"
                    >
                      <RotateCcw className="w-2.5 h-2.5" />
                      <span>ارجاع</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 px-1">
                  <span className="text-[11px] font-black text-slate-400 select-none">
                    صغير
                  </span>
                  <input
                    type="range"
                    min="80"
                    max="120"
                    step="5"
                    value={editFontScale}
                    onChange={(e) => setEditFontScale(Number(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                  />
                  <span className="text-sm font-black text-slate-200 select-none">
                    كبير
                  </span>
                </div>

                <div className="bg-slate-900 border border-slate-800/90 rounded-xl py-2.5 px-3 text-center overflow-hidden">
                  <p
                    style={{
                      fontSize: `${(13.5 * editFontScale) / 100}px`,
                      lineHeight: 1.5,
                    }}
                    className="font-black text-indigo-300 transition-all duration-100"
                  >
                    هكذا سوف تظهر الكلمة
                  </p>
                </div>
              </div>

              {/* تغيير الاسم */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  الاسم
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="اكتب اسمك"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-white outline-none"
                />
              </div>

              {/* تغيير كلمة السر */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  كلمة السر (الرمز السري)
                </label>
                <input
                  type="text"
                  value={editCode}
                  onChange={(e) => setEditCode(e.target.value)}
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

            {/* نافذة تأكيد شراء الشكل النادر (نعم / إلغاء) */}
            {pendingAvatarPurchase && (
              <div
                onClick={() => setPendingAvatarPurchase(null)}
                className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
              >
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="bg-slate-900 border border-amber-500/50 rounded-3xl max-w-xs w-full p-5 text-center space-y-4 shadow-2xl"
                >
                  <div className="w-20 h-20 rounded-3xl mx-auto overflow-hidden border-2 border-amber-400 shadow-lg">
                    <img
                      src={pendingAvatarPurchase.charItem.avatar}
                      alt={pendingAvatarPurchase.charItem.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-black text-white">
                      هل تريد حقاً أن تشتري هذا الشكل؟
                    </h3>
                    <p className="text-xs text-amber-300 font-bold">
                      {pendingAvatarPurchase.charItem.name} •{' '}
                      {pendingAvatarPurchase.cost} نقطة 💎
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={confirmRareAvatarPurchase}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl text-xs font-black cursor-pointer transition"
                    >
                      نعم
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingAvatarPurchase(null)}
                      className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 py-2.5 rounded-xl text-xs font-black cursor-pointer transition"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* الهيدر العلوي الحماسي للطالب */}
      <div className="bg-gradient-to-l from-indigo-950 via-slate-900 to-slate-900 border-b border-slate-800 p-3.5 shrink-0 z-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={openProfileSettings}
              title="الإعدادات وتغيير الصورة واللون والاسم وكلمة السر"
              className={`w-11 h-11 min-w-[44px] min-h-[44px] aspect-square shrink-0 rounded-2xl bg-gradient-to-tr ${
                colorThemes[student.profileColor || 'indigo']?.bg ||
                colorThemes.indigo.bg
              } flex items-center justify-center font-black text-base shadow-lg overflow-hidden cursor-pointer hover:scale-105 transition`}
            >
              {student.avatar?.startsWith('data:image') ? (
                <img
                  src={student.avatar}
                  alt={student.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{student.avatar || '👨‍🎓'}</span>
              )}
            </button>
            <div>
              <h1 className="text-sm font-black text-white">{student.name}</h1>
              <p className="text-[11px] text-slate-400">
                {school?.name} • {stage?.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="bg-amber-500/15 border border-amber-500/40 px-2.5 py-1 rounded-xl flex items-center gap-1">
              <span className="text-xs">💎</span>
              <span className="text-xs font-black text-amber-300">
                {student.points || 0}
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                setDismissedRoomIds([]);
                setIsNotifDropdownOpen((prev) => !prev);
              }}
              className={`relative p-2 rounded-xl cursor-pointer transition flex items-center justify-center ${
                invitedRooms.length > 0
                  ? 'bg-rose-600/25 border border-rose-500/60 text-rose-300'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
              title="إشعارات التحديات"
            >
              <Bell
                className={`w-4 h-4 ${
                  invitedRooms.length > 0 ? 'animate-bounce text-rose-400' : ''
                }`}
              />
              {invitedRooms.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow">
                  {invitedRooms.length}
                </span>
              )}
            </button>

            {onToggleTheme && (
              <button
                type="button"
                onClick={onToggleTheme}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl cursor-pointer transition flex items-center gap-1"
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
              className="p-2 bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-300 rounded-xl cursor-pointer transition"
              title="تسجيل الخروج"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* نافذة الإشعارات الفورية التي تظهر أمام الطالب على الشاشة عند وصول دعوة */}
        {!activeRoomId &&
          (invitedRooms.some((r) => !dismissedRoomIds.includes(r.id)) ||
            isNotifDropdownOpen) && (
            <div className="mt-2.5 space-y-2">
              {invitedRooms.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex items-center justify-between text-xs text-slate-400">
                  <span>🔔 لا توجد دعوات تحدي جديدة حالياً</span>
                  <button
                    type="button"
                    onClick={() => setIsNotifDropdownOpen(false)}
                    className="text-slate-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                invitedRooms
                  .filter(
                    (r) =>
                      isNotifDropdownOpen || !dismissedRoomIds.includes(r.id)
                  )
                  .map((r) => (
                    <div
                      key={r.id}
                      onClick={() => {
                        acceptChallengeInvitation(r.id, student.id);
                        setChallengeSubTab('friends');
                        setActiveTab('gamemode');
                        setActiveRoomId(r.id);
                        setIsNotifDropdownOpen(false);
                      }}
                      className="bg-gradient-to-l from-rose-600/90 via-indigo-700/90 to-indigo-900/95 border border-rose-400/70 rounded-2xl p-3 flex items-center justify-between gap-2 shadow-xl shadow-rose-950/50 cursor-pointer hover:scale-[1.01] transition"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-base shrink-0 animate-pulse">
                          ⚔️
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-black text-white truncate">
                            جتك دعوة تحدي من {r.hostName}! 🔥
                          </p>
                          <p className="text-[10px] text-rose-100 truncate mt-0.5">
                            📚 {r.lessonTitle} • اضغط للدخول مباشرة
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="bg-white text-indigo-950 px-2.5 py-1 rounded-xl text-[10px] font-black shadow">
                          دخول 🚀
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            declineChallengeInvitation(r.id, student.id);
                            setDismissedRoomIds((prev) => [...prev, r.id]);
                            setIsNotifDropdownOpen(false);
                          }}
                          className="p-1 rounded-lg bg-black/25 hover:bg-black/40 text-white/80 hover:text-white cursor-pointer"
                          title="إلغاء الدعوة"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          )}
      </div>

      {/* منطقة المحتوى المتغير حسب التبويب */}
      <div className="p-4 flex-1 min-h-0 overflow-y-auto custom-scroll flex flex-col space-y-4">
        {activeTab === 'review' && (
          <div className="flex flex-col flex-1 min-h-0 justify-between">
            <div className="space-y-2 pb-2 border-b border-slate-800/80 shrink-0 relative">
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSubjectId('all');
                    setIsLessonPickerOpen(false);
                  }}
                  className={`px-3 py-1 rounded-xl text-[11px] font-extrabold cursor-pointer transition-all ${
                    selectedSubjectId === 'all'
                      ? 'bg-gradient-to-l from-indigo-600 to-purple-600 text-white shadow-sm'
                      : 'bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  الكل ({stageLessons.length})
                </button>

                {stageSubjects.map((sub) => {
                  const isActiveSub = selectedSubjectId === sub.id;
                  const subCount = stageLessons.filter(
                    (l) => l.subjectId === sub.id
                  ).length;
                  return (
                    <button
                      type="button"
                      key={sub.id}
                      onClick={() => {
                        setSelectedSubjectId(sub.id);
                        setIsLessonPickerOpen(false);
                        const subLessons = stageLessons.filter(
                          (l) => l.subjectId === sub.id
                        );
                        if (subLessons.length > 1) {
                          setActiveLessonId('ALL_LESSONS');
                          setTutorChat([]);
                        } else if (subLessons[0]) {
                          setActiveLessonId(subLessons[0].id);
                          setTutorChat([]);
                        }
                      }}
                      className={`px-3 py-1 rounded-xl text-[11px] font-extrabold cursor-pointer transition-all ${
                        isActiveSub
                          ? 'bg-gradient-to-l from-indigo-600 to-purple-600 text-white shadow-sm'
                          : 'bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      {sub.name} ({subCount})
                    </button>
                  );
                })}
              </div>

              {filteredLessons.length > 0 && activeLesson && (
                <div className="relative">
                  <div className="bg-slate-900/95 border border-indigo-500/30 rounded-2xl px-3 py-2 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setIsLessonPickerOpen((prev) => !prev)}
                      className="flex-1 flex items-center justify-between gap-2 text-right cursor-pointer min-w-0"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm shrink-0">
                          {activeLesson.isCombined ? '📚' : '📖'}
                        </span>
                        <span className="text-xs font-black text-white truncate">
                          {activeLesson.title}
                        </span>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                          isLessonPickerOpen ? 'rotate-180 text-indigo-400' : ''
                        }`}
                      />
                    </button>

                    {tutorChat.length > 0 && (
                      <div className="flex items-center gap-1 shrink-0 border-r border-slate-800 pr-2">
                        <button
                          type="button"
                          onClick={() => setTutorChat([])}
                          className="p-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
                          title="محادثة جديدة"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {isLessonPickerOpen && (
                    <div className="mt-1.5 bg-slate-900 border border-indigo-500/40 rounded-2xl p-1.5 space-y-1 shadow-2xl z-30 max-h-56 overflow-y-auto custom-scroll">
                      {filteredLessons.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveLessonId('ALL_LESSONS');
                            setTutorChat([]);
                            setIsLessonPickerOpen(false);
                          }}
                          className={`w-full px-3 py-2 rounded-xl text-right flex items-center justify-between gap-2 cursor-pointer transition ${
                            activeLesson.isCombined
                              ? 'bg-emerald-600/25 border border-emerald-500/40 text-emerald-200'
                              : 'hover:bg-slate-800/80 text-emerald-300'
                          }`}
                        >
                          <span className="text-xs font-black truncate">
                            📚 كل دروس {currentSubjectLabel} ({filteredLessons.length} دروس)
                          </span>
                          {activeLesson.isCombined && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          )}
                        </button>
                      )}
                      {filteredLessons.map((les) => {
                        const isCurrent =
                          !activeLesson.isCombined && les.id === activeLesson.id;
                        return (
                          <button
                            type="button"
                            key={les.id}
                            onClick={() => {
                              setActiveLessonId(les.id);
                              setTutorChat([]);
                              setIsLessonPickerOpen(false);
                            }}
                            className={`w-full px-3 py-2 rounded-xl text-right flex items-center justify-between gap-2 cursor-pointer transition ${
                              isCurrent
                                ? 'bg-indigo-600/25 text-white'
                                : 'hover:bg-slate-800/80 text-slate-300'
                            }`}
                          >
                            <span className="text-xs font-bold truncate">
                              📖 {les.title}
                            </span>
                            {isCurrent && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {showLessonCardModal && activeLesson && (
                <div className="bg-slate-900 border border-amber-500/40 rounded-2xl p-3 space-y-3 text-xs max-h-64 overflow-y-auto custom-scroll">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-bold text-amber-300">
                      📄 {activeLesson.title}
                    </span>
                    <button
                      onClick={() => setShowLessonCardModal(false)}
                      className="text-[10px] text-slate-400 hover:text-white cursor-pointer"
                    >
                      ✖
                    </button>
                  </div>

                  {activeLesson.isCombined &&
                  Array.isArray(activeLesson.bundledLessons) ? (
                    <div className="space-y-3">
                      {activeLesson.bundledLessons.map((lesItem, idx) => (
                        <div
                          key={lesItem.id}
                          className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2.5"
                        >
                          <p className="font-black text-indigo-300 text-xs">
                            📖 الدرس ({idx + 1}): {lesItem.title}
                          </p>
                          {lesItem.audioPreview && (
                            <div className="bg-slate-900 border border-rose-500/40 rounded-xl p-2.5 space-y-1.5">
                              <p className="text-[11px] font-black text-rose-300 flex items-center gap-1.5">
                                <span>
                                  🎙️ التسجيل الصوتي للمعلم (
                                  {lesItem.audioName || 'شرح صوتي'}):
                                </span>
                              </p>
                              <audio
                                controls
                                src={lesItem.audioPreview}
                                className="w-full h-9 rounded-lg"
                              />
                            </div>
                          )}
                          {(Array.isArray(lesItem.imagePreviews) &&
                          lesItem.imagePreviews.length > 0
                            ? lesItem.imagePreviews
                            : lesItem.imagePreview
                            ? [lesItem.imagePreview]
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
                                alt={`${lesItem.title} - ${imgIdx + 1}`}
                                onClick={() =>
                                  handleOpenMediaFile({
                                    dataUrl: imgSrc,
                                    type: 'image',
                                    title: `${lesItem.title} (${imgIdx + 1})`,
                                    fileName: lesItem.fileName,
                                  })
                                }
                                className="w-full max-h-44 object-contain rounded-xl bg-slate-900 p-1 cursor-pointer hover:opacity-90 transition"
                              />
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleOpenMediaFile({
                                      dataUrl: imgSrc,
                                      type: 'image',
                                      title: `${lesItem.title} (${imgIdx + 1})`,
                                      fileName: lesItem.fileName,
                                    })
                                  }
                                  className="py-2 px-3 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/50 text-indigo-300 font-black text-center cursor-pointer transition"
                                >
                                  🔍 فتح الصورة
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDownloadMediaFile({
                                      dataUrl: imgSrc,
                                      type: 'image',
                                      title: `${lesItem.title}_${imgIdx + 1}`,
                                      fileName: lesItem.fileName,
                                    })
                                  }
                                  className="py-2 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-300 font-black text-center cursor-pointer transition"
                                >
                                  ⬇️ تحميل الصورة
                                </button>
                              </div>
                            </div>
                          ))}
                          {lesItem.pdfPreview && (
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  handleOpenMediaFile({
                                    dataUrl: lesItem.pdfPreview,
                                    type: 'pdf',
                                    title: lesItem.title,
                                    fileName: lesItem.fileName,
                                  })
                                }
                                className="py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 font-black text-center cursor-pointer transition"
                              >
                                📄 فتح الـ PDF
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleDownloadMediaFile({
                                    dataUrl: lesItem.pdfPreview,
                                    type: 'pdf',
                                    title: lesItem.title,
                                    fileName: lesItem.fileName,
                                  })
                                }
                                className="py-2 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-300 font-black text-center cursor-pointer transition"
                              >
                                ⬇️ تحميل الـ PDF
                              </button>
                            </div>
                          )}
                          <p className="text-slate-300 leading-relaxed whitespace-pre-line explanation-text">
                            {lesItem.rawText || lesItem.aiSummary}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      {activeLesson.audioPreview && (
                        <div className="bg-slate-950 border border-rose-500/40 rounded-xl p-3 space-y-2">
                          <p className="text-[11px] font-black text-rose-300 flex items-center gap-1.5">
                            <span>
                              🎙️ التسجيل الصوتي للمعلم (
                              {activeLesson.audioName || 'شرح صوتي'}):
                            </span>
                          </p>
                          <audio
                            controls
                            src={activeLesson.audioPreview}
                            className="w-full h-9 rounded-lg"
                          />
                        </div>
                      )}
                      {(Array.isArray(activeLesson.imagePreviews) &&
                      activeLesson.imagePreviews.length > 0
                        ? activeLesson.imagePreviews
                        : activeLesson.imagePreview
                        ? [activeLesson.imagePreview]
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
                            alt={`${activeLesson.title} - ${imgIdx + 1}`}
                            onClick={() =>
                              handleOpenMediaFile({
                                dataUrl: imgSrc,
                                type: 'image',
                                title: `${activeLesson.title} (${imgIdx + 1})`,
                                fileName: activeLesson.fileName,
                              })
                            }
                            className="w-full max-h-44 object-contain rounded-xl bg-slate-950 p-1 cursor-pointer hover:opacity-90 transition"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                handleOpenMediaFile({
                                  dataUrl: imgSrc,
                                  type: 'image',
                                  title: `${activeLesson.title} (${imgIdx + 1})`,
                                  fileName: activeLesson.fileName,
                                })
                              }
                              className="py-2 px-3 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/50 text-indigo-300 font-black text-center cursor-pointer transition"
                            >
                              🔍 فتح الصورة
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleDownloadMediaFile({
                                  dataUrl: imgSrc,
                                  type: 'image',
                                  title: `${activeLesson.title}_${imgIdx + 1}`,
                                  fileName: activeLesson.fileName,
                                })
                              }
                              className="py-2 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-300 font-black text-center cursor-pointer transition"
                            >
                              ⬇️ تحميل الصورة
                            </button>
                          </div>
                        </div>
                      ))}
                      {activeLesson.pdfPreview && (
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleOpenMediaFile({
                                dataUrl: activeLesson.pdfPreview,
                                type: 'pdf',
                                title: activeLesson.title,
                                fileName: activeLesson.fileName,
                              })
                            }
                            className="py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 font-black text-center cursor-pointer transition"
                          >
                            📄 فتح ملف الـ PDF
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleDownloadMediaFile({
                                dataUrl: activeLesson.pdfPreview,
                                type: 'pdf',
                                title: activeLesson.title,
                                fileName: activeLesson.fileName,
                              })
                            }
                            className="py-2 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-300 font-black text-center cursor-pointer transition"
                          >
                            ⬇️ تحميل الـ PDF
                          </button>
                        </div>
                      )}
                      <p className="text-slate-300 leading-relaxed whitespace-pre-line explanation-text">
                        {activeLesson.rawText || activeLesson.aiSummary}
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>

            {filteredLessons.length === 0 ? (
              <div className="my-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center">
                <BookOpen className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-400">
                  لا توجد دروس في هذه المادة
                </p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto custom-scroll py-2 px-1 space-y-4">
                {tutorChat.length === 0 ? (
                  <div className="flex flex-col items-center text-center px-2 pt-2 pb-2 space-y-3">
                    <div className="w-14 h-14 shrink-0 rounded-3xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-rose-400 p-0.5 shadow-xl shadow-indigo-500/30 animate-float">
                      <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center">
                        <SmartBookIcon className="w-7 h-7" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h2 className="text-xl font-black bg-gradient-to-l from-indigo-500 via-purple-500 to-rose-500 bg-clip-text text-transparent">
                        مرحباً {student.name.split(' ')[0]} ✨
                      </h2>
                      <p className="text-xs font-bold text-slate-400">
                        {activeLesson?.title}
                      </p>
                    </div>

                    <div className="w-full grid grid-cols-2 gap-2 text-right">
                      <button
                        type="button"
                        onClick={() => sendMessageToGemini('✨ لخص الدرس')}
                        className="bg-slate-900 hover:bg-indigo-950/60 border border-slate-800 hover:border-indigo-500/50 p-3 rounded-2xl transition flex items-center gap-2 cursor-pointer"
                      >
                        <span className="text-base">✨</span>
                        <span className="text-xs font-bold text-slate-200">
                          لخّص الدرس
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => sendMessageToGemini('💡 مثال مبسط')}
                        className="bg-slate-900 hover:bg-amber-950/60 border border-slate-800 hover:border-amber-500/50 p-3 rounded-2xl transition flex items-center gap-2 cursor-pointer"
                      >
                        <span className="text-base">💡</span>
                        <span className="text-xs font-bold text-slate-200">
                          مثال مبسط
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => sendMessageToGemini('📌 أهم النقاط')}
                        className="bg-slate-900 hover:bg-emerald-950/60 border border-slate-800 hover:border-emerald-500/50 p-3 rounded-2xl transition flex items-center gap-2 cursor-pointer"
                      >
                        <span className="text-base">📌</span>
                        <span className="text-xs font-bold text-slate-200">
                          أهم النقاط
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => sendMessageToGemini('❓ اختبرني بسؤال')}
                        className="bg-slate-900 hover:bg-rose-950/60 border border-slate-800 hover:border-rose-500/50 p-3 rounded-2xl transition flex items-center gap-2 cursor-pointer"
                      >
                        <span className="text-base">❓</span>
                        <span className="text-xs font-bold text-slate-200">
                          اختبرني بسؤال
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowLessonCardModal((prev) => !prev)}
                        className="col-span-2 bg-slate-900 hover:bg-sky-950/60 border border-slate-800 hover:border-sky-500/50 p-3 rounded-2xl transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span className="text-base">📄</span>
                        <span className="text-xs font-bold text-slate-200">
                          اعرض المادة
                        </span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {tutorChat.map((msg, i) =>
                      msg.sender === 'student' ? (
                        <div key={i} className="flex justify-start">
                          <div className="max-w-[85%] bg-indigo-600 text-white rounded-3xl rounded-tr-md px-4 py-2.5 text-xs font-bold shadow-md">
                            {msg.text}
                          </div>
                        </div>
                      ) : (
                        <div key={i} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-rose-400 p-[1.5px] flex items-center justify-center shadow">
                                <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center">
                                  <SmartBookIcon className="w-3.5 h-3.5" />
                                </div>
                              </div>
                              <span className="text-xs font-black text-indigo-400 leading-relaxed">
                                مساعد الطالب الذكي
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleSpeakText(msg.text, i)}
                              className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 cursor-pointer transition border ${
                                speakingMsgKey === i
                                  ? 'bg-rose-600/25 border-rose-400 text-rose-200 animate-pulse'
                                  : 'text-slate-400 hover:text-indigo-300 bg-slate-900 border-slate-800'
                              }`}
                              title="اضغط للاستماع أو اضغط مرة أخرى للإيقاف"
                            >
                              <Volume2 className="w-3 h-3" />
                              <span>{speakingMsgKey === i ? 'ايقاف' : 'استماع'}</span>
                            </button>
                          </div>

                          <div className="bg-slate-900/90 border border-slate-800/90 rounded-3xl rounded-tl-md p-4 text-xs text-slate-100 leading-relaxed whitespace-pre-line shadow-lg explanation-text">
                            {String(msg.text || '').replace(/\*\*/g, '')}

                            <div className="flex flex-wrap gap-1.5 mt-3 pt-2.5 border-t border-slate-800/80">
                              <button
                                type="button"
                                onClick={() => handleStartQuickQuiz(activeLesson)}
                                className="bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/50 text-indigo-200 px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 cursor-pointer transition"
                              >
                                <Brain className="w-3 h-3" />
                                <span>ابدأ كويز الدرس (+20 نقطة)</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedRoomLessonId(activeLesson.id);
                                  setActiveTab('gamemode');
                                }}
                                className="bg-rose-950/80 hover:bg-rose-900 border border-rose-700/50 text-rose-200 px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 cursor-pointer transition"
                              >
                                <Swords className="w-3 h-3" />
                                <span>تحدي الأصدقاء ⚔️</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    )}

                    {isAskingTutor && (
                      <div className="flex items-center gap-2.5 p-3 bg-slate-900/60 border border-slate-800 rounded-2xl w-fit">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-rose-400 p-[1.5px] flex items-center justify-center animate-pulse">
                          <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center">
                            <SmartBookIcon className="w-3.5 h-3.5" />
                          </div>
                        </div>
                        <span className="text-xs font-bold text-indigo-300 animate-pulse">
                          المساعد الذكي يكتب الشرح...
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeLesson && (
              <div className="pt-2 shrink-0">
                <form
                  onSubmit={handleAskTutor}
                  className="bg-slate-900 border border-indigo-500/40 focus-within:border-indigo-400 rounded-full p-1.5 pl-2 pr-4 flex items-center gap-2 shadow-lg shadow-indigo-950/40"
                >
                  <SmartBookIcon className="w-4 h-4 shrink-0" />
                  <input
                    type="text"
                    value={tutorQuestion}
                    onChange={(e) => setTutorQuestion(e.target.value)}
                    placeholder="اسأل المساعد الذكي..."
                    className="flex-1 bg-transparent text-xs text-white placeholder:text-slate-400 outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isAskingTutor || !tutorQuestion.trim()}
                    className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-500 hover:from-indigo-500 hover:to-purple-400 disabled:opacity-40 text-white flex items-center justify-center cursor-pointer transition shrink-0 shadow-md"
                  >
                    {isAskingTutor ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {(activeTab === 'gamemode' || activeTab === 'quiz') && (
          <div className="space-y-3.5">
            {/* زران علويان داخل قسم التحدي: 1. تحدي الأصدقاء (الافتراضي) • 2. اختبار نفسك */}
            <div className="bg-slate-900 border border-slate-800 p-1.5 rounded-2xl grid grid-cols-2 gap-1.5 shadow-inner">
              <button
                type="button"
                onClick={() => setChallengeSubTab('friends')}
                className={`py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer transition ${
                  challengeSubTab === 'friends'
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Swords className="w-4 h-4" />
                <span>تحدي الأصدقاء</span>
              </button>

              <button
                type="button"
                onClick={() => setChallengeSubTab('self')}
                className={`py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer transition ${
                  challengeSubTab === 'self'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Brain className="w-4 h-4" />
                <span>امتحان سريع</span>
              </button>
            </div>

            {challengeSubTab === 'self' ? (
              <div className="space-y-3">
                {!quizLesson ? (
                  <div className="space-y-2.5">
                    {/* شريط البحث الذكي أعلى الدروس في الامتحان السريع */}
                    <div className="bg-slate-900 border-2 border-indigo-500/70 focus-within:border-indigo-400 rounded-2xl px-3.5 py-2.5 flex items-center gap-2.5 shadow-md">
                      <Search className="w-4 h-4 text-indigo-400 shrink-0" />
                      <input
                        type="text"
                        value={lessonSearchQuery}
                        onChange={(e) => setLessonSearchQuery(e.target.value)}
                        placeholder="ابحث عن المادة أو الدرس"
                        className="flex-1 bg-transparent text-xs font-bold text-white placeholder:text-slate-300 outline-none"
                      />
                      {lessonSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setLessonSearchQuery('')}
                          className="text-slate-400 hover:text-white cursor-pointer"
                          title="مسح البحث"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {filteredSelectableChallengeItems.length === 0 ? (
                      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 text-center text-xs text-slate-400 font-bold">
                        لا توجد دروس مطابقة لبحثك "{lessonSearchQuery}"
                      </div>
                    ) : (
                      filteredSelectableChallengeItems.map((les) => (
                        <div
                          key={les.id}
                          className={`bg-slate-900 border ${
                            les.isCombined
                              ? 'border-emerald-500/40'
                              : 'border-slate-800'
                          } rounded-2xl p-3.5 flex items-center justify-between gap-3`}
                        >
                          <div>
                            <span className="block text-sm font-black text-indigo-300">
                              {les.subjectName}
                            </span>
                            <h3 className="text-xs font-bold text-white mt-0.5">
                              {les.isCombined ? `📚 ${les.title}` : les.title}
                            </h3>
                          </div>
                          <button
                            onClick={() => handleStartQuickQuiz(les)}
                            className="btn-3d-indigo px-3.5 py-2 rounded-xl text-xs font-black text-white cursor-pointer shrink-0"
                          >
                            ابدأ 🚀
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                ) : quizFinished ? (
                  <div className="bg-slate-900 border border-indigo-500/40 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
                    <div className="w-16 h-16 rounded-3xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                      <Trophy className="w-9 h-9" />
                    </div>
                    <h2 className="text-lg font-black text-white">
                      أحسنت يا {student.name}! 🎉
                    </h2>
                    <div className="space-y-1">
                      <p className="text-base font-black text-indigo-300">
                        {quizLesson.subjectName}
                      </p>
                      <p className="text-xs text-slate-300">
                        أنهيت الاختبار السريع في درس:{' '}
                        <span className="text-white font-bold">
                          {quizLesson.title}
                        </span>
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                      <div>
                        <p className="text-[11px] text-slate-400">النتيجة</p>
                        <p className="text-lg font-black text-emerald-400">
                          {quizScore * 4} / {quizLesson.aiQuestions.length * 4}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-400">مكافأة الاختبار</p>
                        <p className="text-lg font-black text-amber-400">
                          +{quizScore * 4} نقطة 💎
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <button
                        onClick={() => handleStartQuickQuiz(quizLesson)}
                        className="btn-3d-indigo py-2.5 rounded-xl text-xs font-black text-white cursor-pointer"
                      >
                        إعادة الاختبار 🔄
                      </button>
                      <button
                        onClick={() => setQuizLesson(null)}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
                      >
                        اختيار درس آخر
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-4 shadow-xl">
                    <div className="flex items-center justify-between text-xs">
                      <button
                        onClick={() => setQuizLesson(null)}
                        className="text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                      >
                        <ArrowRight className="w-4 h-4" />
                        <span>عودة</span>
                      </button>
                      <span className="text-base font-black text-indigo-300">
                        {quizLesson.subjectName}
                      </span>
                      <span className="bg-indigo-500/20 text-indigo-300 font-black px-2.5 py-1 rounded-full text-[11px]">
                        السؤال {quizIndex + 1} من {quizLesson.aiQuestions.length}
                      </span>
                    </div>

                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-500 h-full transition-all duration-300"
                        style={{
                          width: `${
                            ((quizIndex + 1) / quizLesson.aiQuestions.length) * 100
                          }%`,
                        }}
                      />
                    </div>

                    {(() => {
                      const q = quizLesson.aiQuestions[quizIndex];
                      return (
                        <div className="space-y-3">
                          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                            <div className="flex items-center justify-between mb-1">
                              <span className="inline-block text-[10px] font-bold text-amber-400">
                                مستوى السؤال: {q.difficulty || 'متوسط'}
                              </span>
                              <span className="text-[10px] font-black text-emerald-400">
                                4 درجات
                              </span>
                            </div>
                            <h3 className="text-sm font-black text-white leading-relaxed">
                              {q.question}
                            </h3>
                          </div>

                          <div className="space-y-2">
                            {q.options.map((opt, idx) => {
                              const isPicked = selectedOption === idx;
                              const isRight = idx === q.correctIndex;
                              let btnStyle =
                                'bg-slate-950 border-slate-800 text-slate-200 hover:border-indigo-500';
                              if (selectedOption !== null) {
                                if (isRight) {
                                  btnStyle =
                                    'bg-emerald-950/90 border-emerald-500 text-emerald-200';
                                } else if (isPicked && !isRight) {
                                  btnStyle =
                                    'bg-rose-950/90 border-rose-500 text-rose-200';
                                }
                              }
                              return (
                                <button
                                  key={idx}
                                  onClick={() => handleSelectQuizOption(idx)}
                                  className={`w-full p-3.5 rounded-2xl border text-right text-xs font-bold flex items-center justify-between cursor-pointer transition ${btnStyle}`}
                                >
                                  <span>{opt}</span>
                                  {selectedOption !== null && isRight && (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                  )}
                                  {selectedOption !== null && isPicked && !isRight && (
                                    <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          {selectedOption !== null && (
                            <div className="bg-indigo-950/50 border border-indigo-700/50 rounded-2xl p-3 text-xs space-y-2">
                              <p className="text-indigo-200">
                                💡 <span className="font-black">توضيح الذكاء الاصطناعي:</span>{' '}
                                {q.explanation}
                              </p>
                              <button
                                onClick={handleNextQuizQuestion}
                                className="w-full btn-3d-indigo py-2.5 rounded-xl font-black text-white cursor-pointer"
                              >
                                {quizIndex + 1 < quizLesson.aiQuestions.length
                                  ? 'السؤال التالي ⬅️'
                                  : 'إنهاء الاختبار واستلام النقاط 🏆'}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            ) : !activeRoom ? (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-3.5 shadow-xl">
                {roomError && (
                  <div className="bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs font-bold p-3 rounded-2xl">
                    ⚠️ {roomError}
                  </div>
                )}

                <button
                  onClick={handleCreateRoom}
                  className="w-full btn-3d-rose py-3 rounded-2xl text-xs font-black text-white flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Swords className="w-4 h-4" />
                  <span>إنشاء غرفة التحدي الآن 🚀</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <div
                    onClick={() => setSelectedChallengeTier('standard')}
                    className={`p-2.5 rounded-2xl border cursor-pointer transition ${
                      selectedChallengeTier === 'standard'
                        ? 'bg-indigo-600/20 border-indigo-400 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <p className="text-xs font-black">⚔️ تحدي الأصدقاء</p>
                    <p className="text-[10px] text-emerald-400 font-bold mt-1">
                      مجاناً • +50 نقطة
                    </p>
                  </div>

                  <div
                    onClick={() => setSelectedChallengeTier('champions')}
                    className={`p-2.5 rounded-2xl border cursor-pointer transition ${
                      selectedChallengeTier === 'champions'
                        ? 'bg-amber-500/20 border-amber-400 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-black text-amber-300">
                        👑 بطولة النخبة
                      </p>
                      {(student.points || 0) < 100 && (
                        <Lock className="w-3.5 h-3.5 text-amber-400" />
                      )}
                    </div>
                    <p className="text-[10px] text-amber-200 font-bold mt-1">
                      تتطلب 100 نقطة • +100
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <label className="block text-[11px] font-bold text-slate-400">
                    اختر مادة ودرس التحدي (درس معين أو كل دروس المادة):
                  </label>

                  {/* شريط البحث الذكي أعلى دروس التحدي */}
                  <div className="bg-slate-950 border-2 border-indigo-500/70 focus-within:border-indigo-400 rounded-2xl px-3.5 py-2.5 flex items-center gap-2.5 shadow-md">
                    <Search className="w-4 h-4 text-indigo-400 shrink-0" />
                    <input
                      type="text"
                      value={lessonSearchQuery}
                      onChange={(e) => setLessonSearchQuery(e.target.value)}
                      placeholder="ابحث عن المادة أو الدرس"
                      className="flex-1 bg-transparent text-xs font-bold text-white placeholder:text-slate-300 outline-none"
                    />
                    {lessonSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setLessonSearchQuery('')}
                        className="text-slate-400 hover:text-white cursor-pointer"
                        title="مسح البحث"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    {filteredSelectableChallengeItems.length === 0 ? (
                      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 text-center text-xs text-slate-400 font-bold">
                        لا توجد دروس مطابقة لبحثك "{lessonSearchQuery}"
                      </div>
                    ) : (
                      filteredSelectableChallengeItems.map((les) => {
                        const currentSelectedId =
                          selectedRoomLessonId ||
                          filteredSelectableChallengeItems[0]?.id ||
                          allSelectableChallengeItems[0]?.id;
                        const isPicked = currentSelectedId === les.id;
                        return (
                          <button
                            type="button"
                            key={les.id}
                            onClick={() => setSelectedRoomLessonId(les.id)}
                            className={`w-full p-3.5 rounded-2xl border text-right flex items-center justify-between gap-3 cursor-pointer transition ${
                              isPicked
                                ? 'bg-indigo-600/20 border-indigo-400 text-white shadow-sm'
                                : les.isCombined
                                ? 'bg-slate-950 border-emerald-500/40 text-slate-200 hover:border-emerald-400'
                                : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            <div className="min-w-0">
                              <span className="text-sm font-black text-indigo-300 block">
                                {les.subjectName}
                              </span>
                              <p className="text-xs font-bold text-white truncate mt-0.5">
                                {les.isCombined ? `📚 ${les.title}` : les.title}
                              </p>
                            </div>
                            {isPicked && (
                              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                {invitedRooms.length > 0 && (
                  <div className="pt-2.5 border-t border-slate-800 space-y-2">
                    <h3 className="text-[11px] font-black text-indigo-300 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      <span>دعوات التحدي من أصدقائك:</span>
                    </h3>
                    <div className="space-y-1.5">
                      {invitedRooms.map((r) => (
                        <div
                          key={r.id}
                          className="bg-slate-950 border border-indigo-500/40 rounded-2xl p-3 flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-black text-white truncate">
                              دعوة من {r.hostName} ⚔️
                            </p>
                            <p className="text-[10px] text-indigo-300 truncate mt-0.5">
                              {r.lessonTitle}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                acceptChallengeInvitation(r.id, student.id);
                                setActiveRoomId(r.id);
                              }}
                              className="btn-3d-indigo px-3 py-1.5 rounded-xl text-[11px] font-black text-white cursor-pointer"
                            >
                              قبول الدعوة 🚀
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                declineChallengeInvitation(r.id, student.id);
                                setDismissedRoomIds((prev) => [...prev, r.id]);
                              }}
                              className="p-1.5 rounded-xl bg-slate-900 hover:bg-rose-950 border border-slate-800 text-slate-400 hover:text-rose-300 cursor-pointer transition"
                              title="إلغاء الدعوة"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : activeRoom.status === 'waiting' ? (
              <div
                onClick={() => {
                  if (countdown !== null) return;
                  if (activeRoom.hostId === student.id) {
                    cancelChallengeRoom(activeRoom.id);
                  } else {
                    declineChallengeInvitation(activeRoom.id, student.id);
                  }
                  setActiveRoomId(null);
                }}
                className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
              >
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="bg-slate-900 border border-indigo-500/40 rounded-3xl max-w-sm w-full p-5 text-center space-y-4 shadow-2xl cursor-default"
                >
                  {countdown !== null ? (
                    <div className="py-10 space-y-3">
                      <p className="text-sm font-bold text-indigo-300">
                        استعدوا! المسابقة تبدأ خلال...
                      </p>
                      <div className="text-6xl font-black text-amber-400 animate-bounce">
                        {countdown}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                        <span className="bg-rose-500/20 text-rose-300 text-[10px] font-black px-2.5 py-1 rounded-full">
                          الجائزة: +{activeRoom.rewardPoints || 50} نقطة 🏆
                        </span>
                        {activeRoom.inviteStartedAt && (
                          <span
                            className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                              lobbyTimeLeft <= 10
                                ? 'bg-rose-600 text-white animate-pulse'
                                : 'bg-amber-500/20 text-amber-300'
                            }`}
                          >
                            ⏱️ {lobbyTimeLeft} ثانية
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (activeRoom.hostId === student.id) {
                              cancelChallengeRoom(activeRoom.id);
                            } else {
                              declineChallengeInvitation(activeRoom.id, student.id);
                            }
                            setActiveRoomId(null);
                          }}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 hover:text-white cursor-pointer transition"
                          title="إغلاق الغرفة"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="bg-slate-950 border-2 border-dashed border-indigo-500/50 rounded-2xl p-3.5 space-y-2.5">
                        <p className="text-xs font-bold text-indigo-300">
                          📚 {activeRoom.lessonTitle}
                        </p>
                        <button
                          type="button"
                          onClick={() =>
                            setShowInviteFriendsList((prev) => !prev)
                          }
                          className="w-full bg-indigo-950 hover:bg-indigo-900 border border-indigo-500/60 text-indigo-200 text-xs font-black py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition"
                        >
                          <Users className="w-4 h-4 text-indigo-400" />
                          <span>+ إضافة المنافس</span>
                        </button>

                        {showInviteFriendsList && (
                          <div className="pt-2 border-t border-slate-800 text-right space-y-1.5">
                            <p className="text-[11px] font-bold text-slate-400">
                              أصدقائي في نفس المرحلة ({stage?.name || 'المرحلة'}):
                            </p>
                            {stageFriends.length === 0 ? (
                              <p className="text-[11px] text-slate-500 text-center py-2">
                                لا يوجد أصدقاء آخرون في مرحلتك حالياً.
                              </p>
                            ) : (
                              <div className="space-y-1.5 max-h-32 overflow-y-auto custom-scroll">
                                {stageFriends.map((friend) => {
                                  const isInvited = activeRoom.players.some(
                                    (p) => p.id === friend.id
                                  );
                                  return (
                                    <div
                                      key={friend.id}
                                      className="bg-slate-900 border border-slate-800 rounded-xl p-2 flex items-center justify-between text-xs"
                                    >
                                      <span className="font-bold text-white flex items-center gap-2">
                                        <span
                                          className={`w-7 h-7 rounded-xl bg-gradient-to-tr ${
                                            colorThemes[
                                              friend.profileColor || 'indigo'
                                            ]?.bg || colorThemes.indigo.bg
                                          } flex items-center justify-center text-sm shadow overflow-hidden shrink-0`}
                                        >
                                          {friend.avatar?.startsWith(
                                            'data:image'
                                          ) ? (
                                            <img
                                              src={friend.avatar}
                                              alt={friend.name}
                                              className="w-full h-full object-cover"
                                            />
                                          ) : (
                                            <span>{friend.avatar || '👨‍🎓'}</span>
                                          )}
                                        </span>
                                        <span>{friend.name}</span>
                                      </span>
                                      <button
                                        type="button"
                                        disabled={isInvited}
                                        onClick={() =>
                                          inviteStudentToChallengeRoom(
                                            activeRoom.id,
                                            friend
                                          )
                                        }
                                        className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition ${
                                          isInvited
                                            ? 'bg-emerald-500/20 text-emerald-300 cursor-default'
                                            : 'bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer'
                                        }`}
                                      >
                                        {isInvited ? 'تمت الدعوة ✅' : 'دعوة +'}
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="text-right space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-300">
                            👥 المتسابقون ({activeRoom.players.length}):
                          </span>
                        </div>

                        <div className="space-y-1.5 max-h-32 overflow-y-auto custom-scroll">
                          {activeRoom.players.map((p, idx) => (
                            <div
                              key={p.id}
                              className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between text-xs font-bold"
                            >
                              <span>
                                {idx === 0 ? '👑 ' : '⚡ '}
                                {p.name}
                              </span>
                              <span
                                className={`text-[10px] ${
                                  p.hasAccepted !== false
                                    ? 'text-emerald-400'
                                    : 'text-amber-400 animate-pulse'
                                }`}
                              >
                                {p.hasAccepted !== false
                                  ? 'جاهز ✅'
                                  : '⏳ بانتظار القبول...'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => handleTriggerStartGame(activeRoom.id)}
                        className="w-full btn-3d-emerald py-3 rounded-2xl text-xs font-black text-white flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Play className="w-4 h-4" />
                        <span>بدء المسابقة الآن! 🔥</span>
                      </button>

                      {/* نافذة تنبيه عند محاولة بدء التحدي بدون دعوة أي شخص */}
                      {noInviteWarningModal && (
                        <div
                          onClick={() => setNoInviteWarningModal(false)}
                          className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                        >
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="bg-slate-900 border border-rose-500/50 rounded-3xl max-w-xs w-full p-5 text-center space-y-4 shadow-2xl"
                          >
                            <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto text-2xl">
                              ⚠️
                            </div>
                            <h3 className="text-sm font-black text-white leading-relaxed">
                              لا يمكنك البدء لم تدعو أحد
                            </h3>
                            <button
                              type="button"
                              onClick={() => {
                                setNoInviteWarningModal(false);
                                setShowInviteFriendsList(true);
                              }}
                              className="w-full bg-rose-600 hover:bg-rose-500 text-white py-2.5 rounded-xl text-xs font-black cursor-pointer transition"
                            >
                              حسناً
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ) : activeRoom.status === 'playing' ? (
              <div
                onClick={(e) => e.stopPropagation()}
                className="w-full bg-slate-900 border border-rose-500/40 rounded-3xl p-4 md:p-6 space-y-4 shadow-2xl cursor-default"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-rose-300">
                    ⚔️ السؤال {activeRoom.currentQuestionIndex + 1} من{' '}
                    {activeRoom.questions.length}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-black ${
                      timeLeft <= 5
                        ? 'bg-rose-600 text-white animate-pulse'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    ⏱️ {timeLeft} ثانية
                  </span>
                </div>

                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  {[...activeRoom.players]
                    .sort((a, b) => b.score - a.score)
                    .map((p, i) => {
                      const hasAnsweredCurrent =
                        p.lastAnsweredQuestion >= activeRoom.currentQuestionIndex;
                      return (
                        <div
                          key={p.id}
                          className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-[11px] shrink-0 flex items-center gap-1.5"
                        >
                          <span>{i === 0 ? '🥇' : '⚡'}</span>
                          <span className="font-bold text-white">{p.name}:</span>
                          <span className="font-black text-amber-400">{p.score}</span>
                          <span className="text-[10px]">
                            {hasAnsweredCurrent ? '✅' : '⏳'}
                          </span>
                        </div>
                      );
                    })}
                </div>

                {(() => {
                  const q = activeRoom.questions[activeRoom.currentQuestionIndex];
                  if (!q) return null;
                  return (
                    <div className="space-y-3">
                      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                        <h3 className="text-sm font-black text-white leading-relaxed">
                          {q.question}
                        </h3>
                      </div>

                      <div className="space-y-2">
                        {q.options.map((opt, idx) => {
                          const isPicked = myRoomAnswer === idx;
                          const isRight = idx === q.correctIndex;
                          let style =
                            'bg-slate-950 border-slate-800 text-slate-200 hover:border-rose-500';
                          if (myRoomAnswer !== null) {
                            if (isRight) {
                              style =
                                'bg-emerald-950 border-emerald-500 text-emerald-200';
                            } else if (isPicked && !isRight) {
                              style = 'bg-rose-950 border-rose-500 text-rose-200';
                            }
                          }
                          return (
                            <button
                              key={idx}
                              onClick={() => handleAnswerInRoom(idx)}
                              className={`w-full p-3.5 rounded-2xl border text-right text-xs font-bold flex items-center justify-between cursor-pointer transition ${style}`}
                            >
                              <span>{opt}</span>
                              {myRoomAnswer !== null && isRight && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {myRoomAnswer !== null && !allPlayersAnswered && timeLeft > 0 && (
                        <div className="bg-indigo-950/60 border border-indigo-500/40 rounded-2xl p-3 text-center text-xs font-bold text-indigo-200 animate-pulse">
                          ⏳ تم تسجيل إجابتك! بانتظار إجابة المنافس ({timeLeft} ثانية)...
                        </div>
                      )}

                      {(allPlayersAnswered || timeLeft === 0) && (
                        <button
                          onClick={() => {
                            if (
                              activeRoom.currentQuestionIndex + 1 >=
                              activeRoom.questions.length
                            ) {
                              triggerCelebration();
                            }
                            advanceOrFinishChallengeRoom(
                              activeRoom.id,
                              activeRoom.currentQuestionIndex
                            );
                          }}
                          className="w-full btn-3d-indigo py-3 rounded-2xl text-xs font-black text-white cursor-pointer"
                        >
                          {activeRoom.currentQuestionIndex + 1 <
                          activeRoom.questions.length
                            ? 'السؤال التنافسي التالي ⬅️'
                            : 'إعلان الفائز وتتويج البطل 🏆'}
                        </button>
                      )}
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div
                onClick={(e) => e.stopPropagation()}
                className="w-full bg-slate-900 border border-amber-500/50 rounded-3xl p-5 text-center space-y-4 shadow-2xl cursor-default"
              >
                <div className="w-20 h-20 rounded-3xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto animate-float">
                  <Trophy className="w-12 h-12" />
                </div>

                <div>
                  <span className="bg-amber-500/20 text-amber-300 text-xs font-black px-3.5 py-1 rounded-full">
                    انتهت المنافسة
                  </span>
                  <h2 className="text-lg font-black text-white mt-2">
                    الفائز بالمركز الأول: {activeRoom.winnerName} 🎉
                  </h2>
                  <p className="text-[11px] text-emerald-400 font-bold mt-1">
                    🥇 الأول: +50 نقطة • 🥈 الثاني: +25 نقطة • 🥉 الثالث: +10 نقاط
                  </p>
                </div>

                <div className="space-y-2 text-right">
                  {[...activeRoom.players]
                    .sort((a, b) => b.score - a.score)
                    .map((p, index) => {
                      const rankPoints =
                        index === 0 ? 50 : index === 1 ? 25 : index === 2 ? 10 : 0;
                      return (
                        <div
                          key={p.id}
                          className={`p-3 rounded-2xl border flex items-center justify-between ${
                            index === 0
                              ? 'bg-amber-500/15 border-amber-400 text-white'
                              : 'bg-slate-950 border-slate-800 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-base">
                              {index === 0
                                ? '🥇'
                                : index === 1
                                ? '🥈'
                                : index === 2
                                ? '🥉'
                                : '🎖️'}
                            </span>
                            <div>
                              <p className="text-xs font-black">{p.name}</p>
                              <p className="text-[10px] text-slate-400">
                                إجابات صحيحة: {p.correctCount} • سرعة: {p.score}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`text-xs font-black px-2.5 py-1 rounded-xl ${
                              rankPoints > 0
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {rankPoints > 0
                              ? `+${rankPoints} ${rankPoints === 10 ? 'نقاط' : 'نقطة'} 💎`
                              : '0 نقطة'}
                          </span>
                        </div>
                      );
                    })}
                </div>

                <button
                  onClick={() => setActiveRoomId(null)}
                  className="w-full btn-3d-indigo py-3 rounded-2xl text-xs font-black text-white cursor-pointer"
                >
                  العودة لساحة التحديات ⚔️
                </button>
              </div>
            )}
          </div>
        )}

        {(activeTab === 'leaderboard' || activeTab === 'level') &&
          (() => {
            const isInspectingOther =
              Boolean(inspectedStudentId) && inspectedStudentId !== student.id;
            const targetStudent =
              allStudents.find(
                (s) => s.id === (inspectedStudentId || student.id)
              ) || student;
            const pts = targetStudent.points || 0;
            const history =
              Array.isArray(targetStudent.performanceHistory) &&
              targetStudent.performanceHistory.length >= 6
                ? targetStudent.performanceHistory.slice(-6)
                : [50, 58, 52, 65, 58, 70];

            const currentRating = history[history.length - 1];
            const prevRating = history[history.length - 2] ?? currentRating;

            const currentLevel =
              typeof targetStudent.level === 'number'
                ? targetStudent.level
                : Math.max(1, Math.round(currentRating / 16));

            const waveHeights = history.map((val) =>
              Math.round(84 - (Math.max(12, Math.min(96, val)) / 100) * 68)
            );
            const waveX = [25, 80, 135, 190, 245, 295];

            let directionFlips = 0;
            for (let i = 2; i < history.length; i++) {
              const d1 = history[i - 1] - history[i - 2];
              const d2 = history[i] - history[i - 1];
              if ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) {
                directionFlips++;
              }
            }

            const lastTwoRising =
              history[5] > history[4] && history[4] >= history[3];
            const isLow =
              currentRating < 48 ||
              (currentRating < prevRating && currentRating < 58);
            const isFluctuating =
              !isLow &&
              !lastTwoRising &&
              (directionFlips >= 3 || currentRating < 70);

            const statusBadge = isLow
              ? {
                  text: 'مستوى منخفض',
                  color: 'text-rose-400',
                  stroke: '#f43f5e',
                }
              : isFluctuating
              ? {
                  text: 'مستوى متذبذب',
                  color: 'text-amber-400',
                  stroke: '#38bdf8',
                }
              : {
                  text: 'مستوى مثالي',
                  color: 'text-emerald-400',
                  stroke: '#38bdf8',
                };

            const motivationalQuotes = isLow
              ? [
                  '💪 لا تقلق من انخفاض المستوى! راجع ملخص الدرس الذكي وادخل التحدي القادم ليرتفع مؤشرك فوراً.',
                  '📖 كل بطل يمر بلحظة تراجع؛ قراءة «النصيحة الذهبية» قبل الاختبار ستعيدك إلى القمة.',
                  '🌱 فوز واحد أو إجابات صحيحة في الاختبار السريع كفيلة برفع خط مستواك للأعلى من جديد!',
                ]
              : isFluctuating
              ? [
                  '⚡ مستواك يرتفع مرة وينخفض مرة! لديك ذكاء رائع، وبقليل من التركيز سيثبت خطك في القمة.',
                  '🎯 تأنَّ في قراءة السؤال داخل التحدي حتى تحصد انتصارات متتالية بدون انخفاض.',
                  '🌟 خطوة واحدة تفصلك عن الاستقرار في المستوى المثالي، واصل التحدي يا بطل!',
                ]
              : [
                  '🌟 ما شاء الله! مستواك مثالي بفضل تفوقك وانتصاراتك الرائعة في التحديات.',
                  '🚀 همتك عالية ومؤشر أدائك في القمة، واصل الفوز لتحافظ على صدارتك!',
                  '🏆 النجاح يصنعه الأبطال المثابرون مثلك، استمر بهذا المستوى المميز كل يوم.',
                ];

            return (
              <div className="space-y-4">
                {/* قسم المستوى ومؤشر الأداء المدمج مع المتصدرين */}
                <div className="space-y-3">
                  {isInspectingOther && (
                    <button
                      type="button"
                      onClick={() => setInspectedStudentId(null)}
                      className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-sky-300 px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition"
                    >
                      <ArrowRight className="w-4 h-4" />
                      <span>عرض مستواي الشخصي</span>
                    </button>
                  )}

                  {/* بطاقة الطالب (الصورة والاسم والمستوى) */}
                  <div className="bg-gradient-to-l from-sky-500/20 via-slate-900 to-slate-900 border border-sky-500/40 rounded-3xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 min-w-[48px] min-h-[48px] aspect-square shrink-0 rounded-2xl bg-gradient-to-tr ${
                          colorThemes[targetStudent.profileColor || 'indigo']?.bg ||
                          colorThemes.indigo.bg
                        } flex items-center justify-center text-xl shadow-lg overflow-hidden`}
                      >
                        {targetStudent.avatar?.startsWith('data:image') ? (
                          <img
                            src={targetStudent.avatar}
                            alt={targetStudent.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{targetStudent.avatar || '👨‍🎓'}</span>
                        )}
                      </div>
                      <div>
                        <h2 className="text-sm font-black text-white">
                          {targetStudent.name}{' '}
                          {targetStudent.id === student.id && '(مستواك)'}
                        </h2>
                        <div className="flex items-center gap-2 mt-1 text-[11px] font-bold text-slate-300">
                          <span>💎 {pts}</span>
                          <span>•</span>
                          <span>🏆 {targetStudent.wins || 0}</span>
                          <span>•</span>
                          <span>🎯 {targetStudent.quizzesCompleted || 0}</span>
                        </div>
                      </div>
                    </div>
                    <div
                      className={`${
                        isLow
                          ? 'bg-rose-500/20 border-rose-400/40 text-rose-300'
                          : 'bg-sky-500/20 border-sky-400/40 text-sky-300'
                      } border px-3 py-1.5 rounded-2xl text-center`}
                    >
                      <p className="text-[10px] font-bold">المستوى</p>
                      <p className="text-lg font-black leading-none mt-0.5">
                        {currentLevel}
                      </p>
                    </div>
                  </div>

                  {/* منحنى الصعود والهبوط الفعلي حسب نتائج التحديات والاختبارات */}
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-sky-300 flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4" />
                        <span>مؤشر الأداء</span>
                      </span>
                      <span className={`text-xs font-black ${statusBadge.color}`}>
                        {statusBadge.text}
                      </span>
                    </div>

                    <svg
                      viewBox="0 0 320 95"
                      className="w-full h-24 overflow-visible"
                    >
                      <defs>
                        <linearGradient
                          id="levelWaveGrad"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor={statusBadge.stroke}
                            stopOpacity="0.35"
                          />
                          <stop
                            offset="100%"
                            stopColor={statusBadge.stroke}
                            stopOpacity="0.0"
                          />
                        </linearGradient>
                      </defs>
                      <path
                        d={`M ${waveX[0]} ${waveHeights[0]} C 52 ${waveHeights[0]}, 55 ${waveHeights[1]}, ${waveX[1]} ${waveHeights[1]} C 105 ${waveHeights[1]}, 110 ${waveHeights[2]}, ${waveX[2]} ${waveHeights[2]} C 160 ${waveHeights[2]}, 165 ${waveHeights[3]}, ${waveX[3]} ${waveHeights[3]} C 215 ${waveHeights[3]}, 220 ${waveHeights[4]}, ${waveX[4]} ${waveHeights[4]} C 270 ${waveHeights[4]}, 275 ${waveHeights[5]}, ${waveX[5]} ${waveHeights[5]} L 295 90 L 25 90 Z`}
                        fill="url(#levelWaveGrad)"
                      />
                      <path
                        d={`M ${waveX[0]} ${waveHeights[0]} C 52 ${waveHeights[0]}, 55 ${waveHeights[1]}, ${waveX[1]} ${waveHeights[1]} C 105 ${waveHeights[1]}, 110 ${waveHeights[2]}, ${waveX[2]} ${waveHeights[2]} C 160 ${waveHeights[2]}, 165 ${waveHeights[3]}, ${waveX[3]} ${waveHeights[3]} C 215 ${waveHeights[3]}, 220 ${waveHeights[4]}, ${waveX[4]} ${waveHeights[4]} C 270 ${waveHeights[4]}, 275 ${waveHeights[5]}, ${waveX[5]} ${waveHeights[5]}`}
                        fill="none"
                        stroke={statusBadge.stroke}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                      />
                      {waveX.map((cx, i) => {
                        const steppedUp = i === 0 || history[i] >= history[i - 1];
                        const dotColor =
                          i === waveX.length - 1
                            ? '#fbbf24'
                            : steppedUp
                            ? '#10b981'
                            : '#f43f5e';
                        return (
                          <circle
                            key={i}
                            cx={cx}
                            cy={waveHeights[i]}
                            r={i === waveX.length - 1 ? 6 : 4.5}
                            fill={dotColor}
                            stroke="#0f172a"
                            strokeWidth="2"
                          />
                        );
                      })}
                    </svg>
                  </div>

                  {!isInspectingOther && (
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-3">
                      <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-2.5 text-xs font-bold text-slate-200 leading-relaxed">
                        {motivationalQuotes[0]}
                      </div>
                    </div>
                  )}
                </div>

                {/* قائمة المتصدرين */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                      <Trophy className="w-4 h-4" />
                      <span>ترتيب المتصدرين</span>
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      اضغط على أي طالب لعرض مؤشر مستواه
                    </span>
                  </div>
                  {[...allStudents]
                    .filter((s) => s.status === 'approved')
                    .sort((a, b) => (b.points || 0) - (a.points || 0))
                    .map((s, idx) => (
                      <div
                        key={s.id}
                        onClick={() => setInspectedStudentId(s.id)}
                        className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition hover:border-sky-500/60 ${
                          targetStudent.id === s.id
                            ? 'bg-sky-950/50 border-sky-400'
                            : s.id === student.id
                            ? 'bg-indigo-950/70 border-indigo-400'
                            : 'bg-slate-900 border-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg">
                            {idx === 0
                              ? '🥇'
                              : idx === 1
                              ? '🥈'
                              : idx === 2
                              ? '🥉'
                              : '🎖️'}
                          </span>
                          <div
                            className={`w-10 h-10 min-w-[40px] min-h-[40px] aspect-square shrink-0 rounded-2xl bg-gradient-to-tr ${
                              colorThemes[s.profileColor || 'indigo']?.bg ||
                              colorThemes.indigo.bg
                            } flex items-center justify-center font-black text-base shadow-md overflow-hidden`}
                          >
                            {s.avatar?.startsWith('data:image') ? (
                              <img
                                src={s.avatar}
                                alt={s.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span>{s.avatar || '👨‍🎓'}</span>
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-black text-white">
                              {s.name} {s.id === student.id && '(أنت)'}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              الانتصارات: {s.wins || 0} 🏆 • الاختبارات:{' '}
                              {s.quizzesCompleted || 0}
                            </p>
                          </div>
                        </div>
                        <span className="bg-amber-500/20 text-amber-300 font-black text-xs px-3 py-1 rounded-xl">
                          💎 {s.points || 0}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            );
          })()}
      </div>

      {/* شريط التنقل السفلي للطالب (3 أقسام رئيسية ثابت بالأسفل دائماً كالتطبيق الأصلي) */}
      <div className="bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-1.5 py-2 grid grid-cols-3 gap-1 shrink-0 z-20">
        <button
          onClick={() => {
            setQuizLesson(null);
            setActiveTab('review');
          }}
          className={`flex flex-col items-center py-2 rounded-2xl text-[10px] font-extrabold cursor-pointer transition ${
            activeTab === 'review'
              ? 'bg-indigo-600/20 text-indigo-300'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4 mb-0.5" />
          <span>المراجعة</span>
        </button>

        <button
          onClick={() => {
            setQuizLesson(null);
            setChallengeSubTab('friends');
            setActiveTab('gamemode');
          }}
          className={`relative flex flex-col items-center py-2 rounded-2xl text-[10px] font-extrabold cursor-pointer transition ${
            activeTab === 'gamemode' || activeTab === 'quiz'
              ? 'bg-rose-600/20 text-rose-300'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {invitedRooms.length > 0 && (
            <span className="absolute top-1 right-4 bg-rose-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow">
              {invitedRooms.length}
            </span>
          )}
          <Swords className="w-4 h-4 mb-0.5" />
          <span>تحديات</span>
        </button>

        <button
          onClick={() => {
            setQuizLesson(null);
            setInspectedStudentId(null);
            setActiveTab('leaderboard');
          }}
          className={`flex flex-col items-center py-2 rounded-2xl text-[10px] font-extrabold cursor-pointer transition ${
            activeTab === 'leaderboard' || activeTab === 'level'
              ? 'bg-amber-500/20 text-amber-300'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Trophy className="w-4 h-4 mb-0.5" />
          <span>المتصدرون</span>
        </button>
      </div>
    </div>
  );
}
