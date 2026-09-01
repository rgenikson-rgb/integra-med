export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary-600 to-secondary flex items-center justify-center p-4">
      {children}
    </div>
  )
}
