import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Rani Beauty Clinic — Premier Medspa & Wellness",
    short_name: "Rani Beauty",
    description:
      "Physician-supervised medspa in Renton, WA offering laser hair removal, Botox, HydraFacial, GLP-1 weight management, and more.",
    start_url: "/",
    display: "standalone",
    background_color: "#F8F6F1",
    theme_color: "#0F1D2C",
    icons: [
      {
        src: "/opengraph-image",
        sizes: "1200x630",
        type: "image/png",
      },
    ],
  };
}
