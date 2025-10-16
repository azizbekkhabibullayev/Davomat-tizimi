import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext, API } from '@/App';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Users, BarChart3, UserPlus, LogOut, Camera } from 'lucide-react';
import UsersManagement from '@/components/UsersManagement';
import AttendanceReports from '@/components/AttendanceReports';
import DashboardStats from '@/components/DashboardStats';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleLogout = () => {
    logout();
    toast.success('Tizimdan muvaffaqiyatli chiqdingiz');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Administrator Paneli</h1>
                <p className="text-sm text-gray-600">Xush kelibsiz, {user?.full_name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                data-testid="btn-register-user"
                onClick={() => navigate('/register-user')}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Foydalanuvchi Qo'shish
              </Button>
              <Button
                data-testid="btn-logout"
                onClick={handleLogout}
                variant="outline"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Chiqish
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white shadow-sm p-1 rounded-xl">
            <TabsTrigger data-testid="tab-dashboard" value="dashboard" className="rounded-lg">
              <BarChart3 className="w-4 h-4 mr-2" />
              Bosh Panel
            </TabsTrigger>
            <TabsTrigger data-testid="tab-users" value="users" className="rounded-lg">
              <Users className="w-4 h-4 mr-2" />
              Foydalanuvchilar
            </TabsTrigger>
            <TabsTrigger data-testid="tab-reports" value="reports" className="rounded-lg">
              <BarChart3 className="w-4 h-4 mr-2" />
              Hisobotlar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <DashboardStats />
          </TabsContent>

          <TabsContent value="users">
            <UsersManagement />
          </TabsContent>

          <TabsContent value="reports">
            <AttendanceReports />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;