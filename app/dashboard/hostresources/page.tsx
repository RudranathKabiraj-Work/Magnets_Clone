import { redirect } from "next/navigation";

export default function HostResourcesRedirectPage() {
  redirect("/dashboard/assets");
}
