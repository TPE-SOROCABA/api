import { Schema, model } from "mongoose";
import { EventStatus } from "../../enums/EventStatus";
import { EventType } from "../../enums/EventType";
import { Weekday } from "../../enums/Weekday";

export interface IEventDay {
    _id: string;
    coordinator_id: string;
    name: string;
    description?: string;
    type: EventType;
    status: EventStatus;
    weekday: Weekday;
}

const eventSchema = new Schema<IEventDay>({
    coordinator_id: { type: String, required: true, ref: "participants" },
    name: { type: String, required: true },
    description: { type: String },
    type: { type: String, required: true, enum: Object.values(EventType) },
    status: { type: String, required: true, enum: Object.values(EventStatus) },
    weekday: { type: String, required: true, enum: Object.values(Weekday) },
});

export const EventDayModel = model<IEventDay>("eventdays", eventSchema);
