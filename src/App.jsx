import React, { useState } from 'react';
import SplashScreen from './screens/SplashScreen';
import MainScreen from './screens/MainScreen';
import EditorScreen from './screens/EditorScreen';
import { Analytics } from '@vercel/analytics/react';

export default function App() {
  const [screen, setScreen] = useState('splash');
  const [sourceImage, setSourceImage] = useState(null);

  const renderScreen = () => {
    switch (screen) {
      case 'splash':
        return <SplashScreen setScreen={setScreen} />;
      case 'main':
        return <MainScreen setScreen={setScreen} setSourceImage={setSourceImage} />;
      case 'editor':
        return <EditorScreen sourceImage={sourceImage} setScreen={setScreen} />;
      default:
        return <SplashScreen setScreen={setScreen} />;
    }
  };

  return (
    <div className="w-full h-screen bg-[#706c61] flex justify-center">
      <div className="w-full max-w-[1024px] h-full bg-[var(--surface-primary)] overflow-hidden relative">
        {renderScreen()}
      </div>
      <Analytics />
    </div>
  );
}
