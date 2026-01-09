import React, { useState, useEffect } from 'react';
import { ClipboardList, PencilLine, XCircle } from 'lucide-react';
import './InputForm.css';

function InputForm({ onAddLog, editingLog, onUpdateLog, onCancelEdit, onSwitchToEdit, recentProjectCodes = [], logs = [] }) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [projectCode, setProjectCode] = useState('');
  const [description, setDescription] = useState('');
  const [hours, setHours] = useState('');

  // Check for duplicates and switch to edit mode if found
  const checkDuplicate = (targetDate, targetCode) => {
    if (!targetDate || !targetCode) return;

    const existingLog = logs.find(log => {
      // Skip current log if editing (though usually switching to same log is fine, it's redundant)
      if (editingLog && log.id === editingLog.id) return false;
      return log.date === targetDate && log.projectCode === targetCode;
    });

    if (existingLog) {
      onSwitchToEdit(existingLog);
    }
  };

  // Sync state with editingLog when it changes
  useEffect(() => {
    if (editingLog) {
      setDate(editingLog.date);
      setProjectCode(editingLog.projectCode);
      setDescription(editingLog.description || '');
      setHours(editingLog.hours.toString());
    }
  }, [editingLog]);

  // Auto-calculate remaining hours for new entries
  useEffect(() => {
    if (!editingLog) {
      const dailyLogs = logs.filter(log => log.date === date);
      const totalHours = dailyLogs.reduce((sum, log) => sum + log.hours, 0);
      const remaining = 7.75 - totalHours;

      if (remaining > 0) {
        setHours(remaining.toFixed(2)); // Format to 2 decimal places to match input step
      } else {
        setHours('');
      }
    }
  }, [date, logs, editingLog]);

  const handleSubmit = () => {
    console.log('handleSubmit called', { projectCode, hours, date, editingLog });

    if (!projectCode || !hours || !date) {
      console.warn('Validation failed: missing fields');
      return;
    }

    const hoursNum = parseFloat(hours);
    if (isNaN(hoursNum) || hoursNum <= 0) {
      alert('正しい工数（数値）を入力してください。');
      return;
    }

    // Validate 0.25 increment
    if ((hoursNum * 100) % 25 !== 0) {
      alert('工数は 0.25 単位で入力してください（例: 1.0, 1.25, 1.5）。');
      return;
    }

    if (editingLog) {
      onUpdateLog({
        ...editingLog,
        date,
        projectCode,
        description,
        hours: hoursNum
      });
      // Clear fields handled by parent setting editingLog to null
      setProjectCode('');
      setDescription('');
      setHours('');
    } else {
      onAddLog({
        date,
        projectCode,
        description,
        hours: hoursNum
      });
      setProjectCode('');
      setDescription('');
      setHours('');
    }
  };

  const handleCancel = () => {
    onCancelEdit();
    setProjectCode('');
    setDescription('');
    setHours('');
  };

  return (
    <form className="glass-panel input-form" onSubmit={(e) => e.preventDefault()}>
      <h2 className="form-title">
        <ClipboardList size={24} color="var(--secondary)" />
        作業登録
      </h2>

      <div className="form-row">
        <div className="form-group" style={{ width: '140px', flex: 'none' }}>
          <label htmlFor="date">
            日付
          </label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              type="date"
              id="date"
              className="form-input"
              value={date}
              onChange={(e) => {
                const newDate = e.target.value;
                setDate(newDate);
                checkDuplicate(newDate, projectCode);
              }}
              required
              style={{ width: '100%' }}
            />
          </div>
        </div>

        <div className="form-group" style={{ width: '140px', flex: 'none' }}>
          <label htmlFor="projectCode">プロジェクトコード</label>
          <input
            type="text"
            id="projectCode"
            className="form-input"
            placeholder="例: PRJ-001"
            value={projectCode}
            onChange={(e) => setProjectCode(e.target.value)}
            onBlur={(e) => checkDuplicate(date, e.target.value)}
            required
            autoComplete="off"
            list="project-list"
          />
          <datalist id="project-list">
            {recentProjectCodes.map(code => (
              <option key={code} value={code} />
            ))}
          </datalist>
        </div>

        <div className="form-group" style={{ flexGrow: 1, minWidth: '200px' }}>
          <label htmlFor="description">作業内容</label>
          <input
            type="text"
            id="description"
            className="form-input"
            placeholder="タスクの詳細..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            autoComplete="off"
          />
        </div>

        <div className="form-group" style={{ width: '80px', flex: 'none' }}>
          <label htmlFor="hours">工数 (h)</label>
          <input
            type="number"
            id="hours"
            className="form-input"
            placeholder="1.25"
            step="0.25"
            min="0.25"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            required
          />
        </div>

        {editingLog ? (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="button" onClick={handleSubmit} className="btn btn-primary add-btn" style={{ background: 'var(--primary)' }}>
              更新
            </button>
            <button type="button" onClick={handleCancel} className="btn btn-secondary add-btn">
              キャンセル
            </button>
          </div>
        ) : (
          <button type="button" onClick={handleSubmit} className="btn btn-primary add-btn">
            追加
          </button>
        )}
      </div>
    </form>
  );
}

export default InputForm;
