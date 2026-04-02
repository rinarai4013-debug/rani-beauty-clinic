import { redirect } from "next/navigation";

// Variation pages have no content — redirect to the parent service page
// to avoid indexing empty pages and stranding users.
export default function Page({ params }: { params: { slug: string; variation: string } }) {
  redirect(`/services/${params.slug}`);
}
