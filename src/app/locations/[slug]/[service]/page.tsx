import { redirect } from "next/navigation";

// This route is deprecated in favor of /near/[city]/[service] which has the full template.
// Instead of returning 404, redirect crawlers and users to the correct location.
// The /near/ system uses bare city slugs (e.g., "bellevue") while /locations/ uses "bellevue-wa".

// Map /locations/ slugs to /near/ slugs where overlap exists
const locationToNearSlug: Record<string, string> = {
  "bellevue-wa": "bellevue",
  "kent-wa": "kent",
  "tukwila-wa": "tukwila",
  "newcastle-wa": "newcastle",
  "mercer-island-wa": "mercer-island",
  "auburn-wa": "auburn",
  "federal-way-wa": "federal-way",
  "seatac-wa": "seatac",
  "burien-wa": "burien",
  "covington-wa": "covington",
  "maple-valley-wa": "maple-valley",
  "des-moines-wa": "des-moines",
  "south-seattle-wa": "west-seattle",
  "capitol-hill-seattle-wa": "capitol-hill",
  "beacon-hill-seattle-wa": "beacon-hill",
  "columbia-city-seattle-wa": "columbia-city",
  "rainier-beach-seattle-wa": "georgetown",
  "king-county-wa": "bellevue", // fallback to highest-value nearby city
  "black-diamond-wa": "black-diamond",
  "pacific-wa": "bonney-lake", // closest /near/ equivalent
  "algona-wa": "auburn", // closest /near/ equivalent
};

interface PageProps {
  params: { slug: string; service: string };
}

export default function LocationServiceRedirect({ params }: PageProps) {
  const nearSlug = locationToNearSlug[params.slug];

  if (nearSlug) {
    // Redirect to the fully-built /near/[city]/[service] page
    redirect(`/near/${nearSlug}/${params.service}`);
  }

  // For unmapped locations, redirect to the parent /locations/ page
  redirect(`/locations/${params.slug}`);
}
