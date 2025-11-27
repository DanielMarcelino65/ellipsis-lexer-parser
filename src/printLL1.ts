import {
  runLL1,
  printFirstSets,
  printFollowSets,
  printParseTable,
} from './LL1parser';

// Você pode pegar o código fonte de um arquivo ou deixar hardcoded pra teste
const source = `
recipe soma(a, b) {
  put s = a + b;
  return s;
}
`;

try {
  const { first, follow, table } = runLL1(source);

  console.log('Programa aceito pelo analisador LL(1).');
  console.log();

  // Imprimir FIRST e FOLLOW bonitinho
  printFirstSets(first);
  printFollowSets(follow);

  // (Opcional) imprimir tabela LL(1) – pode ser muito grande, usa só em demo
  // printParseTable(table);
} catch (err) {
  console.error('Erro durante análise LL(1):');
  console.error(String(err));
}
