import { Schema, model } from "mongoose";

export interface IPublicationCart {
    _id: string;
    name: string;
    description: string;
    themePhoto: string;
}

export const publicationCartSchema = new Schema<IPublicationCart>({
    name: { type: String, required: true },
    description: { type: String, required: true },
    themePhoto: { type: String, required: true },
});

export const PublicationCartModel = model<IPublicationCart>("publicationcarts", publicationCartSchema);
