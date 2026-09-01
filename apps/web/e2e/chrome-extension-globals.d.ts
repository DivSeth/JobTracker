declare namespace chrome {
  namespace storage {
    const local: {
      get(keys: string[]): Promise<Record<string, unknown>>
      set(items: Record<string, unknown>): Promise<void>
    }
  }

  namespace tabs {
    interface Tab {
      id?: number
      url?: string
    }

    function query(queryInfo: Record<string, unknown>): Promise<Tab[]>
    function sendMessage(tabId: number, message: unknown): Promise<unknown>
  }
}
