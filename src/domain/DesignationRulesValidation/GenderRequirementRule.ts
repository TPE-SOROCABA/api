import { Assignments, Designation } from "domain/Designation";
import { ValidationPlugin } from "./ValidationPlugin";
import { BadRequestException } from "../../shared/Exception";

export class GenderRequirementRule implements ValidationPlugin {
  validate(designation: Designation): void {
    let count = 0;
    designation.assignments.forEach((assignment) => {
      if (!this.validateGenderAssignment(assignment)) {
        const message = `O ponto ${assignment.point.name} não pode ter 2 participantes de sexos diferentes`;
        assignment.error = message;
        count++;
      } else {
        assignment.error = "";
      }
    });
    if (count) throw new BadRequestException("O ponto não pode ter 2 participantes de sexos diferentes");
  }

  validateGenderAssignment(assignment: Assignments): boolean {
    const participantNames = assignment.participants.map((p) => p.name);
    const genders = assignment.participants.map((p) => p.sex);
    
    console.log(`Validando ponto ${assignment.point.name}: Participantes: [${participantNames.join(', ')}] - Sexos: [${genders.join(', ')}]`);
    
    if (genders.length === 2) {
      const sameGender = genders[0] === genders[1];
      
      if (!sameGender) {
        // Verifica se têm o mesmo sobrenome (exceção para casais)
        const hasSameLastName = this.checkSameLastName(participantNames[0], participantNames[1]);
        if (hasSameLastName) {
          console.log(`Resultado da validação: VÁLIDO - Gêneros diferentes mas mesmo sobrenome (casal): ${hasSameLastName}`);
          return true;
        }
      }
      
      console.log(`Resultado da validação: ${sameGender ? 'VÁLIDO' : 'INVÁLIDO'} - Mesmo sexo: ${sameGender}`);
      return sameGender;
    }

    console.log(`Resultado da validação: VÁLIDO - Menos de 2 participantes`);
    return true;
  }

  private checkSameLastName(name1: string, name2: string): boolean {
    const getNameParts = (fullName: string): string[] => {
      return fullName.trim().split(' ').map(part => part.toLowerCase()).filter(part => part.length > 0);
    };

    const nameParts1 = getNameParts(name1);
    const nameParts2 = getNameParts(name2);
    
    console.log(`Verificando nomes: "${name1}" vs "${name2}"`);
    console.log(`Partes do nome 1: [${nameParts1.join(', ')}]`);
    console.log(`Partes do nome 2: [${nameParts2.join(', ')}]`);
    
    // Verifica se há algum sobrenome em comum (ignorando preposições comuns)
    const prepositions = ['de', 'da', 'do', 'das', 'dos', 'e'];
    const filteredParts1 = nameParts1.filter(part => !prepositions.includes(part));
    const filteredParts2 = nameParts2.filter(part => !prepositions.includes(part));
    
    // Procura por sobrenomes comuns (excluindo o primeiro nome)
    const surnames1 = filteredParts1.slice(1); // Remove o primeiro nome
    const surnames2 = filteredParts2.slice(1); // Remove o primeiro nome
    
    const hasCommonSurname = surnames1.some(surname => surnames2.includes(surname));
    
    console.log(`Sobrenomes 1: [${surnames1.join(', ')}]`);
    console.log(`Sobrenomes 2: [${surnames2.join(', ')}]`);
    console.log(`Tem sobrenome em comum: ${hasCommonSurname}`);
    
    return hasCommonSurname;
  }
}
