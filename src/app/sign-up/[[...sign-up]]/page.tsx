import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-[#eef1f5] p-6">
      <SignUp />
    </main>
  );
}
