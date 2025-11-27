// import "./globals.css";
// import type { ReactNode } from "react";
// import { Providers } from "../store/store";

// export const metadata = {
//   title: "Team Chat",
//   description: "Real-time team chat app"
// };

// export default function RootLayout({ children }: { children: ReactNode }) {
//   return (
//     <html lang="en">
//       <body className="h-screen w-screen bg-gray-100">
//         <Providers>{children}</Providers>
//       </body>
//     </html>
//   );
// }


// frontend/src/app/layout.tsx
"use client";

import { ReactNode } from "react";
import { Provider } from "react-redux";
import { store } from "../store/store";
import "./globals.css";
import AuthProvider from "../components/providers/AuthProvider";
import { SocketProvider } from "../lib/socketClient";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Provider store={store}>
          <AuthProvider>
            <SocketProvider>
              {children}
            </SocketProvider>
          </AuthProvider>
        </Provider>
      </body>
    </html>
  );
}
