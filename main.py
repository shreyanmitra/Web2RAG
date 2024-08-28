#Part of this taken from https://blog.lancedb.com/create-llm-apps-using-rag/
import os
import time
import lancedb
from langchain_community.vectorstores import LanceDB

from langchain_community.llms import HuggingFaceHub
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import LanceDB
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.document_loaders import WebBaseLoader, PyPDFLoader, DirectoryLoader
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
import gradio as gr

def configureHFToken(token):
	os.environ["HUGGINGFACEHUB_API_TOKEN"] = token

def createChatbot(website, model):
	# Loading the web URL and breaking down the information into chunks

	if isinstance(website, str):
		loader = WebBaseLoader(website)
		docs = loader.load()
	else:
		docs = WebBaseLoader("https://www.google.com")
		for elem in website:
			loader = WebBaseLoader(website)
			docs = docs + loader.load()

	# Specify chunk size and overlap
	chunk_size = 256
	chunk_overlap = 20
	text_splitter = RecursiveCharacterTextSplitter(chunk_size=chunk_size, chunk_overlap=chunk_overlap)
	chunks = text_splitter.split_documents(docs)

	# Specify Embedding Model
	embedding_model_name = 'sentence-transformers/all-MiniLM-L6-v2'
	embeddings = HuggingFaceEmbeddings(model_name=embedding_model_name, model_kwargs={'device': 'cpu'})

	# Specify Vector Database
	database_name = "LanceDB"
	db = lancedb.connect("src/lance_database")
	table = db.create_table(
		"rag_sample",
		data=[
	    	{
	        	"vector": embeddings.embed_query("Hello World"),
	        	"text": "Hello World",
	        	"id": "1",
	    	}
		],
		mode="overwrite",
	)
	docsearch = LanceDB.from_documents(chunks, embeddings, connection=table)

	# Specify Retrieval Information
	search_kwargs = {"k": 3}
	retriever = docsearch.as_retriever(search_kwargs = {"k": 3})

	# Specify Model Architecture
	llm_repo_id = model
	model_kwargs = {"temperature": 0.5, "max_length": 4096, "max_new_tokens": 2048}
	model = HuggingFaceHub(repo_id=llm_repo_id, model_kwargs=model_kwargs)
	print(type(model))

	template = """
	{query}
	"""

	prompt = ChatPromptTemplate.from_template(template)

	rag_chain = (
		{"context": retriever, "query": RunnablePassthrough()}
		| prompt
		| model
		| StrOutputParser()
	)

	import gradio as gr

	def getResponse(message, history):
		return get_complete_sentence(rag_chain.invoke(message))

	with gr.Blocks() as interface:
		chatbot = gr.Chatbot(placeholder="Your Website's Personal Chatbot")
	    chatbot.like(vote, None, None)
	    gr.ChatInterface(fn=getResponse, chatbot=chatbot)

	interface.launch(share = True)
	return interface

def get_complete_sentence(response):
	last_period_index = response.rfind('.')
	if last_period_index != -1:
    	return response[:last_period_index + 1]
	else:
    	return response
