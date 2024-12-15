import Header from "../components/Header";
import Footer from "../components/Footer";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow container mx-auto p-8">
        <h2 className="text-3xl font-bold mb-4">Welcome to Kurtlar Vadisi Fan Project</h2>
        <p className="text-lg">This project showcases iconic characters, quotes, and images from the beloved series.</p>
        <div className="mt-8">
          <h3 className="text-2xl font-bold">Features</h3>
          <ul className="list-disc pl-6 mt-2">
            <li>Explore character details</li>
            <li>Get random quotes and images</li>
            <li>API to fetch data</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
