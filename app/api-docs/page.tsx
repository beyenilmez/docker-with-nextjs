import Header from "../components/Header";
import Footer from "../components/Footer";

const ApiDocs = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow container mx-auto p-8">
        <h2 className="text-3xl font-bold mb-4">API Documentation</h2>
        <p>Below are the available API endpoints:</p>

        <div className="mt-4">
          <h3 className="text-2xl font-semibold">1. Fetch Character by ID</h3>
          <pre className="bg-gray-100 p-4 rounded">GET /api/person/[person_id]</pre>
          <p className="mt-2">Fetches the details, quotes, and images of a specific character.</p>
        </div>

        <div className="mt-4">
          <h3 className="text-2xl font-semibold">2. Fetch All Characters</h3>
          <pre className="bg-gray-100 p-4 rounded">GET /api/person/all</pre>
          <p className="mt-2">Returns data for all characters.</p>
        </div>

        <div className="mt-4">
          <h3 className="text-2xl font-semibold">3. Fetch Random Character</h3>
          <pre className="bg-gray-100 p-4 rounded">GET /api/person/random</pre>
          <p className="mt-2">Fetches data for a random character.</p>
        </div>

        <div className="mt-4">
          <h3 className="text-2xl font-semibold">4. Query for Quotes</h3>
          <pre className="bg-gray-100 p-4 rounded">GET /api/person/[person_id]?quote_query=keyword</pre>
          <p className="mt-2">Filters quotes based on a keyword.</p>
        </div>
      </main>
    </div>
  );
};

export default ApiDocs;
