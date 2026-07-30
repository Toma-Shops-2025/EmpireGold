import EmpireGoldHub from './routes/index'
import { Toaster } from 'sonner'
import { useEffect } from 'react'
import { initAds } from './lib/ads'
import { Capacitor } from '@capacitor/core'

function App() {
  // Trigger rebuild for sync
  console.log("App: Launching Play n Payday");

  useEffect(() => {
    initAds().catch(err => console.error("Ad initialization failed", err));

    // Initialize Edge-to-Edge for PlayNPayday
    if (Capacitor.isNativePlatform()) {
      import('@capawesome/capacitor-android-edge-to-edge-support').then(({ EdgeToEdge }) => {
        EdgeToEdge.setBackgroundColor({ color: '#00000000' }).catch(err => console.error("EdgeToEdge failed", err));
      }).catch(err => console.error("EdgeToEdge import failed", err));
    }
  }, []);

  return (
    <>
      <EmpireGoldHub />
      <Toaster position="top-center" richColors />
    </>
  )
}

export default App
