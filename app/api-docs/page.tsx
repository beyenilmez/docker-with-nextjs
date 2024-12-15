import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function ApiDocs() {
  return (
    <div className="container mx-auto py-12">
      <h1 className="text-4xl font-bold mb-8">API Documentation</h1>
      <p className="text-lg mb-8">
        This API allows you to interact with characters, quotes, and images from the "Kurtlar Vadisi" series. Below are
        the available endpoints with detailed usage instructions and examples.
      </p>
      <Separator className="my-6" />

      {/* Endpoint: Fetch Character by ID */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>1. Fetch Character by ID</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Retrieve detailed information about a specific character by their unique ID.</p>
          <h3 className="font-semibold mt-4">Endpoint:</h3>
          <pre className="p-4 bg-muted rounded">GET /api/person/[person_id]</pre>
          <h3 className="font-semibold mt-4">Parameters:</h3>
          <ul className="list-disc list-inside">
            <li>
              <b>type</b> (string, optional): Controls the response format. Options:
              <ul className="list-disc list-inside ml-6">
                <li>
                  <b>default</b>: Includes all character details, quotes, and images.
                </li>
                <li>
                  <b>quote</b>: Only quotes.
                </li>
                <li>
                  <b>image</b>: Only images.
                </li>
                <li>
                  <b>combo</b>: Combines quotes and images.
                </li>
              </ul>
            </li>
            <li>
              <b>count</b> (number, optional): Number of quotes or images to fetch. Default is <code>1</code>.
            </li>
            <li>
              <b>quote_query</b> (string, optional): Filter quotes by a specific keyword.
            </li>
            <li>
              <b>include_quotes</b> (boolean, optional): Whether to include quotes. Default is <code>true</code>.
            </li>
            <li>
              <b>include_images</b> (boolean, optional): Whether to include images. Default is <code>true</code>.
            </li>
          </ul>
          <h3 className="font-semibold mt-4">Example:</h3>
          <pre className="p-4 bg-muted rounded">GET /api/person/abdulhey-coban?type=default&count=2</pre>
          <h3 className="font-semibold mt-4">Example Response:</h3>
          <pre className="p-4 bg-muted rounded">
            {`{
  "id": "abdulhey-coban",
  "name": "Abdülhey Çoban",
  "quotes": ["Sadakat her şeyden önce gelir.", "Bize ihanet edenin yeri bellidir."],
  "images": ["/abdulhey-coban/images/img1.jpg", "/abdulhey-coban/images/img2.jpg"]
}`}
          </pre>
        </CardContent>
      </Card>

      <Separator className="my-6" />

      {/* Endpoint: Fetch All Characters */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>2. Fetch All Characters</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Retrieve details about all available characters.</p>
          <h3 className="font-semibold mt-4">Endpoint:</h3>
          <pre className="p-4 bg-muted rounded">GET /api/person/all</pre>
          <h3 className="font-semibold mt-4">Parameters:</h3>
          <ul className="list-disc list-inside">
            <li>
              <b>quote_query</b> (string, optional): Filter characters whose quotes match the given keyword.
            </li>
          </ul>
          <h3 className="font-semibold mt-4">Example:</h3>
          <pre className="p-4 bg-muted rounded">GET /api/person/all?quote_query=sadakat</pre>
          <h3 className="font-semibold mt-4">Example Response:</h3>
          <pre className="p-4 bg-muted rounded">
            {`[
  {
    "id": "abdulhey-coban",
    "name": "Abdülhey Çoban",
    "totalQuotes": 2,
    "totalImages": 3
  },
  {
    "id": "suleyman-cakir",
    "name": "Süleyman Çakır",
    "totalQuotes": 5,
    "totalImages": 4
  }
]`}
          </pre>
        </CardContent>
      </Card>

      <Separator className="my-6" />

      {/* Endpoint: Fetch Random Character */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>3. Fetch Random Character</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Retrieve details about a randomly selected character.</p>
          <h3 className="font-semibold mt-4">Endpoint:</h3>
          <pre className="p-4 bg-muted rounded">GET /api/person/random</pre>
          <h3 className="font-semibold mt-4">Parameters:</h3>
          <ul className="list-disc list-inside">
            <li>
              <b>quote_query</b> (string, optional): Filter the random character by quotes matching the given keyword.
            </li>
          </ul>
          <h3 className="font-semibold mt-4">Example:</h3>
          <pre className="p-4 bg-muted rounded">GET /api/person/random?quote_query=ihanet</pre>
          <h3 className="font-semibold mt-4">Example Response:</h3>
          <pre className="p-4 bg-muted rounded">
            {`{
  "id": "suleyman-cakir",
  "name": "Süleyman Çakır",
  "quotes": ["İhanet edenin yeri mezardır."]
}`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
