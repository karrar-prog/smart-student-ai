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
  addSchool,
  deleteSchool,
  updateStudentJoinStatus,
} from '../services/dbService';

export default function AdminView({ dbState, onLogout }) {
  const [schoolName, setSchoolName] = useState('');
  const [schoolCity, setSchoolCity] = useState('');

  const pendingStudents = (dbState.students || []).filter(
    (s) => s.status === 'pending'
  );

  const handleCreateSchool = () => {
    if (!schoolName.trim()) return;
    addSchool({ name: schoolName, city: schoolCity });
    setSchoolName('');
    setSchoolCity('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🛡️ لوحة الإدارة العامة</Text>
        <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutBtnText}>خروج</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}
      >
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            🔔 طلبات انضمام الطلاب ({pendingStudents.length})
          </Text>
          {pendingStudents.length === 0 ? (
            <Text style={styles.emptyText}>
              لا توجد طلبات انضمام معلقة حالياً.
            </Text>
          ) : (
            pendingStudents.map((std) => (
              <View key={std.id} style={styles.rowItem}>
                <Text style={styles.rowItemTitle}>{std.name}</Text>
                <View style={{ flexDirection: 'row-reverse', gap: 6 }}>
                  <TouchableOpacity
                    onPress={() => updateStudentJoinStatus(std.id, 'approved')}
                    style={styles.approveBtn}
                  >
                    <Text style={styles.approveBtnText}>موافقة ✅</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => updateStudentJoinStatus(std.id, 'rejected')}
                    style={styles.rejectBtn}
                  >
                    <Text style={styles.rejectBtnText}>رفض</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>🏫 إضافة مدرسة جديدة</Text>
          <TextInput
            style={styles.input}
            value={schoolName}
            onChangeText={setSchoolName}
            placeholder="اسم المدرسة"
            placeholderTextColor="#64748b"
            textAlign="right"
          />
          <TextInput
            style={styles.input}
            value={schoolCity}
            onChangeText={setSchoolCity}
            placeholder="المحافظة / المدينة"
            placeholderTextColor="#64748b"
            textAlign="right"
          />
          <TouchableOpacity onPress={handleCreateSchool} style={styles.addBtn}>
            <Text style={styles.addBtnText}>إضافة المدرسة +</Text>
          </TouchableOpacity>

          {(dbState.schools || []).map((sch) => (
            <View key={sch.id} style={styles.rowItem}>
              <Text style={styles.rowItemTitle}>
                {sch.name} ({sch.city})
              </Text>
              <TouchableOpacity onPress={() => deleteSchool(sch.id)}>
                <Text style={{ color: '#fb7185', fontSize: 12 }}>حذف 🗑️</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
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
  headerTitle: { color: '#ffffff', fontSize: 14, fontWeight: 'bold' },
  logoutBtn: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  logoutBtnText: { color: '#cbd5e1', fontSize: 11, fontWeight: 'bold' },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 10,
  },
  sectionTitle: {
    color: '#fbbf24',
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  emptyText: { color: '#64748b', fontSize: 12, textAlign: 'center' },
  rowItem: {
    backgroundColor: '#020617',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowItemTitle: { color: '#ffffff', fontSize: 12, fontWeight: 'bold' },
  approveBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  approveBtnText: { color: '#ffffff', fontSize: 11, fontWeight: 'bold' },
  rejectBtn: {
    backgroundColor: '#be123c',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  rejectBtnText: { color: '#ffffff', fontSize: 11, fontWeight: 'bold' },
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
  addBtn: {
    backgroundColor: '#d97706',
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
  },
  addBtnText: { color: '#ffffff', fontSize: 12, fontWeight: 'bold' },
});
