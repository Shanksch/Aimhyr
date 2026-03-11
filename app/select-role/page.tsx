import { AuthGuard } from "@/components/auth-guard"
import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RoleSelect } from "@/components/role-select"

export default function SelectRolePage() {
  return (
    <AuthGuard>
      <AppHeader />
      <main className="mx-auto max-w-4xl px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-balance">Select Role & Difficulty</CardTitle>
            <CardDescription>Pick the role you’re interviewing for and your desired difficulty.</CardDescription>
          </CardHeader>
          <CardContent>
            <RoleSelect />
          </CardContent>
        </Card>
      </main>
    </AuthGuard>
  )
}
