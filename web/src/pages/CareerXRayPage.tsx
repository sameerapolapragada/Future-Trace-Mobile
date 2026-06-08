import { useNavigate } from "react-router-dom";
import { PaywallCard } from "../design-system";
import { products } from "../data/mockData";
import { useEntitlements } from "../lib/entitlements";
import { useCheckoutReturn } from "../lib/useCheckoutReturn";
import CareerXRayCompleteView from "./CareerXRayCompleteView";

export default function CareerXRayPage() {
  const navigate = useNavigate();
  const { entitlements, loading, refresh } = useEntitlements();
  const { xray } = products;

  useCheckoutReturn(refresh);

  if (loading) {
    return (
      <div className="flex min-h-[40svh] flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-accent" />
      </div>
    );
  }

  if (!entitlements.hasCareerXRay) {
    return (
      <div className="space-y-4">
        <div className="pointer-events-none select-none">
          <div className="max-h-[560px] overflow-hidden opacity-50 blur-[2px]">
            <CareerXRayCompleteView />
          </div>
          <div className="pointer-events-none -mt-16 h-16 bg-gradient-to-b from-transparent to-navy" />
        </div>

        <PaywallCard
          badge="One-time pass"
          title={xray.name}
          description={xray.description}
          price={xray.price}
          priceSuffix={xray.priceSuffix}
          features={xray.features}
          primaryLabel={`Unlock for ${xray.price}`}
          onPrimary={() => navigate("/career-xray")}
          secondaryTo="/home"
        />
      </div>
    );
  }

  return <CareerXRayCompleteView />;
}
