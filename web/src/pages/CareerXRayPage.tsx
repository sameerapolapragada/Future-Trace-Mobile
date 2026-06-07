import { useNavigate } from "react-router-dom";
import { PaywallCard } from "../design-system";
import { products } from "../data/mockData";
import { useEntitlements } from "../lib/entitlements";
import CareerXRayCompleteView from "./CareerXRayCompleteView";

export default function CareerXRayPage() {
  const navigate = useNavigate();
  const { entitlements } = useEntitlements();
  const { xray } = products;

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
