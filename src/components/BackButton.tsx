import { useRouter } from "next/navigation";

export function BackButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="px-3 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium shadow border border-gray-300 mr-3"
      aria-label="Go back"
    >
      ← Back
    </button>
  );
}
