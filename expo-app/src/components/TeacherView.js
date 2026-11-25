import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  addSmartLesson,
  deleteLesson,
  updateTeacherProfile,
  COLOR_THEMES,
} from '../services/dbService';
import { analyzeLessonWithAI } from '../services/aiService';

const TEACHER_EMOJIS = [
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
];

export default function TeacherView({ session, dbState, onLogout }) {
  const [lessonTitle, setLessonTitle] = useState('');
  const [rawText, setRawText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [expandedLessonId, setExpandedLessonId] = useState(null);
  const [successBanner, setSuccessBanner] = useState('');

  // نافذة الإعدادات الخاصة بالمعلم (مطابقة لنافذة الطالب مع إيموجيات المعلم)
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [editTeacherName, setEditTeacherName] = useState('');
  const [editTeacherPassword, setEditTeacherPassword] = useState('');
  const [editTeacherIcon, setEditTeacherIcon] = useState('👨‍🏫');
  const [editTeacherColor, setEditTeacherColor] = useState('emerald');
  const [teacherProfileMsg, setTeacherProfileMsg] = useState('');
  const [teacherProfileError, setTeacherProfileError] = useState('');

  const currentSubject = (dbState.subjects || []).find(
    (s) => s.id === session.subjectId
  );
  const activeTeacherIcon =
    currentSubject?.icon || session.subjectIcon || '👨‍🏫';
  const activeTeacherName =
    currentSubject?.teacherName || session.teacherName || 'أستاذ المادة';
  const activeTeacherColor =
    currentSubject?.profileColor || currentSubject?.color || 'emerald';
  const activeColorObj =
    COLOR_THEMES[activeTeacherColor] || COLOR_THEMES.emerald;

  const subjectLessons = (dbState.lessons || []).filter(
    (l) => l.subjectId === session.subjectId
  );

  const openTeacherSettings = () => {
    setEditTeacherName(activeTeacherName);
    setEditTeacherPassword(currentSubject?.teacherPassword || '123');
    setEditTeacherIcon(activeTeacherIcon);
    setEditTeacherColor(activeTeacherColor);
    setTeacherProfileMsg('');
    setTeacherProfileError('');
    setIsTeacherModalOpen(true);
  };

  const handlePickTeacherImage = async () => {
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
          setEditTeacherIcon(
            `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`
          );
        } else if (asset.uri) {
          setEditTeacherIcon(asset.uri);
        }
      }
    } catch (e) {
      // ignore picker error
    }
  };

  const handleSaveTeacherProfile = () => {
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
    }, 600);
  };

  const handleFillSample = () => {
    setLessonTitle('المجموعة الشمسية وكواكبها السيّارة 🪐');
    setRawText(
      'تتكون المجموعة الشمسية من نجم واحد عظيم هو الشمس، وتدور حولها ثمانية كواكب في مدارات محددة بفعل جاذبية الشمس. أقرب الكواكب إلى الشمس هو عطارد، ويليه الزهرة، ثم كوكبنا الأرض، ثم المريخ. أما أكبر كواكب المجموعة الشمسية حجماً فهو كوكب المشتري العملاق.'
    );
  };

  const handlePublish = async () => {
    if (!lessonTitle.trim() || !rawText.trim()) return;
    setIsAnalyzing(true);
    setSuccessBanner('');
    try {
      const aiData = await analyzeLessonWithAI({
        title: lessonTitle,
        subjectName: session.subjectName,
        stageName: session.stageName,
        rawText,
      });
      const created = addSmartLesson({
        schoolId: session.schoolId,
        stageId: session.stageId,
        subjectId: session.subjectId,
        subjectName: session.subjectName,
        title: lessonTitle,
        fileType: 'text',
        fileName: 'نص مباشر',
        rawText,
        aiData,
      });
      setLessonTitle('');
      setRawText('');
      setExpandedLessonId(created.id);
      setSuccessBanner(
        'تم تحليل الدرس بالذكاء الاصطناعي ونشره لطلاب المرحلة بنجاح! ✨'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const isImageAvatar = (val) =>
    typeof val === 'string' &&
    (val.startsWith('data:image') ||
      val.startsWith('file:') ||
      val.startsWith('http'));

  return (
    <View style={styles.container}>
      {/* نافذة الإعدادات الخاصة بالمعلم */}
      <Modal
        visible={isTeacherModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsTeacherModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>⚙️ الإعدادات</Text>
              <TouchableOpacity
                onPress={() => setIsTeacherModalOpen(false)}
                style={styles.closeBtn}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {Boolean(teacherProfileMsg) && (
              <View style={styles.successBox}>
                <Text style={styles.successText}>{teacherProfileMsg}</Text>
              </View>
            )}
            {Boolean(teacherProfileError) && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️ {teacherProfileError}</Text>
              </View>
            )}

            <View style={{ alignItems: 'center', gap: 10 }}>
              <View
                style={[
                  styles.avatarPreview,
                  {
                    backgroundColor:
                      COLOR_THEMES[editTeacherColor]?.primary || '#10b981',
                  },
                ]}
              >
                {isImageAvatar(editTeacherIcon) ? (
                  <Image
                    source={{ uri: editTeacherIcon }}
                    style={styles.avatarImg}
                  />
                ) : (
                  <Text style={{ fontSize: 32 }}>
                    {editTeacherIcon || '👨‍🏫'}
                  </Text>
                )}
              </View>

              <TouchableOpacity
                onPress={handlePickTeacherImage}
                style={styles.uploadPhotoBtn}
              >
                <Text style={styles.uploadPhotoBtnText}>
                  📷 تغيير صورتك من الجهاز
                </Text>
              </TouchableOpacity>

              <View style={styles.emojiGrid}>
                {TEACHER_EMOJIS.map((emo) => (
                  <TouchableOpacity
                    key={emo}
                    onPress={() => setEditTeacherIcon(emo)}
                    style={[
                      styles.emojiBtn,
                      editTeacherIcon === emo && styles.emojiBtnSelected,
                    ]}
                  >
                    <Text style={{ fontSize: 16 }}>{emo}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* تغيير اللون */}
              <View style={styles.colorRowBox}>
                <Text style={styles.colorRowLabel}>تغيير اللون:</Text>
                <View style={styles.colorSwatches}>
                  {Object.entries(COLOR_THEMES).map(([key, theme]) => (
                    <TouchableOpacity
                      key={key}
                      onPress={() => setEditTeacherColor(key)}
                      style={[
                        styles.colorCircle,
                        { backgroundColor: theme.swatch },
                        editTeacherColor === key && styles.colorCircleActive,
                      ]}
                    />
                  ))}
                </View>
              </View>
            </View>

            <View style={{ gap: 8, marginTop: 8 }}>
              <Text style={styles.fieldLabel}>الاسم</Text>
              <TextInput
                style={styles.input}
                value={editTeacherName}
                onChangeText={setEditTeacherName}
                placeholder="اكتب اسمك الكامل"
                placeholderTextColor="#64748b"
                textAlign="right"
              />

              <Text style={styles.fieldLabel}>كلمة السر (الرمز السري)</Text>
              <TextInput
                style={styles.input}
                value={editTeacherPassword}
                onChangeText={setEditTeacherPassword}
                placeholder="اكتب كلمة السر الجديدة"
                placeholderTextColor="#64748b"
                textAlign="right"
              />

              <TouchableOpacity
                onPress={handleSaveTeacherProfile}
                style={styles.saveSettingsBtn}
              >
                <Text style={styles.saveSettingsBtnText}>
                  حفظ التغييرات ✅
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* الهيدر */}
      <View style={styles.header}>
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={openTeacherSettings}
            style={[
              styles.teacherAvatarBtn,
              { backgroundColor: activeColorObj.primary },
            ]}
          >
            {isImageAvatar(activeTeacherIcon) ? (
              <Image
                source={{ uri: activeTeacherIcon }}
                style={styles.avatarImg}
              />
            ) : (
              <Text style={{ fontSize: 22 }}>{activeTeacherIcon}</Text>
            )}
          </TouchableOpacity>

          <View>
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6 }}>
              <Text style={styles.headerTitle}>{session.subjectName}</Text>
              <View style={styles.teacherBadge}>
                <Text style={styles.teacherBadgeText}>{activeTeacherName}</Text>
              </View>
            </View>
            <Text style={styles.headerSubtitle}>
              {session.schoolName} • {session.stageName}
            </Text>
          </View>
        </View>

        <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutBtnText}>خروج</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 16 }}
      >
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>✨ رفع درس اليوم للذكاء الاصطناعي</Text>
            <TouchableOpacity onPress={handleFillSample} style={styles.sampleBtn}>
              <Text style={styles.sampleBtnText}>⚡ ملء درس تجريبي</Text>
            </TouchableOpacity>
          </View>

          {Boolean(successBanner) && (
            <View style={styles.successBox}>
              <Text style={styles.successText}>{successBanner}</Text>
            </View>
          )}

          <Text style={styles.fieldLabel}>عنوان الدرس اليومي</Text>
          <TextInput
            style={styles.input}
            value={lessonTitle}
            onChangeText={setLessonTitle}
            placeholder="مثال: المجموعة الشمسية..."
            placeholderTextColor="#64748b"
            textAlign="right"
          />

          <Text style={styles.fieldLabel}>محتوى الدرس لشرحه للطلاب</Text>
          <TextInput
            style={[styles.input, { height: 95, textAlignVertical: 'top' }]}
            multiline
            value={rawText}
            onChangeText={setRawText}
            placeholder="اكتب أو الصق نص الدرس هنا ليقوم الذكاء الاصطناعي بتلخيصه وتوليد 5 أسئلة..."
            placeholderTextColor="#64748b"
            textAlign="right"
          />

          <TouchableOpacity
            onPress={handlePublish}
            disabled={isAnalyzing}
            style={styles.publishBtn}
          >
            {isAnalyzing ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.publishBtnText}>
                تحليل بالذكاء الاصطناعي ونشر الدرس للطلاب ✨
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionHeader}>
          📚 الدروس المنشورة لطلاب المرحلة ({subjectLessons.length})
        </Text>

        {subjectLessons.map((les) => {
          const isExpanded = expandedLessonId === les.id;
          return (
            <View key={les.id} style={styles.lessonCard}>
              <View style={styles.lessonHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.lessonTitle}>{les.title}</Text>
                  <Text style={styles.lessonMeta}>
                    ✨ {les.aiQuestions?.length || 0} أسئلة ذكية جاهزة
                  </Text>
                </View>

                <View style={{ flexDirection: 'row-reverse', gap: 6 }}>
                  <TouchableOpacity
                    onPress={() =>
                      setExpandedLessonId(isExpanded ? null : les.id)
                    }
                    style={styles.previewBtn}
                  >
                    <Text style={styles.previewBtnText}>
                      {isExpanded ? 'إخفاء' : 'معاينة الـ AI'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => deleteLesson(les.id)}
                    style={styles.deleteBtn}
                  >
                    <Text style={{ color: '#fb7185', fontSize: 12 }}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {isExpanded && (
                <View style={styles.aiPreviewBox}>
                  <Text style={styles.aiPreviewHeading}>
                    🤖 الشرح المبسط للطالب:
                  </Text>
                  <Text style={styles.aiPreviewBody}>{les.aiSummary}</Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  header: {
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    padding: 14,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerRight: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
  },
  teacherAvatarBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  teacherBadge: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  teacherBadgeText: {
    color: '#cbd5e1',
    fontSize: 10,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#6ee7b7',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'right',
    marginTop: 2,
  },
  logoutBtn: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  logoutBtnText: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 10,
  },
  cardHeaderRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  sampleBtn: {
    backgroundColor: '#1e1b4b',
    borderWidth: 1,
    borderColor: '#4338ca',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  sampleBtnText: {
    color: '#c7d2fe',
    fontSize: 10,
    fontWeight: 'bold',
  },
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
  publishBtn: {
    backgroundColor: '#059669',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 4,
  },
  publishBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  sectionHeader: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  lessonCard: {
    backgroundColor: '#0f172a',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 10,
  },
  lessonHeaderRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lessonTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  lessonMeta: {
    color: '#6ee7b7',
    fontSize: 10,
    textAlign: 'right',
    marginTop: 2,
  },
  previewBtn: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  previewBtnText: {
    color: '#e2e8f0',
    fontSize: 11,
    fontWeight: 'bold',
  },
  deleteBtn: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
  },
  aiPreviewBox: {
    backgroundColor: '#020617',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  aiPreviewHeading: {
    color: '#a5b4fc',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'right',
    marginBottom: 4,
  },
  aiPreviewBody: {
    color: '#cbd5e1',
    fontSize: 12,
    textAlign: 'right',
    lineHeight: 19,
  },
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
  modalTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  closeBtn: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  closeBtnText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: 'bold',
  },
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
  uploadPhotoBtnText: {
    color: '#a5b4fc',
    fontSize: 11,
    fontWeight: 'bold',
  },
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
  colorRowLabel: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: 'bold',
  },
  colorSwatches: {
    flexDirection: 'row-reverse',
    gap: 8,
  },
  colorCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  colorCircleActive: {
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  saveSettingsBtn: {
    backgroundColor: '#4f46e5',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  saveSettingsBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
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
