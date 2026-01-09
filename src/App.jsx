import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import InputForm from './components/InputForm';
import LogHistory from './components/LogHistory';
import './App.css';

const LOCAL_STORAGE_KEY = 'work_logs_v1';

function App() {
  const [logs, setLogs] = useState([]);
  const [editingLog, setEditingLog] = useState(null);
  const [focusDate, setFocusDate] = useState(null); // Date to focus on in history view
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from LocalStorage on mount
  useEffect(() => {
    try {
      const savedLogs = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedLogs) {
        setLogs(JSON.parse(savedLogs));
      }
    } catch (error) {
      console.error('Failed to load logs:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save to LocalStorage whenever logs change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(logs));
    }
  }, [logs, isLoaded]);

  const addLog = (logData) => {
    const newLog = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      ...logData
    };
    setLogs((prev) => [newLog, ...prev]);
    setFocusDate(logData.date);
  };

  const updateLog = (updatedLog) => {
    setLogs((prev) => prev.map(log => log.id === updatedLog.id ? { ...log, ...updatedLog } : log));
    setEditingLog(null);
    setFocusDate(updatedLog.date);
  };

  const deleteLog = (id) => {
    console.log('deleteLog called with id:', id);
    setLogs((prev) => prev.filter((log) => log.id !== id));
  };

  const startEditing = (log) => {
    setEditingLog(log);
    // Optional: scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEditing = () => {
    setEditingLog(null);
  };

  // Extract unique project codes for suggestions
  const uniqueProjectCodes = Array.from(new Set(logs.map(log => log.projectCode))).sort();

  return (
    <div className="app-container">
      <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
          <Sparkles size={40} color="#fbbf24" />
          週報の「あれ、何したっけ？」防止メモ
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
          週報を書く時になって内容を忘れて絶望するあなたへ。<br />
          今のうちにササッとメモして、週末の自分を笑顔にしましょう！✨
        </p>
      </header>

      <main>
        <InputForm
          onAddLog={addLog}
          editingLog={editingLog}
          onUpdateLog={updateLog}
          onCancelEdit={cancelEditing}
          onSwitchToEdit={startEditing}
          recentProjectCodes={uniqueProjectCodes}
          logs={logs}
        />
        <LogHistory
          logs={logs}
          onDeleteLog={deleteLog}
          onEditLog={startEditing}
          focusDate={focusDate}
        />
      </main>
    </div>
  );
}

export default App;
