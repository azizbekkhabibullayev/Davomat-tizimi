import React, { useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { Button } from '@/components/ui/button';
import { Camera, X } from 'lucide-react';

const WebcamCapture = ({ onCapture, onClose, loading }) => {
  const webcamRef = useRef(null);
  const [captured, setCaptured] = useState(false);

  const capture = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    setCaptured(true);
    onCapture(imageSrc);
  };

  return (
    <div className="space-y-4">
      <div className="relative rounded-2xl overflow-hidden bg-gray-900">
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          className="w-full"
          videoConstraints={{
            width: 1280,
            height: 720,
            facingMode: 'user'
          }}
        />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 border-4 border-indigo-500 opacity-50"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-64 h-80 border-4 border-indigo-500 rounded-2xl"></div>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          data-testid="btn-webcam-capture"
          onClick={capture}
          disabled={loading || captured}
          className="flex-1 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
        >
          <Camera className="w-5 h-5 mr-2" />
          {loading ? 'Processing...' : captured ? 'Captured' : 'Capture'}
        </Button>
        <Button
          data-testid="btn-webcam-close"
          onClick={onClose}
          variant="outline"
          className="h-12 px-4"
          disabled={loading}
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      <p className="text-sm text-center text-gray-600">
        Position your face within the frame and click capture
      </p>
    </div>
  );
};

export default WebcamCapture;