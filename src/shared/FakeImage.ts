export const FakeImage = (participant: { profile_photo: string | null; name: string }) => {
  if (!participant.profile_photo) {
    participant.profile_photo = `https://ui-avatars.com/api/?name=${participant.name}&background=2d3477&color=fff`;
  }

  return participant;
};
