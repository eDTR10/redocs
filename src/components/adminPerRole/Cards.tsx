import { Card, CardDescription, CardHeader, CardTitle } from "../ui/card";


function Cards() {
  return (
    <div className="min-h-full w-full flex flex-col justify-start items-center py-8">
      <div className="grid grid-cols-4 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">

        <div>
            <Card className="hover:shadow-md">
            <CardHeader>
                <CardTitle>Card Title</CardTitle>
                <CardDescription>Card Description</CardDescription>
            </CardHeader>
            </Card>
        </div>

        <div>
            <Card className="hover:shadow-md">
            <CardHeader>
                <CardTitle>Card Title</CardTitle>
                <CardDescription>Card Description</CardDescription>
            </CardHeader>
            </Card>
        </div>

        <div>
            <Card className="hover:shadow-md">
            <CardHeader>
                <CardTitle>Card Title</CardTitle>
                <CardDescription>Card Description</CardDescription>
            </CardHeader>
            </Card>
        </div>

        <div>
            <Card className="hover:shadow-md">
            <CardHeader>
                <CardTitle>Card Title</CardTitle>
                <CardDescription>Card Description</CardDescription>
            </CardHeader>
            </Card>
        </div>
      
      </div>
    </div>
  );
}

export default Cards;