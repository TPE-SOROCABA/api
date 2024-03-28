import * as dotenv from 'dotenv';

dotenv.config();

export async function setupHandler(event: any, handler:Function): Promise<any> {
    return await handler(event, {} as any, () => {})
}