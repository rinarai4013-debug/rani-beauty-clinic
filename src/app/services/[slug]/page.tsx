import { redirect } from "next/navigation";

// Individual service slug pages have no content — redirect to the services listing
// to avoid indexing empty pages and stranding users.
export default function Page() {
  redirect("/services");
}
