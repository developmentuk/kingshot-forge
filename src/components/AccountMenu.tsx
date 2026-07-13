import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

function AccountMenu() {
  const {
    user,
    loading,
    signInWithGoogle,
    signOut,
  } = useAuth()

  const [errorMessage, setErrorMessage] = useState('')
  const [working, setWorking] = useState(false)

  async function handleSignIn() {
    setErrorMessage('')
    setWorking(true)

    try {
      await signInWithGoogle()
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Google sign-in failed.',
      )
      setWorking(false)
    }
  }

  async function handleSignOut() {
    setErrorMessage('')
    setWorking(true)

    try {
      await signOut()
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Sign out failed.',
      )
    } finally {
      setWorking(false)
    }
  }

  if (loading) {
    return (
      <div className="account-menu account-menu--loading">
        Loading…
      </div>
    )
  }

  if (!user) {
    return (
      <div className="account-menu">
        <button
          type="button"
          className="button button--secondary account-menu__button"
          disabled={working}
          onClick={handleSignIn}
        >
          {working ? 'Opening Google…' : 'Sign in'}
        </button>

        {errorMessage && (
          <span className="account-menu__error">
            {errorMessage}
          </span>
        )}
      </div>
    )
  }

  const displayName =
    user.user_metadata.full_name ??
    user.user_metadata.name ??
    user.email ??
    'Member'

  const avatarUrl =
    user.user_metadata.avatar_url as string | undefined

  return (
    <div className="account-menu account-menu--signed-in">
      <div className="account-menu__identity">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            className="account-menu__avatar"
          />
        ) : (
          <span className="account-menu__avatar account-menu__avatar--fallback">
            {displayName.charAt(0).toUpperCase()}
          </span>
        )}

        <div>
          <strong>{displayName}</strong>
          <small>{user.email}</small>
        </div>
      </div>

      <button
        type="button"
        className="account-menu__sign-out"
        disabled={working}
        onClick={handleSignOut}
      >
        {working ? 'Signing out…' : 'Sign out'}
      </button>

      {errorMessage && (
        <span className="account-menu__error">
          {errorMessage}
        </span>
      )}
    </div>
  )
}

export default AccountMenu