import { NextRequest, NextResponse } from 'next/server';
import { parseCardWithGemini } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { frontImage, backImage, productImages, apiKey } = body;

    if (!frontImage) {
      return NextResponse.json({ error: 'Front image is required' }, { status: 400 });
    }

    // Process front image
    const frontMatches = frontImage.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
    let frontMime = 'image/jpeg';
    let frontBase64 = frontImage;

    if (frontMatches) {
      frontMime = frontMatches[1];
      frontBase64 = frontMatches[2];
    }

    // Optional back image
    let backMime = 'image/jpeg';
    let backBase64: string | undefined = undefined;

    if (backImage) {
      const backMatches = backImage.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
      if (backMatches) {
        backMime = backMatches[1];
        backBase64 = backMatches[2];
      } else {
        backBase64 = backImage;
      }
    }

    // Call Gemini multimodal OCR & categorization
    const parsedData = await parseCardWithGemini(
      {
        frontBase64,
        frontMime,
        backBase64,
        backMime,
        productImagesBase64: Array.isArray(productImages) ? productImages : undefined,
      },
      apiKey
    );

    // Return the base64 images directly for zero-filesystem serverless execution
    return NextResponse.json({
      success: true,
      data: parsedData,
      images: {
        front: frontImage,
        back: backImage || null,
        products: Array.isArray(productImages) ? productImages : [],
      },
    });
  } catch (error: any) {
    console.error('Card scan error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to scan visiting card',
      },
      { status: 500 }
    );
  }
}
