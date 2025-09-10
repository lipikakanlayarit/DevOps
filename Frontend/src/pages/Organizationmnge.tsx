import { useState } from "react";
import { Plus } from "lucide-react";
import SearchBar from "@/components/SearchBar";
import Footer from "@/components/Footer";
import Ordertoggle from "@/components/OrderToggle"; 

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen flex flex-col">
      {/* Order Toggle Section */}
      <Ordertoggle />
      
      {/* Search Section */}
      <div className="bg-white px-6 py-4 border-b">
        <SearchBar 
          value={searchQuery} 
          onChange={setSearchQuery}
          placeholder="Search events..."
        />
      </div>

      <main className="flex-1 bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <button className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-full text-lg font-medium inline-flex items-center transition-colors duration-200">
            <Plus className="h-5 w-5 mr-2" />
            Create Event
          </button>
        </div>
      </main>

      {/* Footer Section */}
      <Footer />
    </div>
  );
}