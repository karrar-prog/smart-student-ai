import React, { useState, useEffect } from 'react';
import { SafeAreaView, StyleSheet, StatusBar } from 'react-native';
import {
  getDatabaseState,
  subscribeToDatabase,
  initFirebaseIfConfigured,
  loadInitialLocalCache,
} from './services/dbService';
import AuthView from './components/AuthView';
import StudentView from './components/StudentView';
import TeacherView from './components/TeacherView';
import AdminView from './components/AdminView';

export default function NativeFallbackApp() {
  const [dbState, setDbState] = useState(() => getDatabaseState());
  const [session, setSession] = useState(null);

  useEffect(() => {
    loadInitialLocalCache();
    initFirebaseIfConfigured();
    const unsub = subscribeToDatabase((newState) => {
      setDbState({ ...newState });
    });
    return () => unsub();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#020617" />
      {!session && (
        <AuthView
          dbState={dbState}
          onLoginSuccess={(userSession) => setSession(userSession)}
        />
      )}

      {session?.role === 'student' && (
        <StudentView
          studentId={session.studentId}
          dbState={dbState}
          onLogout={() => setSession(null)}
        />
      )}

      {session?.role === 'teacher' && (
        <TeacherView
          session={session}
          dbState={dbState}
          onLogout={() => setSession(null)}
        />
      )}

      {session?.role === 'admin' && (
        <AdminView dbState={dbState} onLogout={() => setSession(null)} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#020617',
  },
});
