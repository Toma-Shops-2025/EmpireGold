import { Outlet, createRootRoute, useLocation } from "@tanstack/react-router";
import { Toaster } from "sonner";
import { VolumeBar } from "@/components/VolumeBar";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const { pathname } = useLocation();
  const barBottom = pathname === "/" ? "bottom-[7rem]" : "bottom-4";

  return (
    <div className="min-h-screen bg-black text-white font-sans select-none">
      <Outlet />
      <VolumeBar className={barBottom} />
      <Toaster position="top-center" richColors theme="dark" />
    </div>
  );
}
