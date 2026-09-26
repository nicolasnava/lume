# Lumê — preços fixos e ativação de planos após pagamento

**Status:** proposta para validação da responsável pelo produto

**Escopo:** catálogo de preços, troca de plano, cobrança e configuração Supabase. Não configura o Asaas nem altera o banco remoto.

## Objetivo

Manter os valores comerciais do Lumê consistentes entre a landing page, `/precos`, painel administrativo, faturas e métricas; impedir que a assinatura mude antes da confirmação confiável do pagamento; e preparar a integração futura com o Asaas sem simular cobranças.

## Regras de negócio confirmadas

1. Os valores apresentados na seção de preços da landing page são a referência comercial.
2. A mensalidade não recebe desconto. O valor anual é cobrado integralmente no momento da contratação ou migração para anual.
3. Uma solicitação de troca não altera o plano ativo. A alteração só ocorre depois de o pagamento correspondente ser aprovado por uma fonte confiável.
4. Pagamento pendente, recusado, cancelado ou expirado mantém plano, valor e vencimento ativos sem alteração.
5. Migrar de um plano mensal ativo para o anual é uma nova contratação pelo valor anual integral: não há crédito, abatimento ou reembolso proporcional pelo período mensal já pago. O ciclo anual de 12 meses começa quando seu pagamento for aprovado; o plano mensal permanece ativo até essa aprovação e não gera novas cobranças mensais depois dela.
6. Enquanto o Asaas não estiver configurado, o sistema não deve fingir que recebeu um pagamento nem apresentar Pix/QR fictício.

## Catálogo de referência

| Plano | Cobrança mensal | Cobrança anual | Equivalente mensal no anual |
|---|---:|---:|---:|
| Profissional autônoma | R$ 69,90 | R$ 694,80 | R$ 57,90 |
| Studio | R$ 169,00 | R$ 1.668,00 | R$ 139,00 |

O anual corresponde a 12 cobranças pelo equivalente mensal exibido. Não há desconto aplicado à cobrança mensal. Os valores precisam ser armazenados e calculados em centavos inteiros, nunca em ponto flutuante.

## Proposta de funcionamento

### Fonte única dos preços

- Manter uma única fonte canônica do catálogo, com identificador do plano, intervalo (`mensal` ou `anual`), valor cobrado no ciclo e equivalente mensal para apresentação/relatórios.
- Landing page, `/precos`, checkout, faturas e painel leem esse catálogo; remover valores anuais duplicados em componentes e valores editáveis no painel.
- O painel administrativo pode consultar o catálogo, mas não mudar os valores fixos. Alterações futuras de preço devem ocorrer por mudança revisada de código/migration e devem afetar apenas novas contratações, salvo decisão explícita em contrário.
- O catálogo deve validar que o preço anual é exatamente o valor anual aprovado e que o equivalente mensal é apenas informativo; a cobrança usa o total anual.

### Solicitação e confirmação de pagamento

1. Ao escolher outro plano/ciclo, o servidor valida a sessão e cria uma solicitação pendente vinculada à conta, ao plano-alvo, ao preço vigente e ao período de cobrança.
2. A solicitação gera uma cobrança pelo valor integral do ciclo escolhido. Na migração mensal → anual, não desconta nem devolve o saldo do mês em curso. A tela mostra o plano atual como ativo e o plano-alvo como aguardando pagamento.
3. Somente uma confirmação autenticada do provedor (futuro Asaas), validada no servidor, pode aprovar a cobrança. A confirmação deve ser idempotente: notificações repetidas não duplicam faturas, períodos nem ativações.
4. Após confirmação aprovada, uma única transação marca a cobrança como paga e atualiza plano, ciclo, valor mensal equivalente para MRR e datas do período. No anual, o período de 12 meses inicia na aprovação. Guardar referência do evento/provedor para auditoria.
5. Em estados não aprovados, a assinatura atual permanece intacta. A tentativa pendente pode ser encerrada sem afetar o histórico.
6. Nenhum estado recebido do navegador é suficiente para ativar plano. A tela não pode atualizar a assinatura de forma otimista.

### Cupons, indicações e painel administrativo

- Cupons percentuais/fixos e indicações não podem alterar o preço mensal nem o preço do catálogo. A indicação pode continuar registrando atribuição, mas não pode recalcular ou gravar `valor_mensalidade`.
- Uma extensão de teste grátis não reduz a mensalidade; sua permanência como benefício precisa continuar limitada a dias de teste e não pode gerar uma cobrança com desconto.
- Remover ou desabilitar ações administrativas que alteram preço-base ou mensalidade individual; manter trilha de auditoria para mudanças operacionais permitidas.
- O valor usado em MRR é o equivalente mensal do ciclo ativo. O valor de uma fatura anual continua sendo o total anual efetivamente cobrado.

## Preparação do Asaas

O Asaas ainda não foi configurado. Portanto, não habilitar checkout anual/migração que dependa de pagamento real até existirem credenciais de servidor, webhook HTTPS validado e ambiente de teste aprovado. Não colocar segredo no cliente ou no repositório. Até lá, apresentar estado indisponível/“pagamento não configurado”, sem código Pix inventado. Não deve haver confirmação manual silenciosa que contorne a aprovação do pagamento.

## Requisitos Supabase e implantação

- Restringir escritas de preço e ativação a funções/ações confiáveis no servidor; aplicar RLS e privilégios mínimos às tabelas e RPCs envolvidas.
- Funções `SECURITY DEFINER` devem usar `search_path` vazio/fixo, validar entradas, e ter `EXECUTE` concedido apenas aos papéis necessários.
- A RPC de indicação não pode aceitar um ID arbitrário para mudar cobrança de outra profissional. A busca privada de profissional por e-mail não deve ser executável por `anon`/`authenticated`.
- Há migrations locais até `00049`, mas a listagem de histórico remoto consultada apareceu vazia. Não aplicar uma migration isolada nem fazer `db push` até reconciliar e validar o baseline completo, dependências e ambiente-alvo.
- Conferir dependências antes de alterar views/policies públicas; avisos de RLS/indexes não justificam mudanças em massa sem validar acesso legítimo da aplicação.

## Critérios de aceite e testes automatizados

1. Os quatro locais de exibição apresentam os mesmos valores; os valores do anual totalizam exatamente 12 vezes o equivalente mensal.
2. Nenhuma mutação administrativa, indicação, cupom ou chamada direta do cliente altera o preço fixo.
3. Solicitar migração mensal → anual cria cobrança pelo total anual, mas deixa assinatura e vencimento inalterados enquanto pendente.
4. Aprovação do provedor ativa o ciclo e o plano uma única vez; webhook duplicado é inofensivo.
5. Recusa, cancelamento, expiração ou erro de webhook não ativa o plano nem altera a cobrança vigente.
6. Tentar aprovar pela UI, por payload forjado ou como papel sem privilégio falha sem efeitos colaterais.
7. Ausência de configuração do provedor não gera Pix/QR fictício nem marca pagamento como aprovado.
8. Relatórios usam o equivalente mensal no MRR, e faturas mantêm o valor efetivamente cobrado no ciclo.
9. Cobranças antigas e valores históricos não são reescritos pela migration; qualquer correção de registros legados é uma tarefa separada, com reconciliação e backup.

## Decisões ainda necessárias

1. Cupons de dias de teste devem continuar existindo, desde que não reduzam valores cobrados, ou devem ser removidos junto dos cupons financeiros?
2. Até configurar o Asaas, a troca de ciclo anual deve ficar indisponível (proposta recomendada), ou você deseja um fluxo alternativo de cobrança manual com comprovação e auditoria?

## Limites desta proposta

Esta especificação não integra o Asaas, não aplica migrations no Supabase remoto, não corrige em massa dados legados e não define política de reembolso/cancelamento. Depois da validação destas decisões, o próximo passo é um plano de implementação com revisão das migrations e testes antes de qualquer implantação.
