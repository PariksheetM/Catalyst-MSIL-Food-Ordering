import Link from "next/link";

export default function NotFound() {
  return (
    <div className="wrap">
      <div className="form-shell">
        <div className="page-logo">
          <img src="/catalyst-logo.png" alt="Catalyst" />
        </div>
        <div className="card" style={{ textAlign: "center" }}>
          <h1>Page not found</h1>
          <p className="sub">
            The page you’re looking for doesn’t exist or was moved.
          </p>
          <Link href="/" className="navlink">
            Go to the form →
          </Link>
        </div>
      </div>
    </div>
  );
}
