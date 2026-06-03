import { Component, ReactNode } from "react";

interface Props { children: ReactNode; }
interface State { error: Error | null; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: unknown) {
    console.error("[ErrorBoundary]", error, info);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-card border border-border rounded-2xl p-6 text-center">
            <div className="text-3xl mb-3">⚠️</div>
            <h1 className="text-foreground font-extrabold text-lg mb-2">Une erreur est survenue</h1>
            <p className="text-muted-foreground text-xs font-mono mb-4 break-words">
              {this.state.error.message}
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={this.reset}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-bold text-xs"
              >
                Réessayer
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-transparent border border-border text-foreground rounded-lg font-bold text-xs"
              >
                Recharger
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;