import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '@/App';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Calendar, Download, FileText } from 'lucide-react';
import { format } from 'date-fns';

const AttendanceReports = () => {
  const [records, setRecords] = useState([]);
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({
    user_id: '',
    start_date: '',
    end_date: ''
  });
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);

  useEffect(() => {
    fetchUsers();
    fetchTodayReport();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API}/users`);
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users');
    }
  };

  const fetchTodayReport = async () => {
    try {
      const response = await axios.get(`${API}/attendance/report`);
      setReport(response.data);
    } catch (error) {
      toast.error('Failed to fetch report');
    }
  };

  const fetchAttendanceHistory = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.user_id) params.append('user_id', filters.user_id);
      if (filters.start_date) params.append('start_date', new Date(filters.start_date).toISOString());
      if (filters.end_date) params.append('end_date', new Date(filters.end_date).toISOString());

      const response = await axios.get(`${API}/attendance/history?${params}`);
      setRecords(response.data);
    } catch (error) {
      toast.error('Failed to fetch attendance history');
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    const csvContent = [
      ['Date', 'Time', 'User', 'Username', 'Status', 'Confidence'],
      ...records.map(r => [
        format(new Date(r.timestamp), 'yyyy-MM-dd'),
        format(new Date(r.timestamp), 'HH:mm:ss'),
        r.full_name,
        r.username,
        r.status,
        (r.confidence * 100).toFixed(2) + '%'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Today's Report Summary */}
      {report && (
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="p-6 bg-white rounded-2xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">{report.total_users}</p>
              </div>
              <FileText className="w-8 h-8 text-indigo-600" />
            </div>
          </Card>
          <Card className="p-6 bg-white rounded-2xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Present Today</p>
                <p className="text-3xl font-bold text-green-600">{report.present}</p>
              </div>
              <Calendar className="w-8 h-8 text-green-600" />
            </div>
          </Card>
          <Card className="p-6 bg-white rounded-2xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Absent Today</p>
                <p className="text-3xl font-bold text-red-600">{report.absent}</p>
              </div>
              <Calendar className="w-8 h-8 text-red-600" />
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="p-6 bg-white rounded-2xl shadow-sm">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Attendance History</h3>
        <div className="grid md:grid-cols-4 gap-4 mb-4">
          <div>
            <Label>User</Label>
            <Select value={filters.user_id} onValueChange={(val) => setFilters({ ...filters, user_id: val })}>
              <SelectTrigger data-testid="select-user-filter" className="h-11">
                <SelectValue placeholder="All Users" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Users</SelectItem>
                {users.map(user => (
                  <SelectItem key={user.id} value={user.id}>{user.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Start Date</Label>
            <Input
              data-testid="input-start-date"
              type="date"
              value={filters.start_date}
              onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
              className="h-11"
            />
          </div>
          <div>
            <Label>End Date</Label>
            <Input
              data-testid="input-end-date"
              type="date"
              value={filters.end_date}
              onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
              className="h-11"
            />
          </div>
          <div className="flex items-end">
            <Button
              data-testid="btn-apply-filters"
              onClick={fetchAttendanceHistory}
              disabled={loading}
              className="w-full h-11 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
            >
              {loading ? 'Loading...' : 'Apply Filters'}
            </Button>
          </div>
        </div>

        {records.length > 0 && (
          <div className="mb-4">
            <Button
              data-testid="btn-download-report"
              onClick={downloadReport}
              variant="outline"
              className="w-full md:w-auto"
            >
              <Download className="w-4 h-4 mr-2" />
              Download CSV Report
            </Button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Time</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">User</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-gray-500">
                    {loading ? 'Loading...' : 'No records found. Apply filters to view attendance history.'}
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record.id} data-testid={`report-record-${record.id}`} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-800">
                      {format(new Date(record.timestamp), 'MMM dd, yyyy')}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {format(new Date(record.timestamp), 'hh:mm a')}
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{record.full_name}</p>
                        <p className="text-xs text-gray-500">@{record.username}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        {record.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {(record.confidence * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default AttendanceReports;