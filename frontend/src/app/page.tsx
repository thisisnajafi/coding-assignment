import { Home } from "@/components/home";
import { UserProvider } from "@/lib/user-context";

export default function Page() {
  return (
    <UserProvider>
      <Home />
    </UserProvider>
  );
}
