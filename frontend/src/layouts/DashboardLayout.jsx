import { Outlet } from "react-router-dom"
import Sidebar from "../components/dashboard/Sidebar"
import Header from "../components/dashboard/Header"

const DashboardLayout = () => {
  return (
    <div className="flex h-screen bg-[#0f0a1e] text-white overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout