import EmpireGoldHub from './routes/index'
import { Toaster } from 'sonner'

function App() {
  // Trigger rebuild for sync
  console.log("App: Launching Empire Gold Hub");
  return (
    <>
      <EmpireGoldHub />
      <Toaster position="top-center" richColors />
    </>
  )
}

export default App
