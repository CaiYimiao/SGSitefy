import { auth } from "@/auth";
import { HomePage } from "@/components/home/home-page";
import "./_marketing/homepage.css";

export default async function Page() {
  const session = await auth();
  const user = session?.user
    ? { name: session.user.name ?? null, email: session.user.email ?? null }
    : null;
  return <HomePage user={user} />;
}
