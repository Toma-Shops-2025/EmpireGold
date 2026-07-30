import EmpireGoldHub from './routes/index'
import { Toaster } from 'sonner'
import { useEffect } from 'react'
import { initAds } from './lib/ads'

function App() {
  // Trigger rebuild for sync
  console.log("App: Launching Play n Payday");

  useEffect(() => {
    initAds().catch(err => console.error("Ad initialization failed", err));
  }, []);

  return (
    <>
      <EmpireGoldHub />
      <Toaster position="top-center" richColors />
    </>
  )
}

export default App
