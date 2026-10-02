import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  children: ReactNode;
  title?: string;
  description?: string;
  compact?: boolean;
  resetKey?: string;
  onBack?: () => void;
};
type State = { error: Error | null };

/**
 * Catches render errors so a single broken section never blanks the whole app.
 * Wrap pages (or individual dashboard panels) with this.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught", error, info.componentStack);
  }

  componentDidUpdate(previous: Props) {
    if (this.state.error && previous.resetKey !== this.props.resetKey) this.reset();
  }

  reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div
        role="alert"
        className={`rounded-2xl border border-destructive/30 bg-destructive/5 text-center ${this.props.compact ? "p-6" : "p-10"}`}
      >
        <AlertTriangle className="mx-auto size-8 text-destructive" />
        <h2 className="mt-3 font-display text-lg font-bold">{this.props.title ?? "Something went wrong"}</h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
          {this.props.description ?? "This section could not be displayed. Try it again, or reload the page if the problem continues."}
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Button size="sm" variant="outline" onClick={this.reset}>
            <RotateCw className="size-4" /> Try again
          </Button>
          {this.props.onBack && <Button size="sm" variant="outline" onClick={this.props.onBack}>Back to dashboard</Button>}
          <Button size="sm" onClick={() => window.location.reload()}>Reload page</Button>
        </div>
        <details className="mx-auto mt-5 max-w-xl text-left text-xs text-muted-foreground">
          <summary className="cursor-pointer text-center font-medium">Technical details</summary>
          <pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap rounded-lg bg-muted p-3 font-mono">
            {error.message || "No technical details were provided."}
          </pre>
        </details>
      </div>
    );
  }
}
