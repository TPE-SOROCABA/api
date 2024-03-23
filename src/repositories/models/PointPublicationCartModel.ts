import { Schema, model } from "mongoose";

export interface IPointPublicationCart {
    _id: string;
    pointId: string; // fk PointModel
    publicationCartIds: string[]; // fk PublicationCartModel
    minParticipants: number;
    maxParticipants: number;
    status: boolean;
}

const pointPublicationCartSchema = new Schema<IPointPublicationCart>({
    pointId: { type: String, required: true, ref: "points" },
    publicationCartIds: [{ type: String, required: true, ref: "publicationcarts" }],
    minParticipants: { type: Number, required: true },
    maxParticipants: { type: Number, required: true },
    status: { type: Boolean, required: true }
});

export const PointPublicationCartModel = model<IPointPublicationCart>("pointpublicationcarts", pointPublicationCartSchema);
