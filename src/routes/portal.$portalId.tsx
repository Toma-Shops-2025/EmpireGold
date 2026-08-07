import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { showInterstitial } from "@/lib/ads";
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';

export const Route = createFileRoute("/portal/$portalId")({
  component: PortalContainer,
});

function PortalContainer() {
  const { portalId } = useParams({ from: "/portal/$portalId" });
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function openLink() {
        if (!user) return;

        let url = "";
        if (portalId === "poki") url = "https://poki.com";
        else if (portalId === "crazy") url = "https://www.crazygames.com";
        else if (portalId === "gdist") url = "https://gamedistribution.com";
        else if (portalId === "y8") url = "https://www.y8.com";

        localStorage.setItem('pnp_session_start', Date.now().toString());
        showInterstitial();

        if (Capacitor.isNativePlatform()) {
            await Browser.open({ url, toolbarColor: '#000000' });
        } else {
            window.open(url, '_blank');
        }
        setLoading(false);
        navigate({ to: "/" });
    }
    openLink();
  }, [portalId, user]);

  return (
    <div className="h-screen w-screen bg-black flex items-center justify-center text-white">
        <Loader2 className="h-10 w-10 animate-spin text-yellow-400" />
    </div>
  );
}
