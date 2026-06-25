import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-[#eef1f5] p-6">
      <SignIn />
    </main>
  );
}
