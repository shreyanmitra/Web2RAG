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
import warnings

class Hub:
    def __init__(self):
        self.rag_chain = None

    def getChatbot(self, openai_api_key, baseURLs, expandBases = True, sitemaps = "sitemap.xml"):
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
        self.rag_chain = (
            {"context": retriever | format_docs, "question": RunnablePassthrough()}
            | prompt
            | llm
            | StrOutputParser()
        )

    def answer(self, prompt):
        if not self.rag_chain:
            raise NotImplementedError("Must call getChatbot first before answer.")
        return self.rag_chain.invoke(prompt)

    def launch(self, openai_api_key = None, baseURLs = None, expandBases = True, sitemaps = "sitemap.xml"):
        if not self.rag_chain:
            self.getChatbot(openai_api_key, baseURLs, expandBases, sitemaps)
        warnings.filterwarnings("ignore")
        with gr.Blocks(title = "WebAssistant", css="footer {display:none !important}") as interface:
            gr.Markdown("# Welcome To WebAssistant ⛑️ ")
            chatbot = gr.Chatbot()
            gr.ChatInterface(fn=self.answer, chatbot=chatbot)
            gr.Markdown("🦾 Generated using ``shreyanmitra/WebAssistant``")

        interface.launch(share = True, debug = True)

    def deployReactExpressApp(self, openai_api_key, baseURL, rootDir):
        #expandBases is always True, and we don't need the sitemap
        import os
        bashCommand1 = "cd " + rootDir + " && git clone -b branchname --depth 1 --single-branch https://github.com/shreyanmitra/WebAssistant.git"
        os.system(bashCommand1)
        with open("WebAssistant/AppTemplate/server/.env", "w") as file:
            file.write("OPENAI_API_KEY=" + openai_api_key + "\nURL=" + baseURL)
        bashCommand2 =  "rm -rf WebAssistant/.git/ && rm-rf WebAssistant/WebAssistant/ && rm -rf WebAssistant/.github/ && rm-rf WebAssistant/.gitignore && rm-rf WebAssistant/setup.py && rm-rf WebAssistant/*.md && cd WebAssistant/AppTemplate && cd client && npm install --no-audit && npm run build && npm run start && cd .. && cd server && npm install --no-audit && npm run build && npm run start"
        os.system(bashCommand2)
        print("App deployed to localhost:8080")
