import sys
import glob
from pathlib import Path
import argparse

from langchain_community.document_loaders import PyPDFLoader
from pathlib import Path
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_ollama import OllamaEmbeddings
from langchain_qdrant import QdrantVectorStore


def find_pdfs(inputs):
    if isinstance(inputs, (str, Path)):
        inputs = [str(inputs)]
    pdfs = []
    for s in inputs:
        p = Path(s).expanduser()
        if p.is_dir():
            pdfs.extend(sorted(p.glob("*.pdf")))
        elif "*" in s or "?" in s:
            for m in glob.glob(s):
                mp = Path(m)
                if mp.is_file() and mp.suffix.lower() == '.pdf':
                    pdfs.append(mp)
        elif p.is_file() and p.suffix.lower() == '.pdf':
            pdfs.append(p)
        else:
            print(f'Skipping not found / not-pdf: {s}', file=sys.stderr)
        
    #deduplicating 
    seen = set()
    out = []

    for p in pdfs:
        rp = p.resolve()
        if rp not in seen:
            seen.add(rp)
            out.append(rp)
    return out

def load_all(pdfs):
    docs = []
    for pdf in pdfs:
        try:
            print("Loading ", pdf)
            loader = PyPDFLoader(str(pdf))
            loaded = loader.load()
            if not loaded:
                print(f"Warning: {pdf} loaded 0 pages (no extractable text).", file=sys.stderr)
            for d in loaded:
                d.metadata = d.metadata or {}
                d.metadata['source'] = str(pdf)
            docs.extend(loaded)
        except Exception as e:
            print(f"Error Loading {pdf}: {e}", file=sys.stderr)
    
    return docs


def chunk(doc_path, collection_name: str):
    # parser = argparse.ArgumentParser(description='Simple PDF to Qdrant indexer')
    # parser.add_argument("inputs", nargs="+", help="PDF files, directories, or glob patterns")
    # agrs = parser.parse_args()


    pdf_paths = find_pdfs(doc_path)
    if not pdf_paths:
        print("No PDFs found..", file=sys.stderr)
        sys.exit(1)
    
    docs = load_all(pdf_paths)
    print(f"Loaded {len(docs)} documents (pages). Splitting documents into chunks....")


    # Split the docs into smaller chunks
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size = 20000,
        chunk_overlap = 4000
    )

    chunks = text_splitter.split_documents(documents=docs)


    # Vector Embeddings
    embedding_model = OllamaEmbeddings(
        model='qwen3-embedding:0.6b',
        base_url='http://localhost:11434'
    )

    vector_store = QdrantVectorStore.from_documents(
        documents=chunks,
        embedding=embedding_model,
        url='http://localhost:6333',
        collection_name=collection_name,
    )   

    print("Indexing of documents done....")

    return {
        "stored": True,
        "chunks": len(chunks),
        "source": str(pdf_paths[0]),
        "collection_name": collection_name,
    }


# def main():
#     parser = argparse.ArgumentParser(description='Simple PDF to Qdrant indexer')
#     parser.add_argument("inputs", nargs="+", help="PDF files, directories, or glob patterns")
#     agrs = parser.parse_args()


#     pdf_paths = find_pdfs(agrs.inputs)
#     if not pdf_paths:
#         print("No PDFs found..", file=sys.stderr)
#         sys.exit(1)
    
#     docs = load_all(pdf_paths)
#     print(f"Loaded {len(docs)} documents (pages). Splitting documents into chunks....")


#     #Split the docs into smaller chunks
#     text_splitter = RecursiveCharacterTextSplitter(
#         chunk_size = 1000,
#         chunk_overlap = 400
#     )

#     chunks = text_splitter.split_documents(documents=docs)


#     # Vector Embeddings
#     embedding_model = OllamaEmbeddings(
#         model='nomic-embed-text',
#         base_url='http://localhost:11434'
#     )

#     vector_store = QdrantVectorStore.from_documents(
#         documents=chunks,
#         embedding=embedding_model,
#         url='http://localhost:6333',
#         collection_name = "edu-mate1"
#     )   

#     print("Indexing of documents done....")



# if __name__ == "__main__":
#     main()