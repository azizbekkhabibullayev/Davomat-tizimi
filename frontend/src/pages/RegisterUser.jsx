import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '@/App';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ArrowLeft, Camera, User } from 'lucide-react';
import WebcamCapture from '@/components/WebcamCapture';

const RegisterUser = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [userData, setUserData] = useState({
    username: '',
    email: '',
    full_name: '',
    password: '',
    role: 'user'
  });
  const [userId, setUserId] = useState(null);
  const [showWebcam, setShowWebcam] = useState(false);
  const [faceRegistered, setFaceRegistered] = useState(false);

  const handleUserRegistration = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/register`, userData);
      setUserId(response.data.id);
      toast.success('Foydalanuvchi muvaffaqiyatli ro\'yxatdan o\'tkazildi!');
      setStep(2);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Ro\'yxatdan o\'tish amalga oshmadi');
    } finally {
      setLoading(false);
    }
  };

  const handleFaceRegistration = async (faceImage) => {
    setLoading(true);

    try {
      await axios.post(`${API}/users/register-face`, {
        user_id: userId,
        face_image: faceImage
      });
      toast.success('Yuz muvaffaqiyatli ro\'yxatdan o\'tkazildi!');
      setFaceRegistered(true);
      setTimeout(() => navigate('/admin'), 1500);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Yuz ro\'yxatdan o\'tkazish amalga oshmadi');
    } finally {
      setLoading(false);
      setShowWebcam(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <Button
          data-testid="btn-back"
          variant="ghost"
          onClick={() => navigate('/admin')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Panelga Qaytish
        </Button>

        <Card className="bg-white rounded-3xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl mb-4">
              <User className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Yangi Foydalanuvchi Qo'shish</h1>
            <p className="text-gray-600">Qadam {step}/2: {step === 1 ? 'Foydalanuvchi Ma\'lumotlari' : 'Yuz Ro\'yxatdan O\'tkazish'}</p>
          </div>

          {step === 1 ? (
            <form onSubmit={handleUserRegistration} className="space-y-4">
              <div>
                <Label htmlFor="full_name">To'liq Ism</Label>
                <Input
                  data-testid="input-full-name"
                  id="full_name"
                  value={userData.full_name}
                  onChange={(e) => setUserData({ ...userData, full_name: e.target.value })}
                  placeholder="Alisher Navoiy"
                  required
                  className="h-12"
                />
              </div>

              <div>
                <Label htmlFor="username">Foydalanuvchi Nomi</Label>
                <Input
                  data-testid="input-username"
                  id="username"
                  value={userData.username}
                  onChange={(e) => setUserData({ ...userData, username: e.target.value })}
                  placeholder="alisher"
                  required
                  className="h-12"
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  data-testid="input-email"
                  id="email"
                  type="email"
                  value={userData.email}
                  onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                  placeholder="alisher@example.com"
                  required
                  className="h-12"
                />
              </div>

              <div>
                <Label htmlFor="password">Parol</Label>
                <Input
                  data-testid="input-password"
                  id="password"
                  type="password"
                  value={userData.password}
                  onChange={(e) => setUserData({ ...userData, password: e.target.value })}
                  placeholder="••••••••"
                  required
                  className="h-12"
                />
              </div>

              <div>
                <Label htmlFor="role">Rol</Label>
                <Select value={userData.role} onValueChange={(val) => setUserData({ ...userData, role: val })}>
                  <SelectTrigger data-testid="select-role" className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Foydalanuvchi</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                data-testid="btn-next-step"
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
              >
                {loading ? 'Ro\'yxatdan o\'tkazilmoqda...' : 'Keyingi: Yuzni Ro\'yxatdan O\'tkazish'}
              </Button>
            </form>
          ) : (
            <div className="space-y-6">
              {!showWebcam && !faceRegistered ? (
                <div className="text-center py-8">
                  <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Camera className="w-12 h-12 text-indigo-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Yuzni Ro'yxatdan O'tkazish</h3>
                  <p className="text-gray-600 mb-6">Davomat tanish uchun foydalanuvchi yuzini suratga oling</p>
                  <div className="space-y-3">
                    <Button
                      data-testid="btn-start-face-capture"
                      onClick={() => setShowWebcam(true)}
                      className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                    >
                      Yuz Suratga Olishni Boshlash
                    </Button>
                    <Button
                      data-testid="btn-skip-face"
                      onClick={() => navigate('/admin')}
                      variant="outline"
                      className="w-full h-12"
                    >
                      Hozircha O'tkazib Yuborish
                    </Button>
                  </div>
                </div>
              ) : faceRegistered ? (
                <div className="text-center py-8">
                  <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-12 h-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Ro'yxatdan O'tkazish Tugallandi!</h3>
                  <p className="text-gray-600">Panelga yo'naltirilmoqda...</p>
                </div>
              ) : (
                <WebcamCapture
                  onCapture={handleFaceRegistration}
                  onClose={() => setShowWebcam(false)}
                  loading={loading}
                />
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default RegisterUser;