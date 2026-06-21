import { auth } from "@/auth";
import { OnboardingWizard } from "@/components/onboarding-wizard";

export default async function NewSitePage() {
  const session = await auth();
  return (
    <main className="container max-w-3xl py-12">
      <OnboardingWizard loggedIn={!!session?.user} />
    </main>
  );
}
