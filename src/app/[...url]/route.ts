import { NextRequest, NextResponse } from "next/server";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ url: string[] }> | { url: string[] } }
) {
    try {
        // Await params if it's a Promise (Next.js 15+)
        const resolvedParams = params instanceof Promise ? await params : params;

        // Check if url exists and is an array
        if (!resolvedParams?.url || !Array.isArray(resolvedParams.url)) {
            return NextResponse.json(
                { success: false, message: "Invalid URL path" },
                { status: 400 }
            );
        }

        // Join all path segments to reconstruct the URL
        const urlPath = resolvedParams.url.join("/");

        // Fix common URL issues (e.g., "https:/" -> "https://")
        let reconstructedUrl = urlPath.replace(/^https:\//, "https://").replace(/^http:\//, "http://");

        // If it doesn't start with http:// or https://, add https://
        if (!reconstructedUrl.match(/^https?:\/\//)) {
            reconstructedUrl = `https://${reconstructedUrl}`;
        }

        // Validate that it's a proper URL
        try {
            new URL(reconstructedUrl);
        } catch {
            return NextResponse.json(
                { success: false, message: "Invalid URL format" },
                { status: 400 }
            );
        }

        // Redirect to the main page with the URL as a query parameter
        const redirectUrl = new URL("/", request.url);
        redirectUrl.searchParams.set("url", reconstructedUrl);

        return NextResponse.redirect(redirectUrl);
    } catch (error) {
        console.error("Error processing URL from path:", error);
        return NextResponse.json(
            {
                success: false,
                message: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}

