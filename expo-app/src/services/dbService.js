// ============================================================================
// قاعدة البيانات السحابية لتطبيق Expo (React Native + Firebase Cloud Firestore)
// مرتبطة مباشرة بمشروع smart-student-ai-iq وتتزامن بالوقت الفعلي مع جميع الأجهزة
// ============================================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';

const STORAGE_DB_KEY = 'smart_student_db_v1';
const STORAGE_FB_CONFIG = 'smart_student_firebase_config';

export const DEFAULT_FIREBASE_CONFIG = {
  apiKey: 'AIzaSyA-uDV7LxsWI8f8lcLHXrR5TM9pOPXRS7w',
  authDomain: 'smart-student-ai-iq.firebaseapp.com',
  projectId: 'smart-student-ai-iq',
  storageBucket: 'smart-student-ai-iq.firebasestorage.app',
  messagingSenderId: '709243083057',
  appId: '1:709243083057:web:af9bfd5b138f4239187810',
};

export const COLOR_THEMES = {
  indigo: {
    primary: '#6366f1',
    secondary: '#9333ea',
    swatch: '#6366f1',
    label: 'بنفسجي',
  },
  emerald: {
    primary: '#10b981',
    secondary: '#0d9488',
    swatch: '#10b981',
    label: 'أخضر',
  },
  sky: {
    primary: '#0ea5e9',
    secondary: '#2563eb',
    swatch: '#0ea5e9',
    label: 'أزرق',
  },
  amber: {
    primary: '#f59e0b',
    secondary: '#ea580c',
    swatch: '#f59e0b',
    label: 'ذهبي',
  },
  rose: {
    primary: '#f43f5e',
    secondary: '#db2777',
    swatch: '#f43f5e',
    label: 'أحمر وردي',
  },
  pink: {
    primary: '#f472b6',
    secondary: '#d946ef',
    swatch: '#f472b6',
    label: 'وردي',
  },
  lightBrown: {
    primary: '#C89F72',
    secondary: '#A67B51',
    swatch: '#C89F72',
    label: 'بني فاتح',
  },
};

const INITIAL_DATA = {
  adminCredentials: {
    username: 'admin',
    password: '123',
  },
  schools: [
    {
      id: 'sch_1',
      name: 'مدرسة المتفوقين الذكية',
      city: 'بغداد',
      createdAt: Date.now() - 86400000 * 5,
    },
    {
      id: 'sch_2',
      name: 'مدرسة الإبداع العلمي',
      city: 'النجف الأشرف',
      createdAt: Date.now() - 86400000 * 3,
    },
  ],
  stages: [
    { id: 'stg_1', schoolId: 'sch_1', name: 'الصف الخامس الابتدائي' },
    { id: 'stg_2', schoolId: 'sch_1', name: 'الصف السادس الابتدائي' },
    { id: 'stg_3', schoolId: 'sch_1', name: 'الصف الأول المتوسط' },
    { id: 'stg_4', schoolId: 'sch_2', name: 'الصف الخامس الابتدائي' },
  ],
  subjects: [
    {
      id: 'sub_1',
      schoolId: 'sch_1',
      stageId: 'stg_1',
      name: 'العلوم 🔬',
      icon: '🔬',
      color: 'emerald',
      profileColor: 'emerald',
      teacherName: 'أ. أحمد العلمي',
      teacherUsername: 'sci5',
      teacherPassword: '123',
    },
    {
      id: 'sub_2',
      schoolId: 'sch_1',
      stageId: 'stg_1',
      name: 'الرياضيات 📐',
      icon: '📐',
      color: 'indigo',
      profileColor: 'indigo',
      teacherName: 'أ. سارة علي',
      teacherUsername: 'math5',
      teacherPassword: '123',
    },
    {
      id: 'sub_3',
      schoolId: 'sch_1',
      stageId: 'stg_1',
      name: 'اللغة الإنجليزية 🌍',
      icon: '🌍',
      color: 'amber',
      profileColor: 'amber',
      teacherName: 'أ. عمر خالد',
      teacherUsername: 'eng5',
      teacherPassword: '123',
    },
    {
      id: 'sub_5',
      schoolId: 'sch_1',
      stageId: 'stg_1',
      name: 'الإسلامية 🕌',
      icon: '🕌',
      color: 'emerald',
      profileColor: 'emerald',
      teacherName: 'أ. محمد الصادق',
      teacherUsername: 'isl5',
      teacherPassword: '123',
    },
    {
      id: 'sub_6',
      schoolId: 'sch_1',
      stageId: 'stg_1',
      name: 'اللغة العربية 📖',
      icon: '📖',
      color: 'rose',
      profileColor: 'rose',
      teacherName: 'أ. زينب حسن',
      teacherUsername: 'arb5',
      teacherPassword: '123',
    },
    {
      id: 'sub_7',
      schoolId: 'sch_1',
      stageId: 'stg_1',
      name: 'الاجتماعيات 🗺️',
      icon: '🗺️',
      color: 'amber',
      profileColor: 'amber',
      teacherName: 'أ. كرار جاسم',
      teacherUsername: 'soc5',
      teacherPassword: '123',
    },
  ],
  lessons: [
    {
      id: 'les_1',
      schoolId: 'sch_1',
      stageId: 'stg_1',
      subjectId: 'sub_1',
      subjectName: 'العلوم 🔬',
      title: 'البناء الضوئي في النباتات الخضراء 🌱',
      fileType: 'text',
      fileName: 'شرح_البناء_الضوئي.pdf',
      rawText:
        'تقوم النباتات الخضراء بصنع غذائها بنفسها داخل الأوراق بعملية تسمى البناء الضوئي. تحتاج النبتة إلى 4 عناصر أساسية: ضوء الشمس، الماء من التربة عبر الجذور، غاز ثنائي أوكسيد الكربون من الهواء، ومادة الكلوروفيل (اليخضور) التي تعطي الورقة لونها الأخضر. ينتج عن هذه العملية سكر الجلوكوز (غذاء النبات) وغاز الأوكسجين النقي الذي تتنفسه الكائنات الحية.',
      aiSummary:
        'تخيّل أن الورقة الخضراء في النبات هي "مطبخ ذكي" يعمل بالطاقة الشمسية! ☀️🌱\n\nفي هذا المطبخ، يجمع النبات الماء الذي يمتصه من الجذور مع غاز ثنائي أوكسيد الكربون من الهواء، وبمساعدة صبغة الكلوروفيل الخضراء وضوء الشمس، يطبخ غذاءه (السكر) ويطلق لنا هدية ثمينة جداً في الهواء وهي (غاز الأوكسجين) الذي نتنفسه!',
      aiKeyPoints: [
        '🌞 ضوء الشمس هو مصدر الطاقة الأساسي لعملية البناء الضوئي.',
        '🍃 الكلوروفيل (اليخضور) هو الصبغة الخضراء التي تمتص الضوء داخل الورقة.',
        '💧 يمتص النبات الماء والأملاح من التربة بواسطة الجذور ويوصلها للأوراق.',
        '🫧 يأخذ النبات غاز ثنائي أوكسيد الكربون ويطلق غاز الأوكسجين النقي.',
      ],
      aiGoldenTip:
        'تذكّر معادلة المطبخ الأخضر: (شمس + ماء + ثنائي أوكسيد الكربون) ⬅️ يعطينا (غذاء + أوكسجين نتنفسه)!',
      aiQuestions: [
        {
          question:
            'ما هو الغاز المهم الذي يطلقه النبات في الهواء أثناء عملية البناء الضوئي؟',
          options: [
            'غاز النيتروجين',
            'غاز ثنائي أوكسيد الكربون',
            'غاز الأوكسجين',
            'بخار الماء فقط',
          ],
          correctIndex: 2,
          explanation:
            'النبات يأخذ ثنائي أوكسيد الكربون ويطرح لنا غاز الأوكسجين النقي لنتنفسه.',
          difficulty: 'سهل',
        },
        {
          question:
            'ما اسم المادة المسؤولة عن إعطاء أوراق النبات لونها الأخضر وامتصاص ضوء الشمس؟',
          options: [
            'الكلوروفيل (اليخضور)',
            'الجلوكوز',
            'اللحاء',
            'الجذور الوتدية',
          ],
          correctIndex: 0,
          explanation:
            'مادة الكلوروفيل (اليخضور) هي الصبغة الخضراء داخل البلاستيدات الخضراء.',
          difficulty: 'سهل',
        },
        {
          question:
            'أي جزء من أجزاء النبات يُعد المصنع الرئيسي لعملية البناء الضوئي؟',
          options: [
            'الساق الخشبي',
            'الجذور تحت التربة',
            'البذور الجافة',
            'الأوراق الخضراء',
          ],
          correctIndex: 3,
          explanation:
            'الأوراق الخضراء هي المصنع الرئيسي لاحتوائها على الكلوروفيل والثغور.',
          difficulty: 'متوسط',
        },
        {
          question:
            'سؤال الأبطال 🏆: ماذا يحدث لو وضعنا نبتة خضراء في غرفة مظلمة تماماً لعدة أيام؟',
          options: [
            'تزداد سرعة البناء الضوئي',
            'تتوقف عملية البناء الضوئي لعدم وجود ضوء الشمس وتذبل الأوراق',
            'تتحول الجذور إلى أوراق',
            'تنتج كمية مضاعفة من الأوكسجين',
          ],
          correctIndex: 1,
          explanation:
            'بدون ضوء الشمس لا تتوفر الطاقة اللازمة لإتمام تفاعل البناء الضوئي.',
          difficulty: 'تحدي الأبطال',
        },
        {
          question:
            'ما هو الغذاء الذي يصنعه النبات لنفسه في نهاية عملية البناء الضوئي؟',
          options: [
            'ملح الطعام',
            'الحديد الخام',
            'سكر الجلوكوز',
            'النشا الصناعي فقط',
          ],
          correctIndex: 2,
          explanation:
            'يصنع النبات سكر الجلوكوز كغذاء له ويطلق غاز الأوكسجين في الهواء.',
          difficulty: 'متوسط',
        },
      ],
      createdAt: Date.now() - 3600000 * 5,
    },
    {
      id: 'les_2',
      schoolId: 'sch_1',
      stageId: 'stg_1',
      subjectId: 'sub_2',
      subjectName: 'الرياضيات 📐',
      title: 'الكسور الاعتيادية ومقارنتها 🍕',
      fileType: 'text',
      fileName: 'شرح_الكسور.txt',
      rawText:
        'الكسر الاعتيادي يتكون من بسط في الأعلى ومقام في الأسفل ويفصل بينهما خط الكسر. المقام يمثل العدد الكلي للأجزاء المتساوية، بينما البسط يمثل الجزء المأخوذ أو الملون. عند مقارنة كسرين لهما نفس المقام، فإن الكسر صاحب البسط الأكبر هو الأكبر.',
      aiSummary:
        'تخيّل أن لديك بيتزا لذيذة قسّمتها إلى 8 قطع متساوية! 🍕\n\nالرقم الكلي للقطع (8) نكتبه في الأسفل ونسميه (المقام)، وعدد القطع التي أكلتها (مثلاً 3) نكتبه في الأعلى ونسميه (البسط) فيصبح الكسر (3/8). وعندما تتساوى المقامات، فصاحب البسط الأكبر هو الفائز بالحصة الأكبر!',
      aiKeyPoints: [
        '⬆️ البسط: يكتب فوق خط الكسر ويمثل عدد الأجزاء المختارة.',
        '⬇️ المقام: يكتب تحت خط الكسر ويمثل العدد الكلي للأجزاء المتساوية.',
        '⚖️ إذا تساوت المقامات: الكسر ذو البسط الأكبر هو الأكبر (مثلاً 5/7 أكبر من 2/7).',
        '✨ الكسر الذي بسطه يساوي مقامه يساوي واحداً صحيحاً (مثلاً 4/4 = 1).',
      ],
      aiGoldenTip: 'البسط (في السماء فوق ☁️) والمقام (في المقام بالأسفل 🌱)!',
      aiQuestions: [
        {
          question: 'في الكسر (3 / 8)، ماذا نسمي الرقم 8 الموجود في الأسفل؟',
          options: ['البسط', 'المقام', 'الناتج العشري', 'العدد الصحيح'],
          correctIndex: 1,
          explanation:
            'الرقم الموجود أسفل خط الكسر يسمى المقام ويمثل العدد الكلي للأجزاء.',
          difficulty: 'سهل',
        },
        {
          question: 'أي الكسرين أكبر: (6 / 9) أم (2 / 9)؟',
          options: [
            '2 / 9 أكبر',
            'الكسران متساويان',
            'لا يمكن المقارنة',
            '6 / 9 أكبر',
          ],
          correctIndex: 3,
          explanation:
            'بما أن المقام متساوٍ (9)، فإن الكسر صاحب البسط الأكبر (6) هو الأكبر.',
          difficulty: 'سهل',
        },
        {
          question: 'ماذا نسمي الرقم الذي يُكتب فوق خط الكسر؟',
          options: ['البسط', 'المقام', 'المقسوم عليه', 'الجذر'],
          correctIndex: 0,
          explanation: 'الرقم المكتوب في الأعلى فوق خط الكسر يسمى البسط.',
          difficulty: 'سهل',
        },
        {
          question: 'كم يساوي الكسر (7 / 7) عندما يتساوى البسط والمقام؟',
          options: ['صفر', '70', '1 صحيح', 'نصف'],
          correctIndex: 2,
          explanation:
            'إذا تساوى البسط مع المقام فإن قيمة الكسر تساوي واحداً صحيحاً (1).',
          difficulty: 'متوسط',
        },
        {
          question:
            'سؤال الأبطال 🏆: إذا أكل جعفر (4 / 4) من كعكة، فكم تبقى من الكعكة؟',
          options: [
            'نصف الكعكة',
            'صفر (أكل الكعكة كاملة = 1 صحيح)',
            'ربع الكعكة',
            'ثلاثة أرباع',
          ],
          correctIndex: 1,
          explanation:
            'لأن 4/4 تساوي 1 صحيح، أي الكعكة بالكامل، فلم يتبقَّ شيء (صفر).',
          difficulty: 'تحدي الأبطال',
        },
      ],
      createdAt: Date.now() - 3600000 * 2,
    },
  ],
  students: [
    {
      id: 'std_1',
      name: 'جعفر امين',
      code: '1234',
      avatar: '👨‍🎓',
      profileColor: 'indigo',
      schoolId: 'sch_1',
      stageId: 'stg_1',
      status: 'approved',
      points: 120,
      wins: 2,
      quizzesCompleted: 3,
      level: 4,
      performanceHistory: [42, 48, 45, 54, 50, 62],
      createdAt: Date.now() - 86400000 * 2,
    },
    {
      id: 'std_2',
      name: 'علي حيدر',
      code: '1234',
      avatar: '🦁',
      profileColor: 'amber',
      schoolId: 'sch_1',
      stageId: 'stg_1',
      status: 'pending',
      points: 0,
      wins: 0,
      quizzesCompleted: 0,
      level: 3,
      performanceHistory: [40, 45, 42, 48, 45, 50],
      createdAt: Date.now() - 1800000,
    },
    {
      id: 'std_3',
      name: 'فاطمة الزهراء',
      code: '1234',
      avatar: '👩‍🎓',
      profileColor: 'rose',
      schoolId: 'sch_1',
      stageId: 'stg_1',
      status: 'approved',
      points: 95,
      wins: 1,
      quizzesCompleted: 2,
      level: 5,
      performanceHistory: [52, 66, 62, 75, 80, 85],
      createdAt: Date.now() - 86400000,
    },
    {
      id: 'std_4',
      name: 'حسين كرار',
      code: '1234',
      avatar: '🚀',
      profileColor: 'sky',
      schoolId: 'sch_1',
      stageId: 'stg_1',
      status: 'approved',
      points: 88,
      wins: 1,
      quizzesCompleted: 2,
      level: 4,
      performanceHistory: [46, 75, 48, 78, 45, 74],
      createdAt: Date.now() - 72000000,
    },
    {
      id: 'std_5',
      name: 'أحمد محمد',
      code: '1234',
      avatar: '🤖',
      profileColor: 'emerald',
      schoolId: 'sch_1',
      stageId: 'stg_1',
      status: 'approved',
      points: 76,
      wins: 0,
      quizzesCompleted: 3,
      level: 3,
      performanceHistory: [64, 52, 68, 50, 65, 56],
      createdAt: Date.now() - 64000000,
    },
    {
      id: 'std_6',
      name: 'زينب علي',
      code: '1234',
      avatar: '⭐',
      profileColor: 'amber',
      schoolId: 'sch_1',
      stageId: 'stg_1',
      status: 'approved',
      points: 64,
      wins: 0,
      quizzesCompleted: 2,
      level: 2,
      performanceHistory: [68, 58, 52, 44, 38, 30],
      createdAt: Date.now() - 50000000,
    },
  ],
  rooms: [],
};

let memoryState = INITIAL_DATA;
let firestoreDb = null;
const subscribers = new Set();

export async function loadInitialLocalCache() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_DB_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.schools)) {
        memoryState = parsed;
        notifySubscribers();
      }
    } else {
      await AsyncStorage.setItem(STORAGE_DB_KEY, JSON.stringify(INITIAL_DATA));
    }
  } catch (e) {
    // fallback to memoryState
  }
}

export function initFirebaseIfConfigured() {
  try {
    const config = DEFAULT_FIREBASE_CONFIG;
    if (!config || !config.apiKey || !config.projectId) return false;

    const app = getApps().length === 0 ? initializeApp(config) : getApps()[0];
    firestoreDb = getFirestore(app);

    const stateDocRef = doc(firestoreDb, 'smart_student_app', 'global_state');
    onSnapshot(
      stateDocRef,
      (snap) => {
        if (snap.exists()) {
          const cloudData = snap.data();
          if (cloudData && cloudData.schools) {
            memoryState = cloudData;
            AsyncStorage.setItem(
              STORAGE_DB_KEY,
              JSON.stringify(cloudData)
            ).catch(() => {});
            notifySubscribers();
          }
        } else {
          const cleanInitial = JSON.parse(JSON.stringify(getDatabaseState()));
          setDoc(stateDocRef, cleanInitial).catch(() => {});
        }
      },
      (err) => {
        console.warn('Firestore snapshot listener warning:', err);
      }
    );

    return true;
  } catch (err) {
    console.warn('Firebase init error:', err);
    return false;
  }
}

export function isFirebaseConnected() {
  return Boolean(firestoreDb);
}

export function getDatabaseState() {
  return memoryState;
}

function saveDatabaseState(newState) {
  memoryState = newState;
  AsyncStorage.setItem(STORAGE_DB_KEY, JSON.stringify(newState)).catch(
    () => {}
  );
  if (firestoreDb) {
    const stateDocRef = doc(firestoreDb, 'smart_student_app', 'global_state');
    const cleanState = JSON.parse(JSON.stringify(newState));
    setDoc(stateDocRef, cleanState).catch((e) =>
      console.warn('Firestore sync error:', e)
    );
  }
  notifySubscribers();
}

function notifySubscribers() {
  const state = getDatabaseState();
  subscribers.forEach((cb) => cb(state));
}

export function subscribeToDatabase(callback) {
  subscribers.add(callback);
  callback(getDatabaseState());
  return () => subscribers.delete(callback);
}

export function resetDemoDatabase() {
  saveDatabaseState(INITIAL_DATA);
}

export function addSchool({ name, city }) {
  const state = getDatabaseState();
  const newSchool = {
    id: 'sch_' + Date.now(),
    name: name.trim(),
    city: (city || 'العراق').trim(),
    createdAt: Date.now(),
  };
  saveDatabaseState({
    ...state,
    schools: [...state.schools, newSchool],
  });
  return newSchool;
}

export function deleteSchool(schoolId) {
  const state = getDatabaseState();
  saveDatabaseState({
    ...state,
    schools: state.schools.filter((s) => s.id !== schoolId),
    stages: state.stages.filter((st) => st.schoolId !== schoolId),
    subjects: state.subjects.filter((sub) => sub.schoolId !== schoolId),
  });
}

export function addStage({ schoolId, name }) {
  const state = getDatabaseState();
  const newStage = {
    id: 'stg_' + Date.now(),
    schoolId,
    name: name.trim(),
  };
  saveDatabaseState({
    ...state,
    stages: [...state.stages, newStage],
  });
  return newStage;
}

export function deleteStage(stageId) {
  const state = getDatabaseState();
  saveDatabaseState({
    ...state,
    stages: state.stages.filter((st) => st.id !== stageId),
    subjects: state.subjects.filter((sub) => sub.stageId !== stageId),
  });
}

export function addSubject({
  schoolId,
  stageId,
  name,
  icon = '📚',
  teacherName,
  teacherUsername,
  teacherPassword,
}) {
  const state = getDatabaseState();
  const colors = ['emerald', 'indigo', 'amber', 'rose', 'sky'];
  const pickedColor = colors[state.subjects.length % colors.length];
  const newSubject = {
    id: 'sub_' + Date.now(),
    schoolId,
    stageId,
    name: name.trim(),
    icon,
    color: pickedColor,
    profileColor: pickedColor,
    teacherName: (teacherName || 'أستاذ المادة').trim(),
    teacherUsername: teacherUsername.trim(),
    teacherPassword: teacherPassword.trim(),
  };
  saveDatabaseState({
    ...state,
    subjects: [...state.subjects, newSubject],
  });
  return newSubject;
}

export function deleteSubject(subjectId) {
  const state = getDatabaseState();
  saveDatabaseState({
    ...state,
    subjects: state.subjects.filter((sub) => sub.id !== subjectId),
  });
}

export function updateStudentJoinStatus(studentId, newStatus) {
  const state = getDatabaseState();
  const updatedStudents = state.students.map((std) =>
    std.id === studentId ? { ...std, status: newStatus } : std
  );
  saveDatabaseState({
    ...state,
    students: updatedStudents,
  });
}

export function loginAdmin(username, password) {
  const state = getDatabaseState();
  if (
    username.trim().toLowerCase() ===
      state.adminCredentials.username.toLowerCase() &&
    password.trim() === state.adminCredentials.password
  ) {
    return { role: 'admin', name: 'مدير النظام العام' };
  }
  return null;
}

export function loginTeacherBySubject(username, password) {
  const state = getDatabaseState();
  const subject = state.subjects.find(
    (s) =>
      s.teacherUsername.toLowerCase() === username.trim().toLowerCase() &&
      s.teacherPassword === password.trim()
  );
  if (!subject) return null;

  const school = state.schools.find((sc) => sc.id === subject.schoolId);
  const stage = state.stages.find((st) => st.id === subject.stageId);

  return {
    role: 'teacher',
    subjectId: subject.id,
    subjectName: subject.name,
    subjectIcon: subject.icon,
    teacherName: subject.teacherName,
    schoolId: subject.schoolId,
    schoolName: school?.name || 'المدرسة',
    stageId: subject.stageId,
    stageName: stage?.name || 'المرحلة',
  };
}

export function loginOrRegisterStudent(name, code) {
  const state = getDatabaseState();
  const cleanName = name.trim();
  const cleanCode = code.trim();

  let existing = state.students.find(
    (s) => s.name.trim() === cleanName && s.code === cleanCode
  );

  const sameNameDifferentCode = state.students.find(
    (s) => s.name.trim() === cleanName && s.code !== cleanCode
  );
  if (sameNameDifferentCode) {
    return {
      error: 'هذا الاسم مسجل مسبقاً برمز سري مختلف! تأكد من الرمز السري.',
    };
  }

  if (!existing) {
    existing = {
      id: 'std_' + Date.now(),
      name: cleanName,
      code: cleanCode,
      avatar: '👨‍🎓',
      profileColor: 'indigo',
      schoolId: null,
      stageId: null,
      status: 'none',
      points: 0,
      wins: 0,
      quizzesCompleted: 0,
      level: 3,
      performanceHistory: [42, 48, 45, 52, 48, 56],
      createdAt: Date.now(),
    };
    saveDatabaseState({
      ...state,
      students: [...state.students, existing],
    });
  }

  return { student: existing };
}

export function requestStudentJoinSchoolStage(studentId, schoolId, stageId) {
  const state = getDatabaseState();
  const updated = state.students.map((s) =>
    s.id === studentId
      ? { ...s, schoolId, stageId, status: 'pending', requestedAt: Date.now() }
      : s
  );
  saveDatabaseState({
    ...state,
    students: updated,
  });
}

export function updateStudentProfile(
  studentId,
  { name, code, avatar, profileColor }
) {
  const state = getDatabaseState();
  const cleanName = name ? name.trim() : '';
  const cleanCode = code ? code.trim() : '';

  if (!cleanName || !cleanCode) {
    return { error: 'يرجى إدخال الاسم وكلمة السر!' };
  }

  const duplicate = state.students.find(
    (s) => s.id !== studentId && s.name.trim() === cleanName
  );
  if (duplicate) {
    return { error: 'هذا الاسم مستخدم لطالب آخر بالفعل!' };
  }

  const updated = state.students.map((s) =>
    s.id === studentId
      ? {
          ...s,
          name: cleanName,
          code: cleanCode,
          avatar: avatar || s.avatar || '👨‍🎓',
          profileColor: profileColor || s.profileColor || 'indigo',
        }
      : s
  );
  saveDatabaseState({
    ...state,
    students: updated,
  });
  return { success: true };
}

export function updateTeacherProfile(
  subjectId,
  { teacherName, teacherPassword, icon, profileColor }
) {
  const state = getDatabaseState();
  const cleanName = teacherName ? teacherName.trim() : '';
  const cleanPass = teacherPassword ? teacherPassword.trim() : '';

  if (!cleanName || !cleanPass) {
    return { error: 'يرجى إدخال الاسم والرمز السري!' };
  }

  const updatedSubjects = state.subjects.map((sub) =>
    sub.id === subjectId
      ? {
          ...sub,
          teacherName: cleanName,
          teacherPassword: cleanPass,
          icon: icon || sub.icon || '👨‍🏫',
          profileColor:
            profileColor || sub.profileColor || sub.color || 'emerald',
        }
      : sub
  );

  saveDatabaseState({
    ...state,
    subjects: updatedSubjects,
  });
  return { success: true };
}

export function addSmartLesson({
  schoolId,
  stageId,
  subjectId,
  subjectName,
  title,
  fileType,
  fileName,
  rawText,
  imagePreview,
  aiData,
}) {
  const state = getDatabaseState();
  const newLesson = {
    id: 'les_' + Date.now(),
    schoolId,
    stageId,
    subjectId,
    subjectName,
    title: title.trim(),
    fileType: fileType || 'text',
    fileName: fileName || '',
    rawText: rawText || '',
    imagePreview: imagePreview || null,
    aiSummary: aiData.summary,
    aiKeyPoints: aiData.keyPoints || [],
    aiGoldenTip: aiData.goldenTip || '',
    aiQuestions: aiData.questions || [],
    generatedBy: aiData.generatedBy || 'AI',
    createdAt: Date.now(),
  };

  saveDatabaseState({
    ...state,
    lessons: [newLesson, ...state.lessons],
  });
  return newLesson;
}

export function deleteLesson(lessonId) {
  const state = getDatabaseState();
  saveDatabaseState({
    ...state,
    lessons: state.lessons.filter((l) => l.id !== lessonId),
  });
}

function appendPerformanceStep(prevHistory, perfDelta) {
  const base =
    Array.isArray(prevHistory) && prevHistory.length >= 6
      ? prevHistory.slice(-6)
      : [42, 48, 45, 54, 50, 62];
  const lastVal = base[base.length - 1];

  if (perfDelta > 0) {
    if (lastVal + perfDelta > 94) {
      const shiftDown = lastVal + perfDelta - 92;
      const shifted = base
        .slice(-5)
        .map((v) => Math.max(18, Math.round(v - shiftDown)));
      const newTop = Math.min(95, shifted[shifted.length - 1] + perfDelta);
      return [...shifted, newTop];
    }
    return [...base.slice(-5), Math.min(95, lastVal + perfDelta)];
  }

  if (perfDelta < 0) {
    if (lastVal + perfDelta < 18) {
      const shiftUp = 20 - (lastVal + perfDelta);
      const shifted = base
        .slice(-5)
        .map((v) => Math.min(90, Math.round(v + shiftUp)));
      const newBottom = Math.max(15, shifted[shifted.length - 1] + perfDelta);
      return [...shifted, newBottom];
    }
    return [...base.slice(-5), Math.max(15, lastVal + perfDelta)];
  }

  return base;
}

export function addPointsToStudent(
  studentId,
  deltaPoints,
  isWin = false,
  isQuiz = false
) {
  const state = getDatabaseState();
  const updated = state.students.map((s) => {
    if (s.id !== studentId) return s;
    const prevHistory =
      Array.isArray(s.performanceHistory) && s.performanceHistory.length >= 6
        ? s.performanceHistory
        : [42, 48, 45, 54, 50, 62];
    const lastVal = prevHistory[prevHistory.length - 1];
    const currentLvl =
      typeof s.level === 'number'
        ? s.level
        : Math.max(1, Math.round(lastVal / 16));

    let perfDelta = 0;
    let levelDelta = 0;
    if (isQuiz) {
      if (deltaPoints >= 12) {
        perfDelta = deltaPoints === 20 ? 18 : deltaPoints === 16 ? 15 : 12;
        levelDelta = 1;
      } else {
        perfDelta = deltaPoints <= 4 ? -18 : -14;
        levelDelta = -1;
      }
    } else if (isWin) {
      perfDelta = 18;
      levelDelta = 1;
    }

    const updatedHistory =
      perfDelta !== 0
        ? appendPerformanceStep(prevHistory, perfDelta)
        : prevHistory;

    return {
      ...s,
      points: (s.points || 0) + deltaPoints,
      wins: isWin ? (s.wins || 0) + 1 : s.wins || 0,
      quizzesCompleted: isQuiz
        ? (s.quizzesCompleted || 0) + 1
        : s.quizzesCompleted || 0,
      level: Math.max(1, currentLvl + levelDelta),
      performanceHistory: updatedHistory,
    };
  });
  saveDatabaseState({
    ...state,
    students: updated,
  });
}

export function createChallengeRoom({
  hostStudent,
  lesson,
  challengeTier = 'standard',
}) {
  const state = getDatabaseState();
  const code = String(Math.floor(1000 + Math.random() * 9000));
  const rewardPoints = challengeTier === 'champions' ? 100 : 50;

  const newRoom = {
    id: 'room_' + Date.now(),
    roomCode: code,
    schoolId: hostStudent.schoolId,
    stageId: hostStudent.stageId,
    lessonId: lesson.id,
    lessonTitle: lesson.title,
    subjectName: lesson.subjectName,
    challengeTier,
    rewardPoints,
    hostId: hostStudent.id,
    hostName: hostStudent.name,
    status: 'waiting',
    currentQuestionIndex: 0,
    questionStartedAt: null,
    questions: lesson.aiQuestions || [],
    players: [
      {
        id: hostStudent.id,
        name: hostStudent.name,
        score: 0,
        correctCount: 0,
        lastAnsweredQuestion: -1,
        isBot: false,
      },
    ],
    winnerId: null,
    winnerName: null,
    createdAt: Date.now(),
  };

  saveDatabaseState({
    ...state,
    rooms: [newRoom, ...state.rooms],
  });
  return newRoom;
}

export function inviteStudentToChallengeRoom(roomId, friendStudent) {
  if (!roomId || !friendStudent) return;
  const state = getDatabaseState();
  const updatedRooms = state.rooms.map((r) => {
    if (r.id !== roomId) return r;
    if (r.players.some((p) => p.id === friendStudent.id)) {
      return r;
    }
    return {
      ...r,
      players: [
        ...r.players,
        {
          id: friendStudent.id,
          name: friendStudent.name,
          avatar: friendStudent.avatar || '👨‍🎓',
          score: 0,
          correctCount: 0,
          lastAnsweredQuestion: -1,
          isBot: false,
          isInvitedFriend: true,
        },
      ],
    };
  });
  saveDatabaseState({ ...state, rooms: updatedRooms });
}

export function addBotToChallengeRoom(roomId) {
  const state = getDatabaseState();
  const botNames = [
    'أحمد الذكي 🤖',
    'زينب المتفوقة 🤖',
    'يوسف السريع 🤖',
    'مريم البطلة 🤖',
  ];
  const updatedRooms = state.rooms.map((r) => {
    if (r.id !== roomId) return r;
    const pickedName = botNames[r.players.length % botNames.length];
    return {
      ...r,
      players: [
        ...r.players,
        {
          id:
            'bot_' +
            Date.now() +
            '_' +
            Math.random().toString(36).slice(2, 5),
          name: pickedName,
          score: 0,
          correctCount: 0,
          lastAnsweredQuestion: -1,
          isBot: true,
        },
      ],
    };
  });
  saveDatabaseState({ ...state, rooms: updatedRooms });
}

export function startChallengeGame(roomId) {
  const state = getDatabaseState();
  const updatedRooms = state.rooms.map((r) =>
    r.id === roomId
      ? {
          ...r,
          status: 'playing',
          currentQuestionIndex: 0,
          questionStartedAt: Date.now(),
        }
      : r
  );
  saveDatabaseState({ ...state, rooms: updatedRooms });
}

export function submitPlayerRoomAnswer({
  roomId,
  playerId,
  questionIndex,
  isCorrect,
  timeRemainingSec,
}) {
  const state = getDatabaseState();
  const speedBonus = isCorrect
    ? Math.max(10, Math.round(timeRemainingSec * 12))
    : 0;
  const pointsEarned = isCorrect ? 100 + speedBonus : 0;

  const updatedRooms = state.rooms.map((r) => {
    if (r.id !== roomId) return r;

    const updatedPlayers = r.players.map((p) => {
      if (p.id === playerId && p.lastAnsweredQuestion < questionIndex) {
        return {
          ...p,
          score: p.score + pointsEarned,
          correctCount: isCorrect ? p.correctCount + 1 : p.correctCount,
          lastAnsweredQuestion: questionIndex,
        };
      }
      if (
        (p.isBot || p.isInvitedFriend) &&
        p.id !== playerId &&
        p.lastAnsweredQuestion < questionIndex
      ) {
        const botCorrect = Math.random() > 0.32;
        const botPoints = botCorrect
          ? 100 + Math.floor(Math.random() * 110)
          : 0;
        return {
          ...p,
          score: p.score + botPoints,
          correctCount: botCorrect ? p.correctCount + 1 : p.correctCount,
          lastAnsweredQuestion: questionIndex,
        };
      }
      return p;
    });

    return {
      ...r,
      players: updatedPlayers,
    };
  });

  saveDatabaseState({ ...state, rooms: updatedRooms });
}

export function advanceOrFinishChallengeRoom(roomId) {
  const state = getDatabaseState();
  const rankRewards = {};

  const updatedRooms = state.rooms.map((r) => {
    if (r.id !== roomId) return r;
    const nextIdx = r.currentQuestionIndex + 1;
    if (nextIdx < r.questions.length) {
      return {
        ...r,
        currentQuestionIndex: nextIdx,
        questionStartedAt: Date.now(),
      };
    } else {
      const sorted = [...r.players].sort((a, b) => b.score - a.score);
      const winner = sorted[0];
      const totalQ = Math.max(1, (r.questions || []).length);
      if (!r.winnerId) {
        sorted.forEach((p, idx) => {
          const pts = idx === 0 ? 50 : idx === 1 ? 25 : idx === 2 ? 10 : 0;
          const correctRatio = (p.correctCount || 0) / totalQ;
          let perfDelta = 0;
          let levelDelta = 0;
          if (correctRatio >= 0.6 || (idx === 0 && correctRatio >= 0.4)) {
            perfDelta = correctRatio >= 0.8 ? 18 : 14;
            levelDelta = 1;
          } else {
            perfDelta = correctRatio <= 0.2 ? -18 : -14;
            levelDelta = -1;
          }
          if (!p.isBot) {
            rankRewards[p.id] = {
              points: pts,
              isWin: idx === 0,
              perfDelta,
              levelDelta,
            };
          }
        });
      }
      const playersWithReward = sorted.map((p, idx) => ({
        ...p,
        rewardPoints: idx === 0 ? 50 : idx === 1 ? 25 : idx === 2 ? 10 : 0,
      }));
      return {
        ...r,
        status: 'finished',
        players: playersWithReward,
        winnerId: winner?.id || null,
        winnerName: winner?.name || 'تعادل',
      };
    }
  });

  const updatedStudents = state.students.map((s) => {
    const reward = rankRewards[s.id];
    if (!reward) return s;
    const prevHistory =
      Array.isArray(s.performanceHistory) && s.performanceHistory.length >= 6
        ? s.performanceHistory
        : [42, 48, 45, 54, 50, 62];
    const lastVal = prevHistory[prevHistory.length - 1];
    const currentLvl =
      typeof s.level === 'number'
        ? s.level
        : Math.max(1, Math.round(lastVal / 16));
    return {
      ...s,
      points: (s.points || 0) + reward.points,
      wins: reward.isWin ? (s.wins || 0) + 1 : s.wins || 0,
      level: Math.max(1, currentLvl + (reward.levelDelta || 0)),
      performanceHistory: appendPerformanceStep(
        prevHistory,
        reward.perfDelta || 0
      ),
    };
  });

  saveDatabaseState({
    ...state,
    rooms: updatedRooms,
    students: updatedStudents,
  });
}
