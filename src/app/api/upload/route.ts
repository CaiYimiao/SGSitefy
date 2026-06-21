import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

// Streams a file to Vercel Blob and returns its public URL.
export async function POST(req: Request) {
  const filename = new URL(req.url).searchParams.get("filename");
  if (!filename) return NextResponse.json({ error: "filename required" }, { status: 400 });

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Uploads not configured. Set BLOB_READ_WRITE_TOKEN, or paste an image URL instead." },
      { status: 501 }
    );
  }
  if (!req.body) return NextResponse.json({ error: "no file body" }, { status: 400 });

  const blob = await put(filename, req.body, { access: "public", addRandomSuffix: true });
  return NextResponse.json({ url: blob.url });
}
