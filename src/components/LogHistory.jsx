import React, { useState, useMemo, useEffect } from 'react';
import { Trash2, BarChart3, ChevronDown, Pencil, Check, X, Clock } from 'lucide-react';
import { format, startOfWeek, endOfWeek, parseISO, isSameWeek } from 'date-fns';
import { ja } from 'date-fns/locale';
import './LogHistory.css';

function LogHistory({ logs, onDeleteLog, onEditLog, focusDate }) {
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

    // Identify all unique weeks from logs
    const weekOptions = useMemo(() => {
        if (logs.length === 0) return [];

        const uniqueWeeks = new Set();
        logs.forEach(log => {
            const date = parseISO(log.date);
            const start = startOfWeek(date, { weekStartsOn: 1 });
            uniqueWeeks.add(format(start, 'yyyy-MM-dd'));
        });

        return Array.from(uniqueWeeks)
            .sort((a, b) => new Date(b) - new Date(a))
            .map(startStr => {
                const start = parseISO(startStr);
                const end = endOfWeek(start, { weekStartsOn: 1 });
                return {
                    value: startStr,
                    label: `${format(start, 'yyyy/MM/dd')} - ${format(end, 'yyyy/MM/dd')}`,
                    start,
                    end
                };
            });
    }, [logs]);

    const [selectedWeek, setSelectedWeek] = useState('');

    useEffect(() => {
        if (weekOptions.length > 0 && (!selectedWeek || !weekOptions.find(w => w.value === selectedWeek))) {
            setSelectedWeek(weekOptions[0].value);
        }
    }, [weekOptions]);

    // Auto-switch week when focusDate updates
    useEffect(() => {
        if (focusDate) {
            const date = parseISO(focusDate);
            const start = startOfWeek(date, { weekStartsOn: 1 });
            const weekStr = format(start, 'yyyy-MM-dd');
            // Check if this week is in options or valid (it should be since we just added a log there)
            setSelectedWeek(weekStr);
        }
    }, [focusDate]);

    const currentWeekLogs = useMemo(() => {
        if (!selectedWeek) return [];
        const weekStart = parseISO(selectedWeek);
        return logs.filter(log => isSameWeek(parseISO(log.date), weekStart, { weekStartsOn: 1 }));
    }, [selectedWeek, logs]);

    const sortedLogs = useMemo(() => {
        return [...currentWeekLogs].sort((a, b) => {
            if (a.date !== b.date) return new Date(b.date) - new Date(a.date);
            return a.timestamp - b.timestamp;
        });
    }, [currentWeekLogs]);

    // Calculate Project Summary
    const projectSummary = useMemo(() => {
        const summary = {};
        currentWeekLogs.forEach(log => {
            if (!summary[log.projectCode]) {
                summary[log.projectCode] = 0;
            }
            summary[log.projectCode] += log.hours;
        });
        return Object.entries(summary).sort((a, b) => b[1] - a[1]); // Sort by hours desc? Or code asc?
    }, [currentWeekLogs]);

    // Calculate weekly total
    const weeklyTotal = useMemo(() => {
        return currentWeekLogs.reduce((sum, log) => sum + log.hours, 0);
    }, [currentWeekLogs]);

    const handleDeleteClick = (id) => {
        setConfirmDeleteId(id);
    };

    const handleConfirmDelete = (id) => {
        onDeleteLog(id);
        setConfirmDeleteId(null);
    };

    const handleCancelDelete = () => {
        setConfirmDeleteId(null);
    };


    // Helper to format date with day of week in Japanese
    const formatWithDay = (dateStr) => {
        try {
            const date = parseISO(dateStr);
            return format(date, 'yyyy/MM/dd (eee)', { locale: ja });
        } catch (e) {
            return dateStr;
        }
    };

    return (
        <div className="glass-panel log-history">
            <div className="history-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <h2 className="form-title" style={{ marginBottom: 0 }}>
                        <BarChart3 size={24} color="var(--primary)" />
                        作業実績
                    </h2>

                    {weekOptions.length > 0 && (
                        <div className="week-selector" style={{ position: 'static', transform: 'none' }}>
                            <select
                                value={selectedWeek}
                                onChange={(e) => setSelectedWeek(e.target.value)}
                                className="glass-select"
                            >
                                {weekOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="select-icon" size={16} />
                        </div>
                    )}
                </div>

                {weeklyTotal > 0 && (
                    <div className="weekly-header-total">
                        週合計: <strong>{weeklyTotal.toFixed(2)}</strong> h
                    </div>
                )}
            </div>

            {logs.length === 0 ? (
                <div className="empty-state">
                    登録された実績がありません。作業を登録してください。
                </div>
            ) : (
                <>
                    <div className="log-table-container">
                        <table className="log-table">
                            <thead>
                                <tr>
                                    <th>プロジェクトコード</th>
                                    <th>作業内容</th>
                                    <th style={{ width: '100px', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                                            <Clock size={14} />
                                            <span>工数 (h)</span>
                                        </div>
                                    </th>
                                    <th style={{ width: '90px' }}>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedLogs.length > 0 ? (
                                    Object.entries(
                                        sortedLogs.reduce((acc, log) => {
                                            if (!acc[log.date]) acc[log.date] = { logs: [], total: 0 };
                                            acc[log.date].logs.push(log);
                                            acc[log.date].total += log.hours;
                                            return acc;
                                        }, {})
                                    )
                                        .sort((a, b) => new Date(b[0]) - new Date(a[0]))
                                        .map(([dateKey, group]) => (
                                            <React.Fragment key={dateKey}>
                                                <tr className="daily-header">
                                                    <td>{formatWithDay(dateKey)}</td>
                                                    <td style={{ textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.85rem' }}>日計:</td>
                                                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                                                        {group.total.toFixed(2)}
                                                    </td>
                                                    <td></td>
                                                </tr>
                                                {group.logs.map((log) => (
                                                    <tr key={log.id}>
                                                        <td className="code-cell">{log.projectCode}</td>
                                                        <td style={{ whiteSpace: 'normal', maxWidth: '400px' }}>{log.description || '-'}</td>
                                                        <td style={{ textAlign: 'right' }}>{log.hours.toFixed(2)}</td>
                                                        <td>
                                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                                {confirmDeleteId === log.id ? (
                                                                    <>
                                                                        <button
                                                                            className="delete-btn"
                                                                            onClick={() => handleConfirmDelete(log.id)}
                                                                            title="本当に削除する"
                                                                            style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '4px' }}
                                                                        >
                                                                            <Check size={18} />
                                                                        </button>
                                                                        <button
                                                                            className="delete-btn"
                                                                            onClick={handleCancelDelete}
                                                                            title="キャンセル"
                                                                            style={{ color: '#a0a0a0' }}
                                                                        >
                                                                            <X size={18} />
                                                                        </button>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <button
                                                                            className="delete-btn"
                                                                            onClick={() => onEditLog(log)}
                                                                            title="編集"
                                                                            style={{ color: '#3bf' }}
                                                                        >
                                                                            <Pencil size={18} />
                                                                        </button>
                                                                        <button
                                                                            className="delete-btn"
                                                                            onClick={() => handleDeleteClick(log.id)}
                                                                            title="削除"
                                                                        >
                                                                            <Trash2 size={18} />
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </React.Fragment>
                                        ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                            この期間の実績はありません。
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {projectSummary.length > 0 && (
                        <div className="project-summary-container">
                            <h3 className="summary-title">プロジェクト別集計</h3>
                            <div className="summary-grid">
                                {projectSummary.map(([code, total]) => (
                                    <div key={code} className="summary-item">
                                        <span className="summary-code">{code}</span>
                                        <span className="summary-value">{total.toFixed(2)} h</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default LogHistory;
