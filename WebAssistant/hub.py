import gradio as gr
from langchain import hub
from langchain_chroma import Chroma
from langchain_community.document_loaders import WebBaseLoader
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from langchain_openai import OpenAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import ChatOpenAI
import pandas as pd
import xmltodict
import urllib3
import certifi

class WebAssistant:
    def __init__(self):
        self.rag_chain = None

    def getChatbot(openai_api_key, baseURLs, expandBases = True, sitemaps = "sitemap.xml"):
        print("For security reasons we do not store your OpenAI API key. You will need to reauthenticate for each use of the API.")

        llm = ChatOpenAI(
            model="gpt-4o",
            api_key=openai_api_key,
        )
        allWebsites = baseURLs if (isinstance(baseURLs, list)) else [baseURLs]
        if expandBases:
            for i in range(len(baseURLs)):
                url = baseURLs[i] if (isinstance(baseURLs, list) and len(baseURLs) > 1) else baseURLs
                sitemap = sitemaps[i] if (isinstance(sitemaps, list) and len(sitemaps) > 1) else sitemaps
                path = url + "/" + sitemap
                https = urllib3.PoolManager(cert_reqs="CERT_REQUIRED",
                    ca_certs=certifi.where())
                response = https.request('GET', path)
                xml = xmltodict.parse(response.data)
                allWebsites += list((pd.DataFrame.from_dict(xml['urlset']['url']))['loc'])


        loader = WebBaseLoader(
            web_paths=allWebsites,
        )
        docs = loader.load()
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        splits = text_splitter.split_documents(docs)
        vectorstore = Chroma.from_documents(documents=splits, embedding=OpenAIEmbeddings(openai_api_key = openai_api_key))
        retriever = vectorstore.as_retriever()
        prompt = hub.pull("rlm/rag-prompt")
        def format_docs(docs):
            return "\n\n".join(doc.page_content for doc in docs)
        rag_chain = (
            {"context": retriever | format_docs, "question": RunnablePassthrough()}
            | prompt
            | llm
            | StrOutputParser()
        )
        return rag_chain

    def answer(self, prompt):
        if not self.rag_chain:
            raise NotImplementedError("Must call getChatbot first before answer.")
        return self.rag_chain.invoke(prompt)

    @classmethod
    def getEmbedHTML(cls, openai_api_key, baseURLs, expandBases = True, sitemaps = "sitemap.xml"):

        html = '''<html>
        	<head>
        		<script type="module" crossorigin src="https://cdn.jsdelivr.net/npm/@gradio/lite/dist/lite.js"></script>
        		<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@gradio/lite/dist/lite.css" />
        	</head>
        	<body>
                <gradio-requirements>
                WebAssistant
                gradio
                </gradio-requirement>
        		<gradio-lite>
        		import gradio as gr
                from WebAssistant import*

                assistant = WebAssistant().getChatbot(openai_api_key=''' + openai_api_key + ", baseURLs=" + str(baseURLs) + ", expandBases=" + str(expandBases) + ", sitemaps=" + str(sitemaps) + ''')

                def answer(message, history):
                    return assistant.answer(message)

        		with gr.Blocks() as interface:
                    gr.Markdown("# Welcome To WebAssistant")
                    chatbot = gr.Chatbot()
                    gr.ChatInterface(fn=answer, chatbot=chatbot)
                    gr.Markdown("Generated using ``shreyanmitra/WebAssistant``")

                interface.launch()
        		</gradio-lite>
        	</body>
        </html>'''
        return html
