import type { Terminal } from '@xterm/xterm'

const terminals = new Map<string, Terminal>()

export const terminalRegistry = {
  register(id: string, terminal: Terminal): void {
    terminals.set(id, terminal)
  },

  unregister(id: string): void {
    terminals.delete(id)
  },

  get(id: string): Terminal | undefined {
    return terminals.get(id)
  },

  /** Register with an additional alias key (e.g., terminalId alongside ptyId) */
  registerAlias(aliasId: string, terminal: Terminal): void {
    terminals.set(aliasId, terminal)
  },

  /** Unregister an alias key */
  unregisterAlias(aliasId: string): void {
    terminals.delete(aliasId)
  }
}
