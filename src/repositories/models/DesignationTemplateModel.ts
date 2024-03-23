import mongoose, { Schema, Types, model } from "mongoose";
import { PointPublicationCartModel } from "./PointPublicationCartModel";

export interface IDesignationTemplate {
  _id: string;
  name: string;
  point_publication_carts: Array<Types.ObjectId> // fk PointPublicationCartModel
}

const designationTemplateSchema = new Schema<IDesignationTemplate>({
  name: { type: String, required: true },
  point_publication_carts: [{ type: mongoose.Schema.Types.ObjectId, required: true, ref: PointPublicationCartModel }],
});

export const DesignationTemplateModel = model<IDesignationTemplate>("designationtemplates", designationTemplateSchema);
