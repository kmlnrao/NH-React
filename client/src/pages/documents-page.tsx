import { Layout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Upload, Download, File } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DocumentsPage() {
  return (
    <Layout title="Documents">
      <div className="grid gap-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Compliance Documents</h1>
          <Button className="flex items-center">
            <Upload className="mr-2 h-4 w-4" />
            Upload Document
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Recent Documents */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Recent Documents</CardTitle>
              <CardDescription>Recently accessed compliance documents</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
                  <div className="flex items-center">
                    <File className="h-5 w-5 text-blue-500 mr-3" />
                    <div>
                      <p className="font-medium">Annual Compliance Report {new Date().getFullYear()}</p>
                      <p className="text-sm text-gray-500">PDF • Updated {i + 1} days ago</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Important Documents */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Important Documents</CardTitle>
              <CardDescription>Critical compliance documentation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-red-500 mr-3" />
                    <div>
                      <p className="font-medium">Regulatory Framework {i + 1}</p>
                      <p className="text-sm text-gray-500">PDF • Official Document</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Templates */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Document Templates</CardTitle>
              <CardDescription>Standard templates for compliance reports</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-green-500 mr-3" />
                    <div>
                      <p className="font-medium">Compliance Template {i + 1}</p>
                      <p className="text-sm text-gray-500">DOCX • Template</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* All Documents Section */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>All Documents</CardTitle>
            <CardDescription>Complete document repository for your organization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {[1, 2, 3, 4, 5].map((_, i) => (
                <div key={i} className="flex items-center justify-between py-4">
                  <div className="flex items-center">
                    <FileText className="h-6 w-6 text-gray-400 mr-4" />
                    <div>
                      <p className="font-medium">Compliance Document {i + 1}</p>
                      <p className="text-sm text-gray-500">Last updated: {new Date(Date.now() - i * 86400000).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}