import { Schema, model } from "mongoose";

export interface IPoint {
    _id: string;
    name: string;
    locationPhoto: string;
}

export const pointSchema = new Schema<IPoint>({
    name: { type: String, required: true },
    locationPhoto: { type: String, required: true },
});

export const PointModel = model<IPoint>("points", pointSchema);
