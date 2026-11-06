import ui from "./ui.module.css";

export function LoadError({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : "Could not load data";
  return (
    <div className={ui.error} role="alert">
      {message}
    </div>
  );
}
