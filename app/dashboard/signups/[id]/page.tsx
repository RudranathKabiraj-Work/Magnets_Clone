import { redirect } from "next/navigation";

export default function SignupDetailRedirectPage({ params }: { params: { id: string } }) {
  redirect(`/dashboard/leads/${params.id}`);
}