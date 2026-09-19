import { redirect } from "next/navigation";

export default function SignupsRedirectPage() {
  redirect("/dashboard/leads");
}