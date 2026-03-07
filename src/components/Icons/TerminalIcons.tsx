import React from 'react'

interface IconProps {
  size?: number
  className?: string
}

// PowerShell Icon
export const PowerShellIcon: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M2 5C2 3.89543 2.89543 3 4 3H20C21.1046 3 22 3.89543 22 5V19C22 20.1046 21.1046 21 20 21H4C2.89543 21 2 20.1046 2 19V5Z"
      fill="currentColor"
      opacity="0.15"
    />
    <path
      d="M2 5C2 3.89543 2.89543 3 4 3H20C21.1046 3 22 3.89543 22 5V19C22 20.1046 21.1046 21 20 21H4C2.89543 21 2 20.1046 2 19V5Z"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="M5.5 16L10.5 12L5.5 8"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M12 16H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

// Command Prompt Icon
export const CmdIcon: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="2" y="3" width="20" height="18" rx="2" fill="currentColor" opacity="0.15" />
    <rect x="2" y="3" width="20" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M6 8L10 12L6 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <text x="15" y="15.5" fill="currentColor" fontSize="7" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
      C:
    </text>
  </svg>
)

// Git Bash Icon
export const GitBashIcon: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M12 2L2 7L12 12L22 7L12 2Z"
      fill="currentColor"
      opacity="0.15"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

// Node.js Icon
export const NodeIcon: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M12 2L3 7V17L12 22L21 17V7L12 2Z"
      fill="currentColor"
      opacity="0.15"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <path d="M12 8V16M8 10V14M16 10V14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

// Python Icon
export const PythonIcon: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M12 2C9.5 2 8 3.5 8 5V8H12V9H5C3.5 9 2 10.5 2 13C2 15.5 3.5 17 5 17H7V14C7 12.5 8.5 11 10 11H14C15.5 11 17 9.5 17 8V5C17 3.5 15.5 2 12 2Z"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="currentColor"
      opacity="0.15"
    />
    <path
      d="M12 22C14.5 22 16 20.5 16 19V16H12V15H19C20.5 15 22 13.5 22 11C22 8.5 20.5 7 19 7H17V10C17 11.5 15.5 13 14 13H10C8.5 13 7 14.5 7 16V19C7 20.5 8.5 22 12 22Z"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="currentColor"
      opacity="0.08"
    />
    <circle cx="10" cy="5" r="1" fill="currentColor" />
    <circle cx="14" cy="19" r="1" fill="currentColor" />
  </svg>
)

// Claude Code Icon
export const ClaudeIcon: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1.5" />
    <path d="M8 9C8 9 9.5 8 12 8C14.5 8 16 9 16 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path
      d="M8 15C8 15 9.5 16 12 16C14.5 16 16 15 16 15"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <circle cx="9" cy="12" r="1" fill="currentColor" />
    <circle cx="15" cy="12" r="1" fill="currentColor" />
  </svg>
)

// OpenCode Icon
export const OpenCodeIcon: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1.5" />
    <path d="M8 12L11 15L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

// Bash Icon
export const BashIcon: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect
      x="2"
      y="3"
      width="20"
      height="18"
      rx="2"
      fill="currentColor"
      opacity="0.15"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path d="M6 8L9 11L6 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <text x="14" y="15" fill="currentColor" fontSize="8" fontFamily="monospace" fontWeight="bold">
      $
    </text>
  </svg>
)

// Zsh Icon
export const ZshIcon: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect
      x="2"
      y="3"
      width="20"
      height="18"
      rx="2"
      fill="currentColor"
      opacity="0.15"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <text x="12" y="15.5" fill="currentColor" fontSize="9" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
      Z
    </text>
  </svg>
)

// Fish Icon
export const FishIcon: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <ellipse
      cx="11"
      cy="12"
      rx="7"
      ry="4.5"
      fill="currentColor"
      opacity="0.15"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="M18 12L22 8.5V15.5L18 12Z"
      fill="currentColor"
      opacity="0.15"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <circle cx="7.5" cy="11.5" r="1" fill="currentColor" />
  </svg>
)

// WSL Icon
export const WslIcon: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="9" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
    <line x1="12" y1="3" x2="12" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="12" y1="18" x2="12" y2="21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="3" y1="12" x2="6" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="18" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

// Default Terminal Icon
export const DefaultTerminalIcon: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect
      x="2"
      y="3"
      width="20"
      height="18"
      rx="2"
      fill="currentColor"
      opacity="0.15"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path d="M6 8L10 12L6 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 16H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

// Icon mapping
const iconMap: Record<string, React.FC<IconProps>> = {
  PS: PowerShellIcon,
  powershell: PowerShellIcon,
  CMD: CmdIcon,
  cmd: CmdIcon,
  GIT: GitBashIcon,
  gitbash: GitBashIcon,
  JS: NodeIcon,
  node: NodeIcon,
  PY: PythonIcon,
  python: PythonIcon,
  CC: ClaudeIcon,
  claude: ClaudeIcon,
  OC: OpenCodeIcon,
  opencode: OpenCodeIcon,
  BASH: BashIcon,
  bash: BashIcon,
  ZSH: ZshIcon,
  zsh: ZshIcon,
  FISH: FishIcon,
  fish: FishIcon,
  WSL: WslIcon,
  wsl: WslIcon,
  DEF: DefaultTerminalIcon,
  default: DefaultTerminalIcon
}

interface TerminalIconProps extends IconProps {
  icon?: string
}

/**
 * Terminal profili için ikon bileşeni.
 * React.memo ile sarılarak gereksiz render'lar önlenir.
 */
export const TerminalIcon: React.FC<TerminalIconProps> = React.memo(({ icon = 'DEF', size = 16, className }) => {
  const IconComponent = iconMap[icon] || iconMap[icon.toLowerCase()] || DefaultTerminalIcon
  return <IconComponent size={size} className={className} />
})

TerminalIcon.displayName = 'TerminalIcon'

export default TerminalIcon
