import { createContext, useEffect, useState } from "react";
import { requestForToken, setupOnMessageListener } from "../../lib/firebase";
import { useRegisterFCMToken } from "../hooks/api/useNotifications";
import { useAuth } from "../auth/AuthContext";
import { toast } from "sonner";

export const PushNotificationContext = createContext(null);

export function PushNotificationProvider({ children }) {
  const { authed } = useAuth();
  const registerMutation = useRegisterFCMToken();
  const [fcmToken, setFcmToken] = useState(null);

  useEffect(() => {
    if (authed) {
      const vapidKey = "BIHz3LBDlBw4S6eMCiudYbNUVQGVqIU58bKhkxNuMYeAthvzD_j5dzpeLnLXvNRnozngzSPWP0PmNZxwEv7Ma0Q";
      
      if (vapidKey && vapidKey.trim() !== "") {
        requestForToken(vapidKey).then((token) => {
          if (token) {
            setFcmToken(token);
            
            // Get or generate a persistent deviceId
            let deviceId = localStorage.getItem("mashena_device_id");
            if (!deviceId) {
              deviceId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
              localStorage.setItem("mashena_device_id", deviceId);
            }

            const payload = {
              token,
              platform: "web",
              deviceId,
            };

            registerMutation.mutate(payload, {
              onError: (err) => console.error("Failed to register FCM token to backend", err)
            });
          }
        });

        // Listen for foreground messages
        setupOnMessageListener((payload) => {
          console.log("Foreground notification received:", payload);
          toast.info(payload.notification?.title || "New Notification", {
            description: payload.notification?.body,
          });
        });
      } else {
        console.warn("FCM Notifications disabled: Missing VAPID Key. Please update PushNotificationContext.jsx");
      }
    }
  }, [authed]);

  return (
    <PushNotificationContext.Provider value={{ fcmToken }}>
      {children}
    </PushNotificationContext.Provider>
  );
}
