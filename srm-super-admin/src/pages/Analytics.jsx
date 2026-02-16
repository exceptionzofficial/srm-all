/**
 * Analytics Page - Detailed Charts and Reports
 */

import { useState, useEffect } from 'react';
import { FiArrowLeft, FiRefreshCw, FiDownload } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import * as XLSX from 'xlsx';
import { getAttendanceByDate, getEmployees } from '../services/api';
import './Analytics.css';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

const Analytics = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [weeklyData, setWeeklyData] = useState([]);
    const [attendanceDistribution, setAttendanceDistribution] = useState({
        present: 0,
        late: 0,
        absent: 0
    });
    const [totalEmployees, setTotalEmployees] = useState(0);

    useEffect(() => {
        loadAnalyticsData();
    }, []);

    const loadAnalyticsData = async () => {
        setLoading(true);
        try {
            // Get total employees count first
            const empResponse = await getEmployees();
            const totalEmps = empResponse.employees?.length || 0;
            setTotalEmployees(totalEmps);

            // Get Weekly Data
            const weekData = await getWeeklyAttendance();
            setWeeklyData(weekData);

            // Get Today's Distribution
            const today = new Date().toISOString().split('T')[0];
            try {
                const todayRes = await getAttendanceByDate(today);
                const records = todayRes.records || [];

                // Logic Fix: Count UNIQUE employees
                const uniquePresent = new Set(records.filter(r => r.status === 'present').map(r => r.employeeId)).size;
                const uniqueLate = new Set(records.filter(r => r.status === 'late').map(r => r.employeeId)).size;
                // If an employee has both 'present' and 'late' records (unlikely but possible), they might be double counted in separate buckets, 
                // but usually status is one per day. 
                // Safer approach: Get all unique IDs for today, check their latest status.
                // For simplicity, we'll assume backend returns simplified status or just count unique IDs.

                const uniqueTotalPresent = new Set(records.map(r => r.employeeId)).size;
                const absentCount = Math.max(0, totalEmps - uniqueTotalPresent);

                setAttendanceDistribution({
                    present: uniquePresent,
                    late: uniqueLate,
                    absent: absentCount
                });

            } catch (e) {
                console.log('No attendance data for today');
                setAttendanceDistribution({
                    present: 0,
                    late: 0,
                    absent: totalEmps
                });
            }

        } catch (error) {
            console.error('Error loading analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const getWeeklyAttendance = async () => {
        const data = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

            try {
                const response = await getAttendanceByDate(dateStr);
                const records = response.records || [];

                // Logic Fix: Count UNIQUE employees
                const uniqueIds = new Set(records.map(r => r.employeeId));
                const uniqueLateIds = new Set(records.filter(r => r.status === 'late').map(r => r.employeeId));

                data.push({
                    date: dateStr,
                    day: dayName,
                    present: uniqueIds.size,
                    late: uniqueLateIds.size,
                });
            } catch (e) {
                data.push({ date: dateStr, day: dayName, present: 0, late: 0 });
            }
        }
        return data;
    };

    // Chart Data Config
    const weeklyChartData = {
        labels: weeklyData.map(d => d.day),
        datasets: [
            {
                label: 'Present (Unique)',
                data: weeklyData.map(d => d.present),
                backgroundColor: 'rgba(76, 175, 80, 0.8)',
                borderColor: '#4CAF50',
                borderWidth: 1,
            },
            {
                label: 'Late',
                data: weeklyData.map(d => d.late),
                backgroundColor: 'rgba(255, 152, 0, 0.8)',
                borderColor: '#FF9800',
                borderWidth: 1,
            },
        ],
    };

    const distributionChartData = {
        labels: ['Present', 'Late', 'Absent'],
        datasets: [{
            data: [attendanceDistribution.present, attendanceDistribution.late, attendanceDistribution.absent],
            backgroundColor: ['#4CAF50', '#FF9800', '#f44336'],
            borderWidth: 0,
        }],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'bottom' },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: { stepSize: 1 },
            },
        },
    };

    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'bottom' },
        },
    };

    const exportAnalytics = () => {
        const data = weeklyData.map(d => ({
            'Date': d.date,
            'Day': d.day,
            'Total Present': d.present,
            'Total Late': d.late
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Weekly_Analytics');
        XLSX.writeFile(workbook, 'Weekly_Analytics_Report.xlsx');
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="analytics-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Analytics Dashboard</h1>
                    <span className="date-display">
                        Detailed attendance insights and trends
                    </span>
                </div>
                <div className="header-actions">
                    <button className="btn btn-secondary" onClick={() => navigate(-1)}>
                        <FiArrowLeft /> Back
                    </button>
                    <button className="btn btn-secondary" onClick={loadAnalyticsData}>
                        <FiRefreshCw /> Refresh
                    </button>
                    <button className="btn btn-primary" onClick={exportAnalytics}>
                        <FiDownload /> Export Data
                    </button>
                </div>
            </div>

            <div className="charts-grid">
                {/* Weekly Trend */}
                <div className="chart-card">
                    <h2 className="section-title">Weekly Attendance Trend (Unique Employees)</h2>
                    <div className="chart-container">
                        <Bar data={weeklyChartData} options={chartOptions} />
                    </div>
                </div>

                {/* Distribution */}
                <div className="chart-card">
                    <h2 className="section-title">Today's Ratio</h2>
                    <div className="chart-container-small">
                        <Doughnut data={distributionChartData} options={doughnutOptions} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
