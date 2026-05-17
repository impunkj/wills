import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from './App'

describe('Wills24 admin foundation', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('redirects unauthenticated users to login', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard-home']}>
        <App />
      </MemoryRouter>,
    )

    expect(screen.getByText('Welcome back')).toBeInTheDocument()
  })

  it('shows the dashboard shell after login', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>,
    )

    await user.type(screen.getByLabelText('Email'), 'admin@wills24.ai')
    await user.type(screen.getByLabelText('Password'), 'password')
    const loginButton = screen
      .getAllByRole('button', { name: /login/i })
      .find((button) => !button.hasAttribute('disabled'))

    expect(loginButton).toBeDefined()
    await user.click(loginButton!)

    expect(await screen.findByText('Anurag Bhatia')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /dark mode/i })).toBeInTheDocument()
    expect(screen.getByText('Sales CRM')).toBeInTheDocument()
  })
})
