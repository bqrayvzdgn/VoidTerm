import React from 'react'
import { TerminalIcon } from '../Icons/TerminalIcons'
import type { Tab, Profile } from '../../types'

interface TabItemProps {
  tab: Tab
  profile: Profile
  isActive: boolean
  isDragging: boolean
  isDragOver: boolean
  inGroup?: boolean
  onSelect: () => void
  onClose: () => void
  onContextMenu: (e: React.MouseEvent) => void
  onDragStart: (e: React.DragEvent) => void
  onDragEnd: () => void
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: () => void
  onDrop: (e: React.DragEvent) => void
}

export const TabItem: React.FC<TabItemProps> = ({
  tab,
  profile,
  isActive,
  isDragging,
  isDragOver,
  inGroup,
  onSelect,
  onClose,
  onContextMenu,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop
}) => {
  const handleCloseClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClose()
  }

  const handleCloseKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.stopPropagation()
      onClose()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      onSelect()
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1) {
      e.preventDefault()
      onClose()
    }
  }

  return (
    <div
      role="tab"
      tabIndex={isActive ? 0 : -1}
      aria-selected={isActive}
      aria-label={`${tab.title} terminal tab`}
      className={`tab ${isActive ? 'active' : ''} ${isDragging ? 'dragging' : ''} ${isDragOver ? 'drag-over' : ''} ${inGroup ? 'in-group' : ''}`}
      style={{
        borderBottom: profile.color ? `2px solid ${profile.color}` : undefined
      }}
      onClick={onSelect}
      onKeyDown={handleKeyDown}
      onMouseDown={handleMouseDown}
      onContextMenu={onContextMenu}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <span className="tab-icon-wrapper">
        <TerminalIcon icon={profile.icon || 'PS'} size={16} />
      </span>
      <span className="tab-title">
        {tab.title}
      </span>
      <span
        role="button"
        tabIndex={0}
        className="tab-close"
        onClick={handleCloseClick}
        onKeyDown={handleCloseKeyDown}
        title="Close tab"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
          <path d="M9.5 3.5L8.5 2.5L6 5L3.5 2.5L2.5 3.5L5 6L2.5 8.5L3.5 9.5L6 7L8.5 9.5L9.5 8.5L7 6L9.5 3.5Z" />
        </svg>
      </span>
    </div>
  )
}
