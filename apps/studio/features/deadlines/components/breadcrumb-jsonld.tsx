import type { Deadline } from "../schemas"

export function BreadcrumbJsonLd({
  deadline,
  baseUrl,
}: {
  deadline: Deadline
  baseUrl: string
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Trang chủ",
        item: baseUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Deadline",
        item: `${baseUrl}/deadlines`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: deadline.title,
        item: `${baseUrl}/deadlines/${deadline.id}`,
      },
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  )
}
