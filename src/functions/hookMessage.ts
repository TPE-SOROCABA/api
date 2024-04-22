import { Z_APIWhatsAppAdapter } from "../infra/adapter/Z_APIWhatsAppAdapter";
import { WhatsAppService } from "../services/WhatsAppService";

const whatsaapService = new WhatsAppService(new Z_APIWhatsAppAdapter());
export const handler = async (event: any, _context: any) => {
  const body = JSON.parse(event.body);

  console.log(body);

  await whatsaapService
    .sendMessage({
      phone: "15981785706",
      message: JSON.stringify(body),
      title: "*TPE Digital - Message*",
      linkUrl: `${process.env.FRONTEND_URL}`,
      linkDescription: "teste hook",
    })
    .catch((error) => {
      console.error(error);
    });
  console.log(`Mensagem enviada com sucesso`);

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Message received" }),
  };
};
