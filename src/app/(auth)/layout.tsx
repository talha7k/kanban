
// Removed AuthProvider from here, it's now in the root layout.
// Toaster is also moved to root layout for global availability,
// but can be kept here if specific to auth pages only.
// For simplicity, assuming global Toaster in root layout is sufficient.

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // <AuthProvider> No longer needed here
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
        {children}
        {/* <Toaster /> Toaster is now in root layout */}
      </div>
    // </AuthProvider>
  );
}
