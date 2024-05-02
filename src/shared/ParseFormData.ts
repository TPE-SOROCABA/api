import Busboy from "busboy";
import { APIGatewayProxyEvent } from "aws-lambda";

interface UploadedFile {
  filename: string;
  contentType: string;
  encoding: string;
  content: Buffer | string;
}

interface FormData {
  file?: UploadedFile;
  fields: Record<string, any>;
}

export const parseFormData = async (event: APIGatewayProxyEvent): Promise<FormData> =>
  new Promise((resolve, reject) => {
    const busboy = Busboy({
      headers: { "content-type": event.headers["Content-Type"] },
    });
    const fields: Record<string, any> = {};
    let uploadedFile: UploadedFile;

    // event listener for the form data
    //@ts-ignore
    busboy.on("file", (field, file, filename, encoding, contentType) => {
      let content = "";
      //@ts-ignore
      file.on("data", (data) => {
        // reads the file content in one chunk
        content = data;
      });

      file.on("error", reject);

      file.on("end", () => {
        uploadedFile = {
          filename,
          encoding,
          contentType,
          content,
        };
      });
    });

    busboy.on("field", (fieldName, value) => {
      fields[fieldName] = value;
    });

    busboy.on("error", reject);

    busboy.on("finish", () => {
      resolve({ file: uploadedFile, fields });
    });

    busboy.write(event.body || "", event.isBase64Encoded ? "base64" : "binary");
    busboy.end();
  });
