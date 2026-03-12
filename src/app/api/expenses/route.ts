import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, expense } = body;

    // For now, we're just validating the request
    // In a real app, you'd save to a database

    if (action === 'add' && expense) {
      return NextResponse.json({
        success: true,
        expense,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error processing expense:', error);
    return NextResponse.json(
      { error: 'Failed to process expense' },
      { status: 500 }
    );
  }
}
