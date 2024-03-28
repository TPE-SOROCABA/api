# 19/03/2024

[] Criar schemas
    [x] Evento
    [] Grupo
    [] Pontos
    [] Carrinhos
[] Fazer Seed no banco
[] Criar endpoint de listagem
[] Criar repositorio que monta a model
[] Refatorar
[] Criar teste de integração


```js
const group = await GroupModel.findOne({
      _id: groupId,
    }).populate({
      path: "participantIds",
      match: filter,
      model: ParticipantModel,
      foreignField: "_id",
    });
```