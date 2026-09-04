import Link from "next/link";
import { login, signup } from "./actions";

export default async function LoginPage(props: PageProps<"/login">) {
  const searchParams = await props.searchParams;
  const error = typeof searchParams.error === "string" ? searchParams.error : null;
  const message = typeof searchParams.message === "string" ? searchParams.message : null;

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 dark:bg-black">
      <div className="w-full max-w-sm rounded-lg border border-black/10 bg-white p-8 dark:border-white/10 dark:bg-zinc-950">
        <h1 className="mb-1 text-2xl font-semibold text-black dark:text-zinc-50">
          Daily Fuel Log
        </h1>
        <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
          Sign in or create an account.
        </p>

        {error && (
          <p className="mb-4 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
            {error}
          </p>
        )}
        {message && (
          <p className="mb-4 rounded border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-400">
            {message}
          </p>
        )}

        <form className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="rounded border border-black/15 bg-white px-3 py-2 text-sm text-black outline-none focus:border-black/40 dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-white/40"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              className="rounded border border-black/15 bg-white px-3 py-2 text-sm text-black outline-none focus:border-black/40 dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-white/40"
            />
          </div>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <button
              formAction={login}
              className="flex-1 rounded-full bg-black px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              Sign in
            </button>
            <button
              formAction={signup}
              className="flex-1 rounded-full border border-black/15 px-4 py-2.5 text-sm font-medium text-black transition-colors hover:bg-black/5 dark:border-white/15 dark:text-zinc-50 dark:hover:bg-white/5"
            >
              Sign up
            </button>
          </div>
        </form>

        <p className="mt-6 text-center text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-500">
          For personal tracking only — not medical or dietary advice. Consult a
          doctor or registered dietitian before making significant diet changes.
          <br />
          <Link href="/about" className="underline hover:text-zinc-700 dark:hover:text-zinc-300">
            About this app
          </Link>
        </p>
      </div>
    </div>
  );
}
