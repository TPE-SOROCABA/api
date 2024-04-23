import { Z_APIWhatsAppAdapter } from "../infra/adapter/Z_APIWhatsAppAdapter";
import { WhatsAppService } from "../services/WhatsAppService";
import axios from "axios";

const instruction = `Given the following messages, extract the information using the provided JSON schema. Based on the message, define whether the 'transaction' property is 'input' (in Portuguese) or 'output' and also define which type of category (in Portuguese) and also clean up the 'message' property, removing redundant content.`;
const schema = {
  type: "object",
  properties: {
    transaction: { type: "string" },
    value: { type: "string" },
    description: { type: "string" },
    establishment: { type: "string" },
    category: { type: "string" },
    message: { type: "string" },
  },
  required: ["description", "value", "establishment", "category", "transaction", "message"],
};

const whatsaapService = new WhatsAppService(new Z_APIWhatsAppAdapter());
export const handler = async (event: any, _context: any) => {
  const body = event.body as string;

  console.log(`Conteúdo da mensagem: ${body}`);
  const response = await axios.post<Response>(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${process.env.GEMINI_KEY}`, {
    contents: [
      {
        parts: [
          {
            text: `${instruction} \n\nMessage: ${body}\nJSON Schema: ${JSON.stringify(schema)}`,
          },
        ],
      },
    ],
    generationConfig: {
      response_mime_type: "application/json",
    },
  });

  console.log(`Resposta do serviço de IA: ${JSON.stringify(response.data)}`);

  await whatsaapService
    .sendMessage({
      phone: "15981785706",
      message: JSON.stringify(response.data.candidates.map((candidate) => candidate.content.parts.map((part) => JSON.parse(part.text)).join("\n")).join("\n"),null,2),
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

export interface Response {
  candidates: Candidate[];
}

export interface Candidate {
  content: Content;
  finishReason: string;
  index: number;
  safetyRatings: SafetyRating[];
}

export interface Content {
  parts: Part[];
  role: string;
}

export interface Part {
  text: string;
}

export interface SafetyRating {
  category: string;
  probability: string;
}

export interface Params {
  contents: Content[];
  generationConfig: GenerationConfig;
}

export interface Content {
  parts: Part[];
}

export interface Part {
  text: string;
}

export interface GenerationConfig {
  response_mime_type: string;
}