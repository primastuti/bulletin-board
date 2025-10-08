// src/App.js
import React, { useEffect, useState } from "react";
//import "./index.css";

function CommentSection({ postId, user }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");

  // === LOAD COMMENTS ===
  useEffect(() => {
    fetch(`http://localhost:4000/api/posts/${postId}/comments`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => setComments(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, [postId]);

  // === ADD COMMENT ===
  const addComment = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    const res = await fetch(`http://localhost:4000/api/posts/${postId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ content: text }),
    });

    if (res.ok) {
      const data = await res.json();
      setComments(Array.isArray(data) ? data : []);
      setText("");
    } else {
      alert("Failed to add comment");
    }
  };

  return (
    <div className="comment-section">
      <div className="comment-list">
        {comments.length === 0 ? (
          <p className="no-comments">No comments yet.</p>
        ) : (
          comments.map((c) => (
            <div key={c._id} className="comment-item">
              <b>{c.author?.name || "Anon"}:</b> {c.content}
              <div className="comment-meta">
                <small>{new Date(c.createdAt).toLocaleString()}</small>
              </div>
            </div>
          ))
        )}
      </div>

      {user && (
        <form onSubmit={addComment} className="comment-form">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write a comment..."
          />
          <button type="submit">Send</button>
        </form>
      )}
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRegister, setIsRegister] = useState(false);
  const [remember, setRemember] = useState(false);
  const [form, setForm] = useState({ username: "", password: "", confirm: "" });
  const [posts, setPosts] = useState([]);

  // === CHECK SESSION ===
  useEffect(() => {
    fetch("http://localhost:4000/auth/me", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        setUser(data.user);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // === LOAD POSTS ===
  useEffect(() => {
    fetch("http://localhost:4000/api/posts", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => Array.isArray(data) && setPosts(data))
      .catch(console.error);
  }, [user]);

  // === REGISTER / LOGIN HANDLER ===
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isRegister) {
      // === REGISTER ===
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

        // ✅ Reset ke form login dan kosongkan input
        setIsRegister(false);
        setForm({ username: "", password: "", confirm: "" });
      } catch (err) {
        console.error(err);
        alert("Server error during registration.");
      }
    } else {
      // === LOGIN ===
      try {
        const res = await fetch("http://localhost:4000/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            username: form.username,
            password: form.password,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          alert(data.error || "Invalid credentials");
          return;
        }

        // === APPLY REMEMBER ME ===
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
    }
  };

  // === LOGOUT ===
  const handleLogout = async () => {
    try {
      const res = await fetch("http://localhost:4000/auth/logout", {
        credentials: "include",
      });
      if (res.ok) {
        setUser(null);

        // ✅ Kosongkan form login/register setelah logout
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

  // === SOCIAL LOGIN ===
  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:4000/auth/google";
  };
  const handleFacebookLogin = () => {
    window.location.href = "http://localhost:4000/auth/facebook";
  };

  // === ADD POST ===
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

  // === DELETE POST ===
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
      <div className="center-screen">
        <p>Loading...</p>
      </div>
    );

  // === MAIN UI ===
  return (
    <main className="min-h-screen w-full bg-gradient-to-br from-sky-50 via-rose-50 to-amber-50 relative overflow-hidden flex items-start justify-center px-4 py-12">
      <div className="center-screen flex-col gap-6 text-center">
        <div className="mb-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-800">
            Bulletin Board <span className="align-middle">🎉</span>
          </h1>
          <p className="mt-2 text-slate-600">
            Sign in to share good news, ideas, and cheerful announcements.
          </p>
        </div>

        {user ? (
          <>
            {/* === USER CARD === */}
            <div className="card">
              {user.avatar ? (
                <img src={user.avatar} alt="avatar" className="avatar" />
              ) : (
                <div className="avatar-placeholder">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
              )}
              <h2 className="user-name">{user.name}</h2>

              <button onClick={handleLogout} className="btn-primary mt-3">
                Logout
              </button>
            </div>

            {/* === POSTS SECTION === */}
            <div className="posts-section">
              <h3 className="section-title">Bulletin Board</h3>

              <form className="post-form" onSubmit={handleAddPost}>
                <input name="title" placeholder="Post title" required />
                <textarea name="content" placeholder="Write something..." />
                <button type="submit" className="btn-primary">
                  Add Post
                </button>
              </form>

              {posts.map((p) => (
                <div key={p._id} className="post-card">
                  <h4>{p.title}</h4>
                  <p className="whitespace-pre-line">{p.content}</p>
                  <small>
                    By {p.author?.name || "Anonymous"} •{" "}
                    {new Date(p.createdAt).toLocaleString()}
                  </small>
                  {user && p.author && user._id === p.author._id && (
                    <button
                      onClick={() => handleDelete(p._id)}
                      className="btn-delete"
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
          <>
            {/* === LOGIN / REGISTER FORM === */}
            <div className="rounded-2xl bg-white/80 shadow-xl ring-1 ring-black/5 backdrop-blur p-6 sm:p-8">
              <form onSubmit={handleSubmit} className="auth-form">
                <span className="block text-sm font-medium text-slate-700 text-left">
                  Username or Email
                </span>
                <label className="block">
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-white/90 px-4 py-3 text-slate-800 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                    type="text"
                    value={form.username}
                    onChange={(e) =>
                      setForm({ ...form, username: e.target.value })
                    }
                    placeholder="Username or Email"
                    required
                  />
                </label>
                <span className="block text-sm font-medium text-slate-700 text-left">
                  Password
                </span>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white/90 px-4 py-3 text-slate-800 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  placeholder="Password"
                  required
                />
                {isRegister && (
                  <input
                    type="password"
                    value={form.confirm}
                    onChange={(e) =>
                      setForm({ ...form, confirm: e.target.value })
                    }
                    placeholder="Confirm Password"
                    required
                  />
                )}
                {!isRegister && (
                  <label className="remember-me">
                    <span className="block text-sm font-medium text-slate-700 text-left">
                      <input
                        type="checkbox"
                        checked={remember}
                        onChange={(e) => setRemember(e.target.checked)}
                      />
                      &nbsp;Remember me
                    </span>
                  </label>
                )}
                <button type="submit" className="btn-primary group relative inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-3 font-semibold text-white shadow-md ring-1 ring-sky-700/10 transition hover:-translate-y-0.5 hover:bg-sky-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-400">
                  {isRegister ? "Register" : "Login"}
                  <span className="opacity-0 translate-y-1 group-hover:translate-y-0 group-hover:opacity-100 transition">
                    🚀
                  </span>
                </button>
                <button
                  type="button"
                  className="switch"
                  onClick={() => setIsRegister(!isRegister)}
                >
                  {isRegister
                    ? "Already have an account? Login"
                    : "New user? Register here"}
                </button>
              </form>


              <div className="divider">
                <span>or</span>
              </div>

              <button onClick={handleGoogleLogin} className="btn-google">
                <img
                  src="https://cdn1.iconfinder.com/data/icons/google-s-logo/150/Google_Icons-09-512.png"
                  alt="Google"
                />
                <span>     Continue with Google</span>
              </button>
              <button onClick={handleFacebookLogin} className="btn-facebook mt-3">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/4/44/Facebook_Logo.png"
                  alt="Facebook"
                />
                <span>Continue with Facebook</span>
              </button>
            </div>
          </>
        )}

        <footer className="footer">
          © {new Date().getFullYear()} Bulletin Board — All Rights Reserved.
        </footer>
      </div>
    </main>
  );
}

export default App;
