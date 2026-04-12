// Global error handler for API requests
export const handleApiError = (error) => {
  if (error.response) {
    const status = error.response.status;
    const message = error.response.data?.message || error.message;
    
    switch (status) {
      case 404:
        return {
          title: "Page Not Found",
          message: "The requested resource was not found. Please check the URL and try again.",
          type: "warning"
        };
      case 401:
        return {
          title: "Unauthorized",
          message: "You are not authorized to access this resource. Please login again.",
          type: "error"
        };
      case 403:
        return {
          title: "Access Denied",
          message: "You don't have permission to access this resource.",
          type: "error"
        };
      case 500:
        return {
          title: "Server Error",
          message: "Something went wrong on our servers. Please try again later.",
          type: "error"
        };
      default:
        return {
          title: "Request Failed",
          message: message || "An unexpected error occurred. Please try again.",
          type: "error"
        };
    }
  } else if (error.request) {
    return {
      title: "Network Error",
      message: "Unable to connect to the server. Please check your internet connection.",
      type: "error"
    };
  } else {
    return {
      title: "Unknown Error",
      message: error.message || "An unexpected error occurred.",
      type: "error"
    };
  }
};

export const showErrorNotification = (error) => {
  const errorInfo = handleApiError(error);
  
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `error-notification ${errorInfo.type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <h4>${errorInfo.title}</h4>
      <p>${errorInfo.message}</p>
      <button onclick="this.parentElement.remove()">×</button>
    </div>
  `;
  
  // Add styles
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${errorInfo.type === 'error' ? '#dc3545' : '#ffc107'};
    color: white;
    padding: 15px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 9999;
    max-width: 400px;
    animation: slideIn 0.3s ease-out;
  `;
  
  document.body.appendChild(notification);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 5000);
};
