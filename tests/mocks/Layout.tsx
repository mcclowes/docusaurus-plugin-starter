import type { ReactNode } from 'react'

export default function Layout({ children }: { children?: ReactNode; title?: string; description?: string }) {
  return <div data-testid="layout">{children}</div>
}
