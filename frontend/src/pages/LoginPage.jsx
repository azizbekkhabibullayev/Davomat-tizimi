import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext, API } from '@/App';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Camera, User, Lock } from 'lucide-react';
import WebcamCapture from '@/components/WebcamCapture';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [showWebcam, setShowWebcam] = useState(false);

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/login`, credentials);
      login(response.data.access_token, response.data.user);
      toast.success('Kirish muvaffaqiyatli!');
      navigate(response.data.user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Kirish amalga oshmadi');
    } finally {
      setLoading(false);
    }
  };

  const handleFaceLogin = async (faceImage) => {
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/face-login`, { face_image: faceImage });
      login(response.data.access_token, response.data.user);
      toast.success('Yuz orqali kirish muvaffaqiyatli!');
      navigate(response.data.user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Yuz orqali kirish amalga oshmadi');
    } finally {
      setLoading(false);
      setShowWebcam(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl mb-4">
            <Camera className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Xush Kelibsiz</h1>
          <p className="text-gray-600">Panelingizga kirish uchun tizimga kiring</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <Tabs defaultValue="password" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger data-testid="tab-password-login" value="password">Parol</TabsTrigger>
              <TabsTrigger data-testid="tab-face-login" value="face">Yuz Tanish</TabsTrigger>
            </TabsList>

            <TabsContent value="password">
              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <div>
                  <Label htmlFor="username" className="text-gray-700">Foydalanuvchi nomi</Label>
                  <div className="relative mt-1">
                    <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      data-testid="input-username"
                      id="username"
                      type="text"
                      value={credentials.username}
                      onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                      placeholder="Foydalanuvchi nomini kiriting"
                      className="pl-10 h-12"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="password" className="text-gray-700">Parol</Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      data-testid="input-password"
                      id="password"
                      type="password"
                      value={credentials.password}
                      onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                      placeholder="Parolni kiriting"
                      className="pl-10 h-12"
                      required
                    />
                  </div>
                </div>
                <Button
                  data-testid="btn-login-submit"
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-base"
                >
                  {loading ? 'Kirilmoqda...' : 'Kirish'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="face">
              <div className="space-y-4">
                {!showWebcam ? (
                  <div className="text-center py-8">
                    <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Camera className="w-12 h-12 text-indigo-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Yuz Tanish Orqali Kirish</h3>
                    <p className="text-gray-600 mb-6">Yuz tanishni boshlash uchun pastga bosing</p>
                    <Button
                      data-testid="btn-start-face-login"
                      onClick={() => setShowWebcam(true)}
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 h-12"
                    >
                      Yuz Tanishni Boshlash
                    </Button>
                  </div>
                ) : (
                  <WebcamCapture
                    onCapture={handleFaceLogin}
                    onClose={() => setShowWebcam(false)}
                    loading={loading}
                  />
                )}
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-6 text-center">
            <Button
              data-testid="btn-back-home"
              variant="ghost"
              onClick={() => navigate('/')}
              className="text-gray-600 hover:text-indigo-600"
            >
              Bosh sahifaga qaytish
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;