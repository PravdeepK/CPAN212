import "./styles.css";

export default function Layout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>Wordle Clone</title>
        <meta name="description" content="A simple Wordle clone built with Next.js" />
        
        {/* ✅ Mobile viewport fix */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body style={{ margin: 0, padding: 0 }}>
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
          {children}
        </div>
      </body>
    </html>
  );
}
