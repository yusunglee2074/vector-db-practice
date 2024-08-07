require("dotenv").config();
const { Pinecone } = require("@pinecone-database/pinecone");
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

async function createEmbedding(text) {
  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: text,
  });
  return response.data[0].embedding;
}

async function upsertVector(index, id, vector, metadata) {
  await index.upsert([
    {
      id,
      values: vector,
      metadata,
    },
  ]);
}

async function queryVector(index, vector, topK = 1) {
  const queryResponse = await index.query({
    vector,
    topK,
    includeMetadata: true,
  });
  return queryResponse.matches;
}

async function main() {
  const index = pinecone.Index("example-index");

  // Example data
  const documents = [
    { id: "1", text: "The quick brown fox jumps over the lazy dog" },
    {
      id: "2",
      text: "A journey of a thousand miles begins with a single step",
    },
    { id: "3", text: "To be or not to be, that is the question" },
  ];

  // Upsert vectors
  for (const doc of documents) {
    const vector = await createEmbedding(doc.text);
    await upsertVector(index, doc.id, vector, { text: doc.text });
    console.log(`Upserted document ${doc.id}`);
  }

  // Query example
  const queryText = "What did the fox do?";
  const queryEmbedding = await createEmbedding(queryText);
  const results = await queryVector(index, queryEmbedding, 2);

  console.log("Query results:");
  results.forEach((result, i) => {
    console.log(`${i + 1}. ${result.metadata.text} (Score: ${result.score})`);
  });
}

main().catch(console.error);
