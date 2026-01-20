# Documentação de Diagramas - RAF Mapa Produção App

## 📋 Arquivos Disponíveis

### 1. `casos-de-uso.puml` (PlantUML)
**Formato:** PlantUML  
**Uso:** Visualizado com editores PlantUML (NÃO importa diretamente no draw.io)

**Como usar:**
- **Online:** Acesse [PlantUML Online](http://www.plantuml.com/plantuml/uml/) e cole o conteúdo
- **VS Code:** Instale a extensão "PlantUML" e visualize diretamente
- **IntelliJ/WebStorm:** Suporte nativo ao PlantUML
- **⚠️ IMPORTANTE:** O draw.io NÃO importa arquivos PlantUML diretamente. Use o arquivo XML abaixo.

### 2. `casos-de-uso-drawio.xml` (Draw.io Nativo)
**Formato:** XML do draw.io  
**Uso:** Importação direta no draw.io (formato nativo)

**Como usar:**
- Acesse [draw.io](https://app.diagrams.net/)
- File → Open from → Device → Selecionar arquivo `.xml`
- O diagrama será carregado completamente editável

## 🎯 Estrutura do Diagrama

O diagrama está organizado em **pacotes funcionais**:

1. **Autenticação e Autorização** (6 casos de uso)
2. **Dashboard e Análises** (10 casos de uso)
3. **Gestão de Templates** (10 casos de uso)
4. **Gestão de Formulários** (14 casos de uso)
5. **Gestão de Perguntas e Categorias** (10 casos de uso)
6. **MySabichão - Chat com IA** (11 casos de uso)
7. **Painel Administrativo** (14 casos de uso)

## 👥 Atores Identificados

- **Usuário**: Acesso básico ao sistema
- **Administrador**: Acesso completo + funcionalidades administrativas
- **Sistema Clerk**: Autenticação externa
- **Sistema IA (OpenAI)**: Processamento de chat e RAG

## 📊 Estatísticas

- **Total de Casos de Uso:** 92
- **Atores:** 4
- **Pacotes Funcionais:** 7

## 🔧 Edição e Customização

### No draw.io:
1. Importe o arquivo XML
2. Use a barra de ferramentas para adicionar/remover elementos
3. Personalize cores, formas e layout
4. Exporte em PNG, SVG, PDF, etc.

### No PlantUML:
1. Edite o arquivo `.puml` em qualquer editor de texto
2. Adicione novos casos de uso seguindo o padrão:
   ```
   usecase "UC-XXX: Nome do Caso de Uso" as UCXXX
   ```
3. Adicione relações:
   ```
   Usuario --> UCXXX
   ```

## 📝 Convenções Utilizadas

- **UC-XXX**: Identificador único do caso de uso
- **Pacotes**: Agrupam casos de uso relacionados
- **Cores**: Diferentes cores por pacote para melhor visualização
- **Relações**: Setas indicam quais atores podem executar cada caso de uso

## 🚀 Próximos Passos

Para expandir a documentação, considere criar:

1. **Diagrama de Sequência**: Para fluxos complexos (ex: submissão de formulário)
2. **Diagrama de Classes**: Modelos de dados do sistema
3. **Diagrama de Componentes**: Arquitetura do sistema
4. **Diagrama de Atividades**: Processos de negócio

## 📚 Referências

- [PlantUML Documentation](https://plantuml.com/)
- [Draw.io Documentation](https://www.diagrams.net/doc/)
- [UML Use Case Diagrams](https://www.uml-diagrams.org/use-case-diagrams.html)
