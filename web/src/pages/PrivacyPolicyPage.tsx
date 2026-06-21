import { PRIVACY_POLICY_HTML } from "../../../lib/shared/legal/content";
import LegalDocumentPage from "./LegalDocumentPage";

export default function PrivacyPolicyPage() {
  return <LegalDocumentPage title="Privacy Policy" html={PRIVACY_POLICY_HTML} />;
}
