// ============================================================================
// محرك الذكاء الاصطناعي التعليمي (Google Gemini AI + المحلل الذكي المدمج)
// متوافق 100% مع Expo (React Native)
// ============================================================================

let memoryGeminiKey = '';

export function getGeminiApiKey() {
  return memoryGeminiKey;
}

export function setGeminiApiKey(key) {
  memoryGeminiKey = (key || '').trim();
}

export async function analyzeLessonWithAI({
  title,
  subjectName,
  stageName,
  rawText,
}) {
  const apiKey = getGeminiApiKey();

  if (apiKey) {
    try {
      const promptText = `
أنت "المعلم الذكي" في تطبيق تعليمي للطلاب في (${stageName}) لمادة (${subjectName}).
عنوان الدرس: "${title}".
النص المرفق من الأستاذ: "${rawText || 'اشرح عنوان الدرس بطريقة مبسطة وممتعة للطلاب'}".

المطلوب إرجاع رد بصيغة JSON فقط بدون أي نص خارجه، يحتوي على الحقول التالية:
{
  "summary": "شرح قصصي مبسط وممتع جداً للدرس مع أمثلة وإيموجي يفهمه الطالب بسرعة",
  "keyPoints": ["نقطة ذهبية 1", "نقطة ذهبية 2", "نقطة ذهبية 3", "نقطة ذهبية 4"],
  "goldenTip": "نصيحة ذهبية سريعة لحفظ وفهم الدرس",
  "questions": [
    {
      "question": "نص السؤال الأول",
      "options": ["خيار 1", "خيار 2", "خيار 3", "خيار 4"],
      "correctIndex": 0,
      "explanation": "تفسير مبسط لماذا هذه الإجابة صحيحة",
      "difficulty": "سهل"
    }
  ]
}
يجب أن تكون مصفوفة questions مكونة من 5 أسئلة متنوعة مع تنويع موقع الإجابة الصحيحة (correctIndex بين 0 و 3).`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }],
            generationConfig: {
              temperature: 0.5,
              responseMimeType: 'application/json',
            },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const textOut = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const cleaned = textOut.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        if (parsed.summary && Array.isArray(parsed.questions)) {
          return {
            ...parsed,
            generatedBy: 'Gemini AI ✨',
          };
        }
      }
    } catch (err) {
      console.warn('Fallback to built-in AI analyzer:', err);
    }
  }

  await new Promise((r) => setTimeout(r, 900));
  const cleanContent = (rawText || title).trim();
  const sentences = cleanContent
    .split(/[.،!\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 8);

  const s1 =
    sentences[0] ||
    `موضوع (${title}) من المواضيع المهمة والممتعة في مادة ${subjectName}`;
  const s2 =
    sentences[1] || `يساعدنا هذا الدرس على فهم القواعد الأساسية وتطبيقها بذكاء`;
  const s3 =
    sentences[2] || `يرتبط هذا المفهوم بحياتنا اليومية ويجعل تفكيرنا أكثر دقة`;

  return {
    summary: `أهلاً بك يا بطل في درس «${title}»! 🌟\n\nفي هذا الدرس سنتعلم فكرة رائعة ومبسطة:\n• ${s1}.\n• ${s2}.\n• ${s3}.`,
    keyPoints: [
      `📌 الفكرة الأساسية: ${s1}.`,
      `💡 معلومة مهمة: ${s2}.`,
      `🔍 خلاصة التطبيق: ${s3}.`,
    ],
    goldenTip: `السر الذهبي لتفوقك في «${title}»: اربط الفكرة الأساسية بمثال عملي وستتذكرها دائماً! ✨`,
    questions: [
      {
        question: `ما هو الموضوع الرئيسي الذي يدور حوله درس «${title}»؟`,
        options: [
          'موضوع غير مرتبط بالمادة',
          `${s1.slice(0, 55)}`,
          'قواعد عامة فقط',
          'مقدمة تاريخية قديمة',
        ],
        correctIndex: 1,
        explanation: `كما ورد في بداية الدرس: ${s1}.`,
        difficulty: 'سهل',
      },
      {
        question: `أي من العبارات التالية صحيحة وفقاً لما تعلمناه في درس «${title}»؟`,
        options: [
          'المعلومات الواردة لا تنطبق علمياً',
          'الدرس لا يحتوي على قواعد تطبيقية',
          `${s2.slice(0, 55)}`,
          'لا توجد علاقة بين عناصر الدرس',
        ],
        correctIndex: 2,
        explanation: `العبارة الصحيحة من ملخص الدرس هي: ${s2}.`,
        difficulty: 'سهل',
      },
      {
        question: `ما النتيجة المهمة التي نستخلصها من دراسة «${title}»؟`,
        options: [
          `${s3.slice(0, 55)}`,
          'عدم الحاجة لمراجعة الأمثلة',
          'الاعتماد على الحفظ دون فهم',
          'تجاهل القوانين الأساسية',
        ],
        correctIndex: 0,
        explanation: `النقطة الاستنتاجية في الدرس توضح أن: ${s3}.`,
        difficulty: 'متوسط',
      },
      {
        question: `في أي مادة دراسية ندرس موضوع «${title}»؟`,
        options: [
          'التربية الفنية فقط',
          'الرياضة البدنية',
          'الموسيقى',
          `مادة ${subjectName}`,
        ],
        correctIndex: 3,
        explanation: `ندرس هذا الموضوع المهم ضمن منهج مادة ${subjectName}.`,
        difficulty: 'سهل',
      },
      {
        question: `سؤال الأبطال 🏆: كيف تتفوق في أسئلة «${title}»؟`,
        options: [
          'التسرع بدون قراءة السؤال',
          'ترك الأسئلة الصعبة فارغة',
          `فهم الفكرة الأساسية (${s1.slice(0, 35)}...) وتطبيقها بتركيز`,
          'اختيار أول إجابة عشوائياً',
        ],
        correctIndex: 2,
        explanation: `الفهم العميق للفكرة الأساسية والتأني في القراءة هو سر الأبطال المتفوقين!`,
        difficulty: 'تحدي الأبطال',
      },
    ],
    generatedBy: 'Smart AI Engine 🤖',
  };
}

export async function askSmartTutor({ question, lesson }) {
  const apiKey = getGeminiApiKey();

  if (apiKey) {
    try {
      const prompt = `
أنت "المعلم الذكي" في تطبيق مساعد الطالب الذكي.
الدرس الحالي: "${lesson.title}" في مادة "${lesson.subjectName}".
ملخص الدرس: "${lesson.aiSummary}".
سؤال الطالب: "${question}"
أجب الطالب باللغة العربية بأسلوب مشجع ومبسط جداً مع إيموجي.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (reply) return reply.trim();
      }
    } catch (e) {
      console.warn('Tutor fallback:', e);
    }
  }

  await new Promise((r) => setTimeout(r, 500));
  return `سؤال ذكي جداً يا بطل حول «${lesson.title}»! 🌟\n\nتذكّر أن:\n${
    lesson.aiKeyPoints?.[0] || lesson.aiSummary
  }\n\n💡 نصيحتي الذهبية لك: ${lesson.aiGoldenTip}`;
}
