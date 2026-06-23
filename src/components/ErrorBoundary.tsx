import { Component, type ReactNode } from "react";
import { AlertOctagon } from "lucide-react";

interface Props {
  children: ReactNode;
}
interface State {
  error: Error | null;
}

/** Catches render errors so a single bad screen doesn't blank the whole app. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    // In production this is where you'd forward to an error reporter.
    console.error("Render error:", error);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-screen flex-col items-center justify-center gap-4 bg-base-bg p-6 text-center">
          <div className="rounded-xl bg-status-critical/10 p-3 ring-1 ring-status-critical/30">
            <AlertOctagon className="h-7 w-7 text-status-critical" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Something went wrong</h1>
            <p className="mt-1 max-w-md text-sm text-gray-500">
              An unexpected error occurred while rendering this screen.
            </p>
            <p className="mt-2 font-mono text-xs text-gray-600">
              {this.state.error.message}
            </p>
          </div>
          <button
            onClick={() => {
              this.setState({ error: null });
              location.assign("/");
            }}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-[#0f172a] hover:bg-accent/90"
          >
            Reload app
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
