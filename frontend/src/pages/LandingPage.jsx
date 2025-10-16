import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Camera, Users, BarChart3, Shield, Zap, Clock } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-8">
        <nav className="flex justify-between items-center mb-16">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-800">FaceAttend</span>
          </div>
          <div className="space-x-4">
            <Button
              data-testid="landing-login-btn"
              variant="ghost"
              onClick={() => navigate('/login')}
              className="text-gray-700 hover:text-indigo-600"
            >
              Login
            </Button>
            <Button
              data-testid="landing-mark-attendance-btn"
              onClick={() => navigate('/mark-attendance')}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6"
            >
              Mark Attendance
            </Button>
          </div>
        </nav>

        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Face Recognition
              <span className="block bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Attendance System
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto mb-10">
              Transform your attendance management with AI-powered face recognition technology.
              Fast, secure, and contactless attendance tracking for the modern workplace.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                data-testid="hero-get-started-btn"
                onClick={() => navigate('/login')}
                size="lg"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-lg px-8 py-6 rounded-2xl"
              >
                Get Started
              </Button>
              <Button
                data-testid="hero-quick-attendance-btn"
                onClick={() => navigate('/mark-attendance')}
                size="lg"
                variant="outline"
                className="border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 text-lg px-8 py-6 rounded-2xl"
              >
                Quick Attendance
              </Button>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            <FeatureCard
              icon={<Camera className="w-8 h-8" />}
              title="AI Face Recognition"
              description="Advanced InsightFace technology with ArcFace embeddings for accurate identification"
              color="from-blue-500 to-cyan-500"
            />
            <FeatureCard
              icon={<Zap className="w-8 h-8" />}
              title="Lightning Fast"
              description="Mark attendance in seconds with real-time face detection and matching"
              color="from-purple-500 to-pink-500"
            />
            <FeatureCard
              icon={<Users className="w-8 h-8" />}
              title="Multi-Face Detection"
              description="Detect and process multiple faces simultaneously for group attendance"
              color="from-green-500 to-teal-500"
            />
            <FeatureCard
              icon={<Shield className="w-8 h-8" />}
              title="Secure Authentication"
              description="Dual authentication modes: face recognition and password-based login"
              color="from-orange-500 to-red-500"
            />
            <FeatureCard
              icon={<BarChart3 className="w-8 h-8" />}
              title="Analytics Dashboard"
              description="Comprehensive reports and insights on attendance patterns"
              color="from-indigo-500 to-purple-500"
            />
            <FeatureCard
              icon={<Clock className="w-8 h-8" />}
              title="Real-time Tracking"
              description="Instant attendance updates with automatic late status detection"
              color="from-pink-500 to-rose-500"
            />
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-12 text-center text-white">
            <h2 className="text-4xl font-bold mb-4">Ready to revolutionize attendance?</h2>
            <p className="text-lg mb-8 opacity-90">
              Join modern organizations using AI-powered face recognition
            </p>
            <Button
              data-testid="cta-get-started-btn"
              onClick={() => navigate('/login')}
              size="lg"
              className="bg-white text-indigo-600 hover:bg-gray-100 text-lg px-8 py-6 rounded-2xl"
            >
              Get Started Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const FeatureCard = ({ icon, title, description, color }) => {
  return (
    <div className="bg-white rounded-2xl p-6 hover:shadow-xl transition-shadow duration-300">
      <div className={`w-16 h-16 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center text-white mb-4`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
};

export default LandingPage;