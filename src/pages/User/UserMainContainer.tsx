import UserLayout from "@/components/layout/UserLayout"
import { DocumentTypeProvider } from "@/context/DocumentTypeContext"

function UserMainContainer() {
  return (
    <DocumentTypeProvider>
      <UserLayout />
    </DocumentTypeProvider>
  )
}

export default UserMainContainer