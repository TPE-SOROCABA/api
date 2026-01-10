import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { ZApiStatusService } from "../../../services/ZApiStatusService";
import { ResponseHandler } from "../../../shared/ResponseHandler";

const zApiStatusService = new ZApiStatusService();

export const handleConnected = async (_event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> => {
    const responseHandler = new ResponseHandler(_event);
    try {
        console.log("[WEBHOOK] Received Z-API Connected event");
        await zApiStatusService.setConnected();
        return responseHandler.success({ message: "System marked as CONNECTED" });
    } catch (error: any) {
        console.error("[WEBHOOK] Error handling connected event:", error);
        return responseHandler.error(error);
    }
};

export const handleDisconnected = async (_event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> => {
    const responseHandler = new ResponseHandler(_event);
    try {
        console.log("[WEBHOOK] Received Z-API Disconnected event");
        await zApiStatusService.setDisconnected();
        return responseHandler.success({ message: "System marked as DISCONNECTED" });
    } catch (error: any) {
        console.error("[WEBHOOK] Error handling disconnected event:", error);
        return responseHandler.error(error);
    }
};
