import type {
  CollectionItem,
  DocumentItem,

  SearchHit,
  SourceItem,
} from './types'

export const SOURCES: SourceItem[] = [
  {
    id: 's1',
    number: 1,
    title: 'RAG: From Retrieval to Generation.pdf',
    page: 3,
    chunk: 12,
    iconTone: 'red',
    excerpt:
      'RAG retrieves relevant passages first, then conditions generation on those passages so answers stay grounded in an external corpus rather than parametric memory alone.',
  },
  {
    id: 's2',
    number: 2,
    title: 'Learning to Retrieve Information.pdf',
    page: 7,
    chunk: 28,
    iconTone: 'purple',
    excerpt:
      'Dense retrievers map queries and documents into a shared embedding space, ranking chunks by semantic similarity instead of lexical overlap.',
  },
  {
    id: 's3',
    number: 3,
    title: 'Atlas: Few-shot Learning with Retrieval.pdf',
    page: 11,
    chunk: 42,
    iconTone: 'teal',
    excerpt:
      'Retrieved evidence is concatenated with the user query as context augmentation, giving the generator explicit support for each claim.',
  },
  {
    id: 's4',
    number: 4,
    title: 'Dense Passage Retrieval Survey.pdf',
    page: 5,
    chunk: 18,
    iconTone: 'gray',
    excerpt:
      'Source attribution maps generated sentences back to page-level and chunk-level evidence so users can inspect and verify the answer.',
  },
]

export const PRINCIPLES = [
  {
    n: 1,
    title: 'Retrieval First',
    body: 'Before generating text, the system searches the document index for passages most relevant to the query.',
  },
  {
    n: 2,
    title: 'Context Augmentation',
    body: 'Retrieved passages are injected into the model prompt so generation is grounded in evidence rather than parametric memory alone.',
  },
  {
    n: 3,
    title: 'Generative Response',
    body: 'The language model synthesizes a fluent answer using both the user question and the retrieved context.',
  },
  {
    n: 4,
    title: 'Source Attribution',
    body: 'Answers remain traceable to specific documents, pages, and chunks so users can verify each claim.',
  },
]

export const DOCUMENTS: DocumentItem[] = [
  {
    id: 'd1',
    name: 'RAG: From Retrieval to Generation.pdf',
    pages: 18,
    chunks: 142,
    size: '2.1 MB',
    collection: 'RAG Research',
    uploaded: '12 Aug 2026',
  },
  {
    id: 'd2',
    name: 'Learning to Retrieve Information.pdf',
    pages: 24,
    chunks: 188,
    size: '3.4 MB',
    collection: 'RAG Research',
    uploaded: '14 Aug 2026',
  },
  {
    id: 'd3',
    name: 'Atlas: Few-shot Learning with Retrieval.pdf',
    pages: 16,
    chunks: 121,
    size: '1.8 MB',
    collection: 'RAG Research',
    uploaded: '18 Aug 2026',
  },
  {
    id: 'd4',
    name: 'Dense Passage Retrieval Survey.pdf',
    pages: 42,
    chunks: 310,
    size: '5.6 MB',
    collection: 'RAG Research',
    uploaded: '22 Aug 2026',
  },
  {
    id: 'd5',
    name: 'Lecture Notes — Information Retrieval.pdf',
    pages: 64,
    chunks: 480,
    size: '8.2 MB',
    collection: 'Course Notes',
    uploaded: '01 Sep 2026',
  },
]

export const COLLECTIONS: CollectionItem[] = [
  {
    id: 'c1',
    name: 'RAG Research',
    documents: 8,
    description: 'Papers on retrieval, ranking, and grounded generation.',
  },
  {
    id: 'c2',
    name: 'Course Notes',
    documents: 12,
    description: 'Lecture slides and reading packets for the current term.',
  },
  {
    id: 'c3',
    name: 'Capstone Specs',
    documents: 4,
    description: 'Project synopsis, UI specification, and architecture notes.',
  },
]

export const HISTORY = [
  {
    id: 'h1',
    title: 'Key principles behind Retrieval-Augmented Generation',
    collection: 'RAG Research',
    time: 'Today, 10:42 PM',
    sources: 4,
  },
  {
    id: 'h2',
    title: 'How dense passage retrieval differs from BM25',
    collection: 'RAG Research',
    time: 'Yesterday, 6:18 PM',
    sources: 6,
  },
  {
    id: 'h3',
    title: 'Summarize the Atlas few-shot retrieval setup',
    collection: 'RAG Research',
    time: '1 Sep 2026',
    sources: 3,
  },
]

export const SEARCH_INDEX: SearchHit[] = [
  ...DOCUMENTS.map((d) => ({
    id: d.id,
    kind: 'Document' as const,
    title: d.name,
    meta: `${d.collection} · ${d.pages} pages`,
  })),
  ...COLLECTIONS.map((c) => ({
    id: c.id,
    kind: 'Collection' as const,
    title: c.name,
    meta: `${c.documents} documents`,
  })),
  ...HISTORY.map((h) => ({
    id: h.id,
    kind: 'Conversation' as const,
    title: h.title,
    meta: h.time,
  })),
]

export const MODELS = ['openai/gpt-oss-20b', 'openai/gpt-oss-120b']

export const SOURCE_COUNTS = [4, 6, 8, 10, 12, 16]

export const LANGUAGES = ['English', 'Hindi', 'Marathi', 'Spanish', 'French', 'German']
