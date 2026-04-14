import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import StarterMessage from '../../src/theme/StarterMessage'

describe('StarterMessage', () => {
  it('renders the greeting from plugin data', () => {
    render(<StarterMessage />)

    expect(screen.getByText(/Hello from plugin/)).toBeInTheDocument()
    expect(screen.getByText(/Test Site/)).toBeInTheDocument()
  })
})
