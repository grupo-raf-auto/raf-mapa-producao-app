# Document Fraud Scanner - Design

**Data**: 2026-01-27
**Objetivo**: Sistema de validação de documentos com dupla verificação (técnica + IA) para detectar fraudes, alterações e falsificações.

---

## 1. Visão Geral

Sistema integrado no backend Node.js que analisa PDFs e imagens para detectar:
- Páginas ocultas/removidas
- Edição de texto e valores
- Falsificação de assinaturas/carimbos
- Cópias de documentos com dados falsificados
- Metadata suspeita e alterações estruturais

**Abordagem**: Validação imediata (upload → análise em tempo real) com score e recomendação automática.

---

## 2. Arquitetura Global

```
Frontend (Upload)
    ↓
Node.js Backend (File Scanner Service)
    ├→ Validação Técnica (Local)
    │   ├ Análise de PDF (metadados, estrutura, páginas ocultas)
    │   ├ Análise de Imagem (exif, compressão, alterações)
    │   └ Extração de texto OCR
    │
    ├→ Validação IA (OpenAI Vision)
    │   ├ Análise de conteúdo e inconsistências
    │   ├ Detecção de assinaturas/carimbos falsificados
    │   └ Padrões de fraude
    │
    └→ Compilação de Score
        ├ Score técnico (0-100)
        ├ Score IA (0-100)
        └ Score final + detalhes → API Response
```

**Fluxo de Processamento:**
1. Upload de ficheiro (PDF/Imagem)
2. Validação técnica local (~500ms)
3. Extração de dados (OCR + texto/imagens)
4. Validação IA com OpenAI Vision (~2-5s)
5. Compilação de scores e flags
6. Resposta JSON com recomendação

---

## 3. Validação Técnica (Análise Local)

### Bibliotecas Utilizadas
- `pdf-parse` - Extração de texto, metadados, contagem de páginas
- `pdfjs-dist` - Análise profunda (páginas ocultas, estrutura)
- `sharp` - Análise de imagens (EXIF, compressão)
- `tesseract.js` - OCR para extração de texto

### Detecções para PDFs
- ✅ Páginas ocultas (deletadas mas na estrutura)
- ✅ Metadados suspeitos (datas de criação vs modificação)
- ✅ Compressão anormal (sinal de manipulação)
- ✅ Múltiplas versões embutidas (indício de edição)
- ✅ Fontes estranhas/suspeitas (tipicamente cópia/falsificação)
- ✅ Número de páginas anormais

### Detecções para Imagens
- ✅ EXIF data (datas, câmara, localização)
- ✅ Compressão JPEG (artefatos indicam re-compressão)
- ✅ Dimensões anormais (screenshot vs foto)
- ✅ Histórico de metadados

### Output da Validação Técnica
```json
{
  "scoreTecnico": 75,
  "flags": [
    {
      "tipo": "PAGINAS_OCULTAS",
      "severidade": "ALTA",
      "valor": 2
    },
    {
      "tipo": "METADATA_SUSPEITA",
      "severidade": "MEDIA",
      "valor": "data_modificacao > data_criacao"
    }
  ],
  "textoExtraido": "...",
  "tempoAnalise": "523ms"
}
```

---

## 4. Validação IA (OpenAI Vision)

### Utilização do OpenAI
- **Modelo**: `gpt-4o-mini` (já em uso) ou `gpt-4o` (mais preciso)
- **Capability**: Vision (multimodal - imagens + texto)
- **API Key**: Reutiliza chave existente (sem nova conta)

### Prompts para Análise
1. **Prompt 1**: Análise visual - inconsistências, assinaturas fake, alterações
2. **Prompt 2**: Comparação - texto extraído vs visual
3. **Prompt 3**: Risco geral (0-100) com justificação

### Input Estruturado
```json
{
  "tipoDocumento": "contrato_credito",
  "flagsTecnicas": [/* flags da validação técnica */],
  "textoExtraido": "...",
  "imagensPDF": [/* base64 images */],
  "pergunta": "Analisa fraude neste documento"
}
```

### Output da Validação IA
```json
{
  "scoreIA": 82,
  "riscoDetectado": [
    {
      "tipo": "ASSINATURA_FALSIFICADA",
      "confianca": 0.92,
      "justificacao": "A assinatura tem características não naturais..."
    },
    {
      "tipo": "TEXTO_ALTERADO",
      "confianca": 0.78,
      "justificacao": "Inconsistência entre valores nos campos..."
    }
  ],
  "recomendacao": "REJEITAR - Alto risco de fraude",
  "tempoAnalise": "3200ms"
}
```

---

## 5. Compilação de Score e Resposta

### Cálculo do Score Final
```
scoreTotal = (scoreTecnico × 0.35) + (scoreIA × 0.65)
```

**Ponderação**: IA é mais pesada (65%) porque detecta fraudes visuais/contextuais. Técnica (35%) é auxiliar.

### Níveis de Risco
- **90-100**: 🔴 **ALTO RISCO** → Rejeitar automaticamente
- **70-89**: 🟡 **MÉDIO-ALTO** → Requerer revisão humana
- **50-69**: 🟠 **MÉDIO** → Validar com dados adicionais
- **0-49**: 🟢 **BAIXO** → Aceitar com logs

### Tabela de Decisão
| Score | Ação | Workflow |
|-------|------|----------|
| 90+ | Rejeitar | Auto-reject + notificar admin |
| 70-89 | Fila de análise | Humano revê em Dashboard |
| 50-69 | Análise extra | Pedir documentos adicionais |
| 0-49 | Aceitar | Prosseguir com crédito |

### Resposta Final ao Frontend
```json
{
  "documentId": "doc-123",
  "scoreTotal": 78,
  "nivelRisco": "MEDIO_ALTO",
  "recomendacao": "REJEITAR_COM_REVISAO",
  "scores": {
    "tecnicoScore": 75,
    "iaScore": 82
  },
  "flagsCriticas": [
    {
      "fonte": "TECNICO",
      "tipo": "PAGINAS_OCULTAS",
      "severidade": "ALTA"
    },
    {
      "fonte": "IA",
      "tipo": "ASSINATURA_FALSIFICADA",
      "confianca": 0.92
    }
  ],
  "justificacao": "Detectadas potenciais páginas ocultas e assinatura falsificada. Requer análise manual.",
  "tempoTotalAnalise": "3800ms",
  "timestamp": "2026-01-27T10:30:00Z"
}
```

---

## 6. Integração no Projeto Node.js

### Estrutura de Ficheiros
```
backend/
├── src/
│   ├── services/
│   │   ├── documentScanner/
│   │   │   ├── index.ts (main service)
│   │   │   ├── technicalValidator.ts (análise local)
│   │   │   ├── aiValidator.ts (chamada OpenAI)
│   │   │   ├── scoreCompiler.ts (compilar resultados)
│   │   │   └── types.ts (interfaces)
│   │   └── fileHandler.ts (upload/armazenamento)
│   │
│   ├── routes/
│   │   └── documents.ts (POST /api/documents/scan)
│   │
│   └── utils/
│       ├── pdfAnalyzer.ts (pdf-parse, pdfjs-dist)
│       ├── imageAnalyzer.ts (sharp, tesseract.js)
│       └── openaiClient.ts (wrapper OpenAI API)
```

### Fluxo de API
```
POST /api/documents/scan
  ↓
Validar ficheiro (tipo, tamanho)
  ↓
Guardar temporário
  ↓
technicalValidator.analyze() → flags técnicas
  ↓
Extrair imagens/texto do PDF
  ↓
aiValidator.analyze(texto, imagens, flags) → análise IA
  ↓
scoreCompiler.compile() → scoreTotal + recomendação
  ↓
Guardar resultado em BD (Prisma)
  ↓
Return JSON com resultado
  ↓
Limpar ficheiro temporário
```

### Schema Prisma
```prisma
model DocumentScan {
  id        String   @id @default(cuid())
  fileName  String
  fileType  String   // "pdf" | "image"
  fileSize  Int

  scoreTotal      Int
  riskLevel       String  // "ALTO_RISCO" | "MEDIO_ALTO" | etc
  recommendation  String

  technicalScore  Int
  iaScore         Int

  flags           Json[]  // array de flags
  justification   String

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relacionar com user/aplicação crédito
  userId          String
  user            User @relation(fields: [userId], references: [id])
}
```

### Dependências
```bash
npm install pdf-parse pdfjs-dist sharp tesseract.js openai dotenv
npm install --save-dev @types/pdf-parse @types/sharp
```

### Configuração .env
```
OPENAI_API_KEY=sk-...
MAX_FILE_SIZE=50000000  # 50MB
TEMP_DIR=./uploads/temp
```

---

## 7. Benefícios da Abordagem

✅ **Dupla Validação** - Reduz falsos positivos/negativos
✅ **Transparência** - Utilizador vê ambos os scores
✅ **Explicável** - IA justifica cada decisão
✅ **Escalável** - Fácil adicionar técnicas futuras
✅ **Rentável** - OpenAI Vision é acessível em volume
✅ **Rápido** - Análise técnica local não requer API

---

## 8. Próximos Passos

1. ✅ Design validado
2. ⏳ Criar plano de implementação detalhado
3. ⏳ Implementar validação técnica
4. ⏳ Implementar integração OpenAI
5. ⏳ Criar rotas API e integração Prisma
6. ⏳ Testes e refinamento
7. ⏳ Dashboard de análise para revisão manual
