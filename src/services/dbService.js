// ============================================================================
// قاعدة البيانات الموحدة (Firebase Firestore + مزامنة لحظية فورية)
// مصممة لتعمل مباشرة في المتصفح وتنتقل نسخ-ولصق إلى Expo (React Native)
// ============================================================================

import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  onSnapshot,
} from 'firebase/firestore';

const STORAGE_DB_KEY = 'smart_student_db_v1';
const STORAGE_FB_CONFIG = 'smart_student_firebase_config';
const STORAGE_AI_KEY = 'smart_student_gemini_api_key';
const CHANNEL_NAME = 'smart_student_realtime_channel';

const INITIAL_DATA = {
  adminCredentials: {
    username: 'MUJTABAmk2016',
    password: 'MK@@smart$',
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
      teacherName: 'أ. كرار جاسم',
      teacherUsername: 'soc5',
      teacherPassword: '123',
    },
    {
      id: 'sub_4',
      schoolId: 'sch_1',
      stageId: 'stg_3',
      name: 'الفيزياء والعلوم ⚡',
      icon: '⚡',
      color: 'rose',
      teacherName: 'أ. حيدر كريم',
      teacherUsername: 'phy1',
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
          question: 'ما هو الغاز المهم الذي يطلقه النبات في الهواء أثناء عملية البناء الضوئي؟',
          options: ['غاز النيتروجين', 'غاز ثنائي أوكسيد الكربون', 'غاز الأوكسجين', 'بخار الماء فقط'],
          correctIndex: 2,
          explanation: 'النبات يأخذ ثنائي أوكسيد الكربون ويطرح لنا غاز الأوكسجين النقي لنتنفسه.',
          difficulty: 'سهل',
        },
        {
          question: 'ما اسم المادة المسؤولة عن إعطاء أوراق النبات لونها الأخضر وامتصاص ضوء الشمس؟',
          options: ['الكلوروفيل (اليخضور)', 'الجلوكوز', 'اللحاء', 'الجذور الوتدية'],
          correctIndex: 0,
          explanation: 'مادة الكلوروفيل (اليخضور) هي الصبغة الخضراء داخل البلاستيدات الخضراء.',
          difficulty: 'سهل',
        },
        {
          question: 'أي جزء من أجزاء النبات يُعد المصنع الرئيسي لعملية البناء الضوئي؟',
          options: ['الساق الخشبي', 'الجذور تحت التربة', 'البذور الجافة', 'الأوراق الخضراء'],
          correctIndex: 3,
          explanation: 'الأوراق الخضراء هي المصنع الرئيسي لاحتوائها على الكلوروفيل والثغور.',
          difficulty: 'متوسط',
        },
        {
          question: 'سؤال الأبطال 🏆: ماذا يحدث لو وضعنا نبتة خضراء في غرفة مظلمة تماماً لعدة أيام؟',
          options: [
            'تزداد سرعة البناء الضوئي',
            'تتوقف عملية البناء الضوئي لعدم وجود ضوء الشمس وتذبل الأوراق',
            'تتحول الجذور إلى أوراق',
            'تنتج كمية مضاعفة من الأوكسجين',
          ],
          correctIndex: 1,
          explanation: 'بدون ضوء الشمس لا تتوفر الطاقة اللازمة لإتمام تفاعل البناء الضوئي.',
          difficulty: 'تحدي الأبطال',
        },
        {
          question: 'ما هو الغذاء الذي يصنعه النبات لنفسه في نهاية عملية البناء الضوئي؟',
          options: ['ملح الطعام', 'الحديد الخام', 'سكر الجلوكوز', 'النشا الصناعي فقط'],
          correctIndex: 2,
          explanation: 'يصنع النبات سكر الجلوكوز كغذاء له ويطلق غاز الأوكسجين في الهواء.',
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
          explanation: 'الرقم الموجود أسفل خط الكسر يسمى المقام ويمثل العدد الكلي للأجزاء.',
          difficulty: 'سهل',
        },
        {
          question: 'أي الكسرين أكبر: (6 / 9) أم (2 / 9)؟',
          options: ['2 / 9 أكبر', 'الكسران متساويان', 'لا يمكن المقارنة', '6 / 9 أكبر'],
          correctIndex: 3,
          explanation: 'بما أن المقام متساوٍ (9)، فإن الكسر صاحب البسط الأكبر (6) هو الأكبر.',
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
          explanation: 'إذا تساوى البسط مع المقام فإن قيمة الكسر تساوي واحداً صحيحاً (1).',
          difficulty: 'متوسط',
        },
        {
          question: 'سؤال الأبطال 🏆: إذا أكل جعفر (4 / 4) من كعكة، فكم تبقى من الكعكة؟',
          options: ['نصف الكعكة', 'صفر (أكل الكعكة كاملة = 1 صحيح)', 'ربع الكعكة', 'ثلاثة أرباع'],
          correctIndex: 1,
          explanation: 'لأن 4/4 تساوي 1 صحيح، أي الكعكة بالكامل، فلم يتبقَّ شيء (صفر).',
          difficulty: 'تحدي الأبطال',
        },
      ],
      createdAt: Date.now() - 3600000 * 2,
    },
    {
      id: 'les_3',
      schoolId: 'sch_1',
      stageId: 'stg_1',
      subjectId: 'sub_5',
      subjectName: 'الإسلامية 🕌',
      title: 'آداب التعامل والصدق والأمانة 🌟',
      fileType: 'text',
      fileName: 'الصدق_والأمانة.txt',
      rawText:
        'الصدق والأمانة من أعظم الأخلاق الإسلامية التي أمرنا الله تعالى بها. المسلم الصادق يقول الحق دائماً ولا يكذب، والمسلم الأمين يحفظ الودائع ويؤدي واجباته بإخلاص.',
      aiSummary:
        'الصدق والأمانة هما جناحا المسلم الناجح والمحبوب! 🕌✨\n\nعندما نكون صادقين في أقوالنا وأمناء في حفظ أسرار وحاجات الآخرين، يرضى الله عنا ويحبنا الناس جميعاً.',
      aiKeyPoints: [
        '🌟 الصدق يهدي إلى البر والخير دائماً.',
        '🤝 الأمانة تشمل حفظ الودائع وإتقان الدراسة والعمل.',
        '💖 المسلم الصادق الأمين ينال محبة الله والناس.',
      ],
      aiGoldenTip: 'تذكّر: الصدق منجاة، والأمانة خلق الأنبياء والصالحين!',
      aiQuestions: [
        {
          question: 'ما الصفة التي يُعرف بها المسلم الذي يقول الحق دائماً؟',
          options: ['المتسرع', 'الكسول', 'الصادق', 'المتكبر'],
          correctIndex: 2,
          explanation: 'قول الحق دائماً هو خلق الصدق ويُسمى صاحبه بالصادق.',
          difficulty: 'سهل',
        },
        {
          question: 'إذا استأمنك صديقك على كتابه، ماذا تفعل؟',
          options: [
            'أهمله وأتركه',
            'أحافظ عليه وأعيده له سالماً',
            'أكتب عليه بالقلم',
            'أنساه في الساحة',
          ],
          correctIndex: 1,
          explanation: 'من الأمانة المحافظة على حاجات الآخرين وإعادتها لأصحابها سالمة.',
          difficulty: 'سهل',
        },
        {
          question: 'إلى أي شيء يهدي الصدق كما علمنا ديننا الإسلامي؟',
          options: ['يؤدي إلى الخسارة', 'يغضب الأصدقاء', 'لا فائدة منه', 'يهدي إلى البر والخير والجنة'],
          correctIndex: 3,
          explanation: 'إن الصدق يهدي إلى البر وإن البر يهدي إلى الجنة.',
          difficulty: 'سهل',
        },
        {
          question: 'ما هو ضد خلق الصدق الذي يجب على المسلم الابتعاد عنه؟',
          options: ['الكذب', 'الأمانة', 'التعاون', 'الإخلاص'],
          correctIndex: 0,
          explanation: 'الكذب هو ضد الصدق، والمسلم الحق يبتعد عن الكذب دائماً.',
          difficulty: 'متوسط',
        },
        {
          question: 'سؤال الأبطال 🏆: هل تقتصر الأمانة على حفظ الأموال فقط؟',
          options: [
            'نعم، تشمل النقود فقط',
            'الأمانة خاصة بالكبار فقط',
            'لا، بل تشمل إتقان الدراسة وحفظ الأسرار وأداء الواجبات أيضاً',
            'لا علاقة للأمانة بالمدرسة',
          ],
          correctIndex: 2,
          explanation: 'الأمانة خلق شامل يضم حفظ الودائع والأسرار وإتقان العلم والعمل.',
          difficulty: 'تحدي الأبطال',
        },
      ],
      createdAt: Date.now() - 3600000,
    },
    {
      id: 'les_4',
      schoolId: 'sch_1',
      stageId: 'stg_1',
      subjectId: 'sub_6',
      subjectName: 'اللغة العربية 📖',
      title: 'أقسام الكلام (الاسم والفعل والحرف) ✍️',
      fileType: 'text',
      fileName: 'اقسام_الكلام.txt',
      rawText:
        'ينقسم الكلام في اللغة العربية إلى ثلاثة أقسام: الاسم وهو ما دل على إنسان أو حيوان أو نبات أو جماد، والفعل وهو ما دل على حدث مقترن بزمن (ماضٍ، مضارع، أمر)، والحرف وهو ما لا يظهر معناه إلا مع غيره.',
      aiSummary:
        'لغتنا العربية الجميلة تتكون جملها من 3 أبطال رئيسيين! 📖✨\n\n1️⃣ الاسم: مثل (جعفر، مدرسة، كتاب).\n2️⃣ الفعل: عمل يحدث في زمن مثل (كتبَ، يكتبُ، اكتبْ).\n3️⃣ الحرف: يربط الكلمات ببعضها مثل (في، من، إلى، على).',
      aiKeyPoints: [
        '🏷️ الاسم: يدل على إنسان أو حيوان أو نبات أو جماد أو صفة.',
        '⚡ الفعل: يدل على حدث في زمن (ماضٍ، مضارع، أمر).',
        '🔗 الحرف: يربط بين الكلمات ليكتمل معنى الجملة.',
      ],
      aiGoldenTip: 'إذا قبلت الكلمة (الـ) التعريف مثل (المدرسة) فهي اسم فوراً!',
      aiQuestions: [
        {
          question: 'إلى كم قسم ينقسم الكلام في اللغة العربية؟',
          options: ['قسمان فقط', 'أربعة أقسام', 'ثلاثة أقسام (اسم وفعل وحرف)', 'خمسة أقسام'],
          correctIndex: 2,
          explanation: 'أقسام الكلام ثلاثة: اسم، وفعل، وحرف.',
          difficulty: 'سهل',
        },
        {
          question: 'ما نوع كلمة (يكتبُ) من أقسام الكلام؟',
          options: ['فعل مضارع', 'اسم جماد', 'حرف جر', 'فعل ماضٍ'],
          correctIndex: 0,
          explanation: '(يكتبُ) تدل على حدث يقع في الزمن الحاضر فهي فعل مضارع.',
          difficulty: 'سهل',
        },
        {
          question: 'أيٌّ من الكلمات التالية تُعد (اسماً)؟',
          options: ['ذهبَ', 'في', 'اكتبْ', 'المدرسة'],
          correctIndex: 3,
          explanation: 'كلمة (المدرسة) اسم لأنها تدل على مكان وتقبل (الـ) التعريف.',
          difficulty: 'سهل',
        },
        {
          question: 'ما نوع الكلمة التي لا يظهر معناها كاملاً إلا مع غيرها مثل (في، على، من)؟',
          options: ['الفعل الماضي', 'الحرف', 'الاسم العلم', 'الفعل المضارع'],
          correctIndex: 1,
          explanation: 'الحرف لا يظهر معناه إلا عند وضعه في جملة مفيدة مع غيره.',
          difficulty: 'متوسط',
        },
        {
          question: 'سؤال الأبطال 🏆: ما نوع الفعل (اجتهدْ) في جملة (اجتهدْ في دروسك)؟',
          options: ['فعل ماضٍ', 'فعل مضارع', 'فعل أمر', 'حرف عطف'],
          correctIndex: 2,
          explanation: '(اجتهدْ) يدل على طلب القيام بالعمل في المستقبل فهو فعل أمر.',
          difficulty: 'تحدي الأبطال',
        },
      ],
      createdAt: Date.now() - 1800000,
    },
    {
      id: 'les_5',
      schoolId: 'sch_1',
      stageId: 'stg_1',
      subjectId: 'sub_3',
      subjectName: 'اللغة الإنجليزية 🌍',
      title: 'ضمائر الفاعل والأفعال المساعدة (He, She, It) 🌍',
      fileType: 'text',
      fileName: 'English_Pronouns.txt',
      rawText:
        'في اللغة الإنجليزية نستخدم الضمير He للمذكر المفرد، وShe للمؤنث المفرد، وIt لغير العاقل المفرد، وتأخذ هذه الضمائر الفعل المساعد is في الزمن المضارع.',
      aiSummary:
        'الضمائر الثلاثة الأصدقاء (He, She, It) يحبون دائماً الفعل المساعد (is)! 🌍✨\n\n- He is a smart student (للمذكر)\n- She is a clever girl (للمؤنث)\n- It is a nice cat (لغير العاقل)',
      aiKeyPoints: [
        '👦 He: للمفرد المذكر ويأخذ (is).',
        '👧 She: للمفرد المؤنث وتأخذ (is).',
        '🐱 It: للمفرد غير العاقل ويأخذ (is).',
        '👥 They / We / You: للجمع وتأخذ (are).',
      ],
      aiGoldenTip: 'تذكّر قاعدة الأبطال: (He / She / It) ⬅️ تأخذ دائماً (is)!',
      aiQuestions: [
        {
          question: 'أي فعل مساعد نختار مع الجملة: (Ali ___ a smart student)؟',
          options: ['are', 'is', 'am', 'were'],
          correctIndex: 1,
          explanation: 'لأن Ali مفرد مذكر (He) فيأخذ الفعل المساعد is.',
          difficulty: 'سهل',
        },
        {
          question: 'أي ضمير نستخدم للتعبير عن المفرد المؤنث (البنت)؟',
          options: ['He', 'It', 'They', 'She'],
          correctIndex: 3,
          explanation: 'الضمير She يُستخدم للمفرد المؤنث.',
          difficulty: 'سهل',
        },
        {
          question: 'أي ضمير نستخدم للقطة أو الكتاب (المفرد غير العاقل)؟',
          options: ['It', 'He', 'We', 'You'],
          correctIndex: 0,
          explanation: 'الضمير It يُستخدم للمفرد غير العاقل كالحيوان أو الجماد.',
          difficulty: 'سهل',
        },
        {
          question: 'ما الفعل المساعد الصحيح مع الضمير (I) في جملة (I ___ a student)؟',
          options: ['is', 'are', 'am', 'be'],
          correctIndex: 2,
          explanation: 'الضمير I يأخذ دائماً الفعل المساعد am في المضارع.',
          difficulty: 'متوسط',
        },
        {
          question: 'سؤال الأبطال 🏆: اختر التكملة الصحيحة للجملة (They ___ good friends):',
          options: ['is', 'are', 'am', 'was'],
          correctIndex: 1,
          explanation: 'الضمير They يدل على الجمع فيأخذ الفعل المساعد are.',
          difficulty: 'تحدي الأبطال',
        },
      ],
      createdAt: Date.now() - 900000,
    },
    {
      id: 'les_6',
      schoolId: 'sch_1',
      stageId: 'stg_1',
      subjectId: 'sub_7',
      subjectName: 'الاجتماعيات 🗺️',
      title: 'موقع العراق الجغرافي ونهري دجلة والفرات 🗺️',
      fileType: 'text',
      fileName: 'جغرافية_العراق.txt',
      rawText:
        'يقع وطننا العراق في الجزء الجنوبي الغربي من قارة آسيا، وفي القسم الشمالي الشرقي من العالم العربي. يجري في أرضه نهران عظيمان هما دجلة والفرات اللذان يلتقيان في شط العرب بمحافظة البصرة، ولذلك سُمّي العراق قديماً بلاد الرافدين.',
      aiSummary:
        'وطننا الحبيب العراق هو قلب العالم وبلاد الرافدين! 🗺️🌴\n\nيقع في جنوب غرب قارة آسيا، ويهبه الله نهرين عظيمين هما (دجلة والفرات) اللذان يلتقيان معاً في شط العرب بمحافظة البصرة الفيحاء.',
      aiKeyPoints: [
        '🌏 يقع العراق في الجزء الجنوبي الغربي من قارة آسيا.',
        '🌊 يجري فيه نهرا دجلة والفرات اللذان يلتقيان في شط العرب.',
        '🏛️ يُلقب العراق ببلاد الرافدين وأرض الحضارات العريقة.',
      ],
      aiGoldenTip: 'تذكّر: الرافدان هما (دجلة والفرات) ويلتقيان في (شط العرب)!',
      aiQuestions: [
        {
          question: 'في أي قارة يقع وطننا الحبيب العراق؟',
          options: ['قارة أوروبا', 'قارة أفريقيا', 'قارة آسيا', 'قارة أستراليا'],
          correctIndex: 2,
          explanation: 'يقع العراق في الجزء الجنوبي الغربي من قارة آسيا.',
          difficulty: 'سهل',
        },
        {
          question: 'ماذا نسمي النهرين العظيمين اللذين يجريان في أرض العراق؟',
          options: ['دجلة والفرات', 'النيل والأمازون', 'الفولغا والدانوب', 'البردى والأردن'],
          correctIndex: 0,
          explanation: 'نهرا دجلة والفرات هما رافدا العراق العظيمان.',
          difficulty: 'سهل',
        },
        {
          question: 'أين يلتقي نهرا دجلة والفرات في جنوب العراق؟',
          options: ['في بحيرة الحبانية', 'في البحر المتوسط', 'في سد دوكان', 'في شط العرب'],
          correctIndex: 3,
          explanation: 'يلتقي نهرا دجلة والفرات في شط العرب بمحافظة البصرة.',
          difficulty: 'سهل',
        },
        {
          question: 'بماذا لُقّب العراق قديماً لوجود نهري دجلة والفرات فيه؟',
          options: ['بلاد الشام', 'بلاد الرافدين', 'بلاد المغرب', 'شبه الجزيرة'],
          correctIndex: 1,
          explanation: 'سُمّي العراق ببلاد الرافدين نسبة إلى نهري دجلة والفرات.',
          difficulty: 'متوسط',
        },
        {
          question: 'سؤال الأبطال 🏆: ما هي عاصمة جمهورية العراق الحبيبة؟',
          options: ['البصرة', 'النجف الأشرف', 'بغداد', 'أربيل'],
          correctIndex: 2,
          explanation: 'بغداد هي عاصمة جمهورية العراق وتقع في وسطه على نهر دجلة.',
          difficulty: 'تحدي الأبطال',
        },
      ],
      createdAt: Date.now() - 600000,
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
      performanceHistory: [68, 58, 52, 44, 38, 30],
      createdAt: Date.now() - 50000000,
    },
  ],
  rooms: [],
};

let firestoreDb = null;
let broadcastChannel = null;
const subscribers = new Set();
const localRecentRoomsMap = new Map(); // roomId -> room object
const localCanceledRoomIds = new Set();

try {
  if (typeof BroadcastChannel !== 'undefined') {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
    broadcastChannel.onmessage = (event) => {
      if (event.data && event.data.type === 'DB_UPDATED') {
        notifySubscribers();
      }
    };
  }
} catch (e) {
  console.warn('BroadcastChannel not supported:', e);
}

// إعدادات Firebase الافتراضية المدمجة (تعمل تلقائياً على جميع الهواتف والأجهزة)
const DEFAULT_FIREBASE_CONFIG = {
  apiKey:
    import.meta.env?.VITE_FIREBASE_API_KEY ||
    'AIzaSyA-uDV7LxsWI8f8lcLHXrR5TM9pOPXRS7w',
  authDomain:
    import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN ||
    'smart-student-ai-iq.firebaseapp.com',
  projectId:
    import.meta.env?.VITE_FIREBASE_PROJECT_ID || 'smart-student-ai-iq',
  storageBucket:
    import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET ||
    'smart-student-ai-iq.firebasestorage.app',
  messagingSenderId:
    import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID || '709243083057',
  appId:
    import.meta.env?.VITE_FIREBASE_APP_ID ||
    '1:709243083057:web:af9bfd5b138f4239187810',
};

function parseFlexibleFirebaseConfig(rawInput) {
  if (!rawInput || !rawInput.trim()) return null;
  const text = rawInput.trim();
  try {
    return JSON.parse(text);
  } catch (_) {
    // دعم لصق كود JavaScript مباشرةً من Firebase Console مثل: const firebaseConfig = { apiKey: "..." };
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Invalid config format');
    const jsonLike = match[0]
      .replace(/\/\/.*$/gm, '')
      .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?\s*:/g, '"$2":')
      .replace(/'/g, '"')
      .replace(/,\s*([}\]])/g, '$1');
    return JSON.parse(jsonLike);
  }
}

export function initFirebaseIfConfigured() {
  try {
    const raw = localStorage.getItem(STORAGE_FB_CONFIG);
    const config = raw
      ? parseFlexibleFirebaseConfig(raw)
      : DEFAULT_FIREBASE_CONFIG.apiKey && DEFAULT_FIREBASE_CONFIG.projectId
      ? DEFAULT_FIREBASE_CONFIG
      : null;
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
            let needsCloudUpdate = false;
            if (
              !cloudData.adminCredentials ||
              cloudData.adminCredentials.username !==
                INITIAL_DATA.adminCredentials.username ||
              cloudData.adminCredentials.password !==
                INITIAL_DATA.adminCredentials.password
            ) {
              cloudData.adminCredentials = INITIAL_DATA.adminCredentials;
              needsCloudUpdate = true;
            }
            const localAiKey = (localStorage.getItem(STORAGE_AI_KEY) || '').trim();
            if (cloudData.geminiApiKey && !localAiKey) {
              localStorage.setItem(STORAGE_AI_KEY, cloudData.geminiApiKey);
            } else if (localAiKey && cloudData.geminiApiKey !== localAiKey) {
              cloudData.geminiApiKey = localAiKey;
              needsCloudUpdate = true;
            }
            if (Array.isArray(cloudData.rooms)) {
              const now = Date.now();
              // الاحتفاظ بالغرف المنشأة محلياً خلال آخر 45 ثانية إذا لم تكن قد وصلت للسحابة بعد
              for (const [rmId, rmObj] of localRecentRoomsMap.entries()) {
                if (now - (rmObj.createdAt || 0) > 45000) {
                  localRecentRoomsMap.delete(rmId);
                } else if (
                  !localCanceledRoomIds.has(rmId) &&
                  !cloudData.rooms.some((cr) => cr.id === rmId)
                ) {
                  cloudData.rooms.unshift(rmObj);
                }
              }
              cloudData.rooms = cloudData.rooms.filter(
                (r) => !localCanceledRoomIds.has(r.id)
              );
            }
            if (Array.isArray(cloudData.lessons)) {
              try {
                const currentLocal = JSON.parse(
                  localStorage.getItem(STORAGE_DB_KEY) || '{}'
                );
                const localLessons = Array.isArray(currentLocal.lessons)
                  ? currentLocal.lessons
                  : [];
                cloudData.lessons = cloudData.lessons.map((cLes) => {
                  const localMatch = localLessons.find((l) => l.id === cLes.id);
                  if (!localMatch) return cLes;
                  return {
                    ...cLes,
                    imagePreview:
                      cLes.imagePreview || localMatch.imagePreview || null,
                    imagePreviews:
                      Array.isArray(cLes.imagePreviews) &&
                      cLes.imagePreviews.length > 0
                        ? cLes.imagePreviews
                        : Array.isArray(localMatch.imagePreviews)
                        ? localMatch.imagePreviews
                        : cLes.imagePreview
                        ? [cLes.imagePreview]
                        : localMatch.imagePreview
                        ? [localMatch.imagePreview]
                        : [],
                    pdfPreview:
                      cLes.pdfPreview || localMatch.pdfPreview || null,
                    audioPreview:
                      cLes.audioPreview || localMatch.audioPreview || null,
                    audioName:
                      cLes.audioName || localMatch.audioName || '',
                  };
                });

                // الحفاظ على الطلاب المسجلين محلياً حديثاً قبل اكتمال مزامنة السحابة
                const localStudents = Array.isArray(currentLocal.students)
                  ? currentLocal.students
                  : [];
                const cloudDeletedIds = Array.isArray(cloudData.deletedStudentIds)
                  ? cloudData.deletedStudentIds
                  : [];
                if (Array.isArray(cloudData.students)) {
                  const nowTs = Date.now();
                  localStudents.forEach((lStd) => {
                    if (
                      lStd &&
                      lStd.id &&
                      !cloudDeletedIds.includes(lStd.id) &&
                      !cloudData.students.some((cStd) => cStd.id === lStd.id) &&
                      nowTs - (lStd.lastLoginAt || lStd.createdAt || 0) < 120000
                    ) {
                      cloudData.students.push(lStd);
                      needsCloudUpdate = true;
                    }
                  });
                }
              } catch {
                // ignore
              }
            }
            localStorage.setItem(STORAGE_DB_KEY, JSON.stringify(cloudData));
            if (needsCloudUpdate) {
              const cleanCloud = JSON.parse(JSON.stringify(cloudData));
              setDoc(stateDocRef, cleanCloud).catch(() => {});
            }
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

export function getFirebaseConfigString() {
  const stored = localStorage.getItem(STORAGE_FB_CONFIG);
  if (stored) return stored;
  if (DEFAULT_FIREBASE_CONFIG.apiKey && DEFAULT_FIREBASE_CONFIG.projectId) {
    return JSON.stringify(DEFAULT_FIREBASE_CONFIG, null, 2);
  }
  return '';
}

export function saveFirebaseConfigString(jsonStr) {
  if (!jsonStr || !jsonStr.trim()) {
    localStorage.removeItem(STORAGE_FB_CONFIG);
    firestoreDb = null;
    return true;
  }
  const parsed = parseFlexibleFirebaseConfig(jsonStr);
  localStorage.setItem(STORAGE_FB_CONFIG, JSON.stringify(parsed, null, 2));
  return initFirebaseIfConfigured();
}

export function isFirebaseConnected() {
  return Boolean(firestoreDb);
}

export function saveSharedGeminiApiKey(apiKey) {
  const cleanKey = (apiKey || '').trim();
  localStorage.setItem(STORAGE_AI_KEY, cleanKey);
  const state = getDatabaseState();
  saveDatabaseState({
    ...state,
    geminiApiKey: cleanKey,
  });
}

export function getDatabaseState() {
  try {
    const raw = localStorage.getItem(STORAGE_DB_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_DB_KEY, JSON.stringify(INITIAL_DATA));
      return INITIAL_DATA;
    }
    const parsed = JSON.parse(raw);
    let changed = false;

    if (
      !parsed.adminCredentials ||
      parsed.adminCredentials.username !==
        INITIAL_DATA.adminCredentials.username ||
      parsed.adminCredentials.password !==
        INITIAL_DATA.adminCredentials.password
    ) {
      parsed.adminCredentials = INITIAL_DATA.adminCredentials;
      changed = true;
    }

    const localAiKey = (localStorage.getItem(STORAGE_AI_KEY) || '').trim();
    if (parsed.geminiApiKey && !localAiKey) {
      localStorage.setItem(STORAGE_AI_KEY, parsed.geminiApiKey);
    } else if (localAiKey && parsed.geminiApiKey !== localAiKey) {
      parsed.geminiApiKey = localAiKey;
      changed = true;
    }

    if (Array.isArray(parsed.students)) {
      parsed.students = parsed.students.map((s) => {
        const initStd = INITIAL_DATA.students.find((is) => is.id === s.id);
        let updatedStd = s;
        if (
          s.id === 'std_1' &&
          Array.isArray(updatedStd.performanceHistory) &&
          (updatedStd.performanceHistory.join(',') === '55,72,60,82,70,88' ||
            updatedStd.performanceHistory.join(',') === '66,72,76,82,86,90')
        ) {
          changed = true;
          updatedStd = {
            ...updatedStd,
            level: 4,
            performanceHistory: [42, 48, 45, 54, 50, 62],
          };
        }
        if (
          initStd &&
          (!updatedStd.avatar ||
            !updatedStd.profileColor ||
            !Array.isArray(updatedStd.performanceHistory) ||
            updatedStd.performanceHistory.length < 6)
        ) {
          changed = true;
          updatedStd = {
            ...updatedStd,
            avatar: updatedStd.avatar || initStd.avatar,
            profileColor: updatedStd.profileColor || initStd.profileColor,
            performanceHistory:
              Array.isArray(updatedStd.performanceHistory) &&
              updatedStd.performanceHistory.length >= 6
                ? updatedStd.performanceHistory
                : initStd.performanceHistory,
          };
        } else if (
          !Array.isArray(updatedStd.performanceHistory) ||
          updatedStd.performanceHistory.length < 6
        ) {
          changed = true;
          updatedStd = {
            ...updatedStd,
            performanceHistory: [45, 50, 48, 52, 50, 55],
          };
        }
        return updatedStd;
      });
      const deletedStdIds = Array.isArray(parsed.deletedStudentIds)
        ? parsed.deletedStudentIds
        : [];
      INITIAL_DATA.students.forEach((initStd) => {
        if (
          !deletedStdIds.includes(initStd.id) &&
          !parsed.students.some((s) => s.id === initStd.id)
        ) {
          parsed.students.push(initStd);
          changed = true;
        }
      });
    }

    if (Array.isArray(parsed.subjects)) {
      parsed.subjects = parsed.subjects.map((s) => {
        if (s.id === 'sub_1' && s.name !== 'العلوم 🔬') {
          changed = true;
          return { ...s, name: 'العلوم 🔬' };
        }
        if (s.id === 'sub_2' && s.name !== 'الرياضيات 📐') {
          changed = true;
          return { ...s, name: 'الرياضيات 📐' };
        }
        return s;
      });
      INITIAL_DATA.subjects.forEach((initSub) => {
        if (!parsed.subjects.some((s) => s.id === initSub.id)) {
          parsed.subjects.push(initSub);
          changed = true;
        }
      });
    }

    if (Array.isArray(parsed.lessons)) {
      parsed.lessons = parsed.lessons.map((l) => {
        const initMatch = INITIAL_DATA.lessons.find((il) => il.id === l.id);
        let updatedLesson = l;
        if (l.subjectId === 'sub_1' && l.subjectName !== 'العلوم 🔬') {
          changed = true;
          updatedLesson = { ...updatedLesson, subjectName: 'العلوم 🔬' };
        }
        if (l.subjectId === 'sub_2' && l.subjectName !== 'الرياضيات 📐') {
          changed = true;
          updatedLesson = { ...updatedLesson, subjectName: 'الرياضيات 📐' };
        }
        if (
          initMatch &&
          (!Array.isArray(updatedLesson.aiQuestions) ||
            updatedLesson.aiQuestions.length < 5 ||
            updatedLesson.aiQuestions.every((q) => q.correctIndex === 0))
        ) {
          changed = true;
          updatedLesson = { ...updatedLesson, aiQuestions: initMatch.aiQuestions };
        }
        return updatedLesson;
      });
      INITIAL_DATA.lessons.forEach((initLes) => {
        if (!parsed.lessons.some((l) => l.id === initLes.id)) {
          parsed.lessons.push(initLes);
          changed = true;
        }
      });
    }

    if (Array.isArray(parsed.rooms)) {
      const now = Date.now();
      const validRooms = parsed.rooms.filter((r) => {
        if (localCanceledRoomIds.has(r.id)) return false;
        const age = now - (r.createdAt || 0);
        // حذف الغرف القديمة جداً فقط (أكثر من ساعتين) لتجنب إغلاق الغرفة بسبب فرق توقيت الأجهزة
        if (age > 7200000) return false;
        return true;
      });
      if (validRooms.length !== parsed.rooms.length) {
        parsed.rooms = validRooms;
        changed = true;
      }
    }

    if (changed) {
      localStorage.setItem(STORAGE_DB_KEY, JSON.stringify(parsed));
    }
    return parsed;
  } catch (e) {
    return INITIAL_DATA;
  }
}

function saveDatabaseState(newState) {
  try {
    localStorage.setItem(STORAGE_DB_KEY, JSON.stringify(newState));
  } catch (e) {
    console.warn('LocalStorage quota warning, compacting media:', e);
    try {
      const compactLocal = JSON.parse(JSON.stringify(newState));
      if (Array.isArray(compactLocal.lessons)) {
        for (let i = 0; i < compactLocal.lessons.length; i++) {
          compactLocal.lessons[i].pdfPreview = null;
          compactLocal.lessons[i].audioPreview = null;
        }
      }
      localStorage.setItem(STORAGE_DB_KEY, JSON.stringify(compactLocal));
    } catch {
      // ignore
    }
  }
  if (broadcastChannel) {
    broadcastChannel.postMessage({ type: 'DB_UPDATED', timestamp: Date.now() });
  }
  if (firestoreDb) {
    const stateDocRef = doc(firestoreDb, 'smart_student_app', 'global_state');
    const cleanState = JSON.parse(JSON.stringify(newState));
    // ضمان عدم تجاوز حد 1MB في Firestore مع الحفاظ الكامل على حسابات الطلاب والغرف والدروس
    if (
      JSON.stringify(cleanState).length > 900000 &&
      Array.isArray(cleanState.lessons)
    ) {
      for (let i = 0; i < cleanState.lessons.length; i++) {
        if (JSON.stringify(cleanState).length <= 880000) break;
        if (
          cleanState.lessons[i].pdfPreview &&
          cleanState.lessons[i].pdfPreview.length > 250000
        ) {
          cleanState.lessons[i].pdfPreview = null;
        }
        if (
          JSON.stringify(cleanState).length > 880000 &&
          cleanState.lessons[i].audioPreview &&
          cleanState.lessons[i].audioPreview.length > 250000
        ) {
          cleanState.lessons[i].audioPreview = null;
        }
        if (
          JSON.stringify(cleanState).length > 880000 &&
          cleanState.lessons[i].imagePreview &&
          cleanState.lessons[i].imagePreview.length > 250000
        ) {
          cleanState.lessons[i].imagePreview = null;
        }
      }
      if (JSON.stringify(cleanState).length > 900000) {
        for (let i = cleanState.lessons.length - 1; i >= 0; i--) {
          if (JSON.stringify(cleanState).length <= 880000) break;
          cleanState.lessons[i].pdfPreview = null;
          cleanState.lessons[i].audioPreview = null;
          if (JSON.stringify(cleanState).length > 880000) {
            cleanState.lessons[i].imagePreview = null;
            cleanState.lessons[i].imagePreviews = [];
          }
        }
      }
    }
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
  const colors = ['emerald', 'indigo', 'amber', 'rose', 'purple'];
  const newSubject = {
    id: 'sub_' + Date.now(),
    schoolId,
    stageId,
    name: name.trim(),
    icon,
    color: colors[state.subjects.length % colors.length],
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

function normalizeStudentName(str = '') {
  return String(str)
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي');
}

function normalizeStudentCode(str = '') {
  return String(str ?? '')
    .trim()
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
}

export function deleteStudent(studentId) {
  const state = getDatabaseState();
  const target = (state.students || []).find((std) => std.id === studentId);
  const targetNormName = target ? normalizeStudentName(target.name) : null;
  const deletedIds = Array.isArray(state.deletedStudentIds)
    ? state.deletedStudentIds
    : [];
  const removedIds = (state.students || [])
    .filter(
      (std) =>
        std.id === studentId ||
        (targetNormName && normalizeStudentName(std.name) === targetNormName)
    )
    .map((std) => std.id);

  saveDatabaseState({
    ...state,
    students: (state.students || []).filter(
      (std) => !removedIds.includes(std.id)
    ),
    deletedStudentIds: Array.from(new Set([...deletedIds, ...removedIds])),
  });
}

export function loginAdmin(username, password) {
  const state = getDatabaseState();
  if (
    username.trim().toLowerCase() === state.adminCredentials.username.toLowerCase() &&
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
  const cleanName = String(name || '').trim().replace(/\s+/g, ' ');
  const cleanCode = normalizeStudentCode(code);
  const normName = normalizeStudentName(cleanName);

  const matchingByName = (state.students || []).filter(
    (s) => normalizeStudentName(s.name) === normName
  );

  if (matchingByName.length > 0) {
    const statusRank = { approved: 3, pending: 2, none: 1, rejected: 0 };
    const sortedMatches = [...matchingByName].sort((a, b) => {
      const rankDiff =
        (statusRank[b.status] ?? 0) - (statusRank[a.status] ?? 0);
      if (rankDiff !== 0) return rankDiff;
      const codeMatchA = normalizeStudentCode(a.code) === cleanCode ? 1 : 0;
      const codeMatchB = normalizeStudentCode(b.code) === cleanCode ? 1 : 0;
      if (codeMatchB !== codeMatchA) return codeMatchB - codeMatchA;
      return (b.points || 0) - (a.points || 0);
    });

    const primary = sortedMatches[0];
    const maxPoints = Math.max(
      ...matchingByName.map((s) => Number(s.points) || 0)
    );
    const maxWins = Math.max(...matchingByName.map((s) => Number(s.wins) || 0));
    const maxQuizzes = Math.max(
      ...matchingByName.map((s) => Number(s.quizzesCompleted) || 0)
    );
    const mergedUnlocked = Array.from(
      new Set(
        matchingByName.flatMap((s) =>
          Array.isArray(s.unlockedAvatars) ? s.unlockedAvatars : []
        )
      )
    );

    const updatedStudent = {
      ...primary,
      name: primary.name || cleanName,
      code: cleanCode,
      points: maxPoints,
      wins: maxWins,
      quizzesCompleted: maxQuizzes,
      unlockedAvatars: mergedUnlocked,
      lastLoginAt: Date.now(),
    };

    const duplicateIds = matchingByName
      .filter((s) => s.id !== primary.id)
      .map((s) => s.id);

    const updatedStudentsList = (state.students || [])
      .filter((s) => !duplicateIds.includes(s.id))
      .map((s) => (s.id === primary.id ? updatedStudent : s));

    saveDatabaseState({
      ...state,
      students: updatedStudentsList,
    });

    return { student: updatedStudent };
  }

  const newStudent = {
    id: 'std_' + Date.now(),
    name: cleanName,
    code: cleanCode,
    schoolId: null,
    stageId: null,
    status: 'none',
    points: 0,
    wins: 0,
    quizzesCompleted: 0,
    createdAt: Date.now(),
    lastLoginAt: Date.now(),
  };

  saveDatabaseState({
    ...state,
    students: [...(state.students || []), newStudent],
  });

  return { student: newStudent };
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
  { name, code, avatar, profileColor, voiceGender, fontScale }
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
          voiceGender: voiceGender || s.voiceGender || 'male',
          fontScale:
            typeof fontScale === 'number'
              ? fontScale
              : s.fontScale || 110,
        }
      : s
  );
  saveDatabaseState({
    ...state,
    students: updated,
  });
  return { success: true };
}

export function updateStudentVoiceGender(studentId, voiceGender) {
  const state = getDatabaseState();
  const cleanGender = voiceGender === 'female' ? 'female' : 'male';
  const updated = (state.students || []).map((s) =>
    s.id === studentId ? { ...s, voiceGender: cleanGender } : s
  );
  saveDatabaseState({
    ...state,
    students: updated,
  });
}

export function purchaseRareAvatar(studentId, emoji, cost) {
  const state = getDatabaseState();
  const target = state.students.find((s) => s.id === studentId);
  if (!target) {
    return { error: 'لم يتم العثور على حساب الطالب!' };
  }

  const unlocked = Array.isArray(target.unlockedAvatars)
    ? target.unlockedAvatars
    : [];

  // إذا كان الإيموجي مفتوحاً ومشتراً مسبقاً، يتم اختياره مجاناً بدون خصم نقاط مرة أخرى
  if (unlocked.includes(emoji)) {
    const updated = state.students.map((s) =>
      s.id === studentId ? { ...s, avatar: emoji } : s
    );
    saveDatabaseState({
      ...state,
      students: updated,
    });
    return {
      success: true,
      alreadyOwned: true,
      remainingPoints: target.points || 0,
    };
  }

  const currentPoints = Number(target.points) || 0;
  const numericCost = Number(cost) || 0;

  if (currentPoints < numericCost) {
    return {
      error: `🔒 هذا الشكل مقفول! تحتاج إلى ${numericCost} نقطة لفتحه (رصيدك الحالي: ${currentPoints} نقطة).`,
    };
  }

  const remainingPoints = currentPoints - numericCost;
  const newUnlocked = [...unlocked, emoji];

  const updated = state.students.map((s) =>
    s.id === studentId
      ? {
          ...s,
          points: remainingPoints,
          unlockedAvatars: newUnlocked,
          avatar: emoji,
        }
      : s
  );

  saveDatabaseState({
    ...state,
    students: updated,
  });

  return {
    success: true,
    alreadyOwned: false,
    remainingPoints,
  };
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
          profileColor: profileColor || sub.profileColor || sub.color || 'emerald',
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
  imagePreviews,
  pdfPreview,
  audioPreview,
  audioName,
  aiData,
}) {
  const state = getDatabaseState();
  const normalizedImages =
    Array.isArray(imagePreviews) && imagePreviews.length > 0
      ? imagePreviews.filter(Boolean)
      : imagePreview
      ? [imagePreview]
      : [];
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
    imagePreview: normalizedImages[0] || null,
    imagePreviews: normalizedImages,
    pdfPreview: pdfPreview || null,
    audioPreview: audioPreview || null,
    audioName: audioName || '',
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

export function updateLessonQuestions(lessonId, updatedQuestions) {
  const state = getDatabaseState();
  const updatedLessons = (state.lessons || []).map((l) =>
    l.id === lessonId
      ? {
          ...l,
          aiQuestions: Array.isArray(updatedQuestions) ? updatedQuestions : [],
        }
      : l
  );
  saveDatabaseState({
    ...state,
    lessons: updatedLessons,
  });
  return { success: true };
}

export function updateLessonDetails(
  lessonId,
  {
    title,
    fileType,
    fileName,
    rawText,
    imagePreview,
    imagePreviews,
    pdfPreview,
    audioPreview,
    audioName,
    aiSummary,
  }
) {
  const state = getDatabaseState();
  const cleanTitle = title ? title.trim() : '';
  if (!cleanTitle) {
    return { error: 'يرجى إدخال عنوان الدرس!' };
  }

  const updatedLessons = (state.lessons || []).map((l) => {
    if (l.id !== lessonId) return l;
    const nextImages =
      imagePreviews !== undefined
        ? Array.isArray(imagePreviews)
          ? imagePreviews.filter(Boolean)
          : []
        : imagePreview !== undefined
        ? imagePreview
          ? [imagePreview]
          : []
        : Array.isArray(l.imagePreviews)
        ? l.imagePreviews
        : l.imagePreview
        ? [l.imagePreview]
        : [];
    return {
      ...l,
      title: cleanTitle,
      fileType: fileType !== undefined ? fileType : l.fileType,
      fileName: fileName !== undefined ? fileName : l.fileName,
      rawText: rawText !== undefined ? rawText : l.rawText,
      imagePreview: nextImages[0] || null,
      imagePreviews: nextImages,
      pdfPreview: pdfPreview !== undefined ? pdfPreview : l.pdfPreview,
      audioPreview: audioPreview !== undefined ? audioPreview : l.audioPreview,
      audioName: audioName !== undefined ? audioName : l.audioName,
      aiSummary: aiSummary !== undefined ? aiSummary : l.aiSummary,
    };
  });

  saveDatabaseState({
    ...state,
    lessons: updatedLessons,
  });
  return { success: true };
}

function appendPerformanceStep(prevHistory, perfDelta) {
  const base =
    Array.isArray(prevHistory) && prevHistory.length >= 6
      ? prevHistory.slice(-6)
      : [42, 48, 45, 54, 50, 62];
  const lastVal = base[base.length - 1];

  if (perfDelta > 0) {
    // إذا وصل المؤشر قريباً من السقف الأعلى، نزيح النقاط السابقة للأسفل قليلاً حتى يظهر ارتفاع الخط الجديد بوضوح دائماً
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

    // حساب تغير المستوى في الاختبار السريع (الدرجة الكاملة = 20، كل سؤال = 4 درجات)
    let perfDelta = 0;
    let levelDelta = 0;
    if (isQuiz) {
      if (deltaPoints >= 12) {
        // أكمل الاختبار السريع بشكل صحيح (3 أو 4 أو 5 إجابات صحيحة) -> يرتفع خط المستوى والمستوى
        perfDelta = deltaPoints === 20 ? 18 : deltaPoints === 16 ? 15 : 12;
        levelDelta = 1;
      } else {
        // إجابات ضعيفة (0 إلى 2) -> ينخفض خط المستوى والمستوى
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
    inviteStartedAt: null,
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
        hasAccepted: true,
      },
    ],
    winnerId: null,
    winnerName: null,
    createdAt: Date.now(),
  };

  localRecentRoomsMap.set(newRoom.id, newRoom);
  saveDatabaseState({
    ...state,
    rooms: [newRoom, ...state.rooms],
  });
  return newRoom;
}

export function joinChallengeRoom({ roomCode, student }) {
  const state = getDatabaseState();
  const room = state.rooms.find(
    (r) => r.roomCode === roomCode.trim() && r.status !== 'finished'
  );
  if (!room) {
    return { error: 'لم يتم العثور على غرفة تحدي بهذا الكود أو أن المسابقة انتهت!' };
  }

  const alreadyIn = room.players.some((p) => p.id === student.id);
  const updatedPlayers = alreadyIn
    ? room.players.map((p) =>
        p.id === student.id ? { ...p, hasAccepted: true } : p
      )
    : [
        ...room.players,
        {
          id: student.id,
          name: student.name,
          score: 0,
          correctCount: 0,
          lastAnsweredQuestion: -1,
          isBot: false,
          hasAccepted: true,
        },
      ];

  const updatedRooms = state.rooms.map((r) =>
    r.id === room.id ? { ...r, players: updatedPlayers } : r
  );

  saveDatabaseState({
    ...state,
    rooms: updatedRooms,
  });
  return { room: { ...room, players: updatedPlayers } };
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
      inviteStartedAt: r.inviteStartedAt || Date.now(),
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
          hasAccepted: false,
        },
      ],
    };
  });
  saveDatabaseState({ ...state, rooms: updatedRooms });
}

export function acceptChallengeInvitation(roomId, studentId) {
  if (!roomId || !studentId) return;
  const state = getDatabaseState();
  const updatedRooms = state.rooms.map((r) => {
    if (r.id !== roomId || r.status !== 'waiting') return r;
    const updatedPlayers = r.players.map((p) =>
      p.id === studentId ? { ...p, hasAccepted: true } : p
    );
    const allInvitedAccepted =
      updatedPlayers.length >= 2 &&
      updatedPlayers.every((p) => p.hasAccepted !== false);
    if (allInvitedAccepted) {
      return {
        ...r,
        status: 'playing',
        currentQuestionIndex: 0,
        questionStartedAt: Date.now(),
        players: updatedPlayers,
      };
    }
    return {
      ...r,
      players: updatedPlayers,
    };
  });
  saveDatabaseState({ ...state, rooms: updatedRooms });
}

export function cancelChallengeRoom(roomId) {
  if (!roomId) return;
  localCanceledRoomIds.add(roomId);
  localRecentRoomsMap.delete(roomId);
  const state = getDatabaseState();
  saveDatabaseState({
    ...state,
    rooms: state.rooms.filter((r) => r.id !== roomId),
  });
}

export function declineChallengeInvitation(roomId, studentId) {
  if (!roomId || !studentId) return;
  const state = getDatabaseState();
  const updatedRooms = (state.rooms || [])
    .map((r) => {
      if (r.id !== roomId) return r;
      const remainingPlayers = (r.players || []).filter(
        (p) => p.id !== studentId
      );
      return {
        ...r,
        players: remainingPlayers,
      };
    })
    .filter((r) => {
      if (r.id !== roomId) return true;
      // إذا لم يتبق سوى المضيف بعد رفض الدعوة، نلغي الغرفة نهائياً
      return r.players.length >= 2;
    });

  saveDatabaseState({
    ...state,
    rooms: updatedRooms,
  });
}

export function addBotToChallengeRoom(roomId) {
  const state = getDatabaseState();
  const botNames = ['أحمد الذكي 🤖', 'زينب المتفوقة 🤖', 'يوسف السريع 🤖', 'مريم البطلة 🤖'];
  const updatedRooms = state.rooms.map((r) => {
    if (r.id !== roomId) return r;
    const pickedName = botNames[r.players.length % botNames.length];
    return {
      ...r,
      players: [
        ...r.players,
        {
          id: 'bot_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5),
          name: pickedName,
          score: 0,
          correctCount: 0,
          lastAnsweredQuestion: -1,
          isBot: true,
          hasAccepted: true,
        },
      ],
    };
  });
  saveDatabaseState({ ...state, rooms: updatedRooms });
}

export function startChallengeGame(roomId) {
  const state = getDatabaseState();
  const updatedRooms = state.rooms.map((r) => {
    if (r.id !== roomId) return r;
    if (!Array.isArray(r.players) || r.players.length < 2) {
      return r;
    }
    const activePlayers = r.players.filter((p) => p.hasAccepted !== false);
    return {
      ...r,
      status: 'playing',
      currentQuestionIndex: 0,
      questionStartedAt: Date.now(),
      players: activePlayers.length > 0 ? activePlayers : r.players,
    };
  });
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
  const speedBonus = isCorrect ? Math.max(10, Math.round(timeRemainingSec * 12)) : 0;
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
      if (p.isBot && p.id !== playerId && p.lastAnsweredQuestion < questionIndex) {
        const botCorrect = Math.random() > 0.32;
        const botPoints = botCorrect ? 100 + Math.floor(Math.random() * 110) : 0;
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

export function advanceOrFinishChallengeRoom(roomId, expectedQuestionIndex) {
  const state = getDatabaseState();
  const targetRoom = state.rooms.find((r) => r.id === roomId);
  if (!targetRoom || targetRoom.status !== 'playing') return;
  if (
    typeof expectedQuestionIndex === 'number' &&
    targetRoom.currentQuestionIndex !== expectedQuestionIndex
  ) {
    return;
  }
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
            // دخل المسابقة وأجاب بشكل صحيح -> يرتفع خط المستوى والمستوى
            perfDelta = correctRatio >= 0.8 ? 18 : 14;
            levelDelta = 1;
          } else {
            // إجابات ضعيفة في المسابقة -> ينخفض خط المستوى والمستوى
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
