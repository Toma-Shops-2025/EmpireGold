import { Outlet, createRootRoute } from "@tanstack/react-router";
import { Toaster } from "sonner";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <div className="min-h-screen bg-black text-white font-sans select-none">
      <Outlet />
      <Toaster position="top-center" richColors theme="dark" />
    </div>
  );
}
