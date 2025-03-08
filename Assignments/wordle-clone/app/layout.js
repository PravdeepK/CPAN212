import "./styles.css"; // ✅ Import global styles

export default function Layout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>Wordle Clone</title>
        <meta name="description" content="A simple Wordle clone built with Next.js" />
      </head>
      <body>
        <main>{children}</main>
      </body>
    </html>
  );
}
