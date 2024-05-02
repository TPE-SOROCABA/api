import type { Context, APIGatewayProxyStructuredResultV2, Handler, APIGatewayProxyEvent } from "aws-lambda";
import { ResponseHandler } from "../../shared/ResponseHandler";
import { prisma } from "../../infra/prismaClient";
import { parseFormData } from "shared/ParseFormData";
import AWS from "aws-sdk";

const s3 = new AWS.S3();

export const handler: Handler = async (_event: APIGatewayProxyEvent, _context: Context): Promise<APIGatewayProxyStructuredResultV2> => {
  const responseHandler = new ResponseHandler(_event);
  try {
    const participantId = _event.pathParameters?.participantId;
    const { file } = await parseFormData(_event);

    if (!file) {
      return responseHandler.error("File is required");
    }

    if (!participantId) {
      return responseHandler.error("Group id is required");
    }

    const participant = await prisma.participants.findUnique({
      where: {
        id: participantId,
      },
    });

    if (!participant) {
      return responseHandler.error("Participant not found");
    }

    const extension = (file.filename as any).filename.split(".")[1];
    const params: AWS.S3.PutObjectRequest = {
      Bucket: "participants-photo", // "participants-photo
      Key: participantId + "." + extension,
      Body: file.content,
      ContentType: file.contentType,
      ACL: "public-read",
    };

    await s3.putObject(params).promise();

    const url = `https://participants-photo.s3.amazonaws.com/${params.Key}`;

    const data = await prisma.participants.update({
      where: {
        id: participantId,
      },
      data: {
        profile_photo: url,
      },
    });

    return responseHandler.success(data);
  } catch (error) {
    return responseHandler.error(error);
  }
};
