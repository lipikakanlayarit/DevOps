import * as React from "react"

type BadgeVariant = "default" | "secondary" | "success" | "danger" | "warning"

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant
}

export function Badge({ className = "", variant = "default", ...props }: BadgeProps) {
  let base = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"

  let variantClass = ""
  switch (variant) {
    case "default":
      variantClass = "bg-gray-900 text-white"
      break
    case "secondary":
      variantClass = "bg-gray-100 text-gray-900"
      break
    case "success":
      variantClass = "bg-green-100 text-green-800"
      break
    case "danger":
      variantClass = "bg-red-100 text-red-800"
      break
    case "warning":
      variantClass = "bg-yellow-100 text-yellow-800"
      break
  }

  return <div className={`${base} ${variantClass} ${className}`} {...props} />
}
