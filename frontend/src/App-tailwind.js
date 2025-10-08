// src/App.js
import React, { useEffect, useState } from "react";

function CommentSection({ postId, user }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");

  useEffect(() => {
    fetch(`http://localhost:4000/api/posts/${postId}/comments`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => setComments(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, [postId]);

  const addComment = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    const res = await fetch(
      `http://localhost:4000/api/posts/${postId}/comments`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content: text }),
      }
    );

    if (res.ok) {
      const data = await res.json();
      setComments(Array.isArray(data) ? data : []);
      setText("");
    } else {
      alert("Failed to add comment");
    }
  };

  return (
    <div className="mt-3">
      <div className="space-y-2">
        {comments.length === 0 ? (
          <p className="text-sm text-slate-500">No comments yet.</p>
        ) : (
          comments.map((c) => (
            <div key={c._id} className="rounded-xl bg-slate-50 px-3 py-2">
              <div className="text-sm">
                <b>{c.author?.name || "Anon"}:</b> {c.content}
              </div>
              <div className="mt-0.5 text-xs text-slate-500">
                {new Date(c.createdAt).toLocaleString()}
              </div>
            </div>
          ))
        )}
      </div>

      {user && (
        <form onSubmit={addComment} className="mt-3 flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write a comment..."
            className="flex-1 rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
          />
          <button
            type="submit"
            className="rounded-xl bg-sky-600 px-4 py-2 text-white font-semibold shadow hover:bg-sky-700 transition"
          >
            Send
          </button>
        </form>
      )}
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRegister, setIsRegister] = useState(false);
  const [remember, setRemember] = useState(false);
  const [form, setForm] = useState({ username: "", password: "", confirm: "" });
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    fetch("http://localhost:4000/auth/me", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        setUser(data.user);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch("http://localhost:4000/api/posts", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => Array.isArray(data) && setPosts(data))
      .catch(console.error);
  }, [user]);

  // Login handler yang dipanggil dari form login ceria
  const loginWithPayload = async ({ identity, password, remember }) => {
    try {
      const res = await fetch("http://localhost:4000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username: identity, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Invalid credentials");
        return;
      }

      await fetch("http://localhost:4000/auth/session-options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ remember }),
      });

      setUser(data.user);
      alert(`Welcome back, ${data.user.name || "User"}!`);
    } catch (err) {
      console.error(err);
      alert("Server error while logging in.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isRegister) {
      if (form.password !== form.confirm) {
        alert("Password confirmation does not match!");
        return;
      }

      try {
        const res = await fetch("http://localhost:4000/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            username: form.username,
            password: form.password,
          }),
        });

        const data = await res.json();
        if (!res.ok) return alert(data.error || "Registration failed");

        alert("Registration successful! Please login now.");
        setIsRegister(false);
        setForm({ username: "", password: "", confirm: "" });
      } catch (err) {
        console.error(err);
        alert("Server error during registration.");
      }
    }
  };

  const handleLogout = async () => {
    try {
      const res = await fetch("http://localhost:4000/auth/logout", {
        credentials: "include",
      });
      if (res.ok) {
        setUser(null);
        setForm({ username: "", password: "", confirm: "" });
        alert("You have been logged out.");
      } else {
        alert("Logout failed.");
      }
    } catch (err) {
      console.error(err);
      alert("Logout failed.");
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:4000/auth/google";
  };
  const handleFacebookLogin = () => {
    window.location.href = "http://localhost:4000/auth/facebook";
  };

  const handleAddPost = async (e) => {
    e.preventDefault();
    const title = e.target.title.value.trim();
    const content = e.target.content.value.trim();
    if (!title) return alert("Title required");

    const res = await fetch("http://localhost:4000/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ title, content }),
    });

    if (res.ok) {
      const newPost = await res.json();
      setPosts((prev) => [newPost, ...prev]);
      e.target.reset();
    } else {
      const err = await res.json();
      alert(err.error || "Failed to create post.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this post?")) return;
    const res = await fetch(`http://localhost:4000/api/posts/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.ok) {
      setPosts((prev) => prev.filter((p) => p._id !== id));
    } else {
      alert("Delete failed.");
    }
  };

  if (loading)
    return (
      <div className="min-h-screen grid place-items-center bg-gradient-to-br from-sky-50 via-rose-50 to-amber-50">
        <p className="rounded-xl bg-white/80 px-4 py-2 shadow ring-1 ring-black/5">
          Loading...
        </p>
      </div>
    );

  return (
    <main className="min-h-screen w-full bg-gradient-to-br from-sky-50 via-rose-50 to-amber-50 relative overflow-hidden flex items-start justify-center px-4 py-12">
      {/* confetti & blobs ceria */}
      <div className="pointer-events-none absolute inset-0 [background-image:radial-gradient(theme(colors.sky.300)_1px,transparent_1px),radial-gradient(theme(colors.pink.300)_1px,transparent_1px),radial-gradient(theme(colors.amber.300)_1px,transparent_1px)] [background-size:24px_24px,28px_28px,36px_36px] [background-position:0_0,12px_12px,6px_18px] opacity-30" />
      <div className="absolute -top-16 -left-16 h-56 w-56 rounded-full bg-sky-200/40 blur-3xl" />
      <div className="absolute -bottom-20 -right-24 h-72 w-72 rounded-full bg-rose-200/40 blur-3xl" />

      <div className="relative z-10 w-full max-w-3xl flex flex-col gap-6 text-center">
        {/* judul hanya saat SUDAH login agar tidak dobel */}
        {user && (
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-800">
            Bulletin Board <span className="align-middle">🎉</span>
          </h1>
        )}

        {user ? (
          <>
            {/* USER CARD */}
            <div className="mx-auto max-w-md rounded-2xl bg-white/80 shadow-xl ring-1 ring-black/5 backdrop-blur p-6">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt="avatar"
                  className="mx-auto h-16 w-16 rounded-full object-cover ring-2 ring-white shadow"
                />
              ) : (
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sky-600 text-white text-xl font-bold shadow">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
              )}
              <h2 className="mt-3 text-lg font-semibold text-slate-800">
                {user.name}
              </h2>

              <button
                onClick={handleLogout}
                className="mt-4 inline-flex items-center justify-center rounded-xl bg-rose-600 px-4 py-2 font-semibold text-white shadow hover:bg-rose-700 transition"
              >
                Logout
              </button>
            </div>

            {/* POSTS */}
            <div className="mt-2 text-left">
              <h3 className="text-xl font-bold text-slate-800 mb-3">
                Bulletin Board
              </h3>

              <form
                className="mb-6 grid gap-3 rounded-2xl bg-white/80 p-4 shadow ring-1 ring-black/5"
                onSubmit={handleAddPost}
              >
                <input
                  name="title"
                  placeholder="Post title"
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <textarea
                  name="content"
                  placeholder="Write something..."
                  className="min-h-24 w-full rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <button
                  type="submit"
                  className="justify-self-start rounded-xl bg-amber-500 px-4 py-2 font-semibold text-white shadow hover:bg-amber-600 transition"
                >
                  Add Post
                </button>
              </form>

              {posts.map((p) => (
                <div
                  key={p._id}
                  className="mb-4 rounded-2xl bg-white/90 p-5 shadow ring-1 ring-black/5 text-left"
                >
                  <h4 className="text-lg font-semibold text-slate-800">
                    {p.title}
                  </h4>
                  <p className="mt-1 text-slate-700">{p.content}</p>
                  <small className="block mt-2 text-slate-500">
                    By {p.author?.name || "Anonymous"} •{" "}
                    {new Date(p.createdAt).toLocaleString()}
                  </small>
                  {user && p.author && user._id === p.author._id && (
                    <button
                      onClick={() => handleDelete(p._id)}
                      className="mt-3 inline-flex items-center rounded-xl bg-rose-600 px-3 py-1.5 text-sm font-semibold text-white shadow hover:bg-rose-700 transition"
                    >
                      Delete
                    </button>
                  )}
                  <CommentSection postId={p._id} user={user} />
                </div>
              ))}
            </div>
          </>
        ) : (
          // ===== LOGIN CERIA (inline, tanpa file terpisah) =====
          <section className="relative z-10 w-full max-w-md">
            <div className="mb-8 text-center">
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-800">
                Bulletin Board <span className="align-middle">🎉</span>
              </h1>
              <p className="mt-2 text-slate-600">
                Masuk untuk berbagi kabar baik, ide, dan pengumuman ceria.
              </p>
            </div>

            <div className="rounded-2xl bg-white/80 shadow-xl ring-1 ring-black/5 backdrop-blur p-6 sm:p-8">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const data = new FormData(e.currentTarget);
                  loginWithPayload({
                    identity: data.get("identity"),
                    password: data.get("password"),
                    remember: data.get("remember") === "on",
                  });
                }}
                className="space-y-5"
              >
                <label className="block">
                  <span className="block text-sm font-medium text-slate-700">
                    Username atau Email
                  </span>
                  <input
                    name="identity"
                    type="text"
                    required
                    placeholder="mis. dewi@contoh.com"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white/90 px-4 py-3 text-slate-800 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition"
                  />
                </label>

                <label className="block">
                  <span className="block text-sm font-medium text-slate-700">
                    Password
                  </span>
                  <input
                    name="password"
                    type="password"
                    required
                    placeholder="••••••••"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white/90 px-4 py-3 text-slate-800 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition"
                  />
                </label>

                <div className="flex items-center justify-between">
                  <label className="inline-flex items-center gap-2 select-none">
                    <input
                      type="checkbox"
                      name="remember"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                    <span className="text-sm text-slate-600">Ingat saya</span>
                  </label>
                  <a
                    href="#"
                    className="text-sm font-medium text-sky-700 hover:text-sky-800"
                  >
                    Lupa password?
                  </a>
                </div>

                <button
                  type="submit"
                  className="group relative inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-3 font-semibold text-white shadow-md ring-1 ring-sky-700/10 transition hover:-translate-y-0.5 hover:bg-sky-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-400"
                >
                  <span>Masuk</span>
                  <span className="opacity-0 translate-y-1 group-hover:translate-y-0 group-hover:opacity-100 transition">
                    🚀
                  </span>
                </button>

                <p className="text-center text-sm text-slate-600">
                  Pengguna baru?{" "}
                  <button
                    type="button"
                    onClick={() => setIsRegister(true)}
                    className="font-medium text-sky-700 hover:text-sky-800 underline underline-offset-2"
                  >
                    Daftar di sini
                  </button>
                </p>

                <div className="relative py-1">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white/80 px-3 text-sm text-slate-500">atau</span>
                  </div>
                </div>

                <div className="grid gap-3">
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="inline-flex w-full items-center justify-center gap-3 rounded-xl bg-white px-4 py-3 font-semibold text-slate-800 ring-1 ring-slate-200 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-400"
                  >
                    <span className="h-5 w-5 inline-block bg-white">
                      <img
                        alt="Google"
                        src="https://developers.google.com/identity/images/g-logo.png"
                        className="h-5 w-5"
                      />
                    </span>
                    Lanjut dengan Google
                  </button>
                  <button
                    type="button"
                    onClick={handleFacebookLogin}
                    className="inline-flex w-full items-center justify-center gap-3 rounded-xl bg-[#1877F2] px-4 py-3 font-semibold text-white shadow-sm transition hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-400"
                  >
                    <img
                      alt="Facebook"
                      src="https://upload.wikimedia.org/wikipedia/commons/4/44/Facebook_Logo.png"
                      className="h-5 w-5"
                    />
                    Lanjut dengan Facebook
                  </button>
                </div>
              </form>
            </div>

            {/* REGISTER (masih single-file) */}
            {isRegister && (
              <div className="mt-4 mx-auto w-full max-w-md rounded-2xl bg-white/80 shadow-xl ring-1 ring-black/5 backdrop-blur p-6 sm:p-8 text-left">
                <h2 className="text-2xl font-bold text-slate-800 mb-4">
                  Create your account
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <input
                    type="text"
                    value={form.username}
                    onChange={(e) =>
                      setForm({ ...form, username: e.target.value })
                    }
                    placeholder="Username or Email"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white/90 px-4 py-3 text-slate-800 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    placeholder="Password"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white/90 px-4 py-3 text-slate-800 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                  <input
                    type="password"
                    value={form.confirm}
                    onChange={(e) =>
                      setForm({ ...form, confirm: e.target.value })
                    }
                    placeholder="Confirm Password"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white/90 px-4 py-3 text-slate-800 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />

                  <div className="grid gap-2">
                    <button
                      type="submit"
                      className="w-full rounded-xl bg-sky-600 px-4 py-3 font-semibold text-white shadow-md hover:bg-sky-700 transition"
                    >
                      Register
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsRegister(false)}
                      className="w-full text-sky-700 hover:text-sky-800 text-sm font-medium"
                    >
                      Already have an account? Login
                    </button>
                  </div>
                </form>
              </div>
            )}
          </section>
        )}

        <footer className="mt-2 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} Bulletin Board — All Rights Reserved.
        </footer>
      </div>
    </main>
  );
}
