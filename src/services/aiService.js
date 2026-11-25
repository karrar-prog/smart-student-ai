// ============================================================================
// محرك الذكاء الاصطناعي (AI Engine) - متوافق 100% مع الويب ومع Expo (React Native)
// ============================================================================

import { getDatabaseState, saveSharedGeminiApiKey } from './dbService';

const STORAGE_AI_KEY = 'smart_student_gemini_api_key';

export function getGeminiApiKey() {
  const localKey = (localStorage.getItem(STORAGE_AI_KEY) || '').trim();
  if (localKey) return localKey;
  try {
    const dbKey = (getDatabaseState()?.geminiApiKey || '').trim();
    if (dbKey) {
      localStorage.setItem(STORAGE_AI_KEY, dbKey);
      return dbKey;
    }
  } catch {
    // ignore
  }
  return '';
}

export function setGeminiApiKey(key) {
  const clean = (key || '').trim();
  localStorage.setItem(STORAGE_AI_KEY, clean);
  try {
    saveSharedGeminiApiKey(clean);
  } catch {
    // ignore
  }
}

async function callGeminiModels(apiKey, payload) {
  const models = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-flash-latest',
  ];
  for (const model of models) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      if (response.ok) {
        const data = await response.json();
        const textResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (textResponse) return textResponse;
      }
    } catch (e) {
      console.warn(`Gemini model ${model} error:`, e);
    }
  }
  return null;
}

export async function analyzeLessonWithAI({
  title,
  subjectName,
  stageName,
  rawText,
  fileDataUrl,
  fileMimeType,
  imageDataUrls,
  teacherAudioDataUrl,
  teacherAudioMimeType,
  questionCount = 5,
}) {
  const targetQuestionCount = Math.max(
    1,
    Math.min(30, Number(questionCount) || 5)
  );
  const apiKey = getGeminiApiKey();

  if (apiKey) {
    try {
      const promptText = `
أنت "مساعد الطالب الذكي"، معلم ذكي ومبسط ومحبوب للطلاب في مرحلة (${stageName || 'المدرسة'}) لمادة (${subjectName || 'الدرس'}).
قام الأستاذ برفع درس بعنوان: "${title}".
${rawText ? `محتوى المادة النصي المرفوع من الأستاذ:\n${rawText}` : 'يرجى قراءة ملف أو صورة المادة المرفقة بعناية.'}
${
  teacherAudioDataUrl
    ? `\n🎙️ هام جداً: أرفق الأستاذ أيضاً تسجيلاً صوتياً خاصاً بتوجيهك أنت (الذكاء الاصطناعي) يشرح فيه ما تم شرحه للطلاب اليوم وما يجب أن تركز عليه في هذه المادة. استمع جيداً لتسجيل الأستاذ الصوتي والتزم بتوجيهاته بدقة في صياغة الملخص والنقاط الذهبية والأسئلة الـ (${targetQuestionCount})!`
    : ''
}

المطلوب منك إرجاع النتيجة بصيغة JSON فقط (بدون أي نص خارج JSON) تحتوي على الحقول التالية:
{
  "summary": "شرح مبسط وممتع للدرس بأسلوب قصصي واضح يفهمه الطالب بسرعة (فقرتين إلى 3 فقرات) مع التركيز على ما وجه به الأستاذ",
  "keyPoints": [
    "نقطة مهمة 1 مع إيموجي مناسب",
    "نقطة مهمة 2 مع إيموجي مناسب",
    "نقطة مهمة 3 مع إيموجي مناسب",
    "نقطة مهمة 4 مع إيموجي مناسب"
  ],
  "goldenTip": "نصيحة ذهبية أو طريقة ذكية لتذكر فكرة الدرس الأساسية بالامتحان",
  "questions": [
    {
      "question": "نص السؤال الأول؟",
      "options": ["الخيار الأول", "الخيار الثاني", "الخيار الثالث", "الخيار الرابع"],
      "correctIndex": 0,
      "explanation": "توضيح بسيط لماذا هذا الجواب هو الصحيح",
      "difficulty": "سهل"
    }
  ]
}
يرجى توليد ${targetQuestionCount} أسئلة متنوعة بالضبط (بين سهل، متوسط، وتحدي الأبطال) من صميم الدرس وتوجيهات الأستاذ بحيث تختلف مواقع الإجابة الصحيحة (correctIndex بين 0 و 1 و 2 و 3).
`;

      const parts = [{ text: promptText }];

      const mediaDataUrls =
        Array.isArray(imageDataUrls) && imageDataUrls.length > 0
          ? imageDataUrls
          : fileDataUrl
          ? [fileDataUrl]
          : [];

      mediaDataUrls.forEach((dataUrl) => {
        if (typeof dataUrl === 'string' && dataUrl.includes('base64,')) {
          const base64Data = dataUrl.split('base64,')[1];
          const rawMime =
            dataUrl.substring(
              dataUrl.indexOf(':') + 1,
              dataUrl.indexOf(';')
            ) ||
            fileMimeType ||
            'image/jpeg';
          const cleanMime = rawMime.split(';')[0].trim();
          parts.push({
            inline_data: {
              mime_type: cleanMime,
              data: base64Data,
            },
          });
        }
      });

      if (teacherAudioDataUrl && teacherAudioDataUrl.includes('base64,')) {
        const audioBase64 = teacherAudioDataUrl.split('base64,')[1];
        const rawAudioMime =
          teacherAudioMimeType ||
          teacherAudioDataUrl.substring(
            teacherAudioDataUrl.indexOf(':') + 1,
            teacherAudioDataUrl.indexOf(';')
          ) ||
          'audio/webm';
        const cleanAudioMime = rawAudioMime.split(';')[0].trim();
        parts.push({
          inline_data: {
            mime_type: cleanAudioMime,
            data: audioBase64,
          },
        });
      }

      const textResponse = await callGeminiModels(apiKey, {
        contents: [{ parts }],
        generationConfig: {
          temperature: 0.4,
          responseMimeType: 'application/json',
        },
      });

      if (textResponse) {
        const cleanedJson = textResponse
          .replace(/^```json\s*/i, '')
          .replace(/```\s*$/i, '')
          .trim();
        const parsed = JSON.parse(cleanedJson);
        if (parsed.summary && Array.isArray(parsed.questions)) {
          return { ...parsed, generatedBy: 'Gemini AI ✨' };
        }
      }
    } catch (err) {
      console.warn('Gemini API fallback triggered:', err);
    }
  }

  await new Promise((res) => setTimeout(res, 1600));

  const cleanContent = (rawText || '').trim();
  const sentences = cleanContent
    .split(/[.،\n!؟]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 10);

  const summary =
    cleanContent.length > 30
      ? `أهلاً بك يا بطل في درس (${title}) ضمن مادة ${subjectName}! 🌟\n\nيتحدث هذا الدرس بشكل مبسط عن: ${cleanContent.slice(0, 280)}${cleanContent.length > 280 ? '...' : ''}\n\nالهدف الأساسي من هذا الدرس هو أن تفهم الفكرة الرئيسية وتطبقها بذكاء بدلاً من الحفظ الصم، لتكون مستعداً للاختبارات السريعة وتحديات الأصدقاء!`
      : `أهلاً بك يا بطل في المراجعة الذكية لدرس "${title}" في مادة ${subjectName}! 🌟\n\nقام الذكاء الاصطناعي بتحليل المادة المرفوعة من أستاذك وتلخيصها لك بأسلوب سهل وممتع يساعدك على الفهم السريع وحصد النقاط في المسابقات.`;

  const keyPoints =
    sentences.length >= 3
      ? sentences.slice(0, 4).map((s, idx) => `${['💡', '📌', '🚀', '🎯'][idx % 4]} ${s}`)
      : [
          `💡 الفكرة الأساسية في درس (${title}) تعتمد على الفهم والربط بين المعلومات.`,
          `📌 ركّز على المصطلحات والتعاريف الواردة في شرح الأستاذ لمادة ${subjectName}.`,
          `🚀 تطبيق الأمثلة العملية يساعدك على حل الأسئلة بأسرع وقت في طور التحدي.`,
          `🎯 راجع النقاط المهمة قبل دخول مسابقة الأصدقاء لكسب 50 نقطة إضافية!`,
        ];

  const baseQuestions = [
    {
      question: `ما هو الموضوع الرئيسي الذي يركز عليه درس "${title}" في مادة ${subjectName}؟`,
      options: [
        sentences[0] ? sentences[0].slice(0, 65) : `فهم وتطبيق مفاهيم ${title} الأساسية`,
        'موضوع خارجي لا علاقة له بالمادة الدراسية',
        'حفظ الأرقام فقط دون فهم المعنى العلمي',
        'تجاهل الأمثلة التطبيقية في الكتاب',
      ],
      correctIndex: 0,
      explanation: `لأن درس "${title}" يهدف بالدرجة الأولى إلى إتقان هذه المفاهيم وتطبيقها الصحيح.`,
      difficulty: 'سهل',
    },
    {
      question: `أيٌّ من النقاط التالية تُعد معلومة صحيحة وردت في مراجعة درس (${title})؟`,
      options: [
        'المعلومات الواردة في الدرس لا تحتاج إلى مراجعة',
        sentences[1] ? sentences[1].slice(0, 65) : `التركيز على القواعد والأمثلة المشروحة في ${title}`,
        'جميع الخيارات خاطئة تماماً',
        'الدرس مخصص للمرحلة الجامعية فقط',
      ],
      correctIndex: 1,
      explanation: 'هذه النقطة مستخلصة مباشرة من المحتوى الذي رفعه الأستاذ للدرس.',
      difficulty: 'سهل',
    },
    {
      question: `عند تطبيق ما تعلمناه في درس "${title}"، ما هي الطريقة الأذكى للوصول إلى الجواب الصحيح؟`,
      options: [
        'التخمين العشوائي بدون قراءة السؤال',
        'الاعتماد على الحفظ دون فهم خطوات الدرس',
        'تحليل معطيات السؤال وربطها بالقاعدة الأساسية للدرس',
        'ترك السؤال بدون إجابة',
      ],
      correctIndex: 2,
      explanation: 'ربط المعطيات بالقاعدة المشروحة في الملخص الذكي يضمن لك الإجابة الصحيحة بأقل وقت.',
      difficulty: 'متوسط',
    },
    {
      question: `سؤال تحدي الأبطال 🏆: إذا واجهت سؤالاً تطبيقياً حول "${title}" في المسابقة، علامَ تعتمد لحسم النتيجة؟`,
      options: [
        sentences[2] ? sentences[2].slice(0, 65) : `تطبيق الفكرة الجوهرية لدرس ${title} بدقة وسرعة`,
        'اختيار أطول إجابة دائماً دون قراءتها',
        'انتظار انتهاء الوقت المحدد للسؤال',
        'تغيير موضوع الدرس بالكامل',
      ],
      correctIndex: 0,
      explanation: 'أحسنت! الفهم العميق لفكرة الدرس هو سر التفوق في تحديات المساعد الذكي.',
      difficulty: 'تحدي الأبطال',
    },
    {
      question: `ما الفائدة الأساسية من مراجعة النقاط الذهبية لدرس "${title}" قبل الامتحان؟`,
      options: [
        'تثبيت المعلومات المهمة وسرعة استذكارها في الامتحان',
        'نسيان القواعد الأساسية للدرس',
        'عدم الحاجة لقراءة السؤال',
        'تأجيل الدراسة ليوم آخر',
      ],
      correctIndex: 0,
      explanation: 'مراجعة النقاط الذهبية تساعد على تثبيت الأفكار الرئيسية واسترجاعها بسرعة.',
      difficulty: 'متوسط',
    },
  ];

  const generatedQuestions = [];
  for (let i = 0; i < targetQuestionCount; i++) {
    if (i < baseQuestions.length) {
      generatedQuestions.push(baseQuestions[i]);
    } else {
      const sent = sentences[i % Math.max(1, sentences.length)];
      const difficulties = ['سهل', 'متوسط', 'تحدي الأبطال'];
      generatedQuestions.push({
        question: `سؤال إضافي (${i + 1}) حول "${title}": ما العبارة الأدق علمياً ضمن مادة ${subjectName}؟`,
        options: [
          sent ? sent.slice(0, 65) : `إتقان القاعدة التطبيقية رقم ${i + 1} في درس ${title}`,
          'عدم وجود علاقة بين مفاهيم الدرس',
          'الاعتماد على إجابات غير علمية',
          'ترك مراجعة أمثلة الأستاذ',
        ],
        correctIndex: 0,
        explanation: `هذه المعلومة من الركائز المهمة في درس "${title}".`,
        difficulty: difficulties[i % difficulties.length],
      });
    }
  }

  return {
    generatedBy: 'المحرك الذكي المدمج 🤖',
    summary,
    keyPoints,
    goldenTip: `تذكّر دائماً في درس "${title}": قراءة السؤال بتركيز في أول 3 ثوانٍ تعطيك أفضلية الفوز بالمركز الأول في المسابقات!`,
    questions: generatedQuestions,
  };
}

export async function askSmartTutor({ question, lesson, chatHistory = [] }) {
  const apiKey = getGeminiApiKey();

  if (apiKey) {
    try {
      const historyText = chatHistory
        .slice(-6)
        .map((m) => `${m.sender === 'student' ? 'الطالب' : 'المساعد الذكي'}: ${m.text}`)
        .join('\n');

      const prompt = `
أنت "مساعد الطالب الذكي" (تعمل بأسلوب تطبيق Gemini الذكي والودود).
أنت تشرح وتتحاور مع طالب حول درس: "${lesson.title}" في مادة "${lesson.subjectName}".
ملخص الدرس: ${lesson.aiSummary}
النقاط المهمة: ${(lesson.aiKeyPoints || []).join(' | ')}
النصيحة الذهبية: ${lesson.aiGoldenTip || ''}
محتوى الدرس الأصلي الذي رفعه الأستاذ: ${lesson.rawText || ''}

سجل المحادثة السابق:
${historyText}

رسالة الطالب الجديدة: "${question}"

تعليمات مهمة جداً لأسلوب الرد:
1. التزم التزاماً تاماً بالكتابة باللغة العربية الفصحى السليمة والمبسطة والواضحة فقط، مع وضع حركات التشكيل المناسبة على الكلمات المهمة لضمان نطق صوتي فصيح وسليم، ويُمنع منعاً باتاً استخدام اللهجة المصرية أو أي لهجة عامية في أي كلمة.
2. إذا ألقى الطالب التحية فقط (مثل: مرحبا، السلام عليكم، أهلاً، كيف حالك)، رد عليه بتحية لطيفة ومبهجة باللغة العربية الفصحى، وعرّفه أنك جاهز لمساعدته في درس "${lesson.title}"، واعرض عليه أن تشرح له الدرس أو تختبره بسؤال.
3. إذا تحدث الطالب في موضوع جانبي خارج إطار الدرس تماماً، رد عليه بلطف ومرونة وابتسامة باللغة العربية الفصحى، ووضّح له بطريقة محببة: "نحن هنا يا بطل لنساعدك في فهم درس (${lesson.title}) والتفوق فيه، هيا نعود إلى موضوع درسنا اليوم!" ثم اذكر له معلومة مشوقة أو سؤالاً من الدرس.
4. إذا سأل سؤالاً يخص الدرس أو طلب شرحاً، أجب باللغة العربية الفصحى المبسطة بأسلوب تفاعلي ومنظم بنقاط واضحة، وفي نهاية رسالتك اطرح عليه سؤالاً تشويقياً قصيراً باللغة العربية الفصحى يجعل الحوار مستمراً.
`;
      const reply = await callGeminiModels(apiKey, {
        contents: [{ parts: [{ text: prompt }] }],
      });
      if (reply) return reply;
    } catch (e) {
      console.warn('AI tutor fallback:', e);
    }
  }

  await new Promise((r) => setTimeout(r, 650));

  const q = question.trim();
  const normalizedQ = q
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/[؟?!.,،]/g, '')
    .trim()
    .toLowerCase();

  // 1. التعامل المرن واللطيف مع التحيات والسلام
  const greetingWords = [
    'مرحبا',
    'مرحبه',
    'اهلا',
    'هلا',
    'هلو',
    'السلام عليكم',
    'سلام عليكم',
    'سلام',
    'صباح الخير',
    'مساء الخير',
    'شلونك',
    'كيف حالك',
    'كيفك',
    'شكو ماكو',
    'هاي',
    'hi',
    'hello',
  ];
  if (
    greetingWords.some(
      (g) => normalizedQ === g || normalizedQ.startsWith(g + ' ')
    )
  ) {
    return `أهلاً وسهلاً بك يا بطل! 👋✨\n\nأنا مساعدك الذكي، وموجود معك هنا لأساعدك على فهم وإتقان درس **(${lesson.title})** في مادة **${lesson.subjectName}** بأسهل وأمتع طريقة!\n\nيمكنك أن تسألني أي سؤال يخص موضوع الدرس، أو نبدأ فوراً بتلخيص الفكرة الأساسية أو طرح سؤال تدريبي سريع.. بماذا تحب أن نبدأ؟ 🚀📚`;
  }

  if (q.includes('لخص') || q.includes('اشرح') || q.includes('بسيط')) {
    return `بكل سرور يا بطل! ✨ إليك الشرح المبسط لدرس **${lesson.title}**:\n\n${
      lesson.aiSummary
    }\n\n💡 **الخلاصة الذهبية:** ${
      lesson.aiGoldenTip || 'افهم الفكرة الأساسية واربطها بالأمثلة العملية.'
    }\n\nهل تحب أن أعرض لك أهم النقاط التي تتكرر في الامتحان، أم أطرح عليك سؤالاً سريعاً نختبر به فهمك؟ 🚀`;
  }

  if (q.includes('نقاط') || q.includes('امتحان') || q.includes('مهم')) {
    const pts = (lesson.aiKeyPoints || [])
      .map((p, i) => `${i + 1}. ${p}`)
      .join('\n');
    return `🎯 هذه **أهم النقاط الذهبية** في درس (${lesson.title}) والمرشحة بقوة للامتحان والمسابقات:\n\n${pts}\n\n🌟 **نصيحة سريعة:** ${
      lesson.aiGoldenTip || 'ركز على فهم العلاقة بين هذه النقاط.'
    }\n\nهل هناك نقطة منها تحب أن أوضحها لك بمثال أبسط؟`;
  }

  if (q.includes('مثال') || q.includes('قصة') || q.includes('تخيل')) {
    return `تخيّل معي هذه الفكرة المبسطة عن **${lesson.title}** 🌟:\n\n${
      lesson.aiSummary
    }\n\nوبهذا المثال العملي تصبح المعلومة راسخة في ذهنك ولن تنساها أبداً وقت المسابقة! 🧠✨\n\nهل تحب الآن أن أطرح عليك سؤال تحدٍّ سريع من الدرس؟`;
  }

  if (q.includes('اسألني') || q.includes('اختبرني') || q.includes('سؤال')) {
    const sampleQ = lesson.aiQuestions?.[0];
    if (sampleQ) {
      return `هيا يا بطل، هذا سؤال ذكي لك من صميم درس **${lesson.title}** 🧠🔥:\n\n❓ **${
        sampleQ.question
      }**\n\nالخيارات:\n• ${sampleQ.options.join('\n• ')}\n\nاكتب لي إجابتك في الرسالة القادمة لنرى تميزك! 👇`;
    }
  }

  const sampleQ = lesson.aiQuestions?.[0];
  if (
    sampleQ &&
    sampleQ.options.some((opt) => q.includes(opt.slice(0, 8)) || opt.includes(q))
  ) {
    const rightAns = sampleQ.options[sampleQ.correctIndex];
    return `أحسنت يا بطل على هذه المحاولة الرائعة! 👏✨\n\n✅ **الإجابة الصحيحة هي:** (${rightAns})\n💡 **التوضيح العلمي:** ${sampleQ.explanation}\n\nيمكنك الآن الضغط على زر **"امتحان سريع"** أو **"تحدي الأصدقاء ⚔️"** لتحصل على نقاط إضافية تضاف إلى رصيدك!`;
  }

  // التحقق مما إذا كان السؤال مرتبطاً بكلمات الدرس أو سؤالاً علمياً، أم حديثاً جانبياً
  const lessonContextText = `${lesson.title || ''} ${lesson.subjectName || ''} ${
    lesson.aiSummary || ''
  } ${(lesson.aiKeyPoints || []).join(' ')} ${lesson.rawText || ''}`.toLowerCase();
  const questionTokens = normalizedQ
    .split(/\s+/)
    .filter((w) => w.length >= 3);
  const isLessonRelated =
    questionTokens.some((tok) => lessonContextText.includes(tok)) ||
    ['ماذا', 'ماهو', 'ما هي', 'كيف', 'لماذا', 'علل', 'عرف', 'عدد', 'فائدة', 'معنى', 'شنو', 'ليش', 'شلون'].some(
      (kw) => normalizedQ.includes(kw)
    );

  if (!isLessonRelated) {
    return `أهلاً بك يا بطل! 😊 حديثك لطيف جداً، ولكننا هنا في مهمة علمية ذكية لنساعدك في فهم درس **(${
      lesson.title
    })** وعدم تشتيت تركيزك بمواضيع جانبية 🌟\n\nهيا نعود إلى درسنا اليوم! إليك معلومة سريعة ومهمة من الدرس:\n• ${
      lesson.aiKeyPoints?.[0] || lesson.aiSummary?.slice(0, 140)
    }\n\nهل تحب أن أشرح لك هذه النقطة بتفصيل أكثر أم نختبر معلوماتك بسؤال سريع؟ 📚🚀`;
  }

  return `سؤال ممتاز يا بطل حول درس **(${lesson.title})**! ✨ إليك التوضيح المبسط باللغة العربية الفصحى:\n\n• ${
    lesson.aiKeyPoints?.[0] || lesson.aiSummary?.slice(0, 150)
  }\n• ${
    lesson.aiKeyPoints?.[1] || lesson.aiGoldenTip || ''
  }\n\nإذا كنت ترغب في توضيح إضافي حول أي فقرة في الدرس أو تريد سؤالاً تدريبياً سريعاً، أخبرني فوراً! 🤖🚀`;
}

// قاموس تشكيل وتجويد النطق بالعربية الفصحى السليمة لضمان قراءة صوتية إذاعية واضحة خالية من العامية
const FUSHA_PHRASE_VOCALIZATIONS = [
  [/أهلاً وسهلاً بك يا بطل/g, 'أَهْلاً وَسَهْلاً بِكَ يَا بَطَلُ'],
  [/أهلا وسهلا بك يا بطل/g, 'أَهْلاً وَسَهْلاً بِكَ يَا بَطَلُ'],
  [/أهلاً بك يا بطل/g, 'أَهْلاً بِكَ يَا بَطَلُ'],
  [/أهلا بك يا بطل/g, 'أَهْلاً بِكَ يَا بَطَلُ'],
  [/يا بطل/g, 'يَا بَطَلُ'],
  [/أنا مساعدك الذكي/g, 'أَنَا مُسَاعِدُكَ الذَّكِيُّ'],
  [/مساعد الطالب الذكي/g, 'مُسَاعِدُ الطَّالِبِ الذَّكِيُّ'],
  [/المساعد الذكي/g, 'المُسَاعِدُ الذَّكِيُّ'],
  [/بكل سرور/g, 'بِكُلِّ سُرُورٍ'],
  [/إليك الشرح المبسط/g, 'إِلَيْكَ الشَّرْحُ المُبَسَّطُ'],
  [/إليك التوضيح المبسط/g, 'إِلَيْكَ التَّوْضِيحُ المُبَسَّطُ'],
  [/باللغة العربية الفصحى/g, 'بِاللُّغَةِ العَرَبِيَّةِ الفُصْحَى'],
  [/اللغة العربية/g, 'اللُّغَةُ العَرَبِيَّةُ'],
  [/اللغة الإنجليزية/g, 'اللُّغَةُ الإِنْجِلِيزِيَّةُ'],
  [/التربية الإسلامية/g, 'التَّرْبِيَةُ الإِسْلَامِيَّةُ'],
  [/الإسلامية/g, 'الإِسْلَامِيَّةُ'],
  [/الاجتماعيات/g, 'الاِجْتِمَاعِيَّاتُ'],
  [/الرياضيات/g, 'الرِّيَاضِيَّاتُ'],
  [/العلوم/g, 'العُلُومُ'],
  [/الفيزياء/g, 'الفِيزْيَاءُ'],
  [/الخلاصة الذهبية/g, 'الخُلَاصَةُ الذَّهَبِيَّةُ'],
  [/النقاط الذهبية/g, 'النِّقَاطُ الذَّهَبِيَّةُ'],
  [/النصيحة الذهبية/g, 'النَّصِيحَةُ الذَّهَبِيَّةُ'],
  [/أهم النقاط/g, 'أَهَمُّ النِّقَاطِ'],
  [/الإجابة الصحيحة هي/g, 'الإِجَابَةُ الصَّحِيحَةُ هِيَ'],
  [/الجواب الصحيح هو/g, 'الجَوَابُ الصَّحِيحُ هُوَ'],
  [/التوضيح العلمي/g, 'التَّوْضِيحُ العِلْمِيُّ'],
  [/الفكرة الأساسية/g, 'الفِكْرَةُ الأَسَاسِيَّةُ'],
  [/الفكرة الرئيسية/g, 'الفِكْرَةُ الرَّئِيسِيَّةُ'],
  [/البناء الضوئي/g, 'البِنَاءِ الضَّوْئِيِّ'],
  [/النباتات الخضراء/g, 'النَّبَاتَاتِ الخَضْرَاءِ'],
  [/ثنائي أوكسيد الكربون/g, 'ثُنَائِي أُوكْسِيدِ الكَرْبُونِ'],
  [/غاز الأوكسجين/g, 'غَازِ الأُوكْسِجِينِ'],
  [/ضوء الشمس/g, 'ضَوْءِ الشَّمْسِ'],
  [/الطاقة الشمسية/g, 'الطَّاقَةِ الشَّمْسِيَّةِ'],
  [/الكلوروفيل/g, 'الكُلُورُوفِيل'],
  [/اليخضور/g, 'اليَخْضُورِ'],
  [/سكر الجلوكوز/g, 'سُكَّرِ الجُلُوكُوزِ'],
  [/الكائنات الحية/g, 'الكَائِنَاتُ الحَيَّةُ'],
  [/الأعداد العشرية/g, 'الأَعْدَادِ العَشْرِيَّةِ'],
  [/الفاصلة العشرية/g, 'الفَاصِلَةِ العَشْرِيَّةِ'],
  [/الكسور العشرية/g, 'الكُسُورِ العَشْرِيَّةِ'],
  [/المبتدأ والخبر/g, 'المُبْتَدَأِ وَالخَبَرِ'],
  [/الجملة الاسمية/g, 'الجُمْلَةِ الاِسْمِيَّةِ'],
  [/الجملة الفعلية/g, 'الجُمْلَةِ الفِعْلِيَّةِ'],
  [/امتحان سريع/g, 'امْتِحَانٍ سَرِيعٍ'],
  [/تحدي الأصدقاء/g, 'تَحَدِّي الأَصْدِقَاءِ'],
  [/سؤال ممتاز/g, 'سُؤَالٌ مُمْتَازٌ'],
  [/أحسنت/g, 'أَحْسَنْتَ'],
  [/تخيّل معي/g, 'تَخَيَّلْ مَعِي'],
  [/تخيل معي/g, 'تَخَيَّلْ مَعِي'],
  [/تذكّر دائماً/g, 'تَذَكَّرْ دَائِماً'],
  [/تذكر دائما/g, 'تَذَكَّرْ دَائِماً'],
  [/هيا نعود إلى درسنا اليوم/g, 'هَيَّا نَعُودُ إِلَى دَرْسِنَا اليَوْمَ'],
  [/بماذا تحب أن نبدأ/g, 'بِمَاذَا تُحِبُّ أَنْ نَبْدَأَ'],
  [/هل تحب أن/g, 'هَلْ تُحِبُّ أَنْ'],
  [/إذا كنت ترغب في/g, 'إِذَا كُنْتَ تَرْغَبُ فِي'],
  [/أخبرني فوراً/g, 'أَخْبِرْنِي فَوْراً'],
];

function vocalizeArabicForFushaSpeech(text) {
  let out = text;
  for (const [pattern, replacement] of FUSHA_PHRASE_VOCALIZATIONS) {
    out = out.replace(pattern, replacement);
  }
  return out;
}

// تنظيف النص بالكامل من جميع الإيموجيات والرموز الزخرفية والماركداون وتشكيله ليكون النطق بالفصحى واضحاً وطبيعياً
export function cleanTextForArabicSpeech(rawText) {
  if (!rawText || typeof rawText !== 'string') return '';
  const stripped = rawText
    // إزالة جميع الإيموجيات والرموز التصويرية
    .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '')
    // إزالة أزواج الـ Surrogate الخاصة بالإيموجيات والرموز الإضافية
    .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '')
    // إزالة رموز الأشكال والأسهم ومحددات الإيموجي المركبة
    .replace(/[\u2190-\u21FF\u2300-\u27BF\u2B00-\u2BFF\uFE00-\uFE0F\u200D\u20E3]/g, '')
    // إزالة رموز الماركداون والأقواس الزخرفية
    .replace(/[*#`_~•▪▫|<>«»[\]{}()—–\-+=^/\\"]/g, ' ')
    // تحويل الأسطر الجديدة إلى نهاية جملة طبيعية لعدم تقطيع النفس الصوتي
    .replace(/\s*\n+\s*/g, '. ')
    // تنظيف النقاط والفواصل المتكررة
    .replace(/(?:\.\s*){2,}/g, '. ')
    .replace(/(?:\s*،\s*)+/g, '، ')
    .replace(/\s+/g, ' ')
    .trim();

  return vocalizeArabicForFushaSpeech(stripped);
}

function pcm16Base64ToWavPayload(base64Data, sampleRate = 24000) {
  const binaryStr = window.atob(base64Data);
  const pcmLen = binaryStr.length;
  const wavBuffer = new ArrayBuffer(44 + pcmLen);
  const view = new DataView(wavBuffer);

  const writeStr = (offset, str) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + pcmLen, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // PCM format = 1
  view.setUint16(22, 1, true); // Mono = 1 channel
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate (sampleRate * blockAlign)
  view.setUint16(32, 2, true); // block align (1 * 2 bytes)
  view.setUint16(34, 16, true); // 16-bit
  writeStr(36, 'data');
  view.setUint32(40, pcmLen, true);

  const bytes = new Uint8Array(wavBuffer, 44);
  for (let i = 0; i < pcmLen; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }

  const blob = new Blob([wavBuffer], { type: 'audio/wav' });
  return {
    audioUrl: URL.createObjectURL(blob),
    wavBuffer,
  };
}

// تقسيم النص الطويل إلى مقاطع ذكية: المقطع الأول قصير ليبدأ الصوت الجميل بسرعة فورية، وبقية المقاطع تجهز بالخلفية أثناء الاستماع
export function splitTextIntoSpeechSegments(rawText) {
  const clean = cleanTextForArabicSpeech(rawText);
  if (!clean) return [];
  if (clean.length <= 150) return [clean];

  const rawSentences = clean
    .split(/(?<=[.؟!])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (rawSentences.length <= 1) {
    // إذا كانت جملة واحدة طويلة بدون نقاط، نقسمها عند الفواصل
    const parts = clean
      .split(/(?<=،)\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length <= 1) return [clean];
    const segments = [];
    let current = '';
    for (const p of parts) {
      const maxLen = segments.length === 0 ? 115 : 230;
      if (current && current.length + p.length + 1 > maxLen) {
        segments.push(current);
        current = p;
      } else {
        current = current ? `${current} ${p}` : p;
      }
    }
    if (current) segments.push(current);
    return segments;
  }

  const segments = [];
  let current = '';
  for (const sent of rawSentences) {
    // المقطع الأول يكون قصيراً (أول جملة أو ~115 حرفاً) ليشتغل الصوت الجميل خلال لحظة
    const maxLen = segments.length === 0 ? 120 : 250;
    if (current && current.length + sent.length + 1 > maxLen) {
      segments.push(current);
      current = sent;
    } else {
      current = current ? `${current} ${sent}` : sent;
    }
  }
  if (current) segments.push(current);
  return segments;
}

const ttsAudioCache = new Map();
const ttsInFlightMap = new Map();

export function getCachedGeminiSpeechPayload(rawText, voiceGender = 'male') {
  const cleanText = cleanTextForArabicSpeech(rawText);
  if (!cleanText) return null;
  const genderKey = voiceGender === 'female' ? 'female' : 'male';
  return ttsAudioCache.get(`${genderKey}::${cleanText}`) || null;
}

export function getCachedGeminiSpeechUrl(rawText, voiceGender = 'male') {
  return getCachedGeminiSpeechPayload(rawText, voiceGender)?.audioUrl || null;
}

export async function generateGeminiArabicSpeechPayload(
  rawText,
  voiceGender = 'male'
) {
  const cleanText = cleanTextForArabicSpeech(rawText);
  if (!cleanText) return null;
  const genderKey = voiceGender === 'female' ? 'female' : 'male';
  const cacheKey = `${genderKey}::${cleanText}`;

  if (ttsAudioCache.has(cacheKey)) {
    return ttsAudioCache.get(cacheKey);
  }
  if (ttsInFlightMap.has(cacheKey)) {
    return ttsInFlightMap.get(cacheKey);
  }

  const apiKey = getGeminiApiKey();
  if (!apiKey) return null;

  const geminiVoiceName = genderKey === 'female' ? 'Aoede' : 'Orus';

  const taskPromise = (async () => {
    const ttsModels = [
      'gemini-2.5-flash-preview-tts',
      'gemini-3.1-flash-tts-preview',
      'gemini-2.5-pro-preview-tts',
    ];
    for (let attempt = 0; attempt < 2; attempt++) {
      for (const model of ttsModels) {
        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [
                  {
                    parts: [
                      {
                        text: `اقرأ النص التعليمي التالي باللغة العربية الفصحى الإذاعية السليمة والواضحة تماماً، وبنطق فصيح خالٍ تماماً من اللهجة المصرية أو أي لهجة عامية:\n${cleanText}`,
                      },
                    ],
                  },
                ],
                generationConfig: {
                  responseModalities: ['AUDIO'],
                  speechConfig: {
                    voiceConfig: {
                      prebuiltVoiceConfig: {
                        voiceName: geminiVoiceName,
                      },
                    },
                  },
                },
              }),
            }
          );

          if (response.status === 429 || response.status === 503) {
            await new Promise((r) => setTimeout(r, 700));
            continue;
          }

          if (response.ok) {
            const data = await response.json();
            const inlineData =
              data?.candidates?.[0]?.content?.parts?.[0]?.inlineData;
            if (inlineData?.data) {
              const mime = (inlineData.mimeType || '').toLowerCase();
              let payload = null;
              if (
                mime.includes('wav') ||
                mime.includes('mp3') ||
                mime.includes('ogg')
              ) {
                const binaryStr = window.atob(inlineData.data);
                const wavBuffer = new ArrayBuffer(binaryStr.length);
                const bytes = new Uint8Array(wavBuffer);
                for (let i = 0; i < binaryStr.length; i++) {
                  bytes[i] = binaryStr.charCodeAt(i);
                }
                const audioUrl = URL.createObjectURL(
                  new Blob([wavBuffer], { type: inlineData.mimeType })
                );
                payload = { audioUrl, wavBuffer };
              } else {
                const rateMatch = mime.match(/rate=(\d+)/);
                const rate = rateMatch ? Number(rateMatch[1]) : 24000;
                payload = pcm16Base64ToWavPayload(inlineData.data, rate);
              }
              if (payload?.audioUrl) {
                ttsAudioCache.set(cacheKey, payload);
                return payload;
              }
            }
          }
        } catch (e) {
          console.warn('Gemini TTS error:', e);
        }
      }
    }

    return null;
  })();

  ttsInFlightMap.set(cacheKey, taskPromise);
  try {
    return await taskPromise;
  } finally {
    ttsInFlightMap.delete(cacheKey);
  }
}

export async function generateGeminiArabicSpeechUrl(
  rawText,
  voiceGender = 'male'
) {
  const res = await generateGeminiArabicSpeechPayload(rawText, voiceGender);
  return res?.audioUrl || null;
}

export async function prefetchGeminiSpeechSegments(
  rawText,
  voiceGender = 'male'
) {
  const segments = splitTextIntoSpeechSegments(rawText);
  if (segments.length === 0) return;
  // تجهيز المقطع الأول فوراً ليعمل زر استماع بأقصى سرعة، ثم المقطع الثاني بعده
  await generateGeminiArabicSpeechPayload(segments[0], voiceGender);
  if (segments.length > 1) {
    generateGeminiArabicSpeechPayload(segments[1], voiceGender).catch(() => {});
  }
}
