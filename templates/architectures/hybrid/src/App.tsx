import { Button } from "@/shared/components/ui/Button";

export default function App() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--color-bg, #ffffff)",
      }}
    >
      <h1>Welcome to Lumen</h1>
      <p>Hybrid architecture (src/features + src/shared).</p>
      <Button>Click me</Button>
    </div>
  );
}
