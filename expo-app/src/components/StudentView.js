import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Image,
  StyleSheet,
} from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import * as Speech from 'expo-speech';
import * as ImagePicker from 'expo-image-picker';
import {
  requestStudentJoinSchoolStage,
  updateStudentProfile,
  addPointsToStudent,
  createChallengeRoom,
  inviteStudentToChallengeRoom,
  addBotToChallengeRoom,
  startChallengeGame,
  submitPlayerRoomAnswer,
  advanceOrFinishChallengeRoom,
  COLOR_THEMES,
} from '../services/dbService';
import { askSmartTutor } from '../services/aiService';

const STUDENT_EMOJIS = [
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
  '🧑‍🔬',
  '🚀',
  '🏆',
];

export default function StudentView({ studentId, dbState, onLogout }) {
  const allStudents = dbState.students || [];
  const student =
    allStudents.find((s) => s.id === studentId) || allStudents[0];

  const [activeTab, setActiveTab] = useState('review');
  const [selectedSubjectId, setSelectedSubjectId] = useState('all');
  const [activeLessonId, setActiveLessonId] = useState(null);
  const [inspectedStudentId, setInspectedStudentId] = useState(null);

  // الإعدادات
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editAvatar, setEditAvatar] = useState('👨‍🎓');
  const [editColor, setEditColor] = useState('indigo');
  const [profileMsg, setProfileMsg] = useState('');
  const [profileErr, setProfileErr] = useState('');

  // اختبار سريع
  const [quizLesson, setQuizLesson] = useState(null);
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  // المعلم الذكي
  const [tutorQuestion, setTutorQuestion] = useState('');
  const [tutorChat, setTutorChat] = useState([]);
  const [isAskingTutor, setIsAskingTutor] = useState(false);

  // المسابقات
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [showInviteFriendsList, setShowInviteFriendsList] = useState(false);
  const [myRoomAnswer, setMyRoomAnswer] = useState(null);

  // طلب الانضمام للمدرسة
  const [selectedSchoolId, setSelectedSchoolId] = useState(
    dbState.schools?.[0]?.id || ''
  );
  const [selectedStageId, setSelectedStageId] = useState(
    dbState.stages?.[0]?.id || ''
  );

  const stageSubjects = (dbState.subjects || []).filter(
    (s) => s.stageId === student?.stageId
  );
  const stageLessons = (dbState.lessons || []).filter(
    (l) => l.stageId === student?.stageId
  );
  const filteredLessons =
    selectedSubjectId === 'all'
      ? stageLessons
      : stageLessons.filter((l) => l.subjectId === selectedSubjectId);

  const activeLesson =
    stageLessons.find((l) => l.id === activeLessonId) || null;
  const activeRoom =
    (dbState.rooms || []).find((r) => r.id === activeRoomId) || null;

  const stageFriends = allStudents.filter(
    (s) =>
      s.id !== student?.id &&
      s.status === 'approved' &&
      s.stageId === student?.stageId
  );

  useEffect(() => {
    setMyRoomAnswer(null);
  }, [activeRoom?.currentQuestionIndex, activeRoom?.status]);

  const isImageAvatar = (val) =>
    typeof val === 'string' &&
    (val.startsWith('data:image') ||
      val.startsWith('file:') ||
      val.startsWith('http'));

  const openProfileSettings = () => {
    setEditName(student.name);
    setEditCode(student.code);
    setEditAvatar(student.avatar || '👨‍🎓');
    setEditColor(student.profileColor || 'indigo');
    setProfileMsg('');
    setProfileErr('');
    setIsProfileOpen(true);
  };

  const handlePickStudentPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });
      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        if (asset.base64) {
          setEditAvatar(
            `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`
          );
        } else if (asset.uri) {
          setEditAvatar(asset.uri);
        }
      }
    } catch (e) {
      // ignore picker error
    }
  };

  const handleSaveProfile = () => {
    setProfileMsg('');
    setProfileErr('');
    const res = updateStudentProfile(student.id, {
      name: editName,
      code: editCode,
      avatar: editAvatar,
      profileColor: editColor,
    });
    if (res.error) {
      setProfileErr(res.error);
      return;
    }
    setProfileMsg('تم حفظ الإعدادات بنجاح! ✅');
    setTimeout(() => setIsProfileOpen(false), 600);
  };

  const shuffleQuestions = (questions = []) =>
    questions.map((q) => {
      const correctText = q.options[q.correctIndex];
      const shuffled = [...q.options];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return {
        ...q,
        options: shuffled,
        correctIndex: shuffled.indexOf(correctText),
      };
    });

  const handleStartQuickQuiz = (lesson) => {
    setQuizLesson({
      ...lesson,
      aiQuestions: shuffleQuestions(lesson.aiQuestions || []),
    });
    setQuizIndex(0);
    setSelectedOption(null);
    setQuizScore(0);
    setQuizFinished(false);
    setActiveTab('quiz');
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
    }
  };

  const handleAskTutor = async () => {
    if (!tutorQuestion.trim() || !activeLesson || isAskingTutor) return;
    const qText = tutorQuestion.trim();
    setTutorQuestion('');
    const nextChat = [...tutorChat, { sender: 'student', text: qText }];
    setTutorChat(nextChat);
    setIsAskingTutor(true);
    try {
      const reply = await askSmartTutor({
        question: qText,
        lesson: activeLesson,
      });
      setTutorChat((prev) => [...prev, { sender: 'ai', text: reply }]);
    } finally {
      setIsAskingTutor(false);
    }
  };

  const activeStudentColor =
    COLOR_THEMES[student?.profileColor || 'indigo'] || COLOR_THEMES.indigo;

  if (student?.status !== 'approved') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerName}>مرحباً {student?.name}</Text>
          <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
            <Text style={styles.logoutBtnText}>خروج</Text>
          </TouchableOpacity>
        </View>
        <View style={{ padding: 20, gap: 12 }}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {student?.status === 'pending'
                ? '⏳ طلب انضمامك قيد المراجعة لدى الإدارة'
                : '🏫 اختر مدرستك ومرحلتك الدراسية للانضمام'}
            </Text>
            {student?.status !== 'pending' && (
              <TouchableOpacity
                onPress={() =>
                  requestStudentJoinSchoolStage(
                    student.id,
                    selectedSchoolId,
                    selectedStageId
                  )
                }
                style={styles.primaryBtn}
              >
                <Text style={styles.primaryBtnText}>
                  إرسال طلب الانضمام للمدرسة 🚀
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* نافذة إعدادات الطالب */}
      <Modal
        visible={isProfileOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsProfileOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>⚙️ الإعدادات</Text>
              <TouchableOpacity
                onPress={() => setIsProfileOpen(false)}
                style={styles.closeBtn}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {Boolean(profileMsg) && (
              <View style={styles.successBox}>
                <Text style={styles.successText}>{profileMsg}</Text>
              </View>
            )}
            {Boolean(profileErr) && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️ {profileErr}</Text>
              </View>
            )}

            <View style={{ alignItems: 'center', gap: 10 }}>
              <View
                style={[
                  styles.avatarPreview,
                  {
                    backgroundColor:
                      COLOR_THEMES[editColor]?.primary || '#6366f1',
                  },
                ]}
              >
                {isImageAvatar(editAvatar) ? (
                  <Image
                    source={{ uri: editAvatar }}
                    style={styles.avatarImg}
                  />
                ) : (
                  <Text style={{ fontSize: 32 }}>{editAvatar || '👨‍🎓'}</Text>
                )}
              </View>

              <TouchableOpacity
                onPress={handlePickStudentPhoto}
                style={styles.uploadPhotoBtn}
              >
                <Text style={styles.uploadPhotoBtnText}>
                  📷 تغيير صورتك من الجهاز
                </Text>
              </TouchableOpacity>

              <View style={styles.emojiGrid}>
                {STUDENT_EMOJIS.map((emo) => (
                  <TouchableOpacity
                    key={emo}
                    onPress={() => setEditAvatar(emo)}
                    style={[
                      styles.emojiBtn,
                      editAvatar === emo && styles.emojiBtnSelected,
                    ]}
                  >
                    <Text style={{ fontSize: 16 }}>{emo}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.colorRowBox}>
                <Text style={styles.colorRowLabel}>تغيير اللون:</Text>
                <View style={styles.colorSwatches}>
                  {Object.entries(COLOR_THEMES).map(([key, theme]) => (
                    <TouchableOpacity
                      key={key}
                      onPress={() => setEditColor(key)}
                      style={[
                        styles.colorCircle,
                        { backgroundColor: theme.swatch },
                        editColor === key && styles.colorCircleActive,
                      ]}
                    />
                  ))}
                </View>
              </View>
            </View>

            <View style={{ gap: 8, marginTop: 6 }}>
              <Text style={styles.fieldLabel}>الاسم</Text>
              <TextInput
                style={styles.input}
                value={editName}
                onChangeText={setEditName}
                textAlign="right"
              />

              <Text style={styles.fieldLabel}>كلمة السر (الرمز السري)</Text>
              <TextInput
                style={styles.input}
                value={editCode}
                onChangeText={setEditCode}
                textAlign="right"
              />

              <TouchableOpacity
                onPress={handleSaveProfile}
                style={styles.primaryBtn}
              >
                <Text style={styles.primaryBtnText}>حفظ التغييرات ✅</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* الهيدر */}
      <View style={styles.header}>
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={openProfileSettings}
            style={[
              styles.studentAvatarBox,
              { backgroundColor: activeStudentColor.primary },
            ]}
          >
            {isImageAvatar(student.avatar) ? (
              <Image
                source={{ uri: student.avatar }}
                style={styles.avatarImg}
              />
            ) : (
              <Text style={{ fontSize: 22 }}>{student.avatar || '👨‍🎓'}</Text>
            )}
          </TouchableOpacity>
          <View>
            <Text style={styles.headerName}>{student.name}</Text>
            <Text style={styles.headerPoints}>
              💎 {student.points || 0} نقطة • 🏆 {student.wins || 0} فوز
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row-reverse', gap: 6 }}>
          <TouchableOpacity
            onPress={openProfileSettings}
            style={styles.iconBtn}
          >
            <Text style={{ fontSize: 14 }}>⚙️</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
            <Text style={styles.logoutBtnText}>خروج</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* محتوى التبويبات */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 14, paddingBottom: 32, gap: 14 }}
      >
        {/* 1. المراجعة الذكية */}
        {activeTab === 'review' && (
          <View style={{ gap: 12 }}>
            {/* شريط المواد */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, flexDirection: 'row-reverse' }}
            >
              <TouchableOpacity
                onPress={() => {
                  setSelectedSubjectId('all');
                  setActiveLessonId(null);
                }}
                style={[
                  styles.subjectPill,
                  selectedSubjectId === 'all' && styles.subjectPillActive,
                ]}
              >
                <Text style={styles.subjectPillText}>الكل ✨</Text>
              </TouchableOpacity>
              {stageSubjects.map((sub) => (
                <TouchableOpacity
                  key={sub.id}
                  onPress={() => {
                    setSelectedSubjectId(sub.id);
                    setActiveLessonId(null);
                  }}
                  style={[
                    styles.subjectPill,
                    selectedSubjectId === sub.id && styles.subjectPillActive,
                  ]}
                >
                  <Text style={styles.subjectPillText}>{sub.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* بطاقة الترحيب وشعار المساعد الذكي */}
            {!activeLesson && (
              <View style={styles.welcomeCard}>
                <View style={styles.sparkleLogoBox}>
                  <Text style={{ fontSize: 24 }}>✨</Text>
                </View>
                <Text style={styles.welcomeTitle}>
                  مرحباً {student.name.split(' ')[0]} ✨
                </Text>
                <Text style={styles.welcomeSubtitle}>
                  اختر أي درس بالأسفل لقراءة الملخص الذكي أو سؤال المعلم الذكي!
                </Text>
              </View>
            )}

            {/* قائمة الدروس */}
            {filteredLessons.map((les) => {
              const isOpen = activeLessonId === les.id;
              return (
                <View key={les.id} style={styles.card}>
                  <TouchableOpacity
                    onPress={() => {
                      setActiveLessonId(isOpen ? null : les.id);
                      setTutorChat([]);
                    }}
                    style={styles.lessonRow}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.lessonSubjectBadge}>
                        {les.subjectName}
                      </Text>
                      <Text style={styles.cardTitle}>{les.title}</Text>
                    </View>
                    <Text style={{ color: '#818cf8', fontSize: 12, fontWeight: 'bold' }}>
                      {isOpen ? 'إغلاق ▲' : 'فتح الشرح ▼'}
                    </Text>
                  </TouchableOpacity>

                  {isOpen && (
                    <View style={{ gap: 10, marginTop: 8 }}>
                      <View style={styles.summaryBox}>
                        <View style={styles.summaryHeader}>
                          <Text style={styles.summaryTitle}>
                            🤖 الشرح الذكي المبسط:
                          </Text>
                          <TouchableOpacity
                            onPress={() =>
                              Speech.speak(les.aiSummary, { language: 'ar' })
                            }
                            style={styles.speakBtn}
                          >
                            <Text style={styles.speakBtnText}>🔊 استماع</Text>
                          </TouchableOpacity>
                        </View>
                        <Text style={styles.summaryText}>{les.aiSummary}</Text>
                      </View>

                      {les.aiKeyPoints?.length > 0 && (
                        <View style={styles.keyPointsBox}>
                          <Text style={styles.keyPointsTitle}>
                            📌 النقاط الذهبية:
                          </Text>
                          {les.aiKeyPoints.map((pt, i) => (
                            <Text key={i} style={styles.keyPointItem}>
                              {pt}
                            </Text>
                          ))}
                        </View>
                      )}

                      {Boolean(les.aiGoldenTip) && (
                        <View style={styles.goldenTipBox}>
                          <Text style={styles.goldenTipText}>
                            💡 {les.aiGoldenTip}
                          </Text>
                        </View>
                      )}

                      {/* المعلم الذكي التفاعلي */}
                      <View style={styles.tutorBox}>
                        <Text style={styles.tutorHeading}>
                          💬 اسأل المعلم الذكي عن هذا الدرس:
                        </Text>
                        {tutorChat.map((m, idx) => (
                          <View
                            key={idx}
                            style={[
                              styles.chatBubble,
                              m.sender === 'student'
                                ? styles.chatStudent
                                : styles.chatAi,
                            ]}
                          >
                            <Text style={styles.chatText}>{m.text}</Text>
                          </View>
                        ))}
                        <View style={{ flexDirection: 'row-reverse', gap: 6 }}>
                          <TextInput
                            style={[styles.input, { flex: 1 }]}
                            value={tutorQuestion}
                            onChangeText={setTutorQuestion}
                            placeholder="اكتب سؤالك هنا..."
                            placeholderTextColor="#64748b"
                            textAlign="right"
                          />
                          <TouchableOpacity
                            onPress={handleAskTutor}
                            style={styles.sendBtn}
                          >
                            <Text style={styles.sendBtnText}>إرسال</Text>
                          </TouchableOpacity>
                        </View>
                      </View>

                      <TouchableOpacity
                        onPress={() => handleStartQuickQuiz(les)}
                        style={styles.emeraldBtn}
                      >
                        <Text style={styles.primaryBtnText}>
                          ابدأ الاختبار السريع في هذا الدرس 🎯
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* 2. اختبار سريع */}
        {activeTab === 'quiz' && (
          <View style={{ gap: 12 }}>
            {!quizLesson ? (
              <>
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>
                    🎯 الاختبار الذكي السريع (20 درجة)
                  </Text>
                  <Text style={styles.subText}>
                    اختر أي درس لتبدأ اختباراً من 5 أسئلة (كل سؤال 4 درجات) لرفع مستواك ونقاطك!
                  </Text>
                </View>
                {stageLessons.map((les) => (
                  <View key={les.id} style={styles.quizItemCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.quizSubjectLarge}>
                        {les.subjectName}
                      </Text>
                      <Text style={styles.quizLessonSub}>{les.title}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleStartQuickQuiz(les)}
                      style={styles.emeraldBtnSmall}
                    >
                      <Text style={styles.primaryBtnText}>ابدأ الاختبار ⚡</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </>
            ) : quizFinished ? (
              <View style={[styles.card, { alignItems: 'center', gap: 12 }]}>
                <Text style={{ fontSize: 42 }}>🏆</Text>
                <Text style={styles.cardTitle}>أحسنت يا بطل! اكتمل الاختبار</Text>
                <Text style={{ color: '#34d399', fontSize: 22, fontWeight: 'bold' }}>
                  النتيجة: {quizScore * 4} / {quizLesson.aiQuestions.length * 4}
                </Text>
                <Text style={styles.subText}>
                  الإجابات الصحيحة: {quizScore} من {quizLesson.aiQuestions.length} (+
                  {quizScore * 4} نقطة 💎)
                </Text>
                <TouchableOpacity
                  onPress={() => setQuizLesson(null)}
                  style={[styles.primaryBtn, { width: '100%' }]}
                >
                  <Text style={styles.primaryBtnText}>
                    اختيار درس آخر للاختبار 🔄
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              (() => {
                const q = quizLesson.aiQuestions[quizIndex];
                if (!q) return null;
                return (
                  <View style={styles.card}>
                    <View style={styles.lessonRow}>
                      <Text style={{ color: '#6ee7b7', fontSize: 12, fontWeight: 'bold' }}>
                        السؤال {quizIndex + 1} من {quizLesson.aiQuestions.length}
                      </Text>
                      <TouchableOpacity onPress={() => setQuizLesson(null)}>
                        <Text style={{ color: '#94a3b8', fontSize: 11 }}>
                          إنهاء ✕
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <Text style={[styles.cardTitle, { marginVertical: 8 }]}>
                      {q.question}
                    </Text>

                    <View style={{ gap: 8 }}>
                      {q.options.map((opt, idx) => {
                        const isPicked = selectedOption === idx;
                        const isRight = idx === q.correctIndex;
                        let bg = '#020617';
                        let border = '#1e293b';
                        if (selectedOption !== null) {
                          if (isRight) {
                            bg = 'rgba(16, 185, 129, 0.2)';
                            border = '#10b981';
                          } else if (isPicked) {
                            bg = 'rgba(244, 63, 94, 0.2)';
                            border = '#f43f5e';
                          }
                        }
                        return (
                          <TouchableOpacity
                            key={idx}
                            onPress={() => handleSelectQuizOption(idx)}
                            style={[
                              styles.optionBtn,
                              { backgroundColor: bg, borderColor: border },
                            ]}
                          >
                            <Text style={styles.optionBtnText}>{opt}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {selectedOption !== null && (
                      <TouchableOpacity
                        onPress={handleNextQuizQuestion}
                        style={[styles.primaryBtn, { marginTop: 10 }]}
                      >
                        <Text style={styles.primaryBtnText}>
                          {quizIndex + 1 < quizLesson.aiQuestions.length
                            ? 'السؤال التالي ⬅️'
                            : 'إنهاء الاختبار وعرض النتيجة 🏆'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })()
            )}
          </View>
        )}

        {/* 3. المسابقة التنافسية */}
        {activeTab === 'gamemode' && (
          <View style={{ gap: 12 }}>
            {!activeRoom ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>
                  ⚔️ ساحة المسابقات الجماعية المباشرة
                </Text>
                <Text style={styles.subText}>
                  أنشئ غرفة تحدي وادعُ أصدقاءك في المرحلة للتنافس المباشر!
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    const targetLesson = stageLessons[0];
                    if (!targetLesson) return;
                    const room = createChallengeRoom({
                      hostStudent: student,
                      lesson: targetLesson,
                    });
                    setShowInviteFriendsList(false);
                    setActiveRoomId(room.id);
                  }}
                  style={styles.roseBtn}
                >
                  <Text style={styles.primaryBtnText}>
                    + إنشاء غرفة تحدي جديدة 🔥
                  </Text>
                </TouchableOpacity>
              </View>
            ) : activeRoom.status === 'waiting' ? (
              <View style={styles.card}>
                <View style={styles.lessonRow}>
                  <Text style={styles.cardTitle}>
                    📚 {activeRoom.lessonTitle}
                  </Text>
                  <TouchableOpacity onPress={() => setActiveRoomId(null)}>
                    <Text style={{ color: '#cbd5e1', fontSize: 13 }}>✕</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={() => setShowInviteFriendsList((p) => !p)}
                  style={styles.inviteToggleBtn}
                >
                  <Text style={styles.inviteToggleText}>+ إضافة المنافس</Text>
                </TouchableOpacity>

                {showInviteFriendsList && (
                  <View style={{ gap: 6 }}>
                    {stageFriends.map((friend) => {
                      const isInvited = activeRoom.players.some(
                        (p) => p.id === friend.id
                      );
                      return (
                        <View key={friend.id} style={styles.friendRow}>
                          <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: 'bold' }}>
                            {friend.avatar || '👨‍🎓'} {friend.name}
                          </Text>
                          <TouchableOpacity
                            disabled={isInvited}
                            onPress={() =>
                              inviteStudentToChallengeRoom(
                                activeRoom.id,
                                friend
                              )
                            }
                            style={[
                              styles.inviteSmallBtn,
                              isInvited && { backgroundColor: '#065f46' },
                            ]}
                          >
                            <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: 'bold' }}>
                              {isInvited ? 'تمت الدعوة ✅' : 'دعوة +'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </View>
                )}

                <View style={{ gap: 6 }}>
                  <View style={styles.lessonRow}>
                    <Text style={styles.fieldLabel}>
                      👥 المتسابقون ({activeRoom.players.length}):
                    </Text>
                    <TouchableOpacity
                      onPress={() => addBotToChallengeRoom(activeRoom.id)}
                    >
                      <Text style={{ color: '#818cf8', fontSize: 11, fontWeight: 'bold' }}>
                        + إضافة بوت ذكي 🤖
                      </Text>
                    </TouchableOpacity>
                  </View>
                  {activeRoom.players.map((p, idx) => (
                    <View key={p.id} style={styles.friendRow}>
                      <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: 'bold' }}>
                        {idx === 0 ? '👑 ' : '⚡ '}
                        {p.name}
                      </Text>
                      <Text style={{ color: '#34d399', fontSize: 11 }}>
                        جاهز ✅
                      </Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  onPress={() => startChallengeGame(activeRoom.id)}
                  style={styles.emeraldBtn}
                >
                  <Text style={styles.primaryBtnText}>
                    بدء المسابقة الآن! 🔥
                  </Text>
                </TouchableOpacity>
              </View>
            ) : activeRoom.status === 'playing' ? (
              (() => {
                const q = activeRoom.questions[activeRoom.currentQuestionIndex];
                if (!q) return null;
                return (
                  <View style={styles.card}>
                    <Text style={{ color: '#fda4af', fontSize: 12, fontWeight: 'bold', textAlign: 'right' }}>
                      ⚔️ السؤال {activeRoom.currentQuestionIndex + 1} من{' '}
                      {activeRoom.questions.length}
                    </Text>
                    <Text style={[styles.cardTitle, { marginVertical: 6 }]}>
                      {q.question}
                    </Text>
                    <View style={{ gap: 8 }}>
                      {q.options.map((opt, idx) => {
                        const isPicked = myRoomAnswer === idx;
                        const isRight = idx === q.correctIndex;
                        let bg = '#020617';
                        let border = '#1e293b';
                        if (myRoomAnswer !== null) {
                          if (isRight) {
                            bg = 'rgba(16, 185, 129, 0.2)';
                            border = '#10b981';
                          } else if (isPicked) {
                            bg = 'rgba(244, 63, 94, 0.2)';
                            border = '#f43f5e';
                          }
                        }
                        return (
                          <TouchableOpacity
                            key={idx}
                            onPress={() => {
                              if (myRoomAnswer !== null) return;
                              setMyRoomAnswer(idx);
                              submitPlayerRoomAnswer({
                                roomId: activeRoom.id,
                                playerId: student.id,
                                questionIndex: activeRoom.currentQuestionIndex,
                                isCorrect: idx === q.correctIndex,
                                timeRemainingSec: 10,
                              });
                            }}
                            style={[
                              styles.optionBtn,
                              { backgroundColor: bg, borderColor: border },
                            ]}
                          >
                            <Text style={styles.optionBtnText}>{opt}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                    {myRoomAnswer !== null && (
                      <TouchableOpacity
                        onPress={() =>
                          advanceOrFinishChallengeRoom(activeRoom.id)
                        }
                        style={[styles.primaryBtn, { marginTop: 10 }]}
                      >
                        <Text style={styles.primaryBtnText}>
                          {activeRoom.currentQuestionIndex + 1 <
                          activeRoom.questions.length
                            ? 'السؤال التنافسي التالي ⬅️'
                            : 'إعلان الفائز وتتويج البطل 🏆'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })()
            ) : (
              <View style={[styles.card, { alignItems: 'center', gap: 10 }]}>
                <Text style={{ fontSize: 44 }}>🏆</Text>
                <Text style={{ color: '#fcd34d', fontSize: 12, fontWeight: 'bold' }}>
                  انتهت المنافسة
                </Text>
                <Text style={styles.cardTitle}>
                  الفائز بالمركز الأول: {activeRoom.winnerName} 🎉
                </Text>
                <Text style={{ color: '#34d399', fontSize: 11, fontWeight: 'bold' }}>
                  🥇 الأول: +50 نقطة • 🥈 الثاني: +25 نقطة • 🥉 الثالث: +10 نقاط
                </Text>

                <View style={{ width: '100%', gap: 6 }}>
                  {[...activeRoom.players]
                    .sort((a, b) => b.score - a.score)
                    .map((p, index) => {
                      const rankPts =
                        index === 0
                          ? 50
                          : index === 1
                          ? 25
                          : index === 2
                          ? 10
                          : 0;
                      return (
                        <View key={p.id} style={styles.friendRow}>
                          <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: 'bold' }}>
                            {index === 0
                              ? '🥇 '
                              : index === 1
                              ? '🥈 '
                              : index === 2
                              ? '🥉 '
                              : '🎖️ '}
                            {p.name} (صحيحة: {p.correctCount})
                          </Text>
                          <Text style={{ color: '#fcd34d', fontSize: 11, fontWeight: 'bold' }}>
                            {rankPts > 0 ? `+${rankPts} نقطة 💎` : '0 نقطة'}
                          </Text>
                        </View>
                      );
                    })}
                </View>

                <TouchableOpacity
                  onPress={() => setActiveRoomId(null)}
                  style={[styles.primaryBtn, { width: '100%' }]}
                >
                  <Text style={styles.primaryBtnText}>
                    العودة لساحة التحديات ⚔️
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* 4. المتصدرون */}
        {activeTab === 'leaderboard' && (
          <View style={{ gap: 10 }}>
            <View style={styles.card}>
              <Text style={[styles.cardTitle, { color: '#fcd34d' }]}>
                🏆 لوحة أبطال المرحلة والمكافآت
              </Text>
              <Text style={styles.subText}>
                اضغط على أي طالب في القائمة لمشاهدة مستواه ومؤشر أدائه!
              </Text>
            </View>

            {[...allStudents]
              .filter((s) => s.status === 'approved')
              .sort((a, b) => (b.points || 0) - (a.points || 0))
              .map((s, idx) => {
                const sColor =
                  COLOR_THEMES[s.profileColor || 'indigo'] ||
                  COLOR_THEMES.indigo;
                return (
                  <TouchableOpacity
                    key={s.id}
                    onPress={() => {
                      setInspectedStudentId(s.id);
                      setActiveTab('level');
                    }}
                    style={[
                      styles.leaderRow,
                      s.id === student.id && styles.leaderRowMe,
                    ]}
                  >
                    <View style={styles.headerRight}>
                      <Text style={{ fontSize: 18 }}>
                        {idx === 0
                          ? '🥇'
                          : idx === 1
                          ? '🥈'
                          : idx === 2
                          ? '🥉'
                          : '🎖️'}
                      </Text>
                      <View
                        style={[
                          styles.smallAvatarBox,
                          { backgroundColor: sColor.primary },
                        ]}
                      >
                        {isImageAvatar(s.avatar) ? (
                          <Image
                            source={{ uri: s.avatar }}
                            style={styles.avatarImg}
                          />
                        ) : (
                          <Text style={{ fontSize: 16 }}>
                            {s.avatar || '👨‍🎓'}
                          </Text>
                        )}
                      </View>
                      <View>
                        <Text style={styles.headerName}>
                          {s.name} {s.id === student.id ? '(أنت)' : ''}
                        </Text>
                        <Text style={styles.subText}>
                          الانتصارات: {s.wins || 0} 🏆 • الاختبارات:{' '}
                          {s.quizzesCompleted || 0}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.pointsPill}>
                      <Text style={styles.pointsPillText}>
                        💎 {s.points || 0} نقطة
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
          </View>
        )}

        {/* 5. المستوى ومؤشر الأداء الفعلي */}
        {activeTab === 'level' &&
          (() => {
            const isInspectingFromLeaderboard = Boolean(inspectedStudentId);
            const targetStudent =
              allStudents.find(
                (s) => s.id === (inspectedStudentId || student.id)
              ) || student;
            const pts = targetStudent.points || 0;
            const history =
              Array.isArray(targetStudent.performanceHistory) &&
              targetStudent.performanceHistory.length >= 6
                ? targetStudent.performanceHistory.slice(-6)
                : [42, 48, 45, 54, 50, 62];

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
                  color: '#fb7185',
                  stroke: '#f43f5e',
                }
              : isFluctuating
              ? {
                  text: 'مستوى متذبذب',
                  color: '#fbbf24',
                  stroke: '#38bdf8',
                }
              : {
                  text: 'مستوى مثالي',
                  color: '#34d399',
                  stroke: '#38bdf8',
                };

            const motivationalQuotes = isLow
              ? [
                  '💪 لا تقلق من انخفاض المستوى! راجع ملخص الدرس الذكي وادخل المسابقة القادمة ليرتفع مؤشرك فوراً.',
                  '📖 كل بطل يمر بلحظة تراجع؛ قراءة «النصيحة الذهبية» قبل الاختبار ستعيدك إلى القمة.',
                  '🌱 فوز واحد أو إجابات صحيحة في الاختبار السريع كفيلة برفع خط مستواك للأعلى من جديد!',
                ]
              : isFluctuating
              ? [
                  '⚡ مستواك يرتفع مرة وينخفض مرة! لديك ذكاء رائع، وبقليل من التركيز سيثبت خطك في القمة.',
                  '🎯 تأنَّ في قراءة السؤال داخل المسابقة حتى تحصد انتصارات متتالية بدون انخفاض.',
                  '🌟 خطوة واحدة تفصلك عن الاستقرار في المستوى المثالي، واصل التحدي يا بطل!',
                ]
              : [
                  '🌟 ما شاء الله! مستواك مثالي بفضل تفوقك وانتصاراتك الرائعة في المسابقات.',
                  '🚀 همتك عالية ومؤشر أدائك في القمة، واصل الفوز لتحافظ على صدارتك!',
                  '🏆 النجاح يصنعه الأبطال المثابرون مثلك، استمر بهذا المستوى المميز كل يوم.',
                ];

            const targetColor =
              COLOR_THEMES[targetStudent.profileColor || 'indigo'] ||
              COLOR_THEMES.indigo;

            const curvePath = `M ${waveX[0]} ${waveHeights[0]} C 52 ${waveHeights[0]}, 55 ${waveHeights[1]}, ${waveX[1]} ${waveHeights[1]} C 105 ${waveHeights[1]}, 110 ${waveHeights[2]}, ${waveX[2]} ${waveHeights[2]} C 160 ${waveHeights[2]}, 165 ${waveHeights[3]}, ${waveX[3]} ${waveHeights[3]} C 215 ${waveHeights[3]}, 220 ${waveHeights[4]}, ${waveX[4]} ${waveHeights[4]} C 270 ${waveHeights[4]}, 275 ${waveHeights[5]}, ${waveX[5]} ${waveHeights[5]}`;
            const areaPath = `${curvePath} L 295 90 L 25 90 Z`;

            return (
              <View style={{ gap: 12 }}>
                {isInspectingFromLeaderboard && (
                  <TouchableOpacity
                    onPress={() => {
                      setInspectedStudentId(null);
                      setActiveTab('leaderboard');
                    }}
                    style={styles.backToLeaderboardBtn}
                  >
                    <Text style={styles.backToLeaderboardText}>
                      ➡️ عودة للمتصدرين
                    </Text>
                  </TouchableOpacity>
                )}

                {/* بطاقة الطالب (الصورة والاسم والمستوى) */}
                <View style={styles.levelStudentCard}>
                  <View style={styles.headerRight}>
                    <View
                      style={[
                        styles.studentAvatarBox,
                        { backgroundColor: targetColor.primary },
                      ]}
                    >
                      {isImageAvatar(targetStudent.avatar) ? (
                        <Image
                          source={{ uri: targetStudent.avatar }}
                          style={styles.avatarImg}
                        />
                      ) : (
                        <Text style={{ fontSize: 22 }}>
                          {targetStudent.avatar || '👨‍🎓'}
                        </Text>
                      )}
                    </View>
                    <View>
                      <Text style={styles.headerName}>{targetStudent.name}</Text>
                      {!isInspectingFromLeaderboard && (
                        <Text style={styles.subText}>
                          💎 {pts} • 🏆 {targetStudent.wins || 0} • 🎯{' '}
                          {targetStudent.quizzesCompleted || 0}
                        </Text>
                      )}
                    </View>
                  </View>

                  <View
                    style={[
                      styles.levelBadgeBox,
                      isLow && {
                        backgroundColor: 'rgba(244, 63, 94, 0.2)',
                        borderColor: '#fb7185',
                      },
                    ]}
                  >
                    <Text style={styles.levelBadgeLabel}>المستوى</Text>
                    <Text style={styles.levelBadgeNumber}>{currentLevel}</Text>
                  </View>
                </View>

                {/* مؤشر الأداء */}
                <View style={styles.card}>
                  <View style={styles.lessonRow}>
                    <Text style={{ color: '#7dd3fc', fontSize: 12, fontWeight: 'bold' }}>
                      📈 مؤشر الأداء
                    </Text>
                    <Text
                      style={{
                        color: statusBadge.color,
                        fontSize: 12,
                        fontWeight: 'bold',
                      }}
                    >
                      {statusBadge.text}
                    </Text>
                  </View>

                  <View style={{ height: 105, width: '100%' }}>
                    <Svg viewBox="0 0 320 95" width="100%" height="100%">
                      <Defs>
                        <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                          <Stop
                            offset="0%"
                            stopColor={statusBadge.stroke}
                            stopOpacity="0.35"
                          />
                          <Stop
                            offset="100%"
                            stopColor={statusBadge.stroke}
                            stopOpacity="0"
                          />
                        </LinearGradient>
                      </Defs>
                      <Path d={areaPath} fill="url(#grad)" />
                      <Path
                        d={curvePath}
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
                          <Circle
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
                    </Svg>
                  </View>
                </View>

                {/* تظهر الجمل التشجيعية فقط للطالب في تبويبه وتختفي عند استعراض طالب من المتصدرين */}
                {!isInspectingFromLeaderboard && (
                  <View style={styles.card}>
                    {motivationalQuotes.map((quote, idx) => (
                      <View key={idx} style={styles.quoteItem}>
                        <Text style={styles.quoteText}>{quote}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })()}
      </ScrollView>

      {/* شريط التنقل السفلي */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          onPress={() => {
            setQuizLesson(null);
            setActiveTab('review');
          }}
          style={[
            styles.navBtn,
            activeTab === 'review' && styles.navBtnIndigo,
          ]}
        >
          <Text style={styles.navIcon}>📖</Text>
          <Text
            style={[
              styles.navText,
              activeTab === 'review' && { color: '#a5b4fc' },
            ]}
          >
            المراجعة الذكية
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setQuizLesson(null);
            setActiveTab('quiz');
          }}
          style={[styles.navBtn, activeTab === 'quiz' && styles.navBtnEmerald]}
        >
          <Text style={styles.navIcon}>🧠</Text>
          <Text
            style={[
              styles.navText,
              activeTab === 'quiz' && { color: '#6ee7b7' },
            ]}
          >
            اختبار سريع
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setQuizLesson(null);
            setActiveTab('gamemode');
          }}
          style={[
            styles.navBtn,
            activeTab === 'gamemode' && styles.navBtnRose,
          ]}
        >
          <Text style={styles.navIcon}>⚔️</Text>
          <Text
            style={[
              styles.navText,
              activeTab === 'gamemode' && { color: '#fda4af' },
            ]}
          >
            مسابقة
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setQuizLesson(null);
            setActiveTab('leaderboard');
          }}
          style={[
            styles.navBtn,
            activeTab === 'leaderboard' && styles.navBtnAmber,
          ]}
        >
          <Text style={styles.navIcon}>🏆</Text>
          <Text
            style={[
              styles.navText,
              activeTab === 'leaderboard' && { color: '#fcd34d' },
            ]}
          >
            المتصدرون
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setQuizLesson(null);
            setInspectedStudentId(null);
            setActiveTab('level');
          }}
          style={[styles.navBtn, activeTab === 'level' && styles.navBtnSky]}
        >
          <Text style={styles.navIcon}>📈</Text>
          <Text
            style={[
              styles.navText,
              activeTab === 'level' && { color: '#7dd3fc' },
            ]}
          >
            المستوى
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  header: {
    backgroundColor: '#0f172a',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
  },
  studentAvatarBox: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  smallAvatarBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  headerName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  headerPoints: {
    color: '#fcd34d',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'right',
    marginTop: 2,
  },
  iconBtn: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
  },
  logoutBtn: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  logoutBtnText: { color: '#cbd5e1', fontSize: 11, fontWeight: 'bold' },
  subjectPill: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  subjectPillActive: {
    backgroundColor: '#4f46e5',
    borderColor: '#818cf8',
  },
  subjectPillText: { color: '#ffffff', fontSize: 12, fontWeight: 'bold' },
  welcomeCard: {
    backgroundColor: '#0f172a',
    borderRadius: 22,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 6,
  },
  sparkleLogoBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeTitle: {
    color: '#c084fc',
    fontSize: 18,
    fontWeight: 'bold',
  },
  welcomeSubtitle: {
    color: '#94a3b8',
    fontSize: 12,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 22,
    padding: 15,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 10,
  },
  lessonRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lessonSubjectBadge: {
    color: '#a5b4fc',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'right',
    marginBottom: 2,
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  subText: {
    color: '#94a3b8',
    fontSize: 11,
    textAlign: 'right',
  },
  summaryBox: {
    backgroundColor: '#020617',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 6,
  },
  summaryHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryTitle: { color: '#a5b4fc', fontSize: 12, fontWeight: 'bold' },
  speakBtn: {
    backgroundColor: '#1e1b4b',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  speakBtnText: { color: '#c7d2fe', fontSize: 11, fontWeight: 'bold' },
  summaryText: {
    color: '#e2e8f0',
    fontSize: 12,
    lineHeight: 20,
    textAlign: 'right',
  },
  keyPointsBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 14,
    padding: 12,
    gap: 4,
  },
  keyPointsTitle: {
    color: '#6ee7b7',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  keyPointItem: { color: '#d1fae5', fontSize: 11, textAlign: 'right' },
  goldenTipBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderRadius: 14,
    padding: 10,
  },
  goldenTipText: {
    color: '#fde68a',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  tutorBox: {
    backgroundColor: '#020617',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 8,
  },
  tutorHeading: {
    color: '#7dd3fc',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  chatBubble: { padding: 10, borderRadius: 12 },
  chatStudent: { backgroundColor: '#312e81', alignSelf: 'flex-end' },
  chatAi: { backgroundColor: '#0f172a', alignSelf: 'flex-start' },
  chatText: { color: '#ffffff', fontSize: 12, textAlign: 'right' },
  sendBtn: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderRadius: 12,
  },
  sendBtnText: { color: '#ffffff', fontSize: 12, fontWeight: 'bold' },
  primaryBtn: {
    backgroundColor: '#4f46e5',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  emeraldBtn: {
    backgroundColor: '#059669',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  emeraldBtnSmall: {
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  roseBtn: {
    backgroundColor: '#e11d48',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#ffffff', fontSize: 12, fontWeight: 'bold' },
  quizItemCard: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  quizSubjectLarge: {
    color: '#a5b4fc',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  quizLessonSub: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'right',
    marginTop: 2,
  },
  optionBtn: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
  },
  optionBtnText: {
    color: '#f1f5f9',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  inviteToggleBtn: {
    backgroundColor: '#1e1b4b',
    borderWidth: 1,
    borderColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  inviteToggleText: { color: '#c7d2fe', fontSize: 12, fontWeight: 'bold' },
  friendRow: {
    backgroundColor: '#020617',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inviteSmallBtn: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  leaderRow: {
    backgroundColor: '#0f172a',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leaderRowMe: {
    backgroundColor: 'rgba(49, 46, 129, 0.5)',
    borderColor: '#818cf8',
  },
  pointsPill: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  pointsPillText: { color: '#fcd34d', fontSize: 11, fontWeight: 'bold' },
  backToLeaderboardBtn: {
    alignSelf: 'flex-end',
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
  },
  backToLeaderboardText: {
    color: '#7dd3fc',
    fontSize: 12,
    fontWeight: 'bold',
  },
  levelStudentCard: {
    backgroundColor: '#0f172a',
    borderRadius: 22,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.4)',
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  levelBadgeBox: {
    backgroundColor: 'rgba(14, 165, 233, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    alignItems: 'center',
  },
  levelBadgeLabel: { color: '#7dd3fc', fontSize: 10, fontWeight: 'bold' },
  levelBadgeNumber: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
  quoteItem: {
    backgroundColor: '#020617',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  quoteText: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'right',
    lineHeight: 19,
  },
  bottomNav: {
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingVertical: 8,
    paddingHorizontal: 6,
    flexDirection: 'row-reverse',
    justifyContent: 'space-around',
  },
  navBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 14,
  },
  navBtnIndigo: { backgroundColor: 'rgba(79, 70, 229, 0.2)' },
  navBtnEmerald: { backgroundColor: 'rgba(16, 185, 129, 0.2)' },
  navBtnRose: { backgroundColor: 'rgba(225, 29, 72, 0.2)' },
  navBtnAmber: { backgroundColor: 'rgba(245, 158, 11, 0.2)' },
  navBtnSky: { backgroundColor: 'rgba(14, 165, 233, 0.2)' },
  navIcon: { fontSize: 15, marginBottom: 2 },
  navText: { color: '#94a3b8', fontSize: 10, fontWeight: 'bold' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    padding: 18,
  },
  modalCard: {
    backgroundColor: '#0f172a',
    borderRadius: 26,
    padding: 18,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 10,
  },
  modalHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    paddingBottom: 10,
  },
  modalTitle: { color: '#ffffff', fontSize: 14, fontWeight: 'bold' },
  closeBtn: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  closeBtnText: { color: '#cbd5e1', fontSize: 12, fontWeight: 'bold' },
  avatarPreview: {
    width: 78,
    height: 78,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  uploadPhotoBtn: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
  },
  uploadPhotoBtnText: { color: '#a5b4fc', fontSize: 11, fontWeight: 'bold' },
  emojiGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
  },
  emojiBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiBtnSelected: {
    backgroundColor: 'rgba(79, 70, 229, 0.3)',
    borderColor: '#818cf8',
  },
  colorRowBox: {
    width: '100%',
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 16,
    padding: 10,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  colorRowLabel: { color: '#cbd5e1', fontSize: 11, fontWeight: 'bold' },
  colorSwatches: { flexDirection: 'row-reverse', gap: 8 },
  colorCircle: { width: 24, height: 24, borderRadius: 12 },
  colorCircleActive: { borderWidth: 2, borderColor: '#ffffff' },
  fieldLabel: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  input: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 12,
  },
  successBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10b981',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
  },
  successText: {
    color: '#a7f3d0',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  errorBox: {
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    borderColor: '#f43f5e',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
  },
  errorText: {
    color: '#fecdd3',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'right',
  },
});
