export interface IGroupModel {
    designation_template: {
      name: string;
      point_publication_carts: Array<{
        pointId: string;
        publicationCartIds: string[];
        minParticipants: number;
        maxParticipants: number;
      }>;
    };
  }