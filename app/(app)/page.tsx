import { NewNoteButton } from "@/components/NewNoteButton";

export default function AppHomePage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Home</h1>
        <NewNoteButton />
      </div>
      <p className="text-sm text-foreground/50">
        Select a notebook, or create one to get started.
      </p>
    </div>
  );
}
