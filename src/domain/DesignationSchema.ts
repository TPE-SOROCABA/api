export interface Point {
    id: string;
    name: string;
    locationPhoto: string;
}

export interface PublicationCart {
    id: string;
    name: string;
    description: string;
    themePhoto: string;
}

export interface PointPublicationCart {
    id: string;
    pointId: string;
    publicationCartId: string;
    point: Point;
    publicationCart: PublicationCart[];
    minParticipants: number;
    maxParticipants: number;
    status: boolean;
}


export interface DesignationSchema {
    id: string;
    name: string;
    points: PointPublicationCart[];
}