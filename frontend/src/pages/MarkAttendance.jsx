import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '@/App';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Camera, CheckCircle2 } from 'lucide-react';
import WebcamCapture from '@/components/WebcamCapture';

const MarkAttendance = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showWebcam, setShowWebcam] = useState(false);
  const [result, setResult] = useState(null);

  const handleMarkAttendance = async (faceImage) => {
    setLoading(true);

    try {
      const response = await axios.post(`${API}/attendance/mark`, { face_image: faceImage });
      setResult(response.data);
      toast.success(response.data.message);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Attendance marking failed');
    } finally {
      setLoading(false);
      setShowWebcam(false);
    }
  };

  const resetAndMarkAgain = () => {
    setResult(null);
    setShowWebcam(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <Button
          data-testid="btn-back-home"
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        <Card className="bg-white rounded-3xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl mb-4">
              <Camera className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Mark Attendance</h1>
            <p className="text-gray-600">Use face recognition to mark your attendance</p>
          </div>

          {!showWebcam && !result ? (
            <div className="text-center py-8">
              <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Camera className="w-12 h-12 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Ready to Mark Attendance</h3>
              <p className="text-gray-600 mb-6">Click the button below to start face recognition</p>
              <Button
                data-testid="btn-start-attendance"
                onClick={() => setShowWebcam(true)}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 h-12"
              >
                Start Attendance Marking
              </Button>
            </div>
          ) : result ? (
            <div className="space-y-6">
              <div className="text-center py-4">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Attendance Marked!</h3>
                <p className="text-gray-600">{result.message}</p>
              </div>

              <div className="space-y-3">
                {result.users?.map((user, idx) => (
                  <div
                    key={idx}
                    data-testid={`marked-user-${idx}`}
                    className="p-4 bg-gradient-to-r from-green-50 to-teal-50 rounded-xl border border-green-200"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-800">{user.full_name}</p>
                        <p className="text-sm text-gray-600">@{user.username}</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          user.status === 'marked' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {user.status === 'marked' ? 'Marked' : 'Already Marked Today'}
                        </span>
                        {user.confidence && (
                          <p className="text-sm text-gray-600 mt-1">
                            {(user.confidence * 100).toFixed(1)}% match
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <Button
                  data-testid="btn-mark-another"
                  onClick={resetAndMarkAgain}
                  className="flex-1 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                >
                  Mark Another
                </Button>
                <Button
                  data-testid="btn-done"
                  onClick={() => navigate('/')}
                  variant="outline"
                  className="flex-1 h-12"
                >
                  Done
                </Button>
              </div>
            </div>
          ) : (
            <WebcamCapture
              onCapture={handleMarkAttendance}
              onClose={() => setShowWebcam(false)}
              loading={loading}
            />
          )}
        </Card>
      </div>
    </div>
  );
};

export default MarkAttendance;