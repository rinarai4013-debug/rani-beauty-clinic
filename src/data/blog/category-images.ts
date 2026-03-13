/** Maps blog post category → cover image path */
const categoryImages: Record<string, string> = {
  "Medical Wellness": "/images/blog/medical-wellness.jpg",
  "Aesthetic Treatments": "/images/blog/aesthetic-treatments.jpg",
  "Skincare Science": "/images/blog/skincare-science.jpg",
  "Laser Hair Removal": "/images/blog/laser-hair-removal.jpg",
  "Botox & Injectables": "/images/blog/botox-injectables.jpg",
  "Skin Treatments": "/images/blog/skin-treatments.jpg",
  "GLP-1 & Weight Loss": "/images/blog/glp1-weight-loss.jpg",
  "Peptides & Wellness": "/images/blog/medical-wellness.jpg",
  "Hormone Therapy": "/images/blog/medical-wellness.jpg",
  "Local Guide": "/images/blog/local-guide.jpg",
  Education: "/images/blog/education.jpg",
  FAQ: "/images/blog/faq.jpg",
  "Packages & Membership": "/images/blog/packages.jpg",
};

const fallback = "/images/blog/skincare-science.jpg";

export function getCategoryImage(category: string): string {
  return categoryImages[category] ?? fallback;
}
