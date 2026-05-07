import type { Metadata } from "next";
import { RegistrationWizard } from "@/components/registration/registration-wizard";

export const metadata: Metadata = {
  title: "Register | IAIS Annual Conference 2026",
  description:
    "Register for the IAIS Annual Conference 2026 in Hong Kong — members, industry, fellow, and virtual participation.",
};

export default function RegisterPage() {
  return <RegistrationWizard />;
}
