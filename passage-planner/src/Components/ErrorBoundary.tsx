import React from "react";

export class ErrorBoundary extends React.Component<{ children: React.JSX.Element }, { error: Error | null }> {
    constructor(props: { children: React.JSX.Element }) {
        super(props);
        this.state = { error: null };
    }

    static getDerivedStateFromError(error: Error) {
        return { error };
    }

    render() {
        if (this.state.error) {
            return (
                <div style={{ padding: "1em", color: "red" }}>
                    <h2>An error occurred:</h2>
                    <pre>{this.state.error.message}</pre>
                    <button onClick={() => this.setState({ error: null })}>Try Again</button>
                </div>
            );
        }

        return this.props.children;
    }
}