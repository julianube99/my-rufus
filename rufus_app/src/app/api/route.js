import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    console.log('Received request:', body);

    // Hacer la solicitud al webhook
    const webhookResponse = await fetch('https://pulpo.website/webhook/hook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: body.message
      }),
    });

    console.log('Webhook status:', webhookResponse.status);

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text();
      console.error('Webhook error:', errorText);
      return NextResponse.json({ error: 'Error al procesar la solicitud' }, { status: webhookResponse.status });
    }

    const data = await webhookResponse.json();
    console.log('Webhook success:', data);

    return NextResponse.json(data);

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
