import { Modulex } from 'modulex';
import { readFile } from 'fs/promises';

async function main() {
  const client = new Modulex({
    apiKey: process.env.MODULEX_API_KEY!,
    organizationId: process.env.MODULEX_ORG_ID!,
  });

  // Create a knowledge base
  const kb = await client.knowledge.create({
    name: 'Engineering Docs',
    description: 'Internal engineering documentation',
    embeddingConfig: {
      provider: 'openai',
      model: 'text-embedding-3-small',
      dimension: 1536,
    },
    chunkingConfig: {
      strategy: 'recursive',
      chunk_size: 1000,
      overlap: 200,
    },
  });
  console.log(`Created KB: ${kb.id}`);

  // Upload a document (Node.js)
  const buffer = await readFile('/path/to/document.pdf');
  const blob = new Blob([buffer], { type: 'application/pdf' });
  const doc = await client.knowledge.uploadDocument(kb.id, {
    file: blob,
    filename: 'document.pdf',
    metadata: { department: 'engineering', version: '2.0' },
  });
  console.log(`Uploaded: ${doc.filename} (${doc.status})`);

  // Check document processing status
  const status = await client.knowledge.documentStatus(kb.id, doc.id);
  console.log(`Processing: ${status.status}`);

  // Search the knowledge base
  const results = await client.knowledge.search(kb.id, {
    query: 'How does the deployment pipeline work?',
    topK: 5,
    minScore: 0.3,
  });
  console.log(`\nSearch results: ${results.total}`);
  for (const result of results.results) {
    console.log(`  Score: ${result.score} — ${result.content?.slice(0, 100)}...`);
  }

  // Hybrid search
  const hybridResults = await client.knowledge.hybridSearch(kb.id, {
    query: 'CI/CD pipeline setup',
    topK: 5,
    keywordWeight: 0.3,
    semanticWeight: 0.7,
  });
  console.log(`\nHybrid search results: ${hybridResults.total}`);

  // Retrieve context for RAG
  const context = await client.knowledge.retrieveContext(kb.id, {
    query: 'What are the deployment steps?',
    maxTokens: 2000,
    topK: 10,
  });
  console.log(`\nContext (${context.context.length} chars):\n${context.context.slice(0, 200)}...`);

  // List all knowledge bases
  const kbs = await client.knowledge.list();
  console.log(`\nKnowledge bases: ${kbs.total}`);

  // Check supported file types
  const fileTypes = await client.knowledge.supportedFileTypes();
  console.log(`Supported: ${fileTypes.supported_types.join(', ')}`);
  console.log(`Max file size: ${fileTypes.max_file_size_mb}MB`);
}

main();
