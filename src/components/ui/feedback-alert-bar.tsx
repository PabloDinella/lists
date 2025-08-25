import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Container } from "./container";

export function FeedbackAlertBar() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Check localStorage on component mount
    const isDismissed = localStorage.getItem('feedback-alert-dismissed');
    if (isDismissed === 'true') {
      setIsVisible(false);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('feedback-alert-dismissed', 'true');
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
      <Container>
        <div className="flex items-center justify-center gap-2 py-3 text-center relative">
          <div className="flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-4">
            <div className="text-sm sm:text-base">
              <span className="opacity-90">
                We're in early testing! Help us improve by trying the app and
                sharing your feedback.
              </span>
              <a
                href="https://trylistsapp.featurebase.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 underline underline-offset-2 hover:no-underline"
              >
                Send feedback →
              </a>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="absolute right-0 p-1 rounded-full hover:bg-white/10 transition-colors"
            aria-label="Dismiss feedback alert"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </Container>
    </div>
  );
}
