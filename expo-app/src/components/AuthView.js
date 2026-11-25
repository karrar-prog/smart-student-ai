import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import {
  loginAdmin,
  loginTeacherBySubject,
  loginOrRegisterStudent,
  isFirebaseConnected,
} from '../services/dbService';

export default function AuthView({ dbState, onLoginSuccess }) {
  const [activeTab, setActiveTab] = useState('student');
  const [studentName, setStudentName] = useState('جعفر امين');
  const [studentCode, setStudentCode] = useState('1234');
  const [teacherUsername, setTeacherUsername] = useState('sci5');
  const [teacherPassword, setTeacherPassword] = useState('123');
  const [adminUser, setAdminUser] = useState('admin');
  const [adminPass, setAdminPass] = useState('123');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    setError('');
    if (activeTab === 'student') {
      if (!studentName.trim() || !studentCode.trim()) {
        setError('يرجى إدخال اسم الطالب والرمز السري!');
        return;
      }
      const res = loginOrRegisterStudent(studentName, studentCode);
      if (res.error) {
        setError(res.error);
        return;
      }
      onLoginSuccess({ role: 'student', studentId: res.student.id });
    } else if (activeTab === 'teacher') {
      const session = loginTeacherBySubject(teacherUsername, teacherPassword);
      if (!session) {
        setError('اسم المستخدم أو الرمز السري للمعلم غير صحيح!');
        return;
      }
      onLoginSuccess(session);
    } else {
      const session = loginAdmin(adminUser, adminPass);
      if (!session) {
        setError('بيانات دخول المدير غير صحيحة!');
        return;
      }
      onLoginSuccess(session);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* الهيدر الترحيبي */}
      <View style={styles.heroCard}>
        <View style={styles.cloudBadge}>
          <Text style={styles.cloudBadgeText}>
            {isFirebaseConnected()
              ? '🟢 متصل بقاعدة بيانات Firebase السحابية'
              : '⚡ وضع المزامنة السريعة'}
          </Text>
        </View>
        <View style={styles.logoCircle}>
          <Text style={{ fontSize: 32 }}>✨</Text>
        </View>
        <Text style={styles.title}>مساعد الطالب الذكي</Text>
        <Text style={styles.subtitle}>
          منصة التعليم التفاعلي والمسابقات والذكاء الاصطناعي 🤖🏆
        </Text>
      </View>

      {/* اختيار نوع الحساب */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          onPress={() => {
            setError('');
            setActiveTab('student');
          }}
          style={[
            styles.tabBtn,
            activeTab === 'student' && styles.tabBtnStudent,
          ]}
        >
          <Text
            style={[
              styles.tabBtnText,
              activeTab === 'student' && styles.tabBtnTextActive,
            ]}
          >
            👨‍🎓 طالب
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setError('');
            setActiveTab('teacher');
          }}
          style={[
            styles.tabBtn,
            activeTab === 'teacher' && styles.tabBtnTeacher,
          ]}
        >
          <Text
            style={[
              styles.tabBtnText,
              activeTab === 'teacher' && styles.tabBtnTextActive,
            ]}
          >
            👨‍🏫 معلم المادة
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setError('');
            setActiveTab('admin');
          }}
          style={[styles.tabBtn, activeTab === 'admin' && styles.tabBtnAdmin]}
        >
          <Text
            style={[
              styles.tabBtnText,
              activeTab === 'admin' && styles.tabBtnTextActive,
            ]}
          >
            🛡️ الإدارة
          </Text>
        </TouchableOpacity>
      </View>

      {/* نموذج تسجيل الدخول */}
      <View style={styles.formCard}>
        {Boolean(error) && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
          </View>
        )}

        {activeTab === 'student' && (
          <View style={styles.fieldsWrap}>
            <Text style={styles.label}>اسم الطالب الثلاثي أو الثنائي</Text>
            <TextInput
              style={styles.input}
              value={studentName}
              onChangeText={setStudentName}
              placeholder="مثال: جعفر امين"
              placeholderTextColor="#64748b"
              textAlign="right"
            />

            <Text style={styles.label}>الرمز السري للطالب</Text>
            <TextInput
              style={styles.input}
              value={studentCode}
              onChangeText={setStudentCode}
              placeholder="مثال: 1234"
              placeholderTextColor="#64748b"
              textAlign="right"
            />

            <TouchableOpacity style={styles.submitBtnIndigo} onPress={handleSubmit}>
              <Text style={styles.submitBtnText}>دخول لمنصة الطالب 🚀</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 'teacher' && (
          <View style={styles.fieldsWrap}>
            <Text style={styles.label}>معرّف المادة (Username)</Text>
            <TextInput
              style={styles.input}
              value={teacherUsername}
              onChangeText={setTeacherUsername}
              placeholder="مثال: sci5 أو math5"
              placeholderTextColor="#64748b"
              autoCapitalize="none"
              textAlign="right"
            />

            <Text style={styles.label}>الرمز السري للمعلم</Text>
            <TextInput
              style={styles.input}
              value={teacherPassword}
              onChangeText={setTeacherPassword}
              placeholder="مثال: 123"
              placeholderTextColor="#64748b"
              secureTextEntry
              textAlign="right"
            />

            <TouchableOpacity
              style={styles.submitBtnEmerald}
              onPress={handleSubmit}
            >
              <Text style={styles.submitBtnText}>دخول لوحة أستاذ المادة 📚</Text>
            </TouchableOpacity>

            <View style={styles.quickList}>
              <Text style={styles.quickTitle}>حسابات المعلمين السريعة:</Text>
              <View style={styles.quickChips}>
                {(dbState.subjects || []).slice(0, 4).map((sub) => (
                  <TouchableOpacity
                    key={sub.id}
                    onPress={() => {
                      setTeacherUsername(sub.teacherUsername);
                      setTeacherPassword(sub.teacherPassword);
                    }}
                    style={styles.quickChip}
                  >
                    <Text style={styles.quickChipText}>
                      {sub.icon} {sub.name} ({sub.teacherUsername})
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        {activeTab === 'admin' && (
          <View style={styles.fieldsWrap}>
            <Text style={styles.label}>اسم مستخدم المدير</Text>
            <TextInput
              style={styles.input}
              value={adminUser}
              onChangeText={setAdminUser}
              placeholder="admin"
              placeholderTextColor="#64748b"
              autoCapitalize="none"
              textAlign="right"
            />

            <Text style={styles.label}>كلمة المرور</Text>
            <TextInput
              style={styles.input}
              value={adminPass}
              onChangeText={setAdminPass}
              placeholder="123"
              placeholderTextColor="#64748b"
              secureTextEntry
              textAlign="right"
            />

            <TouchableOpacity style={styles.submitBtnAmber} onPress={handleSubmit}>
              <Text style={styles.submitBtnText}>دخول لوحة الإدارة العامة 🛡️</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  content: {
    padding: 18,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: '#0f172a',
    borderRadius: 26,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 16,
  },
  cloudBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 12,
  },
  cloudBadgeText: {
    color: '#6ee7b7',
    fontSize: 11,
    fontWeight: 'bold',
  },
  logoCircle: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: '#4f46e5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  title: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
  },
  tabsRow: {
    flexDirection: 'row-reverse',
    gap: 8,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
  },
  tabBtnStudent: {
    backgroundColor: '#4f46e5',
    borderColor: '#818cf8',
  },
  tabBtnTeacher: {
    backgroundColor: '#059669',
    borderColor: '#34d399',
  },
  tabBtnAdmin: {
    backgroundColor: '#d97706',
    borderColor: '#fbbf24',
  },
  tabBtnText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tabBtnTextActive: {
    color: '#ffffff',
  },
  formCard: {
    backgroundColor: '#0f172a',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  errorBox: {
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    borderColor: '#f43f5e',
    borderWidth: 1,
    borderRadius: 14,
    padding: 10,
    marginBottom: 12,
  },
  errorText: {
    color: '#fecdd3',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  fieldsWrap: {
    gap: 10,
  },
  label: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  input: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: '#ffffff',
    fontSize: 13,
  },
  submitBtnIndigo: {
    backgroundColor: '#4f46e5',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnEmerald: {
    backgroundColor: '#059669',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnAmber: {
    backgroundColor: '#d97706',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  quickList: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingTop: 10,
  },
  quickTitle: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'right',
    marginBottom: 8,
  },
  quickChips: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 6,
  },
  quickChip: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  quickChipText: {
    color: '#cbd5e1',
    fontSize: 11,
  },
});
