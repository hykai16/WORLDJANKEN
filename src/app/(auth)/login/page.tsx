'use client'

import { createClient } from '@/lib/supabase/client'
import { useI18n } from '@/lib/i18n'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const { tr, lang, setLang } = useI18n()
  const router = useRouter()
  const supabase = createClient()

  async function loginWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback` },
    })
  }

  async function playAsGuest() {
    const { data, error } = await supabase.auth.signInAnonymously()
    if (error || !data.user) return

    await supabase.from('users').upsert({
      id: data.user.id,
      display_name: 'Guest',
      language: lang,
      rating: 1000,
      is_guest: true,
    })

    router.push('/')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 px-4">
      {/* 言語切り替え */}
      <div className="absolute top-4 right-4 flex gap-2 text-sm">
        <button
          onClick={() => setLang('ja')}
          className={`px-3 py-1 rounded-full ${lang === 'ja' ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:text-white'}`}
        >
          JP
        </button>
        <button
          onClick={() => setLang('en')}
          className={`px-3 py-1 rounded-full ${lang === 'en' ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:text-white'}`}
        >
          EN
        </button>
      </div>

      {/* ロゴ */}
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-black tracking-tight text-white mb-2">
          ✊ World Janken League
        </h1>
        <p className="text-zinc-400 text-lg">{tr('app.tagline')}</p>
      </div>

      {/* ログインカード */}
      <div className="w-full max-w-sm bg-zinc-900 rounded-2xl p-8 flex flex-col gap-4 border border-zinc-800">
        <h2 className="text-xl font-bold text-center mb-2">{tr('login.title')}</h2>

        <button
          onClick={loginWithGoogle}
          className="flex items-center justify-center gap-3 w-full py-3 px-4 bg-white text-zinc-900 rounded-xl font-semibold hover:bg-zinc-100 transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {tr('login.google')}
        </button>

        <div className="flex items-center gap-3 my-1">
          <div className="flex-1 h-px bg-zinc-700" />
          <span className="text-zinc-500 text-sm">or</span>
          <div className="flex-1 h-px bg-zinc-700" />
        </div>

        <button
          onClick={playAsGuest}
          className="w-full py-3 px-4 bg-zinc-800 text-zinc-300 rounded-xl font-semibold hover:bg-zinc-700 transition-colors"
        >
          {tr('login.guest')}
        </button>

        <p className="text-zinc-500 text-xs text-center">{tr('login.guest.note')}</p>
      </div>
    </div>
  )
}
