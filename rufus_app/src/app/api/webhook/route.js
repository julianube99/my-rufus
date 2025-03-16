export async function POST(request) {
  try {
    const body = await request.json();
    console.log('Sending to webhook:', body);

    const response = await fetch('https://pulpo.website/webhook/hook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: body.message
      })
    });

    const data = await response.text();
    console.log('Webhook response:', data);

    return new Response(data, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Error al procesar la solicitud' }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}
