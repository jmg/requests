"use client";

// Boundary de error de nivel raíz (reemplaza al layout cuando algo falla muy
// arriba). Vive fuera del provider de i18n, por eso el texto es neutral.
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="es">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          margin: 0,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 40, margin: 0 }}>😕</p>
          <h1 style={{ fontSize: 20 }}>Algo salió mal · Something went wrong</h1>
          <button
            onClick={() => reset()}
            style={{
              marginTop: 12,
              padding: "8px 16px",
              borderRadius: 8,
              border: "none",
              background: "#1d783f",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Reintentar · Retry
          </button>
        </div>
      </body>
    </html>
  );
}
