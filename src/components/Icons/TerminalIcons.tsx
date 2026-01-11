import React from 'react'

interface IconProps {
  size?: number
  className?: string
}

// PowerShell Icon
export const PowerShellIcon: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M2 5C2 3.89543 2.89543 3 4 3H20C21.1046 3 22 3.89543 22 5V19C22 20.1046 21.1046 21 20 21H4C2.89543 21 2 20.1046 2 19V5Z" fill="#012456"/>
    <path d="M5.5 16L10.5 12L5.5 8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 16H18" stroke="white" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

// Command Prompt Icon
export const CmdIcon: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="2" y="3" width="20" height="18" rx="2" fill="#0C0C0C"/>
    <path d="M6 8L10 12L6 16" stroke="#CCCCCC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 16H18" stroke="#CCCCCC" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

// Git Bash Icon
export const GitBashIcon: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#F14E32"/>
    <path d="M2 17L12 22L22 17" stroke="#F14E32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 12L12 17L22 12" stroke="#F14E32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

// Node.js Icon
export const NodeIcon: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M12 2L3 7V17L12 22L21 17V7L12 2Z" fill="#68A063"/>
    <path d="M12 8V16M8 10V14M16 10V14" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

// Python Icon
export const PythonIcon: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M12 2C9.5 2 8 3.5 8 5V8H12V9H5C3.5 9 2 10.5 2 13C2 15.5 3.5 17 5 17H7V14C7 12.5 8.5 11 10 11H14C15.5 11 17 9.5 17 8V5C17 3.5 15.5 2 12 2Z" fill="#3776AB"/>
    <path d="M12 22C14.5 22 16 20.5 16 19V16H12V15H19C20.5 15 22 13.5 22 11C22 8.5 20.5 7 19 7H17V10C17 11.5 15.5 13 14 13H10C8.5 13 7 14.5 7 16V19C7 20.5 8.5 22 12 22Z" fill="#FFD43B"/>
    <circle cx="10" cy="5" r="1" fill="white"/>
    <circle cx="14" cy="19" r="1" fill="white"/>
  </svg>
)

// Claude Code Icon
export const ClaudeIcon: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="10" fill="#D97757"/>
    <path d="M8 9C8 9 9.5 8 12 8C14.5 8 16 9 16 9" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M8 15C8 15 9.5 16 12 16C14.5 16 16 15 16 15" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="9" cy="12" r="1" fill="white"/>
    <circle cx="15" cy="12" r="1" fill="white"/>
  </svg>
)

// OpenCode Icon
export const OpenCodeIcon: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="10" fill="#10A37F"/>
    <path d="M8 12L11 15L16 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

// Bash Icon
export const BashIcon: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="2" y="3" width="20" height="18" rx="2" fill="#4EAA25"/>
    <path d="M6 8L9 11L6 14" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M11 14H17" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
    <text x="14" y="10" fill="white" fontSize="6" fontWeight="bold">$</text>
  </svg>
)

// Zsh Icon
export const ZshIcon: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="2" y="3" width="20" height="18" rx="2" fill="#89B4FA"/>
    <path d="M7 8H11L7 16H11" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M13 8H17L13 16H17" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

// Fish Icon
export const FishIcon: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <ellipse cx="11" cy="12" rx="8" ry="5" fill="#96D0FF"/>
    <path d="M19 12L23 8V16L19 12Z" fill="#96D0FF"/>
    <circle cx="7" cy="11" r="1.5" fill="white"/>
    <circle cx="7" cy="11" r="0.5" fill="#333"/>
    <path d="M14 10C14 10 15 11 15 12C15 13 14 14 14 14" stroke="white" strokeWidth="1" strokeLinecap="round"/>
  </svg>
)

// WSL Icon
export const WslIcon: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="10" fill="#E95420"/>
    <circle cx="12" cy="12" r="4" fill="white"/>
    <circle cx="12" cy="4" r="2" fill="white"/>
    <circle cx="12" cy="20" r="2" fill="white"/>
    <circle cx="4" cy="12" r="2" fill="white"/>
    <circle cx="20" cy="12" r="2" fill="white"/>
  </svg>
)

// Default Terminal Icon
export const DefaultTerminalIcon: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="2" y="3" width="20" height="18" rx="2" fill="#6B7280"/>
    <path d="M6 8L10 12L6 16" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 16H18" stroke="white" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

// Icon mapping
const iconMap: Record<string, React.FC<IconProps>> = {
  'PS': PowerShellIcon,
  'powershell': PowerShellIcon,
  'CMD': CmdIcon,
  'cmd': CmdIcon,
  'GIT': GitBashIcon,
  'gitbash': GitBashIcon,
  'JS': NodeIcon,
  'node': NodeIcon,
  'PY': PythonIcon,
  'python': PythonIcon,
  'CC': ClaudeIcon,
  'claude': ClaudeIcon,
  'OC': OpenCodeIcon,
  'opencode': OpenCodeIcon,
  'BASH': BashIcon,
  'bash': BashIcon,
  'ZSH': ZshIcon,
  'zsh': ZshIcon,
  'FISH': FishIcon,
  'fish': FishIcon,
  'WSL': WslIcon,
  'wsl': WslIcon,
  'DEF': DefaultTerminalIcon,
  'default': DefaultTerminalIcon,
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
