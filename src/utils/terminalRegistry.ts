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
  }
}
