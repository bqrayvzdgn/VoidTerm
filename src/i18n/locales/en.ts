import type { TranslationKeys } from './tr'

export const en: TranslationKeys = {
  common: {
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    close: 'Close',
    reset: 'Reset',
    export: 'Export',
    import: 'Import',
    confirm: 'Confirm',
    yes: 'Yes',
    no: 'No',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    warning: 'Warning'
  },
  
  app: {
    title: 'VoidTerm',
    noTerminal: 'No terminal open',
    useQuickStart: 'Use Quick Start or press Ctrl+T',
    loadingConfig: 'Loading configuration...'
  },
  
  settings: {
    title: 'Settings',
    
    tabs: {
      appearance: 'Appearance',
      terminal: 'Terminal',
      shortcuts: 'Shortcuts',
      profiles: 'Profiles',
      backup: 'Backup',
      about: 'About'
    },
    
    appearance: {
      title: 'Appearance Settings',
      theme: 'Theme',
      fontFamily: 'Font Family',
      fontSize: 'Font Size',
      lineHeight: 'Line Height',
      letterSpacing: 'Letter Spacing',
      cursorStyle: 'Cursor Style',
      cursorBlink: 'Cursor Blink',
      windowEffects: 'Window Effects',
      opacity: 'Opacity',
      blur: 'Blur Effect',
      backgroundImage: 'Background Image',
      backgroundImagePlaceholder: 'File path or URL',
      customThemes: 'Custom Themes',
      importTheme: 'Import Theme',
      exportTheme: 'Export',
      deleteTheme: 'Delete',
      themeImportSuccess: 'Theme imported successfully!',
      themeImportError: 'Failed to import theme',
      themeDeleteConfirm: 'Delete this custom theme?',
      noCustomThemes: 'No custom themes. Import a theme file to add one.',
      builtInThemes: 'Built-in Themes',
      customThemesList: 'Custom Themes'
    },
    
    terminal: {
      title: 'Terminal Settings',
      defaultProfile: 'Default Profile',
      scrollback: 'Scrollback',
      copyOnSelect: 'Copy on Select',
      bellSound: 'Bell Sound'
    },
    
    shortcuts: {
      title: 'Keyboard Shortcuts',
      newTab: 'New Tab',
      closeTab: 'Close Tab',
      closePane: 'Close Pane',
      splitVertical: 'Split Vertical',
      splitHorizontal: 'Split Horizontal',
      toggleSidebar: 'Toggle Sidebar',
      openSettings: 'Settings',
      nextTab: 'Next Tab',
      prevTab: 'Previous Tab',
      focusLeft: 'Focus Left Pane',
      focusRight: 'Focus Right Pane',
      focusUp: 'Focus Up Pane',
      focusDown: 'Focus Down Pane',
      toggleSearch: 'Toggle Search',
      clearTerminal: 'Clear Terminal',
      copyText: 'Copy',
      pasteText: 'Paste',
      openCommandPalette: 'Command Palette',
      openSSHManager: 'SSH Manager',
      resetToDefault: 'Reset to Default',
      pressKeys: 'Press keys...',
      resetConfirm: 'Keyboard shortcuts will be reset to default. Continue?',
      conflictWarning: 'This shortcut is already in use:',
      categorySections: 'Tabs',
      categoryPanes: 'Panes',
      categoryNavigation: 'Navigation',
      categoryTerminal: 'Terminal',
      categoryGeneral: 'General'
    },
    
    profiles: {
      title: 'Profile Management',
      newProfile: 'New Profile',
      addProfile: 'Add Profile',
      editProfile: 'Edit Profile',
      name: 'Name',
      namePlaceholder: 'Profile name',
      icon: 'Icon',
      iconPlaceholder: 'Icon (max 4 chars)',
      color: 'Color',
      shell: 'Shell',
      shellPlaceholder: 'e.g: cmd.exe, powershell.exe',
      arguments: 'Arguments',
      argumentsPlaceholder: 'e.g: /k claude',
      workingDirectory: 'Working Directory',
      workingDirectoryPlaceholder: 'e.g: C:\\Users\\user\\projects',
      envVariables: 'Environment Variables',
      envVariablesPlaceholder: 'KEY=value (one per line)',
      startupCommand: 'Startup Command',
      startupCommandPlaceholder: 'e.g: cls && echo Welcome!',
      deleteConfirm: 'Are you sure you want to delete this profile?',
      minProfileError: 'At least one profile is required!'
    },
    
    backup: {
      title: 'Backup and Restore',
      exportTitle: 'Export All Settings',
      exportDescription: 'Export all settings and profile configurations as a JSON file.',
      exportButton: 'Export Settings',
      importTitle: 'Import All Settings',
      importDescription: 'Restore previously exported settings.',
      importButton: 'Import Settings',
      importSuccess: 'Settings imported successfully!',
      importError: 'Could not read file: Make sure it is a valid JSON file.',
      exportProfilesTitle: 'Export Profiles Only',
      exportProfilesDescription: 'Export terminal profiles as a separate file.',
      exportProfilesButton: 'Export Profiles',
      importProfilesTitle: 'Import Profiles Only',
      importProfilesDescription: 'Restore previously exported profiles.',
      importProfilesButton: 'Import Profiles',
      profileImportSuccess: 'Profiles imported successfully!',
      profileImportCount: 'profiles imported',
      resetTitle: 'Reset',
      resetDescription: 'Reset all settings to default values.',
      resetButton: 'Reset to Default',
      resetConfirm: 'All settings will be reset to default. Continue?'
    },
    
    about: {
      title: 'About',
      version: 'Version',
      description: 'A modern, fast, and customizable terminal emulator. Built with Electron, React, and xterm.js.',
      github: 'GitHub'
    }
  },
  
  sidebar: {
    workspaces: 'Workspaces',
    newWorkspace: 'New Workspace',
    quickStart: 'Quick Start',
    settings: 'Settings',
    rename: 'Rename',
    delete: 'Delete',
    deleteConfirm: 'Are you sure you want to delete this workspace?'
  },
  
  tabbar: {
    newTab: 'New Tab',
    closeTab: 'Close Tab',
    closeOthers: 'Close Others',
    closeAll: 'Close All',
    duplicate: 'Duplicate',
    createGroup: 'Create Group',
    addToGroup: 'Add to Group',
    removeFromGroup: 'Remove from Group',
    renameGroup: 'Rename Group',
    deleteGroup: 'Delete Group',
    ungroupAll: 'Ungroup All Tabs',
    newGroup: 'New Group',
    groupName: 'Group Name',
    noGroups: 'No groups yet'
  },
  
  terminal: {
    search: 'Search',
    searchPlaceholder: 'Search...',
    noResults: 'No results',
    copied: 'Copied!',
    copy: 'Copy',
    paste: 'Paste',
    clear: 'Clear',
    selectAll: 'Select All'
  },
  
  ssh: {
    title: 'SSH Connections',
    newConnection: 'Add Connection',
    name: 'Name',
    host: 'Host',
    port: 'Port',
    username: 'Username',
    authentication: 'Authentication',
    privateKey: 'Private Key',
    privateKeyPath: 'Private Key Path',
    sshAgent: 'SSH Agent',
    password: 'Password (not recommended)',
    jumpHost: 'Jump Host (optional)',
    jumpHostPlaceholder: 'user@jumphost.com',
    connect: 'Connect',
    noConnections: 'No saved SSH connections',
    addConnectionHint: 'Click "Add Connection" to create one'
  },
  
  commandPalette: {
    placeholder: 'Search commands...',
    newTab: 'New Tab',
    closeTab: 'Close Tab',
    splitVertical: 'Split Vertical',
    splitHorizontal: 'Split Horizontal',
    closePane: 'Close Pane',
    toggleSidebar: 'Toggle Sidebar',
    openSettings: 'Open Settings',
    nextTab: 'Next Tab',
    prevTab: 'Previous Tab',
    openSSH: 'Open SSH Manager'
  },
  
  errors: {
    generic: 'An error occurred',
    terminalCreate: 'Failed to create terminal',
    configLoad: 'Failed to load configuration',
    profileSave: 'Failed to save profile',
    sshConnect: 'SSH connection failed',
    invalidInput: 'Invalid input'
  },
  
  snippets: {
    title: 'Snippets',
    addSnippet: 'Add Snippet',
    editSnippet: 'Edit Snippet',
    deleteSnippet: 'Delete Snippet',
    deleteConfirm: 'Are you sure you want to delete this snippet?',
    name: 'Name',
    namePlaceholder: 'Snippet name',
    command: 'Command',
    commandPlaceholder: 'Command to run',
    description: 'Description',
    descriptionPlaceholder: 'Optional description',
    category: 'Category',
    shortcut: 'Shortcut',
    shortcutPlaceholder: 'e.g. Ctrl+Shift+1',
    noSnippets: 'No snippets yet',
    addSnippetHint: 'Save frequently used commands as snippets',
    run: 'Run',
    usageCount: 'uses',
    export: 'Export Snippets',
    import: 'Import Snippets',
    importSuccess: 'Snippets imported successfully',
    importError: 'Failed to import snippets',
    searchPlaceholder: 'Search snippets...',
    allCategories: 'All Categories',
    addCategory: 'Add Category',
    newCategoryPlaceholder: 'New category name'
  },
  
  errorBoundary: {
    title: 'Something went wrong',
    message: 'An unexpected error occurred',
    reload: 'Reload Application',
    tryAgain: 'Try Again',
    resetConfig: 'Reset Configuration',
    copyError: 'Copy Error Details',
    errorCopied: 'Error details copied to clipboard',
    errorDetails: 'Error Details (for debugging)',
    errorReport: 'VoidTerm Error Report'
  },
  
  toast: {
    settingsExported: 'Settings exported',
    settingsImported: 'Settings imported',
    profilesExported: 'Profiles exported',
    profilesImported: 'profiles imported',
    snippetsExported: 'Snippets exported',
    snippetsImported: 'Snippets imported',
    settingsReset: 'Settings reset',
    copiedToClipboard: 'Copied to clipboard',
    terminalCreated: 'Terminal created',
    terminalClosed: 'Terminal closed',
    connectionFailed: 'Connection failed',
    connectionSuccess: 'Connection successful',
    invalidFile: 'Invalid file format',
    operationFailed: 'Operation failed'
  }
}
