import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Magnets",
    short_name: "Magnets",
    description: "Build lead-magnet pages, capture emails, deliver resources, and follow up from one place.",
    start_url: "/dashboard/leadmagnets",
    scope: "/",
    display: "standalone",
    theme_color: "#F7F5F1",
    background_color: "#F7F5F1",
    icons: [
      {
        src: "/brand/magnets-mark-dark.png",
        sizes: "1024x1024",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}