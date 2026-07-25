import EmpireGoldHub from './routes/index'
import { Toaster } from 'sonner'

function App() {
  console.log("App: Rendering Empire Gold Hub");
  return (
    <>
      <EmpireGoldHub />
      <Toaster position="top-center" richColors />
    </>
  )
}

export default App
