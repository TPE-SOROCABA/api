
export const handler = async (event: any, _context: any) => {

    const body = JSON.parse(event.body);

    console.log(`Received message: ${body}`);
    
    return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Message received'}),
    };
};