import type { LucideIcon } from 'lucide-react'

interface IconProps {
  icon: LucideIcon
  size?: number
  className?: string
}

export const Icon: React.FC<IconProps> = ({ icon: IconComponent, size = 16, className }) => (
  <IconComponent size={size} className={className} strokeWidth={1.5} />
)
