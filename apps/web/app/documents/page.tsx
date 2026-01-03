import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Document Intelligence - BuildFlow Pro",
  description: "OCR, classify, and extract structured data from documents with human-in-the-loop review",
};

// Ensure this page is statically generated
export const dynamic = 'force-static';

export default function DocumentsPage() {
  return (
    <div className="min-h-screen-safe bg-slate-950 text-slate-100 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Document Intelligence</h1>
        <p className="text-slate-400 mb-6">
          OCR, classify, and extract structured data from documents with human-in-the-loop review.
        </p>
        <div className="card p-6">
          <p className="text-slate-300">
            Document Intelligence is coming soon. This feature will provide OCR and AI-powered document processing with review workflows.
          </p>
        </div>
      </div>
    </div>
  );
}

