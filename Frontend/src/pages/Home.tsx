import { useAuth } from "@/features/auth/AuthContext";
import PrimaryButton from "@/components/PrimaryButton";


export default function Home() {
  const { state, loginAs, logout } = useAuth();

  return (
    <main className="space-y-6 p-6">
      <div className="flex gap-3">
        <PrimaryButton to="/events">admin</PrimaryButton>
        <PrimaryButton to="/component">Component</PrimaryButton>
        <PrimaryButton to="/eventselect">eventselect</PrimaryButton>
        <PrimaryButton to="/">??</PrimaryButton>
        <PrimaryButton to="/organization">organization</PrimaryButton>
      </div>
    </main>
  );
}
