import React from 'react';
import './ErrorBoundary.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({ error });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-container">
            <h2>Something went wrong</h2>
            <p>We're sorry, but something unexpected happened.</p>
            <div className="error-details">
              <h3>Error Details:</h3>
              <p>{this.state.error?.message || 'Unknown error occurred'}</p>
              {this.state.error?.stack && (
                <details>
                  <summary>Technical Details</summary>
                  <pre>{this.state.error.stack}</pre>
                </details>
              )}
            </div>
            <button 
              onClick={() => window.location.reload()} 
              className="retry-btn"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
