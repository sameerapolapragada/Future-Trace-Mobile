import { TERMS_HTML } from "../../../lib/shared/legal/content";
import LegalDocumentPage from "./LegalDocumentPage";

export default function TermsPage() {
  return <LegalDocumentPage title="Terms of Service" html={TERMS_HTML} />;
}
